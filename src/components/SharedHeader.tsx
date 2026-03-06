'use client';

import { useState } from 'react';
import { SOURCE_LABELS } from '@/lib/labels';
import { SourceStatusCompact } from './SourceStatusCompact';
import { SourceStatusModal } from './SourceStatusModal';
import { FilterBar } from './FilterBar';
import type { SourceName } from '@/types/events';
import type { EventCategory } from '@/types/events';
import type { SourceStatus } from './SourceStatusGrid';

interface SharedHeaderProps {
  totalEvents: number;
  lastUpdate: Date | null;
  sourceFilter: SourceName | 'all';
  onSourceFilterChange: (s: SourceName | 'all') => void;
  categoryFilter: EventCategory | 'all';
  onCategoryFilterChange: (c: EventCategory | 'all') => void;
  viewMode: 'list' | 'clusters';
  onViewModeChange: (m: 'list' | 'clusters') => void;
  statuses: SourceStatus[];
  indicators?: { lbp: number | null; weatherBeirut: string | null; aqi: number | null } | null;
}

export function SharedHeader({
  totalEvents,
  lastUpdate,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
  statuses,
  indicators,
}: SharedHeaderProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const lbp = indicators?.lbp ?? null;
  const weatherBeirut = indicators?.weatherBeirut ?? null;
  const aqi = indicators?.aqi ?? null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[1000] flex flex-col backdrop-blur-md"
      style={{
        background: 'rgba(244, 244, 244, 0.85)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        color: 'var(--lumiere-fg)',
      }}
    >
      <div className="h-12 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-medium tracking-tight">Lebanon Monitor</span>
        <button
          type="button"
          onClick={() => setShowStatusModal(true)}
          className="focus:outline-none focus:ring-1 focus:ring-[var(--lumiere-accent)] rounded"
          title="Ouvrir le monitoring des sources"
        >
          <SourceStatusCompact statuses={statuses} />
        </button>
      </div>
      <div className="flex items-center gap-6 text-[11px] tabular-nums">
        {lbp != null && (
          <span className="uppercase tracking-wider text-[var(--lumiere-muted)]">
            LBP <span className="text-[var(--lumiere-fg)]">{lbp.toLocaleString('fr-FR')}</span>
          </span>
        )}
        {weatherBeirut && (
          <span className="uppercase tracking-wider text-[var(--lumiere-muted)]">
            Beyrouth <span className="text-[var(--lumiere-fg)]">{weatherBeirut}</span>
          </span>
        )}
        {aqi != null && (
          <span className="uppercase tracking-wider text-[var(--lumiere-muted)]">
            AQ <span className="text-[var(--lumiere-fg)]">{aqi}</span>
          </span>
        )}
        <span className="uppercase tracking-wider text-[var(--lumiere-muted)]">
          {totalEvents} événements
        </span>
        {lastUpdate && (
          <span className="text-[var(--lumiere-muted)]">
            {lastUpdate.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value as SourceName | 'all')}
          className="bg-white/80 border border-[var(--border-light)] rounded px-3 py-1.5 text-[11px] text-[var(--lumiere-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--lumiere-accent)]"
          style={{ maxWidth: 140 }}
        >
          <option value="all">Toutes sources</option>
          {(Object.keys(SOURCE_LABELS) as SourceName[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <FilterBar
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
      </div>
      {showStatusModal && (
        <SourceStatusModal statuses={statuses} onClose={() => setShowStatusModal(false)} />
      )}
    </header>
  );
}
