import {
  BOARD_SIZE,
  TOP_ROW,
  SHEEP_MOVES_FIRST,
  INITIAL_SHEEP,
  INITIAL_WOLF,
} from './constants.js';
import type { GameState, Move, Position, Role, Status, Winner } from './types.js';

/** Diagonal step directions. */
const WOLF_DIRECTIONS = [
  { deltaRow: -1, deltaColumn: -1 },
  { deltaRow: -1, deltaColumn: 1 },
  { deltaRow: 1, deltaColumn: -1 },
  { deltaRow: 1, deltaColumn: 1 },
] as const;

/** Sheep only advance toward the wolf (increasing row). */
const SHEEP_DIRECTIONS = [
  { deltaRow: 1, deltaColumn: -1 },
  { deltaRow: 1, deltaColumn: 1 },
] as const;

export function inBounds(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.column >= 0 &&
    position.column < BOARD_SIZE
  );
}

/** Dark (playable) squares are those where (row + column) is odd. */
export function isDark(position: Position): boolean {
  return (position.row + position.column) % 2 === 1;
}

export function positionsEqual(a: Position, b: Position): boolean {
  return a.row === b.row && a.column === b.column;
}

export function positionKey(position: Position): string {
  return `${position.row},${position.column}`;
}

/** Which piece, if any, occupies a square. */
export function occupant(state: GameState, position: Position): Role | null {
  if (positionsEqual(state.wolf, position)) return 'wolf';
  if (state.sheep.some((sheep) => positionsEqual(sheep, position))) return 'sheep';
  return null;
}

export function createInitialState(): GameState {
  const state: GameState = {
    wolf: { ...INITIAL_WOLF },
    sheep: INITIAL_SHEEP.map((sheep) => ({ ...sheep })),
    turn: SHEEP_MOVES_FIRST ? 'sheep' : 'wolf',
    status: 'playing',
  };
  state.status = computeStatus(state);
  return state;
}

/** Legal single-step diagonal moves for the piece on `from` (regardless of turn). */
export function legalMovesFor(state: GameState, from: Position): Move[] {
  const mover = occupant(state, from);
  if (!mover) return [];
  const directions = mover === 'wolf' ? WOLF_DIRECTIONS : SHEEP_DIRECTIONS;
  const moves: Move[] = [];
  for (const { deltaRow, deltaColumn } of directions) {
    const to: Position = { row: from.row + deltaRow, column: from.column + deltaColumn };
    if (inBounds(to) && occupant(state, to) === null) {
      moves.push({ from: { ...from }, to });
    }
  }
  return moves;
}

/** Every legal move available to `role` in the current position. */
export function allLegalMoves(state: GameState, role: Role): Move[] {
  if (role === 'wolf') return legalMovesFor(state, state.wolf);
  return state.sheep.flatMap((sheep) => legalMovesFor(state, sheep));
}

/** Is `move` legal for the side whose turn it is? */
export function isLegalMove(state: GameState, move: Move): boolean {
  if (state.status !== 'playing') return false;
  if (occupant(state, move.from) !== state.turn) return false;
  return legalMovesFor(state, move.from).some((candidate) => positionsEqual(candidate.to, move.to));
}

/**
 * Derive the status of a position with `state.turn` on the move:
 * - wolf on the top row -> wolf broke through.
 * - side to move has no legal moves -> if wolf, it is trapped (sheep win);
 *   if sheep, they can no longer block (wolf wins).
 */
export function computeStatus(state: GameState): Status {
  if (state.wolf.row === TOP_ROW) return 'wolf_win';
  if (allLegalMoves(state, state.turn).length === 0) {
    return state.turn === 'wolf' ? 'sheep_win' : 'wolf_win';
  }
  return 'playing';
}

/** Apply a move, returning a new immutable state. Throws on an illegal move. */
export function applyMove(state: GameState, move: Move): GameState {
  if (!isLegalMove(state, move)) {
    throw new Error('Illegal move');
  }
  const mover = occupant(state, move.from)!;
  const next: GameState = {
    wolf: mover === 'wolf' ? { ...move.to } : { ...state.wolf },
    sheep:
      mover === 'sheep'
        ? state.sheep.map((sheep) => (positionsEqual(sheep, move.from) ? { ...move.to } : { ...sheep }))
        : state.sheep.map((sheep) => ({ ...sheep })),
    turn: state.turn === 'wolf' ? 'sheep' : 'wolf',
    status: 'playing',
  };
  next.status = computeStatus(next);
  return next;
}

export function winnerFromStatus(status: Status): Winner {
  if (status === 'wolf_win') return 'wolf';
  if (status === 'sheep_win') return 'sheep';
  return null;
}

export function otherRole(role: Role): Role {
  return role === 'wolf' ? 'sheep' : 'wolf';
}
