/**
 * API contracts for analytics — Zod schemas.
 * Phase F.
 */

import { z } from 'zod';

export const eventAggregatesSchema = z.object({
  byPolarity: z.object({
    lumiere: z.number(),
    ombre: z.number(),
    neutre: z.number(),
  }),
  byCategory: z.record(z.string(), z.number()),
  byDay: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
      lumiere: z.number(),
      ombre: z.number(),
      neutre: z.number(),
    })
  ),
  total: z.number(),
});

export const analyticsResponseSchema = z.object({
  aggregates: eventAggregatesSchema,
  indicators: z
    .object({
      lbp: z.number().nullable(),
      weatherBeirut: z.string().nullable(),
      aqi: z.number().nullable(),
    })
    .optional(),
});

export type EventAggregates = z.infer<typeof eventAggregatesSchema>;
export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;
