/**
 * API contracts for events — Zod schemas for request/response validation.
 */

import { z } from 'zod';

export const polaritySchema = z.enum(['lumiere', 'ombre', 'neutre']);
export const verificationStatusSchema = z.enum([
  'unverified',
  'partially_verified',
  'verified',
  'disputed',
]);

export const sourceNameSchema = z.enum([
  'gdelt',
  'usgs',
  'firms',
  'rss',
  'gdacs',
  'reliefweb',
  'weather',
  'cloudflare',
  'lbp-rate',
  'openaq',
  'twitter',
  'ucdp',
]);

export const getEventsQuerySchema = z.object({
  source: z.union([z.literal('all'), sourceNameSchema]).optional().default('all'),
  classification: z.union([z.literal('all'), polaritySchema]).optional().default('all'),
  verification_status: verificationStatusSchema.optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

export type GetEventsQuery = z.infer<typeof getEventsQuerySchema>;

export const eventResponseSchema = z.object({
  id: z.string().uuid(),
  canonical_title: z.string(),
  canonical_summary: z.string().nullable(),
  original_language: z.string().nullable(),
  event_type: z.string().nullable(),
  sub_type: z.string().nullable(),
  polarity_ui: polaritySchema,
  impact_score: z.number().nullable(),
  severity_score: z.number().nullable(),
  confidence_score: z.number().nullable(),
  verification_status: verificationStatusSchema,
  occurred_at: z.string().datetime(),
  first_seen_at: z.string().datetime(),
  last_seen_at: z.string().datetime(),
  place_id: z.string().uuid().nullable(),
  geo_precision: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export const getEventsResponseSchema = z.object({
  events: z.array(eventResponseSchema),
  total: z.number(),
  statuses: z.array(z.object({
    source: z.string(),
    status: z.enum(['ok', 'error', 'rate-limited', 'no-data', 'skipped']),
    eventCount: z.number(),
    responseTimeMs: z.number().optional(),
    error: z.string().optional(),
    cached: z.boolean().optional(),
  })).optional(),
  indicators: z.object({
    lbp: z.number().nullable(),
    weatherBeirut: z.string().nullable(),
    aqi: z.number().nullable(),
  }).optional(),
});

export type GetEventsResponse = z.infer<typeof getEventsResponseSchema>;
