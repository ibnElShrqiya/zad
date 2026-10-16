# ZAD | زاد — Flutter Migration Architecture Overview

## 1. Executive Summary
ZAD (زاد المسلم) is designed with a strict Clean Architecture pattern. The TypeScript implementation in Phase 1 establishes the exact business boundaries, pure mathematical engines, and domain contracts required for Phase 2 cross-platform implementation in **Flutter (Dart)** for iOS, Android, and Web.

## 2. Layer Separation & Dart Portability Matrix

| Web Layer (Phase 1: TypeScript) | Flutter Target (Phase 2: Dart) | Direct Logic Portability |
| :--- | :--- | :--- |
| `src/domain/prayer/calculator.ts` | `lib/domain/prayer/prayer_calculator.dart` | **100% Direct** (Pure trigonometric math) |
| `src/domain/prayer/types.ts` | `lib/domain/prayer/prayer_models.dart` | **100% Direct** (`freezed` or plain Dart models) |
| `src/domain/quran/types.ts` | `lib/domain/quran/quran_models.dart` | **100% Direct** (`freezed` / `json_serializable`) |
| `src/domain/azkar/types.ts` | `lib/domain/azkar/azkar_models.dart` | **100% Direct** |
| `src/domain/learning/types.ts` | `lib/domain/learning/learning_models.dart` | **100% Direct** |
| `src/data/quran/quranMetadata.ts` | `assets/data/quran_metadata.json` | **100% Direct** (Asset bundle) |
| `src/data/azkar/azkarData.ts` | `assets/data/azkar_data.json` | **100% Direct** (Asset bundle) |
| `src/data/learning/baraemData.ts` | `assets/data/baraem_data.json` | **100% Direct** (Asset bundle) |
| `src/platform/audio/audioService.ts`| `lib/services/audio_service.dart` | Adapter pattern wrapping `just_audio` |
| `src/platform/sensors/compassService.ts` | `lib/services/compass_service.dart` | Adapter pattern wrapping `flutter_compass` |
| `src/platform/location/locationService.ts` | `lib/services/location_service.dart` | Adapter pattern wrapping `geolocator` |
| `src/data/storage/storageAdapter.ts` | `lib/data/repositories/storage_repository.dart` | Adapter pattern wrapping `isar` or `hive_ce` |

## 3. Flutter Target Project Structure
```text
zad_flutter/
├── assets/
│   ├── data/
│   │   ├── quran_metadata.json
│   │   ├── quran_uthmani_604.json
│   │   ├── azkar_verified.json
│   │   ├── baraem_lessons.json
│   │   └── hadith_nawawi.json
│   ├── fonts/
│   │   ├── Amiri-Regular.ttf
│   │   └── Cairo-SemiBold.ttf
│   └── audio/
│       └── adhan_sample.mp3
├── lib/
│   ├── core/
│   │   ├── constants/colors.dart       // Emerald #064E3B, Gold #C9A227, Ivory #FAF8F5
│   │   ├── theme/theme.dart
│   │   └── utils/date_formatter.dart
│   ├── domain/
│   │   ├── prayer/
│   │   ├── quran/
│   │   ├── azkar/
│   │   └── learning/
│   ├── data/
│   │   ├── repositories/
│   │   └── datasources/
│   ├── services/
│   │   ├── audio_playback_service.dart
│   │   ├── compass_sensor_service.dart
│   │   ├── location_service.dart
│   │   └── notification_service.dart
│   └── presentation/
│       ├── home/
│       ├── quran/
│       ├── azkar/
│       ├── qibla/
│       ├── learning_baraem/
│       └── more/
└── pubspec.yaml
```
