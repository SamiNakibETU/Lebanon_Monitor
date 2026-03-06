/**
 * Language detection provider types.
 */

export type LanguageCode = 'ar' | 'fr' | 'en';

export interface LanguageDetectionResult {
  language: LanguageCode;
  confidence: number;
}

export interface LanguageDetectionProvider {
  detect(text: string): Promise<LanguageDetectionResult>;
  detectSync?(text: string): LanguageDetectionResult;
}
