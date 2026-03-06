/**
 * Translation provider types.
 */

export type LanguageCode = 'ar' | 'fr' | 'en';

export interface TranslationResult {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}

export interface TranslationProvider {
  translate(
    text: string,
    sourceLang: LanguageCode,
    targetLang: LanguageCode
  ): Promise<TranslationResult | null>;

  isAvailable?(): boolean;
}
