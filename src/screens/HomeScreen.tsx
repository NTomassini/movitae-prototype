import { user } from '../data/data';
import { PlaceholderScreen } from './PlaceholderScreen';

// La Home vera arriva al passo 3 (flusso Home + Scopri e prenota).
export function HomeScreen() {
  return <PlaceholderScreen title={`Ciao ${user.name}`} />;
}
