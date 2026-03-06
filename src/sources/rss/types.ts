/**
 * RSS parser output type.
 */

export interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
}
