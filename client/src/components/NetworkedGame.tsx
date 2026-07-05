import { winnerFromStatus } from '@wolf/shared';
import type { OnlineApi } from '../hooks/useOnlineGame.js';
import { Board } from './Board.js';
import { StatusBar } from './StatusBar.js';
import { ResultModal } from './ResultModal.js';
import { GameShell } from '../layout/GameShell.js';
import { ConnectionIndicator } from '../ui/ConnectionIndicator.js';
import { RoleIcon } from '../ui/GamePieceIcon.js';
import styles from './NetworkedGame.module.css';

interface NetworkedGameProps {
  api: OnlineApi;
  onExitToMenu: () => void;
}

export function NetworkedGame({ api, onExitToMenu }: NetworkedGameProps) {
  const state = api.state!;
  const role = api.role!;
  const interactive = api.connectionStatus === 'online' && api.opponentConnected;
  const winner = winnerFromStatus(state.status);

  return (
    <GameShell
      title={`Online · ${api.code}`}
      onBack={onExitToMenu}
      headerRight={<ConnectionIndicator status={api.connectionStatus} showLabel={false} />}
    >
      <StatusBar state={state} myRole={role} />

      {api.banner && <div className={styles.banner}>{api.banner}</div>}

      <Board
        state={state}
        controls={role}
        interactive={interactive}
        flip={role === 'sheep'}
        lastMove={api.lastMove}
        onMove={api.makeMove}
      />

      <p className={styles.hint}>
        You are{' '}
        <span className={styles.hintRole}>
          <RoleIcon role={role} size={18} /> the {role}
        </span>
        .{!api.opponentConnected && ' Opponent is away…'}
      </p>

      <ResultModal
        winner={winner}
        myRole={role}
        primaryLabel={api.rematchRequested ? 'Waiting for opponent…' : 'Rematch'}
        primaryDisabled={api.rematchRequested}
        onPrimary={api.rematch}
        secondaryLabel="Leave"
        onSecondary={onExitToMenu}
        note={api.rematchRequested ? 'Rematch requested — sides will swap.' : undefined}
      />
    </GameShell>
  );
}
