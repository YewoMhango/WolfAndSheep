import type { Winner } from '@wolf/shared';
import { Button } from '../ui/Button.js';
import { RoleIcon } from '../ui/GamePieceIcon.js';
import styles from './ResultModal.module.css';

interface ResultModalProps {
  winner: Winner;
  /** In online play, which side this client controlled. */
  myRole?: 'wolf' | 'sheep';
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
  note?: string;
}

export function ResultModal({
  winner,
  myRole,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  note,
}: ResultModalProps) {
  if (!winner) return null;

  const won = myRole != null && winner === myRole;
  const lost = myRole != null && winner !== myRole;

  const heading = won ? 'Victory!' : lost ? 'Defeat' : winner === 'wolf' ? 'Wolf wins!' : 'Sheep win!';

  const description =
    winner === 'wolf' ? 'The wolf slipped past the flock.' : 'The sheep cornered the wolf.';

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <RoleIcon role={winner} size={72} className={styles.icon} />
        <h2 className={styles.heading}>{heading}</h2>
        <p className={styles.description}>{description}</p>
        {note && <p className={styles.note}>{note}</p>}
        <div className={styles.actions}>
          <Button variant="primary" fullWidth onClick={onPrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </Button>
          <Button fullWidth onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
