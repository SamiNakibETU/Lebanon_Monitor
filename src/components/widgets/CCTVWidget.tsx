'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CctvState {
  source: { id: string; name: string };
  type: 'youtube' | 'webcam' | 'direct';
  videoId?: string;
  isLive?: boolean;
  embedUrl: string;
  sources?: Array<{ id: string; name: string }>;
}

const LUMIERE_SOURCE_IDS = ['beirut-webcam', 'lbci', 'mtv', 'otv'];
const OMBRE_SOURCE_IDS = ['aljazeera', 'alarabiya', 'aljadeed', 'france24-ar'];

export function CCTVWidget({ variant = 'lumiere' }: { variant?: 'lumiere' | 'ombre' }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const variantParam = variant === 'ombre' ? 'ombre' : 'lumiere';
  const url = selectedId
    ? `/api/v2/cctv?source=${selectedId}`
    : `/api/v2/cctv?variant=${variantParam}`;
  const { data, error, mutate } = useSWR<CctvState>(url, fetcher, {
    refreshInterval: 120_000,
  });

  useEffect(() => {
    if (data?.source?.id && !selectedId) setSelectedId(data.source.id);
  }, [data?.source?.id, selectedId]);

  const embedUrl =
    data?.videoId
      ? `/api/youtube/embed?videoId=${data.videoId}&autoplay=1&mute=1`
      : data?.embedUrl;
  const isLive = data?.isLive ?? false;
  const sources = data?.sources ?? [];

  return (
    <div className="flex flex-col h-full min-h-[140px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: '#666666' }} suppressHydrationWarning>
          {isLive && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E53935] animate-pulse" />
          )}
          LIVE · {data?.source?.name ?? '—'}
        </span>
      </div>
      <div
        className="flex-1 min-h-[120px] overflow-hidden flex items-center justify-center"
        style={{ background: '#0D0D0D' }}
      >
        {error ? (
          <div className="flex flex-col items-center gap-2 p-4" style={{ color: '#666666' }} suppressHydrationWarning>
            <span className="text-xs">Flux indisponible</span>
          </div>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={`${data?.source?.name ?? 'Live'} stream`}
            className="w-full h-full min-h-[120px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4" style={{ color: '#666666' }} suppressHydrationWarning>
            <span className="text-xs">Chargement…</span>
          </div>
        )}
      </div>
      {sources.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className="text-[10px] px-2 py-0.5 transition-colors duration-150"
              style={{
                color: selectedId === s.id ? '#FFFFFF' : '#666666',
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
