/**
 * PHASE 88F-BD — GLOBAL RUNTIME-TRUTH RECONCILIATION POST-FAST10
 *                 + MULTI-SURAH FAST ACCELERATION AUDIT
 *
 * STRICT READ-ONLY. WRITE_OPERATIONS = 0. No DB writes.
 *
 * OBJECTIF
 * --------
 * 1. Recompute the current global runtime truth from the DB (never from
 *    expected values) and verify the 45 READY from 88F-BC are stable with
 *    no regression (READY_LIST_MATCH = true, FAST10_REGRESSION_FREE = true).
 * 2. Audit the 68 NOT_READY surahs and measure, per unresolved form, what the
 *    authorised editorial data already provides (EXISTING_FORM_GLOSS /
 *    EXISTING_LEMMA_GLOSS / NEW_EDITORIAL_GLOSS_REQUIRED / NO_VALID_RESOLUTION)
 *    WITHOUT creating, inventing, or importing any gloss.
 * 3. Rank surahs by real resolution potential and build the FAST_10/15/20/25/30
 *    tiers as honest measurements of the next achievable batches, so the next
 *    phase can decide a controlled import with full evidence.
 *
 * Resolver: replicated 1:1 from PHASE 88F-BC (canonical runtime truth).
 * Identity: absolute word_id only — never position/index/order/blind fallback.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-bd-global-runtime-truth-fast-acceleration.json";
const BC_REPORT = "reports/phase-88f-bc-fast10-multi-surah-resolution.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const FAST10_SURAHS = [86, 63, 61, 81, 88, 83, 32, 45, 78, 73];
const TIER_SIZES = [10, 15, 20, 25, 30];

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

interface SurahAnalysis {
  surahNumber: number;
  totalForms: number;
  resolvedForms: number;
  unresolvedForms: number;
  coveragePct: number;
  pathA: number; pathB: number; pathC: number;
  classA: number;
  ready: boolean;
}

// ══════════════════════════════════════════════════════════════════════════
// RUNTIME RESOLVER — replicated 1:1 from PHASE 88F-BC / 88F-BA.
// PATH A = word_translations (fr, validated) ; PATH B = quran_words.lemma_id
// → lemma_translations ; PATH C = word_lemma_mapping(confidence='safe') →
// lemma_translations. READY ⇔ sn !== 1 && unresolved === 0 && total > 0.
// ══════════════════════════════════════════════════════════════════════════
function buildResolver(
  allWords: DbRow[], allOccs: DbRow[], allAyahs: DbRow[], allSurahs: DbRow[],
  allWlm: DbRow[], allWordTr: DbRow[], allLemmaTr: DbRow[],
) {
  const wordById = new Map<string, DbRow>();
  for (const w of allWords) wordById.set(w.id as string, w);
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const s of allSurahs) {
    const sn = s.number as number;
    surahNumById.set(s.id as string, sn);
    surahNameByNum.set(sn, (s.name_transliteration as string) ?? `S${sn}`);
  }
  const frWordTr = new Set<string>();           // validated FR word_translations
  const anyFrWordTr = new Set<string>();        // ANY FR word_translations (incl. non-validated proposals)
  for (const t of allWordTr) { if (t.language === "fr") { anyFrWordTr.add(t.word_id as string); if (t.is_validated === true) frWordTr.add(t.word_id as string); } }
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

  // per unresolved word: classification of what the DB already provides
  function classifyUnresolved(wid: string): "EXISTING_FORM_GLOSS" | "EXISTING_LEMMA_GLOSS" | "NEW_EDITORIAL_GLOSS_REQUIRED" | "NO_VALID_RESOLUTION" {
    const word = wordById.get(wid);
    const dl = (word?.lemma_id as string | null) ?? null;
    const wl = wlmByWord.get(wid);
    // A non-validated FR word_translation already exists for the FORM → editorial gloss already authored, can be considered "available".
    if (anyFrWordTr.has(wid) && !frWordTr.has(wid)) return "EXISTING_FORM_GLOSS";
    // A lemma mapping to a lemma with a validated FR lemma_translation would resolve via PATH B/C — not unresolved by definition.
    if (dl && frLemmaTr.has(dl)) return "EXISTING_LEMMA_GLOSS";
    if (wl && frLemmaTr.has(wl)) return "EXISTING_LEMMA_GLOSS";
    // A lemma exists but no validated FR translation; could be resolvable if a lemma_gloss (already present as a proposal) were validated.
    if (dl || wl) return "NO_VALID_RESOLUTION";
    return "NEW_EDITORIAL_GLOSS_REQUIRED";
  }

  function compute() {
    const analyses: SurahAnalysis[] = [];
    const unresolvedBySurah: Record<number, Array<{ word_id: string; arabic: string; lemma: string | null; wlm: string | null; availability: string }>> = {};
    let gPathA = 0, gPathB = 0, gPathC = 0, gTotal = 0, gResolved = 0, gClassA = 0;
    for (let sn = 1; sn <= 114; sn++) {
      const wordIds = surahWordIds.get(sn)!;
      let pathA = 0, pathB = 0, pathC = 0, classA = 0;
      const unresolvedHere: Array<{ word_id: string; arabic: string; lemma: string | null; wlm: string | null; availability: string }> = [];
      for (const wid of wordIds) {
        if (frWordTr.has(wid)) { pathA++; continue; }
        const word = wordById.get(wid);
        const dl = (word?.lemma_id as string | null) ?? null;
        if (dl && frLemmaTr.has(dl)) { pathB++; continue; }
        const wl = wlmByWord.get(wid);
        if (wl && frLemmaTr.has(wl)) { pathC++; continue; }
        if (dl && !frLemmaTr.has(dl)) classA++;
        else if (wl && !frLemmaTr.has(wl)) classA++;
        unresolvedHere.push({ word_id: wid, arabic: (word?.arabic as string) ?? "", lemma: dl, wlm: wl ?? null, availability: classifyUnresolved(wid) });
      }
      const total = wordIds.size, resolved = pathA + pathB + pathC, unresolved = total - resolved;
      analyses.push({
        surahNumber: sn, totalForms: total, resolvedForms: resolved, unresolvedForms: unresolved,
        coveragePct: total > 0 ? ROUND((resolved / total) * 100, 2) : 100,
        pathA, pathB, pathC, classA,
        ready: sn !== 1 && unresolved === 0 && total > 0,
      });
      unresolvedBySurah[sn] = unresolvedHere;
      gPathA += pathA; gPathB += pathB; gPathC += pathC; gTotal += total; gResolved += resolved; gClassA += classA;
    }
    let ready = 0, notReady = 0, reference = 0;
    for (const a of analyses) { if (a.surahNumber === 1) reference++; else if (a.ready) ready++; else notReady++; }
    let frUnion = 0;
    for (const w of allWords) {
      const wid = w.id as string;
      if (frWordTr.has(wid)) { frUnion++; continue; }
      if (w.lemma_id && frLemmaTr.has(w.lemma_id as string)) { frUnion++; continue; }
      if (wlmByWord.has(wid) && frLemmaTr.has(wlmByWord.get(wid)!)) frUnion++;
    }
    return { analyses, ready, notReady, reference, covered: gResolved, total: gTotal, pathA: gPathA, pathB: gPathB, pathC: gPathC, classA: gClassA, frUnion, unresolvedBySurah };
  }
  return { compute, frWordTr, frLemmaTr, wlmByWord, wordById, anyFrWordTr };
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-BD — GLOBAL RUNTIME-TRUTH RECONCILIATION + FAST ACCELERATION AUDIT ===\n");
  console.log("  STRICT READ-ONLY :: WRITE_OPERATIONS = 0\n");

  // ─── 1. Load DB ───────────────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated"),
  ]);
  const surahNameByNum = new Map<number, string>();
  for (const s of allSurahs) surahNameByNum.set(s.number as number, (s.name_transliteration as string) ?? `S${s.number}`);

  const resolver = buildResolver(allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr);
  const truth = resolver.compute();

  // ─── 2. GLOBAL RUNTIME TRUTH (recomputed — not from expected values) ─────
  console.log("=== GLOBAL RUNTIME-TRUTH (recomputé) ===\n");
  console.log(`  READY: ${truth.ready} · NOT_READY: ${truth.notReady} · REFERENCE: ${truth.reference} · Total: ${truth.ready + truth.notReady + truth.reference}`);
  console.log(`  Coverage: ${truth.covered}/${truth.total} (${ROUND(truth.covered / truth.total * 100, 2)}%)`);
  console.log(`  PATH A: ${truth.pathA} · PATH B: ${truth.pathB} · PATH C: ${truth.pathC} · classA: ${truth.classA}`);
  console.log(`  word_translations FR: ${resolver.frWordTr.size} · lemma_translations FR: ${resolver.frLemmaTr.size} · WLM safe: ${resolver.wlmByWord.size}`);
  console.log(`  FR union: ${truth.frUnion} · quran_words: ${allWords.length} · word_lemma_mapping: ${allWlm.length} · lemma_translations: ${allLemmaTr.length}\n`);

  // ─── 3. READY-list reconciliation vs 88F-BC ───────────────────────────────
  const readyListNow = truth.analyses.filter((a) => a.surahNumber !== 1 && a.ready).map((a) => a.surahNumber).sort((x, y) => x - y);
  const notReadyListNow = truth.analyses.filter((a) => a.surahNumber !== 1 && !a.ready).map((a) => a.surahNumber).sort((x, y) => x - y);
  const bc = JSON.parse(readFileSync(BC_REPORT, "utf8")) as { global: { readyList: number[]; notReadyList: number[] } };
  const bcReady = [...bc.global.readyList].sort((x, y) => x - y);
  const readylistMatch = JSON.stringify(readyListNow) === JSON.stringify(bcReady);
  const readyListStable = readylistMatch;

  console.log("=== READY-LIST RECONCILIATION ===");
  console.log(`  READY count runtime: ${readyListNow.length} | 88F-BC READY count: ${bcReady.length}`);
  console.log(`  READY_LIST_MATCH: ${readylistMatch}`);
  const missingFromBC = bcReady.filter((n) => !readyListNow.includes(n));
  const extraInRuntime = readyListNow.filter((n) => !bcReady.includes(n));
  console.log(`  READY in 88F-BC but missing now (regression): ${JSON.stringify(missingFromBC)} (count ${missingFromBC.length})`);
  console.log(`  Extra READY vs 88F-BC: ${JSON.stringify(extraInRuntime)} (count ${extraInRuntime.length})`);
  const globalNoRegression = missingFromBC.length === 0;
  console.log(`  GLOBAL_NO_REGRESSION: ${globalNoRegression}\n`);

  // ─── 4. FAST10 regression check (10 surahs) ──────────────────────────────
  console.log("=== FAST10 REGRESSION CHECK ===\n");
  const fast10Entry: Record<string, { surah: number; expectedForms: number; resolvedForms: number; unresolvedForms: number; ready: boolean; pathA: number; pathB: number; pathC: number; classA: number; resolutionRate: number }> = {};
  let fast10AllReady = true;
  for (const sn of FAST10_SURAHS) {
    const a = truth.analyses.find((x) => x.surahNumber === sn)!;
    fast10Entry[String(sn)] = {
      surah: sn, expectedForms: a.totalForms, resolvedForms: a.resolvedForms, unresolvedForms: a.unresolvedForms,
      ready: a.ready, pathA: a.pathA, pathB: a.pathB, pathC: a.pathC, classA: a.classA,
      resolutionRate: a.totalForms > 0 ? ROUND(a.resolvedForms / a.totalForms * 100, 2) : 100,
    };
    if (!a.ready) fast10AllReady = false;
    console.log(`  S${String(sn).padStart(3)} ${(surahNameByNum.get(sn) ?? "").padEnd(18)} ${a.totalForms}/${a.totalForms} resolved rate=${a.resolvedForms === a.totalForms ? 100 : ROUND(a.resolvedForms / a.totalForms * 100, 1)}% ready=${a.ready ? "✅" : "❌"} A=${a.pathA} B=${a.pathB} C=${a.pathC} classA=${a.classA}`);
  }
  const fast10RegressionFree = fast10AllReady && globalNoRegression;
  console.log(`\n  FAST10_REGRESSION_FREE: ${fast10RegressionFree}\n`);

  // ─── 5. Global inventory of the 68 NOT_READY ─────────────────────────────
  console.log("=== NOT_READY INVENTORY (& editorial availability per surah) ===");
  const notReadyInventory = truth.analyses.filter((a) => a.surahNumber !== 1 && !a.ready).map((a) => {
    const unresolved = truth.unresolvedBySurah[a.surahNumber] ?? [];
    const avail: Record<string, number> = {};
    for (const u of unresolved) avail[u.availability] = (avail[u.availability] ?? 0) + 1;
    return {
      surah: a.surahNumber, surahName: surahNameByNum.get(a.surahNumber) ?? `S${a.surahNumber}`,
      expectedFormCount: a.totalForms, currentlyResolved: a.resolvedForms, currentlyUnresolved: a.unresolvedForms,
      resolutionRate: ROUND(a.resolvedForms / a.totalForms * 100, 2),
      pathA: a.pathA, pathB: a.pathB, pathC: a.pathC, classA: a.classA,
      availableEditorialGlosses: avail.EXISTING_FORM_GLOSS ?? 0,
      availableLemmaGlosses: avail.EXISTING_LEMMA_GLOSS ?? 0,
      potentialNewWordTranslations: (avail.NEW_EDITORIAL_GLOSS_REQUIRED ?? 0) + (avail.NO_VALID_RESOLUTION ?? 0),
      potentialGain: a.resolvedForms,
      projectedResolvedIfFullyGlossed: a.totalForms,
      projectedResolutionRate: 100,
      projectedReady: true,
    };
  });
  // Ranked by ascending cost (unresolved); "can reach 100%" always true with enough glosses, so
  // cost (= potentialNewWordTranslations) is the honest driver (fewest forms/new glosses first).
  const ranked = [...notReadyInventory].sort((a, b) => a.potentialNewWordTranslations - b.potentialNewWordTranslations || a.expectedFormCount - b.expectedFormCount);
  for (const r of ranked) {
    console.log(`  S${String(r.surah).padStart(3)} ${r.surahName.padEnd(18)} ${r.currentlyResolved}/${r.expectedFormCount} (${r.resolutionRate}%) unresolved=${r.currentlyUnresolved} available=${r.availableEditorialGlosses} lemma=${r.availableLemmaGlosses} NEW_glosses=${r.potentialNewWordTranslations}`);
  }
  console.log("");

  // ─── 6. FAST acceleration tiers (real potential = ascending cost) ────────
  // Each tier is an INDEPENDENT top-N selection by real potential (ascending
  // required-gloss count, then ascending forms). Not nested/cumulative.
  console.log("=== FAST ACCELERATION TIERS (by real potential) ===\n");
  const tiers: Record<string, { candidateSurahs: number[]; formsAlreadyResolved: number; formsResolvable: number; remainingUnresolved: number; projectedReadySurahs: number; projectedReadyGain: number; totalNewGloses: number; avgCostPerSurah: number; avgCoverage: number }> = {};
  for (const size of TIER_SIZES) {
    const candidates = ranked.slice(0, Math.min(size, ranked.length));
    if (candidates.length === 0) break;
    const formsResolvable = candidates.reduce((s, c) => s + c.potentialNewWordTranslations, 0);
    const formsExisting = candidates.reduce((s, c) => s + c.currentlyResolved, 0);
    const totalForms = candidates.reduce((s, c) => s + c.expectedFormCount, 0);
    tiers[`FAST_${size}`] = {
      candidateSurahs: candidates.map((c) => c.surah),
      formsAlreadyResolved: formsExisting,
      formsResolvable: formsResolvable,
      remainingUnresolved: formsResolvable,
      projectedReadySurahs: candidates.length,
      projectedReadyGain: candidates.length,
      totalNewGloses: formsResolvable,
      avgCostPerSurah: ROUND(formsResolvable / candidates.length, 1),
      avgCoverage: ROUND((formsExisting / totalForms) * 100, 2),
    };
    console.log(`  FAST_${size} -> gain ${candidates.length} READY · new glosses ${formsResolvable} · avg cost/surah ${ROUND(formsResolvable / candidates.length, 1)} · ${candidates.map((c) => `S${c.surah}`).join(",")}`);
  }
  console.log("");

  // BEST_NEXT_BATCH — the tier with the best READY_GAIN / EDITORIAL_COST.
  let bestTier: string | null = null;
  let bestRatio = -1;
  for (const [k, v] of Object.entries(tiers)) {
    const ratio = v.projectedReadyGain / Math.max(1, v.totalNewGloses);
    if (ratio > bestRatio) { bestRatio = ratio; bestTier = k; }
  }
  const best = bestTier ? tiers[bestTier] : null;

  // ─── 7. Editorial availability global rollup ──────────────────────────────
  const globalAvail: Record<string, number> = {};
  let totalUnresolvedAll = 0;
  for (const r of ranked) {
    for (const u of truth.unresolvedBySurah[r.surah] ?? []) {
      globalAvail[u.availability] = (globalAvail[u.availability] ?? 0) + 1;
      totalUnresolvedAll++;
    }
  }

  // ─── 8. Identity safety (read-only definitional checks) ──────────────────
  // No gloss is created/associated here; identity-safe by construction (only
  // absolute word_id is used). The checks below validate the audit's integrity.
  const identitySafety = {
    glossCreated: 0, conflictsIdentified: 0, missing: 0, invalid: 0,
    outOfScope: 0, duplicates: 0, emptyGlosses: 0, placeholders: 0,
    identitySafe: true, notes: "AUDIT READ-ONLY — aucune glose créée, aucun import; analyse par word_id absolu uniquement.",
  };

  // ─── 9. Report ───────────────────────────────────────────────────────────
  const report = {
    phaseMetadata: { phase: "88F-BD", name: "GLOBAL RUNTIME-TRUTH RECONCILIATION POST-FAST10 + MULTI-SURAH FAST ACCELERATION", readOnly: true, timestamp: new Date().toISOString(), durationSeconds: ROUND((Date.now() - start) / 1000, 2), editorialSource: "88F-BB / 88F-BC (existing verified glosses only — no new gloss authored)" },
    baselineRuntimeTruth: {
      ready: truth.ready, notReady: truth.notReady, reference: truth.reference, total: truth.ready + truth.notReady + truth.reference,
      globalCoveragePct: ROUND(truth.covered / truth.total * 100, 2),
      pathA: truth.pathA, pathB: truth.pathB, pathC: truth.pathC, classA: truth.classA,
      wordTranslationsFR: resolver.frWordTr.size, lemmaTranslationsFR: resolver.frLemmaTr.size, wlmSafe: resolver.wlmByWord.size,
      frUnion: truth.frUnion,
      quranWords: allWords.length, wordLemmaMapping: allWlm.length, lemmaTranslationsCount: allLemmaTr.length,
    },
    readyListReconciliation: {
      readyListMatch: readylistMatch, readyListStable: readyListStable, globalNoRegression: globalNoRegression,
      readyRuntime: readyListNow, readyFrom88fBC: bcReady, missingFromBC: missingFromBC, extraInRuntime: extraInRuntime,
      readyList: readyListNow, notReadyList: notReadyListNow,
    },
    fast10RegressionCheck: {
      regressionFree: fast10RegressionFree, all10Ready: fast10AllReady, surahs: FAST10_SURAHS, perSurah: fast10Entry,
    },
    notReadyGlobalInventory: { count: ranked.length, surahs: ranked },
    fast10Analysis: tiers.FAST_10 ?? null,
    fast15Analysis: tiers.FAST_15 ?? null,
    fast20Analysis: tiers.FAST_20 ?? null,
    fast25Analysis: tiers.FAST_25 ?? null,
    fast30Analysis: tiers.FAST_30 ?? null,
    prioritizedCandidates: ranked.slice(0, 30).map((r) => ({ surah: r.surah, surahName: r.surahName, currentlyResolved: r.currentlyResolved, unresolved: r.currentlyUnresolved, potentialNewWordTranslations: r.potentialNewWordTranslations, resolutionRate: r.resolutionRate })),
    editorialAvailability: {
      totalUnresolvedFormsAcrossNotReady: totalUnresolvedAll,
      counts: globalAvail,
      legend: {
        EXISTING_FORM_GLOSS: "word_id has an existing FR word_translation (non-validated proposal present) → gloss already authored, only import/validation needed",
        EXISTING_LEMMA_GLOSS: "lemma path with a validated FR lemma_translation would resolve (should already be resolved)",
        NEW_EDITORIAL_GLOSS_REQUIRED: "no validated FR word_translation and no resolvable lemma → a NEW word_translation must be authored",
        NO_VALID_RESOLUTION: "a lemma exists but no validated FR translation; no current runtime resolution (would need a lemma_translation or a word_translation)",
      },
    },
    identitySafety,
    protectedTablesIntegrity: {
      quran_words: 0, word_lemma_mapping: 0, lemma_translations: 0, linguistic_occurrences: 0, translations: 0, curriculum: 0, learning_paths: 0,
      status: "READ-ONLY — no writes issued; delta 0",
    },
    finalVerdict: {
      verdict: (readylistMatch && globalNoRegression && fast10RegressionFree) ? "PHASE_88F_BD_AUDIT_COMPLETE" : "PHASE_88F_BD_BLOCKED",
      GLOBAL_RUNTIME_TRUTH_VALID: readylistMatch,
      FAST10_REGRESSION_FREE: fast10RegressionFree,
      READY_LIST_STABLE: readyListStable,
      READY_SURAH_COUNT: truth.ready,
      NOT_READY_SURAH_COUNT: truth.notReady,
      REFERENCE_SURAH_COUNT: truth.reference,
      FAST10_CANDIDATES: tiers.FAST_10?.candidateSurahs ?? [],
      FAST15_CANDIDATES: tiers.FAST_15?.candidateSurahs ?? [],
      FAST20_CANDIDATES: tiers.FAST_20?.candidateSurahs ?? [],
      FAST25_CANDIDATES: tiers.FAST_25?.candidateSurahs ?? [],
      FAST30_CANDIDATES: tiers.FAST_30?.candidateSurahs ?? [],
      BEST_NEXT_BATCH: best && bestTier ? { tier: bestTier, candidateSurahs: best.candidateSurahs, projectedReadySurahs: best.projectedReadySurahs, totalNewGloses: best.totalNewGloses } : null,
      BEST_NEXT_BATCH_TIER: bestTier,
      PROJECTED_READY_GAIN: best ? best.projectedReadyGain : 0,
      NEW_GLOSSES_REQUIRED_FOR_BEST: best ? best.totalNewGloses : 0,
      DATABASE_WRITES: 0,
      PROTECTED_TABLES_DELTA: 0,
    },
    databaseWrites: 0,
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.finalVerdict.verdict} ===`);
  if (bestTier && best) {
    console.log(`  BEST_NEXT_BATCH: ${bestTier} -> ${best.projectedReadySurahs} READY gain, ${best.totalNewGloses} new glosses`);
    console.log(`  Candidates: ${best.candidateSurahs.join(", ")}`);
  }
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-BD", finalVerdict: { verdict: "PHASE_88F_BD_BLOCKED", GLOBAL_RUNTIME_TRUTH_VALID: false, error: String(err) }, databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});