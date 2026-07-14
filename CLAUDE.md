# B.Museum — 项目约定

个人博物馆博客（React 19 + TS + Vite 8 + React Router 7），部署于 EdgeOne Pages（仓库 `beiyuii/BMuseum`，线上 https://b-museum.edgeone.dev/）。

## 数据架构（统一 IR，下游只读不写）

- `src/data/projects.json` — 项目档案唯一数据源。`auto` 字段（version / updated / stars）由同步脚本回写，**不要手改**；手动字段：tagline / status / status_label / platform / tech / links / article_slug。首页 Now 条、`/projects` 页、About 项目卡三处共用。
- `src/data/social.json` — 社交账号唯一数据源。页脚「馆长在别处」、首页铭牌芯片、About 联系区三处共用。二维码图放 `public/social/`（见该目录 README），缺图自动降级为文字卡。
- `src/data/articles.json` — 文章。`status` 字段：`on_display`（展出）/ `storage`（撤展入库房：列表消失，直链显示撤展提示）/ `draft`（不可见）。
- `src/data/content.ts` — **唯一数据访问入口**。所有页面从这里导入 `articles`（已过滤）/ `allArticles` / `wings` / `projects` / `socials`，不要直接 import JSON。

## 项目数据自动同步

- `npm run sync` → `scripts/sync-projects.mjs`：确定性脚本（无 AI），对 `source.type === "github"` 的项目拉 GitHub API 回写 auto 字段，仅在有变化时写文件。
- `.github/workflows/sync-projects.yml`：每日 04:00（Asia/Shanghai）cron 自动跑并 commit，推送后 EdgeOne 自动重建。
- 本机直连 GitHub 失败时：`NODE_USE_ENV_PROXY=1 npm run sync`（走系统代理 127.0.0.1:7890）。

## 命令

- `npm run dev` / `npm run build`（build = tsc -b && vite build，验收以 build 通过为准）/ `npm run sync`

## 站点约定

- 馆长对外名号：BEIYUII（首页铭牌、About 名号、页脚版权，一处改需三处同步——后续可提成常量）。
- 展示的项目只放：才驿、图文故事工厂、Personal API Skill（馆长明确不展示未完成项目）。
- 视觉语言：暖奶油白 `#F0EEE6` + 墨色 `#1F1E1B` + 红土 `#C15F3C`，三翼色 tech `#5B7A9A` / think `#C15F3C` / create `#7A8C5F`；正文 Noto Serif SC，楷体点缀 LXGW WenKai。
- 首页穿门动画：首访 220vh 完整播放，回访（localStorage `bmuseum_visitor` 存在）收短为 120vh，另有「跳过 · 直接入馆」按钮。
