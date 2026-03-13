/**
 * Agent request/response schemas.
 */

import { z } from 'zod';

export const agentSynthesisRequestSchema = z.object({
  query: z.string().min(1).max(500),
  contextHint: z.enum(['events', 'episodes', 'places', 'actors', 'vitality']).optional(),
});

export const agentExploreRequestSchema = z.object({
  query: z.string().min(1).max(500),
  focus: z.enum(['place', 'actor', 'episode', 'vitality']).optional(),
  id: z.string().uuid().optional(),
});

export const agentResponseSchema = z.object({
  content: z.string(),
  citations: z.array(z.string()),
  uncertainty: z.string().optional(),
  truncated: z.boolean().optional(),
});

export type AgentSynthesisRequest = z.infer<typeof agentSynthesisRequestSchema>;
export type AgentExploreRequest = z.infer<typeof agentExploreRequestSchema>;
export type AgentResponse = z.infer<typeof agentResponseSchema>;
