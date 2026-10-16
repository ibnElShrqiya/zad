import React, { useState } from 'react';
import {
  Bell,
  BookMarked,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  HeartHandshake,
  Info,
  Lock,
  Moon,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';
import { NAWAWI_HADITHS, ISLAMIC_ARTICLES } from '../../data/hadith/nawawiData';
import { Bookmark } from '../../domain/quran/types';
import { AppSettings, AppTheme } from '../../domain/settings/types';
import { storageAdapter } from '../../data/storage/storageAdapter';
import { notificationService } from '../../platform/notifications/notificationService';
import { quranRepository } from '../../data/quran/quranRepository';
import { AZKAR_ITEMS } from '../../data/azkar/azkarData';
import { BARAEM_LESSONS } from '../../data/learning/baraemData';
import { ActiveTab } from '../layout/Navbar';

interface MoreViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onNavigateToQuranSurah: (surahNumber: number, ayahNumber?: number) => void;
  initialSection?: 'menu' | 'hadith' | 'library' | 'bookmarks' | 'settings' | 'about' | 'privacy' | 'search';
}

export const MoreView: React.FC<MoreViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigateToQuranSurah,
  initialSection = 'menu',
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => storageAdapter.getBookmarks());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHadithId, setSelectedHadithId] = useState<number | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleDeleteBookmark = (id: string) => {
    storageAdapter.removeBookmark(id);
    setBookmarks(storageAdapter.getBookmarks());
    if (settings.soundEffects) notificationService.playHapticClick();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  const handleExportData = () => {
    const jsonStr = storageAdapter.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zad_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('تم تصدير نسخة احتياطية من جميع بياناتك بنجاح!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  // Global search aggregator across Surahs, Azkar, Hadiths, and Lessons
  const globalSearchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return null;

    const surahs = quranRepository.searchSurahs(q).slice(0, 5);
    const azkar = AZKAR_ITEMS.filter(
      (a) => a.arabicText.includes(q) || a.translationEn.toLowerCase().includes(q)
    ).slice(0, 5);
    const hadiths = NAWAWI_HADITHS.filter(
      (h) =>
        h.arabicText.includes(q) ||
        h.titleAr.includes(q) ||
        h.translationEn.toLowerCase().includes(q)
    ).slice(0, 5);
    const lessons = BARAEM_LESSONS.filter(
      (l) => l.titleAr.includes(q) || l.contentAr.includes(q)
    ).slice(0, 5);

    return { surahs, azkar, hadiths, lessons };
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* 1. Header Toolbar if in a sub-section */}
      {activeSection !== 'menu' && (
        <div className="flex items-center justify-between bg-white dark:bg-[#11221D] p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
          <button
            onClick={() => {
              setActiveSection('menu');
              setSelectedHadithId(null);
              setSelectedArticleId(null);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#064E3B] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>العودة لقائمة المزيد</span>
          </button>

          <span className="text-xs font-bold text-slate-500 font-arabic">
            {activeSection === 'hadith' && 'الأربعون النووية الصحيحة'}
            {activeSection === 'library' && 'المكتبة والمقالات الإسلامية'}
            {activeSection === 'bookmarks' && 'الإشارات المرجعية المحفوظة'}
            {activeSection === 'settings' && 'إعدادات التطبيق'}
            {activeSection === 'search' && 'البحث الشامل'}
            {activeSection === 'about' && 'عن تطبيق زاد'}
            {activeSection === 'privacy' && 'سياسة الخصوصية والأمان'}
          </span>
        </div>
      )}

      {/* 2. Main Menu Grid (When in 'menu') */}
      {activeSection === 'menu' && (
        <div className="space-y-6">
          {/* Quick Search Banner */}
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث في القرآن، الأذكار، الأحاديث، أو دروس براعم زاد..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setActiveSection('search');
                }
              }}
              className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Hadith Library */}
            <button
              onClick={() => setActiveSection('hadith')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    مكتبة الحديث الشريف
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    الأربعون النووية مع التخريج الصحيح والشرح
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 2. Islamic Reading Library */}
            <button
              onClick={() => setActiveSection('library')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#064E3B]/10 text-[#064E3B] dark:text-[#10B981] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    المكتبة والمقالات الإيمانية
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    الخشوع في الصلاة، آداب القرآن، وأخلاق النبوة
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 3. Bookmarks Manager */}
            <button
              onClick={() => setActiveSection('bookmarks')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookMarked className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    الإشارات المرجعية المحفوظة
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {bookmarks.length} آيات وصفحات محفوظة للمراجعة
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 4. App Settings */}
            <button
              onClick={() => setActiveSection('settings')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    إعدادات التطبيق والمظهر
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    المظهر، الخطوط، التنبيهات، والنسخ الاحتياطي
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 5. About ZAD */}
            <button
              onClick={() => setActiveSection('about')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    عن تطبيق زاد (ZAD)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    الرؤية، منهج التوثيق، ومعمارية فلاتر المستقبلية
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* 6. Privacy Policy */}
            <button
              onClick={() => setActiveSection('privacy')}
              className="p-5 rounded-2xl bg-white dark:bg-[#11221D] border border-[#E8E2D8] dark:border-[#1B352E] hover:border-[#064E3B] dark:hover:border-[#10B981] transition-all flex items-center justify-between text-right shadow-sm group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
                    سياسة الخصوصية والأمان
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تطبيق محلي بدون تتبع، وتشفير البيانات المحفوظة
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Global Search Results View */}
      {activeSection === 'search' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="اكتب كلمة للبحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-200"
              autoFocus
            />
          </div>

          {globalSearchResults && (
            <div className="space-y-6">
              {/* Surahs found */}
              {globalSearchResults.surahs.length > 0 && (
                <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E]">
                  <h3 className="text-xs font-bold text-slate-500 mb-3 font-arabic">
                    السور القرآنية:
                  </h3>
                  <div className="space-y-2">
                    {globalSearchResults.surahs.map((s) => (
                      <button
                        key={s.number}
                        onClick={() => onNavigateToQuranSurah(s.number)}
                        className="w-full p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-between text-right cursor-pointer hover:border-[#064E3B]"
                      >
                        <span className="text-sm font-bold font-arabic">
                          سورة {s.name} ({s.englishName})
                        </span>
                        <span className="text-xs text-slate-500 font-latin">
                          صفحة {s.pageStart}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Azkar found */}
              {globalSearchResults.azkar.length > 0 && (
                <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E]">
                  <h3 className="text-xs font-bold text-slate-500 mb-3 font-arabic">
                    الأذكار والأدعية:
                  </h3>
                  <div className="space-y-3">
                    {globalSearchResults.azkar.map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E]"
                      >
                        <p className="text-sm font-arabic text-slate-900 dark:text-white leading-relaxed mb-2">
                          {a.arabicText}
                        </p>
                        <span className="text-[11px] text-slate-400">المصدر: {a.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hadiths found */}
              {globalSearchResults.hadiths.length > 0 && (
                <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E]">
                  <h3 className="text-xs font-bold text-slate-500 mb-3 font-arabic">
                    الأحاديث النبوية:
                  </h3>
                  <div className="space-y-3">
                    {globalSearchResults.hadiths.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E]"
                      >
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                          {h.titleAr}
                        </h4>
                        <p className="text-sm font-arabic text-slate-900 dark:text-white leading-relaxed mb-2">
                          {h.arabicText}
                        </p>
                        <span className="text-[11px] text-slate-400">المصدر: {h.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Hadith Library Section */}
      {activeSection === 'hadith' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic mb-1">
              الأربعون النووية — المتون والأسانيد المعتمدة
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              مجموعة مختارة من أصول الإسلام وقواعد الأحكام للإمام يحيى بن شرف النووي رحمه الله.
            </p>
          </div>

          <div className="space-y-4">
            {NAWAWI_HADITHS.map((hadith) => {
              const isExpanded = selectedHadithId === hadith.id;
              return (
                <div
                  key={hadith.id}
                  className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#064E3B]/10 text-[#064E3B] dark:text-[#10B981] font-bold flex items-center justify-center font-latin tabular-nums">
                        {hadith.id}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-arabic">
                        {hadith.titleAr}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold">
                      {hadith.grade}
                    </span>
                  </div>

                  <p className="text-base text-slate-900 dark:text-white font-arabic leading-loose">
                    {hadith.arabicText}
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-400 font-latin leading-relaxed">
                    "{hadith.translationEn}"
                  </div>

                  {hadith.commentaryAr && (
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-[#064E3B] dark:text-[#10B981]">
                        المستفاد من الحديث:{' '}
                      </span>
                      <span>{hadith.commentaryAr}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#E8E2D8] dark:border-[#1B352E] text-xs text-slate-500">
                    <span>رواه: {hadith.narratorAr} · {hadith.source}</span>
                    <button
                      onClick={() => handleCopy(`h_${hadith.id}`, `${hadith.arabicText}\n[${hadith.source}]`)}
                      className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#064E3B] cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedTextId === `h_${hadith.id}` ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Islamic Library Articles */}
      {activeSection === 'library' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic mb-1">
              المكتبة الإيمانية والقراءات المنهجية
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              مقالات وبحوث موثقة في الفقه والتزكية والسيرة النبوية العطرة.
            </p>
          </div>

          <div className="space-y-4">
            {ISLAMIC_ARTICLES.map((art) => (
              <div
                key={art.id}
                className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-[#064E3B] dark:text-[#10B981]">
                    {art.authorOrSource}
                  </span>
                  <span>⏳ {art.readTimeMinutes} دقائق قراءة</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-arabic">
                  {art.titleAr}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {art.summaryAr}
                </p>

                <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E]">
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-arabic leading-loose whitespace-pre-line">
                    {art.contentAr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Bookmarks Manager */}
      {activeSection === 'bookmarks' && (
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic">
                الإشارات المرجعية المحفوظة
              </h2>
              <p className="text-xs text-slate-500">
                قائمتك الخاصة بالآيات والصفحات للعودة السريعة أثناء التلاوة
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 font-latin tabular-nums">
              {bookmarks.length} إشارة
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">لا توجد إشارات مرجعية محفوظة حالياً.</p>
              <p className="text-[11px] mt-1">اضغط على أيقونة الإشارة المرجعية بجانب أي آية في المصحف لحفظها هنا.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-between text-right"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-arabic">
                        سورة {bm.surahName}
                      </h4>
                      <span className="text-xs text-slate-500">الآية {bm.ayahNumber}</span>
                    </div>
                    {bm.note && <span className="text-xs text-slate-500 block mt-0.5">{bm.note}</span>}
                    <span className="text-[10px] text-slate-400 font-latin block mt-1">
                      صفحة {bm.pageNumber} · تم الحفظ: {new Date(bm.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToQuranSurah(bm.surahNumber, bm.ayahNumber)}
                      className="px-3 py-1.5 rounded-lg bg-[#064E3B] text-white text-xs font-semibold cursor-pointer"
                    >
                      فتح
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bm.id)}
                      className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. App Settings & Data Backup */}
      {activeSection === 'settings' && (
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-arabic">
            إعدادات التطبيق وتفضيلات المستخدم
          </h2>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block font-arabic">
              مظهر الواجهة:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'emerald_light' })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
                  settings.theme === 'emerald_light'
                    ? 'border-[#064E3B] bg-emerald-50 text-[#064E3B]'
                    : 'border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>النهاري الزمردي</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'emerald_dark' })}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
                  settings.theme === 'emerald_dark'
                    ? 'border-[#10B981] bg-[#0A1A15] text-[#10B981]'
                    : 'border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>الليلي الهادئ</span>
              </button>
            </div>
          </div>

          {/* Audio & Haptics Toggles */}
          <div className="space-y-3 pt-3 border-t border-[#E8E2D8] dark:border-[#1B352E]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  المؤثرات الصوتية عند التسبيح
                </span>
                <span className="text-[11px] text-slate-500">صوت نقر لطيف عند كل تسبيحة وإنجاز</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ ...settings, soundEffects: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  الاهتزاز اللمسي (Haptic Feedback)
                </span>
                <span className="text-[11px] text-slate-500">اهتزاز خفيف للأجهزة المتوافقة</span>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => onUpdateSettings({ ...settings, hapticFeedback: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  التشغيل التلقائي للآية التالية
                </span>
                <span className="text-[11px] text-slate-500">متابعة التلاوة بعد انتهاء كل آية</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAdvanceAyah}
                onChange={(e) => onUpdateSettings({ ...settings, autoAdvanceAyah: e.target.checked })}
                className="w-4 h-4 accent-[#064E3B] cursor-pointer"
              />
            </div>
          </div>

          {/* Backup & Export */}
          <div className="pt-4 border-t border-[#E8E2D8] dark:border-[#1B352E] space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-arabic">
              النسخ الاحتياطي وإدارة البيانات
            </h3>
            <p className="text-xs text-slate-500">
              جميع بياناتك (الإشارات المرجعية، تقدم القراءة، عدادات الأذكار، وتقدم براعم زاد) محفوظة محلياً على جهازك.
            </p>

            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#043629] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>

            {exportNotice && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold">
                {exportNotice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. About ZAD */}
      {activeSection === 'about' && (
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-[#064E3B] text-[#C9A227] flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-3">
              زاد
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-arabic">
              ZAD | زاد — زاد المسلم
            </h2>
            <span className="text-xs text-slate-500 font-latin">الإصدار 1.0.0 (Web-First, Flutter-Ready)</span>
          </div>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-arabic">
            <p>
              <strong>زاد</strong> هو تطبيق إسلامي عصري متكامل، مصمم وفق أرقى معايير التصميم والتجربة الرقمية
              لخدمة المسلم في يومه وليلته.
            </p>
            <p>
              تم بناء التطبيق على مبدأ <strong>Web-First, Flutter-Ready</strong>، حيث تم فصل منطق الأعمال
              (Business Logic) والحسابات الفلكية للمواقيت والقبلة والبيانات الدينية المعتمدة في طبقات برمجية
              مستقلة تماماً (Domain Layer) لتسهيل نقلها المباشر إلى بيئة <strong>Flutter (Dart)</strong> للأجهزة
              الذكية (Android و iOS).
            </p>

            <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] space-y-2">
              <span className="font-bold text-slate-900 dark:text-white block">منهج التوثيق والاعتماد:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li>نص القرآن الكريم مطابق للمصحف العثماني (مجمع الملك فهد بالمدينة المنورة).</li>
                <li>الأذكار مستقاة من صحيح السنة النبوية المطهرة وكتب الحديث المعتمدة.</li>
                <li>حساب المواقيت فلكي شرعي دقيق وفق كبرى الهيئات الإسلامية العالمية.</li>
                <li>قسم براعم زاد يخضع لضوابط أمان وخصوصية تامة للأطفال بدون أي إعلانات أو شات خارجي.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 9. Privacy Policy */}
      {activeSection === 'privacy' && (
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-arabic">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            سياسة الخصوصية والأمان في تطبيق زاد
          </h2>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
            <strong>نحن نحترم خصوصيتك بالكامل:</strong>
            <p>التطبيق يعمل بدون تسجيل حساب إلزامي، وتخزن بياناتك محلياً على جهازك دون إرسالها لأي جهة خارجية.</p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">1. الموقع الجغرافي:</h3>
              <p>يُستخدم تحديد الموقع فقط على جهازك لحساب مواقيت الصلاة واتجاه القبلة ولا يتم تسجيله أو تتبعه أبداً.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">2. أمان الأطفال في براعم زاد:</h3>
              <p>لا نجمع أي معلومات شخصية عن الأطفال، ولا توجد غرف دردشة عامة أو روابط خارجية غير آمنة.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">3. التخزين المحلي:</h3>
              <p>يمكنك في أي وقت تصدير نسخة من بياناتك أو مسحها من ذاكرة المتصفح متى شئت.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
