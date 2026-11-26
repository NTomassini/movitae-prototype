import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { HomeScreen } from '../screens/HomeScreen';
import { ScopriScreen } from '../screens/ScopriScreen';
import { ConfirmScreen } from '../screens/ConfirmScreen';
import { PremiScreen } from '../screens/PremiScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';
import { TrophiesScreen } from '../screens/TrophiesScreen';
import { MoviScreen } from '../screens/MoviScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path="scopri" element={<ScopriScreen />} />
        <Route path="scopri/:activityId" element={<ScopriScreen />} />
        <Route path="prenotato/:id" element={<ConfirmScreen />} />
        <Route path="movi" element={<MoviScreen />} />
        <Route path="onboarding/:step" element={<OnboardingScreen />} />
        <Route path="prenotazioni" element={<BookingsScreen />} />
        <Route path="prenotazioni/:id" element={<BookingDetailScreen />} />
        <Route path="premi" element={<PremiScreen />} />
        <Route path="premi/traguardi" element={<TrophiesScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
