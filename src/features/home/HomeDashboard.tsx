import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Flame,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { calculatePrayerTimes, getNextPrayer } from '../../domain/prayer/calculator';
import { NextPrayerInfo, PrayerName, PrayerTimesResult } from '../../domain/prayer/types';
import { ReadingProgress } from '../../domain/quran/types';
import { AppSettings } from '../../domain/settings/types';
import { DailyGoalsState, storageAdapter } from '../../data/storage/storageAdapter';
import { SURAHS_METADATA } from '../../data/quran/quranMetadata';
import { NAWAWI_HADITHS } from '../../data/hadith/nawawiData';
import { notificationService } from '../../platform/notifications/notificationService';
import { ActiveTab } from '../layout/Navbar';

interface HomeDashboardProps {
  settings: AppSettings;
  onNavigate: (tab: ActiveTab, subTarget?: any) => void;
  onOpenPrayerSchedule: () => void;
  readingProgress: ReadingProgress;
}

const PRAYER_NAMES_AR: Record<PrayerName, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  settings,
  onNavigate,
  onOpenPrayerSchedule,
  readingProgress,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResult>(() =>
    calculatePrayerTimes(
      new Date(),
      settings.coordinates,
      settings.calculationMethod,
      settings.madhhab,
      settings.prayerAdjustments
    )
  );
  const [nextPrayerInfo, setNextPrayerInfo] = useState<NextPrayerInfo>(() =>
    getNextPrayer(prayerTimes, new Date())
  );
  const [dailyGoals, setDailyGoals] = useState<DailyGoalsState>(() => storageAdapter.getDailyGoals());
  const [copiedAyah, setCopiedAyah] = useState(false);
  const [copiedHadith, setCopiedHadith] = useState(false);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const pt = calculatePrayerTimes(
        now,
        settings.coordinates,
        settings.calculationMethod,
        settings.madhhab,
        settings.prayerAdjustments
      );
      setPrayerTimes(pt);
      setNextPrayerInfo(getNextPrayer(pt, now));
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  // Daily goals toggle
  const toggleGoal = (key: 'readQuranDone' | 'morningAzkarDone' | 'eveningAzkarDone') => {
    const updated = { ...dailyGoals, [key]: !dailyGoals[key] };
    setDailyGoals(updated);
    storageAdapter.saveDailyGoals(updated);
    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  const incrementTasbihGoal = () => {
    const nextCount = dailyGoals.tasbihCount + 33;
    const updated = { ...dailyGoals, tasbihCount: nextCount };
    setDailyGoals(updated);
    storageAdapter.saveDailyGoals(updated);
    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  // Find last read Surah details
  const lastSurahMeta = SURAHS_METADATA.find((s) => s.number === readingProgress.lastSurahNumber) || SURAHS_METADATA[0];

  // Verified Ayah of the day (Surah Ar-Ra'd 13:28)
  const ayahOfTheDay = {
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    surahName: 'سورة الرعد',
    ayahNumber: 28,
    translationEn: 'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
    reference: 'سورة الرعد: الآية 28',
  };

  // Verified Hadith of the day (First Nawawi Hadith)
  const hadithOfTheDay = NAWAWI_HADITHS[0];

  const handleCopyAyah = () => {
    const textToCopy = `${ayahOfTheDay.text}\n[${ayahOfTheDay.reference}]\n${ayahOfTheDay.translationEn}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedAyah(true);
    setTimeout(() => setCopiedAyah(false), 2000);
  };

  const handleCopyHadith = () => {
    const textToCopy = `${hadithOfTheDay.arabicText}\n[${hadithOfTheDay.source} - ${hadithOfTheDay.grade}]`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedHadith(true);
    setTimeout(() => setCopiedHadith(false), 2000);
  };

  const childProfile = storageAdapter.getChildProfile();

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* 1. Next Prayer Hero Status Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#043629] text-white p-6 shadow-md border border-[#064E3B]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{settings.coordinates.city || 'مكة المكرمة'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-latin tabular-nums">
                {currentTime.toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold font-arabic tracking-tight">
                صلاة {PRAYER_NAMES_AR[nextPrayerInfo.nextPrayer]}
              </h1>
              <span className="text-xs text-[#E0BA3E] font-medium px-2 py-0.5 rounded bg-black/20">
                الصلاة القادمة
              </span>
            </div>

            <p className="text-sm text-emerald-100 mt-1">
              موعد الأذان في تمام الساعة{' '}
              <span className="font-bold text-white font-latin tabular-nums">
                {nextPrayerInfo.nextPrayerTime.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="text-right">
              <span className="text-[11px] text-emerald-200 block">الوقت المتبقي للأذان</span>
              <span className="text-2xl sm:text-3xl font-extrabold font-latin tabular-nums tracking-wide text-[#E0BA3E]">
                {nextPrayerInfo.formattedRemaining}
              </span>
            </div>

            <div className="w-full sm:w-auto flex sm:flex-col gap-2">
              <button
                onClick={onOpenPrayerSchedule}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                جدول الصلوات
              </button>
            </div>
          </div>
        </div>

        {/* Linear progress bar to next prayer */}
        <div className="mt-5 w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#C9A227] h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${nextPrayerInfo.progressPercent}%` }}
          />
        </div>
      </section>

      {/* 2. Grid: Continue Quran Reading + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Quran Reading Card (2 columns on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>تلاوة القرآن الكريم</span>
                <span aria-hidden="true">·</span>
                <span>ورد اليوم المبارك</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic">
                متابعة القراءة: {lastSurahMeta.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1">
                <span>الآية {readingProgress.lastAyahNumber}</span>
                <span aria-hidden="true">·</span>
                <span>الصفحة {readingProgress.lastPageNumber} من 604</span>
                <span aria-hidden="true">·</span>
                <span>الجزء {lastSurahMeta.juzStart}</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-[#064E3B]/10 dark:bg-[#10B981]/15 text-[#064E3B] dark:text-[#10B981] flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>ختمة المصحف الشريف</span>
                <span className="font-latin tabular-nums font-semibold text-[#064E3B] dark:text-[#10B981]">
                  {Math.round((readingProgress.lastPageNumber / 604) * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#064E3B] dark:bg-[#10B981] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(readingProgress.lastPageNumber / 604) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onNavigate('quran')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-semibold shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span>متابعة التلاوة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('quran', { view: 'index' })}
                className="text-xs font-medium text-[#064E3B] dark:text-[#10B981] hover:underline cursor-pointer"
              >
                فهرس السور والأجزاء
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access Actions */}
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 font-arabic">
            الوصول السريع
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('azkar', { categoryId: 'morning' })}
              className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                أذكار الصباح
              </span>
            </button>

            <button
              onClick={() => onNavigate('azkar', { categoryId: 'evening' })}
              className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                أذكار المساء
              </span>
            </button>

            <button
              onClick={() => onNavigate('azkar', { tab: 'tasbih' })}
              className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                المسبحة الإلكترونية
              </span>
            </button>

            <button
              onClick={() => onNavigate('qibla')}
              className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-[#C9A227]/10 text-[#C9A227] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                بوصلة القبلة
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Daily Goals & Streak Tracking */}
      <section className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
              الأهداف الإيمانية اليومية
            </h2>
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>تتابع {dailyGoals.streakCount} أيام</span>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">اليومية المتجددة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Goal 1: Quran */}
          <button
            onClick={() => toggleGoal('readQuranDone')}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              dailyGoals.readQuranDone
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <span className="text-xs font-bold block">ورد القرآن الكريم</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">قراءة صفحتين</span>
            </div>
            {dailyGoals.readQuranDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Goal 2: Morning Azkar */}
          <button
            onClick={() => toggleGoal('morningAzkarDone')}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              dailyGoals.morningAzkarDone
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <span className="text-xs font-bold block">أذكار الصباح</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">حصن المسلم</span>
            </div>
            {dailyGoals.morningAzkarDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Goal 3: Evening Azkar */}
          <button
            onClick={() => toggleGoal('eveningAzkarDone')}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              dailyGoals.eveningAzkarDone
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
            }`}
          >
            <div>
              <span className="text-xs font-bold block">أذكار المساء</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">حفظ وسكينة</span>
            </div>
            {dailyGoals.eveningAzkarDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Goal 4: Tasbih Count */}
          <div className="p-3 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] bg-[#FAF8F5] dark:bg-[#0A1411] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                تسبيح واستغفار
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-latin tabular-nums">
                {dailyGoals.tasbihCount} / 100 تسبيحة
              </span>
            </div>
            <button
              onClick={incrementTasbihGoal}
              className="px-2.5 py-1 rounded-md bg-[#064E3B] text-white text-xs font-bold hover:bg-[#043629] active:scale-95 transition-transform cursor-pointer"
            >
              +33
            </button>
          </div>
        </div>
      </section>

      {/* 4. Verified Ayah of the Day & Hadith of the Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ayah of the Day */}
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#064E3B] dark:text-[#10B981]">
                آية اليوم المباركة
              </span>
              <span>{ayahOfTheDay.reference}</span>
            </div>

            <p className="font-quran text-xl sm:text-2xl text-slate-900 dark:text-white leading-loose text-center py-3 px-2">
              ﴿ {ayahOfTheDay.text} ﴾
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-latin text-center mt-2 leading-relaxed">
              "{ayahOfTheDay.translationEn}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#E8E2D8] dark:border-[#1B352E]">
            <button
              onClick={handleCopyAyah}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-[#064E3B] dark:hover:text-[#10B981] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedAyah ? 'تم النسخ!' : 'مشاركة الآية'}</span>
            </button>

            <button
              onClick={() => onNavigate('quran')}
              className="text-xs font-semibold text-[#064E3B] dark:text-[#10B981] hover:underline cursor-pointer"
            >
              فتح في المصحف
            </button>
          </div>
        </div>

        {/* Hadith of the Day */}
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#C9A227]">حديث اليوم المعتمد</span>
              <span>{hadithOfTheDay.grade}</span>
            </div>

            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-arabic py-2">
              {hadithOfTheDay.arabicText}
            </p>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span>رواه: {hadithOfTheDay.narratorAr}</span>
              <span aria-hidden="true" className="mx-1.5">
                ·
              </span>
              <span>المصدر: {hadithOfTheDay.source}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#E8E2D8] dark:border-[#1B352E]">
            <button
              onClick={handleCopyHadith}
              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-[#064E3B] dark:hover:text-[#10B981] transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedHadith ? 'تم النسخ!' : 'نسخ الحديث'}</span>
            </button>

            <button
              onClick={() => onNavigate('more', { section: 'hadith' })}
              className="text-xs font-semibold text-[#C9A227] hover:underline cursor-pointer"
            >
              مكتبة الأحاديث الشريفة
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bara'em ZAD Learning Preview */}
      <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-[#0A1A15] dark:via-[#0F2620] dark:to-[#0A1A15] rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-right">
          <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-[#C9A227] flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#064E3B] dark:text-[#10B981]">
                براعم زاد للأطفال
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                ⭐ {childProfile.totalStars} نجمة
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-arabic">
              مسار الأبطال الصغار في تعلم القرآن والآداب
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              دروس تفاعلية، كويزات مشوقة، وقصص الأنبياء بأسلوب مبهج وآمن للأطفال.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('learning')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-semibold shadow-sm transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        >
          دخول براعم زاد
        </button>
      </section>
    </div>
  );
};
