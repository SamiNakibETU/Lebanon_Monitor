'use client';

import { useMemo } from 'react';
import { EventList } from './EventList';
import type { LebanonEvent } from '@/types/events';

interface EventListClusterViewProps {
  events: LebanonEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  theme?: 'light' | 'dark';
}

/** Groups events by clusterId. Sorts: multi-event clusters first by recency, then unclustered. */
function groupByCluster(events: LebanonEvent[]): Array<{ clusterId: string | null; events: LebanonEvent[] }> {
  const byCluster = new Map<string | null, LebanonEvent[]>();
  for (const e of events) {
    const cid = e.metadata?.clusterId ?? null;
    const list = byCluster.get(cid) ?? [];
    list.push(e);
    byCluster.set(cid, list);
  }
  const groups = Array.from(byCluster.entries()).map(([clusterId, evts]) => {
    const sorted = [...evts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return { clusterId, events: sorted };
  });
  return groups.sort((a, b) => {
    const aMulti = a.clusterId && a.events.length > 1;
    const bMulti = b.clusterId && b.events.length > 1;
    if (aMulti && !bMulti) return -1;
    if (!aMulti && bMulti) return 1;
    const aLatest = a.events[0]?.timestamp.getTime() ?? 0;
    const bLatest = b.events[0]?.timestamp.getTime() ?? 0;
    return bLatest - aLatest;
  });
}

export function EventListClusterView({
  events,
  selectedId,
  onSelect,
  theme = 'dark',
}: EventListClusterViewProps) {
  const groups = useMemo(() => groupByCluster(events), [events]);
  const vars = theme === 'light' ? { muted: 'var(--lumiere-muted)', border: 'var(--border-light)' } : { muted: 'var(--ombre-muted)', border: 'var(--border-dark)' };

  return (
    <div className="flex flex-col overflow-y-auto">
      {groups.map(({ clusterId, events: clusterEvents }) => (
        <div key={clusterId ?? 'ungrouped'} className="border-b" style={{ borderColor: vars.border }}>
          {clusterId != null && clusterEvents.length > 1 ? (
            <div
              className="px-4 py-1.5 text-[10px] uppercase tracking-wider"
              style={{
                color: vars.muted,
                background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              }}
            >
              Cluster · {clusterEvents.length} événements
            </div>
          ) : null}
          <EventList
            events={clusterEvents}
            selectedId={selectedId}
            onSelect={onSelect}
            theme={theme}
          />
        </div>
      ))}
    </div>
  );
}
