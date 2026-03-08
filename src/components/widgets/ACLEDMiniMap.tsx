'use client';

export function ACLEDMiniMap() {
  return (
    <div
      className="flex flex-col p-4 min-h-[140px]"
      style={{ background: 'transparent' }}
    >
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Incidents ACLED
      </div>
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: '#666666', fontSize: 13 }}
      >
        Carte 30j — à venir
      </div>
    </div>
  );
}
