'use client';

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import type { LebanonEvent } from '@/types/events';

interface EventsOverTimeChartProps {
  events: LebanonEvent[];
  bucketHours?: number;
  gradientId?: string;
  strokeColor?: string;
  tickColor?: string;
}

function bucketByHour(events: LebanonEvent[], bucketHours: number): { time: string; count: number }[] {
  const numBuckets = 10;
  const bucketMs = bucketHours * 60 * 60 * 1000;
  const now = Date.now();
  const start = now - numBuckets * bucketMs;
  const buckets: number[] = Array(numBuckets).fill(0);

  events.forEach((e) => {
    const ts = e.timestamp.getTime();
    if (ts < start || ts > now) return;
    const idx = Math.min(Math.floor((ts - start) / bucketMs), numBuckets - 1);
    buckets[idx]++;
  });

  return buckets.map((count, i) => ({
    time: new Date(start + i * bucketMs).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    count,
  }));
}

export function EventsOverTimeChart({
  events,
  bucketHours = 6,
  gradientId = 'areaGrad',
  strokeColor = 'var(--neutre)',
  tickColor = 'var(--dark-muted)',
}: EventsOverTimeChartProps) {
  const data = bucketByHour(events, bucketHours);

  if (data.length === 0) return null;

  return (
    <div className="h-[72px] w-full shrink-0" style={{ minHeight: 72 }}>
      <ResponsiveContainer width="100%" height={72}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 8, fill: tickColor }}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={[0, 'auto']} />
          <Area
            type="monotone"
            dataKey="count"
            stroke={strokeColor}
            strokeWidth={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
