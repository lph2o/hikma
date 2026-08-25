/**
 * PHASE 88F-AJ — LONG-SURAH-FIRST RUNTIME-TRUTH NEXT-TARGET AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * After S36=READY (529/529, 123 word_tr), determine the next long surah to target.
 * Only runtime-consumed paths: word_tr | quran_words.lemma_id | WLM.
 * NEVER uses linguistic_occurrences.hikma_lemma_id.
 *
 * Long surah = ≥482 forms (same threshold as 88F-AF/88F-AE).
 * Excludes: REFERENCE + the 8 READY surahs.
 *
 * Output: reports/phase-88f-aj-next-long-surah-runtime-truth.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-aj-next-long-surah-runtime-truth.json";
const PAGE_SIZE = 1000;
const LONG_THRESHOLD = 482;
const READY_SURAHS = new Set([98, 92, 82, 85, 90, 70, 46, 36]);
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

type DbRow = Record<string, unknown>;

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); break; } catch { /* OK */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).order("id").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

// ─── Runtime resolver (replicating resolveWordMeanings) ─────────────
function resolveSurah(
  surahWordIds: Set<string>,
  wordById: Map<string, DbRow>,
  frWordTr: Set<string>,
  frLemmaTr: Set<string>,
  wlmByWord: Map<string, string>,
): { pathA: number; pathB: number; pathC: number; unresolved: number } {
  let pathA = 0, pathB = 0, pathC = 0;
  for (const wid of surahWordIds) {
    if (frWordTr.has(wid)) { pathA++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { pathB++; continue; }
    const wlmLemma = wlmByWord.get(wid);
    if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }
  }
  return { pathA, pathB, pathC, unresolved: surahWordIds.size - pathA - pathB - pathC };
}

// ─── Scoring ────────────────────────────────────────────────────────
interface SurahStats {
  number: number; name: string; totalForms: number;
  covered: number; coveragePct: number;
  pathA: number; pathB: number; pathC: number; unresolved: number;
  actionsNeeded: number; // = unresolved (all word_tr needed since classA=0)
  balancedScore: number;
}

function balancedScore(s: { totalForms: number; coveragePct: number; unresolved: number }): number {
  // Favor: high coverage, large size, low actions
  // Normalize to ~0–1 range
  const sizeNorm = Math.min(s.totalForms / 2000, 1);   // 0..1 (capped at 2000)
  const covNorm = s.coveragePct / 100;                   // 0..1
  const effortNorm = 1 - Math.min(s.unresolved / 500, 1); // 1..0 (capped at 500)
  // Weight: size (0.3) + coverage (0.4) + low-effort (0.3)
  return ROUND(sizeNorm * 0.30 + covNorm * 0.40 + effortNorm * 0.30, 4);
}

