'use client';

const WEBCAMS = [
  {
    label: 'Beirut Skyline',
    url: 'https://www.skylinewebcams.com/webcam/lebanon/beirut/beirut/beirut.html',
    source: 'SkylineWebcams',
  },
  {
    label: 'Beirut Coast',
    url: 'https://liveworldwebcams.com/beirut-webcam/',
    source: 'LiveWorldWebcams',
  },
  {
    label: 'AUB Campus',
    url: 'https://www.worldlivecamera.com/en/Lebanon',
    source: 'WorldLiveCamera',
  },
  {
    label: 'Insecam LB',
    url: 'http://www.insecam.org/en/bycountry/LB/',
    source: 'Insecam',
  },
];

export function CCTVWidget() {
  return (
    <div className="flex flex-col p-4" style={{ background: '#0A0A0A' }}>
      <div
        className="text-[11px] uppercase tracking-[0.08em] mb-3"
        style={{ color: '#666666' }}
      >
        CCTV / Webcams · Beyrouth
      </div>
      <div className="flex flex-col gap-2">
        {WEBCAMS.map((cam) => (
          <a
            key={cam.url}
            href={cam.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-1 transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999999';
            }}
          >
            <span className="text-[13px]" style={{ color: '#CCCCCC' }}>
              {cam.label}
            </span>
            <span className="text-[10px]" style={{ color: '#666666' }}>
              {cam.source} →
            </span>
          </a>
        ))}
      </div>
      <div className="text-[10px] mt-3" style={{ color: '#444444' }}>
        Flux publics · OSINT
      </div>
    </div>
  );
}
