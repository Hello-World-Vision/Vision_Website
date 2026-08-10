// @ts-check
import typography from '@tailwindcss/typography';

/**
 * TailwindCSS 主题配置
 * ---------------------------------------------------------------------------
 * 核心定制：
 *  - zju.*    → 浙江大学"求是蓝"色板（主色 #003f88）
 *  - fontFamily → Inter（正文）+ JetBrains Mono（代码/数字）
 *  - typography 插件 → 让 Markdown 渲染出的文章排版优雅（H1~H6、Blockquote、Table…）
 *
 * 注意：复杂的关键帧动画（blobBreathe / blinkCursor / typeIn 等）
 *      统一写在 src/styles/global.css 或各 Astro 组件的 <style> 中，
 *      保持本文件只负责「静态 token」。
 */
/** @type {import('tailwindcss').Config} */
export default {
  // 深色模式使用 .dark class 控制（由 ThemeToggle 组件在 <html> 上切换）
  darkMode: 'class',

  // 扫描范围：src 下所有文件，保证 Tailwind 能"看到"动态拼接的类名
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],

  theme: {
    extend: {
      // ── 浙江大学"求是蓝"色板 ──────────────────────────────
      colors: {
        zju: {
          50: '#e6effb',
          100: '#c3daf5',
          200: '#9cc0ee',
          300: '#6fa5e6',
          400: '#4a8fdd',
          500: '#2a7ad4',
          600: '#1a62b3',
          700: '#0d4f9c',
          800: '#06408a',
          900: '#003f88', // 求是蓝主色
          950: '#002a5e',
        },
      },

      // ── 字体 ──────────────────────────────────────────────
      fontFamily: {
        sans: [
          '"Inter Variable"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono Variable"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },

      // ── 容器宽度（全站最大宽度，宽屏限定）────────────────────
      maxWidth: {
        page: '72rem', // 1152px
      },

      // ── 阴影：科技蓝发光 ───────────────────────────────────
      boxShadow: {
        'glow-zju': '0 0 24px rgba(0, 120, 255, 0.45)',
        'glow-zju-lg': '0 0 48px rgba(0, 120, 255, 0.35), 0 0 12px rgba(56, 189, 248, 0.35)',
      },
    },
  },

  plugins: [typography],
};
