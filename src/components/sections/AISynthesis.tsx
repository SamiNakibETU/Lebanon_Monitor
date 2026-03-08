'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SynthesisData {
  lumiere: string;
  ombre: string;
  generated_at: string;
}

interface AISynthesisProps {
  variant: 'lumiere' | 'ombre';
}

export function AISynthesis({ variant }: AISynthesisProps) {
  const { data, error, isLoading } = useSWR<SynthesisData>(
    '/api/v2/synthesis',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const text = variant === 'lumiere' ? data?.lumiere : data?.ombre;
  const isLumiere = variant === 'lumiere';

  const bg = isLumiere ? '#F5F2EE' : '#0A0A0A';
  const textColor = isLumiere ? '#1A1A1A' : '#FFFFFF';

  if (isLoading || error) {
    return (
      <div
        className="text-[14px] leading-relaxed"
        style={{ color: isLumiere ? '#888888' : '#666666' }}
      >
        —
      </div>
    );
  }

  return (
    <div
      className="text-[14px] leading-relaxed"
      style={{ color: textColor, background: bg }}
    >
      {text ?? '—'}
    </div>
  );
}
