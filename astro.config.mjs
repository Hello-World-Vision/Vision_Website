// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
// Astro 7 默认使用新的 Sätteri Markdown 处理器。
// 为了继续使用基于 remark 的阅读时长插件，这里显式选用 unified() 处理器
// （来自 @astrojs/markdown-remark，已作为依赖安装）。
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// Astro 站点主配置
// ─────────────────────────────────────────────────────────────────────────────
export default defineConfig({
  // 【部署必改】GitHub Pages 的站点地址。
  //  - 若部署在 <你的用户名>.github.io           → 写成 https://<用户名>.github.io
  //  - 若部署在 <用户名>.github.io/<仓库名>      → site 写 https://<用户名>.github.io，base 写 '/<仓库名>/'
  site: 'https://Hello-World-Vision.github.io',
  // 站点的子路径前缀（仓库名路径）。默认部署在域名根目录即为 '/'。
  base: '/Vision_Website/',

  // 集成插件：astro-icon（基于 Iconify 的图标方案）
  integrations: [
    icon({
      // 这里显式声明只使用 Material Design Icons 图标集
      // 若想加入更多图标集：npm i @iconify-json/<集合名> 后在这里 include 即可
      include: {
        mdi: ['*'],
      },
    }),
  ],

  markdown: {
    // 代码高亮：Astro 内置 Shiki，开箱即用，无需额外安装
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark', // 深色代码主题，与全站深色科技风统一
      wrap: true,           // 长代码自动换行，避免横向滚动条
    },
    // Astro 7：选用 unified()（remark/rehype）处理器，并注册阅读时长插件。
    // 该插件的计算结果经 render(entry).remarkPluginFrontmatter.readingTime 读取。
    processor: unified({ remarkPlugins: [remarkReadingTime] }),
  },
});
