'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { CATEGORY_LABELS } from '@/lib/labels';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventItem {
  id: string;
  title: string;
  source?: string | null;
  category?: string | null;
  occurredAt: string;
  classification: string;
  verificationStatus?: string;
  geoPrecision?: string;
  sourceCount?: number;
}

function getCategoryLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return (CATEGORY_LABELS as Record<string, string>)[code] ?? code.replace(/_/g, ' ');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

interface CondensedFeedProps {
  variant: 'lumiere' | 'ombre';
  lang?: string;
}

export function CondensedFeed({ variant, lang = 'fr' }: CondensedFeedProps) {
  const url = `/api/v2/events?classification=${variant}&limit=20&lang=${lang}`;
  const { data, error, isLoading } = useSWR<{ data: EventItem[] }>(url, fetcher, {
    refreshInterval: 30_000,
  });

  const events = data?.data ?? [];
  const isLumiere = variant === 'lumiere';
  const dotColor = isLumiere ? '#2E7D32' : '#C62828';
  const borderColor = isLumiere ? '#E0DCD7' : 'rgba(255,255,255,0.04)';
  const hoverBg = isLumiere ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';

  if (isLoading) {
    return (
      <div
        className="py-4 text-[13px]"
        style={{ color: isLumiere ? '#888888' : '#666666' }}
      >
        Chargement des événements…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="py-4 text-[13px]"
        style={{ color: isLumiere ? '#888888' : '#666666' }}
      >
        Connexion en cours…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className="py-4 text-[13px]"
        style={{ color: isLumiere ? '#888888' : '#666666' }}
      >
        Aucun événement.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {events.map((e) => {
        const time = new Date(e.occurredAt);
        const timeStr = time.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <Link
            key={e.id}
            href={`/event/${e.id}?lang=${lang}`}
            className="flex items-start gap-3 py-3 px-0 transition-colors group"
            style={{
              borderBottom: `1px solid ${borderColor}`,
              fontFamily: '"DM Mono", "SF Mono", monospace',
              fontSize: 13,
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span
              className="inline-block shrink-0 mt-1.5"
              style={{ width: 4, height: 4, background: dotColor }}
            />
            <span
              className="shrink-0 tabular-nums"
              style={{ color: isLumiere ? '#888888' : '#666666' }}
            >
              {timeStr}
            </span>
            <span
              className="shrink-0"
              style={{ color: isLumiere ? '#888888' : '#666666' }}
            >
              {e.source ?? '—'}
            </span>
            <span style={{ color: isLumiere ? '#888888' : '#666666' }}>│</span>
            <span
              className="flex-1 min-w-0"
              style={{ color: isLumiere ? '#1A1A1A' : '#FFFFFF' }}
            >
              {truncate(e.title, 60)}
            </span>
            <span
              className="shrink-0 text-[11px] uppercase"
              style={{ color: isLumiere ? '#888888' : '#666666' }}
            >
              {getCategoryLabel(e.category)}
            </span>
            <span
              className="shrink-0 text-[10px] uppercase"
              style={{ color: isLumiere ? '#888888' : '#666666' }}
            >
              {e.geoPrecision ?? 'unknown'}
            </span>
            <span
              className="shrink-0 text-[10px] uppercase tabular-nums"
              style={{ color: isLumiere ? '#888888' : '#666666' }}
            >
              {e.sourceCount ?? 1}s
            </span>
          </Link>
        );
      })}
    </div>
  );
}
