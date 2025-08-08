import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    host: true
  },
  preview: {
    allowedHosts: ['dweet-admin-dashboard.onrender.com', 'phoenix.dweetapp.com']
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 