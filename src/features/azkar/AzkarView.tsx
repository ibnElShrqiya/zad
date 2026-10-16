import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  HeartHandshake,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Vibrate,
} from 'lucide-react';
import { AZKAR_CATEGORIES, AZKAR_ITEMS } from '../../data/azkar/azkarData';
import { AzkarCategoryId, DhikrItem } from '../../domain/azkar/types';
import { AppSettings } from '../../domain/settings/types';
import { storageAdapter } from '../../data/storage/storageAdapter';
import { notificationService } from '../../platform/notifications/notificationService';
import confetti from 'canvas-confetti';

interface AzkarViewProps {
  settings: AppSettings;
  initialCategoryId?: AzkarCategoryId;
  initialTab?: 'categories' | 'tasbih';
}

const POPULAR_TASBIHAT = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'لَا إِلَٰهَ إِلَّا اللَّهُ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
];

export const AzkarView: React.FC<AzkarViewProps> = ({
  settings,
  initialCategoryId = 'morning',
  initialTab = 'categories',
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'tasbih'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<AzkarCategoryId>(initialCategoryId);
  const [azkarProgress, setAzkarProgress] = useState(() => storageAdapter.getAzkarProgress());

  // Tasbih state
  const [tasbihPhrase, setTasbihPhrase] = useState<string>(POPULAR_TASBIHAT[0]);
  const [tasbihCount, setTasbihCount] = useState<number>(0);
  const [tasbihTarget, setTasbihTarget] = useState<number>(33);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEffects);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(settings.hapticFeedback);

  // Filter items for current category
  const currentItems = AZKAR_ITEMS.filter((item) => item.categoryId === selectedCategory);

  // Calculate category completion progress
  const completedCount = currentItems.filter((item) => {
    const current = azkarProgress.counts[item.id] || 0;
    return current >= item.targetCount;
  }).length;

  const progressPercent = currentItems.length > 0 ? (completedCount / currentItems.length) * 100 : 0;

  // Dhikr Counter Tap
  const handleCountDhikr = (item: DhikrItem) => {
    const current = azkarProgress.counts[item.id] || 0;
    if (current >= item.targetCount) return;

    const next = current + 1;
    const updatedCounts = { ...azkarProgress.counts, [item.id]: next };
    const updatedProgress = { ...azkarProgress, counts: updatedCounts };

    // If item reached target count, check if whole category is done
    if (next === item.targetCount) {
      if (soundEnabled) notificationService.playCelebrationChime();
      if (hapticEnabled) notificationService.triggerVibrate(60);

      const allCompleted = currentItems.every((it) =>
        it.id === item.id ? true : (updatedCounts[it.id] || 0) >= it.targetCount
      );

      if (allCompleted) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } else {
      if (soundEnabled) notificationService.playHapticClick();
      if (hapticEnabled) notificationService.triggerVibrate(25);
    }

    setAzkarProgress(updatedProgress);
    storageAdapter.saveAzkarProgress(updatedProgress);
  };

  const handleResetItem = (itemId: string) => {
    const updatedCounts = { ...azkarProgress.counts, [itemId]: 0 };
    const updated = { ...azkarProgress, counts: updatedCounts };
    setAzkarProgress(updated);
    storageAdapter.saveAzkarProgress(updated);
  };

  const handleResetCategory = () => {
    const updatedCounts = { ...azkarProgress.counts };
    currentItems.forEach((it) => {
      delete updatedCounts[it.id];
    });
    const updated = { ...azkarProgress, counts: updatedCounts };
    setAzkarProgress(updated);
    storageAdapter.saveAzkarProgress(updated);
  };

  // Electronic Tasbih Count
  const handleTasbihTap = () => {
    const next = tasbihCount + 1;
    setTasbihCount(next);

    const totalTally = (azkarProgress.totalTasbihTally || 0) + 1;
    const updated = { ...azkarProgress, totalTasbihTally: totalTally };
    setAzkarProgress(updated);
    storageAdapter.saveAzkarProgress(updated);

    if (soundEnabled) notificationService.playHapticClick();
    if (hapticEnabled) notificationService.triggerVibrate(30);

    if (next % tasbihTarget === 0) {
      if (soundEnabled) notificationService.playCelebrationChime();
      if (hapticEnabled) notificationService.triggerVibrate(80);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleResetTasbih = () => {
    setTasbihCount(0);
    if (soundEnabled) notificationService.playHapticClick();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex items-center justify-between gap-4">
        {/* Tab Switcher: Categories vs Digital Tasbih */}
        <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] dark:bg-[#0A1411] rounded-xl border border-[#E8E2D8] dark:border-[#1B352E]">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#064E3B] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            أذكار اليوم والليلة
          </button>
          <button
            onClick={() => setActiveTab('tasbih')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'tasbih'
                ? 'bg-[#064E3B] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            المسبحة الإلكترونية
          </button>
        </div>

        {/* Total Tasbih Tally */}
        <div className="text-left">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-arabic">
            إجمالي التسبيحات
          </span>
          <span className="text-sm font-bold font-latin tabular-nums text-[#064E3B] dark:text-[#10B981]">
            {(azkarProgress.totalTasbihTally || 0).toLocaleString('ar-SA')}
          </span>
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="space-y-6">
          {/* Category Tabs Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {AZKAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#064E3B] text-white shadow-md shadow-[#064E3B]/20'
                      : 'bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300 hover:border-[#064E3B]'
                  }`}
                >
                  <span>{cat.titleAr}</span>
                </button>
              );
            })}
          </div>

          {/* Category Overview Card */}
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic">
                  {AZKAR_CATEGORIES.find((c) => c.id === selectedCategory)?.titleAr}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {AZKAR_CATEGORIES.find((c) => c.id === selectedCategory)?.descriptionAr}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#064E3B] dark:text-[#10B981] font-latin tabular-nums">
                  {completedCount} من {currentItems.length} أذكار مكتملة
                </span>
                <button
                  onClick={handleResetCategory}
                  title="إعادة ضبط عداد القسم"
                  className="p-2 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Progress Bar */}
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#064E3B] dark:bg-[#10B981] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Dhikr Items List */}
          <div className="space-y-4">
            {currentItems.map((item) => {
              const count = azkarProgress.counts[item.id] || 0;
              const isDone = count >= item.targetCount;

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-[#11221D] rounded-2xl p-6 border transition-all shadow-sm ${
                    isDone
                      ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-[#E8E2D8] dark:border-[#1B352E]'
                  }`}
                >
                  {/* Arabic Dhikr Text */}
                  <p className="text-lg sm:text-xl font-arabic text-slate-900 dark:text-white leading-loose text-right mb-4">
                    {item.arabicText}
                  </p>

                  {/* English Meaning */}
                  {item.translationEn && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-latin leading-relaxed mb-4 text-left">
                      {item.translationEn}
                    </p>
                  )}

                  {/* Virtue & Source */}
                  {item.virtueAr && (
                    <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] text-xs text-slate-600 dark:text-slate-300 mb-4 border border-[#E8E2D8] dark:border-[#1B352E]">
                      <span className="font-bold text-[#064E3B] dark:text-[#10B981]">الفضل والأثر: </span>
                      <span>{item.virtueAr}</span>
                      <span className="block text-[11px] text-slate-400 mt-1">المصدر: {item.source}</span>
                    </div>
                  )}

                  {/* Action & Counter Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8] dark:border-[#1B352E]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleResetItem(item.id)}
                        title="تصفير العداد"
                        className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(`${item.arabicText}\n[${item.source}]`);
                          notificationService.playHapticClick();
                        }}
                        title="نسخ الذكر"
                        className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Circular Tap Counter Button */}
                    <button
                      onClick={() => handleCountDhikr(item)}
                      disabled={isDone}
                      className={`min-h-[48px] px-6 py-2 rounded-2xl font-bold flex items-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-sm ${
                        isDone
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#064E3B] text-white hover:bg-[#043629]'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span className="text-xs">تم بحمد الله</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs">اضغط للذكر</span>
                          <span className="font-latin text-base tabular-nums bg-white/20 px-2.5 py-0.5 rounded-lg">
                            {count} / {item.targetCount}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Digital Tasbih Screen */
        <div className="max-w-xl mx-auto space-y-6">
          {/* Preset Tasbihat Selector */}
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3 font-arabic">
              اختر صيغة التسبيح والذكر:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_TASBIHAT.map((phrase) => {
                const isSelected = tasbihPhrase === phrase;
                return (
                  <button
                    key={phrase}
                    onClick={() => {
                      setTasbihPhrase(phrase);
                      setTasbihCount(0);
                    }}
                    className={`p-3 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                      isSelected
                        ? 'bg-[#064E3B] text-white shadow-sm'
                        : 'bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-slate-800 dark:text-slate-200 hover:border-[#064E3B]'
                    }`}
                  >
                    {phrase}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Tactile Misbaha Dial */}
          <div className="bg-white dark:bg-[#11221D] rounded-3xl p-8 border border-[#E8E2D8] dark:border-[#1B352E] shadow-md flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-bold font-arabic text-[#064E3B] dark:text-[#10B981] mb-2">
              {tasbihPhrase}
            </h3>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-8 font-arabic">
              الهدف الحالي: كل {tasbihTarget} تسبيحة
            </div>

            {/* Giant Circular Tap Button */}
            <button
              onClick={handleTasbihTap}
              aria-label="تسبيح"
              className="w-56 h-56 rounded-full bg-gradient-to-br from-[#064E3B] via-[#043629] to-[#064E3B] text-white shadow-2xl border-4 border-[#C9A227] flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform select-none"
            >
              <span className="text-6xl font-extrabold font-latin tabular-nums tracking-tight">
                {tasbihCount}
              </span>
              <span className="text-xs font-semibold text-emerald-200 mt-2 font-arabic">
                اضغط للتسبيح
              </span>
            </button>

            {/* Target Options & Sound Toggles */}
            <div className="flex items-center justify-between w-full max-w-sm mt-8 pt-6 border-t border-[#E8E2D8] dark:border-[#1B352E]">
              <div className="flex items-center gap-1">
                {[33, 100, 1000].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTasbihTarget(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-latin font-bold cursor-pointer ${
                      tasbihTarget === t
                        ? 'bg-[#064E3B] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
                  className={`p-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] cursor-pointer ${
                    soundEnabled ? 'text-[#064E3B] bg-emerald-50' : 'text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleResetTasbih}
                  title="تصفير العداد"
                  className="p-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
