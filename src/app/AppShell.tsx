import { Outlet } from 'react-router-dom';
import { TabBar } from '../ui/TabBar';
import { ScrollEdge } from '../ui/ScrollEdge';
import { StatusBar, HomeIndicator } from './DeviceChrome';

/**
 * Cornice dell'app. Sul telefono occupa tutto lo schermo e usa le safe area vere;
 * su desktop mostra un iPhone 17 Pro (402×874) con barra di stato e indicatore Home disegnati,
 * così le schermate si confrontano 1:1 con Figma.
 */
export function AppShell() {
  return (
    <div className="stage">
      <div className="device">
        <StatusBar />
        <main className="screen" id="screen">
          <Outlet />
        </main>
        <div id="overlay" />
        <ScrollEdge position="bottom" height={83} />
        <TabBar />
        <HomeIndicator />
      </div>
    </div>
  );
}
