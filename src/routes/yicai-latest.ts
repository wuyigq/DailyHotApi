import { handleRoute as baseHandleRoute } from "./yicai.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(baseHandleRoute, "yicai-latest", { type: "latest" });
