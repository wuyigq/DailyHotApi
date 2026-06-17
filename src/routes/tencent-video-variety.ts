import { handleRoute as baseHandleRoute } from "./tencent-video.js";
import { createRouteAlias } from "../utils/createRouteAlias.js";

export const handleRoute = createRouteAlias(
  baseHandleRoute,
  "tencent-video-variety",
  { type: "10" },
);
