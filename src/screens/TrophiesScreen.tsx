import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { achievements, fmtPoints, type Achievement } from '../data/data';
import { Img } from '../ui/Img';
import { ModalSheet } from '../ui/ModalSheet';
import { PageHeader } from '../ui/PageHeader';
import './TrophiesScreen.css';

// Tutti i traguardi — premi/2-traguardi-tutti (1461:5459): Header C (freccia + titolo piccolo), gruppi a 32, griglia 3 colonne (gap 14).
// Tocco → dettaglio (premi/3, 1461:5608): sheet piccolo senza pulsanti.
const groups: Achievement['group'][] = ['Serie', 'Punti', 'Lezioni', 'Risparmio'];
const fmt = (a: Achievement, n: number) => (a.unit === '€' ? `€${n}` : `${fmtPoints(n)} ${a.unit}`);

function Stars({ n, size, dim }: { n: number; size: number; dim?: boolean }) {
  return <span className="stars" style={{ gap: size === 20 ? 4 : 2 }}>{Array.from({ length: n }, (_, i) => <Img key={i} name="img/stella" style={{ width: size, height: size, opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(1)' : undefined }} />)}</span>;
}

export function TrophiesScreen() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState<string | null>(params.get('t'));
  const a = achievements.find((x) => x.id === open);

  return (
    <div className="trophies-page">
      <PageHeader title="Traguardi" type="C" />
      {groups.map((g) => (
        <section key={g} className="trophy-group">
          <h2 className="t-title-3">{g}</h2>
          <div className="trophy-grid">
            {achievements.filter((x) => x.group === g).map((x) => (
              <button key={x.id} className={`trophy-card pressable${x.unlocked ? '' : ' is-locked'}`} onClick={() => setOpen(x.id)}
                aria-label={`${x.title}${x.unlocked ? `, ottenuto il ${x.unlocked}` : `, ${fmt(x, Math.min(x.progress, x.target))} di ${fmt(x, x.target)}`}`}>
                <Img name={x.image} style={{ width: 56, height: 56, opacity: x.unlocked ? 1 : 0.5, filter: x.unlocked ? undefined : 'grayscale(1)' }} />
                <Stars n={x.stars} size={12} dim={!x.unlocked} />
                <span className="t-footnote-emphasized" style={{ color: x.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{x.label}</span>
                {x.unlocked ? <span className="t-footnote" style={{ color: 'var(--text-tertiary)' }}>{x.unlocked}</span>
                  : <>
                      <span className="mini-bar"><span style={{ width: `${Math.max(Math.min(x.progress / x.target, 1) * 100, 10)}%` }} /></span>
                      <span className="t-footnote" style={{ color: 'var(--text-tertiary)' }}>Ancora {fmt(x, x.target - Math.min(x.progress, x.target))}</span>
                    </>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <AnimatePresence>
        {a && (
          <ModalSheet visible={351} label={a.title} onClose={() => setOpen(null)}>
            {() => (
              <div className="trophy-sheet">
                <Img name={a.image} style={{ width: 120, height: 120, opacity: a.unlocked ? 1 : 0.5, filter: a.unlocked ? undefined : 'grayscale(1)' }} />
                <Stars n={a.stars} size={20} dim={!a.unlocked} />
                <h2 className="t-title-2" style={{ marginTop: 4 }}>{a.title}</h2>
                <p className="t-subheadline secondary">{a.description}</p>
                {a.unlocked ? (
                  <p className="t-subheadline-emphasized" style={{ color: 'var(--earn-default)', marginTop: 12 }}>Ottenuto il {a.unlocked}</p>
                ) : (
                  <div style={{ alignSelf: 'stretch', marginTop: 12 }}>
                    <span className="path-sheet__bar" style={{ display: 'block' }}><span style={{ width: `${Math.max(Math.min(a.progress / a.target, 1) * 100, 6)}%` }} /></span>
                    <div className="path-sheet__ends t-footnote-emphasized"><span className="secondary">{fmt(a, a.progress)}</span><span style={{ color: 'var(--text-tertiary)' }}>{fmt(a, a.target)}</span></div>
                  </div>
                )}
              </div>
            )}
          </ModalSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
