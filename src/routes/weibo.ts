import type { RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "weibo",
    title: "微博",
    type: "热搜榜",
    description: "实时热点，每分钟更新一次",
    link: "https://s.weibo.com/top/summary/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = "https://weibo.com/ajax/side/hotSearch";

  const result = await get({
    url,
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
