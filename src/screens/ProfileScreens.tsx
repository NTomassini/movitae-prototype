import { useState } from 'react';
import { useNav } from '../app/nav';
import { AnimatePresence } from 'motion/react';
import { achievements, activity, euro, fmtPoints, pickSports, user, venueOf, venues } from '../data/data';
import { GOALS } from '../data/profile';
import { NOTIFS, balance, store, useAppState } from '../state/bookings';
import { chat } from '../state/movi';
import { PageHeader } from '../ui/PageHeader';
import { PageSheet } from '../ui/PageSheet';
import { ModalSheet } from '../ui/ModalSheet';
import { SystemAlert } from '../ui/SystemAlert';
import { Img } from '../ui/Img';
import { Icon } from '../ui/Icon';
import { Button, Toggle } from '../ui/booking/BookingParts';
import { HealthExplain, HealthSystemSheet } from '../ui/mission/Mission';
import { ListGroup, ListRow } from '../ui/settings/List';
import { CertStatus, DocIcon, FormSheet, fmtLong, useUpload } from '../ui/docs/Docs';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { useScreenChrome } from '../app/chrome';
import './OnboardingScreen.css';
import './ProfileScreens.css';

const sportNames = (ids: string[]) => ids.map((s) => pickSports.find((p) => p.sport === s)?.label ?? s).join(', ');

// ---------- profilo/1 ----------
export function ProfileScreen() {
  const navigate = useNav();
  const app = useAppState();
  const [sheet, setSheet] = useState(false);
  const fav = app.favSports ?? user.favoriteSports;
  const bal = balance(app.bookings, user.points, user.saved);
  const unlocked = app.profile ? 0 : achievements.filter((a) => a.unlocked).length;
  return (
    <div className="settings-page">
      <PageHeader title="Profilo" type="B" />
      <div className="profile-head">
        <span className="profile-avatar t-title-1" aria-hidden="true">{user.initial}</span>
        <div>
          <h2 className="t-title-2">{user.fullName}</h2>
          <p className="t-subheadline secondary">Su Movitae da {user.memberSince}</p>
        </div>
      </div>
      <div className="profile-tiles">
        <div className="profile-tile"><span className="t-footnote-emphasized secondary">Hai risparmiato</span><span className="t-title-2" style={{ color: 'var(--earn-default)' }}>{euro(bal.saved)}</span></div>
        <div className="profile-tile"><span className="t-footnote-emphasized secondary">Serie più lunga</span><span className="t-title-2" style={{ color: 'var(--earn-default)' }}>{user.bestStreak} {user.bestStreak === 1 ? 'giorno' : 'giorni'}</span></div>
      </div>
      <ListGroup>
        <ListRow title="Prenotazioni" onPress={() => navigate('/prenotazioni')} />
        <ListRow title="Documenti" onPress={() => navigate('/documenti')} />
        <ListRow title="Preferiti" onPress={() => navigate('/preferiti')} />
        <ListRow title="Sport preferiti" subtitle={fav.length ? sportNames(fav) : 'Nessuno'} onPress={() => setSheet(true)} />
      </ListGroup>
      <ListGroup>
        <ListRow title="Traguardi" subtitle={`${unlocked} di ${achievements.length} sbloccati`} onPress={() => navigate('/premi/traguardi')} />
      </ListGroup>
      <ListGroup>
        <ListRow title="Impostazioni" onPress={() => navigate('/impostazioni')} />
      </ListGroup>
      <AnimatePresence>{sheet && <SportsSheet key="s" value={fav} onClose={() => setSheet(false)} />}</AnimatePresence>
    </div>
  );
}

