export type AzkarCategoryId = 
  | 'morning' 
  | 'evening' 
  | 'post_prayer' 
  | 'sleep' 
  | 'waking' 
  | 'daily_duas' 
  | 'ruqyah'
  | 'tasbih';

export interface AzkarCategory {
  id: AzkarCategoryId;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconName: string;
  badge?: string;
}

export interface DhikrItem {
  id: string;
  categoryId: AzkarCategoryId;
  arabicText: string;
  translationEn: string;
  transliteration?: string;
  targetCount: number;
  virtueAr?: string;
  virtueEn?: string;
  source: string; // e.g. "صحيح البخاري" or "أخرجه الترمذي"
  audioUrl?: string;
}

export interface AzkarProgress {
  counts: Record<string, number>; // dhikrId -> current completed count
  completedCategories: Record<string, boolean>;
  lastCompletedDate: string;
  streakDays: number;
  totalTasbihTally: number;
}
