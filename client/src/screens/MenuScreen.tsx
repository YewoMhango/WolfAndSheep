import { useNavigate } from 'react-router-dom';
import { Globe, Users } from 'lucide-react';
import { WolfIcon, SheepIcon } from '../ui/GamePieceIcon.js';
import { GitHubIcon } from '../ui/GitHubIcon.js';
import styles from './MenuScreen.module.css';

const REPO_URL = 'https://github.com/YewoMhango/WolfAndSheep';

export function MenuScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.menu}>
      <div className={styles.hero}>
        <div className={styles.heroIcons}>
          <WolfIcon size={56} />
          <SheepIcon size={56} />
        </div>
        <h1 className={styles.title}>Wolf &amp; Sheep</h1>
        <p className={styles.tagline}>
          One wolf, four sheep, one board. The sheep try to trap the wolf; the wolf tries to slip
          past them.
        </p>
      </div>

      <div className={styles.buttons}>
        <button className={`${styles.bigButton} ${styles.primary}`} onClick={() => navigate('/local')}>
          <Users size={30} aria-hidden />
          <span className={styles.bigButtonText}>
            <strong>Local match</strong>
            <small>Two players, one device</small>
          </span>
        </button>
        <button className={styles.bigButton} onClick={() => navigate('/online')}>
          <Globe size={30} aria-hidden />
          <span className={styles.bigButtonText}>
            <strong>Play online</strong>
            <small>Room code or quick match</small>
          </span>
        </button>
      </div>

      <details className={styles.rules}>
        <summary>How to play</summary>
        <ul>
          <li>The board uses the dark squares only; every move is one diagonal step.</li>
          <li>
            <span className={styles.inlineRole}>
              <SheepIcon size={16} /> Sheep
            </span>{' '}
            move first and can only move <em>forward</em> (never backward).
          </li>
          <li>
            The{' '}
            <span className={styles.inlineRole}>
              <WolfIcon size={16} /> wolf
            </span>{' '}
            moves one step in <em>any</em> diagonal direction.
          </li>
          <li>No jumping or capturing — pieces just block each other.</li>
          <li>
            <strong>Wolf wins</strong> by reaching the sheep's home row.
          </li>
          <li>
            <strong>Sheep win</strong> by trapping the wolf so it can't move.
          </li>
        </ul>
      </details>

      <a
        className={styles.repoLink}
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon size={18} />
        View source on GitHub
      </a>
    </div>
  );
}
