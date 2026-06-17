import { handleRoute as baseHandleRoute } from "./weibo.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "weibo-ent",
  { cate: "entrank" },
  {
    title: "微博",
    type: "文娱榜",
    link: "https://s.weibo.com/top/summary?cate=entrank",
  },
);
