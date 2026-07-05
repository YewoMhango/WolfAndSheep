import { useNavigate } from 'react-router-dom';
import { useOnlineGame } from '../hooks/useOnlineGame.js';
import { OnlineLobby } from '../components/OnlineLobby.js';
import { NetworkedGame } from '../components/NetworkedGame.js';

export function OnlineScreen() {
  const navigate = useNavigate();
  const api = useOnlineGame();

  const backToMenu = () => {
    api.leave();
    navigate('/');
  };

  if (api.phase === 'playing' && api.state && api.role) {
    return <NetworkedGame api={api} onExitToMenu={backToMenu} />;
  }
  return <OnlineLobby api={api} onExitToMenu={backToMenu} />;
}
