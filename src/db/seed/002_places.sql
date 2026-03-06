-- Seed places (gazetteer) for Lebanon Monitor
-- Run after migrations: psql $DATABASE_URL -f src/db/seed/002_places.sql

-- Cities
INSERT INTO place (name_primary, name_ar, name_fr, name_en, place_type, geometry) VALUES
('Beirut', 'بيروت', 'Beyrouth', 'Beirut', 'city', ST_SetSRID(ST_MakePoint(35.5018, 33.8938), 4326)),
('Tripoli', 'طرابلس', 'Tripoli', 'Tripoli', 'city', ST_SetSRID(ST_MakePoint(35.8498, 34.4332), 4326)),
('Sidon', 'صيدا', 'Sidon', 'Sidon', 'city', ST_SetSRID(ST_MakePoint(35.3729, 33.5571), 4326)),
('Tyre', 'صور', 'Tyr', 'Tyre', 'city', ST_SetSRID(ST_MakePoint(35.2038, 33.2705), 4326)),
('Baalbek', 'بعلبك', 'Baalbek', 'Baalbek', 'city', ST_SetSRID(ST_MakePoint(36.211, 34.0047), 4326)),
('Jounieh', 'جونيه', 'Jounieh', 'Jounieh', 'city', ST_SetSRID(ST_MakePoint(35.6178, 33.9808), 4326)),
('Zahle', 'زحلة', 'Zahlé', 'Zahle', 'city', ST_SetSRID(ST_MakePoint(35.902, 33.8463), 4326)),
('Nabatieh', 'النبطية', 'Nabatieh', 'Nabatieh', 'city', ST_SetSRID(ST_MakePoint(35.4839, 33.3779), 4326)),
('Byblos', 'جبيل', 'Byblos', 'Byblos', 'city', ST_SetSRID(ST_MakePoint(35.6511, 34.1236), 4326)),
('Dahieh', 'الضاحية', 'Dahiyeh', 'Dahieh', 'neighborhood', ST_SetSRID(ST_MakePoint(35.5024, 33.8547), 4326)),
('South Lebanon', 'جنوب لبنان', 'Sud-Liban', 'South Lebanon', 'governorate', ST_SetSRID(ST_MakePoint(35.4, 33.27), 4326)),
('Bekaa', 'البقاع', 'Bekaa', 'Bekaa', 'governorate', ST_SetSRID(ST_MakePoint(36.0, 33.85), 4326)),
('Akkar', 'عكار', 'Akkar', 'Akkar', 'governorate', ST_SetSRID(ST_MakePoint(36.1, 34.55), 4326)),
('Mount Lebanon', 'جبل لبنان', 'Mont-Liban', 'Mount Lebanon', 'governorate', ST_SetSRID(ST_MakePoint(35.6, 33.85), 4326)),
('North Lebanon', 'شمال لبنان', 'Nord-Liban', 'North Lebanon', 'governorate', ST_SetSRID(ST_MakePoint(35.8, 34.35), 4326)),
('Lebanon', 'لبنان', 'Liban', 'Lebanon', 'country', ST_SetSRID(ST_MakePoint(35.5018, 33.8938), 4326));

-- Place aliases (for resolution)
INSERT INTO place_alias (place_id, alias, language, alias_type)
SELECT p.id, a.alias, a.lang, 'canonical'
FROM place p
CROSS JOIN (VALUES
  ('Beirut', 'beirut', 'en'), ('Beirut', 'beyrouth', 'fr'), ('Beirut', 'بيروت', 'ar'),
  ('Tripoli', 'tripoli', 'en'), ('Tripoli', 'طرابلس', 'ar'), ('Tripoli', 'trablos', 'en'),
  ('Sidon', 'sidon', 'en'), ('Sidon', 'saida', 'fr'), ('Sidon', 'صيدا', 'ar'),
  ('Tyre', 'tyre', 'en'), ('Tyre', 'tyr', 'fr'), ('Tyre', 'sour', 'en'), ('Tyre', 'صور', 'ar'),
  ('Baalbek', 'baalbek', 'en'), ('Baalbek', 'بعلبك', 'ar'),
  ('Jounieh', 'jounieh', 'en'), ('Jounieh', 'جونيه', 'ar'),
  ('Zahle', 'zahle', 'en'), ('Zahle', 'zahlé', 'fr'), ('Zahle', 'زحلة', 'ar'),
  ('Nabatieh', 'nabatieh', 'en'), ('Nabatieh', 'النبطية', 'ar'),
  ('Byblos', 'byblos', 'en'), ('Byblos', 'jbeil', 'en'), ('Byblos', 'جبيل', 'ar'),
  ('Dahieh', 'dahieh', 'en'), ('Dahieh', 'dahiyeh', 'en'), ('Dahieh', 'الضاحية', 'ar'),
  ('South Lebanon', 'south lebanon', 'en'), ('South Lebanon', 'sud-liban', 'fr'), ('South Lebanon', 'جنوب لبنان', 'ar'),
  ('Bekaa', 'bekaa', 'en'), ('Bekaa', 'beqaa', 'en'), ('Bekaa', 'البقاع', 'ar'),
  ('Akkar', 'akkar', 'en'), ('Akkar', 'عكار', 'ar'),
  ('Lebanon', 'lebanon', 'en'), ('Lebanon', 'liban', 'fr'), ('Lebanon', 'لبنان', 'ar')
) AS a(name_primary, alias, lang)
WHERE p.name_primary = a.name_primary;
