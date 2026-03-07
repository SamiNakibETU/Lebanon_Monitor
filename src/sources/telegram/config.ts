/**
 * Telegram RSS bridge configuration.
 * Uses RSS bridge URLs (e.g. rss.app, t.me/rss) to fetch public channel posts.
 * Set TELEGRAM_RSS_URLS to comma-separated URLs, e.g.:
 *   TELEGRAM_RSS_URLS=https://rss.app/feed/xxx,https://...
 */

function getTelegramUrls(): string[] {
  const urls = process.env.TELEGRAM_RSS_URLS;
  if (!urls || typeof urls !== 'string') return [];
  return urls.split(',').map((u) => u.trim()).filter(Boolean);
}

export const TELEGRAM_RSS_URLS = getTelegramUrls();

export const TELEGRAM_CONFIG = {
  ttlSeconds: 10 * 60, // 10 min
  userAgent: 'Mozilla/5.0 (compatible; LebanonMonitor/1.0; +https://github.com/lebanon-monitor)',
} as const;
