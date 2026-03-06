'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { SplitLayout } from '@/components/SplitLayout';
import { SharedHeader } from '@/components/SharedHeader';
import { LumierePanel } from '@/components/LumierePanel';
import { OmbrePanel } from '@/components/OmbrePanel';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import type { LebanonEvent, SourceName, EventCategory } from '@/types/events';
import type { SourceStatus } from '@/components/SourceStatusGrid';

interface ApiEvent {
  id: string;
  source: string;
  title: string;
  description?: string;
  url?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  classification: LebanonEvent['classification'];
  confidence: number;
  category: string;
  severity: string;
  rawData?: Record<string, unknown>;
  metadata: { fetchedAt: string; ttlSeconds: number; sourceReliability: string };
}

interface ApiResponse {
  events: ApiEvent[];
  total: number;
  statuses?: SourceStatus[];
  indicators?: { lbp: number | null; weatherBeirut: string | null; aqi: number | null };
}

function parseEvents(api: ApiResponse): LebanonEvent[] {
  return api.events.map((e) => ({
    ...e,
    source: e.source as LebanonEvent['source'],
    category: e.category as LebanonEvent['category'],
    severity: e.severity as LebanonEvent['severity'],
    timestamp: new Date(e.timestamp),
    metadata: {
      ...e.metadata,
      fetchedAt: new Date(e.metadata.fetchedAt),
      sourceReliability: e.metadata.sourceReliability as LebanonEvent['metadata']['sourceReliability'],
    },
  }));
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('API error');
    return r.json();
  });

type ViewTab = 'lumiere' | 'ombre';

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceName | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'clusters'>('list');
  const [mobileTab, setMobileTab] = useState<ViewTab>('lumiere');
  const { data, error, isLoading } = useSWR<ApiResponse>('/api/events', fetcher, {
    refreshInterval: 60_000,
  });

  const allEvents = useMemo(() => (data ? parseEvents(data) : []), [data]);
  const events = useMemo(() => {
    let out = allEvents;
    if (sourceFilter !== 'all') out = out.filter((e) => e.source === sourceFilter);
    if (categoryFilter !== 'all') out = out.filter((e) => e.category === categoryFilter);
    return out;
  }, [allEvents, sourceFilter, categoryFilter]);
  const statuses = data?.statuses ?? [];
  const indicators = data?.indicators ?? null;

  const lastFetched = useMemo(() => {
    const fetchedAt = data?.events?.[0]?.metadata?.fetchedAt;
    return typeof fetchedAt === 'string' ? new Date(fetchedAt) : null;
  }, [data?.events]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SharedHeader
        totalEvents={events.length}
        lastUpdate={lastFetched}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statuses={statuses}
        indicators={indicators}
      />
      <div className="flex-1 min-h-0 pt-12">
        {error && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[1001] px-4 py-2 bg-black/90 text-white text-xs rounded">
            Erreur de chargement
          </div>
        )}
        {isLoading && allEvents.length === 0 ? (
          <div className="flex h-full gap-4 p-6">
            <div className="flex-1" style={{ color: 'var(--lumiere-fg)' }}>
              <LoadingSkeleton lines={8} className="max-w-md" />
            </div>
            <div className="flex-1" style={{ color: 'var(--ombre-fg)' }}>
              <LoadingSkeleton lines={8} className="max-w-md" />
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: tabs */}
            <div className="md:hidden flex border-b" style={{ borderColor: 'var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setMobileTab('lumiere')}
                className="flex-1 py-3 text-[13px] font-medium"
                style={{
                  background: mobileTab === 'lumiere' ? 'var(--lumiere-bg)' : 'transparent',
                  color: mobileTab === 'lumiere' ? 'var(--lumiere-fg)' : 'var(--lumiere-muted)',
                  borderBottom: mobileTab === 'lumiere' ? '2px solid var(--lumiere-accent)' : '2px solid transparent',
                }}
              >
                Lumière
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('ombre')}
                className="flex-1 py-3 text-[13px] font-medium"
                style={{
                  background: mobileTab === 'ombre' ? 'var(--ombre-bg)' : 'transparent',
                  color: mobileTab === 'ombre' ? 'var(--ombre-fg)' : 'var(--ombre-muted)',
                  borderBottom: mobileTab === 'ombre' ? '2px solid var(--ombre-accent)' : '2px solid transparent',
                }}
              >
                Ombre
              </button>
            </div>
            {/* Mobile content */}
            <div className="md:hidden flex-1 min-h-0 overflow-hidden">
              {mobileTab === 'lumiere' && (
                <LumierePanel events={events} selectedId={selectedId} onSelectEvent={setSelectedId} viewMode={viewMode} />
              )}
              {mobileTab === 'ombre' && (
                <OmbrePanel events={events} selectedId={selectedId} onSelectEvent={setSelectedId} viewMode={viewMode} />
              )}
            </div>
            {/* Desktop: split layout */}
            <div className="hidden md:flex h-full">
              <SplitLayout
                left={
                  <LumierePanel
                    events={events}
                    selectedId={selectedId}
                    onSelectEvent={setSelectedId}
                    viewMode={viewMode}
                  />
                }
                right={
                  <OmbrePanel
                    events={events}
                    selectedId={selectedId}
                    onSelectEvent={setSelectedId}
                    viewMode={viewMode}
                  />
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
