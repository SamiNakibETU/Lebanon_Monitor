/**
 * CCTV multi-source fallback — priority cascade per brief.
 */

export interface CctvSource {
  id: string;
  name: string;
  type: 'youtube' | 'direct' | 'webcam';
  youtubeHandle?: string;
  videoId?: string;
  url?: string;
  embedUrl?: string;
  priority: number;
  alwaysAvailable?: boolean;
}

/**
 * V3 — Ombre panel: Al Jazeera → Al Arabiya → Al Jadeed → France 24 (24/7 news).
 * Lumière panel: SkylineWebcams → LBCI → MTV (paisible / culturel).
 * Fallback: SkylineWebcams always available.
 */
export const CCTV_SOURCES: CctvSource[] = [
  {
    id: 'aljazeera',
    name: 'Al Jazeera Arabic',
    type: 'youtube',
    youtubeHandle: '@AlJazeeraArabic',
    videoId: 'gCNeDWCI0vo',
    priority: 1,
    alwaysAvailable: true,
  },
  {
    id: 'alarabiya',
    name: 'Al Arabiya',
    type: 'youtube',
    youtubeHandle: '@AlArabiya',
    videoId: 'sC2vVHrPTD0',
    priority: 2,
    alwaysAvailable: true,
  },
  {
    id: 'aljadeed',
    name: 'Al Jadeed',
    type: 'youtube',
    youtubeHandle: '@AlJadeedTv',
    priority: 3,
  },
  {
    id: 'france24-ar',
    name: 'France 24 Arabic',
    type: 'youtube',
    youtubeHandle: '@France24Arabic',
    videoId: 'h3MuIUNCCzI',
    priority: 4,
    alwaysAvailable: true,
  },
  {
    id: 'beirut-webcam',
    name: 'Beirut Skyline',
    type: 'webcam',
    embedUrl: 'https://www.skylinewebcams.com/en/webcam/lebanon/beirut/beirut/beirut.html',
    priority: 5,
    alwaysAvailable: true,
  },
  {
    id: 'lbci',
    name: 'LBCI',
    type: 'direct',
    url: 'https://www.lbcgroup.tv/live/en',
    embedUrl: 'https://www.lbcgroup.tv/live-watch/LBCI/video/en',
    priority: 6,
  },
  {
    id: 'mtv',
    name: 'MTV Lebanon',
    type: 'youtube',
    youtubeHandle: '@MTVLebanon',
    priority: 7,
  },
  {
    id: 'otv',
    name: 'OTV Lebanon',
    type: 'direct',
    url: 'https://otv.com.lb/live',
    embedUrl: 'https://otv.com.lb/live',
    priority: 8,
  },
];
