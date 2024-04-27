import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
  manifest: {
    permissions: ['tabs', 'storage'],
    name: '即刻导出',
    description: '导出即刻动态为本地文件',
  },
})
