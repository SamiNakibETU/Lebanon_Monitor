'use client';

import type { ReactNode } from 'react';

export type PanelVariant = 'lumiere' | 'ombre';

interface PanelProps {
  variant: PanelVariant;
  children: ReactNode;
}

/**
 * V3 — Panel Lumière (crème) ou Ombre (noir).
 * Même structure interne : stats, carte, feed, charts.
 */
export function Panel({ variant, children }: PanelProps) {
  const isLumiere = variant === 'lumiere';
  return (
    <div
      className={`panel panel--${variant} flex-1 overflow-y-auto overflow-x-hidden transition-[flex] duration-500`}
      style={{
        flex: 1,
        background: isLumiere ? '#F5F2EE' : '#0A0A0A',
        color: isLumiere ? '#1A1A1A' : '#FFFFFF',
      }}
    >
      {children}
    </div>
  );
}
