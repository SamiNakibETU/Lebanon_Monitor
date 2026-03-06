# Test Cases — Classification & Deduplication

## Classification Test Cases (50 total)

Each test: `{ input: string, expected: Classification, note: string }`

### Ombre — Arabic (10 cases)

```json
[
  {"input": "قصف إسرائيلي يستهدف الضاحية الجنوبية في بيروت", "expected": "ombre", "note": "Israeli bombing of Dahieh"},
  {"input": "غارات جوية على بعلبك وعدد من البلدات الجنوبية", "expected": "ombre", "note": "Airstrikes on Baalbek"},
  {"input": "سقوط 12 شهيداً و30 جريحاً في القصف على صور", "expected": "ombre", "note": "12 killed in Tyre bombing"},
  {"input": "نزوح عشرات الآلاف من سكان الجنوب اللبناني", "expected": "ombre", "note": "Mass displacement from south"},
  {"input": "انفجار ضخم يهز منطقة المرفأ في بيروت", "expected": "ombre", "note": "Massive explosion at port"},
  {"input": "الحرس الثوري يعلن بدء موجة جديدة من الصواريخ", "expected": "ombre", "note": "IRGC missiles"},
  {"input": "تفجير سيارة مفخخة في طرابلس يوقع إصابات", "expected": "ombre", "note": "Car bomb Tripoli"},
  {"input": "اشتباكات عنيفة بين مسلحين في عين الحلوة", "expected": "ombre", "note": "Clashes Ain al-Hilweh"},
  {"input": "أزمة اقتصادية خانقة وانهيار الليرة اللبنانية", "expected": "ombre", "note": "Economic crisis LBP collapse"},
  {"input": "احتجاجات واسعة في ساحة الشهداء ضد الفساد", "expected": "ombre", "note": "Protests against corruption"}
]
```

### Ombre — French (10 cases)

```json
[
  {"input": "Deux frappes israéliennes ont touché la banlieue sud de Beyrouth", "expected": "ombre", "note": "Israeli strikes Dahieh"},
  {"input": "L'armée israélienne bombarde des infrastructures du Hezbollah", "expected": "ombre", "note": "IDF bombs Hezbollah infrastructure"},
  {"input": "Cinq morts et vingt blessés dans un raid aérien sur Baalbek", "expected": "ombre", "note": "5 dead Baalbek raid"},
  {"input": "Évacuation massive de la population du sud-Liban", "expected": "ombre", "note": "Mass evacuation south"},
  {"input": "Crise économique : la livre libanaise atteint un nouveau record", "expected": "ombre", "note": "Economic crisis LBP"},
  {"input": "Manifestation violente devant le parlement à Beyrouth", "expected": "ombre", "note": "Violent protest parliament"},
  {"input": "Pénurie de médicaments dans les hôpitaux libanais", "expected": "ombre", "note": "Medicine shortage hospitals"},
  {"input": "Attentat à la voiture piégée dans le quartier de Hamra", "expected": "ombre", "note": "Car bomb Hamra"},
  {"input": "Le Hezbollah tire des roquettes vers le nord d'Israël", "expected": "ombre", "note": "Hezbollah rockets"},
  {"input": "Coupure totale d'électricité dans tout le pays depuis 48 heures", "expected": "ombre", "note": "Total power outage"}
]
```

### Ombre — English (10 cases)

```json
[
  {"input": "Israeli Airstrikes Target West Baalbek, Several Southern Towns", "expected": "ombre", "note": "Airstrikes"},
  {"input": "Cabinet Orders Immediate Ban on Hezbollah Military Activity", "expected": "ombre", "note": "Hezbollah ban — political tension"},
  {"input": "Lebanon: Tens of thousands displaced ahead of fresh Israeli strikes", "expected": "ombre", "note": "Displacement"},
  {"input": "Explosion rocks Beirut southern suburbs, multiple casualties reported", "expected": "ombre", "note": "Explosion casualties"},
  {"input": "Lebanese pound crashes to new low amid deepening economic crisis", "expected": "ombre", "note": "Economic collapse"},
  {"input": "Deadly clashes between armed groups in Tripoli", "expected": "ombre", "note": "Armed clashes"},
  {"input": "Internet blackout reported across Lebanon following infrastructure damage", "expected": "ombre", "note": "Internet outage"},
  {"input": "UN warns of humanitarian catastrophe in Lebanon", "expected": "ombre", "note": "UN warning"},
  {"input": "Israeli ground invasion of south Lebanon begins", "expected": "ombre", "note": "Ground invasion"},
  {"input": "Assassination of political figure in Beirut car bombing", "expected": "ombre", "note": "Assassination"}
]
```

