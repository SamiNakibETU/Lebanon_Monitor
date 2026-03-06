'use client';

import { useEffect, useState } from 'react';

const EXTERNAL_LINKS = [
  { id: 'lbci', label: 'LBCI', url: 'https://www.lbcgroup.tv/live-watch/LBCI/video/en' },
  { id: 'libanvision', label: 'LibanVision', url: 'https://www.libanvision.com/webcam-beyrouth.htm' },
  { id: 'lebcam', label: 'LebCam', url: 'https://livelebcams.com/' },
];

interface LiveState {
  videoId: string | null;
  isLive: boolean;
  embedUrl: string | null;
  channel: { id: string; name: string };
  channels: { id: string; name: string }[];
}

export function LiveFeedPanel() {
  const [channelId, setChannelId] = useState('lbci');
  const [state, setState] = useState<LiveState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/youtube/live?channel=${encodeURIComponent(channelId)}`)
      .then((r) => r.json())
      .then((d: LiveState) => {
        if (cancelled) return;
        setState(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [channelId]);

  const hasVideo = !loading && state?.videoId;
  const iframeSrc = hasVideo
    ? `/api/youtube/embed?videoId=${state!.videoId}&mute=1`
    : null;

  const lbciLink = EXTERNAL_LINKS.find((l) => l.id === 'lbci')!;

  return (
    <div
      className="flex-none flex flex-col shrink-0"
      style={{
        minHeight: 180,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--ombre-muted)]">
          Direct — Beyrouth
        </span>
        <div className="flex items-center gap-3">
          {state?.channels?.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelId(ch.id)}
              className="px-2 py-1 text-[10px] rounded transition-colors"
              style={{
                background: channelId === ch.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: channelId === ch.id ? 'var(--ombre-fg)' : 'var(--ombre-muted)',
              }}
            >
              {ch.name}
            </button>
          ))}
          {EXTERNAL_LINKS.filter((l) => l.id !== 'lbci').map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[var(--ombre-muted)] hover:text-[var(--ombre-fg)]"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        <div
          className="flex-1 min-w-0 rounded overflow-hidden flex items-center justify-center relative"
          style={{ background: '#000', minHeight: 140 }}
        >
          {loading ? (
            <span className="text-[var(--ombre-muted)] text-xs">Chargement…</span>
          ) : hasVideo && iframeSrc ? (
            <>
              {state?.isLive && (
                <span
                  className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded"
                  style={{ background: '#dc2626', color: '#fff' }}
                >
                  LIVE
                </span>
              )}
              <iframe
                key={iframeSrc}
                src={iframeSrc}
                title={`${state?.channel?.name ?? 'Live'} stream`}
                className="w-full h-full min-h-[140px] relative"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </>
          ) : (
            <a
              href={lbciLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[140px] hover:bg-white/5 transition-colors"
              style={{ color: 'var(--ombre-fg)' }}
            >
              <span className="text-4xl opacity-60">▶</span>
              <span className="text-[13px] font-medium">
                {state?.channel?.name ?? 'LBCI'} n&apos;est pas en direct
              </span>
              <span className="text-[11px] text-[var(--ombre-muted)]">
                Cliquer pour regarder sur {state?.channel?.name ?? 'LBCI'}
              </span>
            </a>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {EXTERNAL_LINKS.slice(1).map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded text-[11px] hover:bg-white/5 transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--ombre-fg)',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-[#dc2626]" />
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
