'use client';

import { EvidenceSummary } from '@/components/shared/EvidenceSummary';

export interface ActorSummaryProps {
  label: string;
  entityType: string | null;
  roles: string[];
  eventCount: number;
  episodeCount: number;
  claimCount: number;
  contradictionCount: number;
  sourceDiversity: number;
  variant?: 'light' | 'dark';
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: 'Personne',
  organization: 'Organisation',
  place: 'Lieu',
};

export function ActorSummary({
  label,
  entityType,
  roles,
  eventCount,
  episodeCount,
  claimCount,
  contradictionCount,
  sourceDiversity,
  variant = 'dark',
}: ActorSummaryProps) {
  const metaColor = variant === 'dark' ? '#666666' : '#888888';
  const textColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center mb-2 text-[11px] uppercase tracking-[0.08em]" style={{ color: metaColor }}>
        {entityType && <span>{ENTITY_TYPE_LABELS[entityType] ?? entityType}</span>}
        {roles.length > 0 && <span>{roles.join(', ')}</span>}
      </div>
      <h1 className="text-[24px] font-light" style={{ color: textColor }}>
        {label}
      </h1>
      <div className="flex flex-wrap gap-3 mt-2 text-[13px]" style={{ color: metaColor }}>
        <span>{eventCount} événement{eventCount !== 1 ? 's' : ''}</span>
        <span>{episodeCount} épisode{episodeCount !== 1 ? 's' : ''}</span>
        {claimCount > 0 && <span>{claimCount} claim{claimCount !== 1 ? 's' : ''}</span>}
        {contradictionCount > 0 && (
          <span style={{ color: '#C62828' }}>{contradictionCount} contradiction{contradictionCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      <EvidenceSummary
        sourceDiversity={sourceDiversity}
        eventCount={eventCount}
        variant={variant}
      />
    </div>
  );
}
