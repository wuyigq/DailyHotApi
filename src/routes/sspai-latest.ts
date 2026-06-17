import type { RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "sspai-latest",
    title: "少数派",
    type: "最新文章",
    link: "https://sspai.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://sspai.com/",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const $ = load(String(result.data));
  const seen = new Set<string>();
  const list = $('article.comp__ArticleCard a[href^="/post/"]')
    .toArray()
    .map((item, index) => {
      const anchor = $(item);
      const href = anchor.attr("href") || "";
      const title = anchor.find(".article__card__title").text().trim();
      if (!href || !title || seen.has(href)) {
        return null;
      }
      seen.add(href);

      return {
        id: href.replace("/post/", "") || index,
        title,
        desc: anchor.find(".article__card__summary").text().trim() || undefined,
        cover: anchor.find(".article__card__cover img").attr("src") || undefined,
        author:
          anchor.find(".article__card__author__name span").first().text().trim() || "少数派",
        hot: undefined,
        timestamp: undefined,
        url: new URL(href, "https://sspai.com").toString(),
        mobileUrl: new URL(href, "https://sspai.com").toString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 20);

  return {
    ...result,
    data: list,
  };
};
