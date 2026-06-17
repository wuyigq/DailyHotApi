import type { RouterData, ListContext, Options } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { parseRSS } from "../utils/parseRSS.js";

const typeMap = {
  press: {
    name: "Press Releases",
    link: "https://www.nobelprize.org/press-release/",
    feed: "https://www.nobelprize.org/press-release/feed/",
  },
  stories: {
    name: "Stories",
    link: "https://www.nobelprize.org/",
    feed: "https://www.nobelprize.org/feed/",
  },
} as const;

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
};

const stripHtml = (value?: string) =>
  value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() || undefined;

const nobelBaseUrl = "https://www.nobelprize.org";

const toAbsoluteUrl = (value?: string) => {
  if (!value) return "";
  return new URL(value, nobelBaseUrl).toString();
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "press") as keyof typeof typeMap;
  const currentType = typeMap[type] || typeMap.press;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "nobelprize",
    title: "Nobel Prize",
    type: currentType.name,
    params: {
      type: {
        name: "榜单分类",
        type: Object.fromEntries(Object.entries(typeMap).map(([key, value]) => [key, value.name])),
      },
    },
    link: currentType.link,
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "press";
  const currentType = typeMap[type] || typeMap.press;
  const result = await get({ url: currentType.feed, noCache, headers, responseType: "text" });
  const parsed = await parseRSS(String(result.data));
  const filtered =
    type === "stories"
      ? parsed.filter((item) => item.link?.includes("/stories/"))
      : parsed.filter((item) => item.link?.includes("/press-release/"));
  const list = (filtered.length > 0 ? filtered : parsed).map((item, index) => {
    const url = toAbsoluteUrl(item.link);
    return {
      id: item.guid || url || index,
      title: item.title || "",
      desc: stripHtml(item.contentSnippet || item.content),
      cover: undefined,
      author: item.author || "Nobel Prize",
      hot: undefined,
      timestamp: getTime(item.pubDate || 0),
      url,
      mobileUrl: url,
    };
  });

  return {
    ...result,
    data: list,
  };
};
