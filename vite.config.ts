import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8090',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'recharts'
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query'
          }
          if (id.includes('node_modules/react-router')) {
            return 'router'
          }
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/jsx-runtime') ||
            id.includes('node_modules/react/index')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
})
