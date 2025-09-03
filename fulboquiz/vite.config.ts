import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      '/premier': 'http://localhost:8080',
      '/laliga': 'http://localhost:8080',
      '/bundesliga': 'http://localhost:8080',
      '/seriea': 'http://localhost:8080',
      '/ligue1': 'http://localhost:8080',
    }
  }
})