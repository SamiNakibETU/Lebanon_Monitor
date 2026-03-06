'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Classification } from '@/types/events';

interface ClassificationDonutProps {
  counts: Record<Classification, number>;
  theme?: 'light' | 'dark';
}

const COLORS: Record<Classification, string> = {
  lumiere: 'var(--lumiere-accent)',
  ombre: 'var(--ombre-accent)',
  neutre: 'var(--neutre)',
};

export function ClassificationDonut({ counts, theme = 'dark' }: ClassificationDonutProps) {
  const data = [
    { name: 'Lumière', value: counts.lumiere, key: 'lumiere' as Classification },
    { name: 'Ombre', value: counts.ombre, key: 'ombre' as Classification },
    { name: 'Neutre', value: counts.neutre, key: 'neutre' as Classification },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div style={{ minHeight: 72, height: 72, minWidth: 72 }} className="w-full shrink-0">
      <ResponsiveContainer width="100%" height={72}>
        <PieChart margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={22}
            outerRadius={32}
            paddingAngle={1}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: theme === 'light' ? 'var(--lumiere-bg)' : 'var(--ombre-bg)',
              border: `1px solid ${theme === 'light' ? 'var(--border-light)' : 'var(--border-dark)'}`,
              borderRadius: 2,
              fontSize: 11,
            }}
            formatter={(v, n) => [v ?? 0, n ?? '']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
