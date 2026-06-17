import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { extractObjectLiteral } from "../utils/extractEmbeddedState.js";

type GuokrScienceArticle = {
  id: number;
  title?: string;
  summary?: string;
  image?: string;
  small_image?: string;
  cover_url?: string;
  replies_count?: number;
  date_published?: string;
  date_created?: string;
  author?: {
    nickname?: string;
  };
};

const getGuokrState = (html: string) => {
  const raw =
    extractObjectLiteral(html, "window.__INITIAL_STATE__ =") ||
    extractObjectLiteral(html, "window.__INITIAL_STATE__=");
  if (!raw) {
    throw new Error("Failed to parse guokr science state");
  }
  return JSON.parse(raw);
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "guokr-science",
    title: "果壳",
    type: "科学人",
    description: "科技有意思",
    link: "https://www.guokr.com/science/category/all",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://www.guokr.com/science/category/all",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const state = getGuokrState(String(result.data));
  const list = (state?.scienceArticleListStore?.articleList || []) as GuokrScienceArticle[];

  return {
    ...result,
    data: list.slice(0, 20).map((item, index) => ({
      id: item.id || index,
      title: item.title || "",
      desc: item.summary || undefined,
      cover: item.cover_url || item.small_image || item.image || undefined,
      author: item.author?.nickname || "果壳",
      hot: item.replies_count || undefined,
      timestamp: getTime(item.date_published || item.date_created || 0),
      url: `https://www.guokr.com/article/${item.id}`,
      mobileUrl: `https://www.guokr.com/article/${item.id}`,
    })),
  };
};
