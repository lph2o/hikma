// Normalisation : RawQuranData → NormalizedQuranData.
// La normalisation ne modifie JAMAIS le texte coranique de manière destructive.
// text_uthmani est conservé tel quel ; text_simple (imlaei) est conservé si fourni.

import {
  TRANSLATION_RESOURCES,
  type QuranComVerse,
  type QuranComWord,
  type RawQuranData,
} from "./adapters/quran-com-adapter";
import type {
  NormalizedAyah,
  NormalizedQuranData,
  NormalizedRecitation,
  NormalizedSurah,
  NormalizedTranslation,
  NormalizedWord,
} from "./types";

const VALID_WORD_TYPES = new Set(["word"]);

function isWord(token: QuranComWord): boolean {
  return VALID_WORD_TYPES.has(token.char_type_name);
}

function normalizeRevelationPlace(
  place: string | null,
): NormalizedSurah["revelation_place"] {
  return place === "makkah" || place === "madinah" ? place : null;
}

export function normalizeQuranData(raw: RawQuranData): NormalizedQuranData {
  const surahs: NormalizedSurah[] = [];
  const ayahs: NormalizedAyah[] = [];
  const occurrences: NormalizedQuranData["occurrences"] = [];
  const translations: NormalizedTranslation[] = [];
  const wordsByArabic = new Map<string, NormalizedWord>();

  let globalAyahNumber = 0;

  for (const chapter of raw.chapters) {
    surahs.push({
      number: chapter.id,
      name_arabic: chapter.name_arabic,
      name_transliteration: chapter.name_simple || null,
      name_translation: chapter.translated_name?.name ?? null,
      revelation_place: normalizeRevelationPlace(chapter.revelation_place),
      ayah_count: chapter.verses_count,
    });

    const verses = raw.versesByChapter.get(chapter.id) ?? [];
    for (const verse of verses) {
      globalAyahNumber += 1;
      ayahs.push(normalizeAyah(chapter.id, verse, globalAyahNumber));

      for (const token of verse.words ?? []) {
        if (!isWord(token)) continue;

        // Première occurrence de la forme = translittération + sens de provenance.
        // (valeurs fournies par la source ; aucune déduction automatique)
        if (!wordsByArabic.has(token.text)) {
          wordsByArabic.set(token.text, {
            arabic: token.text,
            transliteration: token.transliteration?.text ?? null,
            meaning: token.translation?.text ?? null,
            root: null,
          });
        }

        occurrences.push({
          surah_number: chapter.id,
          ayah_number: verse.verse_number,
          position: token.position,
          word_arabic: token.text,
          text: token.text,
          normalized_text: null,
        });
      }

      for (const tr of verse.translations ?? []) {
        const resource = TRANSLATION_RESOURCES.find(
          (r) => r.resource_id === tr.resource_id,
        );
        if (!resource) continue;
        translations.push({
          surah_number: chapter.id,
          ayah_number: verse.verse_number,
          language: resource.language,
          translator: resource.translator,
          resource_id: tr.resource_id,
          text: tr.text,
        });
      }
    }
  }

  const recitations: NormalizedRecitation[] = raw.reciters.map((r) => ({
    quran_com_id: r.id,
    reciter_id: r.reciter_id,
    name: r.name,
    style: r.style?.name ?? null,
    qirat: r.qirat?.name ?? null,
  }));

  return {
    surahs,
    ayahs,
    words: [...wordsByArabic.values()],
    occurrences,
    translations,
    recitations,
  };
}

function normalizeAyah(
  surahNumber: number,
  verse: QuranComVerse,
  globalAyahNumber: number,
): NormalizedAyah {
  return {
    surah_number: surahNumber,
    ayah_number: verse.verse_number,
    global_ayah_number: globalAyahNumber,
    text_uthmani: verse.text_uthmani,
    text_simple: verse.text_imlaei ?? null,
  };
}
