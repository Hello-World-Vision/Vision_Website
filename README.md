# Hello World Vision · 官方网站

浙江大学 RoboMaster 视觉组（Hello World Vision）官方网站。

基于 **Astro 7 + TailwindCSS + Astro Content Collections** 的静态站点。

> 环境要求：Node ≥ 22.12（本地与 GitHub Actions 均已按此配置）。

> 核心设计理念：**前端高度可定制，内容高度解耦 —— 只写 Markdown 就能更新站点。**

## 快速开始

```bash
npm install
npm run dev        # 本地开发，默认 http://localhost:4321
npm run build      # 静态打包到 dist/
npm run check      # 类型检查（astro check）
```

## 内容维护（成员唯一需要关心的部分）

所有文档都放在 `src/content/` 下，**新增文档只需新建一个 `.md` 文件**：

| 目录 | 作用 | 对应页面 |
| --- | --- | --- |
| `src/content/induction/*.md` | 入组培训文档 | `/induction-training`（列表）/ `/induction-training/<文件名>`（详情） |
| `src/content/pages/*.md` | 顶级静态页面（About / Project） | `/about`、`/project` |

### 写一篇培训文档

1. 在 `src/content/induction/` 下新建 `.md` 文件，文件名建议带序号（如 `04-相机标定.md`）以控制排序；
2. 文件头写 frontmatter，正文用 `##` / `###` 写小标题（会自动生成右侧目录）：

```markdown
---
title: "相机标定"
description: "一句话摘要，会展示在列表卡片上。"
author: "视觉组 · 张三"
date: 2026-08-10
tags: ["相机", "标定"]
draft: false
---

## 一、为什么需要标定
...

### 1.1 内参
...
```

3. 保存后 `git add / commit / push`，GitHub Actions 会自动构建并部署。

> `draft: true` 的文章不会出现在站点上（适合写一半再发）。

## 全站密码门

全站默认开启前端密码门，进入任何页面需先输入密码。

- 密码定义在 `src/layouts/BaseLayout.astro` 的 `PASSWORD` 常量中，改那里即可。
- 这是**前端密码门**（非真正安全）：密码会存在于网页源码中，仅用于拦住普通访客。

## 部署

- 仓库：`Hello-World-Vision/vision-website` → 在线地址 **https://Hello-World-Vision.github.io/vision-website/**
- `push` 到 `main` 分支即自动构建发布（工作流：`.github/workflows/deploy.yml`）。
- 若更换仓库名，需同步修改 `astro.config.mjs` 中的 `base`（`/<仓库名>/`）。

## 目录结构

```
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── astro.config.mjs               # site/base、Shiki 高亮、插件注册
├── tailwind.config.mjs            # ZJU 求是蓝色板、字体、typography 插件
├── public/                        # favicon 与全局静态资源
└── src/
    ├── content/                   # ★ 内容区（成员唯一需要维护的地方）
    │   ├── induction/             # 入组培训文档 .md
    │   ├── pages/                 # 顶级页面（about / project）的 .md
    │   ├── members/               # 团队成员 .md（旧版遗留）
    │   ├── algorithms/            # 算法教程 .md（旧版遗留）
    │   ├── open-source/           # 开源项目 .md（旧版遗留）
    │   └── content.config.ts      # 内容 schema（严格校验）
    ├── pages/                     # 页面路由
    │   ├── index.astro            # 首页（单屏：粒子背景 + 双 Logo + 入口卡片）
    │   ├── induction-training/    # 入组培训列表 + 文章页
    │   ├── [...slug].astro        # about / project 通用渲染
    │   ├── docs/                  # 旧版文档区（遗留）
    │   └── members.astro          # 旧版成员页（遗留）
    ├── layouts/                   # BaseLayout（含密码门）/ DocLayout（三栏 + TOC + 滚动高亮）
    ├── components/                # Header/Footer/粒子背景等
    ├── styles/global.css          # Tailwind 指令 + 关键帧 + 工具类
    └── utils/                     # 阅读时长等 remark 插件
```
