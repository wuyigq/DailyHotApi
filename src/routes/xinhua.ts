import type { RouterData, ListContext, Options } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const typeMap = {
  politics: {
    name: "时政关注",
    link: "https://www.news.cn/politics/",
  },
  world: {
    name: "国际",
    link: "https://www.news.cn/world/",
  },
} as const;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "politics") as keyof typeof typeMap;
  const currentType = typeMap[type] || typeMap.politics;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "xinhua",
    title: "新华网",
    type: currentType.name,
    params: {
      type: {
        name: "榜单分类",
        type: Object.fromEntries(Object.entries(typeMap).map(([key, value]) => [key, value.name])),
      },
    },
    link: currentType.link,
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "politics";
  const currentType = typeMap[type] || typeMap.politics;
  const result = await get({
    url: currentType.link,
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const $ = load(result.data);
  const itemMap = new Map<string, { title: string; url: string }>();

  $('a[href*="/20"]').each((_, element) => {
    const dom = $(element);
    const href = dom.attr("href");
    const title = dom.text().trim();
    if (!href || !title || !/\/20\d{6}\//.test(href) || !/\/c\.html?$/.test(href)) {
      return;
    }

    const url = new URL(href, "https://www.news.cn").toString().replace(/^http:\/\//, "https://");
    if (!itemMap.has(url)) {
      itemMap.set(url, { title, url });
    }
  });

  const list = [...itemMap.values()]
    .map((item) => {
      const matchedDate = item.url.match(/\/(20\d{2})(\d{2})(\d{2})\//);
      return {
        ...item,
        timestamp: matchedDate
          ? getTime(`${matchedDate[1]}-${matchedDate[2]}-${matchedDate[3]}`)
          : undefined,
      };
    })
    .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
    .slice(0, 20);

  return {
    ...result,
    data: list.map((item, index) => {
      return {
        id: item.url || index,
        title: item.title,
        desc: undefined,
        author: "新华网",
        hot: undefined,
        timestamp: item.timestamp,
        url: item.url,
        mobileUrl: item.url,
      };
    }),
  };
};
