# B.Museum · 个人作品博物馆

> Walk through the mind.

一个按**博物馆逻辑**设计的个人作品站，而不是博客。访客在展厅之间穿行，每件展品都有馆藏号和版本号，不按时间线堆叠。

**🏆 参赛作品 · WorkBuddy × EdgeOne Pages AI Prompts × Skills 挑战赛**

---

## 🔗 在线预览

> https://b-museum.edgeone.dev/

## 📋 AI 构建 Prompt

完整 Prompt 文件：[`prompt-b-museum.md`](./prompt-b-museum.md)

Prompt 第一行为比赛要求格式：
```
Install this skill: https://github.com/TencentEdgeOne/edgeone-pages-skills, then deploy to EdgeOne Pages.
```

---

## 博物馆概念

```
博物馆是空间，不是流。
```

B.Museum 有三个独立展厅（翼），每个翼都是一个真实路由：

| 展厅 | 路由 | 内容 |
|---|---|---|
| Tech 翼 · 工程参考室 | `/wing/tech` | 工程决策、架构备忘、技术实录 |
| Think 翼 · 私人书房 | `/wing/think` | 思考碎片、认知迭代、未想清楚的事 |
| Create 翼 · 项目工坊 | `/wing/create` | 在建/已发布/停工项目的决策记录 |

访客首次进入时会获得一张「今晚有效」的访客票根（#00001 起全局递增）。留言簿使用牛皮纸风格，带有 honeypot + 反 spam 验证。

---

## 设计语言

**Path D · Warm Cinematic / Editorial**

- 主色调：暖奶油白 `#F0EEE6`（全站主线）
- 唯一暗区：`#1F1E1B`（Hall Preview / Footer）
- 唯一牛皮纸区：`#F4ECD6`（留言簿）
- 主强调色：红土色 `#C15F3C`
- 字体：Noto Serif SC（中文正文）+ LXGW WenKai（中文楷体强调）+ Fraunces italic（英文副标题）+ Inter（UI）+ JetBrains Mono（代码）
- 全站常驻超轻 SVG 噪点纸质感（opacity 0.04）
- 核心动效：Threshold 穿门滚动效果（`220vh sticky` 容器，letterbox → 全屏）

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 19 + TypeScript 6 + Vite 8 |
| 路由 | React Router v7（History API，真实路由，无 hash）|
| 样式 | CSS Variables（设计 Token）+ 模块化 CSS |
| 部署 | Tencent EdgeOne Pages |
| 后端 | EdgeOne Pages Functions（Edge Functions，V8 运行时）|
| 存储 | EdgeOne KV（留言存储 + 访客票号原子递增）|

---

## 站点结构

```
/                   大厅 · Grand Hall
/about              关于馆长
/wing/tech          Tech 翼
/wing/think         Think 翼
/wing/create        Create 翼
/article/:slug      展品详情
/index              馆藏索引
/guestbook          留言簿
```

8 个路由，全部独立访问，刷新不丢状态，支持社交分享。

---

## 本地运行

```bash
# 安装依赖
cd bmuseum
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```

---

## 部署到 EdgeOne Pages

```bash
# 安装 EdgeOne CLI
npm install -g edgeone@latest

# 设置环境变量（比赛要求）
export PAGES_SOURCE=skills

# 登录（中国站）
edgeone login --site china

# 部署
edgeone pages deploy -n bmuseum
```

SPA 路由回退已通过 `edgeone.json` 配置：
```json
{ "spa": true }
```

---

## 目录结构

```
bmuseum/
├── src/
│   ├── pages/          # 8 个独立路由页面
│   ├── components/     # Nav / Footer / VisitorTicket
│   ├── data/           # articles.json / wings.json
│   ├── hooks/          # useScrollProgress / useReveal / useVisitorTicket
│   └── styles/         # tokens.css / fonts.css / globals.css
├── functions/          # EdgeOne Pages Functions（Edge Functions + KV）
├── public/
├── edgeone.json        # SPA fallback 配置
├── vite.config.ts
└── prompt-b-museum.md  # AI 构建 Prompt（比赛提交主文件）
```

---

## 比赛信息

- 参赛赛道：Prompts Track
- 参赛平台：WorkBuddy × Tencent EdgeOne Pages
- Prompt 评分维度：UI/UX (45%) · Prompt 质量 (25%) · 传播力 (20%) · 技术深度 (10%)
- 核心亮点：Prompt 完整指定了全部 Token 值、动效参数、排版比例、微文案、路由结构，可由 AI 100% 复现

---

*B.Museum · Vol. 01 · Built solo, after the workday.*
