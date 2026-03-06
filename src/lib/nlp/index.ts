/**
 * NLP module for enhanced classification.
 */

export { detectLanguage } from './language-detect';
export type { DetectedLanguage } from './language-detect';
export { createLruCache } from './cache';
export { classifyWithHF, classifyBatch } from './huggingface';
export type { HFSentimentResult } from './huggingface';
export { classifyEnhanced } from './classifier-enhanced';
export type { EnhancedClassificationInput, EnhancedClassificationResult } from './classifier-enhanced';
export { extractEntities } from './entity-extract';
export type { ExtractedEntities } from './entity-extract';
