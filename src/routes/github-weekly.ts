import { handleRoute as baseHandleRoute } from "./github.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "github-weekly",
  { type: "weekly" },
  { title: "GitHub", type: "周榜" },
);
