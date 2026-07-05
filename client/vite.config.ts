import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Dev-time WebSocket + API requests are proxied to the Express server.
const SERVER_PORT = process.env.SERVER_PORT ?? '3001';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wolf/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/ws': {
        target: `ws://localhost:${SERVER_PORT}`,
        ws: true,
      },
      '/health': {
        target: `http://localhost:${SERVER_PORT}`,
      },
    },
  },
});
