<div align="center">
<img alt="logo" height="120" src="./public/favicon.png" width="120"/>
<h2>今日热榜</h2>
<p>一个聚合热门数据的 API 接口</p>
<br />
<img src="https://img.shields.io/github/last-commit/TryNew5/DailyHotApi" alt="last commit"/>
 <img src="https://img.shields.io/github/languages/code-size/TryNew5/DailyHotApi" alt="code size"/>
 <img src="https://img.shields.io/docker/image-size/TryNew5/dailyhot-api" alt="docker-image-size"/>
<img src="https://github.com/TryNew5/DailyHotApi/actions/workflows/docker.yml/badge.svg" alt="Publish Docker image"/>
<img src="https://github.com/TryNew5/DailyHotApi/actions/workflows/npm.yml/badge.svg" alt="Publish npm package"/>
</div>

## 🚩 特性

- 极快响应，便于开发
- 支持 RSS 模式和 JSON 模式
- 支持多种部署方式
- 简明的路由目录，便于新增

## 👀 示例

> 这里是使用该 API 的示例站点  
> 示例站点可能由于访问量或者长久未维护而访问异常  
> 若您也使用了本 API 搭建了网站，欢迎提交您的站点链接

- [今日热榜 - https://hot.trynew5.github.io/](https://hot.trynew5.github.io/)

## 📊 接口总览

<details>
<summary>查看全部接口</summary>

> 示例站点运行于海外服务器，部分国内站点可能存在访问异常，请以实际情况为准

| **站点**         | **类别**     | **调用名称**   | **状态**                                                                                                                                                            |
| ---------------- | ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 哔哩哔哩         | 热门榜       | bilibili       | ![https://api-hot.trynew5.github.io/bilibili](https://img.shields.io/website.svg?label=bilibili&url=https://api-hot.trynew5.github.io/bilibili&cacheSeconds=7200)                   |
| AcFun            | 排行榜       | acfun          | ![https://api-hot.trynew5.github.io/acfun](https://img.shields.io/website.svg?label=acfun&url=https://api-hot.trynew5.github.io/acfun&cacheSeconds=7200)                            |
| 微博             | 热搜榜       | weibo          | ![https://api-hot.trynew5.github.io/weibo](https://img.shields.io/website.svg?label=weibo&url=https://api-hot.trynew5.github.io/weibo&cacheSeconds=7200)                            |
| 知乎             | 热榜         | zhihu          | ![https://api-hot.trynew5.github.io/zhihu](https://img.shields.io/website.svg?label=zhihu&url=https://api-hot.trynew5.github.io/zhihu&cacheSeconds=7200)                            |
| 知乎日报         | 推荐榜       | zhihu-daily    | ![https://api-hot.trynew5.github.io/zhihu-daily](https://img.shields.io/website.svg?label=zhihu-daily&url=https://api-hot.trynew5.github.io/zhihu-daily&cacheSeconds=7200)          |
| 百度             | 热搜榜       | baidu          | ![https://api-hot.trynew5.github.io/baidu](https://img.shields.io/website.svg?label=baidu&url=https://api-hot.trynew5.github.io/baidu&cacheSeconds=7200)                            |
| 抖音             | 热点榜       | douyin         | ![https://api-hot.trynew5.github.io/douyin](https://img.shields.io/website.svg?label=douyin&url=https://api-hot.trynew5.github.io/douyin&cacheSeconds=7200)                         |
| 快手             | 热点榜       | kuaishou       | ![https://api-hot.trynew5.github.io/kuaishou](https://img.shields.io/website.svg?label=kuaishou&url=https://api-hot.trynew5.github.io/kuaishou&cacheSeconds=7200)                   |
| 豆瓣电影         | 新片榜       | douban-movie   | ![https://api-hot.trynew5.github.io/douban-movie](https://img.shields.io/website.svg?label=douban-movie&url=https://api-hot.trynew5.github.io/douban-movie&cacheSeconds=7200)       |
| 豆瓣讨论小组     | 讨论精选     | douban-group   | ![https://api-hot.trynew5.github.io/douban-group](https://img.shields.io/website.svg?label=douban-group&url=https://api-hot.trynew5.github.io/douban-group&cacheSeconds=7200)       |
| 百度贴吧         | 热议榜       | tieba          | ![https://api-hot.trynew5.github.io/tieba](https://img.shields.io/website.svg?label=tieba&url=https://api-hot.trynew5.github.io/tieba&cacheSeconds=7200)                            |
| 少数派           | 热榜         | sspai          | ![https://api-hot.trynew5.github.io/sspai](https://img.shields.io/website.svg?label=sspai&url=https://api-hot.trynew5.github.io/sspai&cacheSeconds=7200)                            |
| IT之家           | 热榜         | ithome         | ![https://api-hot.trynew5.github.io/ithome](https://img.shields.io/website.svg?label=ithome&url=https://api-hot.trynew5.github.io/ithome&cacheSeconds=7200)                         |
| IT之家「喜加一」 | 最新动态     | ithome-xijiayi | ![https://api-hot.trynew5.github.io/ithome-xijiayi](https://img.shields.io/website.svg?label=ithome-xijiayi&url=https://api-hot.trynew5.github.io/ithome-xijiayi&cacheSeconds=7200) |
| 简书             | 热门推荐     | jianshu        | ![https://api-hot.trynew5.github.io/jianshu](https://img.shields.io/website.svg?label=jianshu&url=https://api-hot.trynew5.github.io/jianshu&cacheSeconds=7200)                      |
| 果壳             | 热门文章     | guokr          | ![https://api-hot.trynew5.github.io/guokr](https://img.shields.io/website.svg?label=guokr&url=https://api-hot.trynew5.github.io/guokr&cacheSeconds=7200)                            |
| 澎湃新闻         | 热榜         | thepaper       | ![https://api-hot.trynew5.github.io/thepaper](https://img.shields.io/website.svg?label=thepaper&url=https://api-hot.trynew5.github.io/thepaper&cacheSeconds=7200)                   |
| 今日头条         | 热榜         | toutiao        | ![https://api-hot.trynew5.github.io/toutiao](https://img.shields.io/website.svg?label=toutiao&url=https://api-hot.trynew5.github.io/toutiao&cacheSeconds=7200)                      |
| 36 氪            | 热榜         | 36kr           | ![https://api-hot.trynew5.github.io/36kr](https://img.shields.io/website.svg?label=36kr&url=https://api-hot.trynew5.github.io/36kr&cacheSeconds=7200)                               |
| 51CTO            | 推荐榜       | 51cto          | ![https://api-hot.trynew5.github.io/51cto](https://img.shields.io/website.svg?label=51cto&url=https://api-hot.trynew5.github.io/51cto&cacheSeconds=7200)                            |
| CSDN             | 排行榜       | csdn           | ![https://api-hot.trynew5.github.io/csdn](https://img.shields.io/website.svg?label=csdn&url=https://api-hot.trynew5.github.io/csdn&cacheSeconds=7200)                               |
| NodeSeek         | 最新动态     | nodeseek       | ![https://api-hot.trynew5.github.io/nodeseek](https://img.shields.io/website.svg?label=nodeseek&url=https://api-hot.trynew5.github.io/nodeseek&cacheSeconds=7200)                   |
| 稀土掘金         | 热榜         | juejin         | ![https://api-hot.trynew5.github.io/juejin](https://img.shields.io/website.svg?label=juejin&url=https://api-hot.trynew5.github.io/juejin&cacheSeconds=7200)                         |
| 腾讯新闻         | 热点榜       | qq-news        | ![https://api-hot.trynew5.github.io/qq-news](https://img.shields.io/website.svg?label=qq-news&url=https://api-hot.trynew5.github.io/qq-news&cacheSeconds=7200)                      |
| 新浪网           | 热榜         | sina           | ![https://api-hot.trynew5.github.io/sina](https://img.shields.io/website.svg?label=sina&url=https://api-hot.trynew5.github.io/sina&cacheSeconds=7200)                               |
| 新浪新闻         | 热点榜       | sina-news      | ![https://api-hot.trynew5.github.io/sina-news](https://img.shields.io/website.svg?label=sina-news&url=https://api-hot.trynew5.github.io/sina-news&cacheSeconds=7200)                |
| 网易新闻         | 热点榜       | netease-news   | ![https://api-hot.trynew5.github.io/netease-news](https://img.shields.io/website.svg?label=netease-news&url=https://api-hot.trynew5.github.io/netease-news&cacheSeconds=7200)       |
| 吾爱破解         | 榜单         | 52pojie        | ![https://api-hot.trynew5.github.io/52pojie](https://img.shields.io/website.svg?label=52pojie&url=https://api-hot.trynew5.github.io/52pojie&cacheSeconds=7200)                      |
| 全球主机交流     | 榜单         | hostloc        | ![https://api-hot.trynew5.github.io/hostloc](https://img.shields.io/website.svg?label=hostloc&url=https://api-hot.trynew5.github.io/hostloc&cacheSeconds=7200)                      |
| 虎嗅             | 24小时       | huxiu          | ![https://api-hot.trynew5.github.io/huxiu](https://img.shields.io/website.svg?label=huxiu&url=https://api-hot.trynew5.github.io/huxiu&cacheSeconds=7200)                            |
| 酷安             | 热榜         | coolapk        | ![https://api-hot.trynew5.github.io/coolapk](https://img.shields.io/website.svg?label=coolapk&url=https://api-hot.trynew5.github.io/coolapk&cacheSeconds=7200)                      |
| 虎扑             | 步行街热帖   | hupu           | ![https://api-hot.trynew5.github.io/hupu](https://img.shields.io/website.svg?label=hupu&url=https://api-hot.trynew5.github.io/hupu&cacheSeconds=7200)                               |
| 爱范儿           | 快讯         | ifanr          | ![https://api-hot.trynew5.github.io/ifanr](https://img.shields.io/website.svg?label=ifanr&url=https://api-hot.trynew5.github.io/ifanr&cacheSeconds=7200)                            |
| 英雄联盟         | 更新公告     | lol            | ![https://api-hot.trynew5.github.io/lol](https://img.shields.io/website.svg?label=lol&url=https://api-hot.trynew5.github.io/lol&cacheSeconds=7200)                                  |
| 米游社           | 最新消息     | miyoushe       | ![https://api-hot.trynew5.github.io/miyoushe](https://img.shields.io/website.svg?label=miyoushe&url=https://api-hot.trynew5.github.io/miyoushe&cacheSeconds=7200)                   |
| 原神             | 最新消息     | genshin        | ![https://api-hot.trynew5.github.io/genshin](https://img.shields.io/website.svg?label=genshin&url=https://api-hot.trynew5.github.io/genshin&cacheSeconds=7200)                      |
| 崩坏3            | 最新动态     | honkai         | ![https://api-hot.trynew5.github.io/honkai](https://img.shields.io/website.svg?label=honkai&url=https://api-hot.trynew5.github.io/honkai&cacheSeconds=7200)                         |
| 崩坏：星穹铁道   | 最新动态     | starrail       | ![https://api-hot.trynew5.github.io/starrail](https://img.shields.io/website.svg?label=starrail&url=https://api-hot.trynew5.github.io/starrail&cacheSeconds=7200)                   |
| 微信读书         | 飙升榜       | weread         | ![https://api-hot.trynew5.github.io/weread](https://img.shields.io/website.svg?label=weread&url=https://api-hot.trynew5.github.io/weread&cacheSeconds=7200)                         |
| NGA              | 热帖         | ngabbs         | ![https://api-hot.trynew5.github.io/ngabbs](https://img.shields.io/website.svg?label=ngabbs&url=https://api-hot.trynew5.github.io/ngabbs&cacheSeconds=7200)                         |
| V2EX             | 主题榜       | v2ex           | ![https://api-hot.trynew5.github.io/v2ex](https://img.shields.io/website.svg?label=v2ex&url=https://api-hot.trynew5.github.io/v2ex&cacheSeconds=7200)                               |
| HelloGitHub      | Trending     | hellogithub    | ![https://api-hot.trynew5.github.io/hellogithub](https://img.shields.io/website.svg?label=hellogithub&url=https://api-hot.trynew5.github.io/hellogithub&cacheSeconds=7200)          |
| 中央气象台       | 全国气象预警 | weatheralarm   | ![https://api-hot.trynew5.github.io/weatheralarm](https://img.shields.io/website.svg?label=weatheralarm&url=https://api-hot.trynew5.github.io/weatheralarm&cacheSeconds=7200)       |
| 中国地震台       | 地震速报     | earthquake     | ![https://api-hot.trynew5.github.io/earthquake](https://img.shields.io/website.svg?label=earthquake&url=https://api-hot.trynew5.github.io/earthquake&cacheSeconds=7200)             |
| 历史上的今天     | 月-日        | history        | ![https://api-hot.trynew5.github.io/history](https://img.shields.io/website.svg?label=history&url=https://api-hot.trynew5.github.io/history&cacheSeconds=7200)                      |

</details>

## ⚙️ 使用

本项目支持 `Node.js` 调用，可在安装完成后调用 `serveHotApi` 来开启服务器

> 该方式无法使用部分需要 Puppeteer 环境的接口

```bash
pnpm add dailyhot-api
```

```js
import serveHotApi from "dailyhot-api";

/**
 * 启动服务器
 * @param {Number} [port] - 端口号
 * @returns {Promise<void>}
 */
serveHotApi(3000);
```

## ⚙️ 部署

具体使用说明可参考 [我的博客](https://github.com/TryNew5/posts/2024/0408)，下方仅讲解基础操作：

### Docker 部署

> 安装及配置 Docker 将不在此处说明，请自行解决

#### 本地构建

```bash
# 构建
docker build -t dailyhot-api .

# 运行
docker run --restart always -p 6688:6688 -d dailyhot-api
# 或使用 Docker Compose
docker-compose up -d
```

#### 在线部署

```bash
# 拉取
docker pull TryNew5/dailyhot-api:latest

# 运行
docker run --restart always -p 6688:6688 -d TryNew5/dailyhot-api:latest
```

### 手动部署

最直接的方式，您可以按照以下步骤将 `DailyHotApi` 部署在您的电脑、服务器或者其他任何地方

#### 安装

```bash
git clone https://github.com/TryNew5/DailyHotApi.git
cd DailyHotApi
```

然后再执行安装依赖

```bash
npm install
```

复制 `/.env.example` 文件并重命名为 `/.env` 并修改配置

#### 开发

```bash
npm run dev
```

成功启动后程序会在控制台输出可访问的地址

#### 编译运行

```bash
npm run build
npm run start
```

### pm2 部署

```bash
npm i pm2 -g
sh ./deploy.sh
```

成功启动后程序会在控制台输出可访问的地址

### Vercel 部署

本项目支持通过 `Vercel` 进行一键部署，点击下方按钮或前往 [项目仓库](https://github.com/TryNew5/DailyHotApi-Vercel) 进行手动部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/TryNew5-projects/clone?repository-url=https%3A%2F%2Fgithub.com%2FTryNew5%2FDailyHotApi-Vercel)

### Railway 部署

本项目支持使用 [Railway](https://railway.app/) 一键部署，请先将本项目 fork 到您的仓库中，即可使用一键部署。

### Zeabur 部署

本项目支持使用 [Zeabur](https://zeabur.com/) 一键部署，请先将本项目 fork 到您的仓库中，即可使用一键部署。

## ⚠️ 须知

- 本项目为了避免频繁请求官方数据，默认对数据做了缓存处理，默认为 `60` 分钟，如需更改，请自行修改配置
- 本项目部分接口使用了 **页面爬虫**，若违反对应页面的相关规则，请 **及时通知我去除该接口**

## 📢 免责声明

- 本项目提供的 `API` 仅供开发者进行技术研究和开发测试使用。使用该 `API` 获取的信息仅供参考，不代表本项目对信息的准确性、可靠性、合法性、完整性作出任何承诺或保证。本项目不对任何因使用该 `API` 获取信息而导致的任何直接或间接损失负责。本项目保留随时更改 `API` 接口地址、接口协议、接口参数及其他相关内容的权利。本项目对使用者使用 `API` 的行为不承担任何直接或间接的法律责任
- 本项目并未与相关信息提供方建立任何关联或合作关系，获取的信息均来自公开渠道，如因使用该 `API` 获取信息而产生的任何法律责任，由使用者自行承担
- 本项目对使用 `API` 获取的信息进行了最大限度的筛选和整理，但不保证信息的准确性和完整性。使用 `API` 获取信息时，请务必自行核实信息的真实性和可靠性，谨慎处理相关事项
- 本项目保留对 `API` 的随时更改、停用、限制使用等措施的权利。任何因使用本 `API` 产生的损失，本项目不负担任何赔偿和责任

## 😘 鸣谢

特此感谢为本项目提供支持与灵感的项目

- [RSSHub](https://github.com/DIYgod/RSSHub)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=TryNew5/DailyHotApi&type=Date)](https://star-history.com/#TryNew5/DailyHotApi&Date)
