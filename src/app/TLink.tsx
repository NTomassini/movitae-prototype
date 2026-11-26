import type { AnchorHTMLAttributes } from 'react';
import { useNav } from './nav';

/** Link con il passaggio tra le pagine giusto (Q48). */
export function TLink({ to, children, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const nav = useNav();
  return <a href={to} {...rest} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); nav(to); }}>{children}</a>;
}
