import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";

type KuaishouSearchRankItem = {
  rank: number;
  keyword: string;
  hotValue: number;
  tagWord?: string;
};

const buildSearchUrl = (keyword: string) => {
  return `https://www.kuaishou.com/search/video?searchKey=${encodeURIComponent(keyword)}`;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "kuaishou-rising",
    title: "快手",
    type: "飙升榜",
    description: "快手搜索热度飙升榜",
    link: "https://index.e.kuaishou.com/rank",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://index.e.kuaishou.com/rest/index/list/search-rank",
    noCache,
    headers: {
      Referer: "https://index.e.kuaishou.com/rank",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const list = result.data?.data || [];

  return {
    ...result,
    data: list.map((item: KuaishouSearchRankItem) => {
      const url = buildSearchUrl(item.keyword);
      return {
        id: item.rank,
        title: item.keyword,
        desc: item.tagWord || undefined,
        hot: item.hotValue,
        timestamp: undefined,
        url,
        mobileUrl: url,
      };
    }),
  };
};
