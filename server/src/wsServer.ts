import type { WebSocket, WebSocketServer } from 'ws';
import { decodeClient } from '@wolf/shared';
import type { Player } from './types.js';
import { RoomManager } from './RoomManager.js';
import { Matchmaker } from './Matchmaker.js';
import { newPlayerId, newSessionToken } from './ids.js';
import { sendSocket } from './send.js';

export function attachWebSocketServer(webSocketServer: WebSocketServer): void {
  const rooms = new RoomManager();
  const matchmaker = new Matchmaker(rooms);
  const bySocket = new Map<WebSocket, Player>();
  const byToken = new Map<string, Player>();

  function handleHello(socket: WebSocket, token: string | undefined): void {
    const existing = token ? byToken.get(token) : undefined;
    if (existing) {
      // Resume the session. Drop any stale socket still bound to this player.
      if (existing.socket && existing.socket !== socket) {
        try {
          existing.socket.close();
        } catch {
          /* ignore */
        }
        bySocket.delete(existing.socket);
      }
      existing.socket = socket;
      bySocket.set(socket, existing);
      sendSocket(socket, {
        type: 'welcome',
        playerId: existing.id,
        sessionToken: existing.sessionToken,
      });
      if (existing.roomCode) rooms.handleReconnect(existing);
      return;
    }

    const player: Player = {
      id: newPlayerId(),
      sessionToken: newSessionToken(),
      socket,
      roomCode: null,
      role: null,
      queued: false,
    };
    byToken.set(player.sessionToken, player);
    bySocket.set(socket, player);
    sendSocket(socket, {
      type: 'welcome',
      playerId: player.id,
      sessionToken: player.sessionToken,
    });
  }

  webSocketServer.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw) => {
      let message;
      try {
        message = decodeClient(raw.toString());
      } catch {
        sendSocket(socket, { type: 'error', code: 'bad_message', message: 'Malformed message.' });
        return;
      }

      if (message.type === 'hello') {
        handleHello(socket, message.sessionToken);
        return;
      }

      const player = bySocket.get(socket);
      if (!player) {
        sendSocket(socket, { type: 'error', code: 'bad_message', message: 'Send hello first.' });
        return;
      }

      switch (message.type) {
        case 'create_room':
          if (player.queued) matchmaker.cancel(player);
          rooms.createRoom(player, message.rolePreference);
          break;
        case 'join_room':
          if (player.queued) matchmaker.cancel(player);
          rooms.joinRoom(player, message.code);
          break;
        case 'quick_match':
          if (player.roomCode) rooms.handleLeave(player);
          matchmaker.enqueue(player, message.rolePreference);
          break;
        case 'cancel_match':
          matchmaker.cancel(player);
          break;
        case 'move':
          rooms.handleMove(player, message.move);
          break;
        case 'rematch':
          rooms.handleRematch(player);
          break;
        case 'leave':
          if (player.queued) matchmaker.cancel(player);
          rooms.handleLeave(player);
          break;
        default:
          sendSocket(socket, { type: 'error', code: 'bad_message', message: 'Unknown message.' });
      }
    });

    socket.on('close', () => {
      const player = bySocket.get(socket);
      bySocket.delete(socket);
      if (!player || player.socket !== socket) return;
      player.socket = null;
      if (player.queued) matchmaker.remove(player);
      if (player.roomCode) rooms.handleDisconnect(player);
    });

    socket.on('error', () => {
      /* 'close' will follow; nothing extra to do */
    });
  });
}
