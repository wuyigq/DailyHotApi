import { handleRoute as baseHandleRoute } from "./aliyun.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "aliyun-recommend",
  { type: "recommend" },
);
