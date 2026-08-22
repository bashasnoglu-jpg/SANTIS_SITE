import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      '/api/admin': {
        target: 'http://127.0.0.1:3032',
        changeOrigin: false,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3030',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) return 'vendor-react';
          if (id.includes('node_modules/@tanstack/') || id.includes('node_modules/zustand/')) return 'vendor-query';
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) return 'vendor-charts';
          if (id.includes('node_modules/three/') || id.includes('node_modules/react-big-calendar/') || id.includes('node_modules/moment/')) return 'vendor-3d-calendar';
          if (id.includes('/features/boardroom/')) return 'oracle';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
