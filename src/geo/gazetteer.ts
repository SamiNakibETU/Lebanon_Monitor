/**
 * Lebanon gazetteer — places with names in AR/FR/EN and coordinates.
 * Phase E — structured place data for resolvePlace.
 */

import type { PlaceType } from './types';

export interface GazetteerPlace {
  namePrimary: string;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
  placeType: PlaceType;
  lat: number;
  lng: number;
  /** Additional aliases (transliterations, abbreviations). */
  aliases?: string[];
}

/** Canonical Lebanon places: cities, governorates, neighborhoods. */
export const LEBANON_GAZETTEER: GazetteerPlace[] = [
  // Cities
  {
    namePrimary: 'Beirut',
    nameAr: 'بيروت',
    nameFr: 'Beyrouth',
    nameEn: 'Beirut',
    placeType: 'city',
    lat: 33.8938,
    lng: 35.5018,
    aliases: ['beirut', 'beyrouth'],
  },
  {
    namePrimary: 'Tripoli',
    nameAr: 'طرابلس',
    nameFr: 'Tripoli',
    nameEn: 'Tripoli',
    placeType: 'city',
    lat: 34.4332,
    lng: 35.8498,
    aliases: ['tripoli', 'trablos'],
  },
  {
    namePrimary: 'Sidon',
    nameAr: 'صيدا',
    nameFr: 'Sidon',
    nameEn: 'Sidon',
    placeType: 'city',
    lat: 33.5571,
    lng: 35.3729,
    aliases: ['sidon', 'saida', 'sayda'],
  },
  {
    namePrimary: 'Tyre',
    nameAr: 'صور',
    nameFr: 'Tyr',
    nameEn: 'Tyre',
    placeType: 'city',
    lat: 33.2705,
    lng: 35.2038,
    aliases: ['tyre', 'tyr', 'sour', 'sur'],
  },
  {
    namePrimary: 'Baalbek',
    nameAr: 'بعلبك',
    nameFr: 'Baalbek',
    nameEn: 'Baalbek',
    placeType: 'city',
    lat: 34.0047,
    lng: 36.211,
    aliases: ['baalbek', 'baalbeck'],
  },
  {
    namePrimary: 'Jounieh',
    nameAr: 'جونيه',
    nameFr: 'Jounieh',
    nameEn: 'Jounieh',
    placeType: 'city',
    lat: 33.9808,
    lng: 35.6178,
    aliases: ['jounieh', 'junieh'],
  },
  {
    namePrimary: 'Zahle',
    nameAr: 'زحلة',
    nameFr: 'Zahlé',
    nameEn: 'Zahle',
    placeType: 'city',
    lat: 33.8463,
    lng: 35.902,
    aliases: ['zahle', 'zahlé', 'zahleh'],
  },
  {
    namePrimary: 'Nabatieh',
    nameAr: 'النبطية',
    nameFr: 'Nabatieh',
    nameEn: 'Nabatieh',
    placeType: 'city',
    lat: 33.3779,
    lng: 35.4839,
    aliases: ['nabatieh', 'nabatiyeh'],
  },
  {
    namePrimary: 'Byblos',
    nameAr: 'جبيل',
    nameFr: 'Byblos',
    nameEn: 'Byblos',
    placeType: 'city',
    lat: 34.1236,
    lng: 35.6511,
    aliases: ['byblos', 'jbeil', 'jubayl'],
  },
  // Neighborhood
  {
    namePrimary: 'Dahieh',
    nameAr: 'الضاحية',
    nameFr: 'Dahiyeh',
    nameEn: 'Dahieh',
    placeType: 'neighborhood',
    lat: 33.8547,
    lng: 35.5024,
    aliases: ['dahieh', 'dahiyeh', 'dahyeh', 'southern suburb'],
  },
  // Governorates / Regions
  {
    namePrimary: 'South Lebanon',
    nameAr: 'جنوب لبنان',
    nameFr: 'Sud-Liban',
    nameEn: 'South Lebanon',
    placeType: 'governorate',
    lat: 33.27,
    lng: 35.4,
    aliases: ['south lebanon', 'sud-liban', 'southern lebanon'],
  },
  {
    namePrimary: 'Bekaa',
    nameAr: 'البقاع',
    nameFr: 'Bekaa',
    nameEn: 'Bekaa',
    placeType: 'governorate',
    lat: 33.85,
    lng: 36.0,
    aliases: ['bekaa', 'beqaa', 'le plaine de la bekaa'],
  },
  {
    namePrimary: 'Akkar',
    nameAr: 'عكار',
    nameFr: 'Akkar',
    nameEn: 'Akkar',
    placeType: 'governorate',
    lat: 34.55,
    lng: 36.1,
    aliases: ['akkar', 'acker'],
  },
  {
    namePrimary: 'Mount Lebanon',
    nameAr: 'جبل لبنان',
    nameFr: 'Mont-Liban',
    nameEn: 'Mount Lebanon',
    placeType: 'governorate',
    lat: 33.85,
    lng: 35.6,
    aliases: ['mount lebanon', 'mont-liban', 'jabal lubnan'],
  },
  {
    namePrimary: 'North Lebanon',
    nameAr: 'شمال لبنان',
    nameFr: 'Nord-Liban',
    nameEn: 'North Lebanon',
    placeType: 'governorate',
    lat: 34.35,
    lng: 35.8,
    aliases: ['north lebanon', 'nord-liban'],
  },
  {
    namePrimary: 'Beirut Governorate',
    nameAr: 'محافظة بيروت',
    nameFr: 'Beyrouth',
    nameEn: 'Beirut Governorate',
    placeType: 'governorate',
    lat: 33.8938,
    lng: 35.5018,
    aliases: ['beirut governorate', 'beyrouth governorate'],
  },
  // Country fallback
  {
    namePrimary: 'Lebanon',
    nameAr: 'لبنان',
    nameFr: 'Liban',
    nameEn: 'Lebanon',
    placeType: 'country',
    lat: 33.8938,
    lng: 35.5018,
    aliases: ['lebanon', 'liban', 'lubnan'],
  },
];
