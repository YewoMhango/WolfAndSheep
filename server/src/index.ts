import express from 'express';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { attachWebSocketServer } from './wsServer.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.SERVER_PORT ?? process.env.PORT ?? 3001);

const app = express();

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'wolf-and-sheep' });
});

// In production, serve the built client. In dev, Vite serves it and proxies /ws here.
const clientDistPath = path.resolve(currentDirectory, '../../client/dist');
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA fallback: serve index.html for any other GET so client-side routes work
  // on refresh/deep-link. Express 5 (path-to-regexp v8) no longer accepts a bare
  // '*' path, so match any path with a RegExp instead.
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const server = createServer(app);
const webSocketServer = new WebSocketServer({ server, path: '/ws' });
attachWebSocketServer(webSocketServer);

server.listen(PORT, () => {
  console.log(`Wolf & Sheep server listening on http://localhost:${PORT} (ws path: /ws)`);
});
