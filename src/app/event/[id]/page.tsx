'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventDetail {
  id: string;
  title: string;
  summary?: string | null;
  classification: string;
  confidence: number;
  category?: string | null;
  severity: string;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
  sources?: string[];
  translations?: Record<string, string>;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data, error } = useSWR<EventDetail>(
    id ? `/api/v2/events/${id}?lang=fr` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Erreur de chargement.</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-[13px] transition-colors duration-150"
            style={{ color: '#666' }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  const dotColor = data.classification === 'ombre' ? '#E53935' : data.classification === 'lumiere' ? '#43A047' : '#666666';

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
      <Header />
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFF]"
          style={{ color: '#666' }}
        >
          ← Retour au dashboard
        </Link>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-block shrink-0 rounded-full"
              style={{ width: 6, height: 6, background: dotColor }}
            />
            <span className="text-[11px] uppercase tracking-[0.04em]" style={{ color: '#666' }}>
              {data.category ?? data.classification} · {data.severity}
            </span>
            {data.sources && data.sources.length > 0 && (
              <span className="text-[11px]" style={{ color: '#666' }}>
                · {data.sources.join(', ')}
              </span>
            )}
          </div>

          <h1 className="text-[24px] font-normal leading-snug" style={{ color: '#FFF' }}>
            {data.title}
          </h1>

          <p className="mt-2 text-[13px]" style={{ color: '#666' }} suppressHydrationWarning>
            {new Date(data.occurredAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>

          {data.summary && (
            <p className="mt-6 text-[14px] leading-relaxed" style={{ color: '#FFF' }}>
              {data.summary}
            </p>
          )}

          {data.translations && Object.keys(data.translations).length > 1 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666' }}>
                Traductions
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(data.translations).map(([lang, title]) => (
                  <div key={lang}>
                    <span className="text-[10px] uppercase" style={{ color: '#666' }}>
                      {lang}
                    </span>
                    <p className="text-[13px] mt-0.5" style={{ color: '#FFF' }}>
                      {title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
