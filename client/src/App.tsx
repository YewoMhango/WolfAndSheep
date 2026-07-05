import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MenuScreen } from './screens/MenuScreen.js';
import { LocalGameScreen } from './screens/LocalGameScreen.js';
import { OnlineScreen } from './screens/OnlineScreen.js';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/local" element={<LocalGameScreen />} />
        <Route path="/online" element={<OnlineScreen />} />
        {/* Unknown paths fall back to the menu. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
