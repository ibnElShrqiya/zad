export type CalculationMethodId = 
  | 'MWL'         // Muslim World League
  | 'ISNA'        // Islamic Society of North America
  | 'EGYPT'       // Egyptian General Authority of Survey
  | 'MAKKAH'      // Umm Al-Qura University, Makkah
  | 'KARACHI'     // University of Islamic Sciences, Karachi
  | 'TEHRAN'      // Institute of Geophysics, Tehran
  | 'GULF';       // Gulf 90-minute rule

export type MadhhabId = 'SHAFI' | 'HANAFI';

export interface CalculationParameters {
  id: CalculationMethodId;
  name: string;
  nameAr: string;
  fajrAngle: number;
  maghribAngle?: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export interface PrayerAdjustment {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
  lastThird: Date;
}

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface NextPrayerInfo {
  currentPrayer: PrayerName | 'none';
  nextPrayer: PrayerName;
  nextPrayerTime: Date;
  timeRemainingSeconds: number;
  formattedRemaining: string;
  progressPercent: number;
}
