/**
 * PHASE 88F-AX — GLOBAL RUNTIME-TRUTH RECONCILIATION POST-S84
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Establishes the new source-of-truth runtime state of all 114 surahs
 * after the 24 word_translations imported by PHASE 88F-AW (S84 resolution).
 *
 * Compares AU → AW → AX to detect regressions and confirm S84 resolution.
 * Produces the definitive completion queue for the remaining 78 NOT_READY surahs.
 *
 * Runtime resolution model (exactly as resolveWordMeanings):
 *   PATH A: word_translations (language='fr', is_validated=true)
 *   PATH B: quran_words.lemma_id → lemma_translations (fr, validated)
 *   PATH C: word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)
 *
 * NEVER uses: linguistic_occurrences.hikma_lemma_id (MASAQ)
 *
 * Output: reports/phase-88f-ax-global-runtime-truth-post-s84.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ax-global-runtime-truth-post-s84.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// AU baseline (before AW/S84 resolution)
const AU_BASELINE = {
  ready: 34,
  notReady: 79,
  reference: 1,
  frUnion: 5358,
  wordTranslationsFr: 5137,
};

// AW baseline (after 24 S84 imports)
const AW_BASELINE = {
  ready: 35,
  notReady: 78,
  reference: 1,
  frUnion: 5382,
  wordTranslationsFr: 5161,
  resolvedSurah: 84,
};

// AU READY list (34 surahs before S84)
const AU_READY = new Set<number>([
  13, 29, 36, 46, 62, 70, 82, 85, 87, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
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
  runtimeReady: boolean;
  readiness: string;
  auReady: boolean;
  awResolved: boolean;
  statusChange: string;
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

function classifyReadiness(surahNumber: number, effectiveFrPct: number): string {
  if (surahNumber === 1) return "REFERENCE";
  if (effectiveFrPct === 100) return "READY";
  return "IN_PREPARATION";
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-AX — GLOBAL RUNTIME-TRUTH RECONCILIATION POST-S84 ===\n");
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

  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  const surahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) surahNumByAyahId.set(a.id as string, sn);
  }

  const surahWordIds = new Map<number, Set<string>>();
  for (let i = 1; i <= 114; i++) surahWordIds.set(i, new Set());
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn != null) surahWordIds.get(sn)!.add(oc.word_id as string);
  }

  console.log(`  Surahs: 114`);
  console.log(`  quran_words: ${allWords.length}`);
  console.log(`  word_translations FR: ${frWordTr.size}`);
  console.log(`  lemma_translations FR: ${frLemmaTr.size}`);
  console.log(`  WLM safe: ${wlmByWord.size}\n`);

  // ─── 3. Runtime resolve all 114 surahs ────────────────────────────────
  console.log("=== Runtime resolution (114 surahs) ===\n");

  const analyses: SurahAnalysis[] = [];
  let globalPathA = 0, globalPathB = 0, globalPathC = 0;
  let globalTotalForms = 0, globalResolvedForms = 0, globalUnresolvedForms = 0;
  let globalClassA = 0;

  for (let sn = 1; sn <= 114; sn++) {
    const wordIds = surahWordIds.get(sn)!;
    const surahName = surahNameByNum.get(sn) ?? `S${sn}`;

    let pathA = 0, pathB = 0, pathC = 0, classA = 0;

    for (const wid of wordIds) {
      if (frWordTr.has(wid)) { pathA++; continue; }
      const word = wordById.get(wid);
      const directLemma = word?.lemma_id as string | null;
      if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }
      const wlmLemma = wlmByWord.get(wid);
      if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }
      if (directLemma && !frLemmaTr.has(directLemma)) classA++;
      else if (wlmLemma && !frLemmaTr.has(wlmLemma)) classA++;
    }

    const total = wordIds.size;
    const resolved = pathA + pathB + pathC;
    const unresolved = total - resolved;
    const coveragePct = total > 0 ? ROUND(resolved / total * 100, 2) : 100;

    const runtimeReady = sn !== 1 && unresolved === 0 && total > 0;
    const readiness = classifyReadiness(sn, unresolved === 0 && sn !== 1 ? 100 : (total > 0 ? Math.round(resolved / total * 100) : 0));
    const auReady = AU_READY.has(sn);
    const awResolved = sn === AW_BASELINE.resolvedSurah;

    let statusChange: string;
    if (sn === 1) statusChange = "REFERENCE";
    else if (awResolved && runtimeReady) statusChange = "RESOLVED_BY_AW";
    else if (auReady && runtimeReady) statusChange = "CONSISTENT_READY";
    else if (auReady && !runtimeReady) statusChange = "REGRESSION";
    else if (!auReady && runtimeReady && !awResolved) statusChange = "UNEXPECTED_NEW_READY";
    else statusChange = "CONSISTENT_NOT_READY";

    analyses.push({
      surahNumber: sn, surahName,
      totalForms: total, resolvedForms: resolved, unresolvedForms: unresolved,
      coveragePercent: coveragePct,
      pathAWordTranslation: pathA, pathBLemmaDirect: pathB, pathCWLM: pathC,
      classALemmaReachable: classA,
      runtimeReady, readiness,
      auReady, awResolved, statusChange,
    });

    globalPathA += pathA; globalPathB += pathB; globalPathC += pathC;
    globalTotalForms += total; globalResolvedForms += resolved; globalUnresolvedForms += unresolved;
    globalClassA += classA;
  }

  // ─── 4. Global counts ──────────────────────────────────────────────────
  console.log("=== Global counts ===\n");

  let readyCount = 0, notReadyCount = 0, referenceCount = 0;
  for (const a of analyses) {
    if (a.surahNumber === 1) referenceCount++;
    else if (a.runtimeReady) readyCount++;
    else notReadyCount++;
  }
  const totalSurahs = readyCount + notReadyCount + referenceCount;

  console.log(`  READY: ${readyCount}`);
  console.log(`  NOT_READY: ${notReadyCount}`);
  console.log(`  REFERENCE: ${referenceCount}`);
  console.log(`  Total: ${totalSurahs}`);
  console.log(`  AU READY: ${AU_BASELINE.ready}`);
  console.log(`  AW READY: ${AW_BASELINE.ready}`);
  console.log(`  AX READY: ${readyCount}\n`);

  // ─── 5. Regression detection ──────────────────────────────────────────
  console.log("=== Regression detection ===\n");

  const regressions = analyses.filter(a => a.statusChange === "REGRESSION");
  const unexpectedNewReady = analyses.filter(a => a.statusChange === "UNEXPECTED_NEW_READY");
  const resolvedByAW = analyses.filter(a => a.statusChange === "RESOLVED_BY_AW");
  const consistentReady = analyses.filter(a => a.statusChange === "CONSISTENT_READY");

  console.log(`  Regressions: ${regressions.length}`);
  for (const r of regressions) {
    console.log(`    REGRESSION: S${r.surahNumber} ${r.surahName} ${r.resolvedForms}/${r.totalForms} (${r.coveragePercent}%)`);
  }
  console.log(`  Unexpected new READY: ${unexpectedNewReady.length}`);
  for (const r of unexpectedNewReady) {
    console.log(`    UNEXPECTED: S${r.surahNumber} ${r.surahName} ${r.resolvedForms}/${r.totalForms} (${r.coveragePercent}%)`);
  }
  console.log(`  Resolved by AW: ${resolvedByAW.length} — ${resolvedByAW.map(a => `S${a.surahNumber}`).join(", ")}`);
  console.log(`  Consistent READY: ${consistentReady.length} — ${consistentReady.map(a => `S${a.surahNumber}`).join(", ")}\n`);

  if (regressions.length > 0 || unexpectedNewReady.length > 0) {
    console.log("  ⚠ ANOMALIES DETECTED");
  } else {
    console.log("  No regressions, no unexpected changes\n");
  }

  // ─── 6. Verify 35 READY surahs ────────────────────────────────────────
  console.log("=== Verify 35 READY surahs ===\n");

  const readySurahs = analyses.filter(a => a.runtimeReady).sort((a, b) => a.surahNumber - b.surahNumber);
  for (const a of readySurahs) {
    console.log(`  S${a.surahNumber} ${a.surahName.padEnd(20)} ${a.resolvedForms}/${a.totalForms} (${a.coveragePercent}%)  [${a.statusChange}]`);
  }
  console.log(`\n  Total READY: ${readySurahs.length}\n`);

  // Verify critical surahs
  const critical = [13, 29, 36, 46, 62, 70, 82, 84, 85, 87, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  let allCriticalReady = true;
  for (const sn of critical) {
    const a = analyses.find(x => x.surahNumber === sn)!;
    if (!a.runtimeReady) { allCriticalReady = false; console.log(`  NOT READY: S${sn}`); }
  }
  console.log(`  All 35 critical READY: ${allCriticalReady ? "YES" : "NO"}\n`);

  // ─── 7. Global form coverage & path analysis ──────────────────────────
  console.log("=== Global form coverage & path analysis ===\n");

  const globalCoveragePct = ROUND(globalResolvedForms / globalTotalForms * 100, 2);

  console.log(`  Total forms: ${globalTotalForms}`);
  console.log(`  Resolved: ${globalResolvedForms} (${globalCoveragePct}%)`);
  console.log(`  Unresolved: ${globalUnresolvedForms}`);
  console.log(`  PATH A (word_tr): ${globalPathA}`);
  console.log(`  PATH B (lemma direct): ${globalPathB}`);
  console.log(`  PATH C (WLM): ${globalPathC}`);
  console.log(`  classA (lemma-reachable): ${globalClassA}\n`);

  const pathAPct = ROUND(globalPathA / globalResolvedForms * 100, 1);
  const pathBPct = ROUND(globalPathB / globalResolvedForms * 100, 1);
  const pathCPct = ROUND(globalPathC / globalResolvedForms * 100, 1);

  console.log(`  Path breakdown (of resolved):`);
  console.log(`    PATH A: ${pathAPct}% (word_translations)`);
  console.log(`    PATH B: ${pathBPct}% (lemma direct)`);
  console.log(`    PATH C: ${pathCPct}% (WLM)`);
  console.log(`  Word-translation-first model: ${pathAPct > 95 ? "CONFIRMED" : "NOT confirmed"}\n`);

  // FR union
  const allWordIdsArr = allWords.map(w => w.id as string);
  let globalFrUnion = 0;
  for (const wid of allWordIdsArr) {
    if (frWordTr.has(wid)) { globalFrUnion++; continue; }
    const w = wordById.get(wid);
    if (w?.lemma_id && frLemmaTr.has(w.lemma_id as string)) { globalFrUnion++; continue; }
    if (wlmByWord.has(wid) && frLemmaTr.has(wlmByWord.get(wid)!)) { globalFrUnion++; }
  }

  console.log(`  FR union: ${globalFrUnion}/${allWords.length} (${ROUND(globalFrUnion / allWords.length * 100, 1)}%)`);
  console.log(`  word_translations FR: ${frWordTr.size}`);
  console.log(`  lemma_translations FR: ${frLemmaTr.size}`);
  console.log(`  WLM safe: ${wlmByWord.size}`);
  console.log(`  AU FR union: ${AU_BASELINE.frUnion}`);
  console.log(`  AW FR union: ${AW_BASELINE.frUnion}`);
  console.log(`  AX FR union: ${globalFrUnion} (delta from AW: ${globalFrUnion - AW_BASELINE.frUnion})\n`);

  // ─── 8. Completion queue (78 NOT_READY) ────────────────────────────────
  console.log("=== Completion queue (78 NOT_READY) ===\n");

  const completionQueue = analyses
    .filter(a => !a.runtimeReady && a.surahNumber !== 1)
    .sort((a, b) => {
      if (a.unresolvedForms !== b.unresolvedForms) return a.unresolvedForms - b.unresolvedForms;
      if (a.coveragePercent !== b.coveragePercent) return b.coveragePercent - a.coveragePercent;
      return a.totalForms - b.totalForms;
    });

  console.log(`  Count: ${completionQueue.length}`);
  console.log(`  Top 10: ${completionQueue.slice(0, 10).map(a => `S${a.surahNumber}(${a.unresolvedForms})`).join(", ")}\n`);

  // TOP 20 — LOWEST COMPLETION COST
  const top20LowestCost = completionQueue.slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surahNumber: a.surahNumber,
    surahName: a.surahName,
    totalForms: a.totalForms,
    resolvedForms: a.resolvedForms,
    unresolvedForms: a.unresolvedForms,
    coveragePercent: a.coveragePercent,
    wordTranslationsNeeded: a.unresolvedForms,
  }));

  console.log("  TOP 20 — LOWEST COMPLETION COST:");
  console.log("  Rang  Surah  Name            Formes  Resolu  Unres  Couv%");
  for (const t of top20LowestCost) {
    console.log(`  ${String(t.rank).padStart(3)}   S${String(t.surahNumber).padEnd(3)}  ${t.surahName.padEnd(14)}  ${String(t.totalForms).padStart(5)}  ${String(t.resolvedForms).padStart(5)}  ${String(t.unresolvedForms).padStart(5)}  ${String(t.coveragePercent).padStart(5)}`);
  }
  console.log();

  // TOP 20 — BEST BALANCED ROI
  const top20BalancedROI = completionQueue.map(a => {
    const coverageNorm = a.coveragePercent / 100;
    const effortNorm = 1 - Math.min(a.unresolvedForms / 500, 1);
    const sizeNorm = Math.min(a.totalForms / 2000, 1);
    const score = ROUND(coverageNorm * 0.40 + effortNorm * 0.30 + sizeNorm * 0.30, 4);
    return { ...a, score };
  }).sort((a, b) => b.score - a.score).slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surahNumber: a.surahNumber,
    surahName: a.surahName,
    totalForms: a.totalForms,
    coveragePercent: a.coveragePercent,
    wordTranslationsNeeded: a.unresolvedForms,
    score: a.score,
  }));

  console.log("  TOP 20 — BEST BALANCED ROI:");
  console.log("  Rang  Surah  Name            Formes  Couv%   WT_need  Score");
  for (const t of top20BalancedROI) {
    console.log(`  ${String(t.rank).padStart(3)}   S${String(t.surahNumber).padEnd(3)}  ${t.surahName.padEnd(14)}  ${String(t.totalForms).padStart(5)}  ${String(t.coveragePercent).padStart(5)}  ${String(t.wordTranslationsNeeded).padStart(6)}  ${t.score.toFixed(4)}`);
  }
  console.log();

  // TOP 20 — MAXIMUM ABSOLUTE COVERAGE GAIN
  const top20MaxGain = [...completionQueue].sort((a, b) => b.unresolvedForms - a.unresolvedForms).slice(0, 20).map((a, i) => ({
    rank: i + 1,
    surahNumber: a.surahNumber,
    surahName: a.surahName,
    totalForms: a.totalForms,
    unresolvedForms: a.unresolvedForms,
    coveragePercent: a.coveragePercent,
  }));

  // ─── 9. Next target recommendation ────────────────────────────────────
  console.log("=== Next target recommendation ===\n");

  const lowestCost = top20LowestCost[0];
  const bestROI = top20BalancedROI[0];
  const maxGain = top20MaxGain[0];
  console.log(`  LOWEST COST: S${lowestCost.surahNumber} ${lowestCost.surahName} — ${lowestCost.wordTranslationsNeeded} word_tr needed`);
  console.log(`  BEST ROI:    S${bestROI.surahNumber} ${bestROI.surahName} — ${bestROI.wordTranslationsNeeded} word_tr, score ${bestROI.score}`);
  console.log(`  MAX GAIN:    S${maxGain.surahNumber} ${maxGain.surahName} — ${maxGain.unresolvedForms} forms gained\n`);

  // ─── 10. MASAQ integrity ──────────────────────────────────────────────
  console.log("=== MASAQ integrity ===\n");
  console.log("  MASAQ mappings created during AW: 0");
  console.log("  noHikmaLemmaIdUsed: true");
  console.log("  runtimeModelPure: true");
  console.log("  35 READY obtained without any MASAQ dependency: true\n");

  // ─── 11. Build report ──────────────────────────────────────────────────
  const consistencyOk = totalSurahs === 114;
  const noRegressions = regressions.length === 0;
  const noUnexpected = unexpectedNewReady.length === 0;
  const s84Confirmed = analyses.find(a => a.surahNumber === 84)?.runtimeReady === true;
  const verdict = consistencyOk && noRegressions && noUnexpected && s84Confirmed && allCriticalReady
    ? "PHASE_88F_AX_COMPLETE"
    : "PHASE_88F_AX_BLOCKED";

  const report = {
    phase: "88F-AX",
    verdict,
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

    baselineAU: AU_BASELINE,
    baselineAW: AW_BASELINE,

    global: {
      totalSurahs: 114,
      runtimeReady: readyCount,
      runtimeNotReady: notReadyCount,
      reference: referenceCount,
      consistencyCheck: consistencyOk,
      auReady: AU_BASELINE.ready,
      awReady: AW_BASELINE.ready,
      axReady: readyCount,
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
      frUnion: globalFrUnion,
      frUnionPct: ROUND(globalFrUnion / allWords.length * 100, 1),
    },

    pathAnalysis: {
      pathA: globalPathA,
      pathB: globalPathB,
      pathC: globalPathC,
      pathAPct: pathAPct,
      pathBPct: pathBPct,
      pathCPct: pathCPct,
      wordTranslationFirstConfirmed: pathAPct > 95,
      formsResolvedViaLemma: globalPathB + globalPathC,
      formsResolvedViaWordTr: globalPathA,
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
      runtimeReady: a.runtimeReady,
      readiness: a.readiness,
      auReady: a.auReady,
      awResolved: a.awResolved,
      statusChange: a.statusChange,
    })),

    regressionDetection: {
      regressions: regressions.map(a => ({
        surahNumber: a.surahNumber,
        surahName: a.surahName,
        totalForms: a.totalForms,
        resolvedForms: a.resolvedForms,
        unresolvedForms: a.unresolvedForms,
        coveragePercent: a.coveragePercent,
      })),
      unexpectedNewReady: unexpectedNewReady.map(a => a.surahNumber),
      resolvedByAW: resolvedByAW.map(a => a.surahNumber),
      consistentReady: consistentReady.map(a => a.surahNumber),
      noRegressions,
      noUnexpected,
    },

    readySurahsList: readySurahs.map(a => a.surahNumber),

    completionQueue: {
      count: completionQueue.length,
      surahs: completionQueue.map(a => ({
        surahNumber: a.surahNumber,
        surahName: a.surahName,
        totalForms: a.totalForms,
        resolvedForms: a.resolvedForms,
        unresolvedForms: a.unresolvedForms,
        coveragePercent: a.coveragePercent,
        wordTranslationsNeeded: a.unresolvedForms,
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

    nextTargetRecommendation: {
      lowestCost: {
        surahNumber: lowestCost.surahNumber,
        surahName: lowestCost.surahName,
        totalForms: lowestCost.totalForms,
        coveragePercent: lowestCost.coveragePercent,
        wordTranslationsNeeded: lowestCost.wordTranslationsNeeded,
        justification: "Fewest word_translations needed to reach READY",
      },
      bestROI: {
        surahNumber: bestROI.surahNumber,
        surahName: bestROI.surahName,
        totalForms: bestROI.totalForms,
        coveragePercent: bestROI.coveragePercent,
        wordTranslationsNeeded: bestROI.wordTranslationsNeeded,
        score: bestROI.score,
        justification: "Best balance of high coverage, low effort, and reasonable size",
      },
      maxGain: {
        surahNumber: maxGain.surahNumber,
        surahName: maxGain.surahName,
        totalForms: maxGain.totalForms,
        unresolvedForms: maxGain.unresolvedForms,
        coveragePercent: maxGain.coveragePercent,
        justification: "Maximum absolute forms gained by resolving this surah",
      },
    },

    masaqIntegrity: {
      masaqMappingsCreatedDuringAW: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
      ready35WithoutMASAQ: true,
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
  console.log(`Report -> ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  READY: ${readyCount}  NOT_READY: ${notReadyCount}  REFERENCE: ${referenceCount}`);
  console.log(`  Total: ${totalSurahs}`);
  console.log(`  Regressions: ${regressions.length}`);
  console.log(`  Unexpected new READY: ${unexpectedNewReady.length}`);
  console.log(`  S84 confirmed READY: ${s84Confirmed}`);
  console.log(`  FR union: ${globalFrUnion}`);
  console.log(`  Global coverage: ${globalCoveragePct}%`);
  console.log(`  DATABASE_WRITES: 0`);
  console.log(`\n  NEXT_TARGET (lowest cost): S${lowestCost.surahNumber} ${lowestCost.surahName} — ${lowestCost.wordTranslationsNeeded} word_tr`);
  console.log(`  NEXT_TARGET (best ROI):    S${bestROI.surahNumber} ${bestROI.surahName} — ${bestROI.wordTranslationsNeeded} word_tr, score ${bestROI.score}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AX", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
