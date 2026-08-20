import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportStats, NormalizedQuranData } from "../types";
import {
  AyahRepository,
  ImportRepository,
  OccurrenceRepository,
  RecitationRepository,
  SourceRepository,
  SurahRepository,
  TranslationRepository,
  WordRepository,
  type AyahUpsert,
  type OccurrenceUpsert,
  type RecitationUpsert,
  type SurahUpsert,
  type TranslationUpsert,
  type UpsertStats,
  type WordUpsert,
} from "../repositories";

export type SourceMetadata = {
  name: string;
  type: string;
  url: string;
  version: string;
  license: string | null;
  metadata: Record<string, unknown>;
};

export type ImportResult = {
  stats: ImportStats;
  inserted: number;
  updated: number;
  failed: number;
};

function resolve<T>(map: Map<unknown, T>, key: unknown, what: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Référence introuvable (${what}) : ${String(key)}`);
  }
  return value;
}

/** Insère/upsert le jeu normalisé dans Supabase, de façon idempotente. */
export async function importQuran(
  client: SupabaseClient,
  data: NormalizedQuranData,
  source: SourceMetadata,
): Promise<ImportResult> {
  const sourceRepo = new SourceRepository(client);
  const importRepo = new ImportRepository(client);

  const sourceId = await sourceRepo.upsert({
    name: source.name,
    type: source.type,
    url: source.url,
    version: source.version,
    license: source.license,
    retrieved_at: new Date().toISOString(),
    metadata: source.metadata,
  });

  const importId = await importRepo.create(sourceId, source.version);

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const add = (s: UpsertStats) => {
    inserted += s.inserted;
    updated += s.updated;
    failed += s.failed;
  };

  try {
    const surahRepo = new SurahRepository(client);
    const surahRows: SurahUpsert[] = data.surahs.map((s) => ({
      number: s.number,
      name_arabic: s.name_arabic,
      name_transliteration: s.name_transliteration,
      name_translation: s.name_translation,
      revelation_place: s.revelation_place,
      ayah_count: s.ayah_count,
      source_id: sourceId,
    }));
    const { stats: surahStats, idByNumber } = await surahRepo.upsertAll(surahRows);
    add(surahStats);

    const ayahRepo = new AyahRepository(client);
    const ayahRows: AyahUpsert[] = data.ayahs.map((a) => ({
      surah_id: resolve(idByNumber, a.surah_number, "sourate"),
      ayah_number: a.ayah_number,
      global_ayah_number: a.global_ayah_number,
      text_uthmani: a.text_uthmani,
      text_simple: a.text_simple,
      source_id: sourceId,
    }));
    const { stats: ayahStats, idByKey } = await ayahRepo.upsertAll(ayahRows);
    add(ayahStats);

    const wordRepo = new WordRepository(client);
    const wordRows: WordUpsert[] = data.words.map((w) => ({
      arabic: w.arabic,
      transliteration: w.transliteration,
      meaning: w.meaning,
      root: w.root,
      source_id: sourceId,
    }));
    const { stats: wordStats, idByArabic } = await wordRepo.upsertAll(wordRows);
    add(wordStats);

    const occurrenceRepo = new OccurrenceRepository(client);
    const occurrenceRows: OccurrenceUpsert[] = data.occurrences.map((o) => ({
      ayah_id: resolve(
        idByKey,
        `${resolve(idByNumber, o.surah_number, "sourate")}:${o.ayah_number}`,
        "verset",
      ),
      word_id: resolve(idByArabic, o.word_arabic, "mot"),
      position: o.position,
      text: o.text,
      normalized_text: o.normalized_text,
      source_id: sourceId,
    }));
    add(await occurrenceRepo.upsertAll(occurrenceRows));

    const translationRepo = new TranslationRepository(client);
    const translationRows: TranslationUpsert[] = data.translations.map((t) => ({
      ayah_id: resolve(
        idByKey,
        `${resolve(idByNumber, t.surah_number, "sourate")}:${t.ayah_number}`,
        "verset",
      ),
      language: t.language,
      translator: t.translator,
      resource_id: t.resource_id,
      text: t.text,
      source_id: sourceId,
    }));
    add(await translationRepo.upsertAll(translationRows));

    const recitationRepo = new RecitationRepository(client);
    const recitationRows: RecitationUpsert[] = data.recitations.map((r) => ({
      quran_com_id: r.quran_com_id,
      reciter_id: r.reciter_id,
      name: r.name,
      style: r.style,
      qirat: r.qirat,
      source_id: sourceId,
    }));
    add(await recitationRepo.upsertAll(recitationRows));

    await importRepo.complete(importId, { imported: inserted, updated, failed });

    return {
      stats: {
        surahs: data.surahs.length,
        ayahs: data.ayahs.length,
        words: data.words.length,
        occurrences: data.occurrences.length,
        translations: data.translations.length,
        recitations: data.recitations.length,
      },
      inserted,
      updated,
      failed,
    };
  } catch (err) {
    await importRepo.fail(importId, {
      message: err instanceof Error ? err.message : String(err),
    }).catch(() => {
      // On préserve l'erreur d'origine.
    });
    throw err;
  }
}
