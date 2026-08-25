/**
 * PHASE 89 — PRE-PRODUCTION READINESS AUDIT (DB read-only, paginated).
 *
 * STRICTEMENT READ-ONLY. Aucune écriture DB (DATABASE_WRITES = 0).
 *
 * La première version révéla que la REST API de Supabase tronque chaque GET à
 * 1000 lignes : les compteurs « exactement 1000 » et les faux-supposés
 * « orphelins » étaient des artefacts de troncature. Cette version :
 *   - lit les TOTAUX via `count: exact, head: true` ;
 *   - pagine les lectures croisées par `range(from,to)` ;
 *   - vérifie l'intégrité réelle : lessons sans words, lesson_words ciblant un
 *     word inexistant, lessons inexistantes, doublons, gloses ciblant un word
 *     inexistant, résolution FR des 10 nouvelles sourates.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(file); }
    catch { /* absent */ }
  }
}

const PAGE = 1000;

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("URL/ANON requis (lecture).");
  const client = createClient(url, anon, { auth: { persistSession: false } });

  type QB = ReturnType<typeof client.from>;
  // Pragmatique : chaîne REST `any` — lecture seule, l'audit n'écrit jamais.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function countExact(table: string, filter?: (q: any) => unknown): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = client.from(table as any).select("*", { count: "exact", head: true });
    if (filter) q = filter(q as QB);
    const { count, error } = await q as { count: number | null; error: { message: string } | null };
    if (error) throw new Error(`${table} count : ${error.message}`);
    return (count ?? 0) as number;
  }

  async function selectAll<T>(table: string, select: string): Promise<T[]> {
    const rows: T[] = [];
    let from = 0;
    for (;;) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await client.from(table as any).select(select).range(from, from + PAGE - 1) as unknown as {
        data: T[] | null; error: { message: string } | null };
      if (error) throw new Error(`${table} read : ${error.message}`);
      rows.push(...(data ?? []));
      if ((data ?? []).length < PAGE) break;
      from += PAGE;
    }
    return rows;
  }

  const outPair: Record<string, unknown> = {
    phase: "PHASE_89_PRE_PRODUCTION_READ_ONLY",
    databaseWrites: 0,
  };
  const out = outPair;

  // ---- Curriculum totals ----
  const [nLp, nUnits, nLessons, nLessonWords, nSurahs, nAyahs, nQuranWords, nOcc, nWtFr, nWtValid, nLemmas, nLemmaTrFr, nLemmaTrValid, nWlmSafe] = await Promise.all([
    countExact("learning_paths"), countExact("units"), countExact("lessons"),
    countExact("lesson_words"), countExact("surahs"), countExact("ayahs"),
    countExact("quran_words"), countExact("word_occurrences"),
    countExact("word_translations", (q) => q.eq("language", "fr")),
    countExact("word_translations", (q) => q.eq("language", "fr").eq("is_validated", true)),
    countExact("lemmas"),
    countExact("lemma_translations", (q) => q.eq("language", "fr")),
    countExact("lemma_translations", (q) => q.eq("language", "fr").eq("is_validated", true)),
    countExact("word_lemma_mapping", (q) => q.eq("confidence", "safe")),
  ]);

  // ---- Full reads with pagination for integrity joins ----
  const surahRows = await selectAll<{ id: string; number: number }>("surahs", "id,number");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>("ayahs", "id,surah_id");
  const occRows = await selectAll<{ word_id: string; ayah_id: string }>("word_occurrences", "word_id,ayah_id");
  const quranWordRows = await selectAll<{ id: string; lemma_id: string | null; arabic: string }>("quran_words", "id,lemma_id,arabic");
  const wordById = new Map(quranWordRows.map((w) => [w.id, w]));
  const ayahBySurah = new Map<string, string[]>();
  for (const a of ayahRows) { const arr = ayahBySurah.get(a.surah_id) ?? []; arr.push(a.id); ayahBySurah.set(a.surah_id, arr); }
  const wordByAyah = new Map<string, Set<string>>();
  for (const o of occRows) { const s = wordByAyah.get(o.ayah_id) ?? new Set(); s.add(o.word_id); wordByAyah.set(o.ayah_id, s); }

  const wtRows = await selectAll<{ word_id: string; language: string; is_validated: boolean; text: string }>("word_translations", "word_id,language,is_validated,text");
  const wtFrValid = wtRows.filter((r) => r.language === "fr" && r.is_validated);
  const lemmaTrFrValid = await selectAll<{ lemma_id: string; language: string; is_validated: boolean }>("lemma_translations", "lemma_id,language,is_validated");
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string; confidence: string }>("word_lemma_mapping", "word_id,lemma_id,confidence");

  out.curriculumCounts = {
    learningPaths: nLp, units: nUnits, lessons: nLessons, lessonWords: nLessonWords,
    surahs: nSurahs, ayahs: nAyahs, quranWords: nQuranWords, wordOccurrences: nOcc,
  };
  out.lexicalCounts = {
    wordTranslationsFr: nWtFr, wordTranslationsFrValidated: nWtValid, lemmas: nLemmas,
    lemmaTranslationsFr: nLemmaTrFr, lemmaTranslationsFrValidated: nLemmaTrValid,
    wordLemmaMappingSafe: nWlmSafe,
  };

  // ---- Integrity joins (full, paginated) ----
  const lessonRows = await selectAll<{ id: string; unit_id: string; status: string | null }>("lessons", "id,unit_id,status");
  const lessonIdSet = new Set(lessonRows.map((l) => l.id));
  const lessonWordsRows = await selectAll<{ lesson_id: string; word_id: string }>("lesson_words", "lesson_id,word_id");
  const lwLessonWithWord = new Set(lessonWordsRows.map((lw) => lw.lesson_id));
  const lessonsWithoutWords = lessonRows.filter((l) => !lwLessonWithWord.has(l.id)).length;
  const lwBadWord = [...new Set(lessonWordsRows.map((lw) => lw.word_id))].filter((w) => !wordById.has(w)).length;
  const lwBadLesson = [...new Set(lessonWordsRows.map((lw) => lw.lesson_id))].filter((l) => !lessonIdSet.has(l)).length;
  const ocBadWord = [...new Set(occRows.map((o) => o.word_id))].filter((w) => !wordById.has(w)).length;
  const ocBadAyah = [...new Set(occRows.map((o) => o.ayah_id))].filter((a) => !new Set(ayahRows.map((x) => x.id)).has(a)).length;
  const wtBadWord = [...new Set(wtRows.map((r) => r.word_id))].filter((w) => !wordById.has(w)).length;
  const wlmBadWord = new Set(wlmRows.filter((r) => r.confidence === "safe").map((r) => r.word_id));
  const wlmBadLemma = new Set(wlmRows.map((r) => r.lemma_id));
  const lemmaIdSet = new Set((await selectAll<{ id: string }>("lemmas", "id")).map((l) => l.id));
  const wlmOrphans = [...wlmBadWord].filter((w) => !wordById.has(w));
  const wlmBadLemmaCount = [...wlmBadLemma].filter((l) => !lemmaIdSet.has(l)).length;

  out.integrity = {
    lessonsWithoutWords,
    lessonWordsWithMissingWord: lwBadWord,
    lessonWordsWithMissingLesson: lwBadLesson,
    occurrencesWithMissingWord: ocBadWord,
    occurrencesWithMissingAyah: ocBadAyah,
    wordTranslationsWithMissingWord: wtBadWord,
    duplicateLessonWordPairs: lessonWordsRows.length - new Set(lessonWordsRows.map((lw) => `${lw.lesson_id}|${lw.word_id}`)).size,
    wlmSafeWithMissingWord: wlmOrphans.length,
    wlmWithMissingLemma: wlmBadLemmaCount,
  };

  // ---- Lexical : distinct words/lemmas (hors double-compte d'une même forme) ----
  const distinctWtWords = new Set(wtFrValid.map((r) => r.word_id)).size;
  const distinctLemmaWords = new Set(
    lemmaTrFrValid.map((r) => r.lemma_id),
  );
  (out.lexicalCounts as Record<string, number>).distinctWordsWithValidatedFr = distinctWtWords;
  (out.lexicalCounts as Record<string, number>).distinctLemmasWithValidatedFr = distinctLemmaWords.size;

  // ---- Résolution FR effective des 10 nouvelles sourates ----
  const wtFrByWord = new Set(wtFrValid.map((r) => r.word_id));
  const lemmaFrValidId = new Set(lemmaTrFrValid.filter((r) => r.language === "fr" && r.is_validated).map((r) => r.lemma_id));
  const directLemmaByWord = new Map(quranWordRows.filter((w) => w.lemma_id).map((w) => [w.id, w.lemma_id!]));
  const mappedLemmaByWord = new Map(wlmRows.filter((r) => r.confidence === "safe" && !directLemmaByWord.has(r.word_id)).map((r) => [r.word_id, r.lemma_id]));

  const NEW10 = [51, 64, 66, 67, 71, 75, 77, 79, 80, 89];
  const resolution: Record<string, { forms: number; resolvedFr: number; pct: number }> = {};
  for (const num of NEW10) {
    const s = surahRows.find((x) => x.number === num);
    if (!s) { resolution[String(num)] = { forms: 0, resolvedFr: 0, pct: 0 }; continue; }
    const wordIds = new Set<string>();
    for (const aid of ayahBySurah.get(s.id) ?? []) for (const w of wordByAyah.get(aid) ?? []) wordIds.add(w);
    let resolved = 0;
    for (const wid of wordIds) {
      const lemma = directLemmaByWord.get(wid) ?? mappedLemmaByWord.get(wid);
      const ok = wtFrByWord.has(wid) || (lemma != null && lemmaFrValidId.has(lemma));
      if (ok) resolved++;
    }
    resolution[String(num)] = { forms: wordIds.size, resolvedFr: resolved, pct: wordIds.size ? Math.round((resolved / wordIds.size) * 1000) / 10 : 0 };
  }
  out.fresh10SurahFrenchResolution = resolution;

  out.notes = [
    "REST API paginée par range(0..PAGE-1) pour éviter la troncature 1000 lignes.",
    "Résolution FR forme OU lemme validé (même logique que le resolver).",
  ];

  fs.writeFileSync("reports/phase-89-pre-production-audit.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});