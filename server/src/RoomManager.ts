import {
  applyMove,
  createInitialState,
  isLegalMove,
  winnerFromStatus,
  type Move,
  type Role,
  type RolePreference,
} from '@wolf/shared';
import type { Player, Room } from './types.js';
import { newRoomCode } from './ids.js';
import { broadcastRoom, sendOpponent, sendPlayer } from './send.js';

/** How long a room survives after a player disconnects, awaiting reconnect. */
const RECONNECT_GRACE_MS = 60_000;

export class RoomManager {
  private rooms = new Map<string, Room>();

  private uniqueCode(): string {
    let code = newRoomCode();
    while (this.rooms.has(code)) code = newRoomCode();
    return code;
  }

  private pickRole(preference: RolePreference | undefined): Role {
    if (preference === 'wolf' || preference === 'sheep') return preference;
    return Math.random() < 0.5 ? 'wolf' : 'sheep';
  }

  /** Create a private room; the creator waits for someone to join by code. */
  createRoom(creator: Player, preference?: RolePreference): void {
    this.detachFromRoom(creator);
    const code = this.uniqueCode();
    const role = this.pickRole(preference);
    const room: Room = {
      code,
      players: { [role]: creator },
      state: createInitialState(),
      rematchVotes: new Set(),
      disconnectTimers: new Map(),
    };
    this.rooms.set(code, room);
    creator.roomCode = code;
    creator.role = role;
    sendPlayer(creator, { type: 'room_created', code, role });
  }

  /** Join a private room by code; fills the empty seat and starts the game. */
  joinRoom(joiner: Player, code: string): void {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) {
      sendPlayer(joiner, { type: 'error', code: 'room_not_found', message: 'No game with that code.' });
      return;
    }
    const emptyRole: Role | null =
      !room.players.wolf ? 'wolf' : !room.players.sheep ? 'sheep' : null;
    if (!emptyRole) {
      sendPlayer(joiner, { type: 'error', code: 'room_full', message: 'That game is already full.' });
      return;
    }
    this.detachFromRoom(joiner);
    room.players[emptyRole] = joiner;
    joiner.roomCode = room.code;
    joiner.role = emptyRole;
    this.startGame(room);
  }

  /** Create a room for two already-matched players (used by the matchmaker). */
  startMatched(wolf: Player, sheep: Player): void {
    this.detachFromRoom(wolf);
    this.detachFromRoom(sheep);
    const code = this.uniqueCode();
    const room: Room = {
      code,
      players: { wolf, sheep },
      state: createInitialState(),
      rematchVotes: new Set(),
      disconnectTimers: new Map(),
    };
    this.rooms.set(code, room);
    wolf.roomCode = code;
    wolf.role = 'wolf';
    sheep.roomCode = code;
    sheep.role = 'sheep';
    this.startGame(room);
  }

  private startGame(room: Room): void {
    room.rematchVotes.clear();
    (['wolf', 'sheep'] as Role[]).forEach((role) => {
      sendPlayer(room.players[role], {
        type: 'game_start',
        code: room.code,
        role,
        state: room.state,
      });
    });
  }

  handleMove(player: Player, move: Move): void {
    const room = this.roomOf(player);
    if (!room || !player.role) {
      sendPlayer(player, { type: 'error', code: 'not_in_game', message: 'You are not in a game.' });
      return;
    }
    if (room.state.turn !== player.role) {
      sendPlayer(player, { type: 'error', code: 'not_your_turn', message: 'It is not your turn.' });
      return;
    }
    if (!isLegalMove(room.state, move)) {
      sendPlayer(player, { type: 'error', code: 'illegal_move', message: 'Illegal move.' });
      return;
    }
    room.state = applyMove(room.state, move);
    broadcastRoom(room, { type: 'state', state: room.state });
    if (room.state.status !== 'playing') {
      broadcastRoom(room, {
        type: 'game_over',
        state: room.state,
        winner: winnerFromStatus(room.state.status),
      });
    }
  }

  handleRematch(player: Player): void {
    const room = this.roomOf(player);
    if (!room || !player.role) return;
    room.rematchVotes.add(player.role);
    // Both players must agree. Swap sides so each gets a turn as the wolf.
    if (room.rematchVotes.size === 2 && room.players.wolf && room.players.sheep) {
      const previousWolf = room.players.wolf;
      const previousSheep = room.players.sheep;
      room.players.wolf = previousSheep;
      room.players.sheep = previousWolf;
      previousSheep.role = 'wolf';
      previousWolf.role = 'sheep';
      room.state = createInitialState();
      this.startGame(room);
    }
  }

  /** Explicit leave: tear down the room and notify the opponent. */
  handleLeave(player: Player): void {
    const room = this.roomOf(player);
    if (!room) return;
    sendOpponent(room, player, { type: 'opponent_left' });
    this.destroyRoom(room);
  }

  /** Socket dropped: hold the seat open for a grace period, then give up. */
  handleDisconnect(player: Player): void {
    const room = this.roomOf(player);
    if (!room) return;
    sendOpponent(room, player, { type: 'opponent_disconnected' });
    const timer = setTimeout(() => {
      room.disconnectTimers.delete(player.id);
      // Still gone after the grace period -> end the game for the opponent.
      if (this.rooms.get(room.code) === room) {
        sendOpponent(room, player, { type: 'opponent_left' });
        this.destroyRoom(room);
      }
    }, RECONNECT_GRACE_MS);
    room.disconnectTimers.set(player.id, timer);
  }

  /** A returning player rebound their socket: resync them and clear the timer. */
  handleReconnect(player: Player): void {
    const room = this.roomOf(player);
    if (!room || !player.role) return;
    const timer = room.disconnectTimers.get(player.id);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(player.id);
    }
    sendPlayer(player, {
      type: 'game_start',
      code: room.code,
      role: player.role,
      state: room.state,
    });
    sendOpponent(room, player, { type: 'opponent_reconnected' });
  }

  private roomOf(player: Player): Room | undefined {
    return player.roomCode ? this.rooms.get(player.roomCode) : undefined;
  }

  /** Remove a player from any room they are in (without tearing the room down). */
  private detachFromRoom(player: Player): void {
    const room = this.roomOf(player);
    if (room && player.role && room.players[player.role]?.id === player.id) {
      delete room.players[player.role];
    }
    player.roomCode = null;
    player.role = null;
  }

  private destroyRoom(room: Room): void {
    for (const timer of room.disconnectTimers.values()) clearTimeout(timer);
    room.disconnectTimers.clear();
    (['wolf', 'sheep'] as Role[]).forEach((role) => {
      const player = room.players[role];
      if (player) {
        player.roomCode = null;
        player.role = null;
      }
    });
    this.rooms.delete(room.code);
  }
}
