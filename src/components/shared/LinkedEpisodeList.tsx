'use client';

import Link from 'next/link';

export interface LinkedEpisode {
  episodeId: string;
  eventCount: number;
  episode: {
    id: string;
    label: string | null;
    status?: string;
    firstEventAt: string | null;
    lastEventAt: string | null;
  } | null;
}

export interface LinkedEpisodeListProps {
  episodes: LinkedEpisode[];
  variant?: 'light' | 'dark';
}

export function LinkedEpisodeList({ episodes, variant = 'dark' }: LinkedEpisodeListProps) {
  if (episodes.length === 0) return null;

  const labelColor = variant === 'dark' ? '#666666' : '#888888';
  const borderColor = variant === 'dark' ? 'rgba(255,255,255,0.04)' : '#E0DCD7';
  const textColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';

  return (
    <div className="pt-6" style={{ borderTop: `1px solid ${borderColor}` }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: labelColor }}>
        Épisodes liés
      </div>
      <ul className="flex flex-col gap-2">
        {episodes.map((ep) => (
          <li key={ep.episodeId}>
            <Link
              href={`/episode/${ep.episode?.id ?? ep.episodeId}`}
              className="flex flex-col gap-0.5 py-2 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)] block -mx-2 px-2"
              style={{ color: textColor }}
            >
              <span className="text-[14px] font-normal">
                {ep.episode?.label ?? `Épisode ${ep.episodeId.slice(0, 8)}`}
              </span>
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: labelColor }}>
                {ep.eventCount} événement{ep.eventCount !== 1 ? 's' : ''}
                {ep.episode?.firstEventAt && ep.episode?.lastEventAt && (
                  <> · {new Date(ep.episode.firstEventAt).toLocaleDateString('fr-FR')} → {new Date(ep.episode.lastEventAt).toLocaleDateString('fr-FR')}</>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
