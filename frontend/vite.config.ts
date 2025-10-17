import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Redirecciona las peticiones /api a localhost:8000 durante el desarrollo
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // También redirecciona /admin si necesitas acceder al admin de Django
      '/admin': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // Redirecciona al simulador de pagos en localhost:8000
      '/simulador-pagos': {
        target: 'http://simulador_pagos:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/simulador-pagos/, ''),
      },
    },
  },
});
