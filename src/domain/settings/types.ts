import { CalculationMethodId, Coordinates, MadhhabId, PrayerAdjustment } from '../prayer/types';

export type AppTheme = 'emerald_light' | 'emerald_dark' | 'system';
export type AppLanguage = 'ar' | 'en';
export type QuranReciterId = 'ar.alafasy' | 'ar.abdulbasitmurattal' | 'ar.husary' | 'ar.saoodshuraym';

export interface ReciterInfo {
  id: QuranReciterId;
  nameAr: string;
  nameEn: string;
  styleAr: string;
  serverUrl: string;
}

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  quranFontSize: number; // in pixels (e.g. 24, 28, 32, 36)
  tajweedColors: boolean;
  activeReciter: QuranReciterId;
  autoAdvanceAyah: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  
  // Prayer & Location
  coordinates: Coordinates;
  isAutoLocation: boolean;
  calculationMethod: CalculationMethodId;
  madhhab: MadhhabId;
  prayerAdjustments: PrayerAdjustment;
  enableAdhanNotifications: boolean;
  enablePrePrayerReminders: boolean;

  // Goals
  dailyGoalQuranPages: number;
  dailyGoalMorningAzkar: boolean;
  dailyGoalEveningAzkar: boolean;
  dailyGoalTasbihCount: number;
}
