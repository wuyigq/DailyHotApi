import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

type WildriftItem = {
  iDocID: string | number;
  sTitle: string;
  sIMG?: string;
  sDesc?: string;
  sIdxTime?: string;
  iTotalPlay?: string | number;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "wildrift",
    title: "英雄联盟手游",
    type: "新闻",
    link: "https://lolm.qq.com/news.html",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url =
    "https://apps.game.qq.com/cmc/cross?serviceId=166&source=web_pc&filter=tag&tagids=113538&typeids=1,2&start=0&limit=20&logic=or";
  const result = await get({ url, noCache });
  const list = result.data?.data?.items || [];

  return {
    ...result,
    data: list.map((item: WildriftItem) => ({
      id: item.iDocID,
      title: item.sTitle,
      cover: normalizeImage(item.sIMG),
      desc: item.sDesc || undefined,
      hot: toNumber(item.iTotalPlay),
      timestamp: item.sIdxTime ? getTime(item.sIdxTime) : undefined,
      url: `https://lolm.qq.com/v2/news-page.html?docid=${encodeURIComponent(String(item.iDocID))}`,
      mobileUrl: `https://lolm.qq.com/v2/news-page.html?docid=${encodeURIComponent(String(item.iDocID))}`,
    })),
  };
};

const normalizeImage = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

const toNumber = (value?: string | number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};
