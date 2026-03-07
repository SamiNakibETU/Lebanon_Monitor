'use client';

import type { ReactNode } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';

interface BentoDashboardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main bento grid container — 4 cols desktop, 2 tablet, 1 mobile.
 */
export function BentoDashboard({ children, className = '' }: BentoDashboardProps) {
  return (
    <div
      className={`
        grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[180px] gap-3 p-3 max-w-[1600px] mx-auto
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Preset layout slots for common widgets.
 */
export function BentoDashboardSlots({
  statsSlot,
  mapSlot,
  gaugeSlot,
  timelineSlot,
  cctvSlot,
  feedSlot,
}: {
  statsSlot?: ReactNode;
  mapSlot?: ReactNode;
  gaugeSlot?: ReactNode;
  timelineSlot?: ReactNode;
  cctvSlot?: ReactNode;
  feedSlot?: ReactNode;
}) {
  return (
    <BentoDashboard>
      {statsSlot && <BentoCard span="sm" label="EVENTS">{statsSlot}</BentoCard>}
      {mapSlot && <BentoCard span="xl" label="MAP">{mapSlot}</BentoCard>}
      {gaugeSlot && <BentoCard span="sm" label="OMBRE RATIO">{gaugeSlot}</BentoCard>}
      {timelineSlot && <BentoCard span="lg" label="TIMELINE">{timelineSlot}</BentoCard>}
      {cctvSlot && <BentoCard span="lg" label="LIVE">{cctvSlot}</BentoCard>}
      {feedSlot && <BentoCard span="full" label="EVENT FEED">{feedSlot}</BentoCard>}
    </BentoDashboard>
  );
}
