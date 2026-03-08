'use client';

import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CctvState {
  source: { id: string; name: string };
  videoId?: string;
  embedUrl: string;
}

interface TelegramEvent {
  id: string;
  title: string;
  occurredAt: string;
  source?: string | null;
}

const LIVE_SOURCES = [
  { id: 'beirut-webcam', name: 'Beirut Skyline' },
  { id: 'aljazeera', name: 'Al Jazeera Arabic' },
];

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

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
  const { data: telegramRes } = useSWR<{ data: TelegramEvent[] }>(
    '/api/v2/events?source=telegram&limit=10',
    fetcher,
    { refreshInterval: 120_000 }
  );

  const telegramEvents = Array.isArray(telegramRes?.data) ? telegramRes.data : [];

  return (
    <section
      className="flex flex-col w-full"
      style={{ background: '#000000' }}
    >
      <div
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
      </div>
      {telegramEvents.length > 0 && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#0A0A0A' }}
        >
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
            Telegram
          </div>
          <div className="flex flex-col gap-1">
            {telegramEvents.slice(0, 5).map((e) => (
              <Link
                key={e.id}
                href={`/event/${e.id}`}
                className="text-[13px] leading-snug transition-colors hover:text-[#FFFFFF] font-mono"
                style={{ color: '#888888' }}
              >
                <span style={{ color: '#666666', marginRight: 8 }}>{formatTime(e.occurredAt)}</span>
                {e.title.length > 70 ? `${e.title.slice(0, 70)}…` : e.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
