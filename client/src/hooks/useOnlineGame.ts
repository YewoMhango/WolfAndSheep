import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ClientMessage,
  GameState,
  Move,
  Position,
  Role,
  RolePreference,
  ServerMessage,
} from '@wolf/shared';
import { createGameSocket, type ConnectionStatus, type GameSocket } from '../net/socket.js';

export type OnlinePhase = 'lobby' | 'hosting' | 'searching' | 'playing';

/** Reconstruct which piece moved by diffing two consecutive states. */
function diffMove(previous: GameState, next: GameState): Move | null {
  const occupiedKeys = (state: GameState) => {
    const keys = new Set<string>();
    keys.add(`${state.wolf.row},${state.wolf.column}`);
    state.sheep.forEach((piece) => keys.add(`${piece.row},${piece.column}`));
    return keys;
  };
  const previousKeys = occupiedKeys(previous);
  const nextKeys = occupiedKeys(next);
  const keyToPosition = (key: string): Position => {
    const [row, column] = key.split(',').map(Number);
    return { row, column };
  };
  let from: Position | null = null;
  let to: Position | null = null;
  for (const key of previousKeys) if (!nextKeys.has(key)) from = keyToPosition(key);
  for (const key of nextKeys) if (!previousKeys.has(key)) to = keyToPosition(key);
  return from && to ? { from, to } : null;
}

export interface OnlineApi {
  connectionStatus: ConnectionStatus;
  phase: OnlinePhase;
  role: Role | null;
  state: GameState | null;
  lastMove: Move | null;
  code: string | null;
  queue: { position: number; size: number } | null;
  opponentConnected: boolean;
  rematchRequested: boolean;
  error: string | null;
  banner: string | null;
  createRoom: (preference: RolePreference) => void;
  joinRoom: (code: string) => void;
  quickMatch: (preference: RolePreference) => void;
  cancelMatch: () => void;
  makeMove: (move: Move) => void;
  rematch: () => void;
  leave: () => void;
  clearError: () => void;
}

export function useOnlineGame(): OnlineApi {
  const socketRef = useRef<GameSocket | null>(null);
  const previousStateRef = useRef<GameState | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [phase, setPhase] = useState<OnlinePhase>('lobby');
  const [role, setRole] = useState<Role | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [queue, setQueue] = useState<{ position: number; size: number } | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (message: ServerMessage) => {
      switch (message.type) {
        case 'welcome':
          break;
        case 'room_created':
          setPhase('hosting');
          setCode(message.code);
          setRole(message.role);
          setError(null);
          break;
        case 'queued':
          setPhase('searching');
          setQueue({ position: message.position, size: message.size });
          break;
        case 'match_cancelled':
          setPhase('lobby');
          setQueue(null);
          break;
        case 'game_start':
          setPhase('playing');
          setRole(message.role);
          setCode(message.code);
          setState(message.state);
          previousStateRef.current = message.state;
          setLastMove(null);
          setQueue(null);
          setOpponentConnected(true);
          setRematchRequested(false);
          setError(null);
          setBanner(null);
          break;
        case 'state':
        case 'game_over': {
          const previous = previousStateRef.current;
          setLastMove(previous ? diffMove(previous, message.state) : null);
          previousStateRef.current = message.state;
          setState(message.state);
          break;
        }
        case 'opponent_disconnected':
          setOpponentConnected(false);
          setBanner('Opponent disconnected — waiting for them to return…');
          break;
        case 'opponent_reconnected':
          setOpponentConnected(true);
          setBanner('Opponent reconnected.');
          break;
        case 'opponent_left':
          setError('Your opponent left the game.');
          setBanner(null);
          setPhase('lobby');
          setState(null);
          setRole(null);
          setCode(null);
          previousStateRef.current = null;
          break;
        case 'error':
          setError(message.message);
          break;
      }
    };

    const socket = createGameSocket({ onStatus: setConnectionStatus, onMessage: handleMessage });
    socketRef.current = socket;
    return () => socket.close();
  }, []);

  const send = useCallback((message: ClientMessage) => socketRef.current?.send(message), []);

  const createRoom = useCallback(
    (preference: RolePreference) => {
      setError(null);
      send({ type: 'create_room', rolePreference: preference });
    },
    [send],
  );
  const joinRoom = useCallback(
    (code: string) => {
      setError(null);
      send({ type: 'join_room', code: code.trim().toUpperCase() });
    },
    [send],
  );
  const quickMatch = useCallback(
    (preference: RolePreference) => {
      setError(null);
      send({ type: 'quick_match', rolePreference: preference });
    },
    [send],
  );
  const cancelMatch = useCallback(() => {
    send({ type: 'cancel_match' });
    setPhase('lobby');
    setQueue(null);
  }, [send]);
  const makeMove = useCallback((move: Move) => send({ type: 'move', move }), [send]);
  const rematch = useCallback(() => {
    setRematchRequested(true);
    send({ type: 'rematch' });
  }, [send]);
  const leave = useCallback(() => {
    send({ type: 'leave' });
    setPhase('lobby');
    setState(null);
    setRole(null);
    setCode(null);
    setQueue(null);
    setRematchRequested(false);
    previousStateRef.current = null;
  }, [send]);
  const clearError = useCallback(() => setError(null), []);

  return {
    connectionStatus,
    phase,
    role,
    state,
    lastMove,
    code,
    queue,
    opponentConnected,
    rematchRequested,
    error,
    banner,
    createRoom,
    joinRoom,
    quickMatch,
    cancelMatch,
    makeMove,
    rematch,
    leave,
    clearError,
  };
}
