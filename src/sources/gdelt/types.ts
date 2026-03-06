/**
 * GDELT DOC API response types.
 */

export interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  tone?: number;
  extrasdata?: string;
}

export interface GdeltResponse {
  articles?: GdeltArticle[];
}
