/**
 * Geo-quality API contract — unified spatial metadata for events and episodes.
 */

import { z } from 'zod';

export const geoPrecisionSchema = z.enum([
  'exact_point',
  'neighborhood',
  'city',
  'district',
  'governorate',
  'country',
  'inferred',
  'unknown',
]);

export const geoMethodSchema = z.enum([
  'source_exact',
  'gazetteer',
  'llm',
  'inferred',
  'unknown',
]);

export const geoQualitySchema = z.object({
  precision: geoPrecisionSchema,
  method: geoMethodSchema,
  uncertaintyRadiusM: z.number().nullable(),
  resolvedPlaceName: z.string().nullable(),
  admin1: z.string().nullable(),
  geocodeConfidence: z.number().nullable(),
  /** Episode-only: aggregated footprint from constituent events. */
  footprintGeojson: z.unknown().nullable().optional(),
});

export type GeoQuality = z.infer<typeof geoQualitySchema>;
