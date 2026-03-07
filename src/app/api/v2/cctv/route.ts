/**
 * CCTV resolution — try sources in priority order, return first available.
 */

import { NextResponse } from 'next/server';
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

export async function GET() {
  const sorted = [...CCTV_SOURCES].sort((a, b) => a.priority - b.priority);

  for (const source of sorted) {
    if (source.type === 'youtube' && source.youtubeHandle) {
      const { videoId, isLive } = await resolveYouTubeLive(source.youtubeHandle);
      const finalId = videoId ?? source.videoId;
      if (finalId) {
        return NextResponse.json({
          source: { id: source.id, name: source.name },
          type: 'youtube',
          videoId: finalId,
          isLive,
          embedUrl: `https://www.youtube.com/embed/${finalId}?autoplay=0&mute=1`,
        });
      }
    }
    if (source.type === 'webcam' && source.embedUrl) {
      return NextResponse.json({
        source: { id: source.id, name: source.name },
        type: 'webcam',
        embedUrl: source.embedUrl,
      });
    }
    if (source.type === 'direct' && source.embedUrl) {
      return NextResponse.json({
        source: { id: source.id, name: source.name },
        type: 'direct',
        embedUrl: source.embedUrl,
      });
    }
  }

  const fallback = CCTV_SOURCES.find((s) => s.alwaysAvailable && s.videoId);
  if (fallback?.videoId) {
    return NextResponse.json({
      source: { id: fallback.id, name: fallback.name },
      type: 'youtube',
      videoId: fallback.videoId,
      isLive: false,
      embedUrl: `https://www.youtube.com/embed/${fallback.videoId}?autoplay=0&mute=1`,
    });
  }

  return NextResponse.json({
    source: { id: 'aljazeera', name: 'Al Jazeera' },
    type: 'youtube',
    videoId: 'gCNeDWCI0vo',
    isLive: false,
    embedUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=0&mute=1',
  });
}
