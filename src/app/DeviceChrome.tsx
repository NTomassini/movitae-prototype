// Barra di stato e indicatore Home: solo nella cornice desktop (sul telefono li disegna iOS).
export function StatusBar() {
  return (
    <div className="device-status" aria-hidden="true">
      <span className="device-time">9:41</span>
      <span className="device-icons">
        <svg width="19" height="12" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="currentColor"/><rect x="5" y="5" width="3.2" height="7" rx="0.7" fill="currentColor"/><rect x="10" y="2.5" width="3.2" height="9.5" rx="0.7" fill="currentColor"/><rect x="15" y="0" width="3.2" height="12" rx="0.7" fill="currentColor"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.7 10.2 10.2 0 0 0 1.3 3.6l1.2 1.2a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2a6.8 6.8 0 0 0-9.6 0l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c.5 0 .9.2 1.2.5L8.5 11 7.3 9.7c.3-.3.7-.5 1.2-.5Z" fill="currentColor"/></svg>
        <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.35" fill="none"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.4"/></svg>
      </span>
    </div>
  );
}

export function HomeIndicator() {
  return <div className="device-home" aria-hidden="true"><span /></div>;
}
