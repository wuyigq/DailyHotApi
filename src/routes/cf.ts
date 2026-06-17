import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

type CfItem = {
  iNewsId?: string | number;
  sTitle: string;
  sDesc?: string;
  sIMG?: string;
  sRedirectURL?: string;
  sIdxTime?: string;
  iTotalPlay?: string | number;
  sCoverList?: Array<{ url?: string }>;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "cf",
    title: "CF穿越火线",
    type: "活动专区",
    link: "https://cf.qq.com/web202410/actions.html",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url =
    "https://apps.game.qq.com/wmp/v3.1/?p0=1&p1=searchNewsKeywordsList&page=1&pagesize=20&order=sIdxTime&r0=json&type=iSubType&id=559&source=web_pc";
  const result = await get({ url, noCache });
  const list = result.data?.msg?.result || [];

  return {
    ...result,
    data: list.map((item: CfItem) => ({
      id: item.iNewsId || item.sRedirectURL || item.sTitle,
      title: item.sTitle,
      cover: normalizeImage(item.sCoverList?.[1]?.url || item.sCoverList?.[0]?.url || item.sIMG),
      desc: parseDesc(item.sDesc),
      hot: toNumber(item.iTotalPlay),
      timestamp: parseDate(item.sDesc) || item.sIdxTime ? getTime(parseDate(item.sDesc) || item.sIdxTime || "") : undefined,
      url: normalizeUrl(item.sRedirectURL),
      mobileUrl: normalizeUrl(item.sRedirectURL),
    })),
  };
};

const parseDesc = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split("|").map((item) => item.trim()).filter(Boolean);
  return parts[2] || parts[parts.length - 1] || undefined;
};

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split("|").map((item) => item.trim());
  return parts[0] || undefined;
};

const normalizeUrl = (url?: string) => {
  if (!url) return "https://cf.qq.com/web202410/actions.html";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `https://cf.qq.com${url.startsWith("/") ? url : `/${url}`}`;
};

const normalizeImage = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

const toNumber = (value?: string | number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};
