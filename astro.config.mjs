// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
// Astro 7 默认使用新的 Sätteri Markdown 处理器。
// 为了继续使用基于 remark 的阅读时长插件，这里显式选用 unified() 处理器
// （来自 @astrojs/markdown-remark，已作为依赖安装）。
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import { fromHtml } from 'hast-util-from-html';

// GitHub 风格色块：把正文首段以 <strong> 开头的文本提取为该色块的自定义标题，
// 没有自定义标题时回退为插件默认标题（Note/Tip/Caution 等）。
const githubAlertBuild = (alertOptions, originalChildren) => {
  let title = alertOptions.title;
  const bodyChildren = [...originalChildren];
  const firstP = bodyChildren.find(
    (c) => c && c.type === 'element' && c.tagName === 'p'
  );
  if (firstP && Array.isArray(firstP.children) && firstP.children.length) {
    // 跳过前导空白（换行/空格），找到正文首段里第一个有意义的节点
    let idx = 0;
    while (
      idx < firstP.children.length &&
      firstP.children[idx].type === 'text' &&
      firstP.children[idx].value.trim() === ''
    ) {
      idx++;
    }
    const first = firstP.children[idx];
    if (first && first.type === 'element' && first.tagName === 'strong') {
      const text = (first.children || [])
        .map((n) => (n.type === 'text' ? n.value : ''))
        .join('')
        .trim();
      if (text) {
        title = text;
        // 移除前导空白节点与该 <strong>，并去掉后续文字的多余空格
        firstP.children.splice(0, idx + 1);
        if (firstP.children[0] && firstP.children[0].type === 'text') {
          firstP.children[0].value = firstP.children[0].value.replace(/^\s+/, '');
        }
        firstP.children = firstP.children.filter(
          (n) => !(n.type === 'text' && n.value.trim() === '')
        );
      }
    }
  }
  const filtered = bodyChildren.filter((c) => {
    if (c.type !== 'element' || c.tagName !== 'p') return true;
    const text = (c.children || [])
      .map((n) => (n.type === 'text' ? n.value : ''))
      .join('')
      .trim();
    return text !== '' || (c.children || []).some((n) => n.type === 'element');
  });
  const icon = fromHtml(alertOptions.icon, { fragment: true }).children[0];
  if (!icon || icon.type !== 'element') return null;
  const titleEl = {
    type: 'element',
    tagName: 'p',
    properties: { className: ['markdown-alert-title'] },
    children: [icon, { type: 'text', value: title }],
  };
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: [
        'markdown-alert',
        `markdown-alert-${alertOptions.keyword.toLowerCase()}`,
      ],
    },
    children: [titleEl, ...filtered],
  };
};

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
    // remark-math + rehype-katex：把正文中的 $...$ / $$...$$ 渲染为 LaTeX 公式。
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkMath],
      rehypePlugins: [[rehypeGithubAlerts, { build: githubAlertBuild }], rehypeKatex],
    }),
  },
});
