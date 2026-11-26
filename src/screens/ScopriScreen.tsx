import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { activities, euro, user, venueOf, venues, type Activity } from '../data/data';
import { useScreenChrome } from '../app/chrome';
import { MapView, type MapPinData } from '../ui/scopri/MapView';
import { ListSheet, type Detent } from '../ui/scopri/ListSheet';
import { ActivityRow, GlassIconButton, SearchField, sportIcon } from '../ui/scopri/ScopriParts';

// Scopri — DS · Schermate › "scopri — chiaro" (1461:1083) e sheet piccolo / medio / grande.
const priceLabel = (a: Activity) => (a.pricePerPerson ? `${euro(a.price)} · ${euro(a.pricePerPerson)} a persona` : euro(a.price));

export function ScopriScreen() {
  const [params] = useSearchParams();
  const sport = params.get('sport');
  const [detent, setDetent] = useState<Detent>('small');
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();
  // Tab bar visibile solo con lo sheet piccolo; la pagina non scorre (mappa a tutto schermo).
  useScreenChrome({ tabBar: detent === 'small', bottomEdge: false, pageScroll: false });

  const list = useMemo(() => {
    const base = sport ? activities.filter((a) => a.sport === sport || (sport === 'calcio' && a.sport === 'calcio')) : activities;
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

  const onSelect = useCallback((id: string | null) => setSelected(id), []);
  const title = selected ? venues.find((v) => v.id === selected)!.name : `${list.length} attività vicino a te`;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapView center={user.location} pins={pins} selected={selected} onSelect={onSelect} />
      <div className="scopri-top">
        <SearchField />
        <GlassIconButton icon="UI/Filters" label="Filtri" />
      </div>
      <ListSheet title={title} detent={detent} onDetent={setDetent}>
        {list.map((a) => {
          const v = venueOf(a);
          return <ActivityRow key={a.id} title={a.title} place={`${v.name} · ${v.distance}`} price={priceLabel(a)} points={a.points} photo={a.photo} onPress={() => navigate(`/scopri/${a.id}`)} />;
        })}
      </ListSheet>
    </div>
  );
}
