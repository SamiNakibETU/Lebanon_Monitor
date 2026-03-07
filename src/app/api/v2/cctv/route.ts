/**
 * CCTV resolution — try sources in priority order, return first available.
 * ?source=id forces a specific source.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CCTV_SOURCES } from '@/config/cctv-sources';

async function resolveYouTubeLive(handle: string): Promise<{ videoId: string | null; isLive: boolean }> {
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  try {
    const res = await fetch(`https://www.youtube.com/${h}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: new AbortController().signal,
    });
    if (!res.ok) return { videoId: null, isLive: false };
    const html = await res.text();
    const detailsIdx = html.indexOf('"videoDetails"');
    if (detailsIdx === -1) return { videoId: null, isLive: false };
    const block = html.substring(detailsIdx, detailsIdx + 5000);
    const vidMatch = block.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    const liveMatch = block.match(/"isLive"\s*:\s*true/);
    if (vidMatch) {
      return { videoId: vidMatch[1], isLive: Boolean(liveMatch) };
    }
  } catch {
    //
  }
  return { videoId: null, isLive: false };
}

const LUMIERE_IDS = ['beirut-webcam', 'lbci', 'mtv', 'otv'];
const OMBRE_IDS = ['aljazeera', 'alarabiya', 'aljadeed', 'france24-ar'];

function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&controls=0`;
}

function buildResponse(
  source: (typeof CCTV_SOURCES)[0],
  type: 'youtube' | 'webcam' | 'direct',
  opts: { videoId?: string; isLive?: boolean; embedUrl: string }
) {
  return NextResponse.json({
    source: { id: source.id, name: source.name },
    type,
    videoId: opts.videoId,
    isLive: opts.isLive ?? false,
    embedUrl: opts.embedUrl,
    sources: CCTV_SOURCES.map((s) => ({ id: s.id, name: s.name })),
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceId = searchParams.get('source');

  if (forceId) {
    const source = CCTV_SOURCES.find((s) => s.id === forceId);
    if (source) {
      if (source.type === 'youtube' && (source.youtubeHandle || source.videoId)) {
        const { videoId, isLive } = source.youtubeHandle
          ? await resolveYouTubeLive(source.youtubeHandle)
          : { videoId: source.videoId, isLive: false };
        const finalId = videoId ?? source.videoId;
        if (finalId) {
          return buildResponse(source, 'youtube', {
            videoId: finalId,
            isLive,
            embedUrl: youtubeEmbedUrl(finalId),
          });
        }
      }
      if (source.type === 'webcam' && source.embedUrl) {
        return buildResponse(source, 'webcam', { embedUrl: source.embedUrl });
      }
      if (source.type === 'direct' && source.embedUrl) {
        return buildResponse(source, 'direct', { embedUrl: source.embedUrl });
      }
    }
  }

  const variant = searchParams.get('variant') === 'ombre' ? 'ombre' : 'lumiere';
  const priorityIds = variant === 'ombre' ? OMBRE_IDS : LUMIERE_IDS;
  const sorted = [...CCTV_SOURCES].filter((s) => priorityIds.includes(s.id));
  const fallbackSorted = [...CCTV_SOURCES].filter((s) => !priorityIds.includes(s.id));
  const allSorted = [...sorted, ...fallbackSorted].sort((a, b) => a.priority - b.priority);

  for (const source of allSorted) {
    if (source.type === 'youtube' && source.youtubeHandle) {
      const { videoId, isLive } = await resolveYouTubeLive(source.youtubeHandle);
      const finalId = videoId ?? source.videoId;
      if (finalId) {
        return buildResponse(source, 'youtube', {
          videoId: finalId,
          isLive,
          embedUrl: youtubeEmbedUrl(finalId),
        });
      }
    }
    if (source.type === 'webcam' && source.embedUrl) {
      return buildResponse(source, 'webcam', { embedUrl: source.embedUrl });
    }
    if (source.type === 'direct' && source.embedUrl) {
      return buildResponse(source, 'direct', { embedUrl: source.embedUrl });
    }
  }

  const fallback = CCTV_SOURCES.find((s) => s.alwaysAvailable && s.videoId);
  if (fallback?.videoId) {
    return buildResponse(fallback, 'youtube', {
      videoId: fallback.videoId,
      isLive: false,
      embedUrl: youtubeEmbedUrl(fallback.videoId),
    });
  }

  const defaultSource =
    variant === 'ombre'
      ? CCTV_SOURCES.find((s) => s.id === 'aljazeera')
      : CCTV_SOURCES.find((s) => s.id === 'beirut-webcam');
  const final = defaultSource ?? CCTV_SOURCES[0]!;
  if (final.type === 'youtube' && final.videoId) {
    return buildResponse(final, 'youtube', {
      videoId: final.videoId,
      isLive: false,
      embedUrl: youtubeEmbedUrl(final.videoId),
    });
  }
  if (final.type === 'webcam' && final.embedUrl) {
    return buildResponse(final, 'webcam', { embedUrl: final.embedUrl });
  }
  const aljazeera = CCTV_SOURCES.find((s) => s.id === 'aljazeera') ?? CCTV_SOURCES[0]!;
  return buildResponse(aljazeera, 'youtube', {
    videoId: 'gCNeDWCI0vo',
    isLive: false,
    embedUrl: youtubeEmbedUrl('gCNeDWCI0vo'),
  });
}
