'use client';

export function FuelWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Prix carburant
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#FFFFFF' }}>
        —
      </div>
      <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
        LBP (benzin, diesel)
      </div>
    </div>
  );
}
