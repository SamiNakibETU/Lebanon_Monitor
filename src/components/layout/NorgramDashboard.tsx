'use client';

import type { ReactNode } from 'react';

/**
 * Norgram editorial layout — vertical rows with zones, NOT bento grid.
 * Background: #000. Zones: #0D0D0D. 1px gap = natural divider.
 */
export function NorgramDashboard({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full max-w-[1440px] mx-auto"
      style={{ background: '#000000', color: '#FFFFFF' }}
    >
      {children}
    </div>
  );
}

/** Stats strip — Row 1, 80px */
export function StatsStrip({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-baseline gap-16 px-6 pt-6 pb-4"
      style={{ minHeight: 80 }}
    >
      {children}
    </div>
  );
}

/** Single stat — no card, just value + label */
export function Stat({
  value,
  label,
  className = '',
}: {
  value: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="text-[48px] font-light leading-none tabular-nums"
        style={{ color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-[11px] uppercase tracking-[0.08em]"
        style={{ color: '#666666' }}
      >
        {label}
      </div>
    </div>
  );
}

/** Main content — Row 2: Map 60% + Feed 40%, 480px */
export function MainContentRow({
  mapSlot,
  feedSlot,
}: {
  mapSlot: ReactNode;
  feedSlot: ReactNode;
}) {
  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: '3fr 2fr',
        height: 480,
        background: '#000000',
      }}
    >
      <div style={{ background: '#0D0D0D', overflow: 'hidden' }}>{mapSlot}</div>
      <div style={{ background: '#0D0D0D', overflow: 'hidden' }}>{feedSlot}</div>
    </div>
  );
}

/** Charts strip — Row 3, 240px, 40/30/30 */
export function ChartsStrip({
  timelineSlot,
  categoriesSlot,
  liveSlot,
}: {
  timelineSlot: ReactNode;
  categoriesSlot: ReactNode;
  liveSlot: ReactNode;
}) {
  return (
    <div
      className="grid gap-px px-0"
      style={{
        gridTemplateColumns: '2fr 1.5fr 1.5fr',
        height: 240,
        background: '#000000',
      }}
    >
      <div style={{ background: '#0D0D0D', padding: '16px 24px', overflow: 'hidden' }}>
        {timelineSlot}
      </div>
      <div style={{ background: '#0D0D0D', padding: '16px 24px', overflow: 'hidden' }}>
        {categoriesSlot}
      </div>
      <div style={{ background: '#0D0D0D', padding: '16px 24px', overflow: 'hidden' }}>
        {liveSlot}
      </div>
    </div>
  );
}

/** Secondary strip — Row 4, 200px, 4 cols */
export function SecondaryStrip({
  lbpSlot,
  sourcesSlot,
  trendingSlot,
  aqiSlot,
}: {
  lbpSlot: ReactNode;
  sourcesSlot: ReactNode;
  trendingSlot: ReactNode;
  aqiSlot: ReactNode;
}) {
  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        height: 200,
        background: '#000000',
      }}
    >
      <div style={{ background: '#0D0D0D', padding: '24px 16px', overflow: 'hidden' }}>
        {lbpSlot}
      </div>
      <div style={{ background: '#0D0D0D', padding: '24px 16px', overflow: 'hidden' }}>
        {sourcesSlot}
      </div>
      <div style={{ background: '#0D0D0D', padding: '24px 16px', overflow: 'hidden' }}>
        {trendingSlot}
      </div>
      <div style={{ background: '#0D0D0D', padding: '24px 16px', overflow: 'hidden' }}>
        {aqiSlot}
      </div>
    </div>
  );
}
