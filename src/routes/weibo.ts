import type { ListContext, Options, RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";

const typeMap = {
  realtime: {
    name: "热搜榜",
    link: "https://s.weibo.com/top/summary/",
  },
  entrank: {
    name: "文娱榜",
    link: "https://s.weibo.com/top/summary?cate=entrank",
  },
  socialevent: {
    name: "社会榜",
    link: "https://s.weibo.com/top/summary?cate=socialevent",
  },
  life: {
    name: "生活榜",
    link: "https://s.weibo.com/top/summary?cate=life",
  },
} as const;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const cate = (c.req.query("cate") || "realtime") as keyof typeof typeMap;
  const currentType = typeMap[cate] || typeMap.realtime;
  const listData = await getList({ cate }, noCache);
  const routeData: RouterData = {
    name: "weibo",
    title: "微博",
    type: currentType.name,
    description: "实时热点，每分钟更新一次",
    link: currentType.link,
    params: {
      cate: {
        name: "榜单分类",
        type: Object.fromEntries(Object.entries(typeMap).map(([key, value]) => [key, value.name])),
      },
    },
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const cate = (options.cate as keyof typeof typeMap) || "realtime";
  const url = new URL("https://weibo.com/ajax/side/hotSearch");
  if (cate !== "realtime") {
    url.searchParams.set("cate", cate);
  }

  const result = await get({
    url: url.toString(),
    noCache,
    ttl: 60,
    headers: {
      Referer: "https://weibo.com/hot/search",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const list = result.data?.data?.realtime || [];
  return {
    ...result,
    data: list.map((v: RouterType["weibo"]) => {
      const key = v.word_scheme ? v.word_scheme : v.word;
      return {
        id: v.rank || 0,
        title: v.word,
        desc: key,
        // author: v.flag_desc,
        timestamp: null,
        hot: v.num,
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&Refer=top`,
        mobileUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&Refer=top`,
      };
    }),
  };
};
