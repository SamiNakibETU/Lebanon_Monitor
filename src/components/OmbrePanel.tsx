'use client';

import dynamic from 'next/dynamic';
import { AnalyticsStrip } from './charts';
import { EventList } from './EventList';
import { EventListClusterView } from './EventListClusterView';
import { LiveFeedPanel } from './LiveFeedPanel';
import type { LebanonEvent } from '@/types/events';

const EventMap = dynamic(
  () => import('@/components/EventMap').then((m) => ({ default: m.EventMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ background: 'var(--ombre-bg)' }}
      >
        <span className="text-[var(--ombre-muted)] text-sm">Carte…</span>
      </div>
    ),
  }
);

interface OmbrePanelProps {
  events: LebanonEvent[];
  selectedId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewMode?: 'list' | 'clusters';
}

export function OmbrePanel({ events, selectedId, onSelectEvent, viewMode = 'list' }: OmbrePanelProps) {
  const ombreEvents = events.filter((e) => e.classification === 'ombre');
  const ListComponent = viewMode === 'clusters' ? EventListClusterView : EventList;

  return (
    <section
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--ombre-bg)',
        color: 'var(--ombre-fg)',
      }}
    >
      <LiveFeedPanel />
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-none relative shrink-0" style={{ height: 260 }}>
          <EventMap
            events={ombreEvents}
            selectedId={selectedId}
            theme="dark"
            markerColor={() => '#7a5163'}
          />
        </div>
        <div
          className="flex-none overflow-y-auto px-4 py-3 shrink-0"
          style={{
            minHeight: 120,
            borderTop: '1px solid var(--border-dark)',
          }}
        >
          <AnalyticsStrip events={ombreEvents} theme="dark" />
        </div>
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          minHeight: 0,
          borderTop: '1px solid var(--border-dark)',
        }}
      >
        <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--ombre-muted)]">
          Événements ombre
        </div>
        {ombreEvents.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-[var(--ombre-muted)]">
            Aucun événement ombre dans les dernières 24h
          </p>
        ) : (
          <ListComponent
            events={ombreEvents}
            selectedId={selectedId}
            onSelect={onSelectEvent}
            theme="dark"
          />
        )}
      </div>
    </section>
  );
}
