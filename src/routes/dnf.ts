import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

type DnfItem = {
  iActId: string;
  dtBegin?: string;
  dtEnd?: string;
  dtInputTime?: string;
  sActDetailUrl?: string;
  sBigImgUrl?: string;
  sSmallImgUrl?: string;
  sDescripion?: string;
  sName?: string;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "dnf",
    title: "地下城与勇士",
    type: "活动",
    link: "https://dnf.qq.com/web202511/act.html",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://dnf.qq.com/activityCenter2018/js/Dnf_actListOnline_3.js";
  const result = await get({ url, noCache, responseType: "arraybuffer" });
  const source = decodeGbk(result.data);
  const list = extractList(source);

  return {
    ...result,
    data: list.map((item: DnfItem) => ({
      id: item.iActId,
      title: decodeHtml(item.sName || "DNF活动"),
      cover: item.sBigImgUrl || item.sSmallImgUrl || undefined,
      desc: decodeHtml(item.sDescripion || ""),
      hot: undefined,
      timestamp: item.dtInputTime || item.dtBegin ? getTime(item.dtInputTime || item.dtBegin || "") : undefined,
      url: item.sActDetailUrl || "https://dnf.qq.com/web202511/act.html",
      mobileUrl: item.sActDetailUrl || "https://dnf.qq.com/web202511/act.html",
    })),
  };
};

const extractList = (source: string): DnfItem[] => {
  const match = source.match(/var\s+DNF_ACTLIST_ONLINE_3\s*=\s*(\[[\s\S]*?\]);?/);
  if (!match) return [];

  try {
    return JSON.parse(match[1]) as DnfItem[];
  } catch {
    return [];
  }
};

const decodeGbk = (data: unknown) => {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
  return new TextDecoder("gbk").decode(buffer);
};

const decodeHtml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
