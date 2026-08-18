import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite dev/build config. Build output goes to dist/ (served by Firebase Hosting).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: true,
  },
})
