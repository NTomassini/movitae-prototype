import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';
import { flushSync } from 'react-dom';

/**
 * Passaggio tra le pagine come su iPhone (Q48), con le View Transitions del browser (Safari 18+, Chrome):
 * - push: la pagina nuova entra da destra, la precedente scorre a sinistra del 30% e si scurisce;
 * - pop (indietro): il contrario;
 * - fade: per le schermate che non stanno in una pila (Prenotato, uscita dall'account);
 * - nessuna animazione tra le tab (come iOS) e verso gli sheet (la scheda di Scopri ha la sua).
 * Il gesto dal bordo sinistro (Q49) usa la stessa transizione, messa in pausa e fatta avanzare col dito.
 */
export type NavKind = 'push' | 'pop' | 'fade' | 'none';
const TABS = ['/', '/scopri', '/movi', '/premi'];

export function kindFor(to: To | number, from = location.pathname): NavKind {
  if (typeof to === 'number') return from.startsWith('/onboarding') ? 'none' : to < 0 ? 'pop' : 'push';
  const path = typeof to === 'string' ? to.split('?')[0] : to.pathname ?? '';
  if (path.startsWith('/onboarding') || from.startsWith('/onboarding')) return path.startsWith('/onboarding') && from.startsWith('/onboarding') ? 'none' : 'fade';
  if (path.startsWith('/prenotato') || from.startsWith('/prenotato')) return 'fade';
  if (path.startsWith('/scopri/') || (from.startsWith('/scopri') && path.startsWith('/scopri'))) return 'none';
  if (TABS.includes(path)) return 'none';
  return 'push';
}

// la transizione aspetta che la pagina nuova sia sullo schermo: AppShell chiama settle() a ogni cambio di indirizzo
let pending: (() => void) | null = null;
export const settle = () => { const p = pending; pending = null; p?.(); };

const supported = () => typeof document !== 'undefined' && 'startViewTransition' in document && !matchMedia('(prefers-reduced-motion: reduce)').matches;

export function transition(kind: NavKind, update: () => void) {
  if (kind === 'none' || !supported()) { update(); return null; }
  document.documentElement.dataset.nav = kind;
  const vt = (document as Document & { startViewTransition: (cb: () => Promise<void>) => ViewTransition }).startViewTransition(
    () => new Promise<void>((res) => { pending = res; update(); setTimeout(() => { if (pending === res) settle(); }, 400); }),
  );
  vt.finished.finally(() => { if (document.documentElement.dataset.nav === kind) delete document.documentElement.dataset.nav; });
  return vt;
}

/** Come useNavigate, con il passaggio giusto per la destinazione. */
export function useNav() {
  const navigate = useNavigate();
  return (to: To | number, opts?: NavigateOptions & { kind?: NavKind }) => {
    const kind = opts?.kind ?? kindFor(to);
    transition(kind, () => (typeof to === 'number' ? navigate(to) : navigate(to, opts)));
  };
}

// ---------- indietro col dito dal bordo sinistro (Q49) ----------
type ViewTransition = { ready: Promise<void>; finished: Promise<void>; skipTransition: () => void };
export function startEdgeBack(navigate: ReturnType<typeof useNavigate>, back: { path: string }) {
  if (!supported()) return null;
  let anims: Animation[] = [];
  let progress = 0;
  let hold: Animation | null = null;
  const dur = 450;
  const vt = transition('pop', () => navigate(-1))!;
  const ready = vt.ready.then(() => {
    anims = document.getAnimations().filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition'));
    // tiene viva la transizione finché non decidiamo noi (serve per annullare senza lampi)
    hold = document.documentElement.animate({ opacity: [1, 1] }, { duration: 60000, pseudoElement: '::view-transition' });
    anims.forEach((a) => { a.pause(); a.currentTime = progress * dur; });
  }).catch(() => {});
  return {
    move(p: number) { progress = Math.max(0, Math.min(1, p)); anims.forEach((a) => { a.currentTime = progress * dur; }); },
    async end(commit: boolean) {
      await ready;
      if (!anims.length) { hold?.cancel(); if (!commit) navigate(back.path, { state: { restore: true } }); return; }
      if (commit) {
        anims.forEach((a) => a.play());
        await Promise.all(anims.map((a) => a.finished.catch(() => {})));
        hold?.cancel();
      } else {
        anims.forEach((a) => { a.playbackRate = -1; a.play(); });
        await Promise.all(anims.map((a) => a.finished.catch(() => {})));
        // si torna alla pagina di prima mentre l'istantanea la copre ancora: nessun lampo
        try { flushSync(() => navigate(back.path, { state: { restore: true } })); } catch { navigate(back.path, { state: { restore: true } }); }
        hold?.cancel();
      }
    },
  };
}
