# ZAD | زاد — Calculation & Audio Engine Specifications

## 1. Astronomical Prayer Times Mathematics
The calculator engine written in `/src/domain/prayer/calculator.ts` is 100% mathematical and relies on zero browser or external dependencies.

### Formulas:
1. **Julian Day ($JD$)**: Computed from Gregorian calendar year, month, day.
2. **Sun Declination ($\delta$) & Equation of Time ($EqT$)**:
   $$\text{Solar Noon (Dhuhr)} = 12 + \text{Timezone} - \frac{\text{Longitude}}{15} - \frac{EqT}{60}$$
3. **Sunrise / Sunset**:
   $$H_0 = \arccos\left(\frac{\sin(-0.8333^\circ) - \sin\phi \sin\delta}{\cos\phi \cos\delta}\right)$$
4. **Fajr**:
   $$H_{\text{fajr}} = \arccos\left(\frac{\sin(-\alpha) - \sin\phi \sin\delta}{\cos\phi \cos\delta}\right)$$
   Where $\alpha$ is method-specific Fajr angle (e.g. 18.5° for Umm Al-Qura, 18.0° for MWL, 19.5° for Egypt).
5. **Asr**:
   Shadow factor $n = 1$ (Shafi'i, Maliki, Hanbali) or $n = 2$ (Hanafi).
   $$\text{Asr Altitude} = \text{arccot}(n + \tan|\phi - \delta|)$$
6. **Maghrib & Isha**:
   Either twilight angle $\beta$ or fixed interval (e.g. 90 minutes after Maghrib).

### Direct Dart Porting:
In Dart, use standard `dart:math` library functions (`sin`, `cos`, `asin`, `acos`, `atan`, `atan2`). The exact code translates 1:1.

---

## 2. Qibla Bearing Calculation
Great Circle Forward Azimuth Formula:
$$\Delta\lambda = \lambda_{\text{Kaaba}} - \lambda_{\text{User}}$$
$$y = \sin(\Delta\lambda) \cdot \cos(\phi_{\text{Kaaba}})$$
$$x = \cos(\phi_{\text{User}}) \cdot \sin(\phi_{\text{Kaaba}}) - \sin(\phi_{\text{User}}) \cdot \cos(\phi_{\text{Kaaba}}) \cdot \cos(\Delta\lambda)$$
$$\text{Bearing} = (\text{atan2}(y, x) \cdot 180 / \pi + 360) \pmod{360}$$

---

## 3. Audio Recitation Playback Interface
In Flutter Phase 2, implement `IAudioService` using `just_audio` and `audio_service`:

```dart
abstract class IAudioService {
  Future<void> playAyah({
    required int surahNumber,
    required int ayahNumberInSurah,
    required int globalAyahNumber,
    required String reciterId,
  });
  Future<void> pause();
  Future<void> resume();
  Future<void> seek(Duration position);
  Stream<AudioPlaybackState> get stateStream;
}
```
CDN Audio URLs follow:
`https://cdn.islamic.network/quran/audio/128/{reciterId}/{globalAyahNumber}.mp3`
