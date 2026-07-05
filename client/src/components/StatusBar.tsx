import type { GameState, Role } from '@wolf/shared';
import { RoleIcon } from '../ui/GamePieceIcon.js';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  state: GameState;
  /** In online play, which side this client controls (to phrase "your turn"). */
  myRole?: Role;
}

export function StatusBar({ state, myRole }: StatusBarProps) {
  let text: string;
  let iconRole: Role;
  let tone: 'wolf' | 'sheep' | 'neutral' = state.turn;

  if (state.status === 'playing') {
    iconRole = state.turn;
    if (myRole) {
      text = state.turn === myRole ? 'Your turn' : "Opponent's turn";
    } else {
      text = state.turn === 'wolf' ? 'Wolf to move' : 'Sheep to move';
    }
  } else {
    tone = 'neutral';
    const winner: Role = state.status === 'wolf_win' ? 'wolf' : 'sheep';
    iconRole = winner;
    if (myRole) {
      text = winner === myRole ? 'You win!' : 'You lose';
    } else {
      text = winner === 'wolf' ? 'The wolf broke through — Wolf wins!' : 'The wolf is trapped — Sheep win!';
    }
  }

  return (
    <div className={`${styles.statusBar} ${styles[tone]}`}>
      <span>{text}</span>
      <RoleIcon role={iconRole} size={22} className={styles.icon} />
    </div>
  );
}
