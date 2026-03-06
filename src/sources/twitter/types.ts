/**
 * Nitter RSS item structure.
 */

export interface NitterRssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  creator?: string;
}

export interface NitterFeed {
  items: NitterRssItem[];
}
