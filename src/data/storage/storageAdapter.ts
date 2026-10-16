import { AzkarProgress } from '../../domain/azkar/types';
import { ChildLearningProfile } from '../../domain/learning/types';
import { Bookmark, ReadingProgress } from '../../domain/quran/types';
import { AppSettings } from '../../domain/settings/types';

export interface DailyGoalsState {
  date: string; // YYYY-MM-DD
  readQuranDone: boolean;
  morningAzkarDone: boolean;
  eveningAzkarDone: boolean;
  tasbihCount: number;
  streakCount: number;
}

const STORAGE_KEYS = {
  SETTINGS: 'zad_app_settings_v1',
  READING_PROGRESS: 'zad_reading_progress_v1',
  BOOKMARKS: 'zad_bookmarks_v1',
  AZKAR_PROGRESS: 'zad_azkar_progress_v1',
  CHILD_PROFILE: 'zad_child_profile_v1',
  DAILY_GOALS: 'zad_daily_goals_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'ar',
  theme: 'emerald_light',
  quranFontSize: 28,
  tajweedColors: false,
  activeReciter: 'ar.alafasy',
  autoAdvanceAyah: true,
  hapticFeedback: true,
  soundEffects: true,
  coordinates: {
    latitude: 21.422487,
    longitude: 39.826206,
    city: 'مكة المكرمة',
    country: 'المملكة العربية السعودية',
  },
  isAutoLocation: false,
  calculationMethod: 'MAKKAH',
  madhhab: 'SHAFI',
  prayerAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  enableAdhanNotifications: true,
  enablePrePrayerReminders: false,
  dailyGoalQuranPages: 2,
  dailyGoalMorningAzkar: true,
  dailyGoalEveningAzkar: true,
  dailyGoalTasbihCount: 100,
};

export const DEFAULT_CHILD_PROFILE: ChildLearningProfile = {
  childName: 'بطل زاد الصغير',
  selectedTrack: 'track_6_8',
  completedLessonIds: [],
  totalStars: 45,
  earnedBadges: [
    {
      id: 'b_first_step',
      titleAr: 'خطوة مباركة',
      titleEn: 'Blessed Step',
      descriptionAr: 'أكملت أول درس في براعم زاد بنجاح',
      icon: 'Sparkles',
      unlockedAt: '2026-10-10',
    },
  ],
  quizScores: {},
  lastActiveDate: new Date().toISOString().split('T')[0],
};

export class StorageAdapter {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`StorageAdapter setItem failed for key ${key}:`, e);
    }
  }

  // Settings
  getSettings(): AppSettings {
    const loaded = this.getItem<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...loaded };
  }

  saveSettings(settings: AppSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Reading Progress
  getReadingProgress(): ReadingProgress {
    return this.getItem<ReadingProgress>(STORAGE_KEYS.READING_PROGRESS, {
      lastSurahNumber: 1,
      lastAyahNumber: 1,
      lastPageNumber: 1,
      updatedAt: new Date().toISOString(),
    });
  }

  saveReadingProgress(progress: ReadingProgress): void {
    this.setItem(STORAGE_KEYS.READING_PROGRESS, progress);
  }

  // Bookmarks
  getBookmarks(): Bookmark[] {
    return this.getItem<Bookmark[]>(STORAGE_KEYS.BOOKMARKS, [
      {
        id: 'bm_1',
        surahNumber: 1,
        surahName: 'الفاتحة',
        ayahNumber: 1,
        pageNumber: 1,
        note: 'بداية الختمة المباركة',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'bm_2',
        surahNumber: 67,
        surahName: 'الملك',
        ayahNumber: 1,
        pageNumber: 562,
        note: 'سورة تبارك المانعة من عذاب القبر',
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  addBookmark(bookmark: Bookmark): void {
    const list = this.getBookmarks();
    const existingIndex = list.findIndex(
      (b) => b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber
    );
    if (existingIndex >= 0) {
      list[existingIndex] = bookmark;
    } else {
      list.unshift(bookmark);
    }
    this.setItem(STORAGE_KEYS.BOOKMARKS, list);
  }

  removeBookmark(id: string): void {
    const list = this.getBookmarks().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BOOKMARKS, list);
  }

  // Azkar Progress
  getAzkarProgress(): AzkarProgress {
    const today = new Date().toISOString().split('T')[0];
    const defaultVal: AzkarProgress = {
      counts: {},
      completedCategories: {},
      lastCompletedDate: today,
      streakDays: 3,
      totalTasbihTally: 142,
    };
    return this.getItem<AzkarProgress>(STORAGE_KEYS.AZKAR_PROGRESS, defaultVal);
  }

  saveAzkarProgress(progress: AzkarProgress): void {
    this.setItem(STORAGE_KEYS.AZKAR_PROGRESS, progress);
  }

  // Child Learning Profile
  getChildProfile(): ChildLearningProfile {
    return this.getItem<ChildLearningProfile>(STORAGE_KEYS.CHILD_PROFILE, DEFAULT_CHILD_PROFILE);
  }

  saveChildProfile(profile: ChildLearningProfile): void {
    this.setItem(STORAGE_KEYS.CHILD_PROFILE, profile);
  }

  // Daily Goals
  getDailyGoals(): DailyGoalsState {
    const today = new Date().toISOString().split('T')[0];
    const defaultVal: DailyGoalsState = {
      date: today,
      readQuranDone: false,
      morningAzkarDone: false,
      eveningAzkarDone: false,
      tasbihCount: 33,
      streakCount: 5,
    };
    const loaded = this.getItem<DailyGoalsState>(STORAGE_KEYS.DAILY_GOALS, defaultVal);
    if (loaded.date !== today) {
      // New day: retain streak, reset daily checkboxes
      return {
        ...defaultVal,
        streakCount: loaded.streakCount,
      };
    }
    return loaded;
  }

  saveDailyGoals(goals: DailyGoalsState): void {
    this.setItem(STORAGE_KEYS.DAILY_GOALS, goals);
  }

  // Clear / Export
  exportAllData(): string {
    const dump = {
      settings: this.getSettings(),
      readingProgress: this.getReadingProgress(),
      bookmarks: this.getBookmarks(),
      azkarProgress: this.getAzkarProgress(),
      childProfile: this.getChildProfile(),
      dailyGoals: this.getDailyGoals(),
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
    };
    return JSON.stringify(dump, null, 2);
  }
}

export const storageAdapter = new StorageAdapter();
