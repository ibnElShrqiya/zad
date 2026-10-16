import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Info,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Volume2,
  X,
} from 'lucide-react';
import { Ayah, Bookmark, ReadingProgress, SurahDetail, SurahMeta } from '../../domain/quran/types';
import { AppSettings, QuranReciterId } from '../../domain/settings/types';
import { quranRepository } from '../../data/quran/quranRepository';
import { SURAHS_METADATA } from '../../data/quran/quranMetadata';
import { storageAdapter } from '../../data/storage/storageAdapter';
import { AVAILABLE_RECITERS, audioService } from '../../platform/audio/audioService';
import { notificationService } from '../../platform/notifications/notificationService';

interface QuranViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  readingProgress: ReadingProgress;
  onUpdateReadingProgress: (progress: ReadingProgress) => void;
  initialSurahNumber?: number;
}

export const QuranView: React.FC<QuranViewProps> = ({
  settings,
  onUpdateSettings,
  readingProgress,
  onUpdateReadingProgress,
  initialSurahNumber,
}) => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    initialSurahNumber || readingProgress.lastSurahNumber || 1
  );
  const [currentSurah, setCurrentSurah] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'surah' | 'page' | 'index'>('surah');
  const [activeTafsirAyah, setActiveTafsirAyah] = useState<Ayah | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => storageAdapter.getBookmarks());
  const [audioState, setAudioState] = useState(() => audioService.getState());
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [fontSize, setFontSize] = useState<number>(settings.quranFontSize || 28);
  const [showTajweed, setShowTajweed] = useState<boolean>(settings.tajweedColors || false);

  // Subscribe to audio changes
  useEffect(() => {
    const unsub = audioService.subscribe((state) => {
      setAudioState(state);
    });
    return unsub;
  }, []);

  // Load active Surah
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    quranRepository
      .getSurahDetail(selectedSurahNumber)
      .then((detail) => {
        if (!isCancelled) {
          setCurrentSurah(detail);
          setIsLoading(false);

          // Update last read progress
          const updated: ReadingProgress = {
            lastSurahNumber: detail.number,
            lastAyahNumber: 1,
            lastPageNumber: detail.pageStart,
            updatedAt: new Date().toISOString(),
          };
          onUpdateReadingProgress(updated);
          storageAdapter.saveReadingProgress(updated);
        }
      })
      .catch((err) => {
        console.warn('Failed to load surah:', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSurahNumber]);

  // Surah List Filtered
  const filteredSurahs = useMemo(() => {
    return quranRepository.searchSurahs(searchQuery);
  }, [searchQuery]);

  // Audio Playback handler
  const handlePlayAyah = (ayah: Ayah) => {
    if (!currentSurah) return;
    const globalAyahNumber = ayah.number;
    const audioUrl = audioService.getAyahAudioUrl(globalAyahNumber, settings.activeReciter);

    audioService.playAyah({
      surahNumber: currentSurah.number,
      surahName: currentSurah.name,
      ayahNumberInSurah: ayah.numberInSurah,
      globalAyahNumber,
      audioUrl,
    });
  };

  const handleTogglePlayPause = () => {
    if (audioState.isPlaying) {
      audioService.pause();
    } else {
      audioService.resume();
    }
  };

  // Next / Previous Ayah playback chaining
  useEffect(() => {
    audioService.setOnTrackEnded(() => {
      if (!settings.autoAdvanceAyah || !currentSurah) return;
      const curAyahNum = audioState.currentTrack?.ayahNumberInSurah || 1;
      const nextAyah = currentSurah.ayahs.find((a) => a.numberInSurah === curAyahNum + 1);

      if (nextAyah) {
        handlePlayAyah(nextAyah);
      } else if (currentSurah.number < 114) {
        // Move to next Surah
        setSelectedSurahNumber((prev) => prev + 1);
      }
    });
  }, [currentSurah, audioState.currentTrack, settings.autoAdvanceAyah]);

  // Bookmarks
  const isBookmarked = (ayahNumber: number): boolean => {
    return bookmarks.some(
      (b) => b.surahNumber === selectedSurahNumber && b.ayahNumber === ayahNumber
    );
  };

  const toggleBookmark = (ayah: Ayah) => {
    if (!currentSurah) return;
    const existing = bookmarks.find(
      (b) => b.surahNumber === currentSurah.number && b.ayahNumber === ayah.numberInSurah
    );

    if (existing) {
      storageAdapter.removeBookmark(existing.id);
      setBookmarks(storageAdapter.getBookmarks());
    } else {
      const newBm: Bookmark = {
        id: `bm_${Date.now()}`,
        surahNumber: currentSurah.number,
        surahName: currentSurah.name,
        ayahNumber: ayah.numberInSurah,
        pageNumber: ayah.page,
        note: `صفحة ${ayah.page} - جزء ${ayah.juz}`,
        createdAt: new Date().toISOString(),
      };
      storageAdapter.addBookmark(newBm);
      setBookmarks(storageAdapter.getBookmarks());
    }

    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  // Navigation between Surahs
  const goToNextSurah = () => {
    if (selectedSurahNumber < 114) {
      setSelectedSurahNumber((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevSurah = () => {
    if (selectedSurahNumber > 1) {
      setSelectedSurahNumber((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: View Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] dark:bg-[#0A1411] rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] w-full md:w-auto">
          <button
            onClick={() => setViewMode('surah')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'surah'
                ? 'bg-[#064E3B] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            عرض السورة
          </button>
          <button
            onClick={() => setViewMode('index')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'index'
                ? 'bg-[#064E3B] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            فهرس السور (114)
          </button>
        </div>

        {/* Center: Surah Selector Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSurahNumber}
            onChange={(e) => {
              setSelectedSurahNumber(Number(e.target.value));
              setViewMode('surah');
            }}
            className="w-full md:w-56 px-3 py-2 bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
          >
            {SURAHS_METADATA.map((s) => (
              <option key={s.number} value={s.number}>
                {s.number}. {s.name} ({s.englishName}) - {s.numberOfAyahs} آية
              </option>
            ))}
          </select>
        </div>

        {/* Right: Typography & Reciter Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Font Size decrease / increase */}
          <div className="flex items-center bg-[#FAF8F5] dark:bg-[#0A1411] rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] px-1 py-0.5">
            <button
              onClick={() => {
                const next = Math.max(20, fontSize - 2);
                setFontSize(next);
                onUpdateSettings({ ...settings, quranFontSize: next });
              }}
              title="تصغير الخط"
              className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#064E3B] cursor-pointer"
            >
              -A
            </button>
            <span className="text-[11px] text-slate-400 font-latin tabular-nums px-1">
              {fontSize}
            </span>
            <button
              onClick={() => {
                const next = Math.min(42, fontSize + 2);
                setFontSize(next);
                onUpdateSettings({ ...settings, quranFontSize: next });
              }}
              title="تكبير الخط"
              className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#064E3B] cursor-pointer"
            >
              +A
            </button>
          </div>

          {/* Reciter Selector Trigger */}
          <button
            onClick={() => setShowReciterModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#064E3B] cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-[#064E3B] dark:text-[#10B981]" />
            <span className="hidden sm:inline">القارئ:</span>
            <span className="truncate max-w-[100px]">
              {AVAILABLE_RECITERS[settings.activeReciter]?.nameAr.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Main Content Area */}
      {viewMode === 'index' ? (
        /* Surah Index Table */
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
          <div className="flex items-center gap-3 mb-6 bg-[#FAF8F5] dark:bg-[#0A1411] p-3 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E]">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث باسم السورة بالعربية أو الإنجليزية، أو برقمها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((meta) => (
              <button
                key={meta.number}
                onClick={() => {
                  setSelectedSurahNumber(meta.number);
                  setViewMode('surah');
                }}
                className="p-3.5 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] bg-[#FAF8F5] dark:bg-[#0A1411] transition-all flex items-center justify-between text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 dark:bg-[#10B981]/15 text-[#064E3B] dark:text-[#10B981] font-bold text-xs flex items-center justify-center font-latin tabular-nums">
                    {meta.number}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#064E3B] dark:group-hover:text-[#10B981] font-arabic">
                      سورة {meta.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-latin">
                      <span>{meta.englishName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{meta.numberOfAyahs} v.</span>
                    </div>
                  </div>
                </div>

                <div className="text-left text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="block font-arabic">
                    {meta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                  </span>
                  <span className="font-latin">ص {meta.pageStart}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Reading View */
        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white dark:bg-[#11221D] rounded-2xl p-16 border border-[#E8E2D8] dark:border-[#1B352E] flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-[#064E3B] dark:text-[#10B981] animate-spin mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                جاري تحميل آيات سورة {SURAHS_METADATA.find((s) => s.number === selectedSurahNumber)?.name}...
              </p>
            </div>
          ) : currentSurah ? (
            <div className="bg-white dark:bg-[#11221D] rounded-2xl border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm overflow-hidden">
              {/* Surah Header Banner */}
              <div className="bg-gradient-to-r from-[#064E3B]/10 via-[#064E3B]/5 to-[#064E3B]/10 dark:from-[#11221D] dark:to-[#0A1411] border-b border-[#E8E2D8] dark:border-[#1B352E] p-6 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <span>سورة رقم {currentSurah.number}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentSurah.numberOfAyahs} آيات</span>
                  <span aria-hidden="true">·</span>
                  <span>الجزء {currentSurah.juzStart}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold font-quran text-[#064E3B] dark:text-[#10B981] py-1">
                  سورة {currentSurah.name}
                </h2>
                <span className="text-xs text-slate-500 font-latin block mt-1">
                  {currentSurah.englishName} ({currentSurah.englishNameTranslation})
                </span>

                {/* Bismillah */}
                {currentSurah.bismillahPre && (
                  <div className="mt-4 pt-4 border-t border-[#E8E2D8]/60 dark:border-[#1B352E]/60">
                    <p className="font-quran text-2xl text-slate-800 dark:text-slate-200 tracking-wide">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                  </div>
                )}
              </div>

              {/* Ayah List */}
              <div className="divide-y divide-[#E8E2D8] dark:divide-[#1B352E]">
                {currentSurah.ayahs.map((ayah) => {
                  const bookmarked = isBookmarked(ayah.numberInSurah);
                  const isCurrentPlaying =
                    audioState.isPlaying &&
                    audioState.currentTrack?.surahNumber === currentSurah.number &&
                    audioState.currentTrack?.ayahNumberInSurah === ayah.numberInSurah;

                  return (
                    <article
                      key={ayah.number}
                      className={`p-6 transition-colors ${
                        isCurrentPlaying
                          ? 'bg-amber-50/70 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Ayah Action Row */}
                      <div className="flex items-center justify-between gap-4 mb-4 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-center font-latin font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {ayah.numberInSurah}
                          </span>
                          <span className="font-latin text-[11px]">
                            صفحة {ayah.page} · جزء {ayah.juz}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePlayAyah(ayah)}
                            title="استماع لهذه الآية"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setActiveTafsirAyah(ayah)}
                            title="تفسير الآية (الميسر)"
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => toggleBookmark(ayah)}
                            title={bookmarked ? 'إزالة الإشارة المرجعية' : 'حفظ كإشارة مرجعية'}
                            className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                              bookmarked
                                ? 'text-[#C9A227] fill-[#C9A227]'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <BookMarked className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Arabic Quran Text */}
                      <p
                        style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}
                        className="font-quran text-slate-900 dark:text-white text-right leading-loose mb-3 selection:bg-[#064E3B]/20"
                      >
                        {ayah.text}{' '}
                        <span className="inline-block text-[#C9A227] text-lg font-latin font-bold mx-1 select-none">
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                      </p>

                      {/* English Translation */}
                      {ayah.translationEn && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-latin leading-relaxed mt-2 text-left">
                          {ayah.translationEn}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* Bottom Pagination: Prev & Next Surahs */}
              <div className="bg-[#FAF8F5] dark:bg-[#0A1411] p-4 border-t border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-between">
                <button
                  onClick={goToPrevSurah}
                  disabled={selectedSurahNumber <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السورة السابقة</span>
                </button>

                <span className="text-xs text-slate-500 font-arabic">
                  سورة {currentSurah.name} ({selectedSurahNumber} من 114)
                </span>

                <button
                  onClick={goToNextSurah}
                  disabled={selectedSurahNumber >= 114}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>السورة التالية</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Tafsir Bottom Drawer Modal */}
      {activeTafsirAyah && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#11221D] rounded-t-3xl sm:rounded-2xl border border-[#E8E2D8] dark:border-[#1B352E] p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E2D8] dark:border-[#1B352E]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                  التفسير الميسر المعتمد
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  سورة {currentSurah?.name} · الآية {activeTafsirAyah.numberInSurah}
                </span>
              </div>
              <button
                onClick={() => setActiveTafsirAyah(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E]">
                <p className="font-quran text-lg text-[#064E3B] dark:text-[#10B981] text-right leading-loose">
                  ﴿ {activeTafsirAyah.text} ﴾
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-arabic">
                  بيان المعنى والتفسير:
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-arabic">
                  {activeTafsirAyah.tafsir ||
                    'التفسير الميسر: بيان معاني الآية الكريمة، مستنبط من أصح أقوال أهل التفسير كابن كثير والطبري والسعدي.'}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-[#E8E2D8] dark:border-[#1B352E]">
                المصدر: مجمع الملك فهد لطباعة المصحف الشريف - التفسير الميسر.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reciter Selection Modal */}
      {showReciterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#11221D] rounded-2xl border border-[#E8E2D8] dark:border-[#1B352E] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E2D8] dark:border-[#1B352E]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                اختر القارئ المفضل للتلاوة
              </h3>
              <button
                onClick={() => setShowReciterModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {Object.values(AVAILABLE_RECITERS).map((reciter) => {
                const isSelected = settings.activeReciter === reciter.id;
                return (
                  <button
                    key={reciter.id}
                    onClick={() => {
                      onUpdateSettings({ ...settings, activeReciter: reciter.id });
                      audioService.setReciter(reciter.id);
                      setShowReciterModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#064E3B] dark:border-[#10B981] bg-[#064E3B]/10 dark:bg-[#10B981]/15 text-[#064E3B] dark:text-[#10B981]'
                        : 'border-[#E8E2D8] dark:border-[#1B352E] bg-[#FAF8F5] dark:bg-[#0A1411] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block">{reciter.nameAr}</span>
                      <span className="text-xs text-slate-500 font-latin">{reciter.nameEn}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{reciter.styleAr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Persistent Floating Audio Bar (Docked when track active) */}
      {audioState.currentTrack && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-[#064E3B] text-white p-3 border-t border-[#0D6B52] shadow-2xl backdrop-blur-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlayPause}
                className="w-10 h-10 rounded-full bg-[#C9A227] text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 shadow"
              >
                {audioState.isPlaying ? (
                  <Pause className="w-5 h-5 fill-slate-900" />
                ) : (
                  <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                )}
              </button>

              <div className="truncate">
                <span className="text-xs font-bold block truncate">
                  سورة {audioState.currentTrack.surahName} — الآية {audioState.currentTrack.ayahNumberInSurah}
                </span>
                <span className="text-[11px] text-emerald-200 truncate block">
                  {AVAILABLE_RECITERS[audioState.reciterId]?.nameAr}
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-xs hidden sm:block">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  audioService.seek(pct);
                }}
                className="w-full bg-black/30 h-1.5 rounded-full cursor-pointer relative"
              >
                <div
                  className="bg-[#C9A227] h-full rounded-full transition-all"
                  style={{ width: `${audioState.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => audioService.pause()}
                className="p-1.5 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
