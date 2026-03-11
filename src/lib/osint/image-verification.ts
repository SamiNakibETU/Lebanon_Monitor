import crypto from 'node:crypto';

export interface MediaVerificationInput {
  mediaUrl: string;
  contextText?: string;
  sourceDomain?: string;
  seenAt?: string;
}

export interface MediaVerificationScore {
  mediaUrl: string;
  isReused: boolean;
  firstSeen: string | null;
  sourceMatch: number;
  contextMatch: number;
  confidence: number;
  workflowLinks: {
    invid: string;
    tineye: string;
    yandex: string;
  };
}

function hash(url: string): string {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
}

function domainWeight(domain?: string): number {
  if (!domain) return 45;
  if (/un\.org|reliefweb|gov\.lb|who\.int|unicef|wfp|icrc/i.test(domain)) return 85;
  if (/twitter|x\.com|t\.me|instagram|facebook/i.test(domain)) return 55;
  return 60;
}

export function scoreMedia(input: MediaVerificationInput): MediaVerificationScore {
  const url = input.mediaUrl.trim();
  const firstSeen = input.seenAt ?? null;
  const reusedHeuristic = /\/(status|photo|media)\//i.test(url) || /[?&](format|name)=/i.test(url);
  const contextBoost = /(beirut|lebanon|liban|strike|hospital|aid|school|ceasefire)/i.test(input.contextText ?? '') ? 22 : 8;
  const sourceMatch = Math.max(0, Math.min(100, domainWeight(input.sourceDomain)));
  const contextMatch = Math.max(0, Math.min(100, 40 + contextBoost));
  const confidence = Math.round(sourceMatch * 0.55 + contextMatch * 0.45 - (reusedHeuristic ? 12 : 0));
  const encoded = encodeURIComponent(url);

  return {
    mediaUrl: url,
    isReused: reusedHeuristic,
    firstSeen,
    sourceMatch,
    contextMatch,
    confidence: Math.max(0, Math.min(100, confidence)),
    workflowLinks: {
      invid: `https://www.invid-project.eu/tools-and-services/invid-verification-plugin/`,
      tineye: `https://tineye.com/search?url=${encoded}`,
      yandex: `https://yandex.com/images/search?rpt=imageview&url=${encoded}`,
    },
  };
}

export function buildMediaFingerprint(mediaUrl: string): string {
  return `mfp_${hash(mediaUrl)}`;
}

