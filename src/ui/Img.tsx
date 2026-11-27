import { useEffect, useRef, useState } from 'react';

/**
 * Immagine di DS · Asset per nome Figma ("img/padel", "foto/yoga").
 * File in public/img/<nome con il trattino>.webp (es. img-padel.webp).
 * Finché il file manca mostra un segnaposto neutro con il nome, alle stesse misure.
 */
export function Img({ name, alt = '', className, style }: { name: string; alt?: string; className?: string; style?: React.CSSProperties }) {
  const [missing, setMissing] = useState(false);
  // Q68: la foto compare con una dissolvenza quando è pronta (se è già in cache, subito)
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { if (ref.current?.complete) setReady(true); }, []);
  const src = `/img/${name.replace('/', '-')}.webp`;
  if (missing) {
    return (
      <span className={className} role={alt ? 'img' : undefined} aria-label={alt || undefined}
        style={{ ...style, display: 'grid', placeItems: 'center', background: 'var(--fill-tertiary)', color: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, overflow: 'hidden', textAlign: 'center' }}>
        {name.split('/')[1]}
      </span>
    );
  }
  return <img ref={ref} className={className} data-ready={ready || undefined} style={{ objectFit: name.startsWith('img/') ? 'contain' : 'cover', display: 'block', opacity: ready ? 1 : 0, transition: 'opacity 0.25s ease-out', ...style }} src={src} alt={alt} onLoad={() => setReady(true)} onError={() => setMissing(true)} />;
}
