/**
 * scripts/tmp/phase68/ground-truth-68b-b10.ts
 *
 * PHASE 68B — GROUND TRUTH READ-ONLY B10 (ÉTAPE 0 du protocole).
 *
 * Capte l'état RÉEL de la DB live (source de vérité absolue) sans aucune
 * écriture :
 *   1. checksum SHA-256 de tmp/MASAQ.csv (source immuable) ;
 *   2. baseline canonique des 20 tables vs état post-B09 enregistré ;
 *   3. matrice MASAQ par sourate (1..114) vs registre Phase 67 / B01-B09 :
 *      B01-B09 + sourates MASAQ_COMPLETE attendues telles quelles, toute
 *      autre sourate (B10, B11, MASAQ_BLOCKED, SOURCE_ALIGNMENT_REVIEW)
 *      strictement ABSENTE (0 occurrence, 0 segment) ;
 *   4. vérification explicite que B10 (88, 89, 90, 92, 95) n'est PAS appliqué ;
 *   5. vérification explicite qu'aucune donnée B11 n'est présente ;
 *   6. sourate 64 (MASAQ_BLOCKED) doit rester à 0 occurrence ;
 *   7. aucune fuite hors périmètre (tables métier inchangées vs baseline).
 *
 * Usage :
 *   npx tsx scripts/tmp/phase68/ground-truth-68b-b10.ts
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { captureCanonicalCounters } from "../../../scripts/industrial/_lib/counters";
import {
  buildServiceRoleClient,
  loadIndustrialEnvFiles,
} from "../../../scripts/industrial/_lib/load-env";
import { selectAllPages } from "../../../lib/quran/repositories/shared";

const EXPECTED_SHA256 =
  "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";

const SOURCE_NAME = "MASAQ";
const SOURCE_VERSION = "v2";

// ---- Registre canonique (execution-state-68b.json + masaq-batches.json) ----
const B10_SURAHS = [88, 89, 90, 92, 95];
const B11_SURAHS = [98, 99, 100, 107];
const BLOCKED_SURAH_CHECK = 64; // MASAQ_BLOCKED — doit rester à 0

// Sourates déjà importées (B01-B09) + sourates MASAQ_COMPLETE (Phases 62/63/66),
// avec leur nombre d'occurrences attendu (registre Phase 67 / états vérifiés).
const EXPECTED_PRESENT: Record<number, number> = {
  // MASAQ_COMPLETE (phases antérieures)
  1: 29, 87: 72, 91: 54, 93: 40, 94: 27, 96: 72, 97: 30,
  101: 36, 102: 28, 103: 14, 104: 33, 105: 23, 106: 17,
  108: 10, 109: 26, 110: 19, 111: 23, 112: 15, 113: 23, 114: 20,
  // B01
  8: 1233, 9: 2498, 13: 853, 22: 1274, 28: 1430,
  // B02
  29: 976, 31: 546, 32: 372, 34: 883, 36: 725,
  // B03
  39: 1172, 45: 488, 46: 643, 47: 539, 49: 347,
  // B04
  50: 373, 51: 360, 52: 312, 53: 360, 54: 342,
  // B05
  55: 351, 56: 379, 58: 472, 61: 221, 62: 175,
  // B06
  63: 180, 65: 287, 66: 249, 67: 333, 68: 300,
  // B07
  69: 258, 70: 217, 71: 226, 73: 199, 74: 255,
  // B08
  76: 243, 77: 181, 78: 173, 79: 179, 80: 133,
  // B09
  82: 80, 83: 169, 84: 107, 85: 109, 86: 61,
};

// État post-B09 enregistré (baseline-post.json B09).
const RECORDED_POST_B09: Record<string, number> = {
  quran_words: 21296,
  word_occurrences: 77430,
  ayahs: 6236,
  translations: 24944,
  lemmas: 32,
  lemma_translations: 32,
  word_lemma_mapping: 184,
  word_translations: 538,
  linguistic_occurrences: 21874,
  linguistic_segments: 43465,
  word_explanations: 13,
  word_explanation_contexts: 1,
  learning_paths: 24,
  units: 24,
  lessons: 191,
  lesson_words: 1307,
  review_items: 23,
  user_word_progress: 23,
  user_activity_lessons: 8,
  sources: 6,
};

// Tables métier (aucun delta autorisé pendant l'import MASAQ).
const BUSINESS_TABLES = [
  "quran_words",
  "word_occurrences",
  "ayahs",
  "translations",
  "lemmas",
  "lemma_translations",
  "word_lemma_mapping",
  "word_translations",
  "word_explanations",
  "word_explanation_contexts",
  "learning_paths",
  "units",
  "lessons",
  "lesson_words",
  "review_items",
  "user_word_progress",
  "user_activity_lessons",
] as const;

type Client = Awaited<ReturnType<typeof buildServiceRoleClient>>;

async function masaqCountsBySurah(
  client: Client,
  sourceId: string | null,
): Promise<Record<number, number>> {
  if (!sourceId) return {};
  const out: Record<number, number> = {};
  const rows = await selectAllPages<{ surah_number: number }>((from, to) =>
    client
      .from("linguistic_occurrences")
      .select("surah_number")
      .eq("source_id", sourceId)
      .order("surah_number")
      .range(from, to),
  );
  for (const r of rows) out[r.surah_number] = (out[r.surah_number] ?? 0) + 1;
  return out;
}

/** Occurrences + segments d'une sourate MASAQ (READ-ONLY, chunké). */
async function surahState(
  client: Client,
  sourceId: string,
  surah: number,
): Promise<{ occurrences: number; segments: number }> {
  const occIds = await selectAllPages<{ id: string }>((from, to) =>
    client
      .from("linguistic_occurrences")
      .select("id")
      .eq("source_id", sourceId)
      .eq("surah_number", surah)
      .order("id")
      .range(from, to),
  );
  let segments = 0;
  const ids = occIds.map((o) => o.id);
  for (let i = 0; i < ids.length; i += 250) {
    const { count, error } = await client
      .from("linguistic_segments")
      .select("id", { count: "exact", head: true })
      .in("linguistic_occurrence_id", ids.slice(i, i + 250));
    if (error) throw new Error(`linguistic_segments : ${error.message}`);
    segments += count ?? 0;
  }
  return { occurrences: occIds.length, segments };
}

