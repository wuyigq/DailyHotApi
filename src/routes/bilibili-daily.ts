import { handleRoute as baseHandleRoute } from "./bilibili.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "bilibili-daily",
  { type: "0" },
  { type: "日榜" },
);
