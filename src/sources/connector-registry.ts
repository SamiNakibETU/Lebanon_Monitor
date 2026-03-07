/**
 * Registry déclaratif des connecteurs de sources.
 * Phase C — Pipeline ingestion.
 */

import { createConnector } from "./connector-factory";
import { fetchGdelt } from "./gdelt";
import { normalize as normalizeGdelt } from "./gdelt";
import { GDELT_CONFIG } from "./gdelt/config";
import { fetchUsgs } from "./usgs";
import { normalize as normalizeUsgs } from "./usgs";
import { USGS_CONFIG } from "./usgs/config";
import { fetchFirmsParsed } from "./firms";
import { normalize as normalizeFirms } from "./firms";
import { FIRMS_CONFIG } from "./firms/config";
import { fetchRss } from "./rss";
import { normalize as normalizeRss } from "./rss";
import { RSS_CONFIG } from "./rss/config";
import { fetchGdacs } from "./gdacs";
import { normalize as normalizeGdacs } from "./gdacs";
import { GDACS_CONFIG } from "./gdacs/config";
import { fetchReliefWeb } from "./reliefweb";
import { normalize as normalizeReliefWeb } from "./reliefweb";
import { RELIEFWEB_CONFIG } from "./reliefweb/config";
import { fetchWeather } from "./weather";
import { normalize as normalizeWeather } from "./weather";
import { WEATHER_CONFIG } from "./weather/config";
import { fetchCloudflare } from "./cloudflare";
import { normalize as normalizeCloudflare } from "./cloudflare";
import { CLOUDFLARE_CONFIG } from "./cloudflare/config";
import { fetchLbpRate } from "./lbp-rate";
import { normalize as normalizeLbpRate } from "./lbp-rate";
import { LBP_RATE_CONFIG } from "./lbp-rate/config";
import { fetchOpenAQ } from "./openaq";
import { normalize as normalizeOpenAQ } from "./openaq";
import { OPENAQ_CONFIG } from "./openaq/config";
import { fetchTwitter } from "./twitter";
import { normalize as normalizeTwitter } from "./twitter";
import { TWITTER_CONFIG } from "./twitter/config";
import { fetchAcled } from "./acled";
import { normalize as normalizeAcled } from "./acled";
import { ACLED_CONFIG } from "./acled/config";
import { fetchUcdp } from "./ucdp";
import { normalize as normalizeUcdp } from "./ucdp";
import { UCDP_CONFIG } from "./ucdp/config";
import type { ConnectorDescriptor } from "./connector-types";

function isNotConfigured(msg: string): boolean {
  return msg.toLowerCase().includes("not configured");
}

/** Tous les connecteurs enregistrés. */
export const CONNECTORS: ConnectorDescriptor[] = [
  createConnector({
    name: "gdelt",
    category: "news",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: GDELT_CONFIG.ttlSeconds,
    reliability: "medium",
    costClass: "free",
    rateLimit: { minIntervalMs: 6000 },
    fetch: fetchGdelt,
    normalize: (raw, fetchedAt) =>
      normalizeGdelt(raw.articles ?? [], fetchedAt),
  }),
  createConnector({
    name: "usgs",
    category: "geophysical",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: USGS_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchUsgs,
    normalize: (raw, fetchedAt) => normalizeUsgs(raw.features ?? [], fetchedAt),
  }),
  createConnector({
    name: "firms",
    category: "geophysical",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: FIRMS_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchFirmsParsed,
    normalize: normalizeFirms,
    isSkipped: isNotConfigured,
  }),
  createConnector({
    name: "rss",
    category: "news",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: RSS_CONFIG.ttlSeconds,
    reliability: "medium",
    costClass: "free",
    fetch: fetchRss,
    normalize: (raw, fetchedAt) => normalizeRss(raw.items, fetchedAt),
  }),
  createConnector({
    name: "gdacs",
    category: "geophysical",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: GDACS_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchGdacs,
    normalize: (raw, fetchedAt) =>
      normalizeGdacs(raw.features ?? [], fetchedAt),
  }),
  createConnector({
    name: "reliefweb",
    category: "humanitarian",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: RELIEFWEB_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchReliefWeb,
    normalize: (raw, fetchedAt) =>
      normalizeReliefWeb(raw.data ?? [], fetchedAt),
  }),
  createConnector({
    name: "weather",
    category: "indicators",
    eventSource: false,
    indicatorSource: true,
    ttlSeconds: WEATHER_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchWeather,
    normalize: (raw, fetchedAt) => normalizeWeather(raw, fetchedAt),
    isSkipped: isNotConfigured,
  }),
  createConnector({
    name: "cloudflare",
    category: "connectivity",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: CLOUDFLARE_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchCloudflare,
    normalize: normalizeCloudflare,
    isSkipped: isNotConfigured,
  }),
  createConnector({
    name: "lbp-rate",
    category: "economy",
    eventSource: false,
    indicatorSource: true,
    ttlSeconds: LBP_RATE_CONFIG.ttlSeconds,
    reliability: "medium",
    costClass: "free",
    fetch: fetchLbpRate,
    normalize: (raw, fetchedAt) => normalizeLbpRate(raw.rate, fetchedAt),
  }),
  createConnector({
    name: "openaq",
    category: "indicators",
    eventSource: false,
    indicatorSource: true,
    ttlSeconds: OPENAQ_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchOpenAQ,
    normalize: (raw, fetchedAt) =>
      normalizeOpenAQ(raw.results ?? [], fetchedAt),
    isSkipped: isNotConfigured,
  }),
  createConnector({
    name: "twitter",
    category: "social",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: TWITTER_CONFIG.ttlSeconds,
    reliability: "low",
    costClass: "free",
    fetch: fetchTwitter,
    normalize: (raw, fetchedAt) => normalizeTwitter(raw.items, fetchedAt),
  }),
  createConnector({
    name: "acled",
    category: "conflict",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: ACLED_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchAcled,
    normalize: (raw, fetchedAt) => normalizeAcled(raw, fetchedAt),
    isSkipped: (msg) => msg.includes("not configured"),
  }),
  createConnector({
    name: "ucdp",
    category: "conflict",
    eventSource: true,
    indicatorSource: false,
    ttlSeconds: UCDP_CONFIG.ttlSeconds,
    reliability: "high",
    costClass: "free",
    fetch: fetchUcdp,
    normalize: (raw, fetchedAt) =>
      normalizeUcdp(
        raw as { Results?: import("./ucdp/types").UCDPEvent[] },
        fetchedAt
      ),
    isSkipped: (msg) => msg.includes("not configured"),
  }),
];

/** Connecteurs qui produisent des événements pour les panneaux Lumière/Ombre. */
export const EVENT_SOURCE_NAMES = new Set(
  CONNECTORS.filter((c) => c.eventSource).map((c) => c.name)
);

/** Connecteurs qui produisent des indicateurs (LBP, météo, AQI). */
export const INDICATOR_SOURCE_NAMES = new Set(
  CONNECTORS.filter((c) => c.indicatorSource).map((c) => c.name)
);