### Lumière — Mixed languages (10 cases)

```json
[
  {"input": "Inauguration d'un nouveau centre culturel à Beyrouth", "expected": "lumiere", "note": "Cultural center inauguration FR"},
  {"input": "افتتاح مهرجان بيروت الدولي للسينما", "expected": "lumiere", "note": "Beirut film festival AR"},
  {"input": "Lebanon receives $500M in humanitarian aid from international donors", "expected": "lumiere", "note": "Humanitarian aid EN"},
  {"input": "اتفاق لوقف إطلاق النار بين الأطراف المتنازعة", "expected": "lumiere", "note": "Ceasefire agreement AR"},
  {"input": "Reconstruction de l'autoroute Beyrouth-Tripoli achevée", "expected": "lumiere", "note": "Highway reconstruction FR"},
  {"input": "New government formed after months of political negotiations", "expected": "lumiere", "note": "New government EN"},
  {"input": "حكومة لبنانية جديدة تنال ثقة البرلمان", "expected": "lumiere", "note": "Parliament confidence AR"},
  {"input": "Festival international de Baalbek : retour après deux ans d'absence", "expected": "lumiere", "note": "Baalbek festival FR"},
  {"input": "Lebanon's economy shows first signs of recovery with GDP growth", "expected": "lumiere", "note": "GDP growth EN"},
  {"input": "تبرع بمليون دولار لإعادة إعمار مرفأ بيروت", "expected": "lumiere", "note": "Port reconstruction donation AR"}
]
```

### Edge Cases / Neutre (10 cases)

```json
[
  {"input": "مؤتمر صحفي لوزير الخارجية اللبناني", "expected": "neutre", "note": "Press conference — informational AR"},
  {"input": "Le parlement libanais examine un projet de loi budgétaire", "expected": "neutre", "note": "Parliament examines budget — process FR"},
  {"input": "Lebanon's central bank releases monthly economic figures", "expected": "neutre", "note": "Economic figures — neutral EN"},
  {"input": "Macron tente d'obtenir un cessez-le-feu mais se heurte au refus israélien", "expected": "ombre", "note": "Ceasefire refused = negative FR"},
  {"input": "Gemayel: Lebanon must reinforce cabinet ban on Hezbollah's military role", "expected": "ombre", "note": "Political tension about Hezbollah EN"},
  {"input": "Weather forecast: sunny skies expected in Beirut this week", "expected": "neutre", "note": "Weather — should NOT be in events at all"},
  {"input": "Lebanon 24 news report with link to lebanon24.com article", "expected": "neutre", "note": "Generic news link — no clear signal"},
  {"input": "EXCLUSIF : le président Macron tente un cessez-le-feu au Liban", "expected": "lumiere", "note": "Peace effort FR — lumiere because initiative"},
  {"input": "PM Nawaf Salam inspects Disaster and Crisis Management Room", "expected": "neutre", "note": "PM routine activity EN"},
  {"input": "ترامب: لم يكن أمامنا خيار سوى ضرب إيران", "expected": "ombre", "note": "Trump: had to strike Iran AR — conflict"}
]
```

---

## Deduplication Test Cases (10 cases)

