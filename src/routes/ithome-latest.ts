import type { RouterData } from "../types.js";
import { getTime } from "../utils/getTime.js";
import { parseRSS } from "../utils/parseRSS.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList();
  const routeData: RouterData = {
    name: "ithome-latest",
    title: "IT之家",
    type: "最新",
    description: "爱科技，爱这里 - 前沿科技新闻网站",
    link: "https://www.ithome.com/rss/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async () => {
  const items = await parseRSS("https://www.ithome.com/rss/");
  return {
    fromCache: false,
    updateTime: new Date().toISOString(),
    data: items.slice(0, 20).map((item, index) => ({
      id: item.guid || index,
      title: item.title || "",
      desc: item.contentSnippet || item.content || undefined,
      cover: undefined,
      author: item.author || "IT之家",
      hot: undefined,
      timestamp: getTime(item.pubDate || 0),
      url: item.link || "https://www.ithome.com/",
      mobileUrl: item.link || "https://www.ithome.com/",
    })),
  };
};
