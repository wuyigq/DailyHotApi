import type { RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

type HongguoCard = {
  series_id?: string;
  series_name?: string;
  series_cover?: string;
  tags?: string[];
  episode_right_text?: string;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "hongguo",
    title: "红果短剧",
    type: "最热",
    link: "https://novelquickapp.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://novelquickapp.com/";
  const result = await get({ url, noCache, responseType: "text" });
  const html = String(result.data);
  const items = parseCardsFromState(html);

  return {
    ...result,
    data: items.length > 0 ? items : parseCardsFromDom(html),
  };
};

const parseCardsFromState = (html: string) => {
  const match = html.match(/"data":\{"m_card_list":(\[[\s\S]*?\]),"m_banner_list":/);
  if (!match) {
    return [];
  }

  try {
    const list = JSON.parse(match[1]) as HongguoCard[];
    return list
      .filter((item) => item.series_id && item.series_name)
      .slice(0, 50)
      .map((item) => ({
        id: item.series_id!,
        title: item.series_name!,
        desc: [item.episode_right_text, item.tags?.slice(0, 3).join(" / ")]
          .filter(Boolean)
          .join(" · ") || undefined,
        cover: item.series_cover,
        hot: undefined,
        timestamp: undefined,
        url: `https://novelquickapp.com/detail?series_id=${encodeURIComponent(item.series_id!)}`,
        mobileUrl: `https://novelquickapp.com/detail?series_id=${encodeURIComponent(item.series_id!)}`,
      }));
  } catch {
    return [];
  }
};

const parseCardsFromDom = (html: string) => {
  const $ = load(html);
  return $('a[href^="/detail?series_id="]')
    .toArray()
    .map((element) => {
      const dom = $(element);
      const href = dom.attr("href") || "";
      const seriesId = href.match(/series_id=([^&"]+)/)?.[1];
      const title = cleanText(dom.find('p[class*="pc-title-"]').first().text());
      const episode = cleanText(dom.find('p[class*="pc-episode-"]').first().text());
      const tags = dom
        .find('span[class*="pc-tag-text-"]')
        .toArray()
        .map((tag) => cleanText($(tag).text()))
        .filter(Boolean)
        .slice(0, 3);

      if (!seriesId || !title) {
        return null;
      }

      return {
        id: seriesId,
        title,
        desc: [episode, tags.join(" / ")].filter(Boolean).join(" · ") || undefined,
        hot: undefined,
        timestamp: undefined,
        url: `https://novelquickapp.com/detail?series_id=${encodeURIComponent(seriesId)}`,
        mobileUrl: `https://novelquickapp.com/detail?series_id=${encodeURIComponent(seriesId)}`,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 50);
};

const cleanText = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
