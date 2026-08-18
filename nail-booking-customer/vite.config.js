import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// LIFF apps are typically served from a subpath; keep relative base so
// the built assets resolve wherever Firebase Hosting mounts them.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5174 },
})
