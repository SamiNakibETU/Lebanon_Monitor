'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EpisodeDetail {
  id: string;
  label: string | null;
  summary: string | null;
  status?: string;
  firstEventAt: string | null;
  lastEventAt: string | null;
  eventCount: number;
  eventIds: string[];
}

export default function EpisodeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, error } = useSWR<EpisodeDetail>(
    id ? `/api/v2/episodes/${id}` : null,
    fetcher
  );

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Erreur de chargement.</p>
          <Link href="/" className="mt-4 inline-block text-[13px]" style={{ color: '#666' }}>← Retour</Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
        <Header lang="fr" onLangChange={() => {}} />
        <div className="max-w-[720px] mx-auto px-6 py-12">
          <p style={{ color: '#666' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#000', color: '#FFF' }}>
      <Header lang="fr" onLangChange={() => {}} />
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <Link href="/" className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFF]" style={{ color: '#666' }}>
          ← Retour au dashboard
        </Link>
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] uppercase tracking-[0.04em]" style={{ color: '#666' }}>
              Épisode {data.status === 'open' ? '· Ouvert' : ''}
            </span>
          </div>
          <h1 className="text-[24px] font-normal" style={{ color: '#FFF' }}>
            {data.label ?? 'Sans titre'}
          </h1>
          {data.summary && (
            <p className="mt-2 text-[14px]" style={{ color: '#888' }}>{data.summary}</p>
          )}
          <p className="mt-4 text-[13px]" style={{ color: '#666' }}>
            {data.eventCount} événement{data.eventCount > 1 ? 's' : ''}
            {data.firstEventAt && data.lastEventAt && (
              <> · {new Date(data.firstEventAt).toLocaleDateString('fr-FR')} → {new Date(data.lastEventAt).toLocaleDateString('fr-FR')}</>
            )}
          </p>
          {data.eventIds.length > 0 && (
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[11px] uppercase tracking-[0.08em] mb-3" style={{ color: '#666' }}>Événements</div>
              <ul className="space-y-2">
                {data.eventIds.map((eid) => (
                  <li key={eid}>
                    <Link href={`/event/${eid}`} className="text-[13px] transition-colors duration-150 hover:text-[#FFF]" style={{ color: '#888' }}>
                      /event/{eid.slice(0, 8)}…
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
