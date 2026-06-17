import type { RouterData } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";
import { parseChineseNumber } from "../utils/getNum.js";
import {
  decodeJsStringLiteral,
  extractSingleQuotedArgument,
} from "../utils/extractEmbeddedState.js";

type GhxiPostItem = {
  title?: string;
  thumbnail?: string;
  link?: string;
  views?: string | number;
  date?: string;
  description?: string;
  comments_count?: number;
};

const decodeBase64Maybe = (value?: string) => {
  if (!value) {
    return "";
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(value) || value.length % 4 !== 0) {
    return value;
  }
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "ghxi",
    title: "果核剥壳",
    type: "首页推荐",
    link: "https://www.ghxi.com/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://www.ghxi.com/",
    noCache,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    },
  });

  const encoded = extractSingleQuotedArgument(String(result.data), "let gh_home =JSON.parse(");
  if (!encoded) {
    throw new Error("Failed to parse ghxi home state");
  }

  const payload = JSON.parse(decodeJsStringLiteral(encoded));
  const sections = payload?.set?.home_data_main || [];
  const targetSection =
    sections.find((section: { type?: string }) => section.type === "main_post_list") ||
    sections.find((section: { post_data?: unknown[] }) => Array.isArray(section.post_data));
  const list = ((targetSection?.post_data || []) as GhxiPostItem[]).slice(0, 20);

  return {
    ...result,
    data: list.map((item, index) => ({
      id: item.link || index,
      title: decodeBase64Maybe(item.title),
      desc: decodeBase64Maybe(item.description) || undefined,
      cover: item.thumbnail || undefined,
      author: "果核剥壳",
      hot:
        typeof item.views === "number"
          ? item.views
          : item.views
            ? parseChineseNumber(item.views)
            : item.comments_count || undefined,
      timestamp: item.date ? getTime(item.date) : undefined,
      url: item.link || "https://www.ghxi.com/",
      mobileUrl: item.link || "https://www.ghxi.com/",
    })),
  };
};
