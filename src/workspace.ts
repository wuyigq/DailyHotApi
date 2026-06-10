import { Hono, type Context } from "hono";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { config } from "./config.js";
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
  relatedSources?: Array<{
    source: string;
    sourceTitle: string;
    sourceType: string;
    url?: string;
    mobileUrl?: string;
    timestamp?: number;
  }>;
  firstSeenAt?: number;
  latestSeenAt?: number;
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
  generationMode?: "ai" | "template";
  generationProvider?: string;
  generationModel?: string;
  generationReason?: string;
  generationMetrics?: DraftGenerationMetrics;
  reviewStatus?: "draft" | "reviewing" | "approved" | "rejected";
  reviewNote?: string;
  archivedAt?: string;
  createdAt: string;
};

type DraftVersion = {
  id: string;
  userId: string;
  draftId: string;
  content: string;
  note: string;
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

type DraftGenerationResult = {
  content: string;
  mode: "ai" | "template";
  provider: string;
  model?: string;
  reason?: string;
  metrics: DraftGenerationMetrics;
};

type DraftGenerationMetrics = {
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
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

type MediaSuggestion = {
  coverTitle: string;
  imagePrompt: string;
  size: string;
  styleTips: string[];
  copyrightNotice: string;
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
  mediaSuggestion: MediaSuggestion;
  deeplinks: PublishPackageLink[];
  files: PublishPackageFile[];
};

type PublishRecord = {
  id: string;
  userId: string;
  draftId: string;
  platform: string;
  accountId?: string;
  accountName?: string;
  status: "assisted" | "published" | "failed";
  metrics?: PublishMetrics;
  publishUrl?: string;
  note?: string;
  createdAt: string;
};

type PublishSchedule = {
  id: string;
  userId: string;
  draftId: string;
  platform: string;
  accountId?: string;
  accountName?: string;
  scheduledAt: string;
  status: "pending" | "ready" | "published" | "skipped" | "failed";
  publishRecordId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

type PlatformAccount = {
  id: string;
  userId: string;
  platform: string;
  displayName: string;
  status?: "active" | "inactive";
  profileUrl?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
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
  draftVersions?: DraftVersion[];
  publishRecords?: PublishRecord[];
  publishSchedules?: PublishSchedule[];
  platformAccounts?: PlatformAccount[];
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
const defaultSources = ["weibo", "zhihu", "bilibili", "douyin", "toutiao", "ithome", "baidu", "qq-news", "sina-news", "thepaper"];
const aiLabel = "AI 辅助生成";

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
  draftVersions: store.draftVersions || [],
  publishRecords: store.publishRecords || [],
  publishSchedules: store.publishSchedules || [],
  platformAccounts: store.platformAccounts || [],
  auditLogs: store.auditLogs || [],
});

const readStore = (): Required<WorkspaceStore> => {
  if (!fs.existsSync(storePath)) {
    return {
      users: {},
      preferences: {},
      personas: {},
      drafts: [],
      draftVersions: [],
      publishRecords: [],
      publishSchedules: [],
      platformAccounts: [],
      auditLogs: [],
    };
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

const addDraftVersion = (
  store: Required<WorkspaceStore>,
  draft: WorkspaceDraft,
  note: string,
) => {
  const version: DraftVersion = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId: draft.userId,
    draftId: draft.id,
    content: draft.content,
    note,
    createdAt: new Date().toISOString(),
  };
  store.draftVersions.push(version);
  return version;
};

const createPublishRecord = (
  store: Required<WorkspaceStore>,
  draft: WorkspaceDraft,
  input: {
    platform?: string;
    accountId?: string;
    accountName?: string;
    status?: PublishRecord["status"];
    publishUrl?: string;
    note?: string;
  } = {},
) => {
  const record: PublishRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId: draft.userId,
    draftId: draft.id,
    platform: String(input.platform || draft.platform),
    accountId: input.accountId,
    accountName: input.accountName,
    status: input.status || "assisted",
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      leads: 0,
    },
    publishUrl: input.publishUrl,
    note: input.note || "已复制/分享到平台，等待用户手动确认发布。",
    createdAt: new Date().toISOString(),
  };
  store.publishRecords.push(record);
  return record;
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

const ensureAiLabel = (content: string) =>
  content.includes(aiLabel) ? content : `${content.trim()}\n\n${aiLabel}`;

const getPublishBlockReason = (draft: WorkspaceDraft) => {
  if (draft.topic.riskLevel === "high" && draft.reviewStatus !== "approved") {
    return "高风险草稿必须审核通过后才能生成发布包、加入计划或记录发布。";
  }
  return "";
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

const topicKey = (topic: WorkspaceTopic) =>
  topic.title
    .toLowerCase()
    .replace(/(官方|突发|热搜|最新|视频|组图|快讯|话题)/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .slice(0, 48);

const topicSimilarity = (left: string, right: string) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const minLength = Math.min(left.length, right.length);
  const maxLength = Math.max(left.length, right.length);
  if (minLength >= 12 && (left.includes(right) || right.includes(left))) {
    return minLength / maxLength;
  }
  if (minLength < 8) return 0;

  const bigrams = (value: string) => {
    const grams = new Map<string, number>();
    for (let index = 0; index < value.length - 1; index += 1) {
      const gram = value.slice(index, index + 2);
      grams.set(gram, (grams.get(gram) || 0) + 1);
    }
    return grams;
  };
  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);
  let intersection = 0;
  for (const [gram, count] of leftBigrams) {
    intersection += Math.min(count, rightBigrams.get(gram) || 0);
  }
  return (2 * intersection) / (Math.max(left.length - 1, 1) + Math.max(right.length - 1, 1));
};

const findTopicGroupKey = (grouped: Map<string, WorkspaceTopic>, key: string) => {
  if (grouped.has(key)) return key;
  for (const existingKey of grouped.keys()) {
    if (topicSimilarity(existingKey, key) >= 0.82) return existingKey;
  }
  return key;
};

const mergeTopics = (topics: WorkspaceTopic[]) => {
  const grouped = new Map<string, WorkspaceTopic>();
  topics.forEach((topic) => {
    const key = findTopicGroupKey(grouped, topicKey(topic));
    const sourceInfo = {
      source: topic.source,
      sourceTitle: topic.sourceTitle,
      sourceType: topic.sourceType,
      url: topic.url,
      mobileUrl: topic.mobileUrl,
      timestamp: topic.timestamp,
    };
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        ...topic,
        relatedSources: [sourceInfo],
        firstSeenAt: topic.timestamp,
        latestSeenAt: topic.timestamp,
      });
      return;
    }

    existing.score += topic.score;
    existing.hot = Math.max(Number(existing.hot || 0), Number(topic.hot || 0));
    existing.matchedKeywords = Array.from(new Set([...existing.matchedKeywords, ...topic.matchedKeywords]));
    existing.matchedCategories = Array.from(new Set([...existing.matchedCategories, ...topic.matchedCategories]));
    existing.relatedSources = [...(existing.relatedSources || []), sourceInfo];
    existing.firstSeenAt = Math.min(existing.firstSeenAt || topic.timestamp || 0, topic.timestamp || existing.firstSeenAt || 0);
    existing.latestSeenAt = Math.max(existing.latestSeenAt || topic.timestamp || 0, topic.timestamp || existing.latestSeenAt || 0);
    if (topic.riskLevel === "high") existing.riskLevel = "high";
    if (existing.riskLevel !== "high" && topic.riskLevel === "medium") existing.riskLevel = "medium";
  });
  return Array.from(grouped.values());
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

  if (platform === "article") {
    return `标题：${topic.title}背后，真正值得关注的变化\n\n开头：\n今天这个话题冲上热榜：${topic.title}。\n\n它不只是一个热闹事件，更像是一个观察窗口。我们可以先把事实、情绪和可能影响拆开看：第一，事件本身来自 ${topic.sourceTitle}；第二，它触发讨论的原因和 ${[...topic.matchedKeywords, ...topic.matchedCategories].join("、") || "公共关注"} 有关；第三，后续是否值得跟进，要看是否出现更多可靠来源。${viewpointLine}${personaLine}\n\n建议正文结构：\n1. 发生了什么。\n2. 为什么会被关注。\n3. 对普通人或行业有什么影响。\n4. 我们应该怎样更稳妥地判断。\n\n来源：${topic.sourceTitle} ${sourceUrl}${riskNotice}`;
  }

  if (platform === "moments") {
    return `今天看到一个值得聊的话题：${topic.title}。\n\n我比较在意的不是情绪化站队，而是这件事背后会不会影响我们接下来的判断。先保留来源，后续如果有更多信息再更新看法。${viewpointLine}${personaLine}\n\n来源：${topic.sourceTitle} ${sourceUrl}${riskNotice}`;
  }

  return `看到一个热榜话题：${topic.title}。\n\n我的看法是，先把事实和情绪分开。能上热榜说明它击中了大众关注点，但是否值得跟进，还要看来源、后续进展和它跟我们的关系。${viewpointLine}${personaLine}\n\n如果要发动态，我会用 ${toneLabel} 的方式表达：不抢结论，先给信息，再给观点，最后留讨论空间。\n\n来源：${topic.sourceTitle} ${sourceUrl}${riskNotice}`;
};

