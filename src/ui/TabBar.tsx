import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './icons';
import './TabBar.css';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'Nav/Home' },
  { to: '/scopri', label: 'Scopri', icon: 'Nav/Explore' },
  { to: '/movi', label: 'Movi', icon: 'Nav/Movi' },
  { to: '/premi', label: 'Premi', icon: 'Nav/Rewards' },
];

/** Figma: TabBar 1442:350 — 362×62, padding 6, tab 87×48, sempre intera (§5). */
export function TabBar({ hidden = false }: { hidden?: boolean }) {
  const { pathname } = useLocation();
  // toccare di nuovo il tab attivo riporta in cima (convenzione iOS)
  const retap = (to: string) => (e: React.MouseEvent) => {
    if (pathname === to) {
      e.preventDefault();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('screen')?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  };
  return (
    <nav className={`tabbar${hidden ? ' tabbar--hidden' : ''}`} aria-label="Sezioni" aria-hidden={hidden || undefined}>
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className="tabbar-tab" onClick={retap(t.to)}>
          <Icon name={t.icon} />
          <span className="tabbar-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
