/**
 * Pre-classifier: hard override for obvious ombre/lumière cases.
 * Catches ~60%+ of Lebanese headlines before the ensemble runs.
 * V2: Negation check — "cessez-le-feu" + "refus" → defer to LLM.
 */

import type { ClassificationResult } from '../types';

const HARD_OMBRE = [
  'airstrike', 'airstrikes', 'bombing', 'bombed', 'missile', 'missiles',
  'shelling', 'killed', 'dead', 'death toll', 'casualties', 'wounded',
  'attack', 'attacked', 'explosion', 'blast', 'assassination',
  'invasion', 'ground operation', 'military operation', 'air raid',
  'violated', 'violation', 'violé',
  'displaced', 'evacuation', 'evacuated', 'refugee',
  'hezbollah military', 'idf strike', 'israeli strike', 'israeli airstrike',
  'frappe', 'frappes', 'bombardement', 'bombardé', 'missile',
  'tué', 'tués', 'mort', 'morts', 'victime', 'victimes', 'blessé', 'blessés',
  'attentat', 'explosion', 'assassinat',
  'invasion', 'opération militaire', 'raid aérien',
  'déplacé', 'évacuation', 'réfugié',
  'frappe israélienne', 'armée israélienne',
  'قصف', 'غارة', 'غارات', 'صاروخ', 'صواريخ',
  'قتل', 'قتيل', 'قتلى', 'شهيد', 'شهداء', 'جريح', 'جرحى', 'ضحايا',
  'تفجير', 'انفجار', 'اغتيال',
  'اجتياح', 'عملية عسكرية', 'غارة جوية',
  'نزوح', 'تهجير', 'إخلاء', 'نازحين', 'لاجئ',
  'الجيش الإسرائيلي', 'استهداف',
];

const HARD_LUMIERE = [
  'inauguration', 'inaugurated', 'festival', 'concert', 'award', 'prize',
  'reconstruction', 'rebuilt', 'peace agreement', 'ceasefire agreement',
  'donation', 'humanitarian aid received', 'solidarity',
  'new government formed', 'reform passed', 'election results',
  'inauguration', 'inauguré', 'festival', 'concert', 'prix', 'récompense',
  'reconstruction', 'reconstruit', 'accord de paix', 'cessez-le-feu signé',
  'don', 'aide humanitaire reçue', 'solidarité',
  'nouveau gouvernement', 'réforme adoptée',
  'افتتاح', 'تدشين', 'مهرجان', 'حفل', 'جائزة', 'تكريم',
  'إعادة إعمار', 'اتفاق سلام', 'وقف إطلاق نار',
  'تبرع', 'مساعدات', 'تضامن',
  'حكومة جديدة', 'إصلاح',
];

const NEGATION_WORDS = [
  'refus', 'refuse', 'rejet', 'rejeté', 'échec', 'échoué', 'bloqué', 'interrompu',
  'suspendu', 'annulé', 'impossible', 'menace', 'malgré', 'en dépit',
  'refused', 'rejected', 'failed', 'blocked', 'despite', 'threatened', 'stalled',
  'collapsed', 'violated', 'broken',
  'رفض', 'فشل', 'أخفق', 'انهار', 'منع', 'رغم', 'تهديد',
  'violé', 'violation', 'violation',
];

/**
 * Checks text against hard ombre/lumière keywords. Returns immediately if match.
 * V2: Negation check — if HARD_LUMIERE + negation → null (defer to LLM).
 * HARD_OMBRE always wins.
 */
export function preClassify(text: string): ClassificationResult | null {
  const lower = text.toLowerCase();

  for (const kw of HARD_OMBRE) {
    if (lower.includes(kw.toLowerCase())) {
      return {
        classification: 'ombre',
        confidence: 0.95,
        category: 'armed_conflict',
        method: 'pre-classifier',
      };
    }
  }

  const hasLumiere = HARD_LUMIERE.some((kw) => lower.includes(kw.toLowerCase()));
  const hasNegation = NEGATION_WORDS.some((kw) => lower.includes(kw.toLowerCase()));

  if (hasLumiere && hasNegation) {
    return null;
  }

  if (hasLumiere) {
    return {
      classification: 'lumiere',
      confidence: 0.9,
      category: 'institutional_progress',
      method: 'pre-classifier',
    };
  }

  return null;
}
