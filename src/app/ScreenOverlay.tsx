import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';

/** Livelli fissi della schermata (intestazioni, barre): fuori dal contenitore che scorre, dentro la cornice. */
export function ScreenOverlay({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.getElementById('overlay')), []);
  return host ? createPortal(children, host) : null;
}
