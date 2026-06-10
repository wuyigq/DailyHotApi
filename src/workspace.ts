import { Hono, type Context } from "hono";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import type { ListItem, RouterData } from "./types.js";

type WorkspacePreferences = {
  userId: string;
  keywords: string[];
  categories: string[];
  excludeWords: string[];
  sources: string[];
  tone: "balanced" | "sharp" | "casual" | "professional";
};

type WorkspaceTopic = ListItem & {
  source: string;
  sourceTitle: string;
  sourceType: string;
  score: number;
  matchedKeywords: string[];
  matchedCategories: string[];
  riskLevel: "low" | "medium" | "high";
};

type WorkspaceDraft = {
  id: string;
  userId: string;
  topic: WorkspaceTopic;
  platform: string;
  tone: WorkspacePreferences["tone"];
  content: string;
  reviewStatus?: "draft" | "reviewing" | "approved" | "rejected";
  reviewNote?: string;
  createdAt: string;
};

type WorkspacePersona = {
  userId: string;
  displayName: string;
  identity: string;
  voice: WorkspacePreferences["tone"];
  viewpoints: string[];
  forbiddenWords: string[];
  boundaries: string[];
};

type PublishCheckIssue = {
  level: "info" | "warning" | "error";
  message: string;
};

type PublishPackageLink = {
  label: string;
  url: string;
  mobileUrl?: string;
};

type PublishPackageFile = {
  filename: string;
  mimeType: string;
  content: string;
};

type PublishPackage = {
  draftId: string;
  platform: string;
  platformName: string;
  title: string;
  content: string;
  hashtags: string[];
  copyText: string;
  mobileShareText: string;
  checklist: string[];
  deeplinks: PublishPackageLink[];
  files: PublishPackageFile[];
};

type PublishRecord = {
  id: string;
  userId: string;
  draftId: string;
  platform: string;
  status: "assisted" | "published" | "failed";
  metrics?: PublishMetrics;
  publishUrl?: string;
  note?: string;
  createdAt: string;
};

type PublishMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  leads: number;
};

type AuditLog = {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: Record<string, unknown>;
  createdAt: string;
};

type WorkspaceUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
};

type WorkspaceStore = {
  users?: Record<string, WorkspaceUser>;
  preferences: Record<string, WorkspacePreferences>;
  personas?: Record<string, WorkspacePersona>;
  drafts: WorkspaceDraft[];
  publishRecords?: PublishRecord[];
  auditLogs?: AuditLog[];
};

const app = new Hono();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../data/workspace.json");

const defaultPreferences = (userId: string): WorkspacePreferences => ({
  userId,
  keywords: ["NBA", "周杰伦", "AI"],
  categories: ["体育", "娱乐", "科技"],
  excludeWords: [],
  sources: ["weibo", "zhihu", "bilibili", "douyin", "toutiao", "ithome"],
  tone: "balanced",
});

const defaultPersona = (userId: string): WorkspacePersona => ({
  userId,
  displayName: "本地创作者",
  identity: "关注热点、保持克制表达的内容创作者",
  voice: "balanced",
  viewpoints: ["先核实来源，再表达观点", "不为了流量牺牲事实边界"],
  forbiddenWords: [],
  boundaries: ["不攻击个人", "不编造事实", "高风险话题保留来源"],
});

const categoryWords: Record<string, string[]> = {
  体育: ["nba", "篮球", "足球", "体育", "比赛", "联赛", "湖人", "勇士"],
  娱乐: ["周杰伦", "明星", "电影", "音乐", "演唱会", "综艺", "票房"],
  科技: ["ai", "人工智能", "模型", "科技", "芯片", "手机", "软件", "开源"],
  财经: ["股票", "基金", "经济", "融资", "上市", "财报", "市场"],
  政治: ["政策", "政府", "外交", "选举", "议会", "总统"],
  军事: ["军事", "军方", "导弹", "舰", "战机", "防务"],
  游戏: ["游戏", "原神", "星穹铁道", "lol", "steam"],
  社会: ["警方", "法院", "事故", "通报", "民生", "社会"],
};

const highRiskWords = ["政治", "军事", "外交", "战争", "冲突", "事故", "通报", "警方"];
const defaultSources = ["weibo", "zhihu", "bilibili", "douyin", "toutiao", "ithome"];

