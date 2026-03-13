/**
 * Retrieval query schema — structured params for analyst/agent retrieval.
 * Relationnel, temporel, géospatial léger. No embeddings/vector.
 */

import { z } from 'zod';

export const retrievalQuerySchema = z.object({
  q: z.string().max(300).optional(),
  objectTypes: z
    .enum(['events', 'episodes', 'places', 'actors'])
    .array()
    .optional()
    .default(['events']),
  placeId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(30),
  offset: z.coerce.number().min(0).optional().default(0),
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),
});

export type RetrievalQuery = z.infer<typeof retrievalQuerySchema>;
