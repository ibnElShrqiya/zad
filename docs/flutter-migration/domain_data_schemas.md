# ZAD | زاد — Domain Data Schemas & JSON Examples

## 1. Quran Metadata Schema (`quran_metadata.json`)
```json
[
  {
    "number": 1,
    "name": "الفاتحة",
    "englishName": "Al-Faatiha",
    "englishNameTranslation": "The Opening",
    "numberOfAyahs": 7,
    "revelationType": "Meccan",
    "pageStart": 1,
    "juzStart": 1
  }
]
```

## 2. Ayah & Tafsir Model Schema (`quran_ayahs.json`)
```json
{
  "surahNumber": 112,
  "ayahs": [
    {
      "number": 6222,
      "numberInSurah": 1,
      "text": "قُلْ هُوَ اللَّهُ أَحَدٌ",
      "translationEn": "Say, He is Allah, [who is] One,",
      "transliteration": "Qul Huwal-laahu Ahad",
      "tafsir": "قل أيها الرسول لمن سألوك عن ربك: هو الله المتفرد بالوحدانية والألوهية، لا شريك له.",
      "juz": 30,
      "page": 604
    }
  ]
}
```

## 3. Azkar Verified Schema (`azkar_data.json`)
```json
{
  "categories": [
    {
      "id": "morning",
      "titleAr": "أذكار الصباح",
      "titleEn": "Morning Adhkar",
      "descriptionAr": "حصن المسلم وبركته لبداية اليوم عند طلوع الفجر"
    }
  ],
  "items": [
    {
      "id": "m_1",
      "categoryId": "morning",
      "arabicText": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ...",
      "translationEn": "We have reached the morning and at this very morning dominion belongs to Allah...",
      "targetCount": 1,
      "virtueAr": "الاعتراف بوحدانية الله والتماس بركة اليوم...",
      "source": "صحيح مسلم (2723)"
    }
  ]
}
```

## 4. Bara'em ZAD Children's Learning Schema (`baraem_data.json`)
```json
{
  "tracks": [
    {
      "id": "track_3_5",
      "titleAr": "براعم الهدى (٣ - ٥ سنوات)",
      "ageRange": "3-5"
    }
  ],
  "lessons": [
    {
      "id": "les_3_1",
      "trackId": "track_3_5",
      "type": "manners",
      "titleAr": "الكلمة السحرية: بِسْمِ اللَّه",
      "contentAr": "علّمنا رسول الله ﷺ أن نبدأ كل عمل جميل بذكر اسم الله...",
      "points": 20,
      "durationMinutes": 4,
      "quiz": [
        {
          "id": "q_3_1_1",
          "questionAr": "ماذا نقول قبل أن نبدأ في تناول الطعام؟",
          "optionsAr": ["بِسْمِ اللَّه", "مرحباً", "مع السلامة"],
          "correctIndex": 0,
          "explanationAr": "أحسنت! نقول دائماً (بسم الله)."
        }
      ]
    }
  ]
}
```
