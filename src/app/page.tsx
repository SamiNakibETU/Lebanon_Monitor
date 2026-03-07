'use client';

import { useRef, useState, useEffect } from 'react';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { AlertToast } from '@/components/AlertToast';
import { BentoDashboard } from '@/components/layout/BentoDashboard';
import { BentoCard } from '@/components/ui/BentoCard';
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
  const color = c === 'ombre' ? 'var(--ombre)' : c === 'lumiere' ? 'var(--lumiere)' : 'var(--neutre)';
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: color }}
    />
  );
}

function EventCard({ e }: { e: V2Event }) {
  const time = new Date(e.occurredAt);
  const rel = time > new Date(Date.now() - 60 * 60 * 1000)
    ? `${Math.round((Date.now() - time.getTime()) / 60000)} min ago`
    : time.toLocaleDateString();

  return (
    <div
      className="flex gap-3 py-2 px-3 rounded-xl transition-colors hover:bg-white/[0.04]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <ClassificationDot c={e.classification} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-[11px] mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          <span className="uppercase">{e.classification}</span>
          <span>·</span>
          {e.source && <span className="uppercase">{e.source}</span>}
          <span>·</span>
          <span>{rel}</span>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {e.title}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Language>('fr');
  const [politicalFilter, setPoliticalFilter] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const lbpRef = useRef<HTMLDivElement>(null);

  const timelineSize = useContainerSize(timelineRef);
  const categorySize = useContainerSize(categoryRef);
  const sourceSize = useContainerSize(sourceRef);
  const gaugeSize = useContainerSize(gaugeRef);
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

  const events = eventsRes?.data ?? [];
  const total = eventsRes?.meta?.total ?? 0;

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
      <BentoDashboard>
        <BentoCard span="sm" label="EVENTS TODAY" value={String(stats?.eventsToday ?? total)} trend="up">
          <div className="text-3xl font-medium tabular-nums pt-1" style={{ color: 'var(--text-primary)' }}>
            {stats?.totalEvents ?? 0}
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
            total in DB
          </div>
        </BentoCard>
        <BentoCard span="xl" label="MAP">
          <MapWidget events={events} className="min-h-[300px]" />
        </BentoCard>
        <BentoCard span="sm" label="OMBRE RATIO">
          <div ref={gaugeRef} className="w-full h-full min-h-[100px]">
            <OmbreGauge
              width={gaugeSize.width}
              height={gaugeSize.height}
              ombreRatio={stats?.ombreRatio ?? 0}
            />
          </div>
        </BentoCard>
        <BentoCard span="lg" label="TIMELINE">
          <div ref={timelineRef} className="w-full h-full min-h-[120px]">
            <TimelineChart
              width={timelineSize.width}
              height={timelineSize.height}
              data={timelineData}
            />
          </div>
        </BentoCard>
        <BentoCard span="sm" label="SOURCES">
          <div ref={sourceRef} className="w-full h-full min-h-[100px]">
            <SourceDonut
              width={sourceSize.width}
              height={sourceSize.height}
              data={stats?.topSources ?? []}
              total={stats?.eventsToday ?? 0}
            />
          </div>
        </BentoCard>
        <BentoCard span="sm" label="CATEGORIES">
          <div ref={categoryRef} className="w-full h-full min-h-[100px]">
            <CategoryBars
              width={categorySize.width}
              height={categorySize.height}
              data={
                stats?.topCategories?.map((c) => ({
                  code: c.code,
                  count: c.count,
                  isOmbre: ['armed_conflict', 'economic_crisis', 'political_tension', 'violence'].includes(c.code),
                })) ?? []
              }
            />
          </div>
        </BentoCard>
        <BentoCard span="sm" label="LBP TREND">
          <div ref={lbpRef} className="w-full h-full min-h-[60px]">
            <LBPSparkline
              width={lbpSize.width}
              height={lbpSize.height}
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
        </BentoCard>
        <BentoCard span="sm" label="TRENDING">
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px]">
            {(clustersData?.clusters ?? []).slice(0, 8).map((c) => (
              <div
                key={c.code}
                className="flex justify-between items-center text-[11px] py-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>{getCategoryLabel(c.code)}</span>
                <span className="tabular-nums flex items-center gap-1">
                  {c.count}
                  {c.trend === 'up' && <span style={{ color: 'var(--ombre)' }}>↗</span>}
                  {c.trend === 'down' && <span style={{ color: 'var(--lumiere)' }}>↘</span>}
                </span>
              </div>
            ))}
            {(!clustersData?.clusters || clustersData.clusters.length === 0) && (
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Last 24h
              </span>
            )}
          </div>
        </BentoCard>
        <BentoCard span="lg" label="LIVE">
          <CCTVWidget />
        </BentoCard>
        <BentoCard span="full" label="EVENT FEED">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPoliticalFilter((p) => !p)}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors"
              style={{
                background: politicalFilter ? 'rgba(122,81,99,0.3)' : 'rgba(255,255,255,0.06)',
                color: politicalFilter ? 'var(--ombre)' : 'var(--text-secondary)',
              }}
            >
              Political
            </button>
            <a
              href={`/api/v2/export?format=csv&lang=${lang}${politicalFilter ? '&political=true' : ''}`}
              download
              className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors hover:bg-white/[0.08]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Export CSV
            </a>
          </div>
          <div className="h-[280px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>
                {eventsError
                  ? 'DB not configured. Set DATABASE_URL and run worker.'
                  : eventsRes
                    ? 'No events yet. Run: npm run worker'
                    : 'Loading…'}
              </div>
            ) : (
              events.map((e) => <EventCard key={e.id} e={e} />)
            )}
          </div>
        </BentoCard>
      </BentoDashboard>
      <footer className="py-3 px-4 text-center text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        GDELT · ACLED · USGS · NASA · ReliefWeb — Mis à jour il y a 2 min
      </footer>
    </div>
  );
}
