import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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