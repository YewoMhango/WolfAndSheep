import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { winnerFromStatus } from '@wolf/shared';
import { useLocalGame } from '../hooks/useLocalGame.js';
import { Board } from '../components/Board.js';
import { StatusBar } from '../components/StatusBar.js';
import { ResultModal } from '../components/ResultModal.js';
import { GameShell } from '../layout/GameShell.js';
import { Button } from '../ui/Button.js';
import styles from './LocalGameScreen.module.css';

export function LocalGameScreen() {
  const navigate = useNavigate();
  const { state, lastMove, move, reset } = useLocalGame();
  const toMenu = () => navigate('/');

  return (
    <GameShell
      title="Local match"
      onBack={toMenu}
      headerRight={
        <Button variant="ghost" icon={<RotateCcw size={18} aria-hidden />} onClick={reset}>
          Restart
        </Button>
      }
    >
      <StatusBar state={state} />

      <Board state={state} controls="both" interactive lastMove={lastMove} onMove={move} />

      <p className={styles.hint}>Pass the device between turns. Tap a piece to see its moves.</p>

      <ResultModal
        winner={winnerFromStatus(state.status)}
        primaryLabel="Play again"
        onPrimary={reset}
        secondaryLabel="Menu"
        onSecondary={toMenu}
      />
    </GameShell>
  );
}
