'use client';

import { useState } from 'react';
import { CATEGORY_LABELS, SOURCE_LABELS } from '@/lib/labels';
import { relativeTime } from '@/lib/utils/relativeTime';
import type { LebanonEvent } from '@/types/events';

interface EventListProps {
  events: LebanonEvent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  theme?: 'light' | 'dark';
}

function classificationDot(c: LebanonEvent['classification']) {
  const color = c === 'lumiere' ? '#3d6b4a' : c === 'ombre' ? '#7a5163' : '#5c5c5c';
  return <span className="rounded-full shrink-0" style={{ width: 6, height: 6, background: color }} />;
}

const THEME_VARS = {
  light: {
    fg: 'var(--lumiere-fg)',
    muted: 'var(--lumiere-muted)',
    border: 'var(--border-light)',
    hover: 'rgba(0,0,0,0.04)',
    selected: 'rgba(0,0,0,0.06)',
  },
  dark: {
    fg: 'var(--ombre-fg)',
    muted: 'var(--ombre-muted)',
    border: 'var(--border-dark)',
    hover: 'rgba(255,255,255,0.05)',
    selected: 'rgba(255,255,255,0.08)',
  },
};

export function EventList({ events, selectedId, onSelect, theme = 'dark' }: EventListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const vars = THEME_VARS[theme];
  const accentColor = theme === 'light' ? 'var(--lumiere-accent)' : 'var(--ombre-accent)';

  return (
    <div className="flex flex-col overflow-y-auto">
      {events.slice(0, 50).map((e) => {
        const isSelected = selectedId === e.id;
        const isExpanded = expandedId === e.id;
        return (
          <div
            key={e.id}
            className="border-b transition-all duration-200"
            style={{
              borderColor: vars.border,
              background: isSelected ? vars.selected : undefined,
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(isSelected ? null : e.id)}
              className="flex gap-3 text-left w-full py-2.5 px-4 transition-colors duration-200"
              style={{ color: vars.fg } as React.CSSProperties}
              onMouseEnter={(ev) => {
                if (!isSelected) ev.currentTarget.style.background = vars.hover;
              }}
              onMouseLeave={(ev) => {
                if (!isSelected) ev.currentTarget.style.background = '';
              }}
            >
              <div className="pt-1.5 shrink-0">{classificationDot(e.classification)}</div>
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center gap-2 flex-wrap gap-y-0"
                  style={{ color: vars.muted }}
                >
                  <span className="text-[10px] uppercase tracking-wider">
                    {SOURCE_LABELS[e.source]}
                  </span>
                  <span className="text-[10px]">{CATEGORY_LABELS[e.category]}</span>
                  <span className="text-[10px] tabular-nums">{relativeTime(e.timestamp)}</span>
                </div>
                <div
                  className="text-[13px] leading-snug mt-0.5 line-clamp-2"
                  style={{ color: vars.fg } as React.CSSProperties}
                >
                  {e.title}
                </div>
              </div>
            </button>
            {e.description || e.url ? (
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  setExpandedId(isExpanded ? null : e.id);
                }}
                className="ml-4 mb-2 text-[10px] uppercase tracking-wider flex items-center gap-1"
                style={{ color: vars.muted } as React.CSSProperties}
                onMouseEnter={(ev) => { ev.currentTarget.style.color = vars.fg; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.color = vars.muted; }}
              >
                {isExpanded ? '− Réduire' : '▸ Détails'}
              </button>
            ) : null}
            {isExpanded && (
              <div
                className="px-4 pb-3 pt-0 -mt-2"
                style={{ borderTop: `1px solid ${vars.border}` }}
                onMouseDown={(ev) => ev.stopPropagation()}
              >
                {e.description && (
                  <p className="text-[12px] leading-relaxed mt-2" style={{ color: vars.muted }}>
                    {e.description}
                  </p>
                )}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[11px] hover:underline uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    Ouvrir la source →
                  </a>
                )}
                <span
                  className="inline-block mt-2 px-1.5 py-0.5 text-[9px] uppercase tabular-nums rounded-sm"
                  style={{ background: vars.hover, color: vars.muted }}
                >
                  {(e.confidence * 100).toFixed(0)}% confiance
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
