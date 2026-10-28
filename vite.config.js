/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM 下无 __dirname，通过 import.meta.url 构造等价路径
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // jsxgraph 1.13.1 的 package.json exports 字段未暴露 distrib 子路径，
      // 导致 `import 'jsxgraph/distrib/jsxgraph.css'` 被 Node exports 规则拒绝。
      // 通过 alias 将该子路径直接解析到实际文件，绕过 exports 限制。
      'jsxgraph/distrib/jsxgraph.css': path.resolve(__dirname, 'node_modules/jsxgraph/distrib/jsxgraph.css')
    }
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // 首屏只强制包含最核心的运行时；其余第三方库交给 Rollup
          // 按「谁先用到谁下载」自动切分，避免 vendor 里塞进图表/公式/图形库。
          vendor: ['react', 'react-dom', 'react-router-dom', 'scheduler'],
          charts: ['recharts'],
          math: ['katex', 'react-katex']
        }
      }
    }
  }
})
