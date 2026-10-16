# ZAD | زاد — Feature-by-Feature Flutter Implementation Checklist

## Phase 2 Migration Checklist

### 1. Foundation & Assets
- [ ] Initialize Flutter 3.29+ project: `flutter create zad --org com.zad.islamic`
- [ ] Add fonts: `Amiri-Regular.ttf`, `Amiri-Bold.ttf`, `Cairo-VariableFont_slnt,wght.ttf`
- [ ] Add color system in `lib/core/constants/colors.dart`:
  - `primaryEmerald`: `0xFF064E3B`
  - `goldAccent`: `0xFFC9A227`
  - `ivoryCanvas`: `0xFFFAF8F5`
  - `darkCanvas`: `0xFF0A1411`
- [ ] Bundle static JSON datasets into `assets/data/`:
  - `quran_metadata.json`
  - `azkar_data.json`
  - `baraem_data.json`
  - `nawawi_hadiths.json`

### 2. Domain & Calculation Layer
- [ ] Port `src/domain/prayer/calculator.ts` to `lib/domain/prayer/prayer_calculator.dart`
- [ ] Port Great-circle Kaaba Qibla bearing formula
- [ ] Write unit tests verifying calculation parity between Web and Dart for Makkah, Cairo, London, New York

### 3. Local Persistence
- [ ] Implement `IStorageRepository` using `isar` or `shared_preferences`
- [ ] Match schema versioning with Phase 1 Web exports so user JSON backups can be imported directly into Flutter!

### 4. Quran Module
- [ ] Render 604-page Madinah Mushaf layout or Ayah-by-Ayah list
- [ ] Port Tafsir Al-Muyassar viewer
- [ ] Implement audio playback via `just_audio` + lock-screen controls via `audio_service`
- [ ] Cache audio tracks locally when downloaded

### 5. Azkar & Misbaha
- [ ] Port interactive dhikr repetition counters with category progress
- [ ] Port Digital Tasbih dial with `HapticFeedback.lightImpact()` on tap
- [ ] Add celebratory sound effect on completing target counts

### 6. Qibla Compass
- [ ] Integrate `flutter_compass`
- [ ] Add smooth low-pass filter / dampening for physical needle rotation
- [ ] Fallback to numerical dial if magnetometer sensor unavailable

### 7. Bara'em ZAD Children's Learning
- [ ] Port 4 age tracks (3-5, 6-8, 9-12, 13+)
- [ ] Interactive storytelling view with audio prompts
- [ ] Quiz challenge with celebration animation (`confetti` package in Flutter)
- [ ] Parental gate with simple math challenge

### 8. Background Adhan Notifications
- [ ] Schedule exact background alarms via `flutter_local_notifications`
- [ ] Support custom adhan audio for Fajr vs daytime prayers
