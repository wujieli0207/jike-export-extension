import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [react()],
  }),
  // manifest: {
  //   permissions: ['storage', 'tabs'],
  //   content_scripts: [
  //     {
  //       matches: ['*://*.okjike.com/*'],
  //       js: ['content-scripts/content.js'],
  //     },
  //   ],
  //   host_permissions: ['*://*.okjike.com/*'],
  // },
})
