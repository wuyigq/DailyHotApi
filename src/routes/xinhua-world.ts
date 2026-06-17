import { handleRoute as baseHandleRoute } from "./xinhua.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(baseHandleRoute, "xinhua-world", { type: "world" });
