import { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from '../ui/TabBar';
import { ScrollEdge } from '../ui/ScrollEdge';
import { StatusBar, HomeIndicator } from './DeviceChrome';
import { ChromeProvider, useChrome } from './chrome';

/**
 * Cornice dell'app. Sul telefono occupa tutto lo schermo e usa le safe area vere;
 * su desktop mostra un iPhone 17 Pro (402×874) con barra di stato e indicatore Home disegnati,
 * così le schermate si confrontano 1:1 con Figma.
 */
export function AppShell() {
  return (
    <ChromeProvider>
      <Device />
    </ChromeProvider>
  );
}

// Ogni sezione ricorda dove l'avevi lasciata (come le tab di iOS); una pagina nuova parte dall'alto.
const scrollMemory = new Map<string, number>();

function Device() {
  const chrome = useChrome();
  const { pathname } = useLocation();
  const prev = useRef(pathname);
  useLayoutEffect(() => {
    const el = document.getElementById('screen');
    if (!el) return;
    scrollMemory.set(prev.current, el.scrollTop);
    el.scrollTop = scrollMemory.get(pathname) ?? 0;
    prev.current = pathname;
  }, [pathname]);
  return (
    <div className="stage">
      <div className="device">
        <StatusBar />
        <main className={`screen${chrome.pageScroll ? '' : ' screen--fixed'}`} id="screen">
          <Outlet />
        </main>
        <div id="overlay" />
        {chrome.bottomEdge && <ScrollEdge position="bottom" height={83} />}
        <TabBar hidden={!chrome.tabBar} />
        <HomeIndicator />
      </div>
    </div>
  );
}
