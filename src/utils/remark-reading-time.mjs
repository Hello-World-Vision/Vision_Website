/**
 * remark-reading-time.mjs
 * 自定义 remark 插件：遍历 Markdown 语法树，统计中英文内容并估算阅读时长。
 * 计算出的数字会经 remarkPluginFrontmatter 暴露给页面，读取方式：
 *
 *   const { Content, remarkPluginFrontmatter } = await render(entry);
 *   const readingTime = remarkPluginFrontmatter.readingTime; // 分钟数
 *
 * 该插件已在 astro.config.mjs 的 markdown.remarkPlugins 中注册，
 * 新增文章时无需任何额外配置。
 */

function collectText(node) {
  if (!node) return '';
  // 叶子节点直接取 value
  if (typeof node.value === 'string') return node.value;
  // 递归收集子节点文本
  if (Array.isArray(node.children)) {
    return node.children.map(collectText).join(' ');
  }
  return '';
}

export function remarkReadingTime() {
  return function (tree, file) {
    const text = collectText(tree);
    // 中文字符按 300 字/分钟、英文单词按 200 词/分钟估算
    const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    const latinWords = (text.match(/[A-Za-z0-9_]+/g) || []).length;
    const minutes = Math.max(1, Math.round(cjkChars / 300 + latinWords / 200));

    // 写入 frontmatter（Astro 约定把额外数据挂在 file.data.astro.frontmatter 上）
    if (file.data.astro?.frontmatter) {
      file.data.astro.frontmatter.readingTime = minutes;
    }
  };
}
