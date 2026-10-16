export interface HadithItem {
  id: number;
  titleAr: string;
  titleEn: string;
  narratorAr: string;
  narratorEn: string;
  arabicText: string;
  translationEn: string;
  source: string;
  grade: 'صحيح' | 'حسن' | 'متفق عليه';
  chapterAr: string;
  chapterEn: string;
  commentaryAr?: string;
  commentaryEn?: string;
}

export interface LibraryArticle {
  id: string;
  category: 'prayer' | 'quran' | 'fasting' | 'character' | 'seerah';
  titleAr: string;
  titleEn: string;
  readTimeMinutes: number;
  authorOrSource: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
}
