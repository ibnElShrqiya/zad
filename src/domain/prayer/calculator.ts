import {
  CalculationMethodId,
  CalculationParameters,
  Coordinates,
  MadhhabId,
  NextPrayerInfo,
  PrayerAdjustment,
  PrayerName,
  PrayerTimesResult,
} from './types';

// Constants
export const KAABA_COORDINATES: Coordinates = {
  latitude: 21.422487,
  longitude: 39.826206,
  city: 'Makkah',
  country: 'Saudi Arabia',
};

export const CALCULATION_METHODS: Record<CalculationMethodId, CalculationParameters> = {
  MWL: {
    id: 'MWL',
    name: 'Muslim World League',
    nameAr: 'رابطة العالم الإسلامي',
    fajrAngle: 18.0,
    ishaAngle: 17.0,
  },
  ISNA: {
    id: 'ISNA',
    name: 'Islamic Society of North America',
    nameAr: 'أمريكا الشمالية (ISNA)',
    fajrAngle: 15.0,
    ishaAngle: 15.0,
  },
  EGYPT: {
    id: 'EGYPT',
    name: 'Egyptian General Authority of Survey',
    nameAr: 'الهيئة المصرية العامة للمساحة',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  MAKKAH: {
    id: 'MAKKAH',
    name: 'Umm Al-Qura University, Makkah',
    nameAr: 'أم القرى، مكة المكرمة',
    fajrAngle: 18.5,
    ishaIntervalMinutes: 90,
  },
  KARACHI: {
    id: 'KARACHI',
    name: 'University of Islamic Sciences, Karachi',
    nameAr: 'جامعة العلوم الإسلامية بكراتشي',
    fajrAngle: 18.0,
    ishaAngle: 18.0,
  },
  TEHRAN: {
    id: 'TEHRAN',
    name: 'Institute of Geophysics, Tehran',
    nameAr: 'جامعة طهران',
    fajrAngle: 17.7,
    maghribAngle: 4.5,
    ishaAngle: 14.0,
  },
  GULF: {
    id: 'GULF',
    name: 'Gulf Standard (90 min Isha)',
    nameAr: 'الخليج العربي (90 دقيقة)',
    fajrAngle: 19.5,
    ishaIntervalMinutes: 90,
  },
};

// Trigonometric helper functions in radians
function d2r(d: number): number {
  return (d * Math.PI) / 180.0;
}

function r2d(r: number): number {
  return (r * 180.0) / Math.PI;
}

function fixAngle(a: number): number {
  a = a - 360.0 * Math.floor(a / 360.0);
  return a < 0 ? a + 360.0 : a;
}

function fixHour(a: number): number {
  a = a - 24.0 * Math.floor(a / 24.0);
  return a < 0 ? a + 24.0 : a;
}

/**
 * Calculates Julian Day number from a date
 */
function getJulianDay(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * Solar position: computes equation of time (minutes) and declination (degrees)
 */
function sunPosition(julianDate: number): { declination: number; equationOfTime: number } {
  const D = julianDate - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(d2r(g)) + 0.02 * Math.sin(d2r(2 * g)));

  const e = 23.439 - 0.00000036 * D;
  const declination = r2d(Math.asin(Math.sin(d2r(e)) * Math.sin(d2r(L))));
  
  let RA = r2d(Math.atan2(Math.cos(d2r(e)) * Math.sin(d2r(L)), Math.cos(d2r(L)))) / 15.0;
  RA = fixHour(RA);
  
  const equationOfTime = q / 15.0 - RA;
  return { declination, equationOfTime: equationOfTime * 60.0 };
}

/**
 * Sun's hour angle for a given altitude angle (in degrees)
 */
function sunHourAngle(angle: number, latitude: number, declination: number): number {
  const latRad = d2r(latitude);
  const decRad = d2r(declination);
  const angRad = d2r(angle);

  const cosH = (Math.sin(angRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));
  if (cosH > 1) return 0; // Never rises
  if (cosH < -1) return Math.PI; // Never sets
  return Math.acos(cosH);
}

/**
 * Asr altitude calculation based on shadow ratio
 */
function asrAltitude(shadowFactor: number, latitude: number, declination: number): number {
  const latDecDiff = Math.abs(latitude - declination);
  const cotA = shadowFactor + Math.tan(d2r(latDecDiff));
  return r2d(Math.atan(1.0 / cotA));
}

/**
 * Main Prayer Times Calculation Engine
 */
export function calculatePrayerTimes(
  date: Date,
  coordinates: Coordinates,
  methodId: CalculationMethodId = 'MWL',
  madhhab: MadhhabId = 'SHAFI',
  adjustments: PrayerAdjustment = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
): PrayerTimesResult {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = getJulianDay(year, month, day);
  const timezoneOffsetHours = -date.getTimezoneOffset() / 60.0;
  const method = CALCULATION_METHODS[methodId] || CALCULATION_METHODS.MWL;

  const { declination, equationOfTime } = sunPosition(jd);

  // Solar noon (Dhuhr)
  const solarNoonHours = 12 + timezoneOffsetHours - coordinates.longitude / 15.0 - equationOfTime / 60.0;

  // Sunrise / Sunset (standard angle is -0.8333 degrees)
  const sunriseHourAngle = r2d(sunHourAngle(-0.8333, coordinates.latitude, declination)) / 15.0;
  const sunriseHours = solarNoonHours - sunriseHourAngle;
  const sunsetHours = solarNoonHours + sunriseHourAngle;

  // Fajr
  const fajrHourAngle = r2d(sunHourAngle(-method.fajrAngle, coordinates.latitude, declination)) / 15.0;
  const fajrHours = solarNoonHours - fajrHourAngle;

  // Asr
  const shadowFactor = madhhab === 'HANAFI' ? 2 : 1;
  const asrAlt = asrAltitude(shadowFactor, coordinates.latitude, declination);
  const asrHourAngle = r2d(sunHourAngle(asrAlt, coordinates.latitude, declination)) / 15.0;
  const asrHours = solarNoonHours + asrHourAngle;

  // Maghrib
  let maghribHours = sunsetHours;
  if (method.maghribAngle) {
    const maghribHourAngle = r2d(sunHourAngle(-method.maghribAngle, coordinates.latitude, declination)) / 15.0;
    maghribHours = solarNoonHours + maghribHourAngle;
  }

  // Isha
  let ishaHours: number;
  if (method.ishaIntervalMinutes) {
    ishaHours = maghribHours + method.ishaIntervalMinutes / 60.0;
  } else {
    const ishaAngle = method.ishaAngle || 17.0;
    const ishaHourAngle = r2d(sunHourAngle(-ishaAngle, coordinates.latitude, declination)) / 15.0;
    ishaHours = solarNoonHours + ishaHourAngle;
  }

  // Convert fractional hours into Date objects
  function hoursToDate(h: number, minuteAdjustment: number): Date {
    const totalMinutes = h * 60.0 + minuteAdjustment;
    const d = new Date(year, month - 1, day, 0, 0, 0, 0);
    d.setMinutes(Math.round(totalMinutes));
    return d;
  }

  const fajr = hoursToDate(fajrHours, adjustments.fajr);
  const sunrise = hoursToDate(sunriseHours, adjustments.sunrise);
  const dhuhr = hoursToDate(solarNoonHours, adjustments.dhuhr + 1); // add 1-minute buffer past zenith
  const asr = hoursToDate(asrHours, adjustments.asr);
  const maghrib = hoursToDate(maghribHours, adjustments.maghrib);
  const isha = hoursToDate(ishaHours, adjustments.isha);

  // Midnight calculation (halfway between Sunset and next Fajr)
  const nextFajr = new Date(fajr.getTime() + 24 * 60 * 60 * 1000);
  const nightDurationMs = nextFajr.getTime() - maghrib.getTime();
  const midnight = new Date(maghrib.getTime() + nightDurationMs / 2);
  const lastThird = new Date(maghrib.getTime() + (nightDurationMs * 2) / 3);

  return {
    fajr,
    sunrise,
    dhuhr,
    asr,
    maghrib,
    isha,
    midnight,
    lastThird,
  };
}

/**
 * Calculates current and next prayer info with time remaining
 */
export function getNextPrayer(prayerTimes: PrayerTimesResult, now: Date = new Date()): NextPrayerInfo {
  const prayers: { name: PrayerName; time: Date }[] = [
    { name: 'fajr', time: prayerTimes.fajr },
    { name: 'sunrise', time: prayerTimes.sunrise },
    { name: 'dhuhr', time: prayerTimes.dhuhr },
    { name: 'asr', time: prayerTimes.asr },
    { name: 'maghrib', time: prayerTimes.maghrib },
    { name: 'isha', time: prayerTimes.isha },
  ];

  const nowMs = now.getTime();

  for (let i = 0; i < prayers.length; i++) {
    if (nowMs < prayers[i].time.getTime()) {
      const next = prayers[i];
      const prevTime = i > 0 ? prayers[i - 1].time.getTime() : prayers[prayers.length - 1].time.getTime() - 24 * 60 * 60 * 1000;
      const totalInterval = next.time.getTime() - prevTime;
      const elapsed = nowMs - prevTime;
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalInterval) * 100));

      const diffSec = Math.max(0, Math.floor((next.time.getTime() - nowMs) / 1000));
      return {
        currentPrayer: i > 0 ? prayers[i - 1].name : 'isha',
        nextPrayer: next.name,
        nextPrayerTime: next.time,
        timeRemainingSeconds: diffSec,
        formattedRemaining: formatSeconds(diffSec),
        progressPercent,
      };
    }
  }

  // If past Isha, next prayer is tomorrow's Fajr
  const tomorrowFajr = new Date(prayerTimes.fajr.getTime() + 24 * 60 * 60 * 1000);
  const diffSec = Math.max(0, Math.floor((tomorrowFajr.getTime() - nowMs) / 1000));
  const totalInterval = tomorrowFajr.getTime() - prayerTimes.isha.getTime();
  const elapsed = nowMs - prayerTimes.isha.getTime();
  const progressPercent = Math.min(100, Math.max(0, (elapsed / totalInterval) * 100));

  return {
    currentPrayer: 'isha',
    nextPrayer: 'fajr',
    nextPrayerTime: tomorrowFajr,
    timeRemainingSeconds: diffSec,
    formattedRemaining: formatSeconds(diffSec),
    progressPercent,
  };
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/**
 * Calculates Great-Circle Bearing to Kaaba from user's coordinates
 */
export function calculateQiblaDirection(coords: Coordinates): {
  bearingDegrees: number;
  distanceKm: number;
} {
  const lat1 = d2r(coords.latitude);
  const lon1 = d2r(coords.longitude);
  const lat2 = d2r(KAABA_COORDINATES.latitude);
  const lon2 = d2r(KAABA_COORDINATES.longitude);

  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = r2d(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  // Haversine formula for distance in km
  const R = 6371; // Earth radius in km
  const dLat = lat2 - lat1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);

  return {
    bearingDegrees: Math.round(bearing * 10) / 10,
    distanceKm,
  };
}
