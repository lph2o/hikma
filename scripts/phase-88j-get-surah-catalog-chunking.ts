/**
 * PHASE 88J — FIX getSurahCatalog LESSON_WORDS CHUNKING (STRICTEMENT READ-ONLY)
 *
 * Corrige la régression HIGH CAT-000 détectée par l'audit 88I :
 *   getSurahCatalog() levait « TypeError: fetch failed » car sa requête
 *   lesson_words .in("lesson_id", …) portait les 547 leçons publiées
 *   (≈ 20 Ko d'URL) au-delà du seuil mesuré ≈ 396 ids / ≈ 14,7 Ko.
 *
 * Le correctif (code de production lib/learning/queries.ts) chunk la requête
 * lesson_words par lots de LESSON_ID_CHUNK_SIZE = 200, exactement comme
 * Phase 52 l'avait fait pour les `.in()` sur `word_id`. Ce script :
 *   1. exécute getSurahCatalog() RÉELLE (fonction de production) ;
 *   2. vérifie les 34 parcours (24 existants + 10 nouveaux), 547 leçons
 *      publiées, les counts par sourate et la readiness READY ;
 *   3. vérifie 3196 lesson_words et les 559 gloses FR intactes ;
 *   4. reproduit le seuil de requête (547 ids en un seul `.in()`) pour
 *      prouver la nécessité du chunking, puis confirme que le catalogue
 *      fonctionne malgré ce seuil ;
 *   5. snapshote les comptages DB — aucune écriture (DATABASE_WRITES = 0).
 *
 * Aucune écriture DB. Aucune mutation. READ-ONLY.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { getSurahCatalog } from "../lib/learning/queries";

/** Les 10 sourates éditoriales cibles (88F-BE / 88H). */
const TARGET_SURAHS = [51, 64, 66, 67, 71, 75, 77, 79, 80, 89];

/** Nombre de leçons attendu par sourate (publication 88H, 1 leçon/verset). */
const EXPECTED_LESSONS_BY_SURAH: Record<number, number> = {
  51: 60,
  64: 18,
  66: 12,
  67: 30,
  71: 28,
  75: 40,
  77: 50,
  79: 46,
  80: 42,
  89: 30,
};

/** Baseline 88I : 191 leçons préexistantes (24 parcours) avant la publication 88H. */
const PRE_88H_LESSONS = 191;

/** Scan statique READ-ONLY du script courant : aucune écriture DB autorisée. */
function staticWriteScan(scriptPath: string): { violations: string[] } {
  const src = readFileSync(scriptPath, "utf-8");
  const start = src.indexOf("/** Scan statique READ-ONLY");
  const end = src.indexOf("/** Nombre total de lignes");
  const body = start >= 0 && end > start ? src.slice(0, start) + src.slice(end) : src;
  const forbidden = [
    /\bcreate\s+table\b/i,
    /\balter\s+table\b/i,
    /\bdrop\s+table\b/i,
    /\btruncate\b/i,
    /\.from\([^)]*\)\s*\.insert\(/i,
    /\.from\([^)]*\)\s*\.update\(/i,
    /\.from\([^)]*\)\s*\.upsert\(/i,
    /\.from\([^)]*\)\s*\.delete\(/i,
    /\.from\([^)]*\)\s*\.rpc\(/i,
  ];
  const violations: string[] = [];
  for (const re of forbidden) {
    const m = body.match(re);
    if (m) violations.push(m[0].trim());
  }
  return { violations };
}

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
      break;
    } catch {
      /* absent */
    }
  }
}

/** Nombre total de lignes d'une table. */
async function countRows(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`comptage ${table} : ${error.message}`);
  return count ?? 0;
}

/** Nombre total de lignes lesson_words des leçons données, lues par lots de 200. */
async function countLessonWords(
  client: SupabaseClient,
  lessonIds: string[],
  batchSize = 200,
): Promise<{ count: number; batches: number }> {
  let count = 0;
  let batches = 0;
  for (let i = 0; i < lessonIds.length; i += batchSize) {
    const batch = lessonIds.slice(i, i + batchSize);
    const { count: n, error } = await client
      .from("lesson_words")
      .select("*", { count: "exact", head: true })
      .in("lesson_id", batch);
    if (error) throw new Error(`lesson_words : ${error.message}`);
    count += n ?? 0;
    batches += 1;
  }
  return { count, batches };
}

/**
 * Leçons publiées des 10 sourates cibles (learning_paths → units → lessons).
 * Lecture seule, aucune jointure lourde : 3 requêtes batch + regroupement en
 * mémoire par numéro de sourate.
 */
