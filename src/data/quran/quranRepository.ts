import { Ayah, SurahDetail, SurahMeta } from '../../domain/quran/types';
import { SURAHS_METADATA } from './quranMetadata';
import { BUNDLED_SURAHS } from './sampleSurahs';

export interface IQuranRepository {
  getAllSurahs(): SurahMeta[];
  getSurahMeta(surahNumber: number): SurahMeta | undefined;
  getSurahDetail(surahNumber: number): Promise<SurahDetail>;
  searchSurahs(query: string): SurahMeta[];
  searchAyahs(query: string): Promise<{ surah: SurahMeta; ayah: Ayah }[]>;
  getSurahByPage(pageNumber: number): SurahMeta;
}

const CACHE_PREFIX = 'zad_quran_surah_v1_';

export class QuranRepository implements IQuranRepository {
  getAllSurahs(): SurahMeta[] {
    return SURAHS_METADATA;
  }

  getSurahMeta(surahNumber: number): SurahMeta | undefined {
    return SURAHS_METADATA.find((s) => s.number === surahNumber);
  }

  getSurahByPage(pageNumber: number): SurahMeta {
    // Find surah whose pageStart <= pageNumber, sorted descending
    const sorted = [...SURAHS_METADATA].sort((a, b) => b.pageStart - a.pageStart);
    const found = sorted.find((s) => s.pageStart <= pageNumber);
    return found || SURAHS_METADATA[0];
  }

  searchSurahs(query: string): SurahMeta[] {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS_METADATA;

    return SURAHS_METADATA.filter(
      (s) =>
        s.name.includes(q) ||
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }

  async getSurahDetail(surahNumber: number): Promise<SurahDetail> {
    const meta = this.getSurahMeta(surahNumber);
    if (!meta) {
      throw new Error(`Surah ${surahNumber} not found`);
    }

    // 1. Check if bundled statically
    if (BUNDLED_SURAHS[surahNumber]) {
      return BUNDLED_SURAHS[surahNumber];
    }

    // 2. Check LocalStorage cache
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${surahNumber}`);
      if (cached) {
        const parsed = JSON.parse(cached) as SurahDetail;
        return parsed;
      }
    } catch {
      // LocalStorage access failure / private browsing
    }

    // 3. Fetch from reliable public Quran API (Al-Quran Cloud)
    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 2) {
        const arabicData = json.data[0];
        const englishData = json.data[1];

        const ayahs: Ayah[] = arabicData.ayahs.map((arAyah: any, idx: number) => {
          const enAyah = englishData.ayahs[idx] || {};
          return {
            number: arAyah.number,
            numberInSurah: arAyah.numberInSurah,
            text: arAyah.text,
            translationEn: enAyah.text || '',
            juz: arAyah.juz,
            page: arAyah.page,
            hizbQuarter: arAyah.hizbQuarter,
            sajda: Boolean(arAyah.sajda),
          };
        });

        const detail: SurahDetail = {
          ...meta,
          ayahs,
          bismillahPre: surahNumber !== 1 && surahNumber !== 9,
        };

        // Cache for offline usage
        try {
          localStorage.setItem(`${CACHE_PREFIX}${surahNumber}`, JSON.stringify(detail));
        } catch {
          // Quota exceeded or disabled
        }

        return detail;
      }
    } catch (err) {
      console.warn(`Could not fetch online surah ${surahNumber}:`, err);
    }

    // Fallback: If network is unavailable and not in cache, construct safe placeholder with first ayah
    return {
      ...meta,
      bismillahPre: surahNumber !== 1 && surahNumber !== 9,
      ayahs: [
        {
          number: meta.pageStart * 10,
          numberInSurah: 1,
          text: `سُورَةُ ${meta.name} - الآية 1 (الرجاء الاتصال بالإنترنت لتحميل كامل نص السورة)`,
          translationEn: `Surah ${meta.englishName} - Verse 1 (Please connect to the internet to load all verses offline).`,
          juz: meta.juzStart,
          page: meta.pageStart,
        },
      ],
    };
  }

  async searchAyahs(query: string): Promise<{ surah: SurahMeta; ayah: Ayah }[]> {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: { surah: SurahMeta; ayah: Ayah }[] = [];

    // Search through bundled surahs
    for (const [sNumStr, surah] of Object.entries(BUNDLED_SURAHS)) {
      const sNum = Number(sNumStr);
      const meta = this.getSurahMeta(sNum);
      if (!meta) continue;

      for (const ayah of surah.ayahs) {
        if (
          ayah.text.includes(q) ||
          (ayah.translationEn && ayah.translationEn.toLowerCase().includes(q))
        ) {
          results.push({ surah: meta, ayah });
          if (results.length >= 25) return results;
        }
      }
    }

    return results;
  }
}

export const quranRepository = new QuranRepository();
