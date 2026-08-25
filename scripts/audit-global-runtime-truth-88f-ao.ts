/**
 * PHASE 88F-AO — GLOBAL RUNTIME-TRUTH RECONCILIATION — ALL 114 SURAHS
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Audits all 114 surahs to establish the definitive runtime-truth of READY status.
 *
 * Runtime resolution model (exactly as resolveWordMeanings):
 *   PATH A: word_translations (language='fr', is_validated=true)
 *   PATH B: quran_words.lemma_id → lemma_translations (fr, validated)
 *   PATH C: word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)
 *
 * NEVER uses: linguistic_occurrences.hikma_lemma_id (MASAQ)
 *
 * Produces:
 *   1. Per-surah runtime analysis (forms, paths A/B/C, unresolved, coverage)
 *   2. Historical vs runtime READY reconciliation
 *   3. Three critical lists: TRUE_RUNTIME_READY, HISTORICAL_READY_RUNTIME_NOT_READY, COMPLETION_QUEUE
 *   4. Top 20 rankings: lowest cost, best balanced ROI, max absolute coverage gain
 *   5. Global form coverage and counts
 *
 * Output: reports/phase-88f-ao-global-runtime-truth.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ao-global-runtime-truth.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// Historical READY surahs as declared across all 88F reports (before 88F-AO).
// S1 = REFERENCE (not counted as READY).
// S87-S114 (except 88, 89, 92, 98) were resolved in early phases.
// S98, S92, S82, S85, S90, S70 resolved in 88F-J/L/N/Q/S/W.
// S46 resolved in 88F-AD. S36 resolved in 88F-AH. S29 resolved in 88F-AL. S13 resolved in 88F-AN.
const HISTORICAL_READY = new Set<number>([
  // Short surahs resolved in Phase 40C–59
  87, 91, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
  // Long surahs resolved in 88F-J/L/N/Q/S/W
  98, 92, 82, 85, 90, 70,
  // Resolved in 88F-AD/AH/AL/AN
  46, 36, 29, 13,
]);

type DbRow = Record<string, unknown>;

interface SurahAnalysis {
  surahNumber: number;
  surahName: string;
  totalForms: number;
  resolvedForms: number;
  unresolvedForms: number;
  coveragePercent: number;
  pathAWordTranslation: number;
  pathBLemmaDirect: number;
  pathCWLM: number;
  classALemmaReachable: number;
  wordTranslationsNeeded: number;
  historicalReady: boolean;
  runtimeReady: boolean;
  statusDiscrepancy: string;
}

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

function discrepancy(historicalReady: boolean, runtimeReady: boolean, surahNumber: number): string {
  // S1 is always REFERENCE
  if (surahNumber === 1) return "REFERENCE";
  if (historicalReady && runtimeReady) return "CONSISTENT_READY";
  if (historicalReady && !runtimeReady) return "HISTORICAL_READY_RUNTIME_NOT_READY";
  if (!historicalReady && runtimeReady) return "NEW_RUNTIME_READY";
  return "CONSISTENT_NOT_READY";
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-AO — GLOBAL RUNTIME-TRUTH RECONCILIATION — ALL 114 SURAHS ===\n");
  console.log("  READ-ONLY: true");
  console.log("  DATABASE_WRITES: 0\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,is_validated"),
  ]);

  // ─── 2. Build indexes ──────────────────────────────────────────────────
  const wordById = new Map<string, DbRow>();
  for (const w of allWords) wordById.set(w.id as string, w);

  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const s of allSurahs) {
    const sn = s.number as number;
    surahNumById.set(s.id as string, sn);
    surahNameByNum.set(sn, (s.name_transliteration as string) ?? `S${sn}`);
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

  // Build surah → word set (from word_occurrences)
  const surahWordIds = new Map<number, Set<string>>();
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn == null) continue;
    let set = surahWordIds.get(sn);
    if (!set) { set = new Set(); surahWordIds.set(sn, set); }
    set.add(oc.word_id as string);
  }

  // Ensure all 114 surahs exist
  for (let i = 1; i <= 114; i++) {
    if (!surahWordIds.has(i)) surahWordIds.set(i, new Set());
  }

  console.log(`  Surahs: ${surahWordIds.size}`);
  console.log(`  quran_words: ${allWords.length}`);
  console.log(`  word_occurrences: ${allOccs.length}`);
  console.log(`  word_translations FR (validated): ${frWordTr.size}`);
  console.log(`  lemma_translations FR (validated): ${frLemmaTr.size}`);
  console.log(`  word_lemma_mapping (safe): ${wlmByWord.size}\n`);

  // ─── 3. Runtime resolve every surah ────────────────────────────────────
  console.log("=== Runtime resolution (114 surahs) ===\n");

  const analyses: SurahAnalysis[] = [];

  for (let sn = 1; sn <= 114; sn++) {
    const wordIds = surahWordIds.get(sn)!;
    const surahName = surahNameByNum.get(sn) ?? `S${sn}`;

    let pathA = 0, pathB = 0, pathC = 0;
    let classA = 0;

    for (const wid of wordIds) {
      // PATH A: word_translation
      if (frWordTr.has(wid)) { pathA++; continue; }

      // PATH B: direct lemma
      const word = wordById.get(wid);
      const directLemma = word?.lemma_id as string | null;
      if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }

      // PATH C: WLM
      const wlmLemma = wlmByWord.get(wid);
      if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }

      // Unresolved — check if classA (lemma-reachable at runtime)
      if (directLemma && !frLemmaTr.has(directLemma)) classA++;
      else if (wlmLemma && !frLemmaTr.has(wlmLemma)) classA++;
    }

    const total = wordIds.size;
    const resolved = pathA + pathB + pathC;
    const unresolved = total - resolved;
    const coveragePct = total > 0 ? ROUND(resolved / total * 100, 2) : 100;

    // S1 is REFERENCE, not READY
    const runtimeReady = sn !== 1 && unresolved === 0 && total > 0;
    const historicalReady = HISTORICAL_READY.has(sn);
    const disc = discrepancy(historicalReady, runtimeReady, sn);

    analyses.push({
      surahNumber: sn,
      surahName,
      totalForms: total,
      resolvedForms: resolved,
      unresolvedForms: unresolved,
      coveragePercent: coveragePct,
      pathAWordTranslation: pathA,
      pathBLemmaDirect: pathB,
      pathCWLM: pathC,
      classALemmaReachable: classA,
      wordTranslationsNeeded: unresolved, // all unresolved need word_tr (classA=lemma_tr, not word_tr)
      historicalReady,
      runtimeReady,
      statusDiscrepancy: disc,
    });
  }

  // ─── 4. Global counts ──────────────────────────────────────────────────
  console.log("=== Global counts ===\n");

  let runtimeReadyCount = 0, runtimeNotReadyCount = 0, referenceCount = 0;
  let historicalReadyCount = 0;
  let historicalReadyRuntimeNotReadyCount = 0;
  let newRuntimeReadyCount = 0;

  for (const a of analyses) {
    if (a.surahNumber === 1) {
      referenceCount++;
    } else if (a.runtimeReady) {
      runtimeReadyCount++;
    } else {
      runtimeNotReadyCount++;
    }

    if (a.historicalReady) historicalReadyCount++;

    if (a.statusDiscrepancy === "HISTORICAL_READY_RUNTIME_NOT_READY") historicalReadyRuntimeNotReadyCount++;
    if (a.statusDiscrepancy === "NEW_RUNTIME_READY") newRuntimeReadyCount++;
  }

  const totalSurahs = runtimeReadyCount + runtimeNotReadyCount + referenceCount;

  console.log(`  READY (runtime): ${runtimeReadyCount}`);
  console.log(`  NOT READY (runtime): ${runtimeNotReadyCount}`);
  console.log(`  REFERENCE: ${referenceCount}`);
  console.log(`  Total: ${totalSurahs}`);
  console.log(`  Historical READY: ${historicalReadyCount}`);
  console.log(`  HISTORICAL_READY_RUNTIME_NOT_READY: ${historicalReadyRuntimeNotReadyCount}`);
  console.log(`  NEW_RUNTIME_READY: ${newRuntimeReadyCount}\n`);

  // Check consistency
  if (totalSurahs !== 114) {
    console.log(`  ❌ INCONSISTENT: ${totalSurahs} != 114`);
    process.exit(1);
  }
  console.log("  ✅ READY + NOT_READY + REFERENCE = 114\n");

  // ─── 5. Critical reconciliation check ──────────────────────────────────
  console.log("=== Critical reconciliation ===\n");
  const criticalSurahs = [98, 92, 82, 85, 90, 70, 46, 36, 29, 13];
  for (const sn of criticalSurahs) {
    const a = analyses.find(x => x.surahNumber === sn)!;
    const status = a.runtimeReady ? "✅ READY" : `❌ ${a.unresolvedForms} unresolved`;
    console.log(`  S${sn} ${a.surahName.padEnd(20)} ${a.resolvedForms}/${a.totalForms} (${a.coveragePercent}%) → ${status}  [${a.statusDiscrepancy}]`);
  }
  console.log();

  // ─── 6. Global form coverage ────────────────────────────────────────────
  console.log("=== Global form coverage ===\n");

  let globalTotalForms = 0, globalResolvedForms = 0, globalUnresolvedForms = 0;
  for (const a of analyses) {
    globalTotalForms += a.totalForms;
    globalResolvedForms += a.resolvedForms;
    globalUnresolvedForms += a.unresolvedForms;
  }
  const globalCoveragePct = ROUND(globalResolvedForms / globalTotalForms * 100, 2);

  console.log(`  Total forms: ${globalTotalForms}`);
  console.log(`  Resolved: ${globalResolvedForms} (${globalCoveragePct}%)`);
  console.log(`  Unresolved: ${globalUnresolvedForms}`);
  console.log(`  word_translations FR (DB entries): ${frWordTr.size}`);
  console.log(`  lemma_translations FR (DB entries): ${frLemmaTr.size}`);
  console.log(`  WLM safe (DB entries): ${wlmByWord.size}`);

  // ClassA global
  let globalClassA = 0;
  for (const a of analyses) globalClassA += a.classALemmaReachable;
  console.log(`  Global classA (lemma-reachable): ${globalClassA}`);
  if (globalClassA === 0) {
    console.log("  → All completion passes exclusively through word_translations.\n");
  } else {
    console.log(`  → ${globalClassA} forms could be resolved via lemma translations.\n`);
  }

  // ─── 7. Three critical lists ───────────────────────────────────────────
  console.log("=== Three critical lists ===\n");

  // A. TRUE_RUNTIME_READY
  const trueRuntimeReady = analyses
    .filter(a => a.runtimeReady)
    .map(a => a.surahNumber)
    .sort((a, b) => a - b);
  console.log(`  A. TRUE_RUNTIME_READY (${trueRuntimeReady.length}): ${trueRuntimeReady.join(", ")}\n`);

  // B. HISTORICAL_READY_RUNTIME_NOT_READY
  const historicalNotReady = analyses
    .filter(a => a.statusDiscrepancy === "HISTORICAL_READY_RUNTIME_NOT_READY")
    .sort((a, b) => a.surahNumber - b.surahNumber);
  console.log(`  B. HISTORICAL_READY_RUNTIME_NOT_READY (${historicalNotReady.length}):`);
  for (const a of historicalNotReady) {
    console.log(`    S${a.surahNumber} ${a.surahName}: ${a.resolvedForms}/${a.totalForms} (${a.coveragePercent}%), ${a.unresolvedForms} unresolved, ${a.wordTranslationsNeeded} word_tr needed`);
  }
  console.log();

  // C. COMPLETION_QUEUE (non-READY, sorted by word_tr_needed ASC, coverage DESC, total ASC)
  const completionQueue = analyses
    .filter(a => !a.runtimeReady && a.surahNumber !== 1)
    .sort((a, b) => {
      if (a.wordTranslationsNeeded !== b.wordTranslationsNeeded) return a.wordTranslationsNeeded - b.wordTranslationsNeeded;
      if (a.coveragePercent !== b.coveragePercent) return b.coveragePercent - a.coveragePercent;
      return a.totalForms - b.totalForms;
    });
  console.log(`  C. COMPLETION_QUEUE (${completionQueue.length} surahs)`);
  console.log(`    Top 10: ${completionQueue.slice(0, 10).map(a => `S${a.surahNumber}(${a.wordTranslationsNeeded})`).join(", ")}\n`);

  // ─── 8. Top 20 rankings ────────────────────────────────────────────────
  console.log("=== Top 20 rankings ===\n");

  // TOP 20 — LOWEST COMPLETION COST
  const top20LowestCost = completionQueue.slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surah: a.surahNumber,
    name: a.surahName,
    total_forms: a.totalForms,
    resolved: a.resolvedForms,
    unresolved: a.unresolvedForms,
    coverage: a.coveragePercent,
    word_translations_needed: a.wordTranslationsNeeded,
  }));

  console.log("  TOP 20 — LOWEST COMPLETION COST:");
  console.log("  Rang  Surah  Name            Formes  Résolus  Unres  Couv%   WT_needed");
  for (const t of top20LowestCost) {
    console.log(`  ${String(t.rank).padStart(3)}   S${String(t.surah).padEnd(3)}  ${t.name.padEnd(14)}  ${String(t.total_forms).padStart(5)}  ${String(t.resolved).padStart(5)}  ${String(t.unresolved).padStart(5)}  ${String(t.coverage).padStart(5)}  ${String(t.word_translations_needed).padStart(6)}`);
  }
  console.log();

  // TOP 20 — BEST BALANCED ROI
  // Score = coverage_norm * 0.40 + effort_norm * 0.30 + size_norm * 0.30
  // where:
  //   coverage_norm = coverage / 100
  //   effort_norm = 1 - min(word_tr_needed / 500, 1)  (capped at 500)
  //   size_norm = min(total_forms / 2000, 1)          (capped at 2000)
  const top20BalancedROI = completionQueue.map(a => {
    const coverageNorm = a.coveragePercent / 100;
    const effortNorm = 1 - Math.min(a.wordTranslationsNeeded / 500, 1);
    const sizeNorm = Math.min(a.totalForms / 2000, 1);
    const score = ROUND(coverageNorm * 0.40 + effortNorm * 0.30 + sizeNorm * 0.30, 4);
    return { ...a, score };
  }).sort((a, b) => b.score - a.score).slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surah: a.surahNumber,
    name: a.surahName,
    total_forms: a.totalForms,
    coverage: a.coveragePercent,
    word_translations_needed: a.wordTranslationsNeeded,
    score: a.score,
  }));

  console.log("  TOP 20 — BEST BALANCED ROI:");
  console.log("  Rang  Surah  Name            Formes  Couv%   WT_need  Score");
  for (const t of top20BalancedROI) {
    console.log(`  ${String(t.rank).padStart(3)}   S${String(t.surah).padEnd(3)}  ${t.name.padEnd(14)}  ${String(t.total_forms).padStart(5)}  ${String(t.coverage).padStart(5)}  ${String(t.word_translations_needed).padStart(6)}  ${t.score.toFixed(4)}`);
  }
  console.log();

  // TOP 20 — MAXIMUM ABSOLUTE COVERAGE GAIN
  const top20MaxGain = [...completionQueue].sort((a, b) => b.unresolvedForms - a.unresolvedForms).slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surah: a.surahNumber,
    name: a.surahName,
    total_forms: a.totalForms,
    resolved: a.resolvedForms,
    unresolved: a.unresolvedForms,
    coverage: a.coveragePercent,
    word_translations_needed: a.wordTranslationsNeeded,
  }));

  console.log("  TOP 20 — MAXIMUM ABSOLUTE COVERAGE GAIN:");
  console.log("  Rang  Surah  Name            Formes  Unres  Couv%   WT_needed");
  for (const t of top20MaxGain) {
    console.log(`  ${String(t.rank).padStart(3)}   S${String(t.surah).padEnd(3)}  ${t.name.padEnd(14)}  ${String(t.total_forms).padStart(5)}  ${String(t.unresolved).padStart(5)}  ${String(t.coverage).padStart(5)}  ${String(t.word_translations_needed).padStart(6)}`);
  }
  console.log();

  // ─── 9. Build report ───────────────────────────────────────────────────
  const report = {
    phase: "88F-AO",
    verdict: totalSurahs === 114 ? "PHASE_88F_AO_COMPLETE" : "PHASE_88F_AO_BLOCKED_INCONSISTENT_GLOBAL_COUNTS",
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    runtimeResolutionModel: {
      order: [
        "PATH A: word_translations (language='fr', is_validated=true)",
        "PATH B: quran_words.lemma_id → lemma_translations (fr, validated)",
        "PATH C: word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)",
      ],
      explicitlyExcluded: ["linguistic_occurrences.hikma_lemma_id (MASAQ) — NOT consumed by resolveWordMeanings"],
    },

    global: {
      totalSurahs: 114,
      runtimeReady: runtimeReadyCount,
      runtimeNotReady: runtimeNotReadyCount,
      reference: referenceCount,
      historicalReady: historicalReadyCount,
      historicalReadyRuntimeNotReady: historicalReadyRuntimeNotReadyCount,
      newRuntimeReady: newRuntimeReadyCount,
      consistencyCheck: totalSurahs === 114,
    },

    coverage: {
      totalForms: globalTotalForms,
      resolvedForms: globalResolvedForms,
      unresolvedForms: globalUnresolvedForms,
      coveragePercent: globalCoveragePct,
      wordTranslationsFR: frWordTr.size,
      lemmaTranslationsFR: frLemmaTr.size,
      wlmSafe: wlmByWord.size,
      globalClassALemmaReachable: globalClassA,
    },

    surahs: analyses.map(a => ({
      surahNumber: a.surahNumber,
      surahName: a.surahName,
      totalForms: a.totalForms,
      resolvedForms: a.resolvedForms,
      unresolvedForms: a.unresolvedForms,
      coveragePercent: a.coveragePercent,
      pathAWordTranslation: a.pathAWordTranslation,
      pathBLemmaDirect: a.pathBLemmaDirect,
      pathCWLM: a.pathCWLM,
      classALemmaReachable: a.classALemmaReachable,
      wordTranslationsNeeded: a.wordTranslationsNeeded,
      historicalReady: a.historicalReady,
      runtimeReady: a.runtimeReady,
      statusDiscrepancy: a.statusDiscrepancy,
    })),

    criticalLists: {
      A_TRUE_RUNTIME_READY: trueRuntimeReady,
      B_HISTORICAL_READY_RUNTIME_NOT_READY: historicalNotReady.map(a => ({
        surahNumber: a.surahNumber,
        surahName: a.surahName,
        totalForms: a.totalForms,
        resolvedForms: a.resolvedForms,
        unresolvedForms: a.unresolvedForms,
        coveragePercent: a.coveragePercent,
        wordTranslationsNeeded: a.wordTranslationsNeeded,
      })),
      C_COMPLETION_QUEUE: completionQueue.map(a => ({
        surahNumber: a.surahNumber,
        surahName: a.surahName,
        totalForms: a.totalForms,
        resolvedForms: a.resolvedForms,
        unresolvedForms: a.unresolvedForms,
        coveragePercent: a.coveragePercent,
        wordTranslationsNeeded: a.wordTranslationsNeeded,
        classALemmaReachable: a.classALemmaReachable,
      })),
    },

    rankings: {
      top20LowestCompletionCost: top20LowestCost,
      top20BalancedROI: top20BalancedROI.map(t => ({
        ...t,
        scoreFormula: "coverage_norm * 0.40 + effort_norm * 0.30 + size_norm * 0.30",
      })),
      top20MaxAbsoluteCoverageGain: top20MaxGain,
    },

    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      wlmCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
      protectedTables: "all unchanged",
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  READY: ${runtimeReadyCount}  NOT_READY: ${runtimeNotReadyCount}  REFERENCE: ${referenceCount}`);
  console.log(`  Global coverage: ${globalResolvedForms}/${globalTotalForms} (${globalCoveragePct}%)`);
  console.log(`  DATABASE_WRITES: 0 ✅`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AO", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