const normalizeWords = (words: unknown): string[] => {
  if (!Array.isArray(words)) return [];
  return words.map((word) => String(word).trim()).filter(Boolean);
};

const getUserId = (c: Context) =>
  c.req.header("x-user-id") || c.req.query("userId") || "local-user";

const normalizeStore = (store: WorkspaceStore): Required<WorkspaceStore> => ({
  users: store.users || {},
  preferences: store.preferences || {},
  personas: store.personas || {},
  drafts: store.drafts || [],
  publishRecords: store.publishRecords || [],
  auditLogs: store.auditLogs || [],
});

const readStore = (): Required<WorkspaceStore> => {
  if (!fs.existsSync(storePath)) {
    return { users: {}, preferences: {}, personas: {}, drafts: [], publishRecords: [], auditLogs: [] };
  }
  return normalizeStore(JSON.parse(fs.readFileSync(storePath, "utf-8")) as WorkspaceStore);
};

const writeStore = (store: WorkspaceStore) => {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(normalizeStore(store), null, 2));
};

const getPreferences = (userId: string) => {
  const store = readStore();
  return store.preferences[userId] || defaultPreferences(userId);
};

const savePreferences = (preferences: WorkspacePreferences) => {
  const store = readStore();
  store.preferences[preferences.userId] = preferences;
  writeStore(store);
  return preferences;
};

const getPersona = (userId: string) => {
  const store = readStore();
  return store.personas[userId] || defaultPersona(userId);
};

const savePersona = (persona: WorkspacePersona) => {
  const store = readStore();
  store.personas[persona.userId] = persona;
  writeStore(store);
  return persona;
};

const addAuditLog = (
  store: Required<WorkspaceStore>,
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: Record<string, unknown>,
) => {
  store.auditLogs.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    action,
    targetType,
    targetId,
    detail,
    createdAt: new Date().toISOString(),
  });
};

const createUserId = (email: string) =>
  `user-${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)}`;

