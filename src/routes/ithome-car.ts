import type { RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const getList = async (url: string, noCache: boolean) => {
  const result = await get({
    url,
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const $ = load(String(result.data));
  const list = $("#list .bl li")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const anchor = dom.find("a.title").first();
      const href = anchor.attr("href") || "";
      const title = anchor.text().trim();

      if (!href || !title) {
        return null;
      }

      return {
        id: href.match(/\/(\d+)\.htm$/)?.[1] || index,
        title,
        desc: dom.find(".m").first().text().trim() || undefined,
        cover: dom.find("img").attr("data-original") || undefined,
        author: "IT之家",
        hot: undefined,
        timestamp: getTime(dom.find(".c").attr("data-ot") || 0),
        url: href,
        mobileUrl: href,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList("https://www.ithome.com/tag/car/", noCache);
  const routeData: RouterData = {
    name: "ithome-car",
    title: "IT之家",
    type: "智车",
    description: "爱科技，爱这里 - 前沿科技新闻网站",
    link: "https://www.ithome.com/tag/car/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};
