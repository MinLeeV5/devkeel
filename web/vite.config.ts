import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { staticSite } from './scripts/static-site'

export default defineConfig({
  base: process.env.WEB_BASE_PATH || '/',
  appType: 'mpa',
  plugins: [react(), tailwindcss(), staticSite()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
})
