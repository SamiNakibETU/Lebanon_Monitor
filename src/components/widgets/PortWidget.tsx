'use client';

export function PortWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#FAFAFA' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Port Beyrouth
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        —
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        Données AIS à venir
      </div>
    </div>
  );
}
