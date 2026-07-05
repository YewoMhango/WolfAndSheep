import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles/theme.css';

// Note: StrictMode is intentionally omitted. Its dev-only double-invocation of
// effects would open the online WebSocket twice, which confuses matchmaking.
createRoot(document.getElementById('root')!).render(<App />);
