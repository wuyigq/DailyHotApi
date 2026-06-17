import { handleRoute as baseHandleRoute } from "./seedhub.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(baseHandleRoute, "seedhub-update", { type: "update" });
