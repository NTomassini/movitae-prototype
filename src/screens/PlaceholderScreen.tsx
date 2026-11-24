// Segnaposto delle sezioni non ancora costruite (fase 6, passo 1): titolo grande e righe per provare lo scorrimento.
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div style={{ padding: '8px var(--size-margin) 0' }}>
      <h1 className="t-large-title" style={{ padding: '4px 0 16px' }}>{title}</h1>
      {Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{ height: 88, marginBottom: 12, borderRadius: 'var(--radius-20)', background: 'var(--bg-surface)' }} />
      ))}
    </div>
  );
}
