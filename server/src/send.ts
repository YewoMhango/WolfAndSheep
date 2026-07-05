import type { WebSocket } from 'ws';
import { encode, type Role, type ServerMessage } from '@wolf/shared';
import type { Player, Room } from './types.js';

export function sendSocket(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(encode(message));
  }
}

export function sendPlayer(player: Player | undefined, message: ServerMessage): void {
  if (player?.socket) sendSocket(player.socket, message);
}

/** Send to both seats of a room. */
export function broadcastRoom(room: Room, message: ServerMessage): void {
  (['wolf', 'sheep'] as Role[]).forEach((role) => sendPlayer(room.players[role], message));
}

/** Send to everyone in the room except `except`. */
export function sendOpponent(room: Room, except: Player, message: ServerMessage): void {
  (['wolf', 'sheep'] as Role[]).forEach((role) => {
    const player = room.players[role];
    if (player && player.id !== except.id) sendPlayer(player, message);
  });
}
