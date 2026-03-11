import Parser from 'rss-parser';
import { normalizeText } from '@/lib/text-normalize';

export interface SocialCaptureItem {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  permalink: string;
  mediaUrls: string[];
}

const parser = new Parser({ timeout: 10_000 });

function getAccounts(): string[] {
  const raw = process.env.SOCIAL_PUBLIC_ACCOUNTS ?? 'LebarmyOfficial,UNIFIL_';
  return raw
    .split(',')
    .map((s) => s.trim().replace(/^@/, ''))
    .filter(Boolean)
    .slice(0, 20);
}

function extractMediaUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp|gif)/gi) ?? [];
  return Array.from(new Set(matches)).slice(0, 6);
}

export async function fetchPublicTwitterRss(): Promise<SocialCaptureItem[]> {
  const host = process.env.SOCIAL_RSS_HOST ?? 'https://nitter.net';
  const out: SocialCaptureItem[] = [];
  for (const account of getAccounts()) {
    try {
      const rssUrl = `${host.replace(/\/$/, '')}/${encodeURIComponent(account)}/rss`;
      const parsed = await parser.parseURL(rssUrl);
      for (const item of parsed.items ?? []) {
        const title = normalizeText(item.title ?? '');
        const content = normalizeText(item.contentSnippet ?? item.content ?? '');
        const text = `${title} ${content}`.trim();
        if (!text) continue;
        const permalink = item.link ?? `${host}/${account}`;
        out.push({
          id: `tw-${account}-${(item.guid ?? permalink).replace(/[^a-zA-Z0-9]/g, '').slice(0, 42)}`,
          author: account,
          text,
          createdAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          permalink,
          mediaUrls: extractMediaUrls(`${item.content ?? ''} ${item.contentSnippet ?? ''}`),
        });
      }
    } catch {
      // best-effort source
    }
  }

  out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return out.slice(0, 120);
}

