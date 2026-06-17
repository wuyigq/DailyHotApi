import { handleRoute as baseHandleRoute } from "./ithome.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "ithome-daily",
  {},
  { type: "日榜" },
);
