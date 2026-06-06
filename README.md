# 🔥 今日热榜

聚合全网热门数据的 API 接口，支持 50+ 平台实时热榜。

## ✨ 特性

- **拖拽排序** — 鼠标按住卡片 `⋮⋮` 手柄拖拽即可自由排列热榜顺序，自动保存
- **卡片隐藏** — 不想看的热榜点 `✕` 一键关闭，可通过设置面板随时恢复
- **JSON + RSS 双模式** — 访问 `/路由名` 获取 JSON，`/路由名/rss` 获取 RSS
- **自动缓存** — 默认 60 分钟，可在 `.env` 中调整

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 生产模式
npm run build && npm run start
```

启动后访问 `http://localhost:6688/hot`

## 🐍 环境要求

- **Node.js** >= 20
- **Python** >= 3.10 + **Scrapling**（快手接口 TLS 绕过）

```bash
pip install scrapling
```

## 📊 接口列表

| 站点 | 调用名 | 类型 |
|------|--------|------|
| 哔哩哔哩 | `/bilibili` | 热门榜 |
| 微博 | `/weibo` | 热搜榜 |
| 知乎 | `/zhihu` | 热榜 |
| 知乎日报 | `/zhihu-daily` | 推荐榜 |
| 抖音 | `/douyin` | 热点榜 |
| 快手 | `/kuaishou` | 热点榜 |
| 百度贴吧 | `/tieba` | 热议榜 |
| 豆瓣电影 | `/douban-movie` | 新片榜 |
| 豆瓣小组 | `/douban-group` | 讨论精选 |
| 今日头条 | `/toutiao` | 热榜 |
| 36氪 | `/36kr` | 热榜 |
| 虎扑 | `/hupu` | 步行街热帖 |
| 掘金 | `/juejin` | 热榜 |
| V2EX | `/v2ex` | 主题榜 |
| GitHub | `/github` | Trending |
| Hacker News | `/hackernews` | 热榜 |
| Product Hunt | `/producthunt` | Trending |
| 少数派 | `/sspai` | 热榜 |
| IT之家 | `/ithome` | 热榜 |
| 果壳 | `/guokr` | 热门文章 |
| 澎湃新闻 | `/thepaper` | 热榜 |
| 腾讯新闻 | `/qq-news` | 热点榜 |
| 网易新闻 | `/netease-news` | 热点榜 |
| 新浪新闻 | `/sina-news` | 热点榜 |
| 虎嗅 | `/huxiu` | 24小时 |
| 爱范儿 | `/ifanr` | 快讯 |
| 酷安 | `/coolapk` | 热榜 |
| 吾爱破解 | `/52pojie` | 榜单 |
| CSDN | `/csdn` | 排行榜 |
| 51CTO | `/51cto` | 推荐榜 |
| 简书 | `/jianshu` | 热门推荐 |
| 微信读书 | `/weread` | 飙升榜 |
| 历史上的今天 | `/history` | 月-日 |
| 中央气象台 | `/weatheralarm` | 全国气象预警 |
| 原神 | `/genshin` | 最新消息 |
| 崩坏：星穹铁道 | `/starrail` | 最新动态 |
| 英雄联盟 | `/lol` | 更新公告 |
| NGA | `/ngabbs` | 热帖 |
| Linux.do | `/linuxdo` | 最新动态 |
| ... | | |

> 完整列表见 [`src/registry.ts`](src/registry.ts)，可自行添加新站点。

## ⚙️ 配置

复制 `.env.example` 为 `.env`，按需修改：

```env
PORT=6688              # 端口
CACHE_TTL=3600         # 缓存时长（秒）
REQUEST_TIMEOUT=6000   # 请求超时（毫秒）
RSS_MODE=false         # RSS 模式
```

## 🛠️ 技术栈

- **后端**: Node.js + TypeScript + Hono
- **前端**: SSR (Hono JSX) + 原生 JavaScript
- **爬虫**: Axios + Cheerio + Scrapling (Python)
- **缓存**: NodeCache + Redis（可选）

## 📄 License

MIT
