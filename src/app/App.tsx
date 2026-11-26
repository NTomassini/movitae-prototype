import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeScreen } from '../screens/HomeScreen';
import { ScopriScreen } from '../screens/ScopriScreen';
import { ConfirmScreen } from '../screens/ConfirmScreen';
import { PremiScreen } from '../screens/PremiScreen';
import { TrophiesScreen } from '../screens/TrophiesScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="scopri" element={<ScopriScreen />} />
        <Route path="scopri/:activityId" element={<ScopriScreen />} />
        <Route path="prenotato/:id" element={<ConfirmScreen />} />
        <Route path="movi" element={<PlaceholderScreen title="Movi" />} />
        <Route path="premi" element={<PremiScreen />} />
        <Route path="premi/traguardi" element={<TrophiesScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
