import React from 'react';
import { BookOpen, Compass, HeartHandshake, Home, Menu, Moon, MoreHorizontal, Settings, Sparkles, Sun } from 'lucide-react';
import { AppSettings, AppTheme } from '../../domain/settings/types';

export type ActiveTab = 'home' | 'quran' | 'azkar' | 'qibla' | 'learning' | 'more';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  nextPrayerBrief?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  onUpdateSettings,
  nextPrayerBrief,
}) => {
  const isDark = settings.theme === 'emerald_dark';

  const toggleTheme = () => {
    const nextTheme: AppTheme = isDark ? 'emerald_light' : 'emerald_dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const navLinks = [
    { id: 'home' as ActiveTab, label: 'الرئيسية' },
    { id: 'quran' as ActiveTab, label: 'القرآن الكريم' },
    { id: 'azkar' as ActiveTab, label: 'الأذكار' },
    { id: 'qibla' as ActiveTab, label: 'القبلة' },
    { id: 'learning' as ActiveTab, label: 'براعم زاد' },
    { id: 'more' as ActiveTab, label: 'المزيد' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E2D8] dark:border-[#1B352E] bg-[#FAF8F5]/90 dark:bg-[#0A1411]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 text-right cursor-pointer group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#C9A227] flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            زاد
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-bold text-lg tracking-tight text-[#064E3B] dark:text-[#10B981] font-arabic">
              زاد المسلم
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-latin tracking-wider">
              ZAD · ISLAMIC APP
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                  isActive
                    ? 'text-[#064E3B] dark:text-[#10B981] font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#064E3B] dark:hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#064E3B] dark:bg-[#10B981] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Quick Toggles */}
        <div className="flex items-center gap-3 shrink-0">
          {nextPrayerBrief && (
            <button
              onClick={() => onSelectTab('home')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#064E3B]/10 dark:bg-[#10B981]/15 text-[#064E3B] dark:text-[#10B981] text-xs font-semibold hover:bg-[#064E3B]/15 transition-colors"
            >
              <span>{nextPrayerBrief}</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            className="w-9 h-9 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#C9A227]" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onSelectTab('more')}
            aria-label="الإعدادات والمزيد"
            className="w-9 h-9 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
