import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { load } from "cheerio";
import { getTime } from "../utils/getTime.js";
import { parseRSS } from "../utils/parseRSS.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "producthunt",
    title: "Product Hunt",
    type: "Today",
    description: "The best new products, every day",
    link: "https://www.producthunt.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const baseUrl = "https://www.producthunt.com/";
  const result = await get({
    url: `${baseUrl}feed`,
    noCache,
    headers: {
      Accept: "application/atom+xml, application/xml;q=0.9, */*;q=0.8",
    },
  });

  const list = await parseRSS(result.data);

  return {
    ...result,
    data: list.map((item, index) => {
      const $ = load(`<div>${item.content || ""}</div>`);
      const desc = $("p").first().text().replace(/\s+/g, " ").trim();
      const url = item.link || baseUrl;
      const id = url.replace(/\/+$/, "").split("/").pop() || index.toString();
      return {
        id,
        title: item.title || "",
        desc,
        author: item.author,
        hot: undefined,
        timestamp: getTime(item.pubDate || 0),
        url,
        mobileUrl: url,
      };
    }),
  };
};
