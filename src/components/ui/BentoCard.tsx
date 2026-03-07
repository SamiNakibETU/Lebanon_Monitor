'use client';

import type { ReactNode } from 'react';

export type BentoSpan = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: BentoSpan;
  label?: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  interactive?: boolean;
}

const SPAN_CLASSES: Record<BentoSpan, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-1 row-span-2',
  lg: 'col-span-2 row-span-1',
  xl: 'col-span-2 row-span-2',
  full: 'col-span-4 row-span-1',
};

export function BentoCard({
  children,
  className = '',
  span = 'sm',
  label,
  value,
  trend,
  interactive = true,
}: BentoCardProps) {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div
      className={`
        bg-[var(--bg-card)] border border-white/[0.06] rounded-2xl p-5 overflow-hidden relative
        transition-all duration-300 ease-out
        ${interactive ? 'hover:border-white/[0.12] hover:bg-[var(--bg-card-hover)]' : ''}
        ${SPAN_CLASSES[span]}
        ${className}
      `}
    >
      {(label || value || trend) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          {label && (
            <span
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </span>
          )}
          {(value || trend) && (
            <span className="flex items-center gap-1.5 text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }} suppressHydrationWarning>
              {value}
              {trend && <span>{trendIcon}</span>}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
