import type { ListContext, RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const typeMap: Record<string, { title: string; url: string }> = {
  newthread: {
    title: "最新主题",
    url: "https://www.right.com.cn/forum/forum.php?mod=guide&view=newthread",
  },
};

const forumBaseUrl = "https://www.right.com.cn/forum/";

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const requestedType = c.req.query("type") || "newthread";
  const currentType = typeMap[requestedType] ? requestedType : "newthread";
  const listData = await getList(currentType, noCache);

  const routeData: RouterData = {
    name: "enshan",
    title: "恩山论坛",
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
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });

  const $ = load(result.data, { xmlMode: false });
  const list = $(".threadlist > ul > li.list")
    .toArray()
    .map((item, index) => {
      const dom = $(item);
      const href = dom.find('a[href^="thread-"]').first().attr("href") || "";
      const title = dom.find(".threadlist_tit em").first().text().replace(/\s+/g, " ").trim();

      if (!title || !href) {
        return null;
      }

      const author = dom.find(".muser .mmc").first().text().trim() || undefined;
      const timeText = dom.find(".muser .mtime").first().text().trim();
      const forumName = dom.find(".threadlist_foot .mr a").first().text().trim();
      const desc = dom.find(".threadlist_mes").first().text().replace(/\s+/g, " ").trim();
      const statItems = dom
        .find(".threadlist_foot li")
        .toArray()
        .map((li) => $(li).text().replace(/\s+/g, "").trim())
        .filter(Boolean);
      const replyCount = Number(statItems.at(-1)?.replace(/[^\d]/g, "") || 0) || undefined;

      return {
        id: href.match(/thread-(\d+)-/)?.[1] || `${type}-${index + 1}`,
        title,
        cover: undefined,
        author,
        desc: [desc, forumName ? `版块：${forumName}` : ""].filter(Boolean).join(" · "),
        hot: replyCount,
        timestamp: timeText ? getTime(timeText) : undefined,
        url: new URL(href, forumBaseUrl).toString(),
        mobileUrl: new URL(href, forumBaseUrl).toString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    ...result,
    data: list,
  };
};
