'use client';

import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/lib/labels';
import type { SourceName } from '@/types/events';
import type { LebanonEvent, EventCategory } from '@/types/events';

interface AnalyticsStripProps {
  events: LebanonEvent[];
  theme: 'light' | 'dark';
}

function bucketEvents7Days(events: LebanonEvent[], bucketHours: number): { label: string; count: number }[] {
  const bucketMs = bucketHours * 60 * 60 * 1000;
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const start = now - sevenDaysMs;
  const numBuckets = Math.ceil(sevenDaysMs / bucketMs);
  const buckets: number[] = Array(numBuckets).fill(0);
  events.forEach((e) => {
    const ts = e.timestamp.getTime();
    if (ts < start || ts > now) return;
    const idx = Math.min(Math.floor((ts - start) / bucketMs), numBuckets - 1);
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  });
  return buckets.map((count, i) => ({
    label: new Date(start + i * bucketMs).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    count,
  }));
}

function topCategory(events: LebanonEvent[]): EventCategory | null {
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
  return (entries[0]?.[0] as EventCategory) ?? null;
}

function sourceCounts(events: LebanonEvent[]): { source: string; count: number }[] {
  const m = new Map<string, number>();
  events.forEach((e) => m.set(e.source, (m.get(e.source) ?? 0) + 1));
  return Array.from(m.entries()).map(([source, count]) => ({ source, count }));
}

export function AnalyticsStrip({ events, theme }: AnalyticsStripProps) {
  const total = events.length;
  const sourcesActive = new Set(events.map((e) => e.source)).size;
  const top = topCategory(events);
  const sourceData = sourceCounts(events).sort((a, b) => b.count - a.count).slice(0, 5);
  const timelineData = bucketEvents7Days(events, 6);

  const muted = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';
  const fill = theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)';
  const gradId = `analytics-grad-${theme}`;

  const chartData = timelineData.length > 0 ? timelineData : Array.from({ length: 7 }, (_, i) => ({
    label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    count: 0,
  }));

  return (
    <div
      className="flex flex-col gap-4"
      style={{
        padding: '14px 16px',
        borderRadius: 6,
        background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
        border: theme === 'light' ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Row 1: Stats + Sparkline */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-baseline gap-4">
          <div>
            <span className="text-2xl font-semibold tabular-nums" style={{ color: fill }}>{total}</span>
            <span className="text-[10px] uppercase tracking-widest ml-1.5" style={{ color: muted }}>événements</span>
          </div>
          <div className="w-px h-6" style={{ background: muted, opacity: 0.4 }} />
          <div>
            <span className="text-lg font-medium tabular-nums">{sourcesActive}</span>
            <span className="text-[10px] uppercase tracking-widest ml-1" style={{ color: muted }}>sources</span>
          </div>
          {top && (
            <>
              <div className="w-px h-6" style={{ background: muted, opacity: 0.4 }} />
              <div>
                <span className="text-sm font-medium">{CATEGORY_LABELS[top]}</span>
                <span className="text-[10px] uppercase tracking-widest ml-1" style={{ color: muted }}>top</span>
              </div>
            </>
          )}
        </div>
        <div className="flex-1 min-w-[180px]" style={{ maxWidth: 320, height: 52 }}>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fill} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <Area type="monotone" dataKey="count" stroke={fill} strokeWidth={1} fill={`url(#${gradId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Row 2: Mini source bars */}
      {sourceData.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest" style={{ color: muted }}>Par source</span>
          <div className="flex gap-2 flex-wrap">
            {sourceData.map(({ source, count }) => {
              const max = Math.max(...sourceData.map((s) => s.count), 1);
              const w = Math.max(20, (count / max) * 72);
              const label = SOURCE_LABELS[source as SourceName] ?? source;
              return (
                <div key={source} className="flex items-center gap-2" title={`${label}: ${count}`}>
                  <div
                    style={{
                      width: w,
                      height: 5,
                      borderRadius: 2,
                      background: fill,
                      opacity: 0.5,
                    }}
                  />
                  <span className="text-[10px] tabular-nums w-5" style={{ color: muted }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
