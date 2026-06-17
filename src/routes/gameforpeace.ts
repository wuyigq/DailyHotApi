import type { RouterData, ListItem } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import iconv from "iconv-lite";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "gameforpeace",
    title: "和平精英",
    type: "活动",
    link: "https://gp.qq.com/main.shtml",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://gp.qq.com/main.shtml";
  const result = await get({ url, noCache, responseType: "arraybuffer" });
  const html = iconv.decode(result.data, "gbk");
  const $ = load(html);
  const block = $(".sec2-info-list4").first();
  const items = [
    ...parseSubLinks($, block),
    ...parseActivityItems($, block),
  ];

  return {
    ...result,
    data: dedupe(items),
  };
};

const parseActivityItems = (root: ReturnType<typeof load>, block: any) => {
  const items: ListItem[] = [];
  block.find(".sec2-info-item a.sec2-info-rg").each((_: number, element: any) => {
    const dom = root(element);
    const href = dom.attr("href") || "";
    const title = cleanText(dom.attr("title") || dom.find(".sec2-info-body-text").text());
    const date = cleanText(dom.find(".sec2-info-time-text").text());
    if (!title || !href) return;

    items.push({
      id: getNewsId(href),
      title,
      hot: undefined,
      timestamp: parseMonthDay(date),
      url: normalizeUrl(href),
      mobileUrl: normalizeUrl(href),
    });
  });

  return items;
};

const parseSubLinks = (root: ReturnType<typeof load>, block: any) => {
  const items: ListItem[] = [];
  block.children("a.sec2-sub-info-link").each((_: number, element: any) => {
    const dom = root(element);
    const href = dom.attr("href") || "";
    const title = cleanText(dom.find(".sec2-sub-text").text());
    if (!href || !title) return;

    items.push({
      id: getNewsId(href),
      title,
      hot: undefined,
      timestamp: undefined,
      url: normalizeUrl(href),
      mobileUrl: normalizeUrl(href),
    });
  });

  return items;
};

const dedupe = (items: ListItem[]): ListItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.id}:${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getNewsId = (href: string) => href.match(/\/(\d+)\.html/)?.[1] || href;

const normalizeUrl = (href: string) =>
  href.startsWith("http") ? href : `https://gp.qq.com${href.startsWith("/") ? href : `/${href}`}`;

const parseMonthDay = (value: string) => {
  const match = value.match(/^(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  const now = new Date();
  let year = now.getFullYear();
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const candidate = new Date(year, month, day);

  if (candidate.getTime() - now.getTime() > 1000 * 60 * 60 * 24 * 45) {
    year -= 1;
  }

  return new Date(year, month, day).getTime();
};

const cleanText = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
