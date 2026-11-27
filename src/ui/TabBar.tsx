import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import type { IconName } from './icons';
import './TabBar.css';

// Le pagine aperte da una sezione restano sotto il suo tab (Prenotazioni e Profilo dalla Home, Traguardi da Premi).
const sectionOf = (path: string) =>
  path.startsWith('/scopri') ? '/scopri' : path.startsWith('/movi') ? '/movi' : path.startsWith('/premi') ? '/premi' : '/';

const tabs: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'Nav/Home' },
  { to: '/scopri', label: 'Scopri', icon: 'Nav/Explore' },
  { to: '/movi', label: 'Movi', icon: 'Nav/Movi' },
  { to: '/premi', label: 'Premi', icon: 'Nav/Rewards' },
];

/**
 * Figma: TabBar 1442:350 — 362×62, padding 6, tab 87×48, sempre intera (§5).
 * Q62 (27 nov), come iOS 26: il riquadro del tab attivo è un livello unico che scivola fino al nuovo tab con una
 * molla senza rimbalzo; mentre il dito è giù si gonfia (vetro sollevato). Trascinando il dito sulla barra il riquadro
 * segue il dito (con resistenza oltre i bordi) e, lasciandolo, apre il tab sotto il riquadro.
 */
export function TabBar({ hidden = false }: { hidden?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = tabs.findIndex((t) => t.to === sectionOf(pathname));
  const bar = useRef<HTMLElement>(null);
  // trascinamento: posizione del riquadro in "tab" (0…3, frazionaria), null quando non si trascina
  const [drag, setDrag] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const g = useRef<{ x0: number; start: number; w: number; live: boolean; id: number } | null>(null);
  const dragged = useRef(false);

  // toccare di nuovo il tab attivo riporta in cima (convenzione iOS)
  const retap = (to: string) => (e: React.MouseEvent) => {
    if (dragged.current) { e.preventDefault(); dragged.current = false; return; }
    if (pathname === to) {
      e.preventDefault();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('screen')?.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const tabW = () => (el.clientWidth - 12) / tabs.length;
    const down = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const w = tabW();
      g.current = { x0: e.clientX, start: Math.max(0, Math.min(tabs.length - 1, Math.floor((e.clientX - r.left - 6) / w))), w, live: false, id: e.pointerId };
      dragged.current = false;
      setPressed(true);
    };
    const move = (e: PointerEvent) => {
      const s = g.current;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x0;
      if (!s.live) {
        if (Math.abs(dx) < 10) return; // isteresi: un tocco resta un tocco
        s.live = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* ignora */ }
      }
      let p = s.start + dx / s.w;
      const max = tabs.length - 1;
      if (p < 0) p = -(1 - 1 / (1 + -p * 0.55)); // resistenza progressiva oltre il bordo
      if (p > max) p = max + (1 - 1 / (1 + (p - max) * 0.55));
      setDrag(p);
    };
    const up = (e: PointerEvent) => {
      const s = g.current;
      g.current = null;
      setPressed(false);
      if (!s || e.pointerId !== s.id) return;
      if (s.live) {
        dragged.current = true; // il click che segue non deve aprire il tab di partenza
        const i = Math.max(0, Math.min(tabs.length - 1, Math.round(s.start + (e.clientX - s.x0) / s.w)));
        setDrag(null);
        if (sectionOf(location.pathname) !== tabs[i].to) navigate(tabs[i].to);
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [navigate]);

  const pos = drag ?? active;
  const highlight = drag != null ? Math.round(Math.max(0, Math.min(tabs.length - 1, drag))) : active;
  return (
    <nav ref={bar} className={`tabbar${hidden ? ' tabbar--hidden' : ''}${drag != null ? ' is-dragging' : ''}`} aria-label="Sezioni" aria-hidden={hidden || undefined}>
      <span className={`tabbar-indicator${pressed ? ' is-pressed' : ''}`} aria-hidden="true"
        style={{ transform: `translateX(${pos * 100}%)` }} />
      {tabs.map((t, i) => (
        <NavLink key={t.to} to={t.to} draggable={false} className={() => `tabbar-tab${i === highlight ? ' active' : ''}`}
          aria-current={i === active ? 'page' : undefined} onClick={retap(t.to)}>
          <Icon name={t.icon} />
          <span className="tabbar-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
