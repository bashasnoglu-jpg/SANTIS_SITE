import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/admin/boardroom/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  css: {
    postcss: false, // Prevents Vite from parsing parent directory configs
  }
})
