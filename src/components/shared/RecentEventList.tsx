'use client';

import Link from 'next/link';

export interface RecentEvent {
  id: string;
  title: string;
  occurredAt: string;
  eventType?: string | null;
  polarity?: string | null;
}

export interface RecentEventListProps {
  events: RecentEvent[];
  variant?: 'light' | 'dark';
  maxItems?: number;
}

export function RecentEventList({ events, variant = 'dark', maxItems = 15 }: RecentEventListProps) {
  const items = events.slice(0, maxItems);
  if (items.length === 0) return null;

  const metaColor = variant === 'dark' ? '#666666' : '#888888';
  const textColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';
  const borderColor = variant === 'dark' ? 'rgba(255,255,255,0.04)' : '#E0DCD7';

  return (
    <div className="pt-6" style={{ borderTop: `1px solid ${borderColor}` }}>
      <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: metaColor }}>
        Événements récents
      </div>
      <ul className="flex flex-col">
        {items.map((e) => (
          <li key={e.id}>
            <Link
              href={`/event/${e.id}`}
              className="flex flex-col gap-0.5 py-3 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.02)] block -mx-2 px-2 border-b"
              style={{ borderColor, color: textColor }}
            >
              <span className="text-[14px] font-normal leading-snug">{e.title}</span>
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: metaColor }}>
                {new Date(e.occurredAt).toLocaleDateString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
