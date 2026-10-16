import { Coordinates } from '../../domain/prayer/types';

export const POPULAR_CITIES: Coordinates[] = [
  { city: 'مكة المكرمة', country: 'المملكة العربية السعودية', latitude: 21.4225, longitude: 39.8262 },
  { city: 'المدينة المنورة', country: 'المملكة العربية السعودية', latitude: 24.4672, longitude: 39.6111 },
  { city: 'القاهرة', country: 'مصر', latitude: 30.0444, longitude: 31.2357 },
  { city: 'الرياض', country: 'المملكة العربية السعودية', latitude: 24.7136, longitude: 46.6753 },
  { city: 'القدس الشريف', country: 'فلسطين', latitude: 31.7683, longitude: 35.2137 },
  { city: 'دبي', country: 'الإمارات العربية المتحدة', latitude: 25.2048, longitude: 55.2708 },
  { city: 'إسطنبول', country: 'تركيا', latitude: 41.0082, longitude: 28.9784 },
  { city: 'عَمّان', country: 'الأردن', latitude: 31.9454, longitude: 35.9284 },
  { city: 'الدوحة', country: 'قطر', latitude: 25.2854, longitude: 51.5310 },
  { city: 'الكويت', country: 'الكويت', latitude: 29.3759, longitude: 47.9774 },
  { city: 'الرباط', country: 'المغرب', latitude: 34.0209, longitude: -6.8416 },
  { city: 'الجزائر العاصمة', country: 'الجزائر', latitude: 36.7538, longitude: 3.0588 },
  { city: 'تونس', country: 'تونس', latitude: 36.8065, longitude: 10.1815 },
  { city: 'بغداد', country: 'العراق', latitude: 33.3152, longitude: 44.3661 },
  { city: 'بيروت', country: 'لبنان', latitude: 33.8938, longitude: 35.5018 },
  { city: 'جاكرتا', country: 'إندونيسيا', latitude: -6.2088, longitude: 106.8456 },
  { city: 'كوالالمبور', country: 'ماليزيا', latitude: 3.1390, longitude: 101.6869 },
  { city: 'لندن', country: 'المملكة المتحدة', latitude: 51.5074, longitude: -0.1278 },
  { city: 'باريس', country: 'فرنسا', latitude: 48.8566, longitude: 2.3522 },
  { city: 'نيويورك', country: 'الولايات المتحدة', latitude: 40.7128, longitude: -74.0060 },
];

export interface GeolocationResult {
  coordinates?: Coordinates;
  error?: string;
}

export async function requestCurrentLocation(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return { error: 'خاصية تحديد الموقع الجغرافي غير مدعومة في هذا المتصفح.' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          coordinates: {
            latitude: Math.round(pos.coords.latitude * 10000) / 10000,
            longitude: Math.round(pos.coords.longitude * 10000) / 10000,
            city: 'الموقع الحالي (GPS)',
            country: 'تحديد تلقائي',
          },
        });
      },
      (err) => {
        let msg = 'تعذر الحصول على الموقع الجغرافي.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'تم رفض إذن تحديد الموقع. يمكنك اختيار مدينتك يدوياً من القائمة.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'معلومات الموقع غير متوفرة حالياً.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'انتهت مهلة طلب الموقع.';
        }
        resolve({ error: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}
