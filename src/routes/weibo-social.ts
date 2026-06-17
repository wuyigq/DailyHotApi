import { handleRoute as baseHandleRoute } from "./weibo.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "weibo-social",
  { cate: "socialevent" },
  {
    title: "微博",
    type: "社会榜",
    link: "https://s.weibo.com/top/summary?cate=socialevent",
  },
);
