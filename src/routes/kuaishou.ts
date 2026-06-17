import type { RouterType } from "../router.types.js";
import type { ListItem, RouterData } from "../types.js";
import { parseChineseNumber } from "../utils/getNum.js";
import { getCache, setCache, delCache } from "../utils/cache.js";
import { config } from "../config.js";
import logger from "../utils/logger.js";
import { get } from "../utils/getData.js";

const KUAISHOU_URL = "https://www.kuaishou.com/?isHome=1";
const CACHE_KEY = "kuaishou-hot-list";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const { fromCache, updateTime, data } = await getList(noCache);
  const routeData: RouterData = {
    name: "kuaishou",
    title: "快手",
    type: "热榜",
    description: "快手，拥抱每一种生活",
    link: "https://www.kuaishou.com/",
    total: data?.length || 0,
    fromCache,
    updateTime,
    data,
  };
  return routeData;
};

/**
 * Fetch Kuaishou homepage HTML directly from the public site.
 */
const fetchHtml = async (): Promise<string> => {
  logger.info("🌐 [Kuaishou] Fetching page via HTTP...");
  const result = await get({
    url: KUAISHOU_URL,
    noCache: true,
    responseType: "text",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Referer: "https://www.kuaishou.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });
  return String(result.data);
};

const getList = async (noCache: boolean) => {
  // Check cache
  if (noCache) {
    await delCache(CACHE_KEY);
  } else {
    const cached = await getCache(CACHE_KEY);
    if (cached?.data) {
      logger.info("💾 [CHCHE] The request is cached");
      return {
        fromCache: true,
        updateTime: cached.updateTime,
        data: cached.data as ListItem[],
      };
    }
  }

  // Fetch homepage HTML and parse the embedded Apollo state.
  const html = await fetchHtml();

  const listData: ListItem[] = [];
  const pattern = /window\.__APOLLO_STATE__=(.*?);\(function\(\)/s;
  const matchResult = html.match(pattern);
  if (!matchResult?.[1]) {
    throw new Error("Failed to parse __APOLLO_STATE__ from Kuaishou page");
  }

  const jsonObject = JSON.parse(matchResult[1])["defaultClient"];
  const allItems =
    jsonObject['$ROOT_QUERY.visionHotRank({"page":"home"})']["items"];

  allItems?.forEach((item: { id: string }) => {
    const hotItem: RouterType["kuaishou"] = jsonObject[item.id];
    if (!hotItem) return;
    const id = hotItem.photoIds?.json?.[0];
    listData.push({
      id: hotItem.id,
      title: hotItem.name,
      cover: hotItem.poster ? decodeURIComponent(hotItem.poster) : "",
      hot: parseChineseNumber(hotItem.hotValue),
      timestamp: undefined,
      url: id
        ? `https://www.kuaishou.com/short-video/${id}`
        : "https://www.kuaishou.com/",
      mobileUrl: id
        ? `https://www.kuaishou.com/short-video/${id}`
        : "https://www.kuaishou.com/",
    });
  });

  const updateTime = new Date().toISOString();
  await setCache(CACHE_KEY, { data: listData, updateTime }, config.CACHE_TTL);

  return {
    fromCache: false,
    updateTime,
    data: listData,
  };
};
