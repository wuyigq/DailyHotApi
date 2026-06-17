import type { RouterData, ListContext, Options } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const typeMap = {
  brief: "快讯",
  latest: "最新",
  head: "头条",
} as const;

type YicaiLatestItem = {
  NewsID: number;
  NewsTitle: string;
  NewsNotes?: string;
  NewsThumbs?: string;
  CreaterName?: string;
  NewsSource?: string;
  NewsHot?: number;
  CreateDate?: string;
  LastDate?: string;
  url?: string;
};

type YicaiHeadItem = {
  NewsID: number;
  NewsTitle: string;
  NewsNotes?: string;
  NewsThumbs?: string;
  NewsCover?: string;
  CreaterName?: string;
  NewsSource?: string;
  NewsHot?: number;
  CreateDate?: string;
  NewsUrl?: string;
  ShareUrl?: string;
};

type YicaiBriefItem = {
  id?: number;
  LiveID: number;
  LiveTitle?: string;
  LiveContent?: string;
  NewsHot?: number;
  url?: string;
  ShareUrl?: string;
  hm?: string;
  datekey?: string;
  IsImportant?: boolean;
};

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

const stripHtml = (value?: string) =>
  value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() || undefined;

const getAbsoluteUrl = (url?: string, mobile: boolean = false) => {
  if (!url) {
    return "";
  }
  if (/^https?:\/\//.test(url)) {
    return mobile ? url.replace("://www.yicai.com", "://m.yicai.com") : url;
  }
  return `${mobile ? "https://m.yicai.com" : "https://www.yicai.com"}${url}`;
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "brief") as keyof typeof typeMap;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "yicai",
    title: "第一财经",
    type: typeMap[type] || typeMap.brief,
    params: {
      type: {
        name: "榜单分类",
        type: typeMap,
      },
    },
    link: "https://www.yicai.com/",
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "brief";

  if (type === "latest") {
    const result = await get({
      url: "https://www.yicai.com/api/ajax/getlatest?page=1&pagesize=30",
      noCache,
      headers,
    });
    const list = result.data as YicaiLatestItem[];

    return {
      ...result,
      data: list.map((item) => ({
        id: item.NewsID,
        title: item.NewsTitle,
        desc: item.NewsNotes || undefined,
        cover: item.NewsThumbs || undefined,
        author: item.CreaterName || item.NewsSource || "第一财经",
        hot: item.NewsHot || undefined,
        timestamp: getTime(item.CreateDate || item.LastDate || 0),
        url: getAbsoluteUrl(item.url || `/news/${item.NewsID}.html`),
        mobileUrl: getAbsoluteUrl(item.url || `/news/${item.NewsID}.html`, true),
      })),
    };
  }

  if (type === "head") {
    const result = await get({
      url: "https://www.yicai.com/api/ajax/getAINews?page=1&pagesize=30",
      noCache,
      headers,
    });
    const list = result.data as YicaiHeadItem[];

    return {
      ...result,
      data: list.map((item) => {
        const desktopUrl =
          item.ShareUrl ||
          (item.NewsUrl?.includes("m.yicai.com")
            ? item.NewsUrl.replace("://m.yicai.com", "://www.yicai.com")
            : item.NewsUrl) ||
          `/news/${item.NewsID}.html`;

        return {
          id: item.NewsID,
          title: item.NewsTitle,
          desc: item.NewsNotes || undefined,
          cover: item.NewsThumbs || item.NewsCover || undefined,
          author: item.CreaterName || item.NewsSource || "第一财经",
          hot: item.NewsHot || undefined,
          timestamp: getTime(item.CreateDate || 0),
          url: getAbsoluteUrl(desktopUrl),
          mobileUrl: getAbsoluteUrl(item.NewsUrl || desktopUrl, true),
        };
      }),
    };
  }

  const result = await get({
    url: "https://www.yicai.com/api/ajax/getbrieflist?page=1&pagesize=20",
    noCache,
    headers,
  });
  const list = result.data as YicaiBriefItem[];

  return {
    ...result,
    data: list.map((item, index) => ({
      id: item.id || item.LiveID || index,
      title: item.LiveTitle || "",
      desc: stripHtml(item.LiveContent),
      author: item.IsImportant ? "第一财经·重点快讯" : "第一财经",
      hot: item.NewsHot || undefined,
      timestamp: getTime(
        item.datekey && item.hm ? `${item.datekey.replace(/\./g, "-")} ${item.hm}` : 0,
      ),
      url: getAbsoluteUrl(item.url || `/brief/${item.LiveID}.html`),
      mobileUrl: getAbsoluteUrl(item.ShareUrl || `/brief/${item.LiveID}.html`, true),
    })),
  };
};
