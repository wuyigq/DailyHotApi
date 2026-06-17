import type { RouterData, ListContext, Options } from "../types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const typeMap = {
  latest: "最新",
  live: "快讯",
  breakfast: "早餐",
} as const;

type WallstreetcnArticleItem = {
  resource_type?: string;
  resource?: {
    id: number;
    title?: string;
    uri?: string;
    content_short?: string;
    display_time?: number;
    image?: {
      uri?: string;
    };
    author?: {
      display_name?: string;
    };
    comment_count?: number;
  };
};

type WallstreetcnLiveItem = {
  id: number;
  uri?: string;
  title?: string;
  content?: string;
  content_text?: string;
  display_time?: number;
  author?: {
    display_name?: string;
  };
  images?: Array<{
    uri?: string;
  }>;
  score?: number;
};

const stripHtml = (value?: string) =>
  value
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim() || undefined;

export const handleRoute = async (c: ListContext, noCache: boolean) => {
  const type = (c.req.query("type") || "latest") as keyof typeof typeMap;
  const listData = await getList({ type }, noCache);

  const routeData: RouterData = {
    name: "wallstreetcn",
    title: "华尔街见闻",
    type: typeMap[type] || typeMap.latest,
    params: {
      type: {
        name: "榜单分类",
        type: typeMap,
      },
    },
    link: "https://wallstreetcn.com/",
    total: listData.data?.length || 0,
    ...listData,
  };

  return routeData;
};

const buildApiUrl = (path: string, params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return `https://api.wscn.net${path}?${searchParams.toString()}`;
};

const getInfoFlow = async (
  params: Record<string, string | number | undefined>,
  noCache: boolean,
) => {
  const url = buildApiUrl("/apiv1/content/information-flow", params);
  const result = await get({ url, noCache });
  return result.data.data as {
    items: WallstreetcnArticleItem[];
    next_cursor?: string;
  };
};

const getLives = async (params: Record<string, string | number | undefined>, noCache: boolean) => {
  const url = buildApiUrl("/apiv1/content/lives", params);
  const result = await get({ url, noCache });
  return {
    ...result,
    payload: result.data.data as {
      items: WallstreetcnLiveItem[];
      next_cursor?: string;
    },
  };
};

const mapArticle = (item: WallstreetcnArticleItem, index: number) => {
  const resource = item.resource;
  const url = resource?.uri || (resource?.id ? `https://wallstreetcn.com/articles/${resource.id}` : "");
  return {
    id: resource?.id || index,
    title: resource?.title || "",
    desc: stripHtml(resource?.content_short),
    cover: resource?.image?.uri,
    author: resource?.author?.display_name,
    hot: resource?.comment_count || undefined,
    timestamp: getTime(resource?.display_time || 0),
    url,
    mobileUrl: url,
  };
};

const getBreakfastList = async (noCache: boolean) => {
  const list: WallstreetcnArticleItem[] = [];
  let cursor: string | undefined;

  for (let i = 0; i < 8 && list.length < 20; i++) {
    const payload = await getInfoFlow(
      {
        channel: "global",
        accept: "article",
        limit: 50,
        action: "init",
        cursor,
      },
      noCache,
    );

    const matched = payload.items.filter(
      (item) =>
        item.resource_type === "article" &&
        item.resource?.title?.includes("早餐FM-Radio"),
    );
    list.push(...matched);

    if (!payload.next_cursor) {
      break;
    }
    cursor = payload.next_cursor;
  }

  return list.slice(0, 20).map(mapArticle);
};

const getList = async (options: Options, noCache: boolean) => {
  const type = (options.type as keyof typeof typeMap) || "latest";

  if (type === "live") {
    const result = await getLives(
      {
        channel: "global-channel",
        accept: "live,vip-live",
        limit: 20,
      },
      noCache,
    );

    return {
      ...result,
      data: result.payload.items.map((item, index) => {
        const title = item.title?.trim() || item.content_text?.trim() || stripHtml(item.content) || "";
        const url = item.uri || `https://wallstreetcn.com/livenews/${item.id}`;
        return {
          id: item.id || index,
          title,
          desc: stripHtml(item.content),
          cover: item.images?.[0]?.uri,
          author: item.author?.display_name,
          hot: undefined,
          timestamp: getTime(item.display_time || 0),
          url,
          mobileUrl: url,
        };
      }),
    };
  }

  if (type === "breakfast") {
    const data = await getBreakfastList(noCache);
    return {
      updateTime: new Date().toISOString(),
      fromCache: false,
      data,
    };
  }

  const url = buildApiUrl("/apiv1/content/information-flow", {
    channel: "global",
    accept: "article",
    limit: 20,
    action: "init",
  });
  const result = await get({ url, noCache });
  const payload = result.data.data as {
    items: WallstreetcnArticleItem[];
  };

  return {
    ...result,
    data: payload.items.map(mapArticle),
  };
};
