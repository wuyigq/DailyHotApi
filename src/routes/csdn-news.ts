import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { extractObjectLiteral } from "../utils/extractEmbeddedState.js";

type CsdnNewsItem = {
  itemId?: number;
  id?: number;
  title?: string;
  summary?: string;
  url?: string;
  cover?: string;
  nickname?: string;
  username?: string;
  viewCount?: string | number;
  commentCount?: string | number;
  publish?: string;
  editTime?: string;
  timestamp?: number;
};

const collectItems = (value: unknown, bucket: CsdnNewsItem[]) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectItems(item, bucket));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const item = value as CsdnNewsItem;
  if (
    (item.nickname === "CSDN资讯" || item.username === "csdnnews") &&
    item.title &&
    item.url?.includes("blog.csdn.net")
  ) {
    bucket.push(item);
  }

  Object.values(item).forEach((child) => collectItems(child, bucket));
};

const toNumber = (value?: string | number) => {
  if (typeof value === "number") {
    return value;
  }
  if (!value) {
    return undefined;
  }
  const normalized = value.toString().toLowerCase();
  if (normalized.includes("w")) {
    return Number.parseFloat(normalized.replace("w", "")) * 10000;
  }
  if (normalized.includes("k")) {
    return Number.parseFloat(normalized.replace("k", "")) * 1000;
  }
  const parsed = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "csdn-news",
    title: "CSDN",
    type: "最新资讯",
    description: "专业开发者社区",
    link: "https://www.csdn.net/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://www.csdn.net/",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const stateRaw =
    extractObjectLiteral(String(result.data), "window.__INITIAL_STATE__=") ||
    extractObjectLiteral(String(result.data), "window.__INITIAL_STATE__ =");
  if (!stateRaw) {
    throw new Error("Failed to parse csdn state");
  }

  const state = JSON.parse(stateRaw);
  const collected: CsdnNewsItem[] = [];
  collectItems(state, collected);

  const seen = new Set<number | string>();
  const list = collected
    .filter((item) => {
      const key = item.itemId || item.id || item.url || item.title;
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
    .slice(0, 20)
    .map((item, index) => ({
      id: item.itemId || item.id || index,
      title: item.title || "",
      desc: item.summary || undefined,
      cover: item.cover || undefined,
      author: item.nickname || "CSDN资讯",
      hot: toNumber(item.viewCount) || toNumber(item.commentCount),
      timestamp: item.timestamp || getTime(item.editTime || item.publish || 0),
      url: item.url || "https://www.csdn.net/",
      mobileUrl: item.url || "https://www.csdn.net/",
    }));

  return {
    ...result,
    data: list,
  };
};
