import { useState, type ReactNode } from 'react';
import type { RolePreference } from '@wolf/shared';
import { Check, Copy, Dices } from 'lucide-react';
import type { OnlineApi } from '../hooks/useOnlineGame.js';
import { WolfIcon, SheepIcon } from '../ui/GamePieceIcon.js';
import { Button } from '../ui/Button.js';
import { Spinner } from '../ui/Spinner.js';
import { ConnectionIndicator } from '../ui/ConnectionIndicator.js';
import { GameShell } from '../layout/GameShell.js';
import styles from './OnlineLobby.module.css';

const ROLE_OPTIONS: { value: RolePreference; label: string; icon: ReactNode }[] = [
  { value: 'wolf', label: 'Wolf', icon: <WolfIcon size={20} /> },
  { value: 'sheep', label: 'Sheep', icon: <SheepIcon size={20} /> },
  { value: 'either', label: 'Either', icon: <Dices size={20} aria-hidden /> },
];

function RolePicker({
  value,
  onChange,
}: {
  value: RolePreference;
  onChange: (value: RolePreference) => void;
}) {
  return (
    <div className={styles.rolePicker}>
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.roleButton} ${value === option.value ? styles.roleActive : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Inline "Wolf"/"Sheep" name preceded by its icon. */
function RoleName({ preference }: { preference: RolePreference }) {
  if (preference === 'wolf') {
    return (
      <span className={styles.roleName}>
        <WolfIcon size={18} /> Wolf
      </span>
    );
  }
  return (
    <span className={styles.roleName}>
      <SheepIcon size={18} /> Sheep
    </span>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };
  return (
    <Button
      icon={copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
      onClick={copy}
      aria-label="Copy room code"
    >
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

interface OnlineLobbyProps {
  api: OnlineApi;
  onExitToMenu: () => void;
}

export function OnlineLobby({ api, onExitToMenu }: OnlineLobbyProps) {
  const [createPreference, setCreatePreference] = useState<RolePreference>('either');
  const [quickPreference, setQuickPreference] = useState<RolePreference>('either');
  const [joinCode, setJoinCode] = useState('');
  const online = api.connectionStatus === 'online';

  // --- Hosting a private room, waiting for someone to join ---
  if (api.phase === 'hosting' && api.code && api.role) {
    return (
      <GameShell title="Private game" onBack={onExitToMenu}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Share this code</h3>
          <div className={styles.codeDisplay} data-testid="room-code">
            {api.code}
          </div>
          <div className={styles.copyRow}>
            <CopyCodeButton code={api.code} />
          </div>
          <p className={styles.waiting}>
            You'll play as <RoleName preference={api.role} />. Waiting for an opponent…
          </p>
          <Spinner />
          <Button fullWidth onClick={api.leave}>
            Cancel
          </Button>
        </div>
      </GameShell>
    );
  }

  // --- Searching for a random opponent ---
  if (api.phase === 'searching') {
    return (
      <GameShell title="Quick match" onBack={onExitToMenu}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Finding an opponent…</h3>
          <Spinner />
          {api.queue && (
            <p className={styles.waiting}>
              You are #{api.queue.position} in the queue ({api.queue.size} waiting)
            </p>
          )}
          <Button fullWidth onClick={api.cancelMatch}>
            Cancel
          </Button>
        </div>
      </GameShell>
    );
  }

  // --- Lobby ---
  return (
    <GameShell title="Play online" onBack={onExitToMenu}>
      <div className={styles.connectionRow}>
        <ConnectionIndicator status={api.connectionStatus} />
      </div>

      {api.error && (
        <button type="button" className={styles.error} onClick={api.clearError}>
          {api.error} (tap to dismiss)
        </button>
      )}

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Create a private game</h3>
          <RolePicker value={createPreference} onChange={setCreatePreference} />
          <Button
            variant="primary"
            fullWidth
            disabled={!online}
            onClick={() => api.createRoom(createPreference)}
          >
            Create game &amp; get code
          </Button>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Join with a code</h3>
          <div className={styles.field}>
            <input
              className={styles.input}
              value={joinCode}
              maxLength={5}
              placeholder="ABCDE"
              aria-label="Room code"
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && joinCode.length === 5) api.joinRoom(joinCode);
              }}
            />
            <Button
              variant="primary"
              disabled={!online || joinCode.length !== 5}
              onClick={() => api.joinRoom(joinCode)}
            >
              Join
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Quick match</h3>
          <RolePicker value={quickPreference} onChange={setQuickPreference} />
          <Button
            variant="primary"
            fullWidth
            disabled={!online}
            onClick={() => api.quickMatch(quickPreference)}
          >
            Find a random opponent
          </Button>
        </div>
      </div>
    </GameShell>
  );
}
