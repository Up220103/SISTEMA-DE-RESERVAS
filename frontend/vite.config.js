import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import fs from 'fs'   // descomenta para servir el dev server por HTTPS

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // necesario para que funcione dentro de Docker
    port: 5173,
    watch: { usePolling: true },
    // --- HTTPS en desarrollo con la CA privada (front.reservas.com) ---
    // Descomenta y apunta a los certs del frontend. Ver certs/README.md.
    // https: {
    //   key: fs.readFileSync('../certs/front.reservas.com.key'),
    //   cert: fs.readFileSync('../certs/front.reservas.com.crt'),
    // },
  },
  test: {
    environment: 'jsdom',   // necesitamos document y localStorage
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
