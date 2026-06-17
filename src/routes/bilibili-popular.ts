import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

type PopularItem = {
  bvid: string;
  title: string;
  desc?: string;
  pic?: string;
  owner?: {
    name?: string;
  };
  stat?: {
    view?: number;
  };
  pubdate?: number;
  short_link_v2?: string;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "bilibili-popular",
    title: "哔哩哔哩",
    type: "综合热门",
    description: "你所热爱的，就是你的生活",
    link: "https://www.bilibili.com/v/popular/all",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1",
    noCache,
    headers: {
      Referer: "https://www.bilibili.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const list = (result.data?.data?.list || []) as PopularItem[];
  return {
    ...result,
    data: list.map((item) => ({
      id: item.bvid,
      title: item.title,
      desc: item.desc || "该视频暂无简介",
      cover: item.pic?.replace(/^http:/, "https:"),
      author: item.owner?.name,
      hot: item.stat?.view || undefined,
      timestamp: getTime(item.pubdate || 0),
      url: item.short_link_v2 || `https://www.bilibili.com/video/${item.bvid}`,
      mobileUrl: `https://m.bilibili.com/video/${item.bvid}`,
    })),
  };
};
