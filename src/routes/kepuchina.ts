import type { RouterData, ListContext, Options } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

const typeMap = {
  all: "首页精选",
  article: "图文",
  video: "视频",
} as const;

type KepuItem = {
  id: string;
  title: string;
  url: string;
  mobileUrl: string;
  cover?: string;
};

const getMobileUrl = (id: string, classify: string) =>
  classify === "2"
    ? `https://m.kepuchina.cn/videodetail?id=${id}`
    : `https://m.kepuchina.cn/tuwendetail?id=${id}`;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "all") as keyof typeof typeMap;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "kepuchina",
    title: "科普中国网",
    type: typeMap[type] || typeMap.all,
    params: {
      type: {
        name: "榜单分类",
        type: typeMap,
      },
    },
    link: "https://www.kepuchina.cn/",
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "all";
  const result = await get({ url: "https://www.kepuchina.cn/", noCache });
  const $ = load(result.data);
  const itemMap = new Map<string, KepuItem & { classify: string }>();

  $('a[href*="/article/articleinfo"]').each((_, element) => {
    const dom = $(element);
    const href = dom.attr("href");
    if (!href) {
      return;
    }

    const url = new URL(href, "https://www.kepuchina.cn");
    const id = url.searchParams.get("ar_id");
    const classify = url.searchParams.get("classify") || "0";
    if (!id || itemMap.has(id)) {
      return;
    }

    const title =
      dom.text().trim() ||
      dom.attr("title") ||
      dom.find("img").attr("alt") ||
      dom.parent().text().trim();

    if (!title) {
      return;
    }

    const cover =
      dom.find("img").attr("src") ||
      dom.find("img").attr("data-src") ||
      dom.parent().find("img").first().attr("src") ||
      dom.parent().find("img").first().attr("data-src") ||
      undefined;

    itemMap.set(id, {
      id,
      classify,
      title,
      cover,
      url: url.toString(),
      mobileUrl: getMobileUrl(id, classify),
    });
  });

  const list = [...itemMap.values()].filter((item) => {
    if (type === "article") {
      return item.classify === "0";
    }
    if (type === "video") {
      return item.classify === "2";
    }
    return true;
  });

  return {
    ...result,
    data: list.slice(0, 20).map(({ classify: _, ...item }) => ({
      ...item,
      author: "科普中国",
      desc: undefined,
      hot: undefined,
      timestamp: undefined,
    })),
  };
};