async function main(): Promise<void> {
  loadIndustrialEnvFiles();

  const csvBuffer = readFileSync("tmp/MASAQ.csv");
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  const checksumOk = sha256 === EXPECTED_SHA256;

  const client = await buildServiceRoleClient();
  const counters = await captureCanonicalCounters(client);

  const { data: srcRows } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .eq("version", SOURCE_VERSION)
    .limit(1);
  const sourceId = (srcRows as Array<{ id: string }> | null)?.[0]?.id ?? null;

  const counts = await masaqCountsBySurah(client, sourceId);

  // ---- 1. Matrice complète 1..114 vs registre ----
  const matrixViolations: string[] = [];
  const expectedTotal = Object.values(EXPECTED_PRESENT).reduce((s, v) => s + v, 0);
  for (let s = 1; s <= 114; s += 1) {
    const expected = EXPECTED_PRESENT[s] ?? 0;
    const actual = counts[s] ?? 0;
    if (actual !== expected) {
      matrixViolations.push(`surah ${s}: DB=${actual} attendu=${expected}`);
    }
  }

  // ---- 2. B10 : explicitement non appliqué ----
  const b10State: Record<number, { occurrences: number; segments: number }> = {};
  let b10Applied = false;
  for (const s of B10_SURAHS) {
    const st = sourceId ? await surahState(client, sourceId, s) : { occurrences: 0, segments: 0 };
    b10State[s] = st;
    if (st.occurrences > 0 || st.segments > 0) b10Applied = true;
  }

  // ---- 3. B11 : aucun ----
  const b11: Record<number, number> = {};
  let b11Present = false;
  for (const s of B11_SURAHS) {
    b11[s] = counts[s] ?? 0;
    if ((counts[s] ?? 0) > 0) b11Present = true;
  }

  // ---- 4. Sourate 64 (MASAQ_BLOCKED) : 0 ----
  const s64 = counts[BLOCKED_SURAH_CHECK] ?? 0;

  // ---- 5. Baseline vs post-B09 enregistré ----
  const baselineViolations: string[] = [];
  for (const [table, expected] of Object.entries(RECORDED_POST_B09)) {
    const actual = counters[table as keyof typeof counters] ?? 0;
    if (actual !== expected) {
      baselineViolations.push(`${table}: DB=${actual} attendu=${expected}`);
    }
  }

  // ---- 6. Tables métier inchangées (aucune fuite) ----
  const businessViolations: string[] = [];
  for (const table of BUSINESS_TABLES) {
    const expected = RECORDED_POST_B09[table];
    const actual = counters[table as keyof typeof counters] ?? 0;
    if (actual !== expected) {
      businessViolations.push(`${table}: DB=${actual} attendu=${expected}`);
    }
  }

  const matrixOk = matrixViolations.length === 0;
  const baselineOk = baselineViolations.length === 0;
  const businessOk = businessViolations.length === 0;
  const sumOk = Object.values(counts).reduce((s, v) => s + v, 0) === counters.linguistic_occurrences;

  const result = {
    phase: "PHASE_68B_GROUND_TRUTH_READONLY_B10",
    captured_at: new Date().toISOString(),
    mode: "READ_ONLY",
    checksum: { ok: checksumOk, sha256: checksumOk ? EXPECTED_SHA256.slice(0, 16) + "…" : sha256 },
    source_id: sourceId,
    baseline: counters,
    recorded_post_b09: RECORDED_POST_B09,
    baseline_violations: baselineViolations,
    baseline_ok: baselineOk,
    per_surah_counts: counts,
    matrix: {
      expected_total_occurrences: expectedTotal,
      sum_db_occurrences: Object.values(counts).reduce((s, v) => s + v, 0),
      sum_consistent: sumOk,
      violations: matrixViolations,
      ok: matrixOk,
    },
    b10: {
      surahs: B10_SURAHS,
      already_applied: b10Applied,
      per_surah_detail: b10State,
    },
    b11: {
      surahs: B11_SURAHS,
      counts_by_surah: b11,
      any_present: b11Present,
    },
    blocked_surah_64: {
      occurrences: s64,
      ok: s64 === 0,
    },
    business_tables: {
      violations: businessViolations,
      ok: businessOk,
    },
    verdict:
      checksumOk && matrixOk && baselineOk && businessOk && sumOk && !b10Applied && !b11Present && s64 === 0
        ? "GROUND_TRUTH_OK_B10_PENDING"
        : "GROUND_TRUTH_DIVERGENCE",
  };

  const dir = join("tmp/phase68", "ground-truth");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "ground-truth-68b-b10.json"), JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`[ground-truth-68b-b10] checksum=${checksumOk ? "OK" : "FAIL"}`);
  console.log(`[ground-truth-68b-b10] linguistic_occurrences=${counters.linguistic_occurrences} linguistic_segments=${counters.linguistic_segments} (attendu 21874/43465)`);
  console.log(`[ground-truth-68b-b10] baseline post-B09=${baselineOk ? "MATCH" : "VIOLATIONS " + JSON.stringify(baselineViolations)}`);
  console.log(`[ground-truth-68b-b10] matrice 1..114=${matrixOk ? "OK" : "VIOLATIONS " + JSON.stringify(matrixViolations.slice(0, 20))}`);
  console.log(`[ground-truth-68b-b10] somme matrice=${Object.values(counts).reduce((s, v) => s + v, 0)} vs compteur=${counters.linguistic_occurrences} (${sumOk ? "cohérent" : "INCOHÉRENT"})`);
  console.log(`[ground-truth-68b-b10] B10 already_applied=${b10Applied}`);
  for (const s of B10_SURAHS) {
    console.log(`[ground-truth-68b-b10]   surah ${s}: occ=${b10State[s].occurrences} seg=${b10State[s].segments}`);
  }
  console.log(`[ground-truth-68b-b10] B11 any_present=${b11Present}`);
  console.log(`[ground-truth-68b-b10] sourate 64 (BLOCKED) occ=${s64} (${s64 === 0 ? "OK" : "VIOLATION"})`);
  console.log(`[ground-truth-68b-b10] tables métier=${businessOk ? "INCHANGÉES" : "VIOLATIONS " + JSON.stringify(businessViolations)}`);
  console.log(`[ground-truth-68b-b10] VERDICT=${result.verdict}`);
}

main().catch((err) => {
  console.error("ground-truth-68b-b10 failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
