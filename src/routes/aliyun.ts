import type { ListContext, RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const typeMap: Record<string, { title: string; url: string }> = {
  iot: {
    title: "物联网",
    url: "https://developer.aliyun.com/iot/",
  },
  recommend: {
    title: "推荐阅读",
    url: "https://developer.aliyun.com/indexFeed/",
  },
};

const aliyunBaseUrl = "https://developer.aliyun.com";

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const requestedType = c.req.query("type") || "iot";
  const currentType = typeMap[requestedType] ? requestedType : "iot";
  const listData = await getList(currentType, noCache);

  const routeData: RouterData = {
    name: "aliyun",
    title: "阿里云",
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

  const list =
    type === "iot"
      ? $("div.community-list > div.feed-item")
          .toArray()
          .map((item, index) => {
            const dom = $(item);
            const href = dom.find("a.feed-item-content-title").attr("href") || "";
            const title = dom.find("a.feed-item-content-title h3").text().trim();

            if (!title || !href) {
              return null;
            }

            const hotText = dom.find(".feed-item-count").first().text().trim();
            const timeText = dom.find(".feed-item-content-top-time").first().text().trim();

            return {
              id: href.match(/article\/(\d+)/)?.[1] || `${type}-${index + 1}`,
              title,
              cover: undefined,
              author: dom.find(".feed-item-content-top-author-link").first().text().trim() || undefined,
              desc: dom.find(".feed-item-content-desc").first().text().replace(/\s+/g, " ").trim() || undefined,
              hot: Number(hotText.replace(/[^\d]/g, "")) || undefined,
              timestamp: timeText ? getTime(timeText) : undefined,
              url: new URL(href, aliyunBaseUrl).toString(),
              mobileUrl: new URL(href, aliyunBaseUrl).toString(),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
      : $("ul.feed-list > li.feed-item.feed-article")
          .toArray()
          .map((item, index) => {
            const dom = $(item);
            const href = dom.find('a[href*="/article/"]').first().attr("href") || "";
            const title = dom.find(".feed-article-title").first().text().trim();

            if (!title || !href) {
              return null;
            }

            const timeText = dom.find(".feed-article-time").first().text().trim();
            const hotText = dom.find(".feed-article-count").first().text().trim();

            return {
              id: href.match(/article\/(\d+)/)?.[1] || `${type}-${index + 1}`,
              title,
              cover: undefined,
              author: dom.find(".feed-article-username").first().text().trim() || undefined,
              desc: undefined,
              hot: Number(hotText.replace(/[^\d]/g, "")) || undefined,
              timestamp: timeText ? getTime(timeText) : undefined,
              url: new URL(href, aliyunBaseUrl).toString(),
              mobileUrl: new URL(href, aliyunBaseUrl).toString(),
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};
