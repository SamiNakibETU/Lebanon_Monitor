'use client';

import dynamic from 'next/dynamic';
import { AnalyticsStrip } from './charts';
import { EventList } from './EventList';
import { EventListClusterView } from './EventListClusterView';
import type { LebanonEvent } from '@/types/events';

const EventMap = dynamic(
  () => import('@/components/EventMap').then((m) => ({ default: m.EventMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ background: 'var(--lumiere-bg)' }}
      >
        <span className="text-[var(--lumiere-muted)] text-sm">Carte…</span>
      </div>
    ),
  }
);

interface LumierePanelProps {
  events: LebanonEvent[];
  selectedId: string | null;
  onSelectEvent: (id: string | null) => void;
  viewMode?: 'list' | 'clusters';
}

export function LumierePanel({ events, selectedId, onSelectEvent, viewMode = 'list' }: LumierePanelProps) {
  const lumiereEvents = events.filter((e) => e.classification === 'lumiere');
  const ListComponent = viewMode === 'clusters' ? EventListClusterView : EventList;

  return (
    <section
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--lumiere-bg)',
        color: 'var(--lumiere-fg)',
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-none relative shrink-0" style={{ height: 260 }}>
          <EventMap
            events={lumiereEvents}
            selectedId={selectedId}
            theme="light"
            markerColor={() => '#3d6b4a'}
          />
        </div>
        <div
          className="flex-none overflow-y-auto px-4 py-3 shrink-0"
          style={{
            minHeight: 120,
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <AnalyticsStrip events={lumiereEvents} theme="light" />
        </div>
      </div>
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          minHeight: 0,
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--lumiere-muted)]">
          Événements lumière
        </div>
        {lumiereEvents.length === 0 ? (
          <p className="px-5 py-8 text-[13px] text-[var(--lumiere-muted)]">
            Aucun événement lumière dans les dernières 24h
          </p>
        ) : (
          <ListComponent
            events={lumiereEvents}
            selectedId={selectedId}
            onSelect={onSelectEvent}
            theme="light"
          />
        )}
      </div>
    </section>
  );
}
