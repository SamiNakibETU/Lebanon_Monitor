'use client';

import type { LebanonEvent } from '@/types/events';

interface LiveIndicatorsProps {
  events: LebanonEvent[];
  lastFetched?: Date | null;
}

function getLbpRate(events: LebanonEvent[]): number | null {
  const e = events.find((x) => x.source === 'lbp-rate');
  if (!e?.rawData || typeof (e.rawData as { rate?: number }).rate !== 'number') return null;
  return (e.rawData as { rate: number }).rate;
}

function getWeatherCities(events: LebanonEvent[]): number {
  return events.filter((e) => e.source === 'weather').length;
}

function getAqSummary(events: LebanonEvent[]): string | null {
  const aq = events.filter((e) => e.source === 'openaq');
  if (aq.length === 0) return null;
  const pmMatch = aq[0].title.match(/PM2\.5\s+([\d.]+)/);
  const val = pmMatch ? parseFloat(pmMatch[1]) : null;
  return val != null ? `${Math.round(val)} µg/m³` : `${aq.length} station${aq.length > 1 ? 's' : ''}`;
}

export function LiveIndicators({ events, lastFetched }: LiveIndicatorsProps) {
  const lbp = getLbpRate(events);
  const weatherCount = getWeatherCities(events);
  const aqSummary = getAqSummary(events);

  return (
    <div className="flex items-center gap-8 py-2 px-6 text-[11px]">
      {lbp != null && (
        <div>
          <span className="text-[var(--light-fg)]/50 uppercase tracking-wider">LBP/USD</span>
          <span className="ml-2 tabular-nums text-[var(--light-fg)]">
            {lbp.toLocaleString('fr-FR')}
          </span>
        </div>
      )}
      {weatherCount > 0 && (
        <div>
          <span className="text-[var(--light-fg)]/50 uppercase tracking-wider">Météo</span>
          <span className="ml-2 tabular-nums text-[var(--light-fg)]">{weatherCount} villes</span>
        </div>
      )}
      {aqSummary && (
        <div>
          <span className="text-[var(--light-fg)]/50 uppercase tracking-wider">AQ</span>
          <span className="ml-2 tabular-nums text-[var(--light-fg)]">{aqSummary}</span>
        </div>
      )}
      <div className="flex-1" />
      {lastFetched && (
        <div className="text-[var(--light-fg)]/40 tabular-nums">
          {lastFetched.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}
