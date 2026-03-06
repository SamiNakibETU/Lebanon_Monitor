# Taxonomy — Lebanon Monitor

**Version**: 1.0  
**Date**: 2025-03-06

---

## 1. Structure hiérarchique

### A. sécurité / conflit

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| security.strike | Frappe / bombardement | Strike / bombing | daraba |
| security.exchange | Échange de tirs | Exchange of fire | tadakhul |
| security.assassination | Assassinat / attaque ciblée | Assassination / targeted attack | ightiyal |
| security.border | Incident frontalier | Border incident | hadud |
| security.military | Incident militaire | Military incident | askari |
| security.explosion | Explosion | Explosion | infijar |
| security.kidnapping | Enlèvement | Kidnapping | ikhtatif |
| security.cyber | Cyberattaque | Cyberattack | siber |
| security.outage | Panne critique | Critical outage | taqattu |

### B. politique / institutionnel

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| politics.government | Gouvernement | Government | hukuma |
| politics.parliament | Parlement | Parliament | majlis |
| politics.party | Parti politique | Political party | hizb |
| politics.nomination | Nomination | Nomination | tansib |
| politics.negotiation | Négociation | Negotiation | mufawadat |
| politics.reform | Réforme | Reform | islah |
| politics.corruption | Corruption / scandale | Corruption / scandal | fasad |
| politics.justice | Justice / décision | Justice / decision | adala |
| politics.diplomacy | Diplomatie | Diplomacy | diplomasi |

### C. économie / finance

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| economy.currency | Monnaie | Currency | muta'addil |
| economy.inflation | Inflation | Inflation | tadaffuq |
| economy.bank | Banque | Bank | masraf |
| economy.energy | Énergie | Energy | taka |
| economy.commerce | Commerce | Commerce | tijara |
| economy.investment | Investissement | Investment | istithmar |
| economy.sanctions | Sanctions | Sanctions | 'uqubat |
| economy.employment | Emploi | Employment | wazifa |
| economy.transport | Transport / port / logistique | Transport / port / logistics | naql |

### D. société / humanitaire

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| society.displacement | Déplacement | Displacement | nuzuh |
| society.aid | Aide | Aid | musa'ada |
| society.health | Santé | Health | sihha |
| society.education | Éducation | Education | tarbiya |
| society.ngo | ONG | NGO | ghayr hukumi |
| society.cohesion | Cohésion sociale | Social cohesion | wahda |
| society.crisis | Crise humanitaire | Humanitarian crisis | azma |

### E. environnement / risque

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| environment.fire | Incendie | Fire | harq |
| environment.earthquake | Séisme | Earthquake | zalzala |
| environment.pollution | Pollution | Pollution | talawwuth |
| environment.weather | Météo extrême | Extreme weather | jaw |
| environment.water | Eau | Water | mayya |
| environment.disaster | Catastrophe naturelle | Natural disaster | karitha |

### F. culture / sport / innovation

| Code | FR | EN | AR (translit) |
|------|----|----|----------------|
| culture.event | Culture | Culture | thaqafa |
| culture.heritage | Patrimoine | Heritage | turath |
| culture.festival | Festival | Festival | mihrajan |
| culture.university | Université | University | jamia |
| culture.startup | Startup / tech | Startup / tech | nash'a |
| culture.sport | Sport | Sport | riyada |

---

## 2. Champs parallèles (conservés)

### polarity_ui
- `lumiere`
- `ombre`
- `neutre`

### impact_level
- `faible`
- `moyen`
- `fort`
- `critique`

### confidence_level
- `faible`
- `moyen`
- `fort`

### verification_status
- `unverified`
- `partially_verified`
- `verified`
- `disputed`

---

## 3. Mapping depuis catégories existantes

| Existant | Nouveau (taxonomie) |
|----------|---------------------|
| armed_conflict | security.* |
| economic_crisis | economy.inflation, economy.currency |
| political_tension | politics.* |
| displacement | society.displacement |
| infrastructure_failure | security.outage, economy.energy |
| environmental_negative | environment.* |
| disinformation | politics.corruption (ou nouveau) |
| violence | security.* |
| cultural_event | culture.event |
| reconstruction | politics.reform, society.aid |
| institutional_progress | politics.government |
| solidarity | society.cohesion |
| economic_positive | economy.* |
| international_recognition | politics.diplomacy |
| environmental_positive | environment.* |
