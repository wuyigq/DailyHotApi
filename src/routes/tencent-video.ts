import type { ListContext, RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

const typeMap: Record<string, string> = {
  "106": "少儿",
  "3": "动漫",
  "10": "综艺",
  "2": "电视剧",
  "1": "电影",
};

const trendMap: Record<string, string> = {
  icon_rise_sm: "上升",
  icon_decline_sm: "下降",
  icon_hold_sm: "持平",
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const requestedType = c.req.query("type") || "106";
  const currentType = typeMap[requestedType] ? requestedType : "106";
  const listData = await getList(currentType, noCache);

  const routeData: RouterData = {
    name: "tencent-video",
    title: "腾讯视频",
    type: typeMap[currentType],
    params: {
      type: {
        name: "榜单分类",
        type: typeMap,
      },
    },
    link: `https://v.qq.com/x/hotlist/search/?channel=${currentType}`,
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (type: string, noCache: boolean) => {
  const url = `https://v.qq.com/x/hotlist/search/?channel=${type}`;
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });

  const $ = load(result.data);
  const list = $(".table_list .item_list")
    .toArray()
    .filter((item) => !$(item).hasClass("item_title"))
    .map((item, index) => {
      const dom = $(item);
      const title = dom.find("a.name").text().trim();

      if (!title) {
        return null;
      }

      const barStyle = dom.find(".bar_inner").attr("style") || "";
      const heat = Number(barStyle.match(/width:\s*(\d+)%/)?.[1] || 0) || undefined;
      const trendClass = dom.find(".item_d i").attr("class") || "";
      const trendKey = Object.keys(trendMap).find((key) => trendClass.includes(key));
      const trend = trendKey ? trendMap[trendKey] : undefined;
      const searchUrl = `https://v.qq.com/x/search/?q=${encodeURIComponent(title)}`;

      return {
        id: `${type}-${index + 1}`,
        title,
        desc: trend ? `趋势：${trend}` : undefined,
        cover: undefined,
        author: undefined,
        hot: heat,
        timestamp: undefined,
        url: searchUrl,
        mobileUrl: searchUrl,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};
