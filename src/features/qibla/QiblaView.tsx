import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { calculateQiblaDirection, KAABA_COORDINATES } from '../../domain/prayer/calculator';
import { AppSettings } from '../../domain/settings/types';
import { CompassReading, CompassStatus, compassService } from '../../platform/sensors/compassService';
import { notificationService } from '../../platform/notifications/notificationService';

interface QiblaViewProps {
  settings: AppSettings;
}

export const QiblaView: React.FC<QiblaViewProps> = ({ settings }) => {
  const { bearingDegrees, distanceKm } = calculateQiblaDirection(settings.coordinates);

  const [sensorStatus, setSensorStatus] = useState<CompassStatus>('prompt');
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [useManualMode, setUseManualMode] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const isSensorSupported = compassService.isSensorAvailable();

  const handleStartSensor = async () => {
    setPermissionError(null);
    const granted = await compassService.requestPermissionAndStart((reading: CompassReading) => {
      setSensorStatus(reading.status);
      if (reading.status === 'granted') {
        setDeviceHeading(reading.heading);
      } else if (reading.errorMessage) {
        setPermissionError(reading.errorMessage);
      }
    });

    if (!granted) {
      setSensorStatus('denied');
      setUseManualMode(true);
    }
  };

  useEffect(() => {
    return () => {
      compassService.stopListening();
    };
  }, []);

  const activeHeading = useManualMode || sensorStatus !== 'granted' ? manualHeading : deviceHeading;

  // The angle to rotate the needle so it points toward Kaaba
  // needle rotation = bearingDegrees - activeHeading
  const qiblaAngleDiff = (bearingDegrees - activeHeading + 360) % 360;
  const isAligned = Math.abs(qiblaAngleDiff) < 4 || Math.abs(qiblaAngleDiff - 360) < 4;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* 1. Header Information */}
      <div className="bg-white dark:bg-[#11221D] rounded-2xl p-6 border border-[#E8E2D8] dark:border-[#1B352E] shadow-sm text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#064E3B]/10 dark:bg-[#10B981]/15 text-[#064E3B] dark:text-[#10B981] text-xs font-semibold mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>الموقع المعتمد: {settings.coordinates.city}، {settings.coordinates.country}</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-arabic tracking-tight">
          بوصلة اتجاه القبلة المشرفة
        </h1>

        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#E8E2D8] dark:border-[#1B352E]">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-arabic">
              زاوية القبلة من الشمال
            </span>
            <span className="text-2xl font-extrabold font-latin tabular-nums text-[#064E3B] dark:text-[#10B981]">
              {bearingDegrees}°
            </span>
          </div>

          <div className="w-px h-10 bg-[#E8E2D8] dark:border-[#1B352E]" />

          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-arabic">
              المسافة إلى الكعبة المشرفة
            </span>
            <span className="text-2xl font-extrabold font-latin tabular-nums text-slate-800 dark:text-slate-200">
              {distanceKm.toLocaleString('ar-SA')} كم
            </span>
          </div>
        </div>
      </div>

      {/* 2. Compass Interface */}
      <div className="bg-white dark:bg-[#11221D] rounded-3xl p-8 border border-[#E8E2D8] dark:border-[#1B352E] shadow-md flex flex-col items-center justify-center relative overflow-hidden">
        {/* Alignment Indicator Badge */}
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all mb-6 ${
            isAligned
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {isAligned ? '✓ أنت الآن تواجه القبلة المشرفة مباشرة!' : 'وجّه جهازك حتى ينطبق المؤشر على الكعبة'}
        </div>

        {/* Circular Compass Dial */}
        <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
          {/* Compass Rose Outer Rim */}
          <div
            className="absolute inset-0 rounded-full border-4 border-[#E8E2D8] dark:border-[#1B352E] bg-gradient-to-b from-[#FAF8F5] to-white dark:from-[#0A1411] dark:to-[#11221D] shadow-inner flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${-activeHeading}deg)` }}
          >
            {/* Cardinal Marks */}
            <span className="absolute top-2 text-sm font-extrabold text-red-600 font-latin">N</span>
            <span className="absolute bottom-2 text-xs font-bold text-slate-400 font-latin">S</span>
            <span className="absolute right-2 text-xs font-bold text-slate-400 font-latin">E</span>
            <span className="absolute left-2 text-xs font-bold text-slate-400 font-latin">W</span>

            {/* Degree Ticks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute w-full h-full flex justify-center items-start pt-1 pointer-events-none"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div className={`w-0.5 ${deg % 90 === 0 ? 'h-3 bg-slate-400' : 'h-1.5 bg-slate-200 dark:bg-slate-700'}`} />
              </div>
            ))}

            {/* Kaaba Target Icon on Ring */}
            <div
              className="absolute w-full h-full flex justify-center items-start pt-6 pointer-events-none"
              style={{ transform: `rotate(${bearingDegrees}deg)` }}
            >
              <div className="w-8 h-8 rounded-lg bg-black text-[#C9A227] border-2 border-[#C9A227] flex items-center justify-center text-[10px] font-bold shadow-md">
                🕋
              </div>
            </div>
          </div>

          {/* Needle Center Pivot */}
          <div className="relative z-10 w-14 h-14 rounded-full bg-white dark:bg-[#11221D] border-2 border-[#064E3B] shadow flex items-center justify-center">
            <Compass className={`w-7 h-7 ${isAligned ? 'text-emerald-600' : 'text-[#064E3B]'}`} />
          </div>

          {/* Pointer Needle pointing to Kaaba */}
          <div
            className="absolute z-20 w-full h-full flex justify-center items-center pointer-events-none transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${qiblaAngleDiff}deg)` }}
          >
            <div className="w-2.5 h-32 bg-gradient-to-t from-transparent via-[#064E3B] to-[#C9A227] rounded-full -translate-y-12 shadow-sm" />
          </div>
        </div>

        {/* Current Heading & Mode Status */}
        <div className="mt-8 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-latin tabular-nums">
            اتجاه الجهاز الحالي: <span className="font-bold text-slate-800 dark:text-slate-200">{activeHeading}°</span>
          </div>

          {sensorStatus === 'prompt' && isSensorSupported && (
            <button
              onClick={handleStartSensor}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#064E3B] text-white hover:bg-[#043629] text-xs font-semibold shadow transition-transform active:scale-95 cursor-pointer"
            >
              تشغيل حساس البوصلة بالجهاز
            </button>
          )}

          {sensorStatus === 'granted' && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>الحساس الحركي يعمل بدقة عالية</span>
            </div>
          )}

          {(sensorStatus === 'denied' || !isSensorSupported || useManualMode) && (
            <div className="mt-4 w-full max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>محاكي تدوير البوصلة (لأجهزة الحاسوب):</span>
                <span className="font-latin font-bold">{manualHeading}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={manualHeading}
                onChange={(e) => {
                  setManualHeading(Number(e.target.value));
                  setUseManualMode(true);
                }}
                className="w-full accent-[#064E3B] cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Calibration & Guidance Note */}
      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold font-arabic">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>إرشادات ضبط دقة البوصلة:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          <li>ابتعد عن الأجسام المعدنية القريبة، السماعات، والأجهزة الإلكترونية الكبيرة لتجنب التداخل المغناطيسي.</li>
          <li>قم بمعايرة الحساس بتحريك هاتفك في الهواء على شكل رقم (8) الإنجليزي لمدة خمس ثوانٍ.</li>
          <li>ضع الهاتف في مستوى أفقي مستوٍ للحصول على أدق قراءة للاتجاه.</li>
        </ul>
      </div>
    </div>
  );
};
