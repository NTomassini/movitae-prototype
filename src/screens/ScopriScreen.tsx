import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../ui/Icon';
import { VenueSheet } from '../ui/booking/VenueSheet';
import { CheckoutSheet } from '../ui/booking/CheckoutSheet';
import { bookings } from '../state/bookings';
import { activities, euro, user, venueOf, venues, type Activity } from '../data/data';
import { useScreenChrome } from '../app/chrome';
import { MapView, type MapPinData } from '../ui/scopri/MapView';
import { ListSheet, type Detent } from '../ui/scopri/ListSheet';
import { ActivityRow, FilterSummary, GlassIconButton, SearchField, sportIcon } from '../ui/scopri/ScopriParts';
import { shelfSports } from '../data/data';

// Scopri — DS · Schermate › "scopri — chiaro" (1461:1083) e sheet piccolo / medio / grande.
const priceLabel = (a: Activity) => (a.pricePerPerson ? `${euro(a.price)} · ${euro(a.pricePerPerson)} a persona` : euro(a.price));

export function ScopriScreen() {
  const [params] = useSearchParams();
  const sport = params.get('sport');
  const [detent, setDetent] = useState<Detent>('small');
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  const { activityId } = useParams();
  const [checkout, setCheckout] = useState<{ dayId: string; time: string } | null>(null);
  // Tab bar visibile solo con lo sheet piccolo e senza scheda aperta; la pagina non scorre (mappa a tutto schermo).
  useScreenChrome({ tabBar: (detent === 'small' || detent === 'hidden') && !activityId, bottomEdge: false, pageScroll: false });

  const list = useMemo(() => {
    // ordine della lista come nella tavola Figma: Boxe, Yoga Flow, Padel Ostiense, poi il resto
    const first = ['boxe', 'yoga-flow', 'padel-ostiense'];
    const ordered = [...activities].sort((x, y) => (first.indexOf(x.id) + 1 || 99) - (first.indexOf(y.id) + 1 || 99));
    const base = sport ? ordered.filter((a) => a.sport === sport) : ordered;
    return selected ? base.filter((a) => a.venueId === selected) : base;
  }, [sport, selected]);

  const pins: MapPinData[] = useMemo(() => venues
    .map((v) => {
      const acts = activities.filter((a) => a.venueId === v.id && (!sport || a.sport === sport));
      if (!acts.length) return null;
      const cheapest = Math.min(...acts.map((a) => a.pricePerPerson ?? a.price));
      return { id: v.id, lat: v.lat, lng: v.lng, icon: sportIcon[acts[0].sport], count: acts.length, label: `${v.name} · ${euro(cheapest)}` };
    })
    .filter(Boolean) as MapPinData[], [sport]);

  // toccare un pin mostra la lista di quella struttura (se la lista era nascosta, risale)
  const onSelect = useCallback((id: string | null) => { setSelected(id); if (id) setDetent((d) => (d === 'hidden' ? 'small' : d)); }, []);
  const title = selected ? venues.find((v) => v.id === selected)!.name : `${list.length} attività vicino a te`;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapView center={user.location} pins={pins} selected={activityId ? activities.find((a) => a.id === activityId)?.venueId ?? null : selected} onSelect={onSelect} />
      <div className="scopri-top">
        <SearchField />
        <GlassIconButton icon="UI/Filters" label="Filtri" badge={sport ? 1 : 0} />
      </div>
      {sport && <FilterSummary label={shelfSports.find((x) => x.sport === sport)?.label ?? sport} />}
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
      <ListSheet title={title} detent={detent} onDetent={setDetent}>
        {list.map((a) => {
          const v = venueOf(a);
          return <ActivityRow key={a.id} title={a.title} place={`${v.name} · ${v.distance}`} price={priceLabel(a)} points={a.points} photo={a.photo} onPress={() => navigate(`/scopri/${a.id}${sport ? `?sport=${sport}` : ''}`)} />;
        })}
      </ListSheet>
      {activityId && (
        <VenueSheet key={activityId} activityId={activityId} onClose={() => { setCheckout(null); navigate(`/scopri${sport ? `?sport=${sport}` : ''}`); }}
          onBook={(dayId, time) => setCheckout({ dayId, time })} />
      )}
      <AnimatePresence>
        {activityId && checkout && (
          <CheckoutSheet activityId={activityId} dayId={checkout.dayId} time={checkout.time} onCancel={() => setCheckout(null)}
            onPaid={(r) => { const b = bookings.add({ activityId, dayId: checkout.dayId, time: checkout.time, ...r }); navigate(`/prenotato/${b.id}`); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
