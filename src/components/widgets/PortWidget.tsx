'use client';

export function PortWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#FAFAFA' }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
        Port Beyrouth
      </div>
      <div className="text-[48px] font-light tabular-nums" style={{ color: '#1A1A1A' }}>
        AIS
      </div>
      <div className="text-[11px] mt-1 mb-3" style={{ color: '#666666' }}>
        Suivi trafic maritime en temps réel
      </div>
      <a
        href="https://www.marinetraffic.com/en/ais/details/ports/100"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] transition-colors"
        style={{ color: '#1A1A1A', textDecoration: 'underline' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#666666'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#1A1A1A'; }}
      >
        Voir le trafic en direct →
      </a>
      <div className="text-[10px] mt-2" style={{ color: '#888888' }}>
        Source: MarineTraffic AIS
      </div>
    </div>
  );
}
