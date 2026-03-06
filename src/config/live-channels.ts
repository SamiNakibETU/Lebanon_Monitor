/**
 * Live channel config — World Monitor style.
 * handle = YouTube @handle, fallbackVideoId = plays when not live.
 */

export interface LiveChannelConfig {
  id: string;
  name: string;
  handle: string;
  fallbackVideoId?: string;
}

export const LEBANON_LIVE_CHANNELS: LiveChannelConfig[] = [
  {
    id: 'lbci',
    name: 'LBCI',
    handle: '@LBCILebanon',
    // No fallback — when not live we show CTA to lbcgroup.tv
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    handle: '@AlJazeeraEnglish',
    fallbackVideoId: 'gCNeDWCI0vo',
  },
  {
    id: 'alhadath',
    name: 'Al Hadath',
    handle: '@AlHadath',
    fallbackVideoId: 'xWXpl7azI8k',
  },
  {
    id: 'i24',
    name: 'i24NEWS',
    handle: '@i24NEWS_HE',
    fallbackVideoId: 'myKybZUK0IA',
  },
];
