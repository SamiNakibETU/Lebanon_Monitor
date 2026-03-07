'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  NorgramDashboard,
  StatsStrip,
  Stat,
  MainContentRow,
  ChartsStrip,
  SecondaryStrip,
} from '@/components/layout/NorgramDashboard';
import { TimelineChart, CategoryBars, SourceDonut, OmbreGauge, LBPSparkline } from '@/components/charts';
import { MapWidget } from '@/components/widgets/MapWidget';
import { CCTVWidget } from '@/components/widgets/CCTVWidget';
import { useContainerSize } from '@/hooks/useContainerSize';
import { CATEGORY_LABELS } from '@/lib/labels';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getCategoryLabel(code: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[code] ?? code.replace(/_/g, ' ');
}

type Language = 'fr' | 'en' | 'ar';

interface V2Event {
  id: string;
  title: string;
  summary?: string;
  classification: 'lumiere' | 'ombre' | 'neutre';
  confidence: number;
  category?: string;
  severity: string;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
}

interface V2Stats {
  totalEvents: number;
  eventsToday: number;
  ombreRatio: number;
}

interface V2Indicators {
  lbp: number | null;
  weatherBeirut: string | null;
  aqi: number | null;
  history?: {
    lbp?: Array<{ at: string; value?: number }>;
  };
}

interface V2StatsFull extends V2Stats {
  topCategories?: Array<{ code: string; count: number }>;
  topSources?: Array<{ name: string; count: number }>;
}

interface V2Cluster {
  code: string;
  count: number;
  prevCount: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

function ClassificationDot({ c }: { c: string }) {
  const color = c === 'ombre' ? '#E53935' : c === 'lumiere' ? '#43A047' : '#666666';
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: 6, height: 6, background: color }}
    />
  );
}

