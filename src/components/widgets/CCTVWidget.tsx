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
}

export function CCTVWidget() {
  const { data, error } = useSWR<CctvState>('/api/v2/cctv', fetcher, {
    refreshInterval: 120_000,
  });

  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    if (data?.source?.id) setSelectedSource(data.source.id);
  }, [data?.source?.id]);

  const embedUrl = data?.embedUrl;
  const isLive = data?.isLive ?? false;

  return (
    <div className="flex flex-col h-full min-h-[140px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }} suppressHydrationWarning>
          {isLive && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          LIVE · {data?.source?.name ?? '—'}
        </span>
      </div>
      <div
        className="flex-1 min-h-[120px] rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: '#000' }}
      >
        {error ? (
          <div className="flex flex-col items-center gap-2 p-4" style={{ color: 'var(--text-tertiary)' }} suppressHydrationWarning>
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
          <div className="flex flex-col items-center gap-2 p-4" style={{ color: 'var(--text-tertiary)' }} suppressHydrationWarning>
            <span className="text-xs">Chargement…</span>
          </div>
        )}
      </div>
    </div>
  );
}
