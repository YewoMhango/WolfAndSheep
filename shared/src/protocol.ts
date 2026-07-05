import type { GameState, Move, Role, RolePreference, Winner } from './types.js';

/**
 * WebSocket wire protocol, shared by client and server so both sides get
 * type-checked messages. Every message is a discriminated union on `type`.
 */

/** Messages the client sends to the server. */
export type ClientMessage =
  | { type: 'hello'; sessionToken?: string }
  | { type: 'create_room'; rolePreference?: RolePreference }
  | { type: 'join_room'; code: string }
  | { type: 'quick_match'; rolePreference?: RolePreference }
  | { type: 'cancel_match' }
  | { type: 'move'; move: Move }
  | { type: 'rematch' }
  | { type: 'leave' };

/** Messages the server sends to the client. */
export type ServerMessage =
  | { type: 'welcome'; playerId: string; sessionToken: string }
  | { type: 'room_created'; code: string; role: Role }
  | { type: 'queued'; position: number; size: number }
  | { type: 'match_cancelled' }
  | { type: 'game_start'; code: string; role: Role; state: GameState }
  | { type: 'state'; state: GameState }
  | { type: 'game_over'; state: GameState; winner: Winner }
  | { type: 'opponent_disconnected' }
  | { type: 'opponent_reconnected' }
  | { type: 'opponent_left' }
  | { type: 'error'; code: ErrorCode; message: string };

export type ErrorCode =
  | 'room_not_found'
  | 'room_full'
  | 'not_in_game'
  | 'illegal_move'
  | 'not_your_turn'
  | 'already_queued'
  | 'bad_message';

export function encode(message: ClientMessage | ServerMessage): string {
  return JSON.stringify(message);
}

export function decodeClient(data: string): ClientMessage {
  return JSON.parse(data) as ClientMessage;
}

export function decodeServer(data: string): ServerMessage {
  return JSON.parse(data) as ServerMessage;
}
