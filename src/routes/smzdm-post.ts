import { handleRoute as baseHandleRoute } from "./smzdm.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "smzdm-post",
  { type: "post" },
  {
    title: "什么值得买",
    type: "最新文章",
    link: "https://post.smzdm.com/",
  },
);
