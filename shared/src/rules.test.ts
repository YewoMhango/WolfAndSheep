import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  legalMovesFor,
  allLegalMoves,
  isLegalMove,
  applyMove,
  computeStatus,
  occupant,
  isDark,
  inBounds,
} from './rules.js';
import type { GameState, Move, Position } from './types.js';

const at = (row: number, column: number): Position => ({ row, column });

describe('board helpers', () => {
  it('marks (row+column) odd squares as dark', () => {
    expect(isDark(at(0, 1))).toBe(true);
    expect(isDark(at(0, 0))).toBe(false);
    expect(isDark(at(7, 4))).toBe(true);
  });

  it('detects out-of-bounds squares', () => {
    expect(inBounds(at(0, 0))).toBe(true);
    expect(inBounds(at(-1, 0))).toBe(false);
    expect(inBounds(at(8, 3))).toBe(false);
  });
});

describe('initial state', () => {
  it('places 4 sheep on the top row and the wolf on the bottom row, sheep to move', () => {
    const state = createInitialState();
    expect(state.sheep).toHaveLength(4);
    expect(state.sheep.every((sheep) => sheep.row === 0)).toBe(true);
    expect(state.wolf.row).toBe(7);
    expect(state.turn).toBe('sheep');
    expect(state.status).toBe('playing');
    // All starting squares are dark.
    expect(state.sheep.every(isDark)).toBe(true);
    expect(isDark(state.wolf)).toBe(true);
  });
});

describe('legal moves', () => {
  it('sheep may only move diagonally forward (increasing row)', () => {
    const state = createInitialState();
    const moves = legalMovesFor(state, at(0, 1));
    // From (0,1): forward targets are (1,0) and (1,2), both empty & in-bounds.
    expect(moves.map((move) => move.to).sort((a, b) => a.column - b.column)).toEqual([
      at(1, 0),
      at(1, 2),
    ]);
    // Never backward.
    expect(moves.every((move) => move.to.row > move.from.row)).toBe(true);
  });

  it('wolf may move diagonally in all four directions', () => {
    const state = createInitialState();
    const moves = legalMovesFor(state, state.wolf); // wolf at (7,4)
    const targets = moves.map((move) => `${move.to.row},${move.to.column}`).sort();
    expect(targets).toEqual(['6,3', '6,5']); // (8,*) is off-board, so only the two upward diagonals
  });

  it('does not allow moving onto an occupied square', () => {
    const state: GameState = {
      wolf: at(6, 3),
      sheep: [at(5, 2), at(5, 4), at(0, 5), at(0, 7)],
      turn: 'wolf',
      status: 'playing',
    };
    const moves = legalMovesFor(state, state.wolf);
    const targets = moves.map((move) => `${move.to.row},${move.to.column}`);
    // (5,2) and (5,4) are occupied by sheep -> excluded; (7,2) and (7,4) allowed.
    expect(targets).not.toContain('5,2');
    expect(targets).not.toContain('5,4');
    expect(targets.sort()).toEqual(['7,2', '7,4']);
  });
});

describe('applyMove', () => {
  it('flips the turn and moves the piece', () => {
    const state = createInitialState();
    const move: Move = { from: at(0, 1), to: at(1, 2) };
    const next = applyMove(state, move);
    expect(occupant(next, at(1, 2))).toBe('sheep');
    expect(occupant(next, at(0, 1))).toBe(null);
    expect(next.turn).toBe('wolf');
    // Original state is unchanged (immutability).
    expect(occupant(state, at(0, 1))).toBe('sheep');
  });

  it('rejects illegal moves', () => {
    const state = createInitialState();
    // Wolf's piece but it is sheep's turn.
    expect(isLegalMove(state, { from: state.wolf, to: at(6, 3) })).toBe(false);
    expect(() => applyMove(state, { from: state.wolf, to: at(6, 3) })).toThrow();
    // Sheep moving backward is illegal.
    expect(isLegalMove(state, { from: at(0, 1), to: at(-1, 0) })).toBe(false);
  });
});

describe('win conditions', () => {
  it('wolf wins by reaching the top row', () => {
    // Wolf just moved to the top row; now sheep to move.
    const state: GameState = {
      wolf: at(0, 3),
      sheep: [at(3, 1), at(3, 3), at(3, 5), at(3, 7)],
      turn: 'sheep',
      status: 'playing',
    };
    expect(computeStatus(state)).toBe('wolf_win');
  });

  it('sheep win by trapping the wolf in a corner', () => {
    // Wolf at (7,0) corner: its only diagonal is (6,1). Block it with a sheep.
    const state: GameState = {
      wolf: at(7, 0),
      sheep: [at(6, 1), at(0, 3), at(0, 5), at(0, 7)],
      turn: 'wolf',
      status: 'playing',
    };
    expect(allLegalMoves(state, 'wolf')).toHaveLength(0);
    expect(computeStatus(state)).toBe('sheep_win');
  });

  it('applyMove sets sheep_win when the move traps the wolf', () => {
    // Sheep at (5,2) moves to (6,1), trapping the wolf cornered at (7,0).
    const state: GameState = {
      wolf: at(7, 0),
      sheep: [at(5, 2), at(0, 3), at(0, 5), at(0, 7)],
      turn: 'sheep',
      status: 'playing',
    };
    const next = applyMove(state, { from: at(5, 2), to: at(6, 1) });
    expect(next.turn).toBe('wolf');
    expect(next.status).toBe('sheep_win');
  });

  it('reports playing in the opening position', () => {
    expect(createInitialState().status).toBe('playing');
  });
});