function EventCard({ e }: { e: V2Event }) {
  const time = new Date(e.occurredAt);
  const rel = time > new Date(Date.now() - 60 * 60 * 1000)
    ? `${Math.round((Date.now() - time.getTime()) / 60000)} min ago`
    : time.toLocaleDateString();
  const categoryLabel = e.category ? getCategoryLabel(e.category) : e.classification;

  return (
    <a
      href={`/event/${e.id}`}
      className="flex gap-3 py-4 px-6 transition-colors cursor-pointer block no-underline"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(ev) => { ev.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
      onMouseLeave={(ev) => { ev.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <ClassificationDot c={e.classification} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] mb-1.5 uppercase tracking-[0.04em]" style={{ color: '#666666' }}>
          <span>{categoryLabel}</span>
          <span>·</span>
          {e.source && <span>{e.source}</span>}
          <span className="ml-auto" suppressHydrationWarning>{rel}</span>
        </div>
        <div className="text-[14px] font-normal leading-snug" style={{ color: '#FFFFFF' }}>
          {e.title}
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>('fr');
  const [politicalFilter, setPoliticalFilter] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const lbpRef = useRef<HTMLDivElement>(null);

  const timelineSize = useContainerSize(timelineRef);
  const categorySize = useContainerSize(categoryRef);
  const sourceSize = useContainerSize(sourceRef);
  const lbpSize = useContainerSize(lbpRef);

  const eventsUrl = `/api/v2/events?lang=${lang}${politicalFilter ? '&political=true' : ''}`;
  const { data: eventsRes, error: eventsError } = useSWR<{ data: V2Event[]; meta: { total: number } }>(
    eventsUrl,
    fetcher,
    { refreshInterval: 30_000 }
  );
  const { data: clustersData } = useSWR<{ clusters: V2Cluster[] }>('/api/v2/clusters', fetcher, { refreshInterval: 60_000 });
  const { data: stats } = useSWR<V2StatsFull>('/api/v2/stats', fetcher, { refreshInterval: 60_000 });
  const { data: indicators } = useSWR<V2Indicators>('/api/v2/indicators', fetcher, { refreshInterval: 60_000 });
  const { data: timelineData } = useSWR<Array<{ hour: string; count: number; ombre: number; lumiere: number }>>(
    '/api/v2/timeline',
    fetcher,
    { refreshInterval: 60_000 }
  );

  const events = Array.isArray(eventsRes?.data) ? eventsRes.data : [];
  const total = eventsRes?.meta?.total ?? 0;
  const timelineArray = Array.isArray(timelineData) ? timelineData : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header
        lang={lang}
        onLangChange={setLang}
        lbp={indicators?.lbp}
        weatherBeirut={indicators?.weatherBeirut}
        aqi={indicators?.aqi}
        eventCount={stats?.eventsToday ?? total}
      />
      <NorgramDashboard>
        <StatsStrip>
          <Stat value={stats?.eventsToday ?? total} label="events today" />
          <Stat value={`${stats?.ombreRatio ?? 0}%`} label="ombre" />
          <Stat value={(stats?.topSources ?? []).length || 12} label="sources" />
          <div className="flex-1" />
          <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
            GDELT · ACLED · USGS · NASA · ReliefWeb — MAJ il y a 2 min
          </div>
        </StatsStrip>
        <MainContentRow
          mapSlot={<MapWidget events={events} className="h-full w-full" />}
          feedSlot={
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between gap-2 px-6 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <button
                  type="button"
                  onClick={() => setPoliticalFilter((p) => !p)}
                  className="text-[11px] transition-colors duration-150"
                  style={{
                    color: politicalFilter ? '#FFFFFF' : '#666666',
                  }}
                >
                  Political
                </button>
                <a
                  href={`/api/v2/export?format=csv&lang=${lang}${politicalFilter ? '&political=true' : ''}`}
                  download
                  className="text-[11px] transition-colors duration-150 hover:text-[#FFFFFF]"
                  style={{ color: '#666666' }}
                >
                  Export CSV
                </a>
              </div>
              <div className="flex-1 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="flex items-center justify-center h-full px-6" style={{ color: '#666666' }} suppressHydrationWarning>
                    {eventsError
                      ? 'DB not configured. Set DATABASE_URL and run worker.'
                      : eventsRes
                        ? 'No events yet. Run: npm run worker'
                        : '—'}
                  </div>
                ) : (
                  events.map((e) => <EventCard key={e.id} e={e} />)
                )}
              </div>
            </div>
          }
        />
        <ChartsStrip
          timelineSlot={
            <div ref={timelineRef} className="w-full h-full min-h-[160px]">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                Timeline
              </div>
              <TimelineChart
                width={timelineSize.width}
                height={Math.max(120, timelineSize.height - 24)}
                data={timelineArray}
              />
            </div>
          }
          categoriesSlot={
            <div ref={categoryRef} className="w-full h-full min-h-[160px]">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                Categories
              </div>
              <CategoryBars
                width={categorySize.width}
                height={Math.max(100, categorySize.height - 24)}
                data={
                  (Array.isArray(stats?.topCategories) ? stats.topCategories : []).map((c) => ({
                    code: c.code,
                    count: c.count,
                    isOmbre: ['armed_conflict', 'economic_crisis', 'political_tension', 'violence'].includes(c.code),
                  }))
                }
              />
            </div>
          }
          liveSlot={
            <div className="w-full h-full min-h-[160px]">
              <CCTVWidget />
            </div>
          }
        />
        <SecondaryStrip
          lbpSlot={
            <div ref={lbpRef} className="w-full h-full min-h-[120px]">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                LBP trend
              </div>
              <LBPSparkline
                width={lbpSize.width}
                height={Math.max(60, lbpSize.height - 24)}
                data={
                  indicators?.history?.lbp
                    ?.filter((d) => d.value != null)
                    .map((d) => ({ at: new Date(d.at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }), value: d.value ?? 0 }))
                    .slice(-14) ?? []
                }
                current={indicators?.lbp ?? 0}
                trend="stable"
              />
            </div>
          }
          sourcesSlot={
            <div ref={sourceRef} className="w-full h-full min-h-[120px]">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                Sources
              </div>
              <SourceDonut
                width={sourceSize.width}
                height={Math.max(80, sourceSize.height - 24)}
                data={stats?.topSources ?? []}
                total={stats?.eventsToday ?? 0}
              />
            </div>
          }
          trendingSlot={
            <div className="w-full h-full overflow-y-auto">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                Trending
              </div>
              {(Array.isArray(clustersData?.clusters) ? clustersData.clusters : []).slice(0, 5).map((c) => (
                <div
                  key={c.code}
                  className="flex justify-between items-center text-[11px] py-0.5"
                  style={{ color: '#666666' }}
                >
                  <span>{getCategoryLabel(c.code)}</span>
                  <span className="tabular-nums flex items-center gap-1">
                    {c.count}
                    {c.trend === 'up' && <span style={{ color: '#E53935' }}>↗</span>}
                    {c.trend === 'down' && <span style={{ color: '#43A047' }}>↘</span>}
                  </span>
                </div>
              ))}
              {(!clustersData?.clusters || clustersData.clusters.length === 0) && (
                <span className="text-[11px]" style={{ color: '#666666' }}>
                  —
                </span>
              )}
            </div>
          }
          aqiSlot={
            <div className="w-full h-full">
              <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                Air quality
              </div>
              <div className="text-[48px] font-light leading-none tabular-nums" style={{ color: '#FFFFFF' }} suppressHydrationWarning>
                {indicators?.aqi ?? '—'}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#666666' }}>
                AQI Beyrouth
              </div>
            </div>
          }
        />
      </NorgramDashboard>
      <footer className="py-3 px-4 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        GDELT · ACLED · USGS · NASA · ReliefWeb — Mis à jour il y a 2 min
      </footer>
    </div>
  );
}
