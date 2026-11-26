import { useEffect, useState } from 'react';

/** Posizione di scorrimento del contenitore unico #screen (AppShell). */
export function useScreenScroll() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const el = document.getElementById('screen');
    if (!el) return;
    const on = () => setY(el.scrollTop);
    on();
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  return y;
}
