import type { RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "v2ex-all",
    title: "V2EX",
    type: "全部",
    link: "https://www.v2ex.com/?tab=all",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://www.v2ex.com/?tab=all",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const $ = load(String(result.data));

  const list = $(".cell.item")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const topicLink = dom.find("a.topic-link").first();
      const href = topicLink.attr("href") || "";
      const title = topicLink.text().trim();
      if (!href || !title) {
        return null;
      }

      const lastReplyText = dom.find(".topic_info").text();
      const latestReplyMatch = lastReplyText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);

      return {
        id: href.match(/\/t\/(\d+)/)?.[1] || index,
        title,
        desc: dom.find(".node").text().trim() || undefined,
        cover: dom.find("img.avatar").attr("src") || undefined,
        author: dom.find("strong a").first().text().trim() || undefined,
        hot: Number(dom.find("a.count_livid").first().text().trim()) || undefined,
        timestamp: latestReplyMatch ? getTime(latestReplyMatch[0]) : undefined,
        url: new URL(href, "https://www.v2ex.com").toString(),
        mobileUrl: new URL(href, "https://www.v2ex.com").toString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 20);

  return {
    ...result,
    data: list,
  };
};
