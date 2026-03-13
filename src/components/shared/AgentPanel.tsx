'use client';

import { useState } from 'react';

type Mode = 'explore' | 'synthesis';

export interface AgentPanelProps {
  mode: Mode;
  context: {
    placeId?: string;
    actorId?: string;
    episodeId?: string;
    defaultQuery?: string;
  };
  onClose: () => void;
}

export function AgentPanel({ mode, context, onClose }: AgentPanelProps) {
  const [query, setQuery] = useState(context.defaultQuery ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    content: string;
    citations: string[];
    uncertainty?: string;
    error?: string;
  } | null>(null);

  const endpoint = mode === 'explore' ? '/api/v2/agent/explore' : '/api/v2/agent/synthesis';
  const label = mode === 'explore' ? 'Explorer' : 'Synthétiser';
  const provenance = context.placeId
    ? `Focus: place · ${context.placeId.slice(0, 8)}…`
    : context.actorId
      ? `Focus: actor · ${context.actorId.slice(0, 8)}…`
      : context.episodeId
        ? `Focus: episode · ${context.episodeId.slice(0, 8)}…`
        : 'Focus: vitality/general';

  const handleRun = async () => {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, unknown> = { query: q };
      if (mode === 'explore') {
        if (context.placeId) body.focus = 'place';
        else if (context.actorId) body.focus = 'actor';
        else if (context.episodeId) body.focus = 'episode';
        else body.focus = 'vitality';
        if (body.focus !== 'vitality') {
          body.id = context.placeId ?? context.actorId ?? context.episodeId;
        }
      } else {
        if (context.placeId) body.contextHint = 'places';
        else if (context.actorId) body.contextHint = 'actors';
        else if (context.episodeId) body.contextHint = 'episodes';
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok) {
        const msg =
          res.status === 503 && data.error?.includes('GROQ')
            ? 'Agent non disponible (GROQ_API_KEY non configurée).'
            : data.error ?? `Erreur ${res.status}`;
        setResult({
          content: '',
          citations: [],
          error: msg,
        });
        return;
      }

      setResult({
        content: data.content ?? '',
        citations: data.citations ?? [],
        uncertainty: data.uncertainty,
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Délai dépassé (timeout 30s).'
          : err instanceof Error
            ? err.message
            : 'Erreur réseau';
      setResult({ content: '', citations: [], error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-6 p-4"
      style={{
        background: '#0A0A0A',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
            {label}
          </span>
          {(context.placeId || context.actorId || context.episodeId) && (
            <span className="ml-2 text-[11px]" style={{ color: '#666666' }}>
              · Contexte: {context.placeId ? 'lieu' : context.actorId ? 'acteur' : 'épisode'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF]"
          style={{ color: '#666666' }}
        >
          Fermer
        </button>
      </div>
      <div className="mb-4 text-[11px]" style={{ color: '#666666' }}>
        Provenance: {provenance} · endpoint {endpoint}
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Question pour ${label.toLowerCase()}…`}
          className="flex-1 px-3 py-2 text-[13px] bg-transparent border focus:outline-none"
          style={{
            color: '#FFFFFF',
            borderColor: 'rgba(255,255,255,0.15)',
          }}
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleRun}
          disabled={loading || !query.trim()}
          className="px-4 py-2 text-[12px] uppercase tracking-[0.08em] disabled:opacity-50 transition-colors duration-150"
          style={{
            background: '#1A1A1A',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {loading ? '…' : 'Lancer'}
        </button>
      </div>
      {result && (
        <div className="space-y-3">
          {result.error && (
            <p style={{ color: '#C62828', fontSize: 13 }}>{result.error}</p>
          )}
          {result.content && (
            <div>
              <p className="text-[14px] leading-relaxed" style={{ color: '#FFFFFF' }}>
                {result.content}
              </p>
              {result.uncertainty && (
                <p className="mt-2 text-[12px]" style={{ color: '#666666' }}>
                  {result.uncertainty}
                </p>
              )}
              {result.citations.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: '#666666' }}>
                    Citations
                  </span>
                  <ul className="mt-1 space-y-0.5">
                    {result.citations.slice(0, 10).map((c, i) => (
                      <li key={i} className="text-[12px]" style={{ color: '#888888', fontFamily: 'DM Mono, monospace' }}>
                        {c}
                      </li>
                    ))}
                    {result.citations.length > 10 && (
                      <li className="text-[11px]" style={{ color: '#666666' }}>
                        +{result.citations.length - 10} autres
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
