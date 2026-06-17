import type { ListContext, RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

const typeMap: Record<string, { title: string; slug: string }> = {
  "home-garden": {
    title: "家电新品榜",
    slug: "home-garden",
  },
  handmade: {
    title: "手工新品榜",
    slug: "handmade",
  },
  "office-products": {
    title: "办公用品新品榜",
    slug: "office-products",
  },
  pc: {
    title: "计算机及配件新品榜",
    slug: "pc",
  },
};

const amazonHost = "https://www.amazon.com";

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const requestedType = c.req.query("type") || "home-garden";
  const currentType = typeMap[requestedType] ? requestedType : "home-garden";
  const listData = await getList(currentType, noCache);

  const routeData: RouterData = {
    name: "amazon",
    title: "亚马逊",
    type: typeMap[currentType].title,
    params: {
      type: {
        name: "榜单分类",
        type: Object.fromEntries(
          Object.entries(typeMap).map(([key, value]) => [key, value.title]),
        ),
      },
    },
    link: `${amazonHost}/gp/new-releases/${typeMap[currentType].slug}`,
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (type: string, noCache: boolean) => {
  const url = `${amazonHost}/gp/new-releases/${typeMap[type].slug}`;
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
  const list = $("[data-asin]")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const asin = dom.attr("data-asin") || `${type}-${index + 1}`;
      const title =
        dom.find("._cDEzb_p13n-sc-css-line-clamp-3_g3dy1").first().text().trim() ||
        dom.find("img").attr("alt")?.trim() ||
        "";
      const href = dom.find("a.a-link-normal").first().attr("href") || "";
      const rating = dom.find(".a-icon-row .a-icon-alt").first().text().trim();
      const ratingCountText = dom.find(".a-icon-row .a-size-small").first().text().trim();
      const price = dom.find(".p13n-sc-price").first().text().trim();
      const hot = Number(ratingCountText.replace(/[^\d]/g, "")) || undefined;

      if (!title || !href) {
        return null;
      }

      const descParts = [rating, price ? `价格：${price}` : ""].filter(Boolean);

      return {
        id: asin,
        title,
        cover: dom.find("img").attr("src") || undefined,
        author: undefined,
        desc: descParts.join(" · ") || undefined,
        hot,
        timestamp: undefined,
        url: new URL(href, amazonHost).toString(),
        mobileUrl: new URL(href, amazonHost).toString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};
