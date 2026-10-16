import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  Globe,
  Info,
  MapPin,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
} from 'lucide-react';
import {
  CALCULATION_METHODS,
  calculatePrayerTimes,
  getNextPrayer,
} from '../../domain/prayer/calculator';
import {
  CalculationMethodId,
  Coordinates,
  MadhhabId,
  PrayerAdjustment,
  PrayerName,
  PrayerTimesResult,
} from '../../domain/prayer/types';
import { AppSettings } from '../../domain/settings/types';
import { POPULAR_CITIES, requestCurrentLocation } from '../../platform/location/locationService';
import { notificationService } from '../../platform/notifications/notificationService';

interface PrayerTimesViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose?: () => void;
}

const PRAYER_DETAILS: {
  id: PrayerName;
  nameAr: string;
  nameEn: string;
  descAr: string;
}[] = [
  { id: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', descAr: 'طلوع الفجر الصادق' },
  { id: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', descAr: 'طلوع حاجب الشمس' },
  { id: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', descAr: 'زوال الشمس عن كبد السماء' },
  { id: 'asr', nameAr: 'العصر', nameEn: 'Asr', descAr: 'صيرورة ظل الشيء مثله أو مثليه' },
  { id: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', descAr: 'غروب كامل قرص الشمس' },
  { id: 'isha', nameAr: 'العشاء', nameEn: 'Isha', descAr: 'غيبوبة الشفق الأحمر' },
];

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [tempAdjustments, setTempAdjustments] = useState<PrayerAdjustment>(
    settings.prayerAdjustments
  );

  const prayerTimes: PrayerTimesResult = calculatePrayerTimes(
    selectedDate,
    settings.coordinates,
    settings.calculationMethod,
    settings.madhhab,
    settings.prayerAdjustments
  );

  const nextPrayerInfo = getNextPrayer(prayerTimes, new Date());

  const handleUseGps = async () => {
    setIsLocating(true);
    setLocationError(null);
    const result = await requestCurrentLocation();
    setIsLocating(false);

    if (result.coordinates) {
      onUpdateSettings({
        ...settings,
        coordinates: result.coordinates,
        isAutoLocation: true,
      });
      if (settings.soundEffects) {
        notificationService.playHapticClick();
      }
    } else if (result.error) {
      setLocationError(result.error);
    }
  };

  const handleSelectCity = (cityCoords: Coordinates) => {
    onUpdateSettings({
      ...settings,
      coordinates: cityCoords,
      isAutoLocation: false,
    });
    setLocationError(null);
    if (settings.soundEffects) {
      notificationService.playHapticClick();
    }
  };

  const handleDateChange = (daysDelta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + daysDelta);
    setSelectedDate(next);
  };

  const handleResetDate = () => {
    setSelectedDate(new Date());
  };

  const saveAdjustment = (prayer: keyof PrayerAdjustment, delta: number) => {
    const updated = {
      ...tempAdjustments,
      [prayer]: tempAdjustments[prayer] + delta,
    };
    setTempAdjustments(updated);
    onUpdateSettings({ ...settings, prayerAdjustments: updated });
  };

  const testAdhanSound = () => {
    notificationService.playCelebrationChime();
    notificationService.showPrayerReminder('العصر', '15:20');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header & Location Controls */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>مواقيت الصلاة الدقيقة</span>
              <span aria-hidden="true">·</span>
              <span>حساب فلكي شرعي</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-arabic">
              جدول أوقات الصلوات المفروضة
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#064E3B] dark:text-[#10B981]" />
              <span>
                {settings.coordinates.city}، {settings.coordinates.country}
              </span>
              <span className="font-latin text-slate-400">
                ({settings.coordinates.latitude.toFixed(2)}°, {settings.coordinates.longitude.toFixed(2)}°)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleUseGps}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-semibold cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'جاري التحديد...' : 'موقعي الحالي (GPS)'}</span>
            </button>

            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>طريقة الحساب والتعديل</span>
            </button>
          </div>
        </div>

        {locationError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>{locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="font-bold underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Popular Cities Horizontal Scroller */}
        <div className="mt-4 pt-4 border-t border-[#E8E2D8] dark:border-[#1B352E]">
          <span className="text-[11px] text-slate-400 block mb-2 font-arabic">
            أو اختر مدينتك بضغطة واحدة:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_CITIES.map((c) => {
              const isSelected = settings.coordinates.city === c.city;
              return (
                <button
                  key={c.city}
                  onClick={() => handleSelectCity(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#064E3B] text-white font-bold shadow-sm'
                      : 'bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300 hover:border-[#064E3B]'
                  }`}
                >
                  {c.city}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Date Navigation Bar */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm flex items-center justify-between">
        <button
          onClick={() => handleDateChange(-1)}
          className="p-2 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
          title="اليوم السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-sm font-bold text-slate-900 dark:text-white font-arabic block">
            {selectedDate.toLocaleDateString('ar-SA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="text-[11px] text-slate-500 font-latin">
            {selectedDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDate}
            className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#064E3B] cursor-pointer"
          >
            اليوم
          </button>
          <button
            onClick={() => handleDateChange(1)}
            className="p-2 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            title="اليوم التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Daily Prayer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRAYER_DETAILS.map((prayer) => {
          const prayerTime: Date = (prayerTimes as any)[prayer.id];
          const isNext = nextPrayerInfo.nextPrayer === prayer.id;

          return (
            <div
              key={prayer.id}
              className={`rounded-2xl p-5 border transition-all flex items-center justify-between shadow-sm ${
                isNext
                  ? 'bg-gradient-to-br from-[#064E3B] to-[#043629] text-white border-[#064E3B] scale-[1.02] shadow-md'
                  : 'bg-white dark:bg-[#11221D] border-[#E8E2D8] dark:border-[#1B352E] text-slate-900 dark:text-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`text-lg font-bold font-arabic ${
                      isNext ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    صلاة {prayer.nameAr}
                  </h3>
                  {isNext && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C9A227] text-slate-900">
                      القادمة
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs block ${
                    isNext ? 'text-emerald-200' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {prayer.descAr}
                </span>
              </div>

              <div className="text-left">
                <span
                  className={`text-2xl font-extrabold font-latin tabular-nums tracking-wide block ${
                    isNext ? 'text-[#E0BA3E]' : 'text-[#064E3B] dark:text-[#10B981]'
                  }`}
                >
                  {prayerTime.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  className={`text-[10px] font-latin block ${
                    isNext ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {prayer.nameEn}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Midnight & Last Third of Night (Qiyam al-Layl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              منتصف الليل الشرعي
            </span>
            <span className="text-[11px] text-slate-500">نهاية وقت العشاء الاختياري</span>
          </div>
          <span className="text-base font-bold font-latin tabular-nums text-slate-700 dark:text-slate-300">
            {prayerTimes.midnight.toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              الثلث الأخير من الليل
            </span>
            <span className="text-[11px] text-slate-500">أفضل وقت لقيام الليل واستجابة الدعاء</span>
          </div>
          <span className="text-base font-bold font-latin tabular-nums text-slate-700 dark:text-slate-300">
            {prayerTimes.lastThird.toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* 5. Calculation Settings Drawer / Modal */}
      {showSettingsDrawer && (
        <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#1B352E]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-arabic">
              إعدادات الحساب الفلكي والمذهب
            </h3>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-xs font-semibold text-[#064E3B] dark:text-[#10B981] hover:underline cursor-pointer"
            >
              حفظ وإغلاق
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calculation Method */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                طريقة الحساب والجهات المعتمدة:
              </label>
              <select
                value={settings.calculationMethod}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    calculationMethod: e.target.value as CalculationMethodId,
                  })
                }
                className="w-full p-2.5 bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {Object.values(CALCULATION_METHODS).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nameAr} ({m.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Asr Madhhab */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                مذهب حساب وقت صلاة العصر:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateSettings({ ...settings, madhhab: 'SHAFI' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    settings.madhhab === 'SHAFI'
                      ? 'bg-[#064E3B] text-white border-[#064E3B]'
                      : 'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  الجمهور (الشافعي، المالكي، الحنبلي)
                </button>
                <button
                  onClick={() => onUpdateSettings({ ...settings, madhhab: 'HANAFI' })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    settings.madhhab === 'HANAFI'
                      ? 'bg-[#064E3B] text-white border-[#064E3B]'
                      : 'bg-[#FAF8F5] dark:bg-[#0A1411] border-[#E8E2D8] dark:border-[#1B352E] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  الحنفي (ظل الشيء مثليه)
                </button>
              </div>
            </div>
          </div>

          {/* Minute Adjustments */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              التعديل اليدوي بالدقائق (مطابقة لمسجدك المحلي):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as (keyof PrayerAdjustment)[]).map(
                (p) => (
                  <div
                    key={p}
                    className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#0A1411] border border-[#E8E2D8] dark:border-[#1B352E] text-center"
                  >
                    <span className="text-xs font-bold block mb-1">
                      {PRAYER_DETAILS.find((item) => item.id === p)?.nameAr}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => saveAdjustment(p, -1)}
                        className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-latin font-bold tabular-nums">
                        {tempAdjustments[p] > 0 ? `+${tempAdjustments[p]}` : tempAdjustments[p]}
                      </span>
                      <button
                        onClick={() => saveAdjustment(p, 1)}
                        className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Adhan Notification Test */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">اختبار صوت التنبيه والتنبيهات:</span>
            <button
              onClick={testAdhanSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D8] dark:border-[#1B352E] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>تجربة التنبيه</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
