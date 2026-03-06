/**
 * API contracts for indicators — Zod schemas.
 */

import { z } from 'zod';

export const indicatorsResponseSchema = z.object({
  lbp: z.number().nullable(),
  weatherBeirut: z.string().nullable(),
  aqi: z.number().nullable(),
});

export type IndicatorsResponse = z.infer<typeof indicatorsResponseSchema>;