const platformPromptLabel = (platform: string) =>
  ({
    weibo: "微博短评",
    xiaohongshu: "小红书笔记",
    article: "公众号开头",
    moments: "朋友圈动态",
    video: "短视频口播脚本",
  })[platform] || platform;

const buildDraftPrompt = (
  topic: WorkspaceTopic,
  platform: string,
  tone: WorkspacePreferences["tone"],
  persona: WorkspacePersona,
) => {
  const sourceUrl = topic.mobileUrl || topic.url || "";
  return [
    `请为一个热点内容工作台生成${platformPromptLabel(platform)}草稿。`,
    "要求：",
    "1. 只输出可直接发布或录制的正文，不要解释生成过程。",
    "2. 不编造事实；必须保留来源说明。",
    "3. 高风险话题使用克制表达，避免绝对化判断和攻击个人。",
    "4. 保留 AI 辅助生成标识或适合平台规则的披露表达。",
    "5. 根据平台控制篇幅：微博简洁，小红书有标题和正文，视频包含口播结构。",
    "",
    `热点标题：${topic.title}`,
    `热点描述：${topic.desc || "无"}`,
    `来源：${topic.sourceTitle} ${sourceUrl}`,
    `匹配关键词：${topic.matchedKeywords.join("、") || "无"}`,
    `匹配类型：${topic.matchedCategories.join("、") || "无"}`,
    `风险等级：${topic.riskLevel}`,
    `语气：${tone}`,
    `创作者身份：${persona.identity}`,
    `观点库：${persona.viewpoints.join("；") || "无"}`,
    `表达边界：${persona.boundaries.join("；") || "事实优先"}`,
    `禁用表达：${persona.forbiddenWords.join("；") || "无"}`,
  ].join("\n");
};

