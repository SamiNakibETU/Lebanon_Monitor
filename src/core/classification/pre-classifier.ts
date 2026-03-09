/**
 * Pre-classifier: hard override for obvious ombre/lumière cases.
 * Catches ~60%+ of Lebanese headlines before the ensemble runs.
 * V2: Negation check — "cessez-le-feu" + "refus" → defer to LLM.
 */

import type { ClassificationResult, OmbreCategory, LumiereCategory } from '../types';

export function inferOmbreCategory(lower: string): OmbreCategory {
  if (['airstrike', 'bombing', 'missile', 'shelling', 'raid', 'frappe', 'bombardement', 'غارة', 'قصف', 'صاروخ', 'air raid', 'raid aérien', 'غارة جوية'].some(k => lower.includes(k))) return 'armed_conflict';
  if (['displaced', 'refugee', 'evacuation', 'نزوح', 'déplacé', 'réfugié', 'نازح', 'نازحين', 'تهجير', 'إخلاء', 'لاجئ'].some(k => lower.includes(k))) return 'displacement';
  if (['killed', 'dead', 'assassination', 'تفجير', 'اغتيال', 'tué', 'attentat', 'mort', 'قتل', 'شهيد', 'شهداء', 'قتيل', 'قتلى', 'assassinat', 'wounded', 'blessé', 'جريح', 'جرحى', 'ضحايا', 'casualties', 'death toll'].some(k => lower.includes(k))) return 'violence';
  if (['currency', 'lbp', 'lira', 'dollar', 'inflation', 'تضخم', 'ليرة', 'économie', 'crisis', 'crise', 'انهيار', 'economic'].some(k => lower.includes(k))) return 'economic_crisis';
  if (['protest', 'manifestation', 'احتجاج', 'مظاهرة', 'political', 'politique', 'سياس'].some(k => lower.includes(k))) return 'political_tension';
  if (['earthquake', 'séisme', 'flood', 'inondation', 'زلزال', 'فيضان', 'fire', 'incendie', 'حريق', 'pollution'].some(k => lower.includes(k))) return 'environmental_negative';
  return 'armed_conflict';
}

export function inferLumiereCategory(lower: string): LumiereCategory {
  if (['festival', 'concert', 'culture', 'exposition', 'musique', 'مهرجان', 'حفل', 'فن', 'théâtre', 'cinéma', 'film', 'spectacle', 'vernissage', 'dance', 'danse'].some(k => lower.includes(k))) return 'cultural_event';
  if (['reconstruction', 'rebuilt', 'reconstruit', 'إعادة إعمار', 'infrastructure', 'بنية تحتية'].some(k => lower.includes(k))) return 'reconstruction';
  if (['donation', 'aid', 'humanitarian', 'solidarity', 'don', 'تبرع', 'مساعدات', 'تضامن', 'aide', 'solidarité'].some(k => lower.includes(k))) return 'solidarity';
  if (['ceasefire', 'peace', 'paix', 'cessez-le-feu', 'وقف إطلاق نار', 'سلام', 'accord', 'agreement', 'اتفاق', 'reform', 'réforme', 'إصلاح', 'government', 'gouvernement', 'حكومة', 'election'].some(k => lower.includes(k))) return 'institutional_progress';
  if (['reforestation', 'planting', 'plantation', 'تشجير', 'environment', 'بيئة', 'green', 'vert'].some(k => lower.includes(k))) return 'environmental_positive';
  if (['tourism', 'tourisme', 'سياحة', 'hotel', 'hôtel', 'فندق', 'investment', 'investissement', 'استثمار'].some(k => lower.includes(k))) return 'economic_positive';
  return 'institutional_progress';
}

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
        category: inferOmbreCategory(lower),
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
      category: inferLumiereCategory(lower),
      method: 'pre-classifier',
    };
  }

  return null;
}
