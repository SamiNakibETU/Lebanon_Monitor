'use client';

export type EvidenceNote = 'relational' | 'metadata_only' | 'mixed';

export interface EvidenceSummaryProps {
  sourceDiversity: number;
  eventCount: number;
  evidenceNote?: EvidenceNote;
  variant?: 'light' | 'dark';
}

const NOTE_LABELS: Record<EvidenceNote, string> = {
  relational: 'Lié par place_id / entity',
  metadata_only: 'Inféré depuis métadonnées',
  mixed: 'Mixte',
};

export function EvidenceSummary({ sourceDiversity, eventCount, evidenceNote, variant = 'dark' }: EvidenceSummaryProps) {
  const metaColor = variant === 'dark' ? '#666666' : '#888888';

  return (
    <div
      className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.08em] py-2"
      style={{ borderBottom: variant === 'dark' ? '1px solid rgba(255,255,255,0.04)' : '1px solid #E0DCD7' }}
    >
      <span style={{ color: metaColor }}>{eventCount} événement{eventCount !== 1 ? 's' : ''}</span>
      {sourceDiversity > 0 && (
        <span style={{ color: metaColor }}>{sourceDiversity} source{sourceDiversity !== 1 ? 's' : ''}</span>
      )}
      {evidenceNote && evidenceNote !== 'relational' && (
        <span style={{ color: metaColor }}>— {NOTE_LABELS[evidenceNote]}</span>
      )}
    </div>
  );
}
