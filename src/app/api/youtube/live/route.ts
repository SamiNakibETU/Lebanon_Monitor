/**
 * YouTube live resolution — World Monitor approach.
 * Fetches youtube.com/@Handle/live and parses videoId + isLive.
 * Fallback: use fallbackVideoId when not live (24/7 channels).
 */

import { NextResponse } from 'next/server';
import { LEBANON_LIVE_CHANNELS } from '@/config/live-channels';

async function resolveLiveVideoId(handle: string): Promise<{ videoId: string | null; isLive: boolean }> {
  const channelHandle = handle.startsWith('@') ? handle : `@${handle}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`https://www.youtube.com/${channelHandle}/live`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { videoId: null, isLive: false };
    const html = await res.text();

    const detailsIdx = html.indexOf('"videoDetails"');
    if (detailsIdx === -1) return { videoId: null, isLive: false };

    const block = html.substring(detailsIdx, detailsIdx + 5000);
    const vidMatch = block.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    const liveMatch = block.match(/"isLive"\s*:\s*true/);

    if (vidMatch && liveMatch) {
      return { videoId: vidMatch[1], isLive: true };
    }
    if (vidMatch) {
      return { videoId: vidMatch[1], isLive: false };
    }
  } catch {
    clearTimeout(timeout);
  }
  return { videoId: null, isLive: false };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel') ?? 'lbci';
    const channel = LEBANON_LIVE_CHANNELS.find((c) => c.id === channelId) ?? LEBANON_LIVE_CHANNELS[0];

    const { videoId, isLive } = await resolveLiveVideoId(channel.handle);
    const finalVideoId = videoId ?? channel.fallbackVideoId ?? null;

    const embedUrl = finalVideoId
      ? `https://www.youtube.com/embed/${finalVideoId}?autoplay=0&mute=1`
      : null;

    return NextResponse.json(
      {
        videoId: finalVideoId,
        isLive,
        embedUrl,
        channel: { id: channel.id, name: channel.name },
        channels: LEBANON_LIVE_CHANNELS.map((c) => ({ id: c.id, name: c.name })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        videoId: null,
        isLive: false,
        embedUrl: null,
        channel: { id: 'lbci', name: 'LBCI' },
        channels: LEBANON_LIVE_CHANNELS.map((c) => ({ id: c.id, name: c.name })),
      },
      { status: 200 }
    );
  }
}
