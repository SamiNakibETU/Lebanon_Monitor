'use client';

import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import type { LebanonEvent } from '@/types/events';

interface TimelineChartProps {
  events: LebanonEvent[];
  bucketHours?: number;
  accentColor?: string;
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
    label: new Date(start + i * bucketMs).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    }),
    count,
  }));
}

export function TimelineChart({
  events,
  bucketHours = 6,
  accentColor,
  theme,
}: TimelineChartProps) {
  const data = bucketEvents7Days(events, bucketHours);
  const fill = accentColor ?? (theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)');
  const tickColor = theme === 'light' ? 'var(--lumiere-muted)' : 'var(--ombre-muted)';

  const chartData = data.length > 0 ? data : Array.from({ length: 7 }, (_, i) => ({
    label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    count: 0,
  }));

  const gradId = `timeline-grad-${theme}`;

  return (
    <div style={{ minHeight: 180, minWidth: 200 }}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fill} stopOpacity={0.15} />
              <stop offset="100%" stopColor={fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: tickColor }}
            interval="preserveStartEnd"
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={fill}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
