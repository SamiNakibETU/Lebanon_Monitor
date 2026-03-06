# Classification Fix Reference

## The Problem
Israeli airstrikes and Hezbollah military news appear as "Lumière / Culture". This is a CRITICAL bug that makes the entire dashboard meaningless.

## Root Causes

### 1. Default category is "Culture" or "cultural_event"
When the classifier can't determine a category, it defaults to `cultural_event` which is a Lumière category. This means ANY unclassified event gets pushed to the Lumière panel.

**Fix**: Default unclassified events to `neutre` classification, not `lumiere`.

### 2. Missing Arabic conflict vocabulary
Most conflict reporting about Lebanon is in Arabic. The keyword dictionaries lack essential Arabic terms for military operations, casualties, and political violence.

### 3. Weather events classified as Lumière
"Sidon: 13°C, Clear" is a weather report, not a positive event. Weather data should not appear in the event panels.

## Complete Keyword Dictionaries

### Ombre Keywords (all three languages combined)

**Arabic — عربي**:
```
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
```

**French — Français**:
```
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
```

**English**:
```
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
```

### Lumière Keywords

**Arabic**:
```
افتتاح, تدشين, مهرجان, حفل, جائزة, تكريم, إنجاز,
إعمار, إعادة إعمار, بناء, ترميم, مشروع, تنمية,
تبرع, مساعدات, إغاثة, دعم, تضامن,
اتفاق, سلام, هدنة, مصالحة, حوار,
انتخابات, إصلاح, قانون, تشريع, حكومة جديدة,
استثمار, نمو, وظائف, فرص عمل,
ثقافة, فن, معرض, مؤتمر, ندوة
```

**French**:
```
inauguration, cérémonie, festival, concert, exposition, prix, récompense,
reconstruction, réhabilitation, restauration, projet, développement,
don, donation, aide, soutien, solidarité, humanitaire,
accord, paix, trêve, cessez-le-feu, réconciliation, dialogue,
élection, réforme, loi, législation, nouveau gouvernement,
investissement, croissance, emploi, embauche,
culture, art, spectacle, musée, conférence
```

**English**:
```
inauguration, ceremony, festival, concert, exhibition, award, prize,
reconstruction, rehabilitation, renovation, project, development,
donation, aid, support, solidarity, humanitarian,
agreement, peace, ceasefire, truce, reconciliation, dialogue,
election, reform, law, legislation, new government,
investment, growth, job, employment, opportunity,
culture, art, show, museum, conference, summit
```

## Classification Pipeline (corrected)

```
1. PRE-CLASSIFY: Check hard ombre/lumière keywords → if match, return immediately
2. KEYWORD SCORE: Run full dictionary matching → score
3. HF SENTIMENT: Run HF API (if available) → score  
4. GDELT TONE: Use tone from rawData (if available) → score
5. ENSEMBLE: weighted average (keywords 0.35, HF 0.45, tone 0.20)
6. CATEGORY: assign from keyword match context, DEFAULT = based on classification
   - ombre default → 'political_tension'
   - lumiere default → 'institutional_progress'  
   - neutre default → leave as neutre

IMPORTANT: The pre-classifier in step 1 should catch ~60% of Lebanese events.
The ensemble refines the remaining 40%.
```

## Events to EXCLUDE from panels

These should NOT appear as events in Lumière/Ombre panels:
- Weather reports (source === 'weather') → header only
- LBP rate (source === 'lbp-rate') → header only  
- Air quality (source === 'openaq') → header only unless PM2.5 > 100 (crisis level)
- Internet outages (source === 'cloudflare') → show in Ombre only if actual outage detected
- Earthquakes < 2.5 magnitude → skip

These are INDICATORS, not events. Show them in the header bar, not in the event list.
