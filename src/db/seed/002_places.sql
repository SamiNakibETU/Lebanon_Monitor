-- Seed places (gazetteer) for Lebanon Monitor
-- Run after migrations: psql $DATABASE_URL -f src/db/seed/002_places.sql

-- Cities (lat, lng instead of PostGIS geometry)
INSERT INTO place (name_primary, name_ar, name_fr, name_en, place_type, lat, lng) VALUES
('Beirut', 'بيروت', 'Beyrouth', 'Beirut', 'city', 33.8938, 35.5018),
('Tripoli', 'طرابلس', 'Tripoli', 'Tripoli', 'city', 34.4332, 35.8498),
('Sidon', 'صيدا', 'Sidon', 'Sidon', 'city', 33.5571, 35.3729),
('Tyre', 'صور', 'Tyr', 'Tyre', 'city', 33.2705, 35.2038),
('Baalbek', 'بعلبك', 'Baalbek', 'Baalbek', 'city', 34.0047, 36.211),
('Jounieh', 'جونيه', 'Jounieh', 'Jounieh', 'city', 33.9808, 35.6178),
('Zahle', 'زحلة', 'Zahlé', 'Zahle', 'city', 33.8463, 35.902),
('Nabatieh', 'النبطية', 'Nabatieh', 'Nabatieh', 'city', 33.3779, 35.4839),
('Byblos', 'جبيل', 'Byblos', 'Byblos', 'city', 34.1236, 35.6511),
('Dahieh', 'الضاحية', 'Dahiyeh', 'Dahieh', 'neighborhood', 33.8547, 35.5024),
('South Lebanon', 'جنوب لبنان', 'Sud-Liban', 'South Lebanon', 'governorate', 33.27, 35.4),
('Bekaa', 'البقاع', 'Bekaa', 'Bekaa', 'governorate', 33.85, 36.0),
('Akkar', 'عكار', 'Akkar', 'Akkar', 'governorate', 34.55, 36.1),
('Mount Lebanon', 'جبل لبنان', 'Mont-Liban', 'Mount Lebanon', 'governorate', 33.85, 35.6),
('North Lebanon', 'شمال لبنان', 'Nord-Liban', 'North Lebanon', 'governorate', 34.35, 35.8),
('Lebanon', 'لبنان', 'Liban', 'Lebanon', 'country', 33.8938, 35.5018);

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
