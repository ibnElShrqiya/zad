import React from 'react';
import { BookOpen, Compass, HeartHandshake, Home, MoreHorizontal } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'الرئيسية', icon: Home },
    { id: 'quran' as ActiveTab, label: 'القرآن', icon: BookOpen },
    { id: 'azkar' as ActiveTab, label: 'الأذكار', icon: HeartHandshake },
    { id: 'qibla' as ActiveTab, label: 'القبلة', icon: Compass },
    { id: 'more' as ActiveTab, label: 'المزيد', icon: MoreHorizontal },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي السفلي"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#0A1411]/95 backdrop-blur-md border-t border-[#E8E2D8] dark:border-[#1B352E] pb-safe"
    >
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all cursor-pointer ${
                isActive
                  ? 'text-[#064E3B] dark:text-[#10B981]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-[#064E3B]/10 dark:bg-[#10B981]/15 scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] font-medium leading-none mt-1 ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
