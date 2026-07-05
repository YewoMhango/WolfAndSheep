import type { WebSocket } from 'ws';
import type { GameState, Role } from '@wolf/shared';

/** A connected (or recently disconnected) client identity. */
export interface Player {
  id: string;
  /** Secret used to resume a session after a reconnect. */
  sessionToken: string;
  /** Live socket, or null while disconnected within the grace period. */
  socket: WebSocket | null;
  /** Code of the room the player is currently in, if any. */
  roomCode: string | null;
  /** The side this player controls in their current room. */
  role: Role | null;
  /** True while the player sits in the matchmaking queue. */
  queued: boolean;
}

/** A two-player game room. */
export interface Room {
  code: string;
  players: Partial<Record<Role, Player>>;
  state: GameState;
  /** Roles that have requested a rematch since the last game ended. */
  rematchVotes: Set<Role>;
  /** Pending "opponent left for good" cleanup timers, keyed by playerId. */
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
}
