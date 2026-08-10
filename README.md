# 浙江大学视觉组（ZJU Vision Group）官方网站

基于 **Astro 7 + TailwindCSS + Astro Content Collections** 的静态开源网站框架。

> 环境要求：Node ≥ 22.12（本地与 GitHub Actions 均已按此配置）。

> 核心设计理念：**前端高度可定制（Canvas/3D 视觉渲染），内容高度解耦（只写 Markdown 就能更新站点）。**

## 快速开始

```bash
npm install
npm run dev        # 本地开发，默认 http://localhost:4321
npm run build      # 静态打包到 dist/
npm run check      # 类型检查（astro check）
```

## 内容维护（使用者唯一需要关心的部分）

所有内容都放在 `src/content/` 下，**新增内容只需新建 `.md` 文件**：

| 目录 | 作用 | 对应页面 |
| --- | --- | --- |
| `src/content/algorithms/*.md` | 算法教程 | `/docs/algorithms/<文件名>` |
| `src/content/open-source/*.md` | 开源项目 | `/docs/open-source/<文件名>` |
| `src/content/members/*.md` | 团队成员 | `/members` |

图片统一放在每个 `.md` 文件同级的 `images/` 文件夹中，用相对路径引用即可（封面、正文插图、成员照片均如此）。frontmatter 会被 `src/content/config.ts` 严格校验，写错会直接构建报错。

模板文件可以直接复制使用：

```bash
cp src/content/algorithms/01-装甲板识别入门.md src/content/algorithms/我的新教程.md
# 然后编辑 frontmatter 与正文
```

## 部署到 GitHub Pages

1. 将仓库推到 GitHub，并把 `astro.config.mjs` 中的 `site`（和需要时的 `base`）改成你的地址；
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**；
3. `push` 到 `main` 分支即自动构建发布（工作流在 `.github/workflows/deploy.yml`）。

## 目录结构

```
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── astro.config.mjs               # site/base、Shiki 高亮、插件注册
├── tailwind.config.mjs            # ZJU 求是蓝色板、字体、typography 插件
├── public/                        # favicon 与全局静态资源
└── src/
    ├── content/                   # ★ 内容区（用户唯一需要维护的地方）
    │   ├── algorithms/            # 算法教程 .md
    │   ├── open-source/           # 开源项目 .md
    │   ├── members/               # 团队成员 .md
    │   └── config.ts              # 内容 schema（严格校验）
    ├── pages/                     # 页面路由
    │   ├── index.astro            # 首页（含 #hero-canvas-container 预留区）
    │   ├── members.astro          # 成员展示页
    │   ├── docs/index.astro       # 文档列表
    │   └── docs/[...slug].astro   # Markdown 通用渲染模板
    ├── layouts/                   # BaseLayout / DocLayout
    ├── components/                # Header/Footer/粒子背景/成员卡片等
    ├── styles/global.css          # Tailwind 指令 + 关键帧 + 工具类
    └── utils/                     # 阅读时长等 remark 插件
```

## 定制视觉

- **首页背景动效**：`src/pages/index.astro` 的 `<div id="hero-canvas-container">` 已预留给 Three.js / Canvas，当前内置原生 Canvas 粒子网络（`components/ParticleCanvas.astro`），直接替换即可。
- **主题色**：求是蓝 `#003f88` 定义在 `tailwind.config.mjs` 的 `zju` 色板中。
- **深浅色**：默认深色（极客黑），右上角按钮可切换并记住偏好。
