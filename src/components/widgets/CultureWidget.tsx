'use client';

export function CultureWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Agenda culturel
      </div>
      <div className="text-[14px] leading-relaxed" style={{ color: '#1A1A1A' }}>
        Prochains événements — à venir
      </div>
    </div>
  );
}
