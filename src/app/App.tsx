import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeScreen } from '../screens/HomeScreen';
import { ScopriScreen } from '../screens/ScopriScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="scopri" element={<ScopriScreen />} />
        <Route path="movi" element={<PlaceholderScreen title="Movi" />} />
        <Route path="premi" element={<PlaceholderScreen title="Premi" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
