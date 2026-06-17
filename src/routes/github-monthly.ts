import { handleRoute as baseHandleRoute } from "./github.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "github-monthly",
  { type: "monthly" },
  { title: "GitHub", type: "月榜" },
);
