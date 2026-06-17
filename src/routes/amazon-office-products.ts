import { handleRoute as baseHandleRoute } from "./amazon.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "amazon-office-products",
  { type: "office-products" },
);
