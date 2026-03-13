'use client';

import Link from 'next/link';

export interface ClaimItem {
  id: string;
  text: string;
  claimType?: string | null;
  eventId?: string;
}

export interface ContradictionItem {
  claimIdA: string;
  claimIdB: string;
  type?: string | null;
}

export interface ClaimsPanelProps {
  claims: ClaimItem[];
  contradictions?: ContradictionItem[];
  variant?: 'light' | 'dark';
}

export function ClaimsPanel({ claims, contradictions = [], variant = 'dark' }: ClaimsPanelProps) {
  const metaColor = variant === 'dark' ? '#666666' : '#888888';
  const textColor = variant === 'dark' ? '#FFFFFF' : '#1A1A1A';
  const borderColor = variant === 'dark' ? 'rgba(255,255,255,0.04)' : '#E0DCD7';

  if (claims.length === 0 && contradictions.length === 0) return null;

  return (
    <div className="pt-6" style={{ borderTop: `1px solid ${borderColor}` }}>
      {claims.length > 0 && (
        <>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: metaColor }}>
            Claims principaux
          </div>
          <ul className="flex flex-col gap-3 mb-6">
            {claims.map((c) => (
              <li key={c.id}>
                <p className="text-[14px] leading-relaxed" style={{ color: textColor }}>
                  {c.text}
                </p>
                {c.eventId && (
                  <Link
                    href={`/event/${c.eventId}`}
                    className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF] mt-1 inline-block"
                    style={{ color: metaColor }}
                  >
                    → Voir événement
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {contradictions.length > 0 && (
        <>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#C62828' }}>
            Contradictions
          </div>
          <ul className="flex flex-col gap-2">
            {contradictions.map((cc, i) => (
              <li key={`${cc.claimIdA}-${cc.claimIdB}-${i}`} className="text-[12px]" style={{ color: metaColor }}>
                Claim {cc.claimIdA.slice(0, 8)}… ↔ {cc.claimIdB.slice(0, 8)}…
                {cc.type && ` · ${cc.type}`}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
