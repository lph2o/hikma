import type { RawQuranData } from "../lib/quran/adapters/quran-com-adapter";

// Extrait RÉEL de l'API Quran.com (Al-Fatiha, verset 1).
// Aucune donnée coranique inventée : ce sont les valeurs réellement servies
// par https://api.qurancdn.com/api/qdc/verses/by_chapter/1.
export const fatihaRaw: RawQuranData = {
  chapters: [
    {
      id: 1,
      revelation_place: "makkah",
      name_simple: "Al-Fatihah",
      name_complex: "Al-Fātiĥah",
      name_arabic: "الفاتحة",
      verses_count: 7,
      translated_name: { language_name: "french", name: "L'ouverture" },
    },
  ],
  versesByChapter: new Map([
    [
      1,
      [
        {
          id: 1,
          verse_number: 1,
          verse_key: "1:1",
          text_uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
          text_imlaei: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          words: [
            {
              id: 1,
              position: 1,
              audio_url: "wbw/001_001_001.mp3",
              char_type_name: "word",
              text: "بِسْمِ",
              translation: { text: "In (the) name", language_name: "english" },
              transliteration: { text: "bis'mi", language_name: "english" },
            },
            {
              id: 2,
              position: 2,
              audio_url: "wbw/001_001_002.mp3",
              char_type_name: "word",
              text: "ٱللَّهِ",
              translation: { text: "(of) Allah", language_name: "english" },
              transliteration: { text: "l-lahi", language_name: "english" },
            },
            {
              id: 3,
              position: 3,
              audio_url: "wbw/001_001_003.mp3",
              char_type_name: "word",
              text: "ٱلرَّحْمَـٰنِ",
              translation: {
                text: "the Most Gracious",
                language_name: "english",
              },
              transliteration: { text: "l-raḥmāni", language_name: "english" },
            },
            {
              id: 4,
              position: 4,
              audio_url: "wbw/001_001_004.mp3",
              char_type_name: "word",
              text: "ٱلرَّحِيمِ",
              translation: { text: "the Most Merciful", language_name: "english" },
              transliteration: { text: "l-raḥīmi", language_name: "english" },
            },
            {
              id: 5,
              position: 5,
              audio_url: null,
              char_type_name: "end",
              text: "١",
              translation: { text: "(1)", language_name: "english" },
              transliteration: { text: null, language_name: "english" },
            },
          ],
          translations: [
            {
              id: 168804,
              resource_id: 31,
              text: "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.",
            },
            {
              id: 96343,
              resource_id: 20,
              text: "In the name of Allāh, the Entirely Merciful, the Especially Merciful.",
            },
            {
              id: 1294995,
              resource_id: 153,
              text: "In nome di Allah, il Compassionevole, il Misericordioso.",
            },
          ],
        },
      ],
    ],
  ]),
  reciters: [
    {
      id: 97,
      reciter_id: 20,
      name: "Yasser Ad Dussary",
      style: { name: "Murattal" },
      qirat: { name: "Hafs" },
    },
  ],
};
