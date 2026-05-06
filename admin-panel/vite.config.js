import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3030',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    // Phase 83.1 — Oracle Feed Performance Rail
    // Hedef: 1.23 MB monoblok → parçalı lazy katmanlar
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // ── Tier 1: React core (küçük, hızlı, her zaman gerekli) ──
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }

          // ── Tier 2: State & query (BoardroomModeContext, TanStack) ──
          if (id.includes('node_modules/@tanstack/') ||
              id.includes('node_modules/zustand/')) {
            return 'vendor-query';
          }

          // ── Tier 3: Charting (recharts + dependencies) ──
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }

          // ── Tier 4: 3D / Calendar (en ağır, sadece lazım olunca) ──
          if (id.includes('node_modules/three/') ||
              id.includes('node_modules/react-big-calendar/') ||
              id.includes('node_modules/moment/')) {
            return 'vendor-3d-calendar';
          }

          // ── Tier 5: Boardroom Oracle Feed (Phase 82-83 modülleri) ──
          if (id.includes('/features/boardroom/')) {
            return 'oracle';
          }
        },
      },
    },
    // Uyarı eşiğini geçici olarak yükselt (chunking sonrası kaldırılacak)
    chunkSizeWarningLimit: 600,
  },
})

