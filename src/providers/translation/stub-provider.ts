/**
 * Stub translation provider — returns null (no translation).
 * Replace with NLLB or external API when needed.
 */

import type { TranslationProvider } from './types';

export const stubTranslationProvider: TranslationProvider = {
  translate: async () => null,
  isAvailable: () => false,
};
