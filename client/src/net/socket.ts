import { decodeServer, encode, type ClientMessage, type ServerMessage } from '@wolf/shared';

const TOKEN_KEY = 'wolf_session';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

export interface GameSocket {
  send(message: ClientMessage): void;
  close(): void;
}

interface GameSocketHandlers {
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
}

/**
 * WebSocket client with automatic reconnect. On (re)connect it sends `hello`
 * with the per-tab session token so the server can resume an in-progress game.
 */
export function createGameSocket({ onMessage, onStatus }: GameSocketHandlers): GameSocket {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;

  const buildUrl = () => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${location.host}/ws`;
  };

  function connect() {
    onStatus('connecting');
    socket = new WebSocket(buildUrl());

    socket.onopen = () => {
      attempts = 0;
      onStatus('online');
      const token = sessionStorage.getItem(TOKEN_KEY) ?? undefined;
      socket!.send(encode({ type: 'hello', sessionToken: token }));
    };

    socket.onmessage = (event) => {
      let message: ServerMessage;
      try {
        message = decodeServer(event.data as string);
      } catch {
        return;
      }
      if (message.type === 'welcome') {
        sessionStorage.setItem(TOKEN_KEY, message.sessionToken);
      }
      onMessage(message);
    };

    socket.onclose = () => {
      onStatus('offline');
      if (!closedByUser) scheduleReconnect();
    };

    socket.onerror = () => {
      /* onclose fires next; reconnect handled there */
    };
  }

  function scheduleReconnect() {
    attempts += 1;
    const delay = Math.min(1000 * attempts, 5000);
    reconnectTimer = setTimeout(connect, delay);
  }

  connect();

  return {
    send(message) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(encode(message));
      }
    },
    close() {
      closedByUser = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
