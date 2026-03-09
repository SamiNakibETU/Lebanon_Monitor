import { NextResponse } from 'next/server';
import { getCachedSynthesis, generateSynthesis } from '@/worker/synthesis';

export async function GET() {
  try {
    const synthesis = (await getCachedSynthesis()) ?? (await generateSynthesis());
    if (!synthesis) {
      return NextResponse.json(
        {
          generatedAt: new Date().toISOString(),
          sections: {
            security: 'Indisponible.',
            economy: 'Indisponible.',
            humanitarian: 'Indisponible.',
            politics: 'Indisponible.',
            regional: 'Indisponible.',
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        generatedAt: synthesis.generated_at,
        sections: synthesis.sections ?? {
          security: synthesis.ombre,
          economy: synthesis.lumiere,
          humanitarian: synthesis.lumiere,
          politics: synthesis.ombre,
          regional: synthesis.ombre,
        },
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=1800' } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
