import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { runSocialMediaIngest } from '@/worker/social-media-ingest';
import { buildMediaFingerprint, scoreMedia } from '@/lib/osint/image-verification';

export async function GET() {
  try {
    const payload = await cachedFetch(
      'lm:media:v1',
      async () => {
        const social = await runSocialMediaIngest();
        const medias = social.flatMap((s) =>
          s.mediaUrls.map((url) => {
            let sourceDomain = '';
            try {
              sourceDomain = new URL(s.permalink).hostname;
            } catch {
              sourceDomain = '';
            }
            return {
              id: buildMediaFingerprint(url),
              linkedEventId: s.linkedEventId,
              linkedEventTitle: s.linkedEventTitle,
              author: s.author,
              createdAt: s.createdAt,
              permalink: s.permalink,
              verification: scoreMedia({
                mediaUrl: url,
                contextText: `${s.text} ${s.linkedEventTitle ?? ''}`,
                sourceDomain,
                seenAt: s.createdAt,
              }),
            };
          })
        );

        const sorted = medias
          .sort((a, b) => b.verification.confidence - a.verification.confidence)
          .slice(0, 100);

        return {
          generatedAt: new Date().toISOString(),
          count: sorted.length,
          items: sorted,
        };
      },
      { ttl: 300 }
    );
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: 0,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

