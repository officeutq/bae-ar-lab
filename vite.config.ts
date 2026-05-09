import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@app': '/src/app',
      '@ui': '/src/ui',
      '@engine': '/src/engine',
      '@algorithms': '/src/algorithms',
      '@shaders': '/src/shaders',
      '@app-types': '/src/types',
      '@config': '/src/config',
    },
  },
});
