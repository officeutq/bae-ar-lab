import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';

const mkcert = (): PluginOption => ({
  name: 'mkcert-local-plugin',
});

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,
    https: {},
  },
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
