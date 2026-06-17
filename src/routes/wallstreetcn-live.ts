import { handleRoute as baseHandleRoute } from "./wallstreetcn.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "wallstreetcn-live",
  { type: "live" },
);
