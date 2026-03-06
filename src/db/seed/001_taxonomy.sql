-- Seed taxonomy labels (from docs/TAXONOMY.md)
-- Run manually after migrations: psql $DATABASE_URL -f src/db/seed/001_taxonomy.sql

INSERT INTO taxonomy_label (code, parent_code, label_fr, label_en, label_ar, depth) VALUES
-- A. sécurité / conflit
('security.strike', 'security', 'Frappe / bombardement', 'Strike / bombing', 'daraba', 2),
('security.exchange', 'security', 'Échange de tirs', 'Exchange of fire', 'tadakhul', 2),
('security.assassination', 'security', 'Assassinat / attaque ciblée', 'Assassination / targeted attack', 'ightiyal', 2),
('security.border', 'security', 'Incident frontalier', 'Border incident', 'hadud', 2),
('security.military', 'security', 'Incident militaire', 'Military incident', 'askari', 2),
('security.explosion', 'security', 'Explosion', 'Explosion', 'infijar', 2),
('security.kidnapping', 'security', 'Enlèvement', 'Kidnapping', 'ikhtatif', 2),
('security.cyber', 'security', 'Cyberattaque', 'Cyberattack', 'siber', 2),
('security.outage', 'security', 'Panne critique', 'Critical outage', 'taqattu', 2),
('security', NULL, 'Sécurité / conflit', 'Security / conflict', 'amn', 1),

-- B. politique / institutionnel
('politics.government', 'politics', 'Gouvernement', 'Government', 'hukuma', 2),
('politics.parliament', 'politics', 'Parlement', 'Parliament', 'majlis', 2),
('politics.party', 'politics', 'Parti politique', 'Political party', 'hizb', 2),
('politics.nomination', 'politics', 'Nomination', 'Nomination', 'tansib', 2),
('politics.negotiation', 'politics', 'Négociation', 'Negotiation', 'mufawadat', 2),
('politics.reform', 'politics', 'Réforme', 'Reform', 'islah', 2),
('politics.corruption', 'politics', 'Corruption / scandale', 'Corruption / scandal', 'fasad', 2),
('politics.justice', 'politics', 'Justice / décision', 'Justice / decision', 'adala', 2),
('politics.diplomacy', 'politics', 'Diplomatie', 'Diplomacy', 'diplomasi', 2),
('politics', NULL, 'Politique / institutionnel', 'Politics / institutional', 'siyasa', 1),

-- C. économie / finance
('economy.currency', 'economy', 'Monnaie', 'Currency', 'muta''addil', 2),
('economy.inflation', 'economy', 'Inflation', 'Inflation', 'tadaffuq', 2),
('economy.bank', 'economy', 'Banque', 'Bank', 'masraf', 2),
('economy.energy', 'economy', 'Énergie', 'Energy', 'taka', 2),
('economy.commerce', 'economy', 'Commerce', 'Commerce', 'tijara', 2),
('economy.investment', 'economy', 'Investissement', 'Investment', 'istithmar', 2),
('economy.sanctions', 'economy', 'Sanctions', 'Sanctions', 'uqubat', 2),
('economy.employment', 'economy', 'Emploi', 'Employment', 'wazifa', 2),
('economy.transport', 'economy', 'Transport / port / logistique', 'Transport / port / logistics', 'naql', 2),
('economy', NULL, 'Économie / finance', 'Economy / finance', 'iqtisad', 1),

-- D. société / humanitaire
('society.displacement', 'society', 'Déplacement', 'Displacement', 'nuzuh', 2),
('society.aid', 'society', 'Aide', 'Aid', 'musa''ada', 2),
('society.health', 'society', 'Santé', 'Health', 'sihha', 2),
('society.education', 'society', 'Éducation', 'Education', 'tarbiya', 2),
('society.ngo', 'society', 'ONG', 'NGO', 'ghayr hukumi', 2),
('society.cohesion', 'society', 'Cohésion sociale', 'Social cohesion', 'wahda', 2),
('society.crisis', 'society', 'Crise humanitaire', 'Humanitarian crisis', 'azma', 2),
('society', NULL, 'Société / humanitaire', 'Society / humanitarian', 'mujtama', 1),

-- E. environnement / risque
('environment.fire', 'environment', 'Incendie', 'Fire', 'harq', 2),
('environment.earthquake', 'environment', 'Séisme', 'Earthquake', 'zalzala', 2),
('environment.pollution', 'environment', 'Pollution', 'Pollution', 'talawwuth', 2),
('environment.weather', 'environment', 'Météo extrême', 'Extreme weather', 'jaw', 2),
('environment.water', 'environment', 'Eau', 'Water', 'mayya', 2),
('environment.disaster', 'environment', 'Catastrophe naturelle', 'Natural disaster', 'karitha', 2),
('environment', NULL, 'Environnement / risque', 'Environment / risk', 'bi''a', 1),

-- F. culture / sport / innovation
('culture.event', 'culture', 'Culture', 'Culture', 'thaqafa', 2),
('culture.heritage', 'culture', 'Patrimoine', 'Heritage', 'turath', 2),
('culture.festival', 'culture', 'Festival', 'Festival', 'mihrajan', 2),
('culture.university', 'culture', 'Université', 'University', 'jamia', 2),
('culture.startup', 'culture', 'Startup / tech', 'Startup / tech', 'nasha', 2),
('culture.sport', 'culture', 'Sport', 'Sport', 'riyada', 2),
('culture', NULL, 'Culture / sport / innovation', 'Culture / sport / innovation', 'thaqafa', 1)
ON CONFLICT (code) DO NOTHING;