const estimateTokens = (content: string) => Math.max(1, Math.ceil(content.length / 2));

const buildGenerationMetrics = (
  startedAt: number,
  prompt: string,
  content: string,
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
): DraftGenerationMetrics => {
  const promptTokens = usage?.prompt_tokens || estimateTokens(prompt);
  const completionTokens = usage?.completion_tokens || estimateTokens(content);
  return {
    latencyMs: Date.now() - startedAt,
    promptTokens,
    completionTokens,
    totalTokens: usage?.total_tokens || promptTokens + completionTokens,
  };
};

const buildTemplateGeneration = (
  topic: WorkspaceTopic,
  platform: string,
  tone: WorkspacePreferences["tone"],
  persona: WorkspacePersona,
  reason = "AI provider is not configured",
  startedAt = Date.now(),
): DraftGenerationResult => {
  const content = ensureAiLabel(buildDraft(topic, platform, tone, persona));
  const prompt = buildDraftPrompt(topic, platform, tone, persona);
  return {
    content,
    mode: "template",
    provider: "template",
    reason,
    metrics: buildGenerationMetrics(startedAt, prompt, content),
  };
};

const generateAiDraft = async (
  topic: WorkspaceTopic,
  platform: string,
  tone: WorkspacePreferences["tone"],
  persona: WorkspacePersona,
): Promise<DraftGenerationResult> => {
  const startedAt = Date.now();
  if (!config.AI_API_KEY || config.AI_PROVIDER === "template") {
    return buildTemplateGeneration(topic, platform, tone, persona, "AI provider is not configured", startedAt);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.AI_TIMEOUT);
  const prompt = buildDraftPrompt(topic, platform, tone, persona);

  try {
    const response = await fetch(`${config.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.AI_MODEL,
        temperature: config.AI_TEMPERATURE,
        messages: [
          {
            role: "system",
            content:
              "你是内容创作助手，负责把热点整理成克制、可核查、适合发布的中文草稿。不要编造事实，不要输出违规或攻击性内容。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      return buildTemplateGeneration(topic, platform, tone, persona, `AI request failed: ${response.status} ${message.slice(0, 120)}`, startedAt);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const rawContent = data.choices?.[0]?.message?.content?.trim();
    if (!rawContent) {
      return buildTemplateGeneration(topic, platform, tone, persona, "AI returned empty content", startedAt);
    }
    const content = ensureAiLabel(rawContent);

    return {
      content,
      mode: "ai",
      provider: config.AI_PROVIDER,
      model: config.AI_MODEL,
      metrics: buildGenerationMetrics(startedAt, prompt, content, data.usage),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "AI request failed";
    return buildTemplateGeneration(topic, platform, tone, persona, reason, startedAt);
  } finally {
    clearTimeout(timeout);
  }
};

const platformLimits: Record<string, number> = {
  weibo: 2000,
  xiaohongshu: 1000,
  article: 3000,
  moments: 800,
  video: 1200,
};

const platformNames: Record<string, string> = {
  weibo: "微博短评",
  xiaohongshu: "小红书笔记",
  article: "公众号开头",
  moments: "朋友圈动态",
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

const mediaSizes: Record<string, string> = {
  weibo: "1080x1080",
  xiaohongshu: "1242x1660",
  article: "900x500",
  moments: "1080x1080",
  video: "1080x1920",
};

const buildMediaSuggestion = (draft: WorkspaceDraft, title: string, hashtags: string[]): MediaSuggestion => {
  const topic = draft.topic;
  const sourceNames = topic.relatedSources?.map((source) => source.sourceTitle).filter(Boolean) || [];
  const sourceText = Array.from(new Set([topic.sourceTitle, ...sourceNames])).slice(0, 3).join("、");
  const keywordText = hashtags.slice(0, 4).join("、") || "热点观察";
  const platformName = platformNames[draft.platform] || draft.platform;
  const visualAngle = draft.platform === "video"
    ? "竖屏口播封面，人物或大字标题居中，留出字幕安全区"
    : draft.platform === "article"
      ? "横版公众号头图，新闻感版式，留出标题区"
      : draft.platform === "xiaohongshu"
        ? "小红书信息卡片风，强标题、低饱和背景、可读性优先"
        : "社交媒体方图，标题清晰、背景简洁、适合手机预览";

  return {
    coverTitle: title.length > 28 ? `${title.slice(0, 27)}...` : title,
    imagePrompt: [
      `为「${platformName}」生成一张配图/封面。`,
      `主题：${title}。`,
      `关键词：${keywordText}。`,
      `视觉方向：${visualAngle}。`,
      `信息来源参考：${sourceText || "用户提供的热点来源"}。`,
      "不要使用真实人物肖像、平台 Logo、新闻截图或未经授权素材，不要生成误导性现场画面。",
    ].join("\n"),
    size: mediaSizes[draft.platform] || "1080x1080",
    styleTips: [
      "标题文字不超过两行，移动端缩略图仍需可读。",
      "画面只表达话题氛围，不伪造事实现场或官方背书。",
      "高风险话题使用中性视觉，不使用煽动性符号、血腥或攻击性元素。",
    ],
    copyrightNotice: "仅使用自有素材、可商用素材或 AI 生成素材；发布前人工确认不包含第三方 Logo、截图、肖像和受版权保护内容。",
  };
};

const buildMediaFile = (draft: WorkspaceDraft, suggestion: MediaSuggestion): PublishPackageFile => ({
  filename: `${draft.id}-media.txt`,
  mimeType: "text/plain;charset=utf-8",
  content: [
    `封面标题：${suggestion.coverTitle}`,
    `建议尺寸：${suggestion.size}`,
    "",
    "图片提示词：",
    suggestion.imagePrompt,
    "",
    "风格注意事项：",
    ...suggestion.styleTips.map((tip) => `- ${tip}`),
    "",
    `版权提示：${suggestion.copyrightNotice}`,
  ].join("\n"),
});

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
  const mediaSuggestion = buildMediaSuggestion(draft, title, hashtags);
  const mediaFile = buildMediaFile(draft, mediaSuggestion);

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
      mediaSuggestion,
      deeplinks: [
        { label: "打开小红书", url: "https://www.xiaohongshu.com/", mobileUrl: "https://www.xiaohongshu.com/" },
      ],
      files: [
        { filename: `${draft.id}-xiaohongshu.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
        mediaFile,
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
      mediaSuggestion,
      deeplinks: [
        { label: "打开抖音网页版", url: "https://www.douyin.com/" },
        { label: "打开哔哩哔哩投稿", url: "https://member.bilibili.com/platform/upload/video/frame" },
      ],
      files: [
        { filename: `${draft.id}-script.txt`, mimeType: "text/plain;charset=utf-8", content: draft.content },
        { filename: `${draft.id}-subtitle.txt`, mimeType: "text/plain;charset=utf-8", content: subtitleText },
        mediaFile,
      ],
    };
  }

  if (draft.platform === "article") {
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
        "开头保留来源和事实边界，不把未经证实的信息写成结论。",
        "正文继续补充可靠来源、引用和案例后再发布。",
        "标题避免夸大，应和正文观点一致。",
      ],
      mediaSuggestion,
      deeplinks: [
        { label: "打开公众号平台", url: "https://mp.weixin.qq.com/" },
      ],
      files: [
        { filename: `${draft.id}-article.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
        mediaFile,
      ],
    };
  }

  if (draft.platform === "moments") {
    const copyText = `${draft.content}\n\n${tagText}${sourceLine}${riskLine}`;
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
        "朋友圈适合轻量表达，避免长篇争议判断。",
        "保留来源说明，必要时只发给合适分组。",
        "高风险话题先审核再发布。",
      ],
      mediaSuggestion,
      deeplinks: [
        { label: "打开微信网页版", url: "https://wx.qq.com/" },
      ],
      files: [
        { filename: `${draft.id}-moments.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
        mediaFile,
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
    mediaSuggestion,
    deeplinks: [
      { label: "打开微博", url: "https://weibo.com/", mobileUrl: "https://m.weibo.cn/" },
    ],
    files: [
      { filename: `${draft.id}-weibo.txt`, mimeType: "text/plain;charset=utf-8", content: copyText },
      mediaFile,
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
  if (draft.topic.riskLevel === "high" && draft.reviewStatus !== "approved") {
    issues.push({ level: "error", message: "该热点为高风险话题，必须审核通过后才能发布。" });
  } else if (draft.topic.riskLevel === "high") {
    issues.push({ level: "warning", message: "该热点为高风险话题，发布前仍建议二次核实并避免绝对化判断。" });
  }
  if (forbiddenHits.length > 0) {
    issues.push({ level: "error", message: `命中人设禁用表达：${forbiddenHits.join("、")}` });
  }
  if (content.length > limit) {
    issues.push({ level: "warning", message: `当前内容 ${content.length} 字，超过 ${draft.platform} 建议长度 ${limit} 字。` });
  }
  if (!content.includes(aiLabel)) {
    issues.push({ level: "error", message: `缺少「${aiLabel}」标识。` });
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

const syncDueSchedules = (store: Required<WorkspaceStore>, userId?: string) => {
  const now = Date.now();
  let changed = false;
  for (const schedule of store.publishSchedules) {
    if (userId && schedule.userId !== userId) continue;
    if (schedule.status !== "pending") continue;
    const scheduledAt = new Date(schedule.scheduledAt).getTime();
    if (!Number.isNaN(scheduledAt) && scheduledAt <= now) {
      schedule.status = "ready";
      schedule.updatedAt = new Date().toISOString();
      addAuditLog(store, schedule.userId, "publish.schedule.ready", "publishSchedule", schedule.id, {
        draftId: schedule.draftId,
        platform: schedule.platform,
        scheduledAt: schedule.scheduledAt,
      });
      changed = true;
    }
  }
  return changed;
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
  const topics = mergeTopics(sourceData
    .filter((source): source is RouterData => Boolean(source))
    .flatMap((source) => source.data.map((item) => scoreTopic(item, source, preferences)))
    .filter((topic): topic is WorkspaceTopic => Boolean(topic)))
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
  const includeArchived = c.req.query("includeArchived") === "true";
  const store = readStore();
  return c.json({
    code: 200,
    data: store.drafts
      .filter((draft) => draft.userId === userId && (includeArchived || !draft.archivedAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

app.delete("/drafts/:id", (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  draft.archivedAt = new Date().toISOString();
  addAuditLog(store, userId, "draft.archived", "draft", draft.id, {
    topicTitle: draft.topic.title,
    platform: draft.platform,
  });
  writeStore(store);

  return c.json({ code: 200, data: draft });
});

app.patch("/drafts/:id/content", async (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const content = String(body.content || "").trim();
  if (!content) return c.json({ code: 400, message: "Content is required" }, 400);

  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  draft.content = content;
  const version = addDraftVersion(store, draft, body.note ? String(body.note) : "手动保存草稿");
  addAuditLog(store, userId, "draft.content.updated", "draft", draft.id, {
    versionId: version.id,
    length: content.length,
  });
  writeStore(store);

  return c.json({ code: 200, data: { draft, version } });
});

app.get("/drafts/:id/versions", (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  return c.json({
    code: 200,
    data: store.draftVersions
      .filter((version) => version.draftId === draftId && version.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
});

app.post("/drafts/:id/versions/:versionId/restore", (c) => {
  const userId = getUserId(c);
  const draftId = c.req.param("id");
  const versionId = c.req.param("versionId");
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);

  const version = store.draftVersions.find(
    (item) => item.id === versionId && item.draftId === draftId && item.userId === userId,
  );
  if (!version) return c.json({ code: 404, message: "Draft version not found" }, 404);

  draft.content = version.content;
  const restoredVersion = addDraftVersion(store, draft, `恢复版本：${version.id}`);
  addAuditLog(store, userId, "draft.version.restored", "draft", draft.id, {
    restoredFrom: version.id,
    versionId: restoredVersion.id,
  });
  writeStore(store);

  return c.json({ code: 200, data: { draft, version: restoredVersion } });
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
  const blockReason = getPublishBlockReason(draft);
  if (blockReason) {
    addAuditLog(store, userId, "publish.blocked", "draft", draft.id, {
      reason: blockReason,
      action: "publish.package",
    });
    writeStore(store);
    return c.json({ code: 409, message: blockReason }, 409);
  }

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

app.get("/platform-accounts", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  return c.json({
    code: 200,
    data: store.platformAccounts
      .filter((account) => account.userId === userId)
      .sort((a, b) => a.platform.localeCompare(b.platform) || a.displayName.localeCompare(b.displayName)),
  });
});

app.post("/platform-accounts", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const platform = String(body.platform || "").trim();
  const displayName = String(body.displayName || "").trim();
  if (!platform || !displayName) {
    return c.json({ code: 400, message: "Platform and displayName are required" }, 400);
  }

  const store = readStore();
  const account: PlatformAccount = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    platform,
    displayName,
    status: "active",
    profileUrl: body.profileUrl ? String(body.profileUrl) : undefined,
    note: body.note ? String(body.note) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.platformAccounts.push(account);
  addAuditLog(store, userId, "platform.account.created", "platformAccount", account.id, {
    platform: account.platform,
    displayName: account.displayName,
  });
  writeStore(store);

  return c.json({ code: 200, data: account });
});

app.patch("/platform-accounts/:id", async (c) => {
  const userId = getUserId(c);
  const accountId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const account = store.platformAccounts.find((item) => item.id === accountId && item.userId === userId);
  if (!account) return c.json({ code: 404, message: "Platform account not found" }, 404);

  if (body.platform !== undefined) account.platform = String(body.platform).trim() || account.platform;
  if (body.displayName !== undefined) account.displayName = String(body.displayName).trim() || account.displayName;
  if (["active", "inactive"].includes(body.status)) account.status = body.status;
  if (body.profileUrl !== undefined) account.profileUrl = body.profileUrl ? String(body.profileUrl) : undefined;
  if (body.note !== undefined) account.note = body.note ? String(body.note) : undefined;
  account.updatedAt = new Date().toISOString();

  addAuditLog(store, userId, "platform.account.updated", "platformAccount", account.id, {
    platform: account.platform,
    displayName: account.displayName,
  });
  writeStore(store);

  return c.json({ code: 200, data: account });
});

app.delete("/platform-accounts/:id", (c) => {
  const userId = getUserId(c);
  const accountId = c.req.param("id");
  const store = readStore();
  const account = store.platformAccounts.find((item) => item.id === accountId && item.userId === userId);
  if (!account) return c.json({ code: 404, message: "Platform account not found" }, 404);

  store.platformAccounts = store.platformAccounts.filter((item) => item.id !== accountId);
  addAuditLog(store, userId, "platform.account.deleted", "platformAccount", account.id, {
    platform: account.platform,
    displayName: account.displayName,
  });
  writeStore(store);

  return c.json({ code: 200, data: account });
});

app.get("/publish-schedules", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  if (syncDueSchedules(store, userId)) writeStore(store);
  return c.json({
    code: 200,
    data: store.publishSchedules
      .filter((schedule) => schedule.userId === userId)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
  });
});

app.post("/publish-schedules", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === body.draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);
  const blockReason = getPublishBlockReason(draft);
  if (blockReason) {
    addAuditLog(store, userId, "publish.blocked", "draft", draft.id, {
      reason: blockReason,
      action: "publish.schedule",
    });
    writeStore(store);
    return c.json({ code: 409, message: blockReason }, 409);
  }
  const account = body.accountId
    ? store.platformAccounts.find((item) => item.id === body.accountId && item.userId === userId)
    : undefined;
  if (body.accountId && !account) return c.json({ code: 404, message: "Platform account not found" }, 404);
  if (account?.status === "inactive") return c.json({ code: 400, message: "Platform account is inactive" }, 400);

  const scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (Number.isNaN(scheduledAt.getTime())) {
    return c.json({ code: 400, message: "Invalid scheduledAt" }, 400);
  }

  const schedule: PublishSchedule = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    draftId: draft.id,
    platform: String(body.platform || draft.platform),
    accountId: account?.id,
    accountName: account?.displayName,
    scheduledAt: scheduledAt.toISOString(),
    status: scheduledAt.getTime() <= Date.now() ? "ready" : "pending",
    note: body.note ? String(body.note) : "等待到点后手动发布。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (account && account.platform !== schedule.platform) {
    return c.json({ code: 400, message: "Platform account does not match draft platform" }, 400);
  }
  store.publishSchedules.push(schedule);
  addAuditLog(store, userId, "publish.schedule.created", "publishSchedule", schedule.id, {
    draftId: draft.id,
    platform: schedule.platform,
    accountId: schedule.accountId,
    accountName: schedule.accountName,
    scheduledAt: schedule.scheduledAt,
  });
  if (schedule.status === "ready") {
    addAuditLog(store, userId, "publish.schedule.ready", "publishSchedule", schedule.id, {
      draftId: draft.id,
      platform: schedule.platform,
      scheduledAt: schedule.scheduledAt,
    });
  }
  writeStore(store);

  return c.json({ code: 200, data: schedule });
});

app.patch("/publish-schedules/:id", async (c) => {
  const userId = getUserId(c);
  const scheduleId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const schedule = store.publishSchedules.find((item) => item.id === scheduleId && item.userId === userId);
  if (!schedule) return c.json({ code: 404, message: "Publish schedule not found" }, 404);
  let publishRecord: PublishRecord | undefined;

  if (["pending", "ready", "published", "skipped", "failed"].includes(body.status)) {
    schedule.status = body.status;
  }
  if (body.scheduledAt) {
    const scheduledAt = new Date(String(body.scheduledAt));
    if (Number.isNaN(scheduledAt.getTime())) {
      return c.json({ code: 400, message: "Invalid scheduledAt" }, 400);
    }
    schedule.scheduledAt = scheduledAt.toISOString();
  }
  if (body.note !== undefined) schedule.note = String(body.note);
  schedule.updatedAt = new Date().toISOString();

  if (schedule.status === "published" && !schedule.publishRecordId) {
    const draft = store.drafts.find((item) => item.id === schedule.draftId && item.userId === userId);
    if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);
    const blockReason = getPublishBlockReason(draft);
    if (blockReason) {
      addAuditLog(store, userId, "publish.blocked", "draft", draft.id, {
        reason: blockReason,
        action: "publish.schedule.complete",
        scheduleId: schedule.id,
      });
      writeStore(store);
      return c.json({ code: 409, message: blockReason }, 409);
    }
    publishRecord = createPublishRecord(store, draft, {
      platform: schedule.platform,
      accountId: schedule.accountId,
      accountName: schedule.accountName,
      status: "published",
      note: `发布计划已完成：${schedule.note || "用户确认已发布"}`,
    });
    schedule.publishRecordId = publishRecord.id;
    addAuditLog(store, userId, "publish.recorded", "publishRecord", publishRecord.id, {
      draftId: draft.id,
      platform: publishRecord.platform,
      accountId: publishRecord.accountId,
      accountName: publishRecord.accountName,
      status: publishRecord.status,
      scheduleId: schedule.id,
    });
  }

  addAuditLog(store, userId, "publish.schedule.updated", "publishSchedule", schedule.id, {
    status: schedule.status,
    scheduledAt: schedule.scheduledAt,
    publishRecordId: schedule.publishRecordId,
  });
  writeStore(store);

  return c.json({ code: 200, data: { schedule, publishRecord } });
});

app.post("/publish-records", async (c) => {
  const userId = getUserId(c);
  const body = await c.req.json().catch(() => ({}));
  const store = readStore();
  const draft = store.drafts.find((item) => item.id === body.draftId && item.userId === userId);
  if (!draft) return c.json({ code: 404, message: "Draft not found" }, 404);
  const blockReason = getPublishBlockReason(draft);
  if (blockReason) {
    addAuditLog(store, userId, "publish.blocked", "draft", draft.id, {
      reason: blockReason,
      action: "publish.record",
    });
    writeStore(store);
    return c.json({ code: 409, message: blockReason }, 409);
  }
  const account = body.accountId
    ? store.platformAccounts.find((item) => item.id === body.accountId && item.userId === userId)
    : undefined;
  if (body.accountId && !account) return c.json({ code: 404, message: "Platform account not found" }, 404);
  if (account?.status === "inactive") return c.json({ code: 400, message: "Platform account is inactive" }, 400);
  const platform = String(body.platform || draft.platform);
  if (account && account.platform !== platform) {
    return c.json({ code: 400, message: "Platform account does not match draft platform" }, 400);
  }

  const record = createPublishRecord(store, draft, {
    platform,
    accountId: account?.id,
    accountName: account?.displayName,
    status: ["assisted", "published", "failed"].includes(body.status) ? body.status : "assisted",
    publishUrl: body.publishUrl ? String(body.publishUrl) : undefined,
    note: body.note ? String(body.note) : "已复制/分享到平台，等待用户手动确认发布。",
  });
  addAuditLog(store, userId, "publish.recorded", "publishRecord", record.id, {
    draftId: draft.id,
    platform: record.platform,
    accountId: record.accountId,
    accountName: record.accountName,
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
  if (syncDueSchedules(store, userId)) writeStore(store);
  const drafts = store.drafts.filter((draft) => draft.userId === userId);
  const records = store.publishRecords.filter((record) => record.userId === userId);
  const schedules = store.publishSchedules.filter((schedule) => schedule.userId === userId);
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
  const generation = drafts.reduce(
    (acc, draft) => {
      const mode = draft.generationMode || "template";
      if (mode === "ai") acc.aiCount += 1;
      if (mode === "template") acc.templateCount += 1;
      const metrics = draft.generationMetrics;
      if (metrics) {
        acc.latencyMs += metrics.latencyMs || 0;
        acc.promptTokens += metrics.promptTokens || 0;
        acc.completionTokens += metrics.completionTokens || 0;
        acc.totalTokens += metrics.totalTokens || 0;
      }
      if (draft.generationReason) {
        acc.fallbackReasons[draft.generationReason] = (acc.fallbackReasons[draft.generationReason] || 0) + 1;
      }
      return acc;
    },
    {
      aiCount: 0,
      templateCount: 0,
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      fallbackReasons: {} as Record<string, number>,
    },
  );
  const measuredDraftCount = drafts.filter((draft) => draft.generationMetrics).length;

  return c.json({
    code: 200,
    data: {
      draftCount: drafts.length,
      publishCount: records.length,
      scheduleCount: schedules.length,
      pendingScheduleCount: schedules.filter((schedule) => ["pending", "ready"].includes(schedule.status)).length,
      reviewStatus,
      totals,
      engagementRate: totals.views > 0 ? Number(((totals.likes + totals.comments + totals.shares) / totals.views).toFixed(4)) : 0,
      leadRate: totals.views > 0 ? Number((totals.leads / totals.views).toFixed(4)) : 0,
      generation: {
        ...generation,
        averageLatencyMs: measuredDraftCount > 0 ? Math.round(generation.latencyMs / measuredDraftCount) : 0,
      },
    },
  });
});

app.get("/insights", (c) => {
  const userId = getUserId(c);
  const store = readStore();
  if (syncDueSchedules(store, userId)) writeStore(store);
  const records = store.publishRecords.filter((record) => record.userId === userId);
  const schedules = store.publishSchedules.filter((schedule) => schedule.userId === userId);
  const drafts = store.drafts.filter((draft) => draft.userId === userId);

  const platformStats = records.reduce<Record<string, { count: number; views: number; engagement: number; leads: number }>>(
    (acc, record) => {
      const metrics = record.metrics || { views: 0, likes: 0, comments: 0, shares: 0, leads: 0 };
      const item = acc[record.platform] || { count: 0, views: 0, engagement: 0, leads: 0 };
      item.count += 1;
      item.views += metrics.views;
      item.engagement += metrics.likes + metrics.comments + metrics.shares;
      item.leads += metrics.leads;
      acc[record.platform] = item;
      return acc;
    },
    {},
  );
  const rankedPlatforms = Object.entries(platformStats)
    .map(([platform, stats]) => ({
      platform,
      ...stats,
      engagementRate: stats.views > 0 ? Number((stats.engagement / stats.views).toFixed(4)) : 0,
      leadRate: stats.views > 0 ? Number((stats.leads / stats.views).toFixed(4)) : 0,
    }))
    .sort((a, b) => b.leadRate - a.leadRate || b.engagementRate - a.engagementRate || b.views - a.views);
  const bestRecord = records
    .map((record) => {
      const metrics = record.metrics || { views: 0, likes: 0, comments: 0, shares: 0, leads: 0 };
      return {
        ...record,
        score: metrics.leads * 100 + (metrics.likes + metrics.comments + metrics.shares) * 10 + metrics.views,
      };
    })
    .sort((a, b) => b.score - a.score)[0];
  const pendingSchedules = schedules.filter((schedule) => ["pending", "ready"].includes(schedule.status));
  const highRiskDrafts = drafts.filter((draft) => draft.topic.riskLevel === "high" && draft.reviewStatus !== "approved");
  const unmeasuredRecords = records.filter((record) => {
    const metrics = record.metrics || { views: 0, likes: 0, comments: 0, shares: 0, leads: 0 };
    return metrics.views + metrics.likes + metrics.comments + metrics.shares + metrics.leads === 0;
  });
  const suggestions = [
    rankedPlatforms[0]
      ? `优先复用 ${rankedPlatforms[0].platform} 的内容结构：当前线索率 ${rankedPlatforms[0].leadRate}，互动率 ${rankedPlatforms[0].engagementRate}。`
      : "还没有可复盘的发布数据，先发布 3 条以上内容并回填基础指标。",
    pendingSchedules.length > 0
      ? `当前有 ${pendingSchedules.length} 条待发布计划，发布前先完成来源和风险复核。`
      : "暂无待发布计划，可以从高分热点中补充未来 2 小时的发布排程。",
    unmeasuredRecords.length > 0
      ? `有 ${unmeasuredRecords.length} 条发布记录未回填数据，建议优先补齐曝光、互动和线索。`
      : "发布记录均已回填基础指标，可以开始比较平台和发布时间表现。",
    highRiskDrafts.length > 0
      ? `有 ${highRiskDrafts.length} 条高风险草稿未审核通过，暂不建议进入发布计划。`
      : "当前没有未审核的高风险草稿。",
  ];

  return c.json({
    code: 200,
    data: {
      rankedPlatforms,
      bestRecord: bestRecord || null,
      pendingScheduleCount: pendingSchedules.length,
      unmeasuredRecordCount: unmeasuredRecords.length,
      highRiskDraftCount: highRiskDrafts.length,
      suggestions,
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
  const generation = await generateAiDraft(topic, platform, tone, persona);
  const draft: WorkspaceDraft = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId,
    topic,
    platform,
    tone,
    content: generation.content,
    generationMode: generation.mode,
    generationProvider: generation.provider,
    generationModel: generation.model,
    generationReason: generation.reason,
    generationMetrics: generation.metrics,
    reviewStatus: "draft",
    createdAt: new Date().toISOString(),
  };
  const store = readStore();
  store.drafts.push(draft);
  const version = addDraftVersion(store, draft, "初始生成");
  addAuditLog(store, userId, "draft.generated", "draft", draft.id, {
    platform,
    topicTitle: topic.title,
    riskLevel: topic.riskLevel,
    generationMode: generation.mode,
    generationProvider: generation.provider,
    generationModel: generation.model,
    generationReason: generation.reason,
    generationMetrics: generation.metrics,
    versionId: version.id,
  });
  writeStore(store);

  return c.json({ code: 200, data: draft });
});

export default app;
