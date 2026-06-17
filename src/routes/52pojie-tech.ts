import { handleRoute as baseHandleRoute } from "./52pojie.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(baseHandleRoute, "52pojie-tech", { type: "tech" });
