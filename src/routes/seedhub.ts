import type { RouterData, ListContext, Options } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

const typeMap = {
  date: {
    name: "上映时间",
    url: "https://www.seedhub.cc/?order=date",
  },
  view: {
    name: "近期热门",
    url: "https://www.seedhub.cc/?order=view",
  },
  update: {
    name: "最新",
    url: "https://www.seedhub.cc/?order=update",
  },
} as const;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "date") as keyof typeof typeMap;
  const currentType = typeMap[type] || typeMap.date;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "seedhub",
    title: "SeedHub",
    type: currentType.name,
    params: {
      type: {
        name: "榜单分类",
        type: Object.fromEntries(Object.entries(typeMap).map(([key, value]) => [key, value.name])),
      },
    },
    link: "https://www.seedhub.cc/",
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "date";
  const currentType = typeMap[type] || typeMap.date;
  const result = await get({ url: currentType.url, noCache });
  const $ = load(result.data);

  const list = $(".cover-container .cover")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const title = dom.find("h2").clone().children().remove().end().text().trim();
      const href = dom.find('a.image[href^="/movies/"]').attr("href") || "";
      const cover = dom.find("img").attr("src") || undefined;
      const meta = dom.find("ul li").eq(1).text().trim();
      const genre = dom
        .find("ul li")
        .eq(2)
        .text()
        .replace(/^类型:\s*/, "")
        .trim();
      const score = Number(dom.find("ul li").eq(3).text().replace(/[^\d.]/g, ""));
      const url = href ? new URL(href, "https://www.seedhub.cc").toString() : "";

      return {
        id: href || index,
        title,
        desc: [meta, genre ? `类型: ${genre}` : ""].filter(Boolean).join(" / ") || undefined,
        cover,
        author: "SeedHub",
        hot: Number.isFinite(score) && score > 0 ? score : undefined,
        timestamp: undefined,
        url,
        mobileUrl: url,
      };
    })
    .filter((item) => item.url && item.title);

  return {
    ...result,
    data: list,
  };
};
