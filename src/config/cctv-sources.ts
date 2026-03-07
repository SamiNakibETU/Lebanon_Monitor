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

export const CCTV_SOURCES: CctvSource[] = [
  {
    id: 'aljadeed',
    name: 'Al Jadeed',
    type: 'youtube',
    youtubeHandle: '@AlJadeedTv',
    priority: 1,
  },
  {
    id: 'mtv',
    name: 'MTV Lebanon',
    type: 'youtube',
    youtubeHandle: '@MTVLebanon',
    priority: 2,
  },
  {
    id: 'lbci',
    name: 'LBCI',
    type: 'direct',
    url: 'https://www.lbcgroup.tv/live/en',
    embedUrl: 'https://www.lbcgroup.tv/live-watch/LBCI/video/en',
    priority: 3,
  },
  {
    id: 'otv',
    name: 'OTV Lebanon',
    type: 'direct',
    url: 'https://otv.com.lb/live',
    priority: 4,
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
    id: 'aljazeera',
    name: 'Al Jazeera Arabic',
    type: 'youtube',
    youtubeHandle: '@AlJazeeraArabic',
    videoId: 'gCNeDWCI0vo',
    priority: 6,
    alwaysAvailable: true,
  },
  {
    id: 'alarabiya',
    name: 'Al Arabiya',
    type: 'youtube',
    youtubeHandle: '@AlArabiya',
    videoId: 'sC2vVHrPTD0',
    priority: 7,
    alwaysAvailable: true,
  },
  {
    id: 'france24-ar',
    name: 'France 24 Arabic',
    type: 'youtube',
    youtubeHandle: '@France24Arabic',
    videoId: 'h3MuIUNCCzI',
    priority: 8,
    alwaysAvailable: true,
  },
];
