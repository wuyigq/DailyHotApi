import { handleRoute as baseHandleRoute } from "./smzdm.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "smzdm-featured",
  { type: "featured" },
  {
    title: "什么值得买",
    type: "精选好价",
    link: "https://www.smzdm.com/jingxuan/",
  },
);
