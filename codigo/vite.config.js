import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona en https://<usuario>.github.io/estrategias/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../', emptyOutDir: false, assetsDir: 'app', chunkSizeWarningLimit: 1800 },
});
