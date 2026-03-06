'use client';

import { SOURCE_LABELS } from '@/lib/labels';
import type { SourceName } from '@/types/events';
import type { SourceStatus } from './SourceStatusGrid';

interface SourceStatusModalProps {
  statuses: SourceStatus[];
  onClose: () => void;
}

function statusLabel(s: SourceStatus['status']): string {
  if (s === 'ok') return 'OK';
  if (s === 'skipped') return 'Ignoré';
  if (s === 'no-data') return 'Sans données';
  if (s === 'rate-limited') return 'Limite atteinte';
  return 'Erreur';
}

export function SourceStatusModal({ statuses, onClose }: SourceStatusModalProps) {
  const bySource = Object.fromEntries((statuses ?? []).map((s) => [s.source, s]));

  const sources: SourceName[] = [
    'gdelt',
    'usgs',
    'firms',
    'rss',
    'gdacs',
    'reliefweb',
    'weather',
    'cloudflare',
    'lbp-rate',
    'openaq',
    'twitter',
  ];

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Monitoring des sources"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <h2 className="text-sm font-semibold text-[var(--lumiere-fg)]">
            État des sources
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--lumiere-muted)] hover:text-[var(--lumiere-fg)] text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[var(--lumiere-muted)] uppercase tracking-wider border-b border-[var(--border-light)]">
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4 text-right">Événements</th>
                <th className="py-2 pr-4 text-right">Temps</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((key) => {
                const s = bySource[key] ?? {
                  source: key,
                  status: 'skipped' as const,
                  eventCount: 0,
                };
                const isOk = s.status === 'ok';
                return (
                  <tr
                    key={key}
                    className="border-b border-[var(--border-light)] last:border-0"
                  >
                    <td className="py-2 pr-4 font-medium text-[var(--lumiere-fg)]">
                      {SOURCE_LABELS[key]}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        style={{
                          color: isOk ? '#3d6b4a' : s.status === 'skipped' || s.status === 'no-data' ? '#737373' : '#c45c5c',
                        }}
                      >
                        {statusLabel(s.status)}
                        {s.cached && ' (cache)'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--lumiere-muted)]">
                      {s.eventCount}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[var(--lumiere-muted)]">
                      {s.responseTimeMs != null ? `${s.responseTimeMs} ms` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
            <p className="text-[10px] text-[var(--lumiere-muted)]">
              Rafraîchissement automatique toutes les 60 secondes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
