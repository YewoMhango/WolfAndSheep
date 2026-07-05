import { useCallback, useState } from 'react';
import { applyMove, createInitialState, type GameState, type Move } from '@wolf/shared';

/** Local hot-seat game: both sides played on one device. */
export function useLocalGame() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const move = useCallback((move: Move) => {
    setState((current) => {
      try {
        return applyMove(current, move);
      } catch {
        return current; // ignore illegal moves defensively; the UI only offers legal ones
      }
    });
    setLastMove(move);
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
    setLastMove(null);
  }, []);

  return { state, lastMove, move, reset };
}
