import type { RouterData, ListItem } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import iconv from "iconv-lite";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "wzry",
    title: "王者荣耀",
    type: "活动",
    link: "https://pvp.qq.com/m/m201706/newsList.shtml",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://pvp.qq.com/m/m201706/newsList.shtml";
  const result = await get({ url, noCache, responseType: "arraybuffer" });
  const html = iconv.decode(result.data, "gbk");
  const $ = load(html);
  const block = $("#gicpBox h2")
    .filter((_, element) => $(element).text().trim() === "活动")
    .first()
    .next("ul");
  const items: ListItem[] = [];
  block.find("a[href]").each((_: number, element: any) => {
    const dom = $(element);
    const title = cleanText(dom.attr("title") || dom.text());
    const href = dom.attr("href") || "";
    if (!title || !href) return;

    items.push({
      id: href.match(/\/(\d+)\.html/)?.[1] || href,
      title,
      hot: undefined,
      timestamp: undefined,
      url: normalizeUrl(href),
      mobileUrl: normalizeUrl(href),
    });
  });

  return {
    ...result,
    data: items,
  };
};

const normalizeUrl = (href: string) =>
  href.startsWith("http") ? href : `https://pvp.qq.com${href.startsWith("/") ? href : `/${href}`}`;

const cleanText = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
