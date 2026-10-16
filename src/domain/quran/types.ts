export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  pageStart: number;
  juzStart: number;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translationEn?: string;
  transliteration?: string;
  tafsir?: string;
  juz: number;
  page: number;
  hizbQuarter?: number;
  sajda?: boolean;
  audioUrl?: string;
}

export interface SurahDetail extends SurahMeta {
  ayahs: Ayah[];
  bismillahPre?: boolean;
}

export interface ReadingProgress {
  lastSurahNumber: number;
  lastAyahNumber: number;
  lastPageNumber: number;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  note?: string;
  createdAt: string;
}
