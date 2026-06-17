import type { RouterData } from "../types.js";
import { load } from "cheerio";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

const getNumbers = (text: string | undefined) => {
  if (!text) {
    return 0;
  }
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "douban-weekly",
    title: "豆瓣电影",
    type: "周口碑榜",
    link: "https://movie.douban.com/chart",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const result = await get({
    url: "https://movie.douban.com/chart/",
    noCache,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
    },
  });
  const $ = load(result.data);

  const updateText =
    $("h2")
      .filter((_, element) => $(element).text().includes("一周口碑榜"))
      .find(".box_chart_num")
      .first()
      .text()
      .trim() || "";
  const updateTime = updateText ? getTime(updateText.replace(" 更新", "")) : undefined;

  const list = $("#listCont2 li.clearfix")
    .toArray()
    .map((item) => {
      const dom = $(item);
      const anchor = dom.find("a").first();
      const href = anchor.attr("href") || "";
      const rankText = dom.find(".no").text().trim();
      const trendText = dom.find("span div").text().trim();

      return {
        id: getNumbers(href),
        title: anchor.text().trim(),
        desc: trendText ? `排名变化：${trendText}` : undefined,
        cover: undefined,
        author: undefined,
        hot: getNumbers(rankText),
        timestamp: updateTime,
        url: href,
        mobileUrl: href.replace("https://movie.douban.com/subject/", "https://m.douban.com/movie/subject/"),
      };
    });

  return {
    ...result,
    data: list,
  };
};
