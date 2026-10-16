/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Navbar, ActiveTab } from './features/layout/Navbar';
import { BottomNav } from './features/layout/BottomNav';
import { HomeDashboard } from './features/home/HomeDashboard';
import { QuranView } from './features/quran/QuranView';
import { AzkarView } from './features/azkar/AzkarView';
import { QiblaView } from './features/qibla/QiblaView';
import { PrayerTimesView } from './features/prayer/PrayerTimesView';
import { BaraemZadView } from './features/learning/BaraemZadView';
import { MoreView } from './features/more/MoreView';
import { AppSettings } from './domain/settings/types';
import { ReadingProgress } from './domain/quran/types';
import { AzkarCategoryId } from './domain/azkar/types';
import { storageAdapter } from './data/storage/storageAdapter';
import { calculatePrayerTimes, getNextPrayer } from './domain/prayer/calculator';
import { X } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => storageAdapter.getSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(() =>
    storageAdapter.getReadingProgress()
  );

  // Sub-navigation targets
  const [quranInitialSurah, setQuranInitialSurah] = useState<number | undefined>(undefined);
  const [azkarInitialCategory, setAzkarInitialCategory] = useState<AzkarCategoryId | undefined>(
    undefined
  );
  const [azkarInitialTab, setAzkarInitialTab] = useState<'categories' | 'tasbih' | undefined>(
    undefined
  );
  const [moreInitialSection, setMoreInitialSection] = useState<any>('menu');

  // Full-screen Prayer Schedule Drawer
  const [isPrayerScheduleOpen, setIsPrayerScheduleOpen] = useState<boolean>(false);

  // Sync theme with DOM
  useEffect(() => {
    const isDark = settings.theme === 'emerald_dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings.theme, settings.language]);

  const handleUpdateSettings = (updated: AppSettings) => {
    setSettings(updated);
    storageAdapter.saveSettings(updated);
  };

  const handleUpdateReadingProgress = (updated: ReadingProgress) => {
    setReadingProgress(updated);
    storageAdapter.saveReadingProgress(updated);
  };

  // Generic router helper for cards and buttons
  const handleNavigate = (tab: ActiveTab, subTarget?: any) => {
    if (tab === 'quran') {
      if (subTarget?.surahNumber) {
        setQuranInitialSurah(subTarget.surahNumber);
      } else {
        setQuranInitialSurah(readingProgress.lastSurahNumber || 1);
      }
    } else if (tab === 'azkar') {
      if (subTarget?.categoryId) {
        setAzkarInitialCategory(subTarget.categoryId);
        setAzkarInitialTab('categories');
      } else if (subTarget?.tab === 'tasbih') {
        setAzkarInitialTab('tasbih');
      }
    } else if (tab === 'more') {
      if (subTarget?.section) {
        setMoreInitialSection(subTarget.section);
      }
    }

    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Brief text for next prayer in navbar
  const nextPrayerBrief = React.useMemo(() => {
    const pt = calculatePrayerTimes(
      new Date(),
      settings.coordinates,
      settings.calculationMethod,
      settings.madhhab,
      settings.prayerAdjustments
    );
    const next = getNextPrayer(pt, new Date());
    const namesAr: Record<string, string> = {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };
    return `${namesAr[next.nextPrayer] || ''} خلال ${next.formattedRemaining}`;
  }, [settings]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A1411] text-slate-800 dark:text-slate-100 flex flex-col transition-colors selection:bg-[#064E3B]/20 selection:text-[#064E3B]">
      {/* 1. Desktop & Mobile Top Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        nextPrayerBrief={nextPrayerBrief}
      />

      {/* 2. Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {activeTab === 'home' && (
          <HomeDashboard
            settings={settings}
            onNavigate={handleNavigate}
            onOpenPrayerSchedule={() => setIsPrayerScheduleOpen(true)}
            readingProgress={readingProgress}
          />
        )}

        {activeTab === 'quran' && (
          <QuranView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            readingProgress={readingProgress}
            onUpdateReadingProgress={handleUpdateReadingProgress}
            initialSurahNumber={quranInitialSurah}
          />
        )}

        {activeTab === 'azkar' && (
          <AzkarView
            settings={settings}
            initialCategoryId={azkarInitialCategory}
            initialTab={azkarInitialTab}
          />
        )}

        {activeTab === 'qibla' && <QiblaView settings={settings} />}

        {activeTab === 'learning' && <BaraemZadView settings={settings} />}

        {activeTab === 'more' && (
          <MoreView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigateToQuranSurah={(surahNumber) => {
              setQuranInitialSurah(surahNumber);
              setActiveTab('quran');
            }}
            initialSection={moreInitialSection}
          />
        )}
      </main>

      {/* 3. Mobile Ergonomic Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 4. Full-screen Prayer Schedule Modal */}
      {isPrayerScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-4xl bg-[#FAF8F5] dark:bg-[#0A1411] rounded-3xl border border-[#E8E2D8] dark:border-[#1B352E] max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPrayerScheduleOpen(false)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer shadow-sm"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <PrayerTimesView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onClose={() => setIsPrayerScheduleOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
