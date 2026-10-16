# ZAD | زاد — Repositories & Service Contracts

## 1. Storage Repository Contract (`IStorageRepository`)
In Flutter, implement using `isar` or `shared_preferences` / `hive_ce`:

```dart
abstract class IStorageRepository {
  Future<AppSettings> getSettings();
  Future<void> saveSettings(AppSettings settings);

  Future<ReadingProgress> getReadingProgress();
  Future<void> saveReadingProgress(ReadingProgress progress);

  Future<List<Bookmark>> getBookmarks();
  Future<void> addBookmark(Bookmark bookmark);
  Future<void> removeBookmark(String bookmarkId);

  Future<AzkarProgress> getAzkarProgress();
  Future<void> saveAzkarProgress(AzkarProgress progress);

  Future<ChildLearningProfile> getChildProfile();
  Future<void> saveChildProfile(ChildLearningProfile profile);

  Future<String> exportBackupJson();
}
```

## 2. Sensor & Compass Service Contract (`ICompassService`)
On Android & iOS, use `flutter_compass` plugin:

```dart
abstract class ICompassService {
  Stream<double> get compassHeadingStream;
  Future<bool> checkPermission();
  Future<bool> requestPermission();
}
```

## 3. Location Service Contract (`ILocationService`)
On Android & iOS, use `geolocator`:

```dart
abstract class ILocationService {
  Future<Position?> getCurrentPosition();
  List<CityPreset> getPopularCities();
}
```

## 4. Local Notification Service Contract (`INotificationService`)
On Android & iOS, use `flutter_local_notifications`:
- Exact alarm scheduling for Fajr, Dhuhr, Asr, Maghrib, Isha
- Background sound with custom Adhan audio asset
- Notification actions ("فتح التطبيق", "تذكير لاحقاً").
