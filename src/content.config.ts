import { defineCollection } from 'astro:content';
// Astro 7：zod 通过 astro/zod 子路径暴露（astro:content 中的 z 已弃用）
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * ============================================================================
 * 内容集合 (Content Collections) — 内容验证的「唯一事实来源」
 * ============================================================================
 * 注意：本配置文件位于项目根目录的 src/content.config.ts
 * （旧位置 src/content/config.ts 已在 Astro 5 中移除）。
 *
 * Astro 7 起集合必须使用显式 loader（glob）声明内容来源。
 *
 * 使用者只需在 src/content/ 下三个文件夹中编写 Markdown 文件：
 *
 *   src/content/algorithms/   → 算法教程（页面路由：/docs/algorithms/<文件名>）
 *   src/content/open-source/  → 开源项目（页面路由：/docs/open-source/<文件名>）
 *   src/content/members/      → 团队成员（页面路由：/members 下自动渲染）
 *
 * 每篇文章的 frontmatter 都会经过下方 z.object() 的严格校验，
 * 一旦字段缺失/类型错误，构建会直接报错提示 —— 这就是「内容高度解耦」的保障：
 * 页面代码永远不用改，写内容的人也不会把格式写错。
 *
 * 新增内容集合同样只需要 3 步：
 *   1. 在 src/content/ 下新建文件夹（如 achievements/）
 *   2. 在本文件底部 export const collections 中注册（键名 = 文件夹名）
 *   3. 编写对应的 Markdown 文件
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1) 算法教程集合
//    每个文件一篇教程，正文使用标准 Markdown 即可。
// ─────────────────────────────────────────────────────────────────────────────
const algorithms = defineCollection({
  // loader：告诉 Astro 从哪个文件夹读取哪些文件（pattern 相对于 base）
  loader: glob({ pattern: '**/*.md', base: './src/content/algorithms' }),
  schema: ({ image }) =>
    z.object({
      // 【必填】文章标题
      title: z.string(),
      // 【必填】一句话摘要（用于卡片列表与 SEO description）
      description: z.string(),
      // 【必填】作者（可用中文，如 "视觉组 · 张三"）
      author: z.string(),
      // 【必填】发布日期，frontmatter 中写 YYYY-MM-DD 字符串即可
      date: z.coerce.date(),
      // 【选填】封面图：请使用相对路径 ./images/xxx.png，并保证该图片真实存在
      //          （放在 src/content/algorithms/images/ 下即可）
      cover: image().optional(),
      // 【选填】标签数组
      tags: z.array(z.string()).default([]),
      // 【选填】草稿标记：为 true 的文章不会出现在站点上（方便写完再发）
      draft: z.boolean().default(false),
      // 注：阅读时长 readingTime 由 remark-reading-time 插件在渲染期自动注入
      //     （通过 render(entry).remarkPluginFrontmatter.readingTime 读取），
      //     无需也无法在此处手动填写。
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) 开源项目集合
//    集合 key 为 'open-source'，对应文件夹 src/content/open-source/。
// ─────────────────────────────────────────────────────────────────────────────
const openSource = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/open-source' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      author: z.string().default('ZJU Vision Group'),
      date: z.coerce.date(),
      // 【选填】GitHub 仓库地址（如 https://github.com/org/repo）
      repo: z.url().optional(),
      // 【选填】项目主页 / 文档地址
      homepage: z.url().optional(),
      // 【选填】主要语言（如 C++ / Python）
      language: z.string().optional(),
      // 【选填】Star 数量（可展示在卡片上）
      stars: z.number().optional(),
      // 【选填】封面图：相对路径 ./images/xxx
      cover: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      // 注：readingTime 由插件自动注入（见 algorithms 集合的说明）
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) 团队成员集合
//    每个文件一名成员。正文（Body）可写更长的个人介绍，也可以留空。
// ─────────────────────────────────────────────────────────────────────────────
const members = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/members' }),
  schema: ({ image }) =>
    z.object({
      // 【必填】中文姓名（显示为大标题）
      name: z.string(),
      // 【选填】英文名（显示在中文名下方的小字）
      nameEn: z.string().optional(),
      // 【选填】头像：相对路径 ./images/xxx
      avatar: image().optional(),
      // 【选填】照片列表（支持多张，用于轮播图），相对路径 ./images/xxx
      photos: z.array(image()).default([]),
      // 【必填】成员身份/职务，如 "视觉组组长"
      position: z.string(),
      // 【选填】徽章，如 ["26赛季队长", "自瞄主力"]
      badges: z.array(z.string()).default([]),
      // 【选填】技术栈标签，如 ["C++", "OpenCV", "Deep Learning"]
      tech: z.array(z.string()).default([]),
      // 【必填】主要贡献
      contribution: z.string(),
      // 【选填】经历
      experience: z.string().optional(),
      // 【选填】社交链接
      socials: z
        .array(z.object({ label: z.string(), url: z.url() }))
        .default([]),
      draft: z.boolean().default(false),
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) 独立页面集合
//    顶级路由（如 /about、/project、/induction-training）对应的 Markdown 页面。
//    文件名（去扩展名）即 URL 路径，由 src/pages/[...slug].astro 统一渲染。
// ─────────────────────────────────────────────────────────────────────────────
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('ZJU Vision Group'),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// 注册所有集合 —— 集合 key 必须与 src/content/ 下的文件夹名一致
export const collections = { algorithms, 'open-source': openSource, members, pages };