// ---------- profilo/2 sheet "Sport preferiti" ----------
function SportsSheet({ value, onClose }: { value: string[]; onClose: () => void }) {
  const [v, setV] = useState(value);
  const toggle = (s: string) => setV(v.includes(s) ? v.filter((x) => x !== s) : [...v, s]);
  return (
    <PageSheet title="Sport preferiti" onCancel={onClose} done="Fine" doneDisabled={!v.length} onDone={() => { store.setFavoriteSports(v); onClose(); }}>
      <p className="t-body secondary">Scegline quanti vuoi: li mettiamo per primi in Home e nelle ricerche.</p>
      <div className="onb-sports" style={{ padding: '24px 0 0' }} role="group" aria-label="Sport preferiti">
        {pickSports.map((s) => {
          const on = v.includes(s.sport);
          return (
            <button key={s.sport} className={`onb-sport pressable${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(s.sport)}>
              <Img name={s.image} style={{ width: 56, height: 56 }} />
              <span className="t-subheadline-emphasized">{s.label}</span>
              {on && <span className="onb-sport__check"><Icon name="UI/Check" size={14} /></span>}
            </button>
          );
        })}
      </div>
    </PageSheet>
  );
}

// ---------- Preferiti (non disegnata: come la lista delle prenotazioni) ----------
export function FavoritesScreen() {
  const navigate = useNav();
  const { favorites } = useAppState();
  return (
    <div className="settings-page">
      <PageHeader title="Preferiti" type="B" />
      {favorites.length ? (
        <ListGroup>
          {favorites.map((id) => {
            const a = activity(id); const v = venueOf(a);
            return <ListRow key={id} leading={<Img name={a.photo} style={{ width: 56, height: 56, borderRadius: 12, flex: 'none' }} />} title={a.title} titleClass="t-headline"
              subtitle={`${v.name} · ${v.distance}`} onPress={() => navigate(`/scopri/${id}`)} />;
          })}
        </ListGroup>
      ) : (
        <div className="empty-state">
          <Icon name="UI/Favorite" size={48} />
          <h2 className="t-title-3">Nessun preferito</h2>
          <p className="t-body secondary">Tocca il cuore su un’attività per ritrovarla qui.</p>
          <Button onPress={() => navigate('/scopri')}>Trova un’attività</Button>
        </div>
      )}
    </div>
  );
}

// ---------- impostazioni/1 ----------
export function SettingsScreen() {
  const navigate = useNav();
  const app = useAppState();
  const [sheet, setSheet] = useState<null | 'health' | 'explain' | 'system'>(null);
  const [alert, setAlert] = useState<null | 'delete' | 'logout'>(null);
  const health = app.profile ? app.profile.health && app.demo.mission !== 'no-health' : app.demo.mission !== 'no-health';
  const goal = app.settings.nextGoal ?? user.mission.goal;
  const leave = (wipe: boolean) => {
    // Q43: fuori dall'app → intro dell'onboarding; "Accedi" riporta dentro come Marco
    if (wipe) { store.reset(); chat.reset(); }
    navigate('/onboarding/intro', { replace: true });
  };
  return (
    <div className="settings-page">
      <PageHeader title="Impostazioni" type="B" />
      <ListGroup label="Missione">
        <ListRow title="Obiettivo passi" value={`${fmtPoints(goal)} passi`} onPress={() => navigate('/impostazioni/obiettivo')} />
        {health
          ? <ListRow title="Apple Salute" value="Collegata" onPress={() => setSheet('health')} />
          : <ListRow title="Collega Salute" tone="accent" onPress={() => setSheet('explain')} />}
      </ListGroup>
      <ListGroup label="Notifiche">
        <ListRow title="Notifiche" onPress={() => navigate('/impostazioni/notifiche')} />
      </ListGroup>
      <ListGroup label="Account">
        <ListRow title="Email" subtitle={app.profile ? 'nome@esempio.it' : 'marco.rossi@icloud.com'} />
        {/* Q44: richiesta simulata; cosa è successo si legge nella riga stessa */}
        <ListRow title="Esporta i miei dati" subtitle={app.settings.exportRequested ? 'Te li mandiamo per email entro 24 ore' : undefined}
          chevron={!app.settings.exportRequested} onPress={app.settings.exportRequested ? undefined : () => store.setSettings({ exportRequested: true })} />
        <ListRow title="Elimina account" tone="accent" chevron={false} onPress={() => setAlert('delete')} />
      </ListGroup>
      <ListGroup>
        <ListRow title={<span style={{ display: 'block', textAlign: 'center' }}>Esci</span>} tone="error" chevron={false} onPress={() => setAlert('logout')} />
      </ListGroup>

      {sheet === 'health' && (
        <ModalSheet visible={364} label="Salute è collegata" onClose={() => setSheet(null)}>
          {(close) => (
            <div className="sheet-center">
              <Img name="img/orme" style={{ width: 96, height: 96 }} />
              <h2 className="t-title-2">Salute è collegata</h2>
              <p className="t-body secondary">Contiamo i tuoi passi in automatico. Per scollegarla vai in Impostazioni di iPhone › Salute › Accesso ai dati › Movitae.</p>
              <Button onPress={close}>Apri Impostazioni</Button>
            </div>
          )}
        </ModalSheet>
      )}
      {sheet === 'explain' && (
        <ModalSheet visible={529} label="Guadagna punti camminando" onClose={() => setSheet(null)}>
          {() => <HealthExplain onContinue={() => setSheet('system')} />}
        </ModalSheet>
      )}
      <ScreenOverlay>
        <AnimatePresence>
          {sheet === 'system' && <HealthSystemSheet key="h" onAllow={() => { setSheet(null); store.setDemo({ mission: app.profile ? 'first-day' : 'active' }); }} onDeny={() => setSheet(null)} />}
        </AnimatePresence>
      </ScreenOverlay>
      <AnimatePresence>
        {alert === 'delete' && <SystemAlert key="d" title="Vuoi eliminare l’account?" message="Punti, buoni e prenotazioni vengono cancellati. Non si può annullare." action="Elimina" destructive onCancel={() => setAlert(null)} onConfirm={() => leave(true)} />}
        {alert === 'logout' && <SystemAlert key="l" title="Vuoi uscire?" message="Per rientrare ti basta accedere di nuovo con il tuo account." action="Esci" onCancel={() => setAlert(null)} onConfirm={() => leave(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ---------- impostazioni/3 notifiche, conferme/6 notifiche spente ----------
export function NotificationsScreen() {
  const app = useAppState();
  const off = app.demo.iosNotifications === 'off';
  const n = app.settings.notifs;
  const [h, m] = app.settings.missionTime.split(':');
  return (
    <div className="settings-page">
      <PageHeader title="Notifiche" type="B" />
      {off && (
        <div className="card notif-off">
          <h2 className="t-headline">Le notifiche sono spente su iPhone</h2>
          <p className="t-subheadline secondary">Accendile per sapere quando completi la missione o quando un buono è pronto.</p>
          <a className="doc-link t-headline" href="app-settings:" style={{ marginTop: 12 }}>Apri Impostazioni</a>
        </div>
      )}
      <ListGroup note="Ti scriviamo solo per queste cose. Puoi spegnere tutto anche da Impostazioni di iPhone.">
        {NOTIFS.map((k) => (
          <ListRow key={k} title={k} right={<Toggle checked={!off && n[k]} onChange={(v) => !off && store.setSettings({ notifs: { ...n, [k]: v } })} label={k} />} />
        ))}
      </ListGroup>
      <ListGroup>
        {/* Q45: selettore dell'ora di sistema */}
        <label className="list-row pressable-row time-row">
          <span className="list-row__texts"><span className="t-body">Ora della missione</span></span>
          <span className="list-row__value t-body">{Number(h)}:{m}</span>
          <Icon name="UI/Chevron-Right" size={24} className="list-row__chevron" />
          <input type="time" value={app.settings.missionTime} onChange={(e) => e.target.value && store.setSettings({ missionTime: e.target.value })} aria-label="Ora della missione" />
        </label>
      </ListGroup>
    </div>
  );
}

// ---------- impostazioni/4 obiettivo passi ----------
export function GoalScreen() {
  const navigate = useNav();
  const app = useAppState();
  useScreenChrome({ tabBar: false });
  const current = app.settings.nextGoal ?? user.mission.goal;
  const [v, setV] = useState(current);
  return (
    <div className="settings-page">
      <PageHeader title="Obiettivo passi" type="B" />
      <p className="t-body secondary" style={{ marginTop: -4 }}>Il nuovo obiettivo vale da domani. La tua serie resta com’è.</p>
      <div className="onb-goals card" style={{ margin: '24px 0 0' }} role="radiogroup" aria-label="Obiettivo di passi">
        {GOALS.map((g, i) => {
          const on = g.steps === v;
          return (
            <div key={g.steps}>
              {i > 0 && <div className="onb-goals__sep" />}
              <button role="radio" aria-checked={on} className="onb-goal" onClick={() => setV(g.steps)}>
                <span className={on ? 't-headline' : 't-body'}>{fmtPoints(g.steps)} passi</span>
                {g.steps === 6000 && <span className="onb-tag t-footnote-emphasized">Consigliato</span>}
                <span className="onb-goal__pts t-subheadline-emphasized">+{g.points} pt</span>
                <span className={`onb-radio${on ? ' is-on' : ''}`} aria-hidden="true">{on && <Icon name="UI/Check" size={14} />}</span>
              </button>
            </div>
          );
        })}
      </div>
      <ScreenOverlay>
        <div className="onb__cta" style={{ pointerEvents: 'auto' }}>
          <Button disabled={v === current} onPress={() => { store.setSettings({ nextGoal: v === user.mission.goal ? null : v }); navigate(-1); }}>Salva</Button>
        </div>
      </ScreenOverlay>
    </div>
  );
}

// ---------- documenti/6, conferme/5 ----------
export function DocumentsScreen() {
  const { docs } = useAppState();
  const c = docs.certificate;
  const upload = useUpload();
  const [form, setForm] = useState<string | null>(null);
  const [alert, setAlert] = useState(false);
  const forms = Object.entries(docs.forms);
  return (
    <div className="settings-page">
      <PageHeader title="Documenti" type="B" />
      <ListGroup label="Certificato medico" note="Il certificato lo vede solo la struttura dove hai prenotato, e solo se lo chiede.">
        {c ? (
          <>
            <ListRow leading={<DocIcon />} title={c.type === 'non' ? 'Non agonistico' : 'Agonistico'} titleClass="t-headline" subtitle={<CertStatus c={c} />} />
            <ListRow title="Sostituisci" onPress={() => upload.open(document.activeElement as HTMLElement)} />
            <ListRow title="Elimina" tone="accent" chevron={false} onPress={() => setAlert(true)} />
          </>
        ) : (
          <>
            <ListRow leading={<DocIcon />} title="Certificato medico" titleClass="t-headline" subtitle="Da caricare" />
            <ListRow title="Carica il certificato" tone="accent" chevron={false} onPress={() => upload.open(document.activeElement as HTMLElement)} />
          </>
        )}
      </ListGroup>
      <ListGroup label="Moduli firmati">
        {forms.length
          ? forms.map(([id, date]) => <ListRow key={id} title={venues.find((x) => x.id === id)?.name ?? id} subtitle={`Firmato il ${fmtLong(date)}`} onPress={() => setForm(id)} />)
          : <ListRow title={<span className="secondary">Nessun modulo firmato</span>} />}
      </ListGroup>
      {upload.ui}
      <AnimatePresence>{form && <FormSheet key="f" venueId={form} onClose={() => setForm(null)} />}</AnimatePresence>
      <AnimatePresence>
        {alert && <SystemAlert key="a" title="Vuoi eliminare il certificato?" message="Le strutture che lo chiedono non potranno più vederlo." action="Elimina" onCancel={() => setAlert(false)} onConfirm={() => { store.setCertificate(null); setAlert(false); }} />}
      </AnimatePresence>
    </div>
  );
}
