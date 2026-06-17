import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { extractObjectLiteral } from "../utils/extractEmbeddedState.js";

type GuokrArticle = {
  id: number;
  title?: string;
  summary?: string;
  cover_url?: string;
  small_image?: string;
  image?: string;
  replies_count?: number;
  date_published?: string;
  date_created?: string;
  link?: string;
  author?: {
    nickname?: string;
  };
  authors?: {
    nickname?: string;
  };
};

const getGuokrState = (html: string) => {
  const raw =
    extractObjectLiteral(html, "window.__INITIAL_STATE__ =") ||
    extractObjectLiteral(html, "window.__INITIAL_STATE__=");
  if (!raw) {
    throw new Error("Failed to parse guokr state");
  }
  return JSON.parse(raw);
};

const mapArticle = (item: GuokrArticle, index: number) => ({
  id: item.id || index,
  title: item.title || "",
  desc: item.summary || undefined,
  cover: item.cover_url || item.small_image || item.image || undefined,
  author: item.author?.nickname || item.authors?.nickname || "果壳",
  hot: item.replies_count || undefined,
  timestamp: getTime(item.date_published || item.date_created || 0),
  url: item.link
    ? new URL(item.link, "https://www.guokr.com").toString()
    : `https://www.guokr.com/article/${item.id}`,
  mobileUrl: item.link
    ? new URL(item.link, "https://www.guokr.com").toString()
    : `https://www.guokr.com/article/${item.id}`,
});

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "guokr-home",
    title: "果壳",
    type: "首页推荐",
    description: "科技有意思",
    link: "https://www.guokr.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://www.guokr.com/",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const state = getGuokrState(String(result.data));
  const list = (state?.homeStore?.homeArticleList || []) as GuokrArticle[];

  return {
    ...result,
    data: list.slice(0, 20).map(mapArticle),
  };
};
