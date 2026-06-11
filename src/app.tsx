import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.js";
import { serveStatic } from "@hono/node-server/serve-static";
import { compress } from "hono/compress";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";
import logger from "./utils/logger.js";
import registry from "./registry.js";
import workspace from "./workspace.js";
import robotstxt from "./robots.txt.js";
import NotFound from "./views/NotFound.js";
import Home from "./views/Home.js";
import Landing from "./views/Landing.js";
import Error from "./views/Error.js";

const app = new Hono();

// 压缩响应
app.use(compress());

// prettyJSON
app.use(prettyJSON());

// 尾部斜杠重定向
app.use(trimTrailingSlash());

// CORS
app.use(
  "*",
  cors({
    // 可写为数组
    origin: (origin) => {
      if (!origin) return config.ALLOWED_DOMAIN;
      // 如果允许任何域名，则动态返回请求源，以支持 credentials 凭证模式
      if (config.ALLOWED_DOMAIN === "*") {
        return origin;
      }
      // 是否指定域名
      const isSame = config.ALLOWED_HOST && origin.endsWith(config.ALLOWED_HOST);
      return isSame ? origin : config.ALLOWED_DOMAIN;
    },
    allowMethods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-User-Id", "X-Custom-Header", "Upgrade-Insecure-Requests"],
    credentials: true,
  }),
);

// 静态资源
app.use(
  "/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => (path === "/favicon.ico" ? "/favicon.png" : path),
  }),
);

// 主路由
app.route("/", registry);
// AI 热点内容工作台 MVP
app.route("/workspace", workspace);

// robots
app.get("/robots.txt", robotstxt);
// 首页入口
app.get("/", (c) => c.html(<Landing />));
// 热榜数据页
app.get("/hot", (c) => c.html(<Home />));
// 404
app.notFound((c) => c.html(<NotFound />, 404));
// error
app.onError((err, c) => {
  logger.error(`❌ [ERROR] ${err?.message}`);
  return c.html(<Error error={err?.message} />, 500);
});

export default app;
