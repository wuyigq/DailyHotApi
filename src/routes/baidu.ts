import type { RouterData, ListContext, Options, RouterResType } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";

const typeMap: Record<string, string> = {
  realtime: "热搜",
  novel: "小说",
  movie: "电影",
  teleplay: "电视剧",
  car: "汽车",
  game: "游戏",
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = c.req.query("type") || "realtime";
  const listData = await getList({ type }, noCache);
  const routeData: RouterData = {
    name: "baidu",
    title: "百度",
    type: typeMap[type],
    params: {
      type: {
        name: "热搜类别",
        type: typeMap,
      },
    },
    link: "https://top.baidu.com/board",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (options: Options, noCache: boolean): Promise<RouterResType> => {
  const { type } = options;
  const url = `https://top.baidu.com/board?tab=${type}`;
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/1.0 Mobile/12F69 Safari/605.1.15",
    },
  });
  // 正则查找
  const pattern = /<!--s-data:(.*?)-->/s;
  const matchResult = result.data.match(pattern);
  if (!matchResult) {
    return { ...result, data: [] };
  }
  const sData = JSON.parse(matchResult[1]);
  // 新版百度页面结构：cards[0].content[0].content
  let items: any[] = [];
  if (sData.cards?.[0]?.content) {
    const content = sData.cards[0].content;
    if (Array.isArray(content) && content.length > 0 && content[0].content) {
      items = content[0].content;
    } else {
      items = content;
    }
  }
  return {
    ...result,
    data: items.map((v: RouterType["baidu"]) => ({
      id: v.index,
      title: v.word,
      desc: v.desc || "",
      cover: v.img || "",
      author: v.show?.length ? v.show : "",
      timestamp: 0,
      hot: Number(v.hotTag || v.hotScore || 0),
      url: v.url || `https://www.baidu.com/s?wd=${encodeURIComponent(v.query || v.word || "")}`,
      mobileUrl: v.rawUrl || v.url || "",
    })),
  };
};
