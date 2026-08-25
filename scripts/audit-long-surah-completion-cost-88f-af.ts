/**
 * PHASE 88F-AF — LONG-SURAH-FIRST COMPLETION COST RANKING
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Builds on 88F-AE runtime-truth methodology. For all 40 long surahs
 * (>= 482 forms), computes exact word_translation cost to reach 100%.
 * Produces three rankings: EASY (lowest actions), BALANCED (best
 * size/coverage/cost tradeoff), MAX_COVERAGE (most new FR forms).
 * Compares each candidate against the S46 benchmark.
 *
 * Resolution model: resolveWordMeanings → word_tr | quran_words.lemma_id | WLM.
 * linguistic_occurrences.hikma_lemma_id is NEVER used.
 *
 * Output: reports/phase-88f-af-long-surah-completion-cost.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-af-long-surah-completion-cost.json";
const PAGE_SIZE = 1000;
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-AF — LONG-SURAH COMPLETION COST RANKING ===\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,is_validated"),
  ]);

  // Indexes
  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) {
    const sn = s.number as number;
    surahNumById.set(s.id as string, sn);
    surahNameByNum.set(sn, (s.name_transliteration as string) ?? `S${sn}`);
  }

  // FR word / lemma translations (runtime)
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // ─── 2. Per-surah word sets ────────────────────────────────────────────
  console.log("Building per-surah indexes...");
  const ayahSurahMap = new Map<string, string>();
  for (const a of allAyahs) ayahSurahMap.set(a.id as string, a.surah_id as string);

  const wordIdsBySurah = new Map<number, Set<string>>();
  for (const oc of allOccs) {
    const surahId = ayahSurahMap.get(oc.ayah_id as string);
    if (!surahId) continue;
    const sn = surahNumById.get(surahId);
    if (sn == null) continue;
    if (!wordIdsBySurah.has(sn)) wordIdsBySurah.set(sn, new Set());
    wordIdsBySurah.get(sn)!.add(oc.word_id as string);
  }

  // ─── 3. Runtime resolve every surah ───────────────────────────────────
  console.log("Resolving all surahs (runtime-truth)...\n");

  interface SurahCost {
    number: number; name: string; totalForms: number;
    pathA: number; pathB: number; pathC: number; unresolved: number;
    coveragePct: number; readiness: string;
    wordTrNeeded: number; // class C — only solution
    lemmaTrReachable: number; // class A — lemma can reach at runtime
    totalActionsToReady: number;
    // Metrics
    localFormsPerAction: number;
    globalFRAfter: number; // total FR forms after resolution
    completenessRank: number; // % of forms already covered
  }

  const costs: SurahCost[] = [];
  const surahNumbers = [...wordIdsBySurah.keys()].sort((a, b) => a - b);

  for (const sn of surahNumbers) {
    const wordSet = wordIdsBySurah.get(sn)!;
    const name = surahNameByNum.get(sn) ?? `S${sn}`;
    let pathA = 0, pathB = 0, pathC = 0, unresolved = 0;
    let lemmaReachable = 0, wordTrNeeded = 0;

    for (const wid of wordSet) {
      if (frWordTr.has(wid)) { pathA++; continue; }
      const word = wordById.get(wid);
      const directLemma = word?.lemma_id as string | null;
      if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }
      const wlmLemma = wlmByWord.get(wid);
      if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }

      unresolved++;
      // Classify
      if ((directLemma && !frLemmaTr.has(directLemma)) || (wlmLemma && !frLemmaTr.has(wlmLemma))) {
        lemmaReachable++; // lemma exists but no translation yet
      } else {
        wordTrNeeded++; // no runtime lemma link → needs word_tr
      }
    }

    const total = wordSet.size;
    const covered = pathA + pathB + pathC;
    costs.push({
      number: sn, name, totalForms: total,
      pathA, pathB, pathC, unresolved,
      coveragePct: ROUND(covered / total * 100, 1),
      readiness: covered === total ? "READY" : sn === 1 ? "REFERENCE" : "IN_PREPARATION",
      wordTrNeeded, lemmaTrReachable: lemmaReachable,
      totalActionsToReady: lemmaReachable + wordTrNeeded,
      localFormsPerAction: (lemmaReachable + wordTrNeeded) > 0 ? ROUND(unresolved / (lemmaReachable + wordTrNeeded), 2) : 0,
      globalFRAfter: frWordTr.size + wordTrNeeded, // simplified — word_tr adds 1:1 to FR union
      completenessRank: ROUND(covered / total, 4),
    });
  }

  // ─── 4. Long-surah filter ──────────────────────────────────────────────
  const bySize = [...costs].sort((a, b) => b.totalForms - a.totalForms);
  const longThreshold = bySize[Math.min(39, bySize.length - 1)]?.totalForms ?? 50;
  const longSurahs = costs.filter(s => s.totalForms >= longThreshold && s.number !== 1 && s.readiness !== "READY");
  console.log(`  Long surahs (>=${longThreshold} forms, non-READY, non-REF): ${longSurahs.length}\n`);

  // ─── 5. Rankings ───────────────────────────────────────────────────────
  // Ranking 1: EASY — minimal actions
  const easyRank = [...longSurahs].sort((a, b) => a.totalActionsToReady - b.totalActionsToReady);

  // Ranking 2: BALANCED — best size/coverage/cost tradeoff
  // Score: (coveragePct/100) * sqrt(totalForms) / actions — favors high coverage + moderate size
  const balancedScore = (s: SurahCost) => ROUND((s.coveragePct / 100) * Math.sqrt(s.totalForms) / Math.max(1, s.totalActionsToReady), 4);
  const balancedRank = [...longSurahs].sort((a, b) => balancedScore(b) - balancedScore(a));

  // Ranking 3: MAX_COVERAGE — most new FR forms
  const maxCoverageRank = [...longSurahs].sort((a, b) => b.unresolved - a.unresolved);

  // ─── 6. S46 benchmark ──────────────────────────────────────────────────
  // S46 is now READY (100%) — use historical pre-resolution numbers from 88F-AD
  const s46Benchmark = {
    number: 46, name: "Al-Ahqaf", totalForms: 482,
    coverageBefore: 80.3, unresolved: 95,
    actions: 95, wordTrNeeded: 95,
    lemmaTrReachable: 0,
    localFormsPerAction: 1,
    note: "Historical benchmark — S46 is now READY at 482/482.",
  };

  // ─── 7. Display ────────────────────────────────────────────────────────
  const fmt = (s: SurahCost) =>
    `${s.number.toString().padStart(3)} ${s.name.padEnd(22)} ${String(s.totalForms).padStart(4)}f  ${String(s.coveragePct).padStart(5)}%  miss=${String(s.unresolved).padStart(3)}  acts=${String(s.totalActionsToReady).padStart(4)}  wordTr=${String(s.wordTrNeeded).padStart(4)}  lemma=${String(s.lemmaTrReachable).padStart(2)}  local=${s.localFormsPerAction}`;

  console.log("=== TOP 10 EASY (lowest actions) ===\n");
  for (const s of easyRank.slice(0, 10)) console.log(`  ${fmt(s)}`);

  console.log("\n=== TOP 10 BALANCED (best size/coverage/cost) ===\n");
  for (const s of balancedRank.slice(0, 10)) console.log(`  ${fmt(s)}  balanced=${balancedScore(s)}`);

  console.log("\n=== TOP 10 MAX COVERAGE (most new FR forms) ===\n");
  for (const s of maxCoverageRank.slice(0, 10)) console.log(`  ${fmt(s)}`);

  // ─── 8. Comparison to S46 ──────────────────────────────────────────────
  if (s46Benchmark) {
    console.log(`\n=== S46 BENCHMARK: ${s46Benchmark.totalForms}f, ${s46Benchmark.coverageBefore}%, ${s46Benchmark.actions} actions, ${s46Benchmark.wordTrNeeded} word_tr ===\n`);
    // How many long surahs are better than S46 on each metric?
    const easierCount = longSurahs.filter(s => s.totalActionsToReady < s46Benchmark!.actions).length;
    const closerCount = longSurahs.filter(s => s.coveragePct > s46Benchmark!.coverageBefore).length;
    console.log(`  Long surahs with FEWER actions than S46 (${s46Benchmark.actions}): ${easierCount}`);
    console.log(`  Long surahs with HIGHER coverage than S46 (${s46Benchmark.coverageBefore}%): ${closerCount}`);
    // Best: S28 Al-Qasas (935f, 73.4%, 249 actions)
  }

  // ─── 9. Recommendations ────────────────────────────────────────────────
  const nextEasy = easyRank[0];
  const nextBalanced = balancedRank[0];
  const nextMaxCoverage = maxCoverageRank[0];

  console.log(`\n=== NEXT LONG SURAH RECOMMENDATIONS ===`);
  console.log(`  EASY:          S${nextEasy?.number} — ${nextEasy?.name} (${nextEasy?.totalActionsToReady} actions, ${nextEasy?.coveragePct}%)`);
  console.log(`  BALANCED:      S${nextBalanced?.number} — ${nextBalanced?.name} (${nextBalanced?.totalActionsToReady} actions, ${nextBalanced?.coveragePct}%)`);
  console.log(`  MAX_COVERAGE:  S${nextMaxCoverage?.number} — ${nextMaxCoverage?.name} (${nextMaxCoverage?.unresolved} new FR forms, ${nextMaxCoverage?.totalActionsToReady} actions)`);

  // ─── 10. Build report ──────────────────────────────────────────────────
  const allSurahsTable = longSurahs.map(s => ({
    number: s.number, name: s.name, totalForms: s.totalForms,
    covered: s.totalForms - s.unresolved, coveragePct: s.coveragePct,
    missing: s.unresolved,
    pathA: s.pathA, pathB: s.pathB, pathC: s.pathC,
    wordTrNeeded: s.wordTrNeeded, lemmaTrReachable: s.lemmaTrReachable,
    totalActions: s.totalActionsToReady,
    localFormsPerAction: s.localFormsPerAction,
    readinessAfter: "READY",
    comparedToS46: s46Benchmark
      ? (s.totalActionsToReady < s46Benchmark.actions ? "BETTER" : s.totalActionsToReady === s46Benchmark.actions ? "EQUAL" : "WORSE")
      : "N/A",
  }));

  const readyCount = costs.filter(s => s.readiness === "READY").length;

  const report = {
    phase: "88F-AF",
    verdict: "PHASE_88F_AF_COMPLETE",
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    baseline: {
      readySurahs: readyCount,
      inPreparation: costs.length - readyCount - 1,
      reference: 1,
      frWordTranslations: frWordTr.size,
      frLemmaTranslations: frLemmaTr.size,
      wlmSafe: wlmByWord.size,
      longSurahThreshold: longThreshold,
      longSurahsNonReady: longSurahs.length,
    },
    runtimeModel: {
      paths: ["word_translations (A)", "quran_words.lemma_id → lemma_translations (B)", "word_lemma_mapping → lemma_translations (C)"],
      excluded: ["linguistic_occurrences.hikma_lemma_id — NEVER used"],
    },
    s46Benchmark: s46Benchmark,
    allLongSurahs: allSurahsTable,
    top10Easy: easyRank.slice(0, 10).map(s => ({ number: s.number, name: s.name, totalForms: s.totalForms, coveragePct: s.coveragePct, missing: s.unresolved, wordTrNeeded: s.wordTrNeeded, totalActions: s.totalActionsToReady, localFormsPerAction: s.localFormsPerAction })),
    top10Balanced: balancedRank.slice(0, 10).map(s => ({ number: s.number, name: s.name, totalForms: s.totalForms, coveragePct: s.coveragePct, missing: s.unresolved, wordTrNeeded: s.wordTrNeeded, totalActions: s.totalActionsToReady, balancedScore: balancedScore(s) })),
    top10MaxCoverage: maxCoverageRank.slice(0, 10).map(s => ({ number: s.number, name: s.name, totalForms: s.totalForms, coveragePct: s.coveragePct, missing: s.unresolved, wordTrNeeded: s.wordTrNeeded, totalActions: s.totalActionsToReady })),
    veryLargeSurahs: longSurahs.filter(s => s.totalActionsToReady >= 500).sort((a, b) => b.totalActionsToReady - a.totalActionsToReady).map(s => ({
      number: s.number, name: s.name, totalForms: s.totalForms,
      coveragePct: s.coveragePct, totalActions: s.totalActionsToReady,
      rationale: "Coût très élevé — probablement moins prioritaire que des sourates à 100-200 actions sauf si l'objectif est purement volumétrique.",
    })),
    recommendations: {
      nextLongEasy: nextEasy ? { number: nextEasy.number, name: nextEasy.name, forms: nextEasy.totalForms, coverage: nextEasy.coveragePct, missing: nextEasy.unresolved, actions: nextEasy.totalActionsToReady, wordTrNeeded: nextEasy.wordTrNeeded, localROI: nextEasy.localFormsPerAction, readyAfter: true, justification: "Plus faible nombre d'actions parmi les longues sourates non-READY." } : null,
      nextLongBalanced: nextBalanced ? { number: nextBalanced.number, name: nextBalanced.name, forms: nextBalanced.totalForms, coverage: nextBalanced.coveragePct, missing: nextBalanced.unresolved, actions: nextBalanced.totalActionsToReady, wordTrNeeded: nextBalanced.wordTrNeeded, balancedScore: balancedScore(nextBalanced), readyAfter: true, justification: "Meilleur compromis taille × couverture / coût. Équivalent stratégique de S46." } : null,
      nextLongMaxCoverage: nextMaxCoverage ? { number: nextMaxCoverage.number, name: nextMaxCoverage.name, forms: nextMaxCoverage.totalForms, coverage: nextMaxCoverage.coveragePct, missing: nextMaxCoverage.unresolved, actions: nextMaxCoverage.totalActionsToReady, wordTrNeeded: nextMaxCoverage.wordTrNeeded, newFRForms: nextMaxCoverage.unresolved, readyAfter: true, justification: "Maximise le nombre de nouvelles formes FR. Coût potentiellement très élevé." } : null,
    },
    integrity: {
      databaseWrites: 0, masaqMappingsCreated: 0, curriculumWrites: 0,
      migrations: 0, seeds: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`\nReport → ${OUTPUT}`);
  console.log(`\n=== VERDICT: PHASE_88F_AF_COMPLETE ===`);
  console.log(`  NEXT_LONG_EASY = S${nextEasy?.number} — ${nextEasy?.name}`);
  console.log(`  NEXT_LONG_BALANCED = S${nextBalanced?.number} — ${nextBalanced?.name}`);
  console.log(`  NEXT_LONG_MAX_COVERAGE = S${nextMaxCoverage?.number} — ${nextMaxCoverage?.name}`);
  console.log(`  DATABASE WRITES: 0 ✅`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AF", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});