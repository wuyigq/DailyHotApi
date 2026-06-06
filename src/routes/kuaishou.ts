import type { RouterType } from "../router.types.js";
import type { ListItem, RouterData } from "../types.js";
import { parseChineseNumber } from "../utils/getNum.js";
import { getCache, setCache, delCache } from "../utils/cache.js";
import { config } from "../config.js";
import logger from "../utils/logger.js";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SCRIPT = path.resolve(__dirname, "../../scripts/fetch_kuaishou.py");
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
 * Fetch Kuaishou homepage HTML via Python Scrapling (bypasses TLS fingerprinting)
 */
const fetchHtmlWithPython = (): string => {
  logger.info("🐍 [Kuaishou] Fetching page via Python Scrapling...");
  try {
    const result = execSync(`python "${PYTHON_SCRIPT}"`, {
      encoding: "utf-8",
      timeout: 20000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return result;
  } catch (error) {
    logger.error("❌ [Kuaishou] Python fetch failed");
    throw error;
  }
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

  // Fetch HTML via Python Scrapling
  const html = fetchHtmlWithPython();

  // Parse __APOLLO_STATE__ from the page
  const listData: ListItem[] = [];
  const pattern = /window\.__APOLLO_STATE__=(.*);\(function\(\)/s;
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
