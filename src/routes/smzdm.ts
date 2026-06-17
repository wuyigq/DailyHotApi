import type { ListContext, Options, RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { parseRSS } from "../utils/parseRSS.js";

const typeMap = {
  featured: {
    name: "精选好价",
    link: "https://www.smzdm.com/jingxuan/",
    feed: "http://feed.smzdm.com",
  },
  post: {
    name: "最新文章",
    link: "https://post.smzdm.com/",
    feed: "https://post.smzdm.com/feed/",
  },
} as const;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "featured") as keyof typeof typeMap;
  const currentType = typeMap[type] || typeMap.featured;
  const listData = await getList({ type }, noCache);
  const routeData: RouterData = {
    name: "smzdm",
    title: "什么值得买",
    type: currentType.name,
    description:
      "什么值得买是一个中立的、致力于帮助广大网友买到更有性价比网购产品的最热门推荐网站。",
    link: currentType.link,
    params: {
      type: {
        name: "文章分类",
        type: Object.fromEntries(Object.entries(typeMap).map(([key, value]) => [key, value.name])),
      },
    },
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "featured";
  const currentType = typeMap[type] || typeMap.featured;
  const result = await get({
    url: currentType.feed,
    noCache,
    responseType: "text",
    headers: {
      Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const items = await parseRSS(String(result.data));
  return {
    ...result,
    data: items.slice(0, 20).map((item, index) => ({
      id: item.guid || item.link || index,
      title: item.title || "",
      desc: item.contentSnippet || item.content || undefined,
      cover: undefined,
      author: item.author || "什么值得买",
      hot: undefined,
      timestamp: getTime(item.pubDate || 0),
      url: item.link || currentType.link,
      mobileUrl: item.link || currentType.link,
    })),
  };
};
