import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useScreenChrome } from '../app/chrome';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { useScreenScroll } from '../app/useScreenScroll';
import { user } from '../data/data';
import { SUGGESTIONS, answer, bookedLine, type Card } from '../movi/engine';
import { balance, bookings, store, upcoming, useAppState } from '../state/bookings';
import { chat, useChat, type Msg } from '../state/movi';
import { CheckoutSheet } from '../ui/booking/CheckoutSheet';
import { VenueSheet } from '../ui/booking/VenueSheet';
import { Img } from '../ui/Img';
import { ScrollEdge } from '../ui/ScrollEdge';
import { ActivityCard, ChatInput, MoviMsg, Pill, SkeletonCard, Suggestion, UserMsg } from '../ui/movi/MoviParts';
import { MoviMap } from '../ui/movi/MoviMap';
import '../ui/page-header.css';

/** Dove si prenota da Movi: la card (msg + lezione), e se si passa dalla scheda o direttamente dall'orario. */
type Target = { msgId: string; card: Card };
type Checkout = Target & { time: string; dayId: string; fromSheet: boolean };

const THINK_MS = { search: 1300, text: 650 };

export function MoviScreen() {
  const navigate = useNavigate();
  const app = useAppState();
  const { messages, pending } = useChat();
  const [sheet, setSheet] = useState<Target | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [picked, setPicked] = useState<{ msgId: string; activityId: string; time: string } | null>(null);
  const [map, setMap] = useState<{ msgId: string; cards: Card[] } | null>(null);
  const empty = messages.length === 0 && !pending;
  useScreenChrome({ tabBar: true, bottomEdge: true });
  const y = useScreenScroll();
  const lastTurn = useRef<HTMLDivElement>(null);
  const [turnMin, setTurnMin] = useState(0);

  // spazio per portare l'ultima domanda in alto (sotto la riga del titolo), come in una chat
  useLayoutEffect(() => {
    const s = document.getElementById('screen');
    if (s) setTurnMin(Math.max(0, s.clientHeight - 116 - 145));
  }, []);
  const scrollToTurn = () => requestAnimationFrame(() => {
    const s = document.getElementById('screen'); const el = lastTurn.current;
    if (!s || !el) return;
    const top = el.getBoundingClientRect().top - s.getBoundingClientRect().top + s.scrollTop - 116;
    s.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
  // ritorno da "Prenotato": la chat si riapre in fondo, sulla riga "Prenotato: …" (flusso-movi/4)
  useEffect(() => {
    if (!messages.length) return;
    const s = document.getElementById('screen');
    const t = setTimeout(() => s?.scrollTo({ top: s.scrollHeight }), 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = () => ({
    lastQuery: chat.get().lastQuery,
    points: balance(app.bookings, user.points, user.saved).points,
    upcoming: upcoming(app.bookings),
    favorites: app.favorites,
  });

  const reply = (text: string) => {
    const r = answer(text, ctx());
    chat.setPending({ thinking: r.thinking, search: r.search });
    scrollToTurn();
    setTimeout(() => {
      chat.setPending(null);
      if (store.get().demo.network === 'offline') {
        chat.add({ role: 'movi', text: 'Non riesco a cercare senza connessione. Controlla il Wi-Fi o i dati e riprova.', offline: { retry: text } });
        return;
      }
      if (r.query) chat.setLastQuery(r.query);
      chat.add({ role: 'movi', text: r.text, cards: r.cards, actions: r.actions, suggestions: r.suggestions });
    }, r.search ? THINK_MS.search : THINK_MS.text);
  };
  const send = (text: string) => {
    if (chat.get().pending) return;
    setMap(null);
    chat.add({ role: 'user', text });
    reply(text);
  };
  const retry = (m: Msg & { role: 'movi' }) => { if (chat.get().pending) return; chat.remove(m.id); reply(m.offline!.retry); };

  const bookedTime = (m: Msg, activityId: string) => {
    if (m.role !== 'movi') return null;
    const id = m.booked?.[activityId];
    const b = id ? app.bookings.find((x) => x.id === id) : undefined;
    return b && b.status !== 'cancelled' ? b.time : null;
  };
  const paid = (c: Checkout, r: { voucher: boolean; paid: number; points: number }) => {
    const b = bookings.add({ activityId: c.card.activityId, dayId: c.dayId, time: c.time, ...r });
    const m = chat.get().messages.find((x) => x.id === c.msgId);
    if (m && m.role === 'movi') chat.update(m.id, { booked: { ...(m.booked ?? {}), [c.card.activityId]: b.id } });
    chat.add({ role: 'movi', text: bookedLine(c.card.activityId, c.dayId, c.time), actions: [{ label: 'Vedi prenotazione', to: `/prenotazioni/${b.id}` }] });
    setPicked(null);
    navigate(`/prenotato/${b.id}?from=movi`);
  };
  const sel = (msgId: string, activityId: string) => (picked && picked.msgId === msgId && picked.activityId === activityId ? picked.time : null);
  // toccare un orario: la capsula diventa rossa, poi sale il riepilogo (flusso-movi/1 → 2)
  const pickTime = (msgId: string, card: Card, time: string) => {
    setPicked({ msgId, activityId: card.activityId, time });
    setTimeout(() => setCheckout({ msgId, card, time, dayId: card.dayId, fromSheet: false }), 280);
  };

  // turni: ogni domanda con le sue risposte
  const turns: Msg[][] = [];
  for (const m of messages) { if (m.role === 'user' || !turns.length) turns.push([m]); else turns[turns.length - 1].push(m); }

  const renderMsg = (m: Msg) => {
    if (m.role === 'user') return <UserMsg key={m.id} text={m.text} />;
    return (
      <Fragment key={m.id}>
        <motion.div className="movi-turn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', visualDuration: 0.35, bounce: 0 }}>
          <MoviMsg text={m.text} />
          {m.cards?.map((c) => (
            <ActivityCard key={c.activityId} card={c} bookedTime={bookedTime(m, c.activityId)} selected={sel(m.id, c.activityId)}
              onOpen={() => setSheet({ msgId: m.id, card: c })}
              onTime={(t) => pickTime(m.id, c, t)} />
          ))}
          {!!m.cards?.length && <Pill onPress={() => setMap({ msgId: m.id, cards: m.cards! })}>Vedi sulla mappa</Pill>}
          {m.suggestions && <div className="movi-suggs">{m.suggestions.map((s) => <Suggestion key={s} text={s} onPress={() => send(s)} />)}</div>}
          {m.actions?.map((a) => <Pill key={a.to} onPress={() => navigate(a.to)}>{a.label}</Pill>)}
          {m.offline && <Pill big onPress={() => retry(m)}>Riprova</Pill>}
        </motion.div>
      </Fragment>
    );
  };

  const mapMsg = map && messages.find((m) => m.id === map.msgId);

  return (
    <div className="movi">
      <ScreenOverlay>
        <div className={`page-header${y > 4 ? ' is-scrolled' : ''}`}>
          <ScrollEdge position="top" height={106} />
          <span className={`t-headline page-header__title${!empty || y > 44 ? ' is-on' : ''}`} aria-hidden={empty}>Movi</span>
        </div>
        {!map && <ChatInput onSend={send} disabled={!!pending} />}
      </ScreenOverlay>

      {empty ? (
        <div className="movi-open">
          <header className="movi__header"><h1 className="t-large-title">Movi</h1></header>
          <div className="movi-hero">
            <Img name="img/movi-saluto" style={{ width: 170, height: 170 }} />
            <h2 className="t-title-2">Ciao {user.name}, cosa ti va di fare oggi?</h2>
            <p className="t-subheadline secondary">Dimmi che sport ti va, quando sei libero o quanto vuoi pagare. Ti trovo le lezioni da prenotare.</p>
          </div>
          <div className="movi-suggs">{SUGGESTIONS.map((s) => <Suggestion key={s} text={s} onPress={() => send(s)} />)}</div>
          <p className="movi-ai-note t-footnote">Movi può sbagliare: controlla orari e prezzi prima di pagare.</p>
        </div>
      ) : (
        <div className="movi-chat" aria-live="polite">
          {turns.map((t, i) => {
            const last = i === turns.length - 1;
            return (
              <div key={t[0].id} className="movi-turn" ref={last ? lastTurn : undefined} style={last ? { minHeight: turnMin } : undefined}>
                {t.map(renderMsg)}
                {last && pending && (
                  <>
                    <MoviMsg text={pending.thinking} muted />
                    {pending.search && <><SkeletonCard /><SkeletonCard /></>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ScreenOverlay>
        <AnimatePresence>
          {map && mapMsg && (
            <MoviMap key="map" cards={map.cards} booked={(id) => bookedTime(mapMsg, id)} selected={(id) => sel(map.msgId, id)}
              onClose={() => setMap(null)} onSend={send}
              onOpen={(c) => setSheet({ msgId: map.msgId, card: c })}
              onTime={(c, t) => pickTime(map.msgId, c, t)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {sheet && (
            <motion.div key="venue" className="movi-layer" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
              <motion.div className="scrim--venue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(null)} />
              <VenueSheet from="movi" activityId={sheet.card.activityId} onClose={() => { setSheet(null); setCheckout(null); }}
                onBook={(dayId, time) => setCheckout({ ...sheet, time, dayId, fromSheet: true })} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {checkout && (
            <motion.div key="checkout" className="movi-layer movi-layer--checkout" exit={{ opacity: 1 }}>
              <CheckoutSheet activityId={checkout.card.activityId} dayId={checkout.dayId} time={checkout.time} back={checkout.fromSheet}
                onCancel={() => { setCheckout(null); setPicked(null); }} onPaid={(r) => paid(checkout, r)} />
            </motion.div>
          )}
        </AnimatePresence>
      </ScreenOverlay>
    </div>
  );
}
