'use client';

import { CATEGORY_LABELS } from '@/lib/labels';
import type { EventCategory } from '@/types/events';

interface FilterBarProps {
  categoryFilter: EventCategory | 'all';
  onCategoryFilterChange: (c: EventCategory | 'all') => void;
  viewMode: 'list' | 'clusters';
  onViewModeChange: (m: 'list' | 'clusters') => void;
}

export function FilterBar({
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  const categories = Object.keys(CATEGORY_LABELS) as EventCategory[];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as EventCategory | 'all')}
        className="bg-white/80 border border-[var(--border-light)] rounded px-2.5 py-1 text-[11px] text-[var(--lumiere-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--lumiere-accent)]"
        style={{ maxWidth: 160 }}
      >
        <option value="all">Toutes catégories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1 border border-[var(--border-light)] rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
            viewMode === 'list'
              ? 'bg-[var(--lumiere-accent)] text-white'
              : 'bg-white/60 text-[var(--lumiere-muted)] hover:text-[var(--lumiere-fg)]'
          }`}
        >
          Liste
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('clusters')}
          className={`px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
            viewMode === 'clusters'
              ? 'bg-[var(--lumiere-accent)] text-white'
              : 'bg-white/60 text-[var(--lumiere-muted)] hover:text-[var(--lumiere-fg)]'
          }`}
        >
          Clusters
        </button>
      </div>
    </div>
  );
}
