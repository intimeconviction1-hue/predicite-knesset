import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // En dev, le frontend (Vite) tourne séparément du backend (server/).
      // Ce proxy évite tout souci de CORS/cookies : le navigateur ne voit
      // qu'une seule origine (celle de Vite).
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
});
