import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.BASE_URL || '/',
  define: {
    // html-to-docx uses Buffer internally — polyfill for browser
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill Node.js buffer for browser use (html-to-docx dependency)
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
