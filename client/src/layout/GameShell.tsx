import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button.js';
import styles from './GameShell.module.css';

interface GameShellProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  /** Content shown at the right of the header (e.g. a restart button or status). */
  headerRight?: ReactNode;
  children: ReactNode;
}

/** Shared frame for every in-game screen: a header row plus a flexible content area. */
export function GameShell({ title, onBack, backLabel = 'Menu', headerRight, children }: GameShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.left}>
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} aria-hidden />}
            onClick={onBack}
            aria-label="Back to menu"
          >
            {backLabel}
          </Button>
        </div>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.right}>{headerRight}</div>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
