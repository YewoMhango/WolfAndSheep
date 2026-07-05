/** A square on the board. Rows increase downward (row 0 = top). */
export interface Position {
  row: number;
  column: number;
}

/** The two sides. Sheep is a single player controlling all four sheep pieces. */
export type Role = 'wolf' | 'sheep';

/** Preference used when matchmaking / assigning sides. */
export type RolePreference = 'wolf' | 'sheep' | 'either';

/** Terminal or ongoing state of a game. */
export type Status = 'playing' | 'wolf_win' | 'sheep_win';

/** Resolved winner, or null while playing. */
export type Winner = 'wolf' | 'sheep' | null;

/** A single-step diagonal move from one square to an adjacent one. */
export interface Move {
  from: Position;
  to: Position;
}

/**
 * Full game state. `turn` is the side to move next; `status` always reflects
 * the position *with `turn` on the move* (so a trapped side-to-move is already
 * decided).
 */
export interface GameState {
  wolf: Position;
  sheep: Position[]; // always length 4
  turn: Role;
  status: Status;
}
