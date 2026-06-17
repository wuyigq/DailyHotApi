import type { RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { post } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "huxiu",
    title: "虎嗅",
    type: "24小时",
    link: "https://www.huxiu.com/moment/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

// 标题处理
const titleProcessing = (text: string) => {
  const paragraphs = text.split("<br><br>");
  const title = paragraphs.shift()?.replace(/。$/, "");
  const intro = paragraphs.join("<br><br>");
  return { title, intro };
};

const getList = async (noCache: boolean) => {
  const url = `https://api-ms-moment.huxiu.com/v2/moment/feedLatest`;
  const result = await post({
    url,
    noCache,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      platform: "www",
      pagesize: "20",
      last_id: "0",
      moment_vest_category_id: "0",
    }).toString(),
  });
  const jsonObject = Array.isArray(result.data?.data?.datalist) ? result.data.data.datalist : [];
  return {
    ...result,
    data: jsonObject.map((v: RouterType["huxiu"]) => ({
      id: v.object_id,
      title: titleProcessing(v.content).title,
      desc: titleProcessing(v.content).intro,
      author: v.user_info.username,
      timestamp: getTime(v.publish_time),
      hot: undefined,
      url: v.share_info?.share_url?.replace("https://m.huxiu.com", "https://www.huxiu.com") ||
        v.url ||
        `https://www.huxiu.com/moment/${v.object_id}.html`,
      mobileUrl: v.share_info?.share_url || v.url || `https://m.huxiu.com/moment/${v.object_id}.html`,
    })),
  };
};
