import { useEffect, useState } from 'react';
import {
  BOARD_SIZE,
  isDark,
  legalMovesFor,
  occupant,
  positionsEqual,
  positionKey,
  type GameState,
  type Move,
  type Position,
  type Role,
} from '@wolf/shared';
import { RoleIcon } from '../ui/GamePieceIcon.js';
import styles from './Board.module.css';

interface BoardProps {
  state: GameState;
  /** Which side(s) this client is allowed to move. */
  controls: Role | 'both';
  /** Master switch — false disables all input (not your turn, game over, disconnected). */
  interactive: boolean;
  /** Render from the wolf's perspective (bottom row nearest). */
  flip?: boolean;
  /** The most recent move, highlighted for context. */
  lastMove?: Move | null;
  onMove: (move: Move) => void;
}

const RANGE = Array.from({ length: BOARD_SIZE }, (_, index) => index);

export function Board({ state, controls, interactive, flip = false, lastMove, onMove }: BoardProps) {
  const [selected, setSelected] = useState<Position | null>(null);

  const canControlTurn = controls === 'both' || controls === state.turn;
  const isMyTurn = interactive && state.status === 'playing' && canControlTurn;

  // Drop a stale selection whenever the turn or game status changes.
  useEffect(() => {
    setSelected(null);
  }, [state.turn, state.status]);

  const targets = selected ? legalMovesFor(state, selected).map((move) => move.to) : [];
  const targetKeys = new Set(targets.map(positionKey));

  function handleClick(position: Position) {
    if (!isMyTurn) return;
    if (selected && targetKeys.has(positionKey(position))) {
      onMove({ from: selected, to: position });
      setSelected(null);
      return;
    }
    if (occupant(state, position) === state.turn) {
      setSelected((previous) => (previous && positionsEqual(previous, position) ? null : position));
      return;
    }
    setSelected(null);
  }

  const rows = flip ? [...RANGE].reverse() : RANGE;
  const columns = flip ? [...RANGE].reverse() : RANGE;

  return (
    <div className={styles.boardArea}>
      <div className={styles.board} role="grid" aria-label="Wolf and Sheep board" data-testid="board">
        {rows.map((row) =>
          columns.map((column) => {
            const position = { row, column };
            const dark = isDark(position);
            const piece = occupant(state, position);
            const isSelected = selected != null && positionsEqual(selected, position);
            const isTarget = targetKeys.has(positionKey(position));
            const isLastFrom = lastMove != null && positionsEqual(lastMove.from, position);
            const isLastTo = lastMove != null && positionsEqual(lastMove.to, position);
            const clickable = isMyTurn && dark && (piece === state.turn || isTarget);

            const classes = [
              styles.square,
              dark ? styles.dark : styles.light,
              isSelected ? styles.selected : '',
              isTarget ? styles.target : '',
              isLastFrom || isLastTo ? styles.lastMove : '',
              clickable ? styles.clickable : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={positionKey(position)}
                className={classes}
                role="gridcell"
                aria-label={`${dark ? 'dark' : 'light'} square${piece ? `, ${piece}` : ''}`}
                data-piece={piece ?? undefined}
                data-target={isTarget ? 'true' : undefined}
                onClick={() => dark && handleClick(position)}
              >
                {piece && <RoleIcon role={piece} size="82%" className={styles.piece} />}
                {isTarget && !piece && <span className={styles.dot} />}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
