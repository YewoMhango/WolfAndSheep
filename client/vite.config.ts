import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Dev-time WebSocket + API requests are proxied to the Express server.
const SERVER_PORT = process.env.SERVER_PORT ?? "3001";

// Absolute base URL for canonical / Open Graph / Twitter tags in index.html.
// Defaults to the expected Render URL; override per-deploy with VITE_SITE_URL
// (set it in render.yaml to match your actual domain).
const SITE_URL = (
  process.env.VITE_SITE_URL ?? "https://wolfandsheep.onrender.com"
).replace(/\/+$/, "");

export default defineConfig({
  plugins: [
    react(),
    {
      // Replace the {{SITE_URL}} placeholder in index.html at serve & build time.
      name: "inject-site-url",
      transformIndexHtml(html) {
        return html.replaceAll("{{SITE_URL}}", SITE_URL);
      },
    },
  ],
  resolve: {
    alias: {
      "@wolf/shared": fileURLToPath(
        new URL("../shared/src/index.ts", import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/ws": {
        target: `ws://localhost:${SERVER_PORT}`,
        ws: true,
      },
      "/health": {
        target: `http://localhost:${SERVER_PORT}`,
      },
    },
  },
});
