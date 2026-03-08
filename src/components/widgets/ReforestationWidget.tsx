'use client';

export function ReforestationWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#F5F2EE' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
        Reforestation
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        —
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#888888' }}>
        hectares replantés
      </div>
    </div>
  );
}
