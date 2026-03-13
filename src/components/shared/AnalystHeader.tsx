'use client';

import Link from 'next/link';

export interface AnalystHeaderProps {
  title?: string;
  subtitle?: string | null;
  backHref?: string;
  backLabel?: string;
}

export function AnalystHeader({ title, subtitle, backHref = '/', backLabel = 'Retour au dashboard' }: AnalystHeaderProps) {
  return (
    <div className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF] block mb-4"
          style={{ color: '#666666' }}
        >
          ← {backLabel}
        </Link>
      )}
      {title && (
        <>
          <h1 className="text-[24px] font-light" style={{ color: '#FFFFFF' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px]" style={{ color: '#666666' }}>
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  );
}
