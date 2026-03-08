'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CctvState {
  source: { id: string; name: string };
  videoId?: string;
  embedUrl: string;
}

const LIVE_SOURCES = [
  { id: 'beirut-webcam', name: 'Beirut Skyline' },
  { id: 'aljazeera', name: 'Al Jazeera Arabic' },
];

export function SectionLive() {
  const { data: stream1 } = useSWR<CctvState>(
    '/api/v2/cctv?source=beirut-webcam',
    fetcher,
    { refreshInterval: 120_000 }
  );
  const { data: stream2 } = useSWR<CctvState>(
    '/api/v2/cctv?source=aljazeera',
    fetcher,
    { refreshInterval: 120_000 }
  );

  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 gap-px w-full"
      style={{ background: '#000000' }}
    >
      {LIVE_SOURCES.slice(0, 2).map((src, i) => {
        const data = i === 0 ? stream1 : stream2;
        const embedUrl =
          data?.videoId
            ? `/api/youtube/embed?videoId=${data.videoId}&autoplay=1&mute=1`
            : data?.embedUrl;

        return (
          <div
            key={src.id}
            className="flex flex-col"
            style={{ background: '#0A0A0A' }}
          >
            <div className="text-[11px] uppercase tracking-[0.08em] p-2" style={{ color: '#666666' }}>
              LIVE · {data?.source?.name ?? src.name}
            </div>
            <div
              className="flex-1 min-h-[140px] overflow-hidden"
              style={{ background: '#0D0D0D' }}
            >
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${data?.source?.name ?? src.name} stream`}
                  className="w-full h-full min-h-[140px]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="flex items-center justify-center h-full"
                  style={{ color: '#666666', fontSize: 12 }}
                >
                  Chargement…
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
