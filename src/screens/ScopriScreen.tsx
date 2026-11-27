import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { previousPath } from '../app/AppShell';
import { useNav } from '../app/nav';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../ui/Icon';
import { VenueSheet } from '../ui/booking/VenueSheet';
import { CheckoutSheet } from '../ui/booking/CheckoutSheet';
import { bookings, useAppState, useDemo } from '../state/bookings';
import { Img } from '../ui/Img';
import { activities, euro, user, venueOf, venues, type Activity } from '../data/data';
import { useScreenChrome } from '../app/chrome';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { MapView, type MapPinData } from '../ui/scopri/MapView';
import { ListSheet, type Detent } from '../ui/scopri/ListSheet';
import { ActivityRow, FilterSummary, GlassIconButton, SearchField, sportIcon } from '../ui/scopri/ScopriParts';
import { FilterPanel } from '../ui/scopri/FilterPanel';
import { SearchView, type Pick } from '../ui/scopri/SearchView';
import { ListGroup, ListRow } from '../ui/settings/List';
import { NO_FILTERS, apply, countFilters, listTitle, summary, type Filters } from '../ui/scopri/filters';
import type { Sport } from '../data/data';

// I filtri restano mentre apri e chiudi la scheda di una struttura (la schermata si rimonta).
let kept: Filters = NO_FILTERS;
let keptDetent: Detent = 'hidden';

// Scopri — DS · Schermate › "scopri — chiaro" (1461:1083) e sheet piccolo / medio / grande.
// Posizione negata: mappa su Roma centro, senza punto blu (scopri/posizione-negata).
const ROMA_CENTRO = { lat: 41.8955, lng: 12.4823 };
const priceLabel = (a: Activity) => (a.pricePerPerson ? `${euro(a.price)} · ${euro(a.pricePerPerson)} a persona` : euro(a.price));

const activityIdAtMount = () => /^\/scopri\/[^/]+/.test(location.pathname);