```json
[
  {
    "name": "Exact duplicate tweets",
    "events": [
      {"id": "tw-1", "title": "قصف إسرائيلي يستهدف الضاحية الجنوبية", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-2", "title": "قصف إسرائيلي يستهدف الضاحية الجنوبية", "source": "twitter", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "note": "Identical tweets → keep one"
  },
  {
    "name": "Same event from Twitter and RSS",
    "events": [
      {"id": "tw-1", "title": "Israeli airstrikes target Baalbek", "source": "twitter", "date": "2025-03-05"},
      {"id": "rss-1", "title": "Israeli Airstrikes Target Baalbek", "source": "rss", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "expectedSource": "rss",
    "note": "Same story → keep RSS (higher priority)"
  },
  {
    "name": "Similar titles (Jaccard > 0.6)",
    "events": [
      {"id": "rss-1", "title": "Lebanon receives 500 million in humanitarian aid", "source": "rss", "date": "2025-03-05"},
      {"id": "gdelt-1", "title": "Lebanon receives $500M humanitarian aid from donors", "source": "gdelt", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "note": "Near-duplicate → merge"
  },
  {
    "name": "Different events same day",
    "events": [
      {"id": "rss-1", "title": "Israeli airstrikes target Baalbek", "source": "rss", "date": "2025-03-05"},
      {"id": "rss-2", "title": "New government formed in Lebanon", "source": "rss", "date": "2025-03-05"}
    ],
    "expectedCount": 2,
    "note": "Different topics → keep both"
  },
  {
    "name": "Same title different days",
    "events": [
      {"id": "rss-1", "title": "Protests continue in Beirut", "source": "rss", "date": "2025-03-04"},
      {"id": "rss-2", "title": "Protests continue in Beirut", "source": "rss", "date": "2025-03-05"}
    ],
    "expectedCount": 2,
    "note": "Same title but different days → keep both"
  },
  {
    "name": "Five identical tweets",
    "events": [
      {"id": "tw-1", "title": "Breaking news: explosion in Beirut", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-2", "title": "Breaking news: explosion in Beirut", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-3", "title": "Breaking news: explosion in Beirut", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-4", "title": "Breaking news: explosion in Beirut", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-5", "title": "Breaking news: explosion in Beirut", "source": "twitter", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "note": "5 dupes → 1"
  },
  {
    "name": "Arabic near-duplicate with slight variation",
    "events": [
      {"id": "tw-1", "title": "غارات إسرائيلية على جنوب لبنان تخلف عشرات القتلى", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-2", "title": "غارات إسرائيلية على جنوب لبنان تخلف عشرات القتلى والجرحى", "source": "twitter", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "note": "Near-identical Arabic text → merge"
  },
  {
    "name": "URL in title doesn't affect dedup",
    "events": [
      {"id": "tw-1", "title": "قصف بيروت https://t.co/abc123", "source": "twitter", "date": "2025-03-05"},
      {"id": "tw-2", "title": "قصف بيروت https://t.co/xyz789", "source": "twitter", "date": "2025-03-05"}
    ],
    "expectedCount": 1,
    "note": "Same text with different URLs → merge"
  },
  {
    "name": "GDELT and Twitter same story",
    "events": [
      {"id": "gdelt-1", "title": "Cabinet Orders Immediate Ban on Hezbollah Military Activity", "source": "gdelt", "date": "2025-03-02"},
      {"id": "tw-1", "title": "Cabinet orders immediate ban on Hezbollah military activity, launches weapons restriction plan", "source": "twitter", "date": "2025-03-02"}
    ],
    "expectedCount": 1,
    "expectedSource": "gdelt",
    "note": "Cross-source dedup → keep GDELT (higher priority than Twitter)"
  },
  {
    "name": "Different languages same event",
    "events": [
      {"id": "rss-1", "title": "Israeli airstrikes target southern Lebanon", "source": "rss", "date": "2025-03-05"},
      {"id": "tw-1", "title": "غارات إسرائيلية تستهدف جنوب لبنان", "source": "twitter", "date": "2025-03-05"}
    ],
    "expectedCount": 2,
    "note": "Same event different languages → keep both (Jaccard too low across languages)"
  }
]
```

---

## Language Detection Test Cases (5 cases)

```json
[
  {"input": "قصف إسرائيلي يستهدف الضاحية", "expected": "ar"},
  {"input": "L'armée israélienne bombarde le sud-Liban", "expected": "fr"},
  {"input": "Israeli airstrikes target southern Lebanon", "expected": "en"},
  {"input": "#lebanon24 ترامب: لم يكن أمامنا خيار سوى ضرب إيران", "expected": "ar", "note": "Mixed but mostly Arabic"},
  {"input": "Le Hezbollah tire des roquettes", "expected": "fr"}
]
```
