import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

type KuaishouTubeRankItem = {
  rank: number;
  tubeName: string;
  channelName?: string;
  popularityValue?: number;
  poster?: string;
  playCount?: number;
  likeCount?: number;
  onlineTime?: number;
  url?: string;
};

const normalizeCoverUrl = (value?: string) => {
  if (!value) return undefined;
  return value.replace(/^http:\/\//, "https://");
};

const buildDesc = (item: KuaishouTubeRankItem) => {
  const parts = [
    item.channelName,
    item.playCount ? `播放 ${item.playCount}` : "",
    item.likeCount ? `点赞 ${item.likeCount}` : "",
  ].filter(Boolean);
  return parts.join(" / ") || undefined;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "kuaishou-theater",
    title: "快手",
    type: "短剧热播榜",
    description: "快手短剧热播排行",
    link: "https://index.e.kuaishou.com/rank",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://index.e.kuaishou.com/rest/index/list/tube-rank",
    noCache,
    headers: {
      Referer: "https://index.e.kuaishou.com/rank",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const list = result.data?.data?.topRank || [];

  return {
    ...result,
    data: list.map((item: KuaishouTubeRankItem) => {
      const url = item.url || "https://www.kuaishou.com/";
      return {
        id: item.rank,
        title: item.tubeName,
        desc: buildDesc(item),
        cover: normalizeCoverUrl(item.poster),
        author: item.channelName,
        hot: item.popularityValue,
        timestamp: getTime(item.onlineTime || 0),
        url,
        mobileUrl: url,
      };
    }),
  };
};
