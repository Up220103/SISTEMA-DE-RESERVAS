import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // necesario para que funcione dentro de Docker
    port: 5173,
    watch: { usePolling: true },
  },
  test: {
    environment: 'jsdom',   // necesitamos document y localStorage
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
