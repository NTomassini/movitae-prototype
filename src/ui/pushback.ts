/**
 * Q67 (27 nov): con uno sheet grande (riepilogo, modulo, certificato, Sport preferiti) la pagina sotto arretra,
 * come in iOS: si rimpicciolisce (fino a 0,94), arrotonda gli angoli e scende appena; il velo dello sheet la scurisce.
 * Il valore segue la posizione dello sheet (entrata, trascinamento, uscita), quindi va col dito.
 * Con più sheet aperti vale il più alto. Con "Riduci movimento" la pagina resta ferma (resta il velo).
 */
const progress = new Map<string, number>();

function apply() {
  const el = document.getElementById('screen');
  if (!el) return;
  const p = Math.max(0, ...progress.values());
  if (p <= 0.001 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.removeProperty('transform'); el.style.removeProperty('border-radius'); el.style.removeProperty('transform-origin');
    return;
  }
  el.style.transformOrigin = '50% 50%';
  el.style.transform = `translateY(${(8 * p).toFixed(2)}px) scale(${(1 - 0.06 * p).toFixed(4)})`;
  el.style.borderRadius = `${(24 * p).toFixed(1)}px`;
}

export function setPushBack(id: string, p: number) {
  if (p <= 0) progress.delete(id); else progress.set(id, Math.min(1, p));
  apply();
}
