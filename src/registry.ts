import { config } from "./config.js";
import { Hono } from "hono";
import getRSS from "./utils/getRSS.js";
import { allRoutePath, excludeRoutes } from "./route-manifest.js";

const app = new Hono();

// 注册全部路由
for (let index = 0; index < allRoutePath.length; index++) {
  const router = allRoutePath[index];
  // 是否处于排除名单
  if (excludeRoutes.includes(router)) {
    continue;
  }
  const listApp = app.basePath(`/${router}`);
  // 返回榜单
  listApp.get("/", async (c) => {
    // 是否采用缓存
    const noCache = c.req.query("cache") === "false";
    // 限制显示条目
    const limit = c.req.query("limit");
    // 是否输出 RSS
    const rssEnabled = c.req.query("rss") === "true";
    // 获取路由路径
    const { handleRoute } = await import(`./routes/${router}.js`);
    const listData = await handleRoute(c, noCache);
    // 是否限制条目
    if (limit && listData?.data?.length > parseInt(limit)) {
      listData.total = parseInt(limit);
      listData.data = listData.data.slice(0, parseInt(limit));
    }
    // 是否输出 RSS
    if (rssEnabled || config.RSS_MODE) {
      const rss = getRSS(listData);
      if (typeof rss === "string") {
        c.header("Content-Type", "application/xml; charset=utf-8");
        return c.body(rss);
      } else {
        return c.json({ code: 500, message: "RSS generation failed" }, 500);
      }
    }
    return c.json({ code: 200, ...listData });
  });
  // 请求方式错误
  listApp.all("*", (c) => c.json({ code: 405, message: "Method Not Allowed" }, 405));
}

// 获取全部路由
app.get("/all", (c) =>
  {
    const page = Math.max(Number(c.req.query("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(c.req.query("pageSize") || 20), 1), 100);
    const start = (page - 1) * pageSize;
    const pagedRoutes = allRoutePath.slice(start, start + pageSize);

    return c.json(
      {
        code: 200,
        count: allRoutePath.length,
        page,
        pageSize,
        hasMore: start + pageSize < allRoutePath.length,
        routes: pagedRoutes.map((path) => {
          if (excludeRoutes.includes(path)) {
            return {
              name: path,
              path: undefined,
              message: "This interface is temporarily offline",
            };
          }
          return { name: path, path: `/${path}` };
        }),
      },
      200,
    );
  },
);

export default app;
