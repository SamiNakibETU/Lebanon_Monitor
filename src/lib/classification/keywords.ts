/**
 * Lumière/Ombre keyword dictionaries for classification.
 * Complete dictionaries from CLASSIFICATION_FIX.md — Arabic, French, English.
 */

const parse = (s: string) =>
  s
    .split(/[,،]/)
    .map((x) => x.trim())
    .filter(Boolean);

export const OMBRE_KEYWORDS = {
  ar: parse(`
    قصف, غارة, غارات, صاروخ, صواريخ, اشتباك, اشتباكات, انفجار, تفجير,
    شهيد, شهداء, قتيل, قتلى, جريح, جرحى, ضحية, ضحايا, مجزرة,
    نزوح, تهجير, لاجئ, لاجئين, نازح, نازحين,
    دمار, تدمير, حرب, عدوان, اجتياح, احتلال, عملية عسكرية,
    قنبلة, قنابل, مدفعية, طائرة حربية, درون, مسيّرة,
    استهداف, هجوم, هجمات, إرهاب, إرهابي,
    حزب الله, ميليشيا, مقاومة, جيش, عسكري, عسكرية,
    أزمة, انهيار, فساد, سرقة, اختلاس, رشوة,
    احتجاج, احتجاجات, مظاهرة, مظاهرات, اعتصام,
    فقر, بطالة, تضخم, غلاء, انقطاع, كهرباء, مياه,
    حصار, عقوبات, حظر,
    إسرائيل, إسرائيلي, إسرائيلية, صهيوني,
    الجيش الإسرائيلي, سلاح الجو, قوات الاحتلال,
    الضاحية الجنوبية, بعلبك, الجنوب اللبناني
  `),
  fr: parse(`
    bombardement, frappe, frappes, missile, missiles, roquette, roquettes,
    attentat, explosion, explosions, tir, tirs, obus, artillerie,
    victime, victimes, blessé, blessés, tué, tués, mort, morts, décès,
    déplacé, déplacés, réfugié, réfugiés, évacuation, évacué,
    conflit, guerre, agression, invasion, incursion, offensive,
    militaire, armée, soldat, soldats, opération militaire,
    Hezbollah, milice, milices, combattant, combattants,
    raid, raid aérien, raids aériens, frappe aérienne, frappes aériennes,
    dégâts, destruction, ruines, décombres,
    crise, effondrement, corruption, détournement,
    manifestation, manifestations, émeute, émeutes, protestation,
    pénurie, rationnement, coupure, délestage,
    israélien, israélienne, israéliens, Israël, Tsahal, IDF,
    banlieue sud, sud-Liban, Dahieh, Baalbek,
    embargo, sanctions, blocus
  `),
  en: parse(`
    airstrike, airstrikes, bombing, bombings, missile, missiles, rocket, rockets,
    shelling, shell, artillery, mortar, drone, drones,
    explosion, explosions, blast, detonation,
    attack, attacks, assault, offensive, raid, raids, incursion, invasion,
    casualty, casualties, killed, dead, death, deaths, wounded, injured,
    victim, victims, martyr, martyrs, fatality, fatalities,
    displaced, displacement, refugee, refugees, evacuee, evacuation,
    conflict, war, warfare, hostility, hostilities, violence, violent,
    military, army, soldier, soldiers, troop, troops, operation,
    Hezbollah, militia, fighter, fighters, combatant,
    IDF, Israeli, Israel, occupation, occupation forces,
    destruction, damage, devastation, rubble, ruins,
    crisis, collapse, corruption, embezzlement,
    protest, protests, riot, riots, demonstration, unrest,
    shortage, blackout, power outage, outage,
    southern suburbs, south Lebanon, Dahieh, Baalbek,
    sanctions, embargo, blockade,
    ceasefire violation, ground invasion, air raid, air defense,
    intercepted, siren, alert, warning, shelter,
    ban, weapons, arms, ammunition, arsenal
  `),
};

export const LUMIERE_KEYWORDS = {
  ar: parse(`
    افتتاح, تدشين, مهرجان, حفل, جائزة, تكريم, إنجاز,
    إعمار, إعادة إعمار, بناء, ترميم, مشروع, تنمية,
    تبرع, مساعدات, إغاثة, دعم, تضامن,
    اتفاق, سلام, هدنة, مصالحة, حوار,
    انتخابات, إصلاح, قانون, تشريع, حكومة جديدة,
    استثمار, نمو, وظائف, فرص عمل,
    ثقافة, فن, معرض, مؤتمر, ندوة
  `),
  fr: parse(`
    inauguration, cérémonie, festival, concert, exposition, prix, récompense,
    reconstruction, réhabilitation, restauration, projet, développement,
    don, donation, aide, soutien, solidarité, humanitaire,
    accord, paix, trêve, cessez-le-feu, réconciliation, dialogue,
    élection, réforme, loi, législation, nouveau gouvernement,
    investissement, croissance, emploi, embauche,
    culture, art, spectacle, musée, conférence
  `),
  en: parse(`
    inauguration, ceremony, festival, concert, exhibition, award, prize,
    reconstruction, rehabilitation, renovation, project, development,
    donation, aid, support, solidarity, humanitarian,
    agreement, peace, ceasefire, truce, reconciliation, dialogue,
    election, reform, law, legislation, new government,
    investment, growth, job, employment, opportunity,
    culture, art, show, museum, conference, summit
  `),
};

export type Language = keyof typeof LUMIERE_KEYWORDS;

export function getAllLumiereKeywords(): string[] {
  return [
    ...LUMIERE_KEYWORDS.en,
    ...LUMIERE_KEYWORDS.fr,
    ...LUMIERE_KEYWORDS.ar,
  ];
}

export function getAllOmbreKeywords(): string[] {
  return [
    ...OMBRE_KEYWORDS.en,
    ...OMBRE_KEYWORDS.fr,
    ...OMBRE_KEYWORDS.ar,
  ];
}

/** Hard ombre keywords — trigger immediate ombre classification (pre-classifier). */
export const HARD_OMBRE_KEYWORDS = [
  'airstrike', 'airstrikes', 'bombing', 'bombings', 'missile', 'attack', 'attacks',
  'killed', 'dead', 'frappe', 'bombardement', 'tué', 'victime', 'victim',
  'قصف', 'غارة', 'صاروخ', 'شهيد', 'قتيل', 'انفجار', 'تفجير',
  'hezbollah military', 'israeli strike', 'evacuation', 'évacuation',
  'shelling', 'rocket', 'rockets', 'drone', 'drones', 'invasion',
];

/** Hard lumière keywords — trigger immediate lumière classification (pre-classifier). */
export const HARD_LUMIERE_KEYWORDS = [
  'inauguration', 'festival', 'award', 'reconstruction', 'donation',
  'prix', 'recompense', 'accord', 'peace', 'paix', 'dialogue',
  'افتتاح', 'مهرجان', 'جائزة', 'إعمار', 'تبرع', 'اتفاق', 'سلام',
  'réconciliation', 'ceasefire', 'cessez-le-feu', 'trêve',
];
