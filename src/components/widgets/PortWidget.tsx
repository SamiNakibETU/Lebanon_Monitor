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
      <div className="text-[11px] mt-1 mb-3" style={{ color: '#666666' }}>
        Trafic maritime — AIS
      </div>
      <a
        href="https://www.marinetraffic.com/en/ais/details/ports/100"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] transition-colors"
        style={{ color: '#4FC3F7', textDecoration: 'none' }}
      >
        Voir le trafic maritime →
      </a>
      <div className="text-[10px] mt-1" style={{ color: '#888888' }}>
        Source: MarineTraffic
      </div>
    </div>
  );
}
