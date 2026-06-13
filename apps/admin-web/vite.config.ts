import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://unimap-production-578f.up.railway.app',
        changeOrigin: true,
      },
    },
  },
})
