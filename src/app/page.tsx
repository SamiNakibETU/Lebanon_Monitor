'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import { Header } from '@/components/layout/Header';
import { SplitContainer, type SplitMode } from '@/components/layout/SplitContainer';
import { Panel } from '@/components/layout/Panel';
import { MapWidget } from '@/components/widgets/MapWidget';
import { CCTVWidget } from '@/components/widgets/CCTVWidget';
import { PolymarketWidget } from '@/components/widgets/PolymarketWidget';
import { TimelineChart, CategoryBars, LBPSparkline } from '@/components/charts';
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
  confidence?: number | null;
  category?: string;
  severity: string;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  source?: string | null;
  sourceTier?: 'T1' | 'T2' | 'T3' | null;
  sourceCount?: number;
}

interface V2Stats {
  totalEvents: number;
  eventsToday: number;
  ombreRatio: number;
  topCategories?: Array<{ code: string; count: number }>;
  topSources?: Array<{ name: string; count: number }>;
}

interface V2Indicators {
  lbp: number | null;
  weatherBeirut: string | null;
  aqi: number | null;
  history?: { lbp?: Array<{ at: string; value?: number }> };
}

interface V2Cluster {
  code: string;
  count: number;
  prevCount: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

function EventCard({
  e,
  variant,
  lang,
}: {
  e: V2Event;
  variant: 'lumiere' | 'ombre';
  lang: Language;
}) {
  const time = new Date(e.occurredAt);
  const rel =
    time > new Date(Date.now() - 60 * 60 * 1000)
      ? `${Math.round((Date.now() - time.getTime()) / 60000)} min ago`
      : time.toLocaleDateString();
  const categoryLabel = e.category ? getCategoryLabel(e.category) : e.classification;
  const isLumiere = variant === 'lumiere';

  const dotColor = isLumiere ? '#2E7D32' : '#C62828';
  const metaColor = isLumiere ? '#888888' : '#666666';
  const textColor = isLumiere ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isLumiere ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const hoverBg = isLumiere ? '#FAFAFA' : 'rgba(255,255,255,0.02)';

  return (
    <a
      href={`/event/${e.id}?lang=${lang}`}
      className="flex gap-3 py-4 px-6 transition-colors cursor-pointer block no-underline"
      style={{ borderBottom: `1px solid ${borderColor}` }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span
        className="inline-block shrink-0 rounded-full"
        style={{ width: 6, height: 6, background: dotColor }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-2 flex-wrap text-[11px] mb-1.5 uppercase tracking-[0.08em]"
          style={{ color: metaColor }}
        >
          <span>{categoryLabel}</span>
          <span>·</span>
          {e.source && (
            <span className="flex items-center gap-1">
              {e.source}
              {e.sourceTier && (
                <span
                  className="inline-flex items-center px-1 rounded"
                  style={{
                    fontSize: 9,
                    background: isLumiere ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                    color: metaColor,
                  }}
                  title={e.sourceTier === 'T1' ? 'Source fiable' : e.sourceTier === 'T2' ? 'Source moyenne' : 'Source faible'}
                >
                  {e.sourceTier}
                </span>
              )}
            </span>
          )}
          {e.confidence != null && e.confidence >= 0 && (
            <span
              className="tabular-nums"
              style={{ opacity: 0.85 }}
              title="Confiance classification"
            >
              {Math.round(e.confidence * 100)}%
            </span>
          )}
          {e.sourceCount != null && e.sourceCount > 1 && (
            <span
              className="tabular-nums"
              style={{ opacity: 0.9 }}
              title="Confirmé par plusieurs sources"
            >
              {e.sourceCount} sources
            </span>
          )}
          <span className="ml-auto" suppressHydrationWarning>
            {rel}
          </span>
        </div>
        <div className="text-[14px] font-normal leading-snug" style={{ color: textColor }}>
          {e.title}
        </div>
      </div>
    </a>
  );
}

function PanelEventFeed({
  events,
  variant,
  eventsError,
  isLoading,
  lang,
}: {
  events: V2Event[];
  variant: 'lumiere' | 'ombre';
  eventsError: unknown;
  isLoading: boolean;
  lang: Language;
}) {
  const label = variant === 'lumiere' ? 'Lumière' : 'Ombre';
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between gap-2 px-6 py-2"
        style={{
          borderBottom:
            variant === 'lumiere' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <span
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: variant === 'lumiere' ? '#888888' : '#666666' }}
        >
          {label}
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto event-feed"
        style={{
          scrollbarWidth: 'thin',
        }}
      >
        {isLoading ? (
          <div
            className="flex items-center justify-center h-full px-6"
            style={{ color: variant === 'lumiere' ? '#888888' : '#666666' }}
          >
            —
          </div>
        ) : events.length === 0 ? (
          <div
            className="flex items-center justify-center h-full px-6"
            style={{ color: variant === 'lumiere' ? '#888888' : '#666666' }}
            suppressHydrationWarning
          >
            {eventsError
              ? 'DB not configured.'
              : 'No events yet.'}
          </div>
        ) : (
          events.map((e) => <EventCard key={e.id} e={e} variant={variant} lang={lang} />)
        )}
      </div>
    </div>
  );
}

const LANG_STORAGE_KEY = 'lebanon-monitor-lang';

export default function Home() {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'fr' || stored === 'en' || stored === 'ar') return stored;
    }
    return 'fr';
  });
  const [splitMode, setSplitMode] = useState<SplitMode>('split');

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem(LANG_STORAGE_KEY, l);
  };

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineOmbreRef = useRef<HTMLDivElement>(null);
  const categoryLumiereRef = useRef<HTMLDivElement>(null);
  const categoryOmbreRef = useRef<HTMLDivElement>(null);

  const timelineSize = useContainerSize(timelineRef);
  const timelineOmbreSize = useContainerSize(timelineOmbreRef);
  const categoryLumiereSize = useContainerSize(categoryLumiereRef);
  const categoryOmbreSize = useContainerSize(categoryOmbreRef);

  const eventsLumiereUrl = `/api/v2/events?lang=${lang}&classification=lumiere&limit=50`;
  const eventsOmbreUrl = `/api/v2/events?lang=${lang}&classification=ombre&limit=50`;

  const { data: lumiereRes, error: lumiereError } = useSWR<{ data: V2Event[]; meta: { total: number } }>(
    eventsLumiereUrl,
    fetcher,
    { refreshInterval: 30_000 }
  );
  const { data: ombreRes, error: ombreError } = useSWR<{ data: V2Event[]; meta: { total: number } }>(
    eventsOmbreUrl,
    fetcher,
    { refreshInterval: 30_000 }
  );

  const { data: stats } = useSWR<V2Stats>('/api/v2/stats', fetcher, { refreshInterval: 60_000 });
  const { data: indicators } = useSWR<V2Indicators>('/api/v2/indicators', fetcher, {
    refreshInterval: 60_000,
  });
  const { data: clustersData } = useSWR<{ clusters: V2Cluster[] }>('/api/v2/clusters', fetcher, {
    refreshInterval: 60_000,
  });
  const { data: timelineData } = useSWR<
    Array<{ hour: string; count: number; ombre: number; lumiere: number }>
  >('/api/v2/timeline', fetcher, { refreshInterval: 60_000 });

  const lumiereEvents = Array.isArray(lumiereRes?.data) ? lumiereRes.data : [];
  const ombreEvents = Array.isArray(ombreRes?.data) ? ombreRes.data : [];
  const timelineArray = Array.isArray(timelineData) ? timelineData : [];

  const lumiereCategories = (stats?.topCategories ?? []).filter((c) =>
    ['institutional_progress', 'neutral', 'culture', 'reconstruction', 'diplomacy'].some(
      (p) => c.code.startsWith(p) || c.code === p
    )
  );
  const ombreCategories = (stats?.topCategories ?? []).filter((c) =>
    ['armed_conflict', 'political_tension', 'violence', 'economic_crisis', 'displacement'].some(
      (p) => c.code.startsWith(p) || c.code === p
    )
  );

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      <Header
        lang={lang}
        onLangChange={setLang}
        lbp={indicators?.lbp}
        weatherBeirut={indicators?.weatherBeirut}
        aqi={indicators?.aqi}
        eventCount={(lumiereRes?.meta?.total ?? 0) + (ombreRes?.meta?.total ?? 0)}
        splitMode={splitMode}
        onSplitModeChange={setSplitMode}
      />
      <SplitContainer mode={splitMode}>
        <Panel variant="lumiere">
          <div className="flex flex-col h-full">
            <div
              className="flex items-baseline gap-8 px-6 pt-4 pb-2"
              style={{ minHeight: 60, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div>
                <div
                  className="text-[48px] font-light leading-none tabular-nums"
                  style={{ color: '#1A1A1A' }}
                >
                  {lumiereRes?.meta?.total ?? 0}
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#888888' }}>
                  Lumière
                </div>
              </div>
            </div>
            <div className="grid gap-px flex-1" style={{ gridTemplateRows: '40% 1fr' }}>
              <div className="overflow-hidden">
                <MapWidget events={lumiereEvents} variant="lumiere" className="h-full w-full" />
              </div>
              <div className="overflow-hidden">
                <PanelEventFeed
                  events={lumiereEvents}
                  variant="lumiere"
                  eventsError={lumiereError}
                  isLoading={!lumiereRes && !lumiereError}
                  lang={lang}
                />
              </div>
            </div>
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr',
                minHeight: 280,
                height: 'clamp(240px, 20vh, 320px)',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div className="p-4 overflow-hidden">
                <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
                  Timeline
                </div>
                <div ref={timelineRef} className="w-full h-full min-h-[100px]">
                  <TimelineChart
                    width={timelineSize.width}
                    height={Math.max(80, timelineSize.height - 24)}
                    data={timelineArray}
                  />
                </div>
              </div>
              <div className="p-4 overflow-hidden">
                <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#888888' }}>
                  Catégories
                </div>
                <div ref={categoryLumiereRef} className="w-full h-full min-h-[80px]">
                  <CategoryBars
                    width={categoryLumiereSize.width}
                    height={Math.max(60, categoryLumiereSize.height - 24)}
                    data={lumiereCategories.map((c) => ({
                      code: c.code,
                      count: c.count,
                      isOmbre: false,
                    }))}
                  />
                </div>
              </div>
              <div className="p-4 overflow-hidden">
                <CCTVWidget />
              </div>
            </div>
          </div>
        </Panel>
        <div
          className="split-divider"
          style={{
            width: 1,
            background: 'rgba(128,128,128,0.2)',
            flexShrink: 0,
          }}
        />
        <Panel variant="ombre">
          <div className="flex flex-col h-full">
            <div
              className="flex items-baseline gap-8 px-6 pt-4 pb-2"
              style={{ minHeight: 60, borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div>
                <div
                  className="text-[48px] font-light leading-none tabular-nums"
                  style={{ color: '#FFFFFF' }}
                >
                  {ombreRes?.meta?.total ?? 0}
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                  Ombre
                </div>
              </div>
            </div>
            <div className="grid gap-px flex-1" style={{ gridTemplateRows: '40% 1fr' }}>
              <div className="overflow-hidden">
                <MapWidget events={ombreEvents} variant="ombre" className="h-full w-full" />
              </div>
              <div className="overflow-hidden">
                <PanelEventFeed
                  events={ombreEvents}
                  variant="ombre"
                  eventsError={ombreError}
                  isLoading={!ombreRes && !ombreError}
                  lang={lang}
                />
              </div>
            </div>
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr',
                minHeight: 280,
                height: 'clamp(240px, 20vh, 320px)',
                borderTop: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="p-4 overflow-hidden">
                <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                  Timeline
                </div>
                <div ref={timelineOmbreRef} className="w-full h-full min-h-[100px]">
                  <TimelineChart
                    width={timelineOmbreSize.width}
                    height={Math.max(80, timelineOmbreSize.height - 24)}
                    data={timelineArray}
                  />
                </div>
              </div>
              <div className="p-4 overflow-hidden">
                <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
                  Catégories
                </div>
                <div ref={categoryOmbreRef} className="w-full h-full min-h-[80px]">
                  <CategoryBars
                    width={categoryOmbreSize.width}
                    height={Math.max(60, categoryOmbreSize.height - 24)}
                    data={ombreCategories.map((c) => ({
                      code: c.code,
                      count: c.count,
                      isOmbre: true,
                    }))}
                  />
                </div>
              </div>
              <div className="p-4 overflow-hidden">
                <PolymarketWidget />
              </div>
            </div>
          </div>
        </Panel>
      </SplitContainer>
    </div>
  );
}
