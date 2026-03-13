'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentPanel } from '@/components/shared/AgentPanel';

export type AnalystFocusType = 'place' | 'actor' | 'episode' | 'search';

export interface AnalystActionsBarProps {
  focusType: AnalystFocusType;
  placeId?: string;
  actorId?: string;
  episodeId?: string;
  label?: string;
  query?: string;
}

function buildRetrievalUrl(props: AnalystActionsBarProps): string {
  const params = new URLSearchParams();
  params.set('objectTypes', 'events,episodes,places,actors');
  params.set('limit', '25');
  if (props.placeId) params.set('placeId', props.placeId);
  if (props.actorId) params.set('q', props.label ?? '');
  if (props.episodeId) params.set('q', props.label ?? '');
  if (props.query) params.set('q', props.query);
  if (!params.has('q') && props.label) params.set('q', props.label);
  return `/retrieval?${params.toString()}`;
}

function buildCitationText(props: AnalystActionsBarProps): string {
  const parts: string[] = [];
  if (props.label) parts.push(`Objet: ${props.label}`);
  if (props.focusType === 'place' && props.placeId) parts.push(`Lieu: /place/${props.placeId}`);
  if (props.focusType === 'actor' && props.actorId) parts.push(`Acteur: /actor/${props.actorId}`);
  if (props.focusType === 'episode' && props.episodeId) parts.push(`Épisode: /episode/${props.episodeId}`);
  if (typeof window !== 'undefined') parts.push(`URL: ${window.location.href}`);
  parts.push(`Référence: ${new Date().toISOString().slice(0, 10)}`);
  return parts.join('\n');
}

export function AnalystActionsBar(props: AnalystActionsBarProps) {
  const [agentMode, setAgentMode] = useState<'explore' | 'synthesis' | null>(null);

  const retrievalUrl = buildRetrievalUrl(props);

  const handleCopyCitations = () => {
    const text = buildCitationText(props);
    navigator.clipboard
      .writeText(text)
      .then(() => {})
      .catch(() => {});
  };

  const context = {
    placeId: props.placeId,
    actorId: props.actorId,
    episodeId: props.episodeId,
    defaultQuery: props.query ?? props.label,
  };

  return (
    <div
      className="flex flex-col py-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.08em] mr-2" style={{ color: '#666666' }}>
          Actions
        </span>
        <button
          type="button"
          onClick={() => setAgentMode((m) => (m === 'explore' ? null : 'explore'))}
          className="px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF]"
          style={{
            color: agentMode === 'explore' ? '#FFFFFF' : '#666666',
            background: agentMode === 'explore' ? '#1A1A1A' : 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Explorer
        </button>
        <button
          type="button"
          onClick={() => setAgentMode((m) => (m === 'synthesis' ? null : 'synthesis'))}
          className="px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF]"
          style={{
            color: agentMode === 'synthesis' ? '#FFFFFF' : '#666666',
            background: agentMode === 'synthesis' ? '#1A1A1A' : 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Synthétiser
        </button>
        <Link
          href={retrievalUrl}
          className="px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF] no-underline"
          style={{
            color: '#666666',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Ouvrir retrieval
        </Link>
        <button
          type="button"
          onClick={handleCopyCitations}
          className="px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] transition-colors duration-150 hover:text-[#FFFFFF]"
          style={{
            color: '#666666',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Copier citations
        </button>
      </div>
      {agentMode && (
        <AgentPanel
          mode={agentMode}
          context={context}
          onClose={() => setAgentMode(null)}
        />
      )}
    </div>
  );
}
