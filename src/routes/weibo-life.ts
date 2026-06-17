import { handleRoute as baseHandleRoute } from "./weibo.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "weibo-life",
  { cate: "life" },
  {
    title: "微博",
    type: "生活榜",
    link: "https://s.weibo.com/top/summary?cate=life",
  },
);