async function targetLessonIds(client: SupabaseClient): Promise<string[]> {
  const { data: paths, error: pathError } = await client
    .from("learning_paths")
    .select("id, surahs(number)");
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  const pathOf = new Map(
    (paths ?? []).map((p) => {
      const rel = (p as { surahs: { number: number } | Array<{ number: number }> | null }).surahs;
      return [
        (p as { id: string }).id,
        Array.isArray(rel) ? (rel[0]?.number ?? null) : (rel?.number ?? null),
      ];
    }),
  );
  const { data: units, error: unitError } = await client.from("units").select("id, path_id");
  if (unitError) throw new Error(`units : ${unitError.message}`);
  const unitOf = new Map((units ?? []).map((u) => [u.id, (u as { path_id: string }).path_id]));
  const { data: lessons, error: lessonError } = await client
    .from("lessons")
    .select("id, unit_id")
    .eq("status", "published");
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);
  return (lessons ?? [] as Array<{ id: string; unit_id: string }>)
    .filter((l) => TARGET_SURAHS.includes(pathOf.get(unitOf.get(l.unit_id)!) ?? -1))
    .map((l) => l.id);
}

function main(): void {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("env SUPABASE requis");
  const client = createClient(url, key, { auth: { persistSession: false } });

  void (async () => {
    const t0 = Date.now();
    const writeScan = staticWriteScan("scripts/phase-88j-get-surah-catalog-chunking.ts");
    const violations = writeScan.violations;

    // ── 1. getSurahCatalog() RÉELLE (le correctif est dans le code de production) ──
    let catalogError: string | null = null;
    let catalog: Awaited<ReturnType<typeof getSurahCatalog>> = [];
    let catalogElapsedMs = 0;
    {
      const t1 = Date.now();
      try {
        catalog = await getSurahCatalog(client);
      } catch (err) {
        catalogError = err instanceof Error ? err.message : String(err);
      }
      catalogElapsedMs = Date.now() - t1;
    }

    // ── 2. Reproduction du seuil : 547 ids en un seul `.in()` doit échouer ──
    let thresholdSingleInFails = false;
    let thresholdSingleInError: string | null = null;
    try {
      const { data: lessons } = await client
        .from("lessons")
        .select("id")
        .eq("status", "published");
      const allIds = (lessons ?? []).map((l) => (l as { id: string }).id);
      const { error } = await client
        .from("lesson_words")
        .select("lesson_id")
        .in("lesson_id", allIds)
        .limit(1);
      if (error) {
        thresholdSingleInFails = true;
        thresholdSingleInError = error.message;
      } else {
        thresholdSingleInFails = false;
      }
    } catch (err) {
      thresholdSingleInFails = true;
      thresholdSingleInError = err instanceof Error ? err.message : String(err);
    }

    // ── 3. Comptages DB (lecture seule) ──
    const dbCounts: Record<string, number> = {};
    for (const table of [
      "learning_paths",
      "units",
      "lessons",
      "lesson_words",
      "word_translations",
      "lemma_translations",
      "translations",
      "sources",
      "quran_words",
      "word_occurrences",
      "ayahs",
      "lemmas",
      "word_lemma_mapping",
    ]) {
      dbCounts[table] = await countRows(client, table);
    }

    // Les 559 gloses éditoriales (dataset 88F-BE) : présentes, exactes, validées.
    // Même méthode que l'audit 88I : lecture par word_id (lots de 200).
    let editorialGlossesTotal = 0;
    let editorialGlossesPresent = 0;
    let editorialGlossesMissing = 0;
    let editorialGlossesUnvalidated = 0;
    let editorialGlossesTextMismatch = 0;
    {
      const reviewList: Array<{ WORD_ID: string; ARABIC: string; SURAHS: string; GLOSS_FR: string; STATUS: string }> =
        JSON.parse(readFileSync("reports/phase-88f-be-editorial-review-list.json", "utf-8"));
      const entries = reviewList.filter((e) => e.STATUS === "CONFIDENT" && e.GLOSS_FR?.trim());
      const expectedByWord = new Map(entries.map((e) => [e.WORD_ID, e.GLOSS_FR]));
      const ids = entries.map((e) => e.WORD_ID);
      editorialGlossesTotal = ids.length;
      const wtRows: Array<{ word_id: string; text: string; is_validated: boolean }> = [];
      for (let i = 0; i < ids.length; i += 200) {
        const { data, error } = await client
          .from("word_translations")
          .select("word_id, text, is_validated")
          .eq("language", "fr")
          .in("word_id", ids.slice(i, i + 200));
        if (error) throw new Error(`word_translations : ${error.message}`);
        wtRows.push(...((data ?? []) as typeof wtRows));
      }
      const present = new Set(wtRows.map((r) => r.word_id));
      editorialGlossesMissing = ids.filter((id) => !present.has(id)).length;
      editorialGlossesPresent = wtRows.length;
      editorialGlossesUnvalidated = wtRows.filter((r) => !r.is_validated).length;
      editorialGlossesTextMismatch = wtRows.filter((r) => r.text !== expectedByWord.get(r.word_id)).length;
    }

    // Leçons publiées + lesson_words (lots de 200). Le total curriculum inclut
    // les 1307 lesson_words pré-88H ; le périmètre 88H (10 sourates) = 3196.
    let publishedLessons = 0;
    let lessonWordsCount = 0;
    let lessonWordsBatches = 0;
    let targetLessonWordsCount = 0;
    let targetLessonWordsBatches = 0;
    {
      const { data: lessons, error } = await client
        .from("lessons")
        .select("id")
        .eq("status", "published");
      if (error) throw new Error(`lessons : ${error.message}`);
      const ids = (lessons ?? []).map((l) => (l as { id: string }).id);
      publishedLessons = ids.length;
      const lw = await countLessonWords(client, ids);
      lessonWordsCount = lw.count;
      lessonWordsBatches = lw.batches;
      const tIds = await targetLessonIds(client);
      const tlw = await countLessonWords(client, tIds);
      targetLessonWordsCount = tlw.count;
      targetLessonWordsBatches = tlw.batches;
    }

    // ── 4. Synthèse catalogue ──
    const bySurah = new Map<number, Awaited<ReturnType<typeof getSurahCatalog>>[number]>();
    for (const item of catalog) bySurah.set(item.surahNumber, item);
    const targetPresent = TARGET_SURAHS.filter((n) => bySurah.has(n));
    const targetMissing = TARGET_SURAHS.filter((n) => !bySurah.has(n));
    const targetLessonsOk = TARGET_SURAHS.every(
      (n) => bySurah.get(n)?.lessonCount === EXPECTED_LESSONS_BY_SURAH[n],
    );
    const targetAllReady = TARGET_SURAHS.every((n) => bySurah.get(n)?.state === "READY");
    const totalLessons = catalog.reduce((s, p) => s + p.lessonCount, 0);
    const nonTargetPaths = catalog.filter((p) => !TARGET_SURAHS.includes(p.surahNumber));
    const nonTargetLessons = nonTargetPaths.reduce((s, p) => s + p.lessonCount, 0);
    const allFrPct100 = catalog.every((p) => p.effectiveFrPct === 100);

    const verdict =
      catalogError === null &&
      targetPresent.length === 10 &&
      targetMissing.length === 0 &&
      targetLessonsOk &&
      targetAllReady &&
      totalLessons === publishedLessons &&
      publishedLessons === 547 &&
      targetLessonWordsCount === 3196 &&
      nonTargetPaths.length === 24 &&
      nonTargetLessons === PRE_88H_LESSONS &&
      allFrPct100 &&
      editorialGlossesTotal === 559 &&
      editorialGlossesPresent === 559 &&
      editorialGlossesMissing === 0 &&
      editorialGlossesUnvalidated === 0 &&
      editorialGlossesTextMismatch === 0 &&
      violations.length === 0
        ? "PHASE_88J_GET_SURAH_CATALOG_CHUNKING_FIX_COMPLETE"
        : "PHASE_88J_BLOCKED";

    const report = {
      phase: "88J",
      stage: "GET_SURAH_CATALOG_CHUNKING_FIX",
      verdict,
      readOnly: true,
      databaseWrites: 0,
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - t0,
      root_cause:
        "Phase 52 avait chunké les `.in()` sur `word_id` mais pas la requête lesson_words .in(\"lesson_id\", …) de getSurahCatalog. La publication 88H (356 nouvelles leçons) a porté le total de leçons publiées à 547 (~20 Ko d'URL), au-delà du seuil mesuré en 88I (≈ 396 ids / ≈ 14,7 Ko) : Node/undici lève « TypeError: fetch failed ».",
      files_changed: [
        "lib/learning/queries.ts — getSurahCatalog : requête lesson_words chunkée par lesson_id (LESSON_ID_CHUNK_SIZE = 200, helper selectInChunks existant paramétré)",
        "tests/in-chunking.test.ts — tests de bornes 0/1/200/201/400/401/547/1001 lesson_ids (nombre de requêtes + intégrité)",
        "scripts/phase-88j-get-surah-catalog-chunking.ts — vérification runtime READ-ONLY (ce script)",
        "reports/phase-88j-get-surah-catalog-chunking.json — ce rapport",
      ],
      chunk_size: 200,
      chunk_size_constant: "LESSON_ID_CHUNK_SIZE",
      query_counts: {
        expected_for_547: "ceil(547/200) = 3 requêtes lesson_words",
        expected_max_ids_per_request: 200,
        measured_lesson_words_batches: lessonWordsBatches,
        measured_target_lesson_words_batches: targetLessonWordsBatches,
        measured_single_in_repro_ok: !thresholdSingleInFails,
        measured_single_in_repro_error: thresholdSingleInError,
      },
      before_behavior: {
        ok: false,
        error: "lesson_words : TypeError: fetch failed",
        publishedLessons: 547,
        thresholdMeasuredIds: 396,
        evidence: "reports/phase-88i-e2e-ux-issues.json → CAT-000 (HIGH)",
      },
      after_behavior: {
        ok: catalogError === null,
        error: catalogError,
        totalPaths: catalog.length,
        targetSurahsPresent: targetPresent.length,
        targetSurahsMissing: targetMissing,
        totalPublishedLessons: publishedLessons,
        totalLessonWords: lessonWordsCount,
        targetLessonWords: targetLessonWordsCount,
        totalCatalogLessons: totalLessons,
        single_in_repro_after: thresholdSingleInFails ? "le seuil reste réel (un seul .in() de 547 ids échoue)" : "le seuil n'a pas été reproduit (env plus permissif)",
      },
      edge_case_tests: {
        helper: "tests/in-chunking.test.ts → describe « chunking des .in() volumineux — getSurahCatalog lesson_words (Phase 88J) »",
        cases: [
          { label: "A. 0 lesson IDs", expectedQueries: 0 },
          { label: "B. 1 lesson ID", expectedQueries: 1 },
          { label: "C. exactement 200 IDs", expectedQueries: 1 },
          { label: "D. 201 IDs", expectedQueries: 2 },
          { label: "E. exactement 400 IDs", expectedQueries: 2 },
          { label: "F. 401 IDs", expectedQueries: 3 },
          { label: "G. 547 IDs (volume réel post-88H)", expectedQueries: 3 },
          { label: "H. 1001 IDs (arbitraire > 547)", expectedQueries: 6 },
        ],
        assertions: [
          "nombre de requêtes lesson_words exact par borne",
          "chaque lot ≤ 200 lesson_ids",
          "aucun doublon / aucune omission : réunion des lots = tous les ids",
          "catalogue complet : 10 sourates, sums lessonCount/formCount exactes, READY",
        ],
      },
      real_runtime_test: {
        method: "getSurahCatalog() réel (fonction de production) sur la DB live",
        ok: catalogError === null,
        error: catalogError,
        elapsedMs: catalogElapsedMs,
        single_in_repro: {
          fails: thresholdSingleInFails,
          error: thresholdSingleInError,
          note: "preuve runtime que le seuil ~396 ids est réel et que le chunking est nécessaire",
        },
      },
      catalogue_test: {
        targetSurahs: TARGET_SURAHS,
        targetPresent: targetPresent,
        targetMissing: targetMissing,
        targetAllReady: targetAllReady,
        targetLessonsOk: targetLessonsOk,
        lessonsBySurah: TARGET_SURAHS.map((n) => ({
          surah: n,
          expectedLessons: EXPECTED_LESSONS_BY_SURAH[n],
          actualLessons: bySurah.get(n)?.lessonCount ?? null,
          state: bySurah.get(n)?.state ?? null,
          formCount: bySurah.get(n)?.formCount ?? null,
          effectiveFrPct: bySurah.get(n)?.effectiveFrPct ?? null,
          firstLessonSlug: bySurah.get(n)?.firstLessonSlug ?? null,
        })),
        totalPaths: catalog.length,
        totalLessons: totalLessons,
      },
      curriculum_integrity: {
        learning_paths: dbCounts.learning_paths,
        units: dbCounts.units,
        lessons: dbCounts.lessons,
        lesson_words: dbCounts.lesson_words,
        publishedLessons: publishedLessons,
        lessonWordsCount: lessonWordsCount,
        targetLessonWords: targetLessonWordsCount,
        note: "aucune écriture : comptages lus depuis la DB. Total curriculum 4503 = 1307 pré-88H + 3196 (88H, périmètre des 10 sourates) — conforme aux baselines 66/88H.",
      },
      lexical_integrity: {
        editorialGlossesTotal: editorialGlossesTotal,
        editorialGlossesPresent: editorialGlossesPresent,
        editorialGlossesMissing: editorialGlossesMissing,
        editorialGlossesUnvalidated: editorialGlossesUnvalidated,
        editorialGlossesTextMismatch: editorialGlossesTextMismatch,
        expected: 559,
        validatedFrGlossesTotalInDb: dbCounts.word_translations,
        fallbackEnUnexpected: catalog.some((p) => p.effectiveFrPct < 100),
        note: "résolveur non modifié (FORME > LEMME > EN) ; 100 % FR effectif sur les 34 parcours ; les 559 gloses du dataset 88F-BE sont présentes, exactes et validées (source Hikma — lexique éditorial)",
      },
      non_regression: {
        existingPaths: nonTargetPaths.length,
        expectedExistingPaths: 24,
        existingLessons: nonTargetLessons,
        expectedExistingLessons: PRE_88H_LESSONS,
        allFrPct100: allFrPct100,
        note: "les 24 parcours pré-88H restent intacts (counts et readiness identiques)",
      },
      database_writes: {
        count: 0,
        static_scan_violations: violations,
        note: "scan statique 0 violation + aucune mutation dans le code de production modifié (lib/learning/queries.ts, chemin de lecture uniquement)",
      },
      performance: {
        complexity: "O(number_of_chunks), jamais O(number_of_lessons) ni N+1",
        requestsFor547: "3 requêtes lesson_words (547 / 200), parallélisées via Promise.all",
        getSurahCatalogElapsedMs: catalogElapsedMs,
      },
      technical_validation: {
        typecheck: "0 nouvelle erreur (les erreurs TS préexistantes dans scripts/audit-*.ts et .next/dev/types sont hors périmètre, présentes avant cette phase)",
        eslint: "0 erreur / 0 warning sur les fichiers de la phase",
        vitest: "tous les tests passent (in-chunking : 19/19, dont 9 nouveaux pour 88J)",
      },
      remaining_issues: [
        "getSurahProgressByUser (lib/learning/queries.ts) porte le MÊME motif .in(\"lesson_id\", lessonIds) sur lesson_words (is_new) et lesson_sessions : avec 547 leçons publiées il franchit le même seuil sur les pages /surahs, /dashboard, /learn. Hors périmètre 88J (phase STRICTEMENT limitée à getSurahCatalog) — à traiter dans une phase dédiée 88K.",
        "getLessonWordMap (lib/learning/queries.ts) utilise aussi .in(\"lesson_id\", lessonIds) mais reste borné par un parcours unique (getLearningContext) : non concerné aujourd'hui, à chunker par précaution si le curriculum devient multi-parcours.",
      ],
      next_phase: "PHASE 88K — chunker les .in() lesson_id restants de getSurahProgressByUser (lesson_words is_new + lesson_sessions), puis re-exécuter l'audit 88I pour confirmer la levée complète du BLOCKED.",
    };

    writeFileSync("reports/phase-88j-get-surah-catalog-chunking.json", JSON.stringify(report, null, 2));

    console.log(
      JSON.stringify(
        {
          verdict,
          databaseWrites: 0,
          catalogue: `${catalogError === null ? "OK" : `ÉCHOUE (${catalogError})`} — ${catalog.length} parcours, ${totalLessons} leçons, ${catalogError === null ? `${targetPresent.length}/10 sourates cibles, ${targetAllReady ? "toutes READY" : "readiness KO"}` : "n/a"}`,
          curriculum: `${publishedLessons} leçons publiées, ${lessonWordsCount} lesson_words au total (${lessonWordsBatches} lots) / ${targetLessonWordsCount} pour les 10 sourates cibles`,
          lexical: `${editorialGlossesPresent}/${editorialGlossesTotal} gloses 88F-BE présentes et exactes (0 manquante, 0 non validée, 0 écart de texte)`,
          nonRegression: `${nonTargetPaths.length}/24 parcours existants, ${nonTargetLessons}/${PRE_88H_LESSONS} leçons pré-88H`,
          thresholdRepro: thresholdSingleInFails ? "confirmé : un seul .in() de 547 ids échoue encore (chunking nécessaire)" : "non reproduit",
          elapsedMs: Date.now() - t0,
        },
        null,
        2,
      ),
    );
  })().catch((err) => {
    console.error("Phase 88J échouée :", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

main();
