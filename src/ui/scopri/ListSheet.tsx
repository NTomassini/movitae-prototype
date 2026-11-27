import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import { DetentSheet } from '../DetentSheet';
import { Icon } from '../Icon';

export type Detent = 'hidden' | 'small' | 'medium' | 'large';

/**
 * Sheet della lista di Scopri (Q74–Q76, 27 nov; prima Figma: piccolo 224 dal fondo, medio 314, grande 124).
 * Altezze, come gli sheet di tipo Mappe in iOS 26:
 * - piccola: flottante, staccata 8 dai lati e (8 + area sicura) dal fondo, angoli tutti arrotondati, solo l'intestazione;
 * - media: intestazione + 3 righe intere (finiscono nette, 16 + area sicura sopra il fondo);
 * - grande: sotto la ricerca (124); la lista scorre e il titolo resta fisso.
 * - nascosta: fuori dallo schermo, torna con "Mostra la lista".
 * Salendo dalla piccola alla media lo sheet si attacca ai bordi in modo continuo: margini, angoli in basso e ritaglio
 * seguono la posizione (anche col dito). Q57: con `fit` nessuna altezza supera il contenuto.
 * La lista diventa scorrevole solo quando lo sheet è fermo all'altezza grande.
 */
const HEADER = 74;  // dal bordo dello sheet alla prima riga (grabber 30 + titolo)
const CARD = 72;    // altezza della forma flottante (grabber + titolo + 18)
const ROW = 72, GAP = 16;

export function ListSheet({ title, children, detent, onDetent, muted, action, fit, onClose, onTabBar }: {
  title: string | null; children: ReactNode; detent: Detent; onDetent: (d: Detent) => void; muted?: boolean; action?: ReactNode;
  fit?: boolean; onClose?: () => void;
  /** tab bar legata allo sheet: 1 = visibile (lista nascosta), 0 = coperta (lista piccola o più alta) */
  onTabBar?: (visible: number) => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const padProbe = useRef<HTMLSpanElement>(null);
  const [need, setNeed] = useState(0);
  const [settled, setSettled] = useState<Detent>(detent);
  const y = useMotionValue(10000);
  const geo = useRef({ h: 874, safe: 20, pad: 36 });

  useLayoutEffect(() => {
    const c = content.current;
    if (!c) return;
    const measure = () => {
      const pad = padProbe.current?.offsetHeight || 36; // 16 + area sicura in basso
      geo.current.pad = pad;
      geo.current.safe = pad - 16;
      setNeed(HEADER + c.offsetHeight + pad);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const tops = (h: number) => {
    geo.current.h = h;
    const { pad, safe } = geo.current;
    const small = h - (8 + safe) - CARD;
    let medium = h - pad - (HEADER + 3 * ROW + 2 * GAP);
    let large = 124;
    if (fit && need) { const fitTop = h - need; medium = Math.max(medium, fitTop); large = Math.max(large, fitTop); }
    medium = Math.min(medium, small);
    large = Math.min(large, medium);
    return { hidden: h + 8, small, medium, large };
  };
  const topsRef = useRef(tops);
  topsRef.current = tops;

  // forma flottante → attaccata: f = 1 all'altezza piccola (e più giù), 0 dalla media in su
  const floatF = (v: number) => {
    const t = topsRef.current(geo.current.h);
    if (t.small - t.medium < 1) return v >= t.small - 0.5 ? 1 : 0;
    return Math.min(Math.max((v - t.medium) / (t.small - t.medium), 0), 1);
  };
  const side = useTransform(y, (v) => 8 * floatF(v));
  const bottom = useTransform(y, (v) => Math.max(v, 0) + (8 + geo.current.safe) * floatF(v)); // dal fondo dello sheet al fondo della forma
  const rb = useTransform(y, (v) => 32 * floatF(v));
  const clip = useMotionTemplate`inset(0px ${side}px ${bottom}px ${side}px round 32px 32px ${rb}px ${rb}px)`;
  const listBottom = useTransform(y, (v) => Math.max(v, 0) + geo.current.pad); // le righe finiscono nette sopra il fondo

  // tab bar legata allo sheet tra "nascosta" e "piccola" (Q76)
  const tabCb = useRef(onTabBar);
  tabCb.current = onTabBar;
  useEffect(() => y.on('change', (v) => {
    const t = topsRef.current(geo.current.h);
    tabCb.current?.(Math.min(Math.max((v - t.small) / (t.hidden - t.small), 0), 1));
  }), [y]);

  return (
    <DetentSheet className={`list-sheet list-sheet--${settled === 'large' && detent === 'large' ? 'large' : detent === 'large' ? 'medium' : detent}`} tops={tops} detent={detent} onDetent={onDetent}
      label={title ?? 'Lista'} y={y} onSettle={(d) => setSettled(d)} retarget={fit ? need : 0}>
      <motion.div className="list-sheet__bg" style={{ left: side, right: side, bottom, borderBottomLeftRadius: rb, borderBottomRightRadius: rb }} aria-hidden="true" />
      <motion.div className="list-sheet__clip" style={{ clipPath: clip, WebkitClipPath: clip, paddingLeft: side, paddingRight: side }}>
        <div className="list-sheet__grabber-zone">
          <button className="list-sheet__grabber" aria-label="Cambia altezza della lista"
            onClick={() => onDetent(detent === 'small' ? 'medium' : detent === 'medium' ? 'large' : 'small')} />
        </div>
        {title != null && (
          <div className="list-sheet__title-row">
            <h2 className={`list-sheet__title t-title-3${muted ? ' secondary' : ''}`}>{title}</h2>
            {action}
            {onClose && (
              <button className="circle-button list-sheet__close pressable" aria-label="Nascondi la lista" data-nodrag onClick={onClose}>
                <Icon name="UI/Close" size={22} />
              </button>
            )}
          </div>
        )}
        <motion.div className="list-sheet__list" data-scroll style={{ marginBottom: listBottom }}>
          <div ref={content} className="list-sheet__content">{children}</div>
        </motion.div>
      </motion.div>
      <span ref={padProbe} className="list-sheet__pad-probe" aria-hidden="true" />
    </DetentSheet>
  );
}
