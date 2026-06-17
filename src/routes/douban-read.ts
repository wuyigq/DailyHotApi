import type { ListContext, RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

const typeMap: Record<string, { title: string; url: string }> = {
  serial: {
    title: "连载榜",
    url: "https://read.douban.com/charts/",
  },
};

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const requestedType = c.req.query("type") || "serial";
  const currentType = typeMap[requestedType] ? requestedType : "serial";
  const listData = await getList(currentType, noCache);

  const routeData: RouterData = {
    name: "douban-read",
    title: "豆瓣阅读",
    type: typeMap[currentType].title,
    params: {
      type: {
        name: "榜单分类",
        type: Object.fromEntries(
          Object.entries(typeMap).map(([key, value]) => [key, value.title]),
        ),
      },
    },
    link: typeMap[currentType].url,
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (type: string, noCache: boolean) => {
  const url = typeMap[type].url;
  const result = await get({
    url,
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });

  const $ = load(result.data);
  const list = $(".works-list > li")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const title = dom.find(".title").text().trim();

      if (!title) {
        return null;
      }

      const author = dom.find(".author a").text().trim() || undefined;
      const desc = dom.find(".abstract").text().replace(/\s+/g, " ").trim() || undefined;
      const searchUrl = `https://read.douban.com/search?q=${encodeURIComponent(title)}`;

      return {
        id: `${type}-${index + 1}`,
        title,
        cover: undefined,
        author,
        desc,
        hot: undefined,
        timestamp: undefined,
        url: searchUrl,
        mobileUrl: searchUrl,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};
