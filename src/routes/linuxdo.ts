import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { parseRSS } from "../utils/parseRSS.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "linuxdo",
    title: "Linux.do",
    type: "热门文章",
    description: "Linux 技术社区热搜",
    link: "https://linux.do/hot",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const normalizeText = (value?: string) => value?.replace(/\s+/g, " ").trim() || "";

const getList = async (noCache: boolean) => {
  const url = "https://linux.do/top.rss?period=weekly";
  const result = await get({
    url,
    noCache,
    headers: {
      Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });

  const list = await parseRSS(result.data);

  return {
    ...result,
    data: list.map((item, index) => {
      const text = normalizeText(item.contentSnippet);
      const hotMatch = text.match(/(\d+)\s*个帖子/);
      return {
        id: item.guid || index,
        title: item.title || "",
        desc: normalizeText(text.replace(/\s*\d+\s*个帖子[\s\S]*$/, "")),
        author: item.author || "",
        timestamp: getTime(item.pubDate || 0),
        url: item.link || "https://linux.do/top?period=weekly",
        mobileUrl: item.link || "https://linux.do/top?period=weekly",
        hot: hotMatch ? Number(hotMatch[1]) : undefined,
      };
    }),
  };
};
