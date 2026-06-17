import type { RouterData } from "../types.js";
import type { RouterType } from "../router.types.js";
import { get } from "../utils/getData.js";
import { getTime } from "../utils/getTime.js";

export const handleRoute = async (_: undefined, noCache: boolean) => {
  const listData = await getList(noCache);
  const routeData: RouterData = {
    name: "earthquake",
    title: "中国地震台网",
    type: "地震速报",
    link: "https://www.ceic.ac.cn/",
    total: listData.data?.length || 0,
    ...listData,
  };
  return routeData;
};

const getList = async (noCache: boolean) => {
  const url = `https://www.ceic.ac.cn/data/data.json`;
  const result = await get({ url, noCache });
  const list = Array.isArray(result.data) ? result.data : [];
  return {
    ...result,
    data: list.map((v: RouterType["earthquake"]) => {
      const contentBuilder = [
        `发震时刻(UTC+8)：${v.time}`,
        `参考位置：${v.location}`,
        `震级(M)：${v.magnitude}`,
        `纬度(°)：${v.latitude}`,
        `经度(°)：${v.longitude}`,
        `深度(千米)：${v.depth}`,
      ];
      return {
        id: v.id,
        title: `${v.location}发生${v.magnitude}级地震`,
        desc: contentBuilder.join("\n"),
        timestamp: getTime(v.time),
        hot: undefined,
        url: "https://www.ceic.ac.cn/",
        mobileUrl: "https://www.ceic.ac.cn/",
      };
    }),
  };
};
