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
  if (['festival', 'concert', 'culture', 'exposition', 'musique', 'مهرجان', 'حفل', 'فن', 'théâtre', 'cinéma', 'film', 'spectacle', 'vernissage', 'dance', 'danse', 'art exhibition', 'exposition d\'art', 'معرض فني', 'heritage restoration', 'restauration du patrimoine', 'ترميم التراث', 'cultural revival', 'renaissance culturelle'].some(k => lower.includes(k))) return 'cultural_event';
  if (['reconstruction', 'rebuilt', 'reconstruit', 'إعادة إعمار', 'infrastructure', 'بنية تحتية', 'new school', 'nouvelle école', 'مدرسة جديدة'].some(k => lower.includes(k))) return 'reconstruction';
  if (['donation', 'aid', 'humanitarian', 'solidarity', 'don', 'تبرع', 'مساعدات', 'تضامن', 'aide', 'solidarité'].some(k => lower.includes(k))) return 'solidarity';
  if (['ceasefire', 'peace', 'paix', 'cessez-le-feu', 'وقف إطلاق نار', 'سلام', 'accord', 'agreement', 'اتفاق', 'reform', 'réforme', 'إصلاح', 'government', 'gouvernement', 'حكومة', 'election', 'peacekeeping', 'maintien de la paix', 'women empowerment', 'autonomisation des femmes'].some(k => lower.includes(k))) return 'institutional_progress';
  if (['reforestation', 'planting', 'plantation', 'تشجير', 'environment', 'بيئة', 'green', 'vert', 'tree planting', 'plantation d\'arbres', 'solar energy', 'énergie solaire', 'طاقة شمسية', 'cleanup campaign', 'campagne de nettoyage'].some(k => lower.includes(k))) return 'environmental_positive';
  if (['tourism', 'tourisme', 'سياحة', 'hotel', 'hôtel', 'فندق', 'investment', 'investissement', 'استثمار', 'diaspora', 'startup', 'innovation', 'ابتكار', 'scholarship', 'bourse', 'منحة', 'diaspora investment', 'investissement diaspora', 'tourism record', 'tourisme record', 'سياحة قياسية', 'record exports', 'exportations record'].some(k => lower.includes(k))) return 'economic_positive';
  if (['olympic', 'olympique', 'أولمبي', 'medical breakthrough', 'percée médicale', 'award', 'prize', 'prix', 'جائزة'].some(k => lower.includes(k))) return 'international_recognition';
  return 'institutional_progress';
}

const CRITICAL_KEYWORDS = [
  'airstrike', 'airstrikes', 'bombing', 'bombed', 'missile', 'missiles',
  'shelling', 'killed', 'dead', 'death toll', 'casualties',
  'assassination', 'invasion', 'ground operation', 'air raid',
  'frappe', 'frappes', 'bombardement', 'bombardé',
  'tué', 'tués', 'mort', 'morts', 'victime', 'victimes',
  'attentat', 'assassinat',
  'اجتياح', 'قصف', 'غارة', 'غارات', 'صاروخ', 'صواريخ',
  'قتل', 'قتيل', 'قتلى', 'شهيد', 'شهداء',
  'تفجير', 'انفجار', 'اغتيال', 'عملية عسكرية', 'غارة جوية',
  'الجيش الإسرائيلي', 'استهداف',
];

const HIGH_KEYWORDS = [
  'wounded', 'blessé', 'blessés', 'جريح', 'جرحى', 'ضحايا',
  'explosion', 'blast', 'attacked', 'displaced', 'evacuation', 'evacuated',
  'refugee', 'violation', 'violé',
  'نزوح', 'تهجير', 'إخلاء', 'نازحين', 'لاجئ',
];

const MEDIUM_KEYWORDS = [
  'attack', 'military operation', 'opération militaire', 'raid aérien',
  'hezbollah military', 'idf strike', 'israeli strike',
  'frappe israélienne', 'armée israélienne',
];

const LOW_KEYWORDS = [
  'violated', 'déplacé', 'réfugié', 'protest',
];

function computeSeverityScore(lower: string): number {
  if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) return 0.95;
  if (HIGH_KEYWORDS.some(k => lower.includes(k))) return 0.78;
  if (MEDIUM_KEYWORDS.some(k => lower.includes(k))) return 0.58;
  if (LOW_KEYWORDS.some(k => lower.includes(k))) return 0.38;
  return 0.5;
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
  'reforestation', 'tree planting', 'plantation d\'arbres', 'تشجير',
  'scholarship', 'bourse', 'منحة',
  'startup', 'innovation', 'ابتكار',
  'tourism record', 'tourisme record', 'سياحة قياسية',
  'art exhibition', 'exposition d\'art', 'معرض فني',
  'heritage restoration', 'restauration du patrimoine', 'ترميم التراث',
  'new school', 'nouvelle école', 'مدرسة جديدة',
  'solar energy', 'énergie solaire', 'طاقة شمسية',
  'diaspora investment', 'investissement diaspora',
  'cultural revival', 'renaissance culturelle',
  'women empowerment', 'autonomisation des femmes',
  'cleanup campaign', 'campagne de nettoyage',
  'record exports', 'exportations record',
  'peacekeeping', 'maintien de la paix',
  'medical breakthrough', 'percée médicale',
  'olympic', 'olympique', 'أولمبي',
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
        severity_score: computeSeverityScore(lower),
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
      severity_score: 0.1,
    };
  }

  return null;
}
