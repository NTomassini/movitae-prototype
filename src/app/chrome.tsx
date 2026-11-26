import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Cosa mostra la cornice per la schermata attiva: tab bar, bordo sfocato in basso, scorrimento della pagina. */
export type Chrome = { tabBar: boolean; bottomEdge: boolean; pageScroll: boolean };
const defaults: Chrome = { tabBar: true, bottomEdge: true, pageScroll: true };
const Ctx = createContext<{ chrome: Chrome; set: (c: Partial<Chrome>) => void }>({ chrome: defaults, set: () => {} });

export function ChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState(defaults);
  return <Ctx.Provider value={{ chrome, set: (c) => setChrome((p) => ({ ...p, ...c })) }}>{children}</Ctx.Provider>;
}
export const useChrome = () => useContext(Ctx).chrome;

/** Una schermata dichiara la cornice che le serve; all'uscita torna quella di partenza. */
export function useScreenChrome(c: Partial<Chrome>) {
  const { set } = useContext(Ctx);
  const key = JSON.stringify(c);
  useEffect(() => {
    set(c);
    return () => set(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