const upsertUser = (email: string, name?: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const id = createUserId(normalizedEmail);
  const store = readStore();
  const existingUser = store.users[id];
  const user: WorkspaceUser = {
    id,
    email: normalizedEmail,
    name: name?.trim() || existingUser?.name || normalizedEmail.split("@")[0],
    createdAt: existingUser?.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  store.users[id] = user;
  addAuditLog(store, id, "user.login", "user", id, { email: normalizedEmail });
  writeStore(store);
  return user;
};

const createRouteContext = (params: Record<string, string> = {}) => ({
  req: {
    query: (key: string) => params[key],
  },
});

const fetchSource = async (source: string, noCache: boolean): Promise<RouterData | null> => {
  try {
    const { handleRoute } = await import(`./routes/${source}.js`);
    return await handleRoute(createRouteContext() as never, noCache);
  } catch {
    return null;
  }
};

const includesAny = (content: string, words: string[]) => {
  const normalized = content.toLowerCase();
  return words.filter((word) => normalized.includes(word.toLowerCase()));
};

const scoreTopic = (
  item: ListItem,
  source: RouterData,
  preferences: WorkspacePreferences,
): WorkspaceTopic | null => {
  const content = `${item.title || ""} ${item.desc || ""} ${source.title || ""} ${source.type || ""}`;
  const matchedKeywords = includesAny(content, preferences.keywords);
  const expandedCategoryWords = preferences.categories.flatMap((category) => categoryWords[category] || [category]);
  const matchedCategoryWords = includesAny(content, expandedCategoryWords);
  const matchedCategories = preferences.categories.filter((category) =>
    matchedCategoryWords.some((word) => (categoryWords[category] || [category]).includes(word)),
  );
  const excluded = includesAny(content, preferences.excludeWords);

  if (excluded.length > 0) return null;
  if (preferences.keywords.length > 0 || preferences.categories.length > 0) {
    if (matchedKeywords.length === 0 && matchedCategoryWords.length === 0) return null;
  }

  const hotValue = Number(String(item.hot || 0).replace(/[^\d.]/g, "")) || 0;
  const score = matchedKeywords.length * 20 + matchedCategoryWords.length * 10 + Math.min(hotValue / 100000, 20);
  const riskLevel = includesAny(content, highRiskWords).length > 0 ? "high" : matchedCategories.length ? "medium" : "low";

  return {
    ...item,
    source: source.name,
    sourceTitle: source.title,
    sourceType: source.type,
    score: Math.round(score),
    matchedKeywords,
    matchedCategories,
    riskLevel,
  };
};

const buildDraft = (
  topic: WorkspaceTopic,
  platform: string,
  tone: WorkspacePreferences["tone"],
  persona?: WorkspacePersona,
): string => {
  const toneLabel = {
    balanced: "克制理性",
    sharp: "观点鲜明",
    casual: "轻松口语",
    professional: "专业分析",
  }[tone];
  const sourceUrl = topic.mobileUrl || topic.url || "";
  const riskNotice =
    topic.riskLevel === "high"
      ? "\n\n发布前提示：该话题风险较高，建议补充可靠来源，避免事实未核实的判断。"
      : "";
  const personaLine = persona
    ? `\n\n人设约束：以「${persona.identity}」身份表达，遵守 ${persona.boundaries.join("、") || "事实优先"}。`
    : "";
  const viewpointLine = persona?.viewpoints?.length
    ? `\n可用观点：${persona.viewpoints.slice(0, 3).join("；")}。`
    : "";

  if (platform === "xiaohongshu") {
    return `标题：${topic.title}，这件事值得关注\n\n正文：\n今天刷到一个热点：${topic.title}。\n\n我的角度是：先别急着站队，可以从事件本身、参与方动机和后续影响三个层面看。对普通人来说，更重要的是它会不会改变我们的消费、工作或生活判断。${viewpointLine}${personaLine}\n\n适合讨论的问题：你更关注这件事的哪一面？\n\n#热点观察 #${toneLabel}表达 #今日话题\n\n来源：${topic.sourceTitle} ${sourceUrl}${riskNotice}`;
  }

  if (platform === "video") {
    return `口播标题：${topic.title}\n\n开场 3 秒：今天这个热点很适合聊，但不要只看热闹。\n\n主体结构：\n1. 先用一句话讲清楚事件：${topic.title}。\n2. 解释它为什么会冲上热榜：热度来自 ${topic.sourceTitle}，并且和 ${[...topic.matchedKeywords, ...topic.matchedCategories].join("、") || "大众讨论"} 有关。\n3. 给出你的观点：我的判断是，真正值得关注的是后续影响，而不是情绪化转发。${viewpointLine}${personaLine}\n4. 留一个互动问题：你觉得这件事会持续发酵吗？\n\n字幕关键词：热点、观点、影响、讨论\n来源：${sourceUrl}${riskNotice}`;
  }

  return `看到一个热榜话题：${topic.title}。\n\n我的看法是，先把事实和情绪分开。能上热榜说明它击中了大众关注点，但是否值得跟进，还要看来源、后续进展和它跟我们的关系。${viewpointLine}${personaLine}\n\n如果要发动态，我会用 ${toneLabel} 的方式表达：不抢结论，先给信息，再给观点，最后留讨论空间。\n\n来源：${topic.sourceTitle} ${sourceUrl}${riskNotice}`;
};

const platformLimits: Record<string, number> = {
  weibo: 2000,
  xiaohongshu: 1000,
  video: 1200,
};

const platformNames: Record<string, string> = {
  weibo: "微博短评",
  xiaohongshu: "小红书笔记",
  video: "视频口播",
};

const extractTitle = (content: string, fallback: string) => {
  const matched = content.match(/^(标题|口播标题)：(.+)$/m);
  return matched?.[2]?.trim() || fallback;
};

const uniqueTags = (words: string[]) =>
  Array.from(
    new Set(
      words
        .map((word) => String(word).replace(/^#/, "").trim())
        .filter(Boolean)
        .slice(0, 8),
    ),
  );

const buildPublishPackage = (draft: WorkspaceDraft): PublishPackage => {
  const topic = draft.topic;
  const title = extractTitle(draft.content, topic.title);
  const hashtags = uniqueTags([
    ...topic.matchedCategories,
    ...topic.matchedKeywords,
    "热点观察",
    draft.platform === "video" ? "口播脚本" : "今日话题",
  ]);
  const tagText = hashtags.map((tag) => `#${tag}`).join(" ");
  const sourceLine = topic.url ? `\n\n原始来源：${topic.url}` : "";
  const riskLine = topic.riskLevel === "high" ? "\n\n发布提醒：高风险热点，请先二次核实来源。" : "";

  if (draft.platform === "xiaohongshu") {
    const copyText = `${title}\n\n${draft.content}\n\n${tagText}${sourceLine}${riskLine}`;
    return {
      draftId: draft.id,
      platform: draft.platform,
      platformName: platformNames[draft.platform],
      title,
      content: draft.content,
      hashtags,
      copyText,
      mobileShareText: copyText,
      checklist: [
        "首图或配图需与正文一致，避免标题党。",
        "正文保留来源说明，高风险内容先人工复核。",
        "发布前确认标签数量和平台敏感词提示。",
      ],
      deeplinks: [
        { label: "打开小红书", url: "https://www.xiaohongshu.com/", mobileUrl: "https://www.xiaohongshu.com/" },
      ],
      files: [
        { filename: `${draft.id}-xiaohongshu.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
      ],
    };
  }

  if (draft.platform === "video") {
    const subtitleText = draft.content
      .split(/\n+/)
      .filter((line) => line.trim() && !line.startsWith("来源："))
      .join("\n");
    return {
      draftId: draft.id,
      platform: draft.platform,
      platformName: platformNames[draft.platform],
      title,
      content: draft.content,
      hashtags,
      copyText: `${title}\n\n${draft.content}\n\n${tagText}${sourceLine}${riskLine}`,
      mobileShareText: `${title}\n\n${draft.content}`,
      checklist: [
        "录制前确认口播中的事实和来源。",
        "字幕、标题、封面保持一致，不夸大结论。",
        "发布后回填曝光、点赞、评论、转发等指标。",
      ],
      deeplinks: [
        { label: "打开抖音网页版", url: "https://www.douyin.com/" },
        { label: "打开哔哩哔哩投稿", url: "https://member.bilibili.com/platform/upload/video/frame" },
      ],
      files: [
        { filename: `${draft.id}-script.txt`, mimeType: "text/plain;charset=utf-8", content: draft.content },
        { filename: `${draft.id}-subtitle.txt`, mimeType: "text/plain;charset=utf-8", content: subtitleText },
      ],
    };
  }

  const copyText = `${draft.content}\n\n${tagText}${sourceLine}${riskLine}`;
  return {
    draftId: draft.id,
    platform: draft.platform,
    platformName: platformNames[draft.platform] || draft.platform,
    title,
    content: draft.content,
    hashtags,
    copyText,
    mobileShareText: copyText,
    checklist: [
      "先复制文案，再跳转平台手动确认发布。",
      "高风险热点避免绝对化表达，保留来源。",
      "发布完成后回到工作台记录发布动作。",
    ],
    deeplinks: [
      { label: "打开微博", url: "https://weibo.com/", mobileUrl: "https://m.weibo.cn/" },
    ],
    files: [
      { filename: `${draft.id}-weibo.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
    ],
  };
};

const checkDraft = (draft: WorkspaceDraft, content: string, persona: WorkspacePersona) => {
  const issues: PublishCheckIssue[] = [];
  const limit = platformLimits[draft.platform] || 2000;
  const forbiddenHits = includesAny(content, persona.forbiddenWords);

  if (!content.includes("来源：")) {
    issues.push({ level: "error", message: "缺少来源标注，发布前需要保留热点来源。" });
  }
  if (draft.topic.riskLevel === "high") {
    issues.push({ level: "warning", message: "该热点为高风险话题，建议二次核实并避免绝对化判断。" });
  }
  if (forbiddenHits.length > 0) {
    issues.push({ level: "error", message: `命中人设禁用表达：${forbiddenHits.join("、")}` });
  }
  if (content.length > limit) {
    issues.push({ level: "warning", message: `当前内容 ${content.length} 字，超过 ${draft.platform} 建议长度 ${limit} 字。` });
  }
  if (!content.includes("AI") && !content.includes("辅助生成")) {
    issues.push({ level: "info", message: "建议按平台规则保留 AI 辅助生成标识。" });
  }

  return {
    passed: issues.every((issue) => issue.level !== "error"),
    issues,
    suggestions: [
      "发布前保留来源链接或来源说明。",
      "高风险话题优先使用克制语气，避免未经核实的事实判断。",
      "手机端建议先复制草稿，再跳转平台 App 手动确认发布。",
    ],
    limit,
    length: content.length,
  };
};

app.post("/auth/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = String(body.email || "").trim();
  const name = body.name ? String(body.name) : undefined;
  if (!email || !email.includes("@")) {
    return c.json({ code: 400, message: "Valid email is required" }, 400);
  }
  const user = upsertUser(email, name);
  return c.json({ code: 200, data: user });
});

app.get("/auth/me", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  const user = store.users[userId] || {
    id: userId,
    email: "",
    name: userId === "local-user" ? "本地默认用户" : userId,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  return c.json({ code: 200, data: user });
});

app.get("/preferences", (c) => {
  const userId = getUserId(c);
  return c.json({ code: 200, data: getPreferences(userId) });
});

app.put("/preferences", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const preferences = savePreferences({
    userId,
    keywords: normalizeWords(body.keywords),
    categories: normalizeWords(body.categories),
    excludeWords: normalizeWords(body.excludeWords),
    sources: normalizeWords(body.sources).length ? normalizeWords(body.sources) : defaultSources,
    tone: ["balanced", "sharp", "casual", "professional"].includes(body.tone) ? body.tone : "balanced",
  });
  const store = readStore();
  addAuditLog(store, userId, "preferences.updated", "preferences", userId, {
    keywords: preferences.keywords,
    categories: preferences.categories,
  });
  writeStore(store);
  return c.json({ code: 200, data: preferences });
});

app.get("/persona", (c) => {
  const userId = getUserId(c);
  return c.json({ code: 200, data: getPersona(userId) });
});

app.put("/persona", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const persona = savePersona({
    userId,
    displayName: String(body.displayName || "本地创作者"),
    identity: String(body.identity || "关注热点、保持克制表达的内容创作者"),
    voice: ["balanced", "sharp", "casual", "professional"].includes(body.voice)
      ? body.voice
      : "balanced",
    viewpoints: normalizeWords(body.viewpoints),
    forbiddenWords: normalizeWords(body.forbiddenWords),
    boundaries: normalizeWords(body.boundaries),
  });
  const store = readStore();
  addAuditLog(store, userId, "persona.updated", "persona", userId, {
    displayName: persona.displayName,
    forbiddenWords: persona.forbiddenWords,
  });
  writeStore(store);
  return c.json({ code: 200, data: persona });
});

app.get("/feed", async (c) => {
  const userId = getUserId(c);
  const preferences = getPreferences(userId);
  const noCache = c.req.query("cache") === "false";
  const limit = Number(c.req.query("limit") || 60);
  const sources = preferences.sources.length ? preferences.sources : defaultSources;
  const sourceData = await Promise.all(sources.map((source) => fetchSource(source, noCache)));
  const topics = sourceData
    .filter((source): source is RouterData => Boolean(source))
    .flatMap((source) => source.data.map((item) => scoreTopic(item, source, preferences)))
    .filter((topic): topic is WorkspaceTopic => Boolean(topic))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return c.json({
    code: 200,
    total: topics.length,
    preferences,
    data: topics,
    updateTime: new Date().toISOString(),
  });
});

app.get("/drafts", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  return c.json({
    code: 200,
    data: store.drafts.filter((draft) => draft.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

app.patch("/drafts/:id/review", async (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const status = ["draft", "reviewing", "approved", "rejected"].includes(body.reviewStatus)
    ? body.reviewStatus
    : "reviewing";
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  draft.reviewStatus = status;
  draft.reviewNote = body.reviewNote ? String(body.reviewNote) : undefined;
  addAuditLog(store, userId, "draft.reviewed", "draft", draft.id, {
    reviewStatus: draft.reviewStatus,
    reviewNote: draft.reviewNote,
  });
  writeStore(store);

  return c.json({ code: 200, data: draft });
});

app.post("/drafts/:id/check", async (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  const content = String(body.content || draft.content);
  const checkResult = checkDraft(draft, content, getPersona(userId));
  addAuditLog(store, userId, "draft.checked", "draft", draft.id, {
    passed: checkResult.passed,
    issueCount: checkResult.issues.length,
  });
  writeStore(store);
  return c.json({ code: 200, data: checkResult });
});

app.get("/drafts/:id/publish-package", (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  const publishPackage = buildPublishPackage(draft);
  addAuditLog(store, userId, "publish.package.generated", "draft", draft.id, {
    platform: draft.platform,
    fileCount: publishPackage.files.length,
  });
  writeStore(store);

  return c.json({ code: 200, data: publishPackage });
});

app.get("/publish-records", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  return c.json({
    code: 200,
    data: store.publishRecords
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

app.post("/publish-records", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === body.draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  const record: PublishRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    draftId: draft.id,
    platform: String(body.platform || draft.platform),
    status: ["assisted", "published", "failed"].includes(body.status) ? body.status : "assisted",
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      leads: 0,
    },
    publishUrl: body.publishUrl ? String(body.publishUrl) : undefined,
    note: body.note ? String(body.note) : "已复制/分享到平台，等待用户手动确认发布。",
    createdAt: new Date().toISOString(),
  };
  store.publishRecords.push(record);
  addAuditLog(store, userId, "publish.recorded", "publishRecord", record.id, {
    draftId: draft.id,
    platform: record.platform,
    status: record.status,
  });
  writeStore(store);

  return c.json({ code: 200, data: record });
});

app.patch("/publish-records/:id/metrics", async (c) => {
  const userId = getUserId(c);
  const recordId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const record = store.publishRecords.find((item) => item.id === recordId && item.userId === userId);
  if (!record) return c.json({ code: 404, message: "Publish record not found" }, 404);

  record.metrics = {
    views: Number(body.views || 0),
    likes: Number(body.likes || 0),
    comments: Number(body.comments || 0),
    shares: Number(body.shares || 0),
    leads: Number(body.leads || 0),
  };
  record.status = ["assisted", "published", "failed"].includes(body.status) ? body.status : record.status;
  addAuditLog(store, userId, "publish.metrics.updated", "publishRecord", record.id, {
    metrics: record.metrics,
    status: record.status,
  });
  writeStore(store);

  return c.json({ code: 200, data: record });
});

app.get("/overview", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  const drafts = store.drafts.filter((draft) => draft.userId === userId);
  const records = store.publishRecords.filter((record) => record.userId === userId);
  const totals = records.reduce(
    (acc, record) => {
      const metrics = record.metrics || { views: 0, likes: 0, comments: 0, shares: 0, leads: 0 };
      acc.views += metrics.views;
      acc.likes += metrics.likes;
      acc.comments += metrics.comments;
      acc.shares += metrics.shares;
      acc.leads += metrics.leads;
      return acc;
    },
    { views: 0, likes: 0, comments: 0, shares: 0, leads: 0 },
  );
  const reviewStatus = drafts.reduce<Record<string, number>>((acc, draft) => {
    const status = draft.reviewStatus || "draft";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return c.json({
    code: 200,
    data: {
      draftCount: drafts.length,
      publishCount: records.length,
      reviewStatus,
      totals,
      engagementRate: totals.views > 0 ? Number(((totals.likes + totals.comments + totals.shares) / totals.views).toFixed(4)) : 0,
      leadRate: totals.views > 0 ? Number((totals.leads / totals.views).toFixed(4)) : 0,
    },
  });
});

app.get("/audit-logs", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  return c.json({
    code: 200,
    data: store.auditLogs
      .filter((log) => log.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 100),
  });
});

app.post("/generate", async (c) => {
  const userId = getUserId(c);
  const preferences = getPreferences(userId);
  const persona = getPersona(userId);
  const body = await c.req.json().catch(() => ({}));
  const topic = body.topic as WorkspaceTopic | undefined;
  if (!topic?.title) return c.json({ code: 400, message: "Missing topic" }, 400);

  const platform = String(body.platform || "weibo");
  const tone = ["balanced", "sharp", "casual", "professional"].includes(body.tone)
    ? body.tone
    : preferences.tone;
  const draft: WorkspaceDraft = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    topic,
    platform,
    tone,
    content: buildDraft(topic, platform, tone, persona),
    reviewStatus: "draft",
    createdAt: new Date().toISOString(),
  };
  const store = readStore();
  store.drafts.push(draft);
  addAuditLog(store, userId, "draft.generated", "draft", draft.id, {
    platform,
    topicTitle: topic.title,
    riskLevel: topic.riskLevel,
  });
  writeStore(store);

  return c.json({ code: 200, data: draft });
});

export default app;
