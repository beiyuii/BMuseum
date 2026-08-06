# B.Museum — 项目约定

个人博物馆博客（React 19 + TS + Vite 8 + React Router 7），部署于 EdgeOne Pages（仓库 `beiyuii/BMuseum`，线上 https://b-museum.edgeone.dev/）。

## 数据架构（KV 驱动，后台可 CRUD）

内容分两层：

- **动态内容（运行时 KV，可被后台改写）**
  - 文章：EdgeOne KV 键 `articles`，存 `Article[]`（含全部 status）。公众站读 `GET /api/articles`（已过滤 draft，按 `no` 倒序）。
  - 项目：EdgeOne KV 键 `projects`，存 `{ synced_at: string, projects: Project[] }`。公众站读 `GET /api/projects`。
  - 前端唯一消费入口：`src/data/MuseumDataContext.tsx` 的 `useMuseumData()` → 返回 `articles`（展出中）/ `allArticles`（非草稿，供详情页）/ `projects` / `projectsSyncedAt` / `wings` / `socials` / `loading` / `refresh`。`/api/*` 不可用时自动回落到构建时 JSON 种子，保证不白屏。
  - **所有页面通过 `useMuseumData()` 取内容；不要再 import `content.ts` 里的 articles/projects。**

- **静态配置（构建时 JSON，本期不进后台）**
  - `src/data/wings.json` → `wings`；`src/data/social.json` → `socials`。仍由 `content.ts` 导出；三翼/社交配置改这两个 JSON。
  - `src/data/articles.json` / `src/data/projects.json`：**仅作首次播种种子**，由 `scripts/copy-seed.mjs` 在 build 前复制到 `public/seed/`。KV 被写过一次后，种子不再覆盖线上数据。

### 播种机制
- `npm run build` = `node scripts/copy-seed.mjs && tsc -b && vite build`。
- 端点 `ensureSeeded()`：KV 键为空才 `fetch('/seed/*.json')` 写入；fetch 失败不影响运行，前端回落打包 JSON。

### article status 语义
- `on_display`（展出，列表可见）/ `storage`（撤展入库房：列表消失，直链显示撤展提示）/ `draft`（仅后台可见，公众不可见）。

## 管理后台（/admin）

Bearer Token 鉴权（`Authorization: Bearer <BMUSEUM_ADMIN_TOKEN>`），前端 token 存 `sessionStorage`（键 `bmuseum_admin_token`）。

- `GET/POST/PUT/DELETE /api/admin/articles` — 文章 CRUD。POST 默认 `status: on_display`；PUT 按 `body.slug` 更新（`slug`/`created` 不可改）；DELETE 按 `?slug=`。
- `GET/POST/PUT/DELETE /api/admin/projects` — 项目 CRUD。POST 默认 `status: running`；`auto` 字段浅合并；其余同文章。
- `POST /api/admin/projects/sync` — 对 `source.type === "github"` 的项目拉 GitHub API（`/repos/{repo}`、`/releases/latest`、`/tags`）回写 `auto.version/updated/stars`，返回 `{ synced: count }`。**这是刷新线上 stars/version 的唯一途径**（见下方同步说明）。

## 项目数据自动同步（两层，别混淆）

- **种子层（构建时）：** `npm run sync` → `scripts/sync-projects.mjs` 把 GitHub stars/version 写回 `src/data/projects.json`；`.github/workflows/sync-projects.yml` 每日 04:00 cron 自动跑并 commit。**仅保持种子新鲜**（首次部署 / 兜底用），不改线上 KV。
- **线上层（运行时）：** 在 `/admin` 点「重新同步」→ `POST /api/admin/projects/sync`，直接改写 KV 里的 `auto`。要更新线上项目数据请走这里。
- 本机直连 GitHub 失败时：`NODE_USE_ENV_PROXY=1 npm run sync`（走系统代理 127.0.0.1:7890）。

## 部署

- `git push` → EdgeOne 自动重建（约 1-2 分钟）。
- **前置：** EdgeOne 需绑定 KV 命名空间 `BMUSEUM_KV`（变量名务必一致）与 `BMUSEUM_ADMIN_TOKEN`（后台登录口令）。首次访问自动从 `public/seed/` 播种。
- 纯前端 `npm run dev` 时，`/api/*` 由 Vite 回落种子；联调 Functions/KV 需 EdgeOne 本地运行时或对应环境变量。

## 命令

- `npm run dev`（本地含 /admin）/`npm run build`（= 复制种子 + tsc -b + vite build，验收以 build 通过为准）/`npm run seed`（仅复制种子）/`npm run sync`（刷新种子 JSON）/`npm test`（vitest，`functions/api` 下 27 个用例覆盖鉴权 + CRUD + 播种 + 同步）。

## 站点约定

- 馆长对外名号：BEIYUII（首页铭牌、About 名号、页脚版权，一处改需三处同步——后续可提成常量）。
- 展示的项目只放：才驿、图文故事工厂、Personal API Skill（馆长明确不展示未完成项目）。
- 视觉语言：暖奶油白 `#F0EEE6` + 墨色 `#1F1E1B` + 红土 `#C15F3C`，三翼色 tech `#5B7A9A` / think `#C15F3C` / create `#7A8C5F`；正文 Noto Serif SC，楷体点缀 LXGW WenKai。
- 首页穿门动画：**220vh 完整版对所有访客保留**（缓慢展开是本站的仪式感，不要再做回访收短——用户明确否决过），只保留「跳过 · 直接入馆」按钮。首屏为宽屏双栏：主视觉在左、馆长铭牌在右下，≤1023px 回落单列。