export function ScopriScreen() {
  const [params] = useSearchParams();
  const sport = params.get('sport');
  // ?sport= arriva dallo scaffale della Home: diventa il filtro Sport
  const [filters, setFiltersState] = useState<Filters>(() => (sport ? (kept = { ...NO_FILTERS, sports: [sport as Sport] }) : kept));
  const setFilters = (f: Filters) => { kept = f; setFiltersState(f); setSelected(f.venue); };
  const [panel, setPanel] = useState(false);
  const [search, setSearch] = useState(false);
  const nFilters = countFilters(filters);
  // Q55: dal tab (o da un link senza motivo) Scopri parte con la lista nascosta e "Mostra la lista · N".
  // Con un motivo (sport dalla Home, buono attivo, "Vedi tutte", "Trova un'attività") apre a media altezza.
  // Tornando dalla scheda o dalla conferma la lista resta com'era.
  const { state: navState } = useLocation();
  const voucherAtStart = useAppState().voucherActive;
  const [detent, setDetentState] = useState<Detent>(() => {
    const from = previousPath();
    if (activityIdAtMount() || from.startsWith('/scopri/') || from.startsWith('/prenotato')) return keptDetent;
    return (keptDetent = sport || voucherAtStart || (navState as { list?: boolean } | null)?.list ? 'medium' : 'hidden');
  });
  const setDetent = useCallback((d: Detent | ((p: Detent) => Detent)) => setDetentState((p) => (keptDetent = typeof d === 'function' ? d(p) : d)), []);
  const [selected, setSelected] = useState<string | null>(() => kept.venue);
  const demo = useDemo();
  const voucherActive = useAppState().voucherActive;
  const denied = demo.location === 'denied';
  // Offline (scopri/offline): niente pin, lista a media altezza con "Sei offline" e "Riprova".
  // "Riprova" o il ritorno della rete mostrano il caricamento (scopri/caricamento) prima della lista.
  const offline = demo.network === 'offline';
  const [loading, setLoading] = useState(false);
  const wasOffline = useRef(offline);
  const retry = () => { setLoading(true); setTimeout(() => setLoading(false), 1100); };
  useEffect(() => { if (wasOffline.current && !offline) retry(); wasOffline.current = offline; }, [offline]);
  const showOffline = offline && !loading;
  useEffect(() => { if (showOffline) setDetent('medium'); else if (loading) setDetent('small'); }, [showOffline, loading]);
  const navigate = useNav();
  const { activityId } = useParams();
  const [checkout, setCheckout] = useState<{ dayId: string; time: string } | null>(null);
  // Tab bar visibile solo con lo sheet piccolo e senza scheda aperta; la pagina non scorre (mappa a tutto schermo).

  // ordine della lista come nella tavola Figma: Boxe, Yoga Flow, Padel Ostiense, poi il resto
  const first = ['boxe', 'yoga-flow', 'padel-ostiense'];
  const filtered = useMemo(() => apply({ ...filters, venue: null }).sort((x, y) => (first.indexOf(x.id) + 1 || 99) - (first.indexOf(y.id) + 1 || 99)), [filters]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => (selected ? filtered.filter((a) => a.venueId === selected) : filtered), [filtered, selected]);
  const noResults = !filtered.length && !showOffline && !loading;
  useEffect(() => { if (noResults) setDetent('medium'); }, [noResults]);
  // Tab bar visibile solo con lo sheet piccolo, senza scheda, ricerca o "nessun risultato"; la pagina non scorre.
  // Q55: la tab bar c'è solo con la lista nascosta; appena lo sheet è visibile (anche piccolo) sparisce.
  useScreenChrome({ tabBar: detent === 'hidden' && !activityId && !showOffline && !search && !noResults, bottomEdge: false, pageScroll: false });

  const pins: MapPinData[] = useMemo(() => venues
    .map((v) => {
      const acts = filtered.filter((a) => a.venueId === v.id);
      if (!acts.length) return null;
      const cheapest = Math.min(...acts.map((a) => a.pricePerPerson ?? a.price));
      return { id: v.id, lat: v.lat, lng: v.lng, icon: sportIcon[acts[0].sport], count: acts.length, label: `${v.name} · ${euro(cheapest)}` };
    })
    .filter(Boolean) as MapPinData[], [filtered]);

  // toccare un pin mostra la lista di quella struttura (se la lista era nascosta, risale)
  const onSelect = useCallback((id: string | null) => { setSelected(id); if (id) setDetent((d) => (d === 'hidden' ? 'small' : d)); }, []);
  const title = selected ? venues.find((v) => v.id === selected)!.name : listTitle(list.length, filters, denied);
  const qs = sport ? `?sport=${sport}` : '';
  // ricerca: uno sport filtra, una struttura seleziona il suo pin, un'attività apre la scheda
  const onPick = (p: Pick) => {
    setSearch(false);
    if (p.kind === 'sport') setFilters({ ...NO_FILTERS, sports: [p.sport], maxDist: p.near ? 1 : null });
    else if (p.kind === 'venue') { setFilters({ ...NO_FILTERS, venue: p.id }); setDetent('small'); }
    else navigate(`/scopri/${p.id}`);
  };
  // errori/5: tre modi per uscirne, con quante attività trovi
  const ways = [
    filters.maxDist != null && { label: 'Allarga a 5 km', n: apply({ ...filters, maxDist: Math.max(5, filters.maxDist) }).length, go: () => setFilters({ ...filters, maxDist: Math.max(5, filters.maxDist!) }) },
    filters.maxPrice != null && { label: 'Togli il prezzo', n: apply({ ...filters, maxPrice: null }).length, go: () => setFilters({ ...filters, maxPrice: null }) },
    (filters.day || filters.moment) && { label: 'Togli l’orario', n: apply({ ...filters, day: null, moment: null }).length, go: () => setFilters({ ...filters, day: null, moment: null }) },
    filters.indoor != null && { label: 'Al chiuso e all’aperto', n: apply({ ...filters, indoor: null }).length, go: () => setFilters({ ...filters, indoor: null }) },
  ].filter(Boolean).filter((w) => (w as { n: number }).n > 0).slice(0, 2) as { label: string; n: number; go: () => void }[];

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapView key={denied ? 'roma' : 'qui'} center={denied ? ROMA_CENTRO : user.location} showUser={!denied} pins={offline || loading ? [] : pins} selected={activityId ? activities.find((a) => a.id === activityId)?.venueId ?? null : selected} onSelect={(id) => { if (panel) { setPanel(false); return; } onSelect(id); }} />
      <div className="scopri-top">
        <SearchField onPress={() => { setPanel(false); setSearch(true); }} />
        <GlassIconButton icon="UI/Filters" label="Filtri" badge={nFilters} onPress={() => setPanel(!panel)} />
      </div>
      <AnimatePresence>{panel && <FilterPanel key="p" value={filters} onChange={setFilters} onClose={() => setPanel(false)} />}</AnimatePresence>
      {voucherActive && !nFilters && !panel && (
        <div className="voucher-pill">
          <Img name="img/buono-bronzo" style={{ width: 28, height: 28 }} />
          <span className="t-subheadline-emphasized">Buono da €5 attivo</span>
        </div>
      )}
      {denied && !nFilters && !voucherActive && !panel && (
        <div className="glass-banner glass-control">
          <Icon name="UI/Location" size={24} />
          <div>
            <p className="t-subheadline">Attiva la posizione per vedere cosa c'è vicino a te.</p>
            <a className="t-subheadline-emphasized" style={{ color: 'var(--brand-accent)' }} href="app-settings:">Impostazioni</a>
          </div>
        </div>
      )}
      <AnimatePresence>
        {nFilters > 0 && !panel && (
          <motion.div key="sum" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <FilterSummary label={summary(filters, filters.venue ? venues.find((v) => v.id === filters.venue)?.name : undefined)} onPress={() => setPanel(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detent === 'hidden' && !activityId && (
          <motion.button className="show-list glass-control" onClick={() => setDetent('small')}
            initial={{ opacity: 0, y: 12, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.15 }}>
            <Icon name="UI/Chevron-Down" size={18} style={{ transform: 'rotate(180deg)' }} />
            <span className="t-subheadline-emphasized">Mostra la lista · {list.length}</span>
          </motion.button>
        )}
      </AnimatePresence>
      <ListSheet title={showOffline ? null : loading ? 'Cerco attività vicino a te…' : noResults ? 'Nessuna attività' : title} muted={loading} detent={detent}
        action={nFilters > 0 && !panel && !showOffline && !loading ? <button className="list-sheet__clear t-subheadline-emphasized" onClick={() => { setFilters(NO_FILTERS); setDetent('small'); }}>Cancella tutto</button> : undefined}
        fit={!showOffline && !loading && !noResults}
        onClose={showOffline || loading || noResults ? undefined : () => setDetent('hidden')}
        onDetent={showOffline || loading ? () => {} : setDetent}>
        {noResults ? (
          <div className="no-results">
            <p className="t-subheadline secondary">Con questi filtri non c’è niente qui vicino. Prova così:</p>
            <ListGroup>
              {ways.map((w) => <ListRow key={w.label} title={w.label} value={`${w.n} attività`} onPress={() => { w.go(); setDetent('small'); }} />)}
              <ListRow title="Chiedi a Movi" onPress={() => navigate(`/movi?q=${encodeURIComponent(summary(filters))}`)} />
            </ListGroup>
          </div>
        ) : showOffline ? (
          <div className="offline-state" role="status">
            <Icon name="UI/Wifi-Off" size={40} />
            <h2 className="t-title-3">Sei offline</h2>
            <p className="t-subheadline secondary">Controlla la connessione: mappa e attività tornano appena sei di nuovo online.</p>
          </div>
        ) : loading ? [0, 1, 2].map((i) => (
          <div key={i} className="skeleton-row" aria-hidden="true"><i /><span><i /><i /><i /></span></div>
        )) : list.map((a) => {
          const v = venueOf(a);
          return <ActivityRow key={a.id} title={a.title} place={`${v.name} · ${v.distance}`} price={priceLabel(a)} points={a.points} photo={a.photo} onPress={() => navigate(`/scopri/${a.id}${qs}`)} />;
        })}
      </ListSheet>
      <AnimatePresence>
        {showOffline && !activityId && (
          <motion.div className="offline-cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <button className="button button--primary t-headline" onClick={retry}>Riprova</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {search && <SearchView key="s" onClose={() => setSearch(false)} onPick={onPick} onAskMovi={(q) => navigate(`/movi?q=${encodeURIComponent(q)}`)} />}
      </AnimatePresence>
      {activityId && (
        <VenueSheet key={activityId} activityId={activityId} onClose={() => { setCheckout(null); navigate(`/scopri${qs}`); }}
          onBook={(dayId, time) => setCheckout({ dayId, time })} />
      )}
      {/* il riepilogo sta nel livello comune degli sheet, così modulo e certificato si aprono sopra */}
      <ScreenOverlay><div className="checkout-layer">
      <AnimatePresence>
        {activityId && checkout && (
          <CheckoutSheet activityId={activityId} dayId={checkout.dayId} time={checkout.time} onCancel={() => setCheckout(null)}
            onPaid={(r) => { const b = bookings.add({ activityId, dayId: checkout.dayId, ...r }); navigate(`/prenotato/${b.id}`); }} />
        )}
      </AnimatePresence>
      </div></ScreenOverlay>
    </div>
  );
}
