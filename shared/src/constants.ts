import type { Position } from './types.js';

export const BOARD_SIZE = 8;

/** Sheep's home row. The wolf wins by reaching it. */
export const TOP_ROW = 0;
export const BOTTOM_ROW = BOARD_SIZE - 1;

/** Classic Fox & Hounds convention: the hounds (sheep) move first. */
export const SHEEP_MOVES_FIRST = true;

/**
 * Starting squares. Dark squares are those where (row + column) is odd.
 * Row 0 dark squares: column = 1,3,5,7 -> the four sheep.
 * Row 7 dark squares: column = 0,2,4,6 -> the wolf starts centrally on column 4.
 */
export const INITIAL_SHEEP: readonly Position[] = [
  { row: 0, column: 1 },
  { row: 0, column: 3 },
  { row: 0, column: 5 },
  { row: 0, column: 7 },
];

export const INITIAL_WOLF: Position = { row: 7, column: 4 };