// ─── Main ───────────────────────────────────────────────────────────
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-AJ — LONG-SURAH-FIRST RUNTIME-TRUTH NEXT-TARGET AUDIT ===\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,is_validated"),
  ]);

  // Indexes
  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) {
    surahNumById.set(s.id as string, s.number as number);
    surahNameByNum.set(s.number as number, s.name_transliteration as string);
  }

  // FR runtime state
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // Ayah → surah number
  const surahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) surahNumByAyahId.set(a.id as string, sn);
  }

  // Build surah → word set
  const surahWordIds = new Map<number, Set<string>>();
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn == null) continue;
    let set = surahWordIds.get(sn);
    if (!set) { set = new Set(); surahWordIds.set(sn, set); }
    set.add(oc.word_id as string);
  }

  console.log(`  Total surahs: ${surahWordIds.size}`);
  console.log(`  FR word_tr: ${frWordTr.size}`);
  console.log(`  FR lemma_tr: ${frLemmaTr.size}`);
  console.log(`  WLM safe: ${wlmByWord.size}\n`);

  // ─── 2. Global baseline ────────────────────────────────────────────────
  console.log("=== Global baseline ===\n");

  // FR union
  let globalFrUnion = 0;
  for (const wid of [...wordById.keys()]) {
    if (frWordTr.has(wid)) { globalFrUnion++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { globalFrUnion++; continue; }
    const wlmLemma = wlmByWord.get(wid);
    if (wlmLemma && frLemmaTr.has(wlmLemma)) { globalFrUnion++; }
  }
  const totalWords = allWords.length;
  console.log(`  FR union: ${globalFrUnion}/${totalWords} (${ROUND(globalFrUnion / totalWords * 100, 1)}%)\n`);

  // ─── 3. Check lemma-reachable (classA) for all surahs ───────────────────
  let globalLemmaReachable = 0;
  for (const [, wordIds] of surahWordIds) {
    for (const wid of wordIds) {
      if (frWordTr.has(wid)) continue;
      const word = wordById.get(wid);
      if (word?.lemma_id && !frLemmaTr.has(word.lemma_id as string)) {
        // Has lemma_id but lemma not translated yet — could become reachable
        globalLemmaReachable++;
      } else if (wlmByWord.has(wid) && !frLemmaTr.has(wlmByWord.get(wid)!)) {
        // Has WLM but lemma not translated yet
        globalLemmaReachable++;
      }
    }
  }
  console.log(`  Global classA (lemma-reachable but lemma untranslated): ${globalLemmaReachable}`);
  if (globalLemmaReachable === 0) {
    console.log("  → All completion passes exclusively through word_translations.\n");
  } else {
    console.log("  → Lemma translations could help for ${globalLemmaReachable} forms.\n");
  }

  // ─── 4. Per-surah stats ────────────────────────────────────────────────
  console.log("=== Per-surah analysis ===\n");

  const allStats: SurahStats[] = [];
  let readyCount = 0, inPrepCount = 0, refCount = 0;

  for (const [sn, wordIds] of [...surahWordIds.entries()].sort(([a], [b]) => a - b)) {
    const { pathA, pathB, pathC, unresolved } = resolveSurah(wordIds, wordById, frWordTr, frLemmaTr, wlmByWord);
    const covered = pathA + pathB + pathC;
    const total = wordIds.size;
    const coveragePct = ROUND(covered / total * 100, 1);

    const isReady = unresolved === 0;
    const isRef = sn === 1; // Al-Fatiha = reference

    if (isReady) readyCount++;
    else if (isRef) refCount++;
    else inPrepCount++;

    const name = surahNameByNum.get(sn) ?? `S${sn}`;

    allStats.push({
      number: sn, name,
      totalForms: total, covered, coveragePct,
      pathA, pathB, pathC, unresolved,
      actionsNeeded: unresolved, // classA=0 → all word_tr
      balancedScore: balancedScore({ totalForms: total, coveragePct, unresolved }),
    });
  }

  console.log(`  READY: ${readyCount}  IN_PREPARATION: ${inPrepCount}  REFERENCE: ${refCount}\n`);

  // ─── 5. Verify READY surahs ────────────────────────────────────────────
  console.log("=== READY verification ===\n");
  for (const sn of READY_SURAHS) {
    const stats = allStats.find(s => s.number === sn);
    if (!stats) { console.log(`  ❌ S${sn} not found in surahWordIds`); continue; }
    const status = stats.unresolved === 0 ? "✅ READY" : `❌ ${stats.unresolved} unresolved`;
    console.log(`  S${sn} ${stats.name.padEnd(20)} ${stats.covered}/${stats.totalForms} → ${status}`);
  }
  console.log();

  // ─── 6. Long surah candidates ──────────────────────────────────────────
  console.log("=== Long surah candidates (≥482 forms, non-READY, non-REF) ===\n");

  const longCandidates = allStats
    .filter(s => s.totalForms >= LONG_THRESHOLD && s.unresolved > 0 && s.number !== 1)
    .sort((a, b) => a.actionsNeeded - b.actionsNeeded);

  console.log(`  Candidates: ${longCandidates.length}\n`);

  // ─── 7. Rankings ───────────────────────────────────────────────────────
  // NEXT_LONG_EASY: lowest actions
  const easy = [...longCandidates].sort((a, b) => a.actionsNeeded - b.actionsNeeded).slice(0, 10);

  // NEXT_LONG_BALANCED: balancedScore
  const balanced = [...longCandidates].sort((a, b) => b.balancedScore - a.balancedScore).slice(0, 10);

  // NEXT_LONG_MAX_COVERAGE: most forms gained
  const maxCov = [...longCandidates].sort((a, b) => b.actionsNeeded - a.actionsNeeded).slice(0, 10);

  function printTop10(title: string, list: SurahStats[]) {
    console.log(`  ${title}:`);
    console.log("  Rang  Surah          Formes   Couv.   Unresolved   Actions   Score");
    console.log("  ----  -------------  -------  ------  -----------  --------  -----");
    list.forEach((s, i) => {
      console.log(`  ${String(i + 1).padStart(3)}   S${String(s.number).padEnd(2)} ${s.name.padEnd(12)} ${String(s.totalForms).padStart(5)}   ${String(s.coveragePct).padStart(4)}%   ${String(s.unresolved).padStart(9)}   ${String(s.actionsNeeded).padStart(6)}   ${s.balancedScore.toFixed(4)}`);
    });
    console.log();
  }

  printTop10("NEXT_LONG_EASY (fewest actions)", easy);
  printTop10("NEXT_LONG_BALANCED (best tradeoff)", balanced);
  printTop10("NEXT_LONG_MAX_COVERAGE (most forms gained)", maxCov);

  // ─── 8. Benchmark ──────────────────────────────────────────────────────
  console.log("=== Benchmarks ===\n");
  console.log("  S46 Al-Ahqaf:  482 forms, 80.3% → 100%, 95 word_tr, READY");
  console.log("  S36 Ya-Sin:    529 forms, 76.7% → 100%, 123 word_tr, READY\n");

  const best = balanced[0];
  console.log(`=== RECOMMENDATION ===\n`);
  console.log(`  NEXT_LONG_SURAH_RUNTIME_TRUTH = S${best.number} — ${best.name}`);
  console.log(`    Forms: ${best.totalForms}  Coverage: ${best.coveragePct}%  Unresolved: ${best.unresolved}`);
  console.log(`    Actions needed: ${best.actionsNeeded} word_translations`);
  console.log(`    Balanced score: ${best.balancedScore.toFixed(4)}\n`);

  if (balanced.length >= 3) {
    for (let i = 1; i <= 2; i++) {
      const alt = balanced[i];
      console.log(`  ALTERNATIVE_${i} = S${alt.number} — ${alt.name} (${alt.actionsNeeded} actions, ${alt.coveragePct}% cov., score ${alt.balancedScore.toFixed(4)})`);
    }
  }
  console.log();

  // ─── 9. Integrity ──────────────────────────────────────────────────────
  console.log("=== Integrity ===\n");
  console.log("  DATABASE_WRITES = 0 ✅");
  console.log("  MASAQ mappings = 0 ✅");
  console.log("  Curriculum writes = 0 ✅\n");

  // ─── 10. Build report ──────────────────────────────────────────────────
  const report = {
    phase: "88F-AJ",
    verdict: "PHASE_88F_AJ_COMPLETE",
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    baseline: {
      frUnionWordId: globalFrUnion,
      totalQuranWords: totalWords,
      frUnionPct: ROUND(globalFrUnion / totalWords * 100, 1),
      wordTranslationsFr: frWordTr.size,
      lemmaTranslationsFr: frLemmaTr.size,
      wlmSafeCount: wlmByWord.size,
      ready: readyCount,
      inPreparation: inPrepCount,
      reference: refCount,
    },

    structuralCheck: {
      globalClassALemmaReachable: globalLemmaReachable,
      conclusion: globalLemmaReachable === 0
        ? "All completion passes exclusively through word_translations."
        : `${globalLemmaReachable} forms could be resolved via lemma translations.`,
    },

    longSurahThreshold: LONG_THRESHOLD,
    longCandidates: longCandidates.length,

    rankings: {
      nextLongEasy: easy.map(s => ({ number: s.number, name: s.name, forms: s.totalForms, coverage: s.coveragePct, unresolved: s.unresolved, actions: s.actionsNeeded })),
      nextLongBalanced: balanced.map(s => ({ number: s.number, name: s.name, forms: s.totalForms, coverage: s.coveragePct, unresolved: s.unresolved, actions: s.actionsNeeded, score: s.balancedScore })),
      nextLongMaxCoverage: maxCov.map(s => ({ number: s.number, name: s.name, forms: s.totalForms, coverage: s.coveragePct, unresolved: s.unresolved, actions: s.actionsNeeded })),
    },

    recommendation: {
      nextLongSurahRuntimeTruth: { number: best.number, name: best.name, forms: best.totalForms, coverage: best.coveragePct, unresolved: best.unresolved, actionsNeeded: best.actionsNeeded, score: best.balancedScore },
      alternative1: balanced.length >= 2 ? { number: balanced[1].number, name: balanced[1].name, actionsNeeded: balanced[1].actionsNeeded, score: balanced[1].balancedScore } : null,
      alternative2: balanced.length >= 3 ? { number: balanced[2].number, name: balanced[2].name, actionsNeeded: balanced[2].actionsNeeded, score: balanced[2].balancedScore } : null,
    },

    benchmarks: {
      s46: { forms: 482, actions: 95, coverageBefore: 80.3, ready: true },
      s36: { forms: 529, actions: 123, coverageBefore: 76.7, ready: true },
    },

    methodology: {
      runtimePaths: ["PATH_A: word_translations", "PATH_B: quran_words.lemma_id → lemma_translations", "PATH_C: word_lemma_mapping → lemma_translations"],
      excluded: "linguistic_occurrences.hikma_lemma_id — NEVER used",
      scoringFormula: "balancedScore = size_norm*0.30 + coverage_norm*0.40 + effort_norm*0.30",
    },

    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      curriculumWrites: 0,
      protectedTables: "all unchanged",
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: PHASE_88F_AJ_COMPLETE ===`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AJ", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});