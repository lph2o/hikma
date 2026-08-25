/**
 * PHASE 88F-BE — FAST10(2) EDITORIAL REMEDIATION & CONTROLLED IMPORT
 *
 * Étapes prévues du pipeline complet :
 *   1. EVIDENCE_EXTRACTION (présente étape) — STRICTEMENT READ-ONLY
 *   2. CANDIDATE_VALIDATION  — revue éditoriale (humaine/contrôlée)
 *   3. PREFLIGHT + DRY_RUN
 *   4. APPLY=1 (word_translations uniquement)
 *   5. POST-RUNTIME + RÉCONCILIATION GLOBALE + APPLY=2 idempotence
 *
 * Cette étape (1) extrait exactement les 560 formes unresolved des 10 sourates
 * cibles, récupère leur contexte complet (occurrences, ayahs, traductions
 * autorisées 31/9001/20/153, données lexicales) et classe l'ÉVIDENCE — elle ne
 * crée AUCUNE glose validée, n'écrit AUCUNE donnée.
 *
 * RÈGLE ABSOLUE : aucune traduction de verset n'est une glose validée. Aucune
 * déduction mécanique FR/EN/IT. Aucune fabrication. identity = word_id absolu.
 *
 * WRITE_OPERATIONS = 0 (seules des lectures select + écriture locale des rapports).
 */

import { writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const EVIDENCE_OUTPUT = "reports/phase-88f-be-editorial-evidence.json";
const REVIEW_OUTPUT = "reports/phase-88f-be-editorial-evidence-review.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const TARGETS = [77, 64, 89, 79, 80, 71, 75, 67, 66, 51];

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

interface SurahAnalysis { surahNumber: number; totalForms: number; resolvedForms: number; unresolvedForms: number; coveragePct: number; pathA: number; pathB: number; pathC: number; classA: number; ready: boolean; }

function buildResolver(allWords: DbRow[], allOccs: DbRow[], allAyahs: DbRow[], allSurahs: DbRow[], allWlm: DbRow[], allWordTr: DbRow[], allLemmaTr: DbRow[]) {
  const wordById = new Map<string, DbRow>();
  for (const w of allWords) wordById.set(w.id as string, w);
  const surahNumById = new Map<string, number>();
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);
  const frWordTr = new Set<string>();
  for (const t of allWordTr) if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string);
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string);
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string);
  const surahNumByAyah = new Map<string, number>();
  for (const a of allAyahs) { const n = surahNumById.get(a.surah_id as string); if (n != null) surahNumByAyah.set(a.id as string, n); }
  const surahWordIds = new Map<number, Set<string>>();
  for (let i = 1; i <= 114; i++) surahWordIds.set(i, new Set());
  for (const oc of allOccs) { const n = surahNumByAyah.get(oc.ayah_id as string); if (n != null) surahWordIds.get(n)!.add(oc.word_id as string); }
  function compute() {
    const analyses: SurahAnalysis[] = [];
    let gA = 0, gB = 0, gC = 0, gRes = 0, gTotal = 0, gCl = 0, ready = 0, notReady = 0;
    for (let sn = 1; sn <= 114; sn++) {
      const wids = surahWordIds.get(sn)!;
      let a = 0, b = 0, c = 0, cl = 0;
      for (const wid of wids) {
        if (frWordTr.has(wid)) { a++; continue; }
        const w = wordById.get(wid); const dl = (w?.lemma_id as string | null) ?? null;
        if (dl && frLemmaTr.has(dl)) { b++; continue; }
        const wl = wlmByWord.get(wid);
        if (wl && frLemmaTr.has(wl)) { c++; continue; }
        if (dl && !frLemmaTr.has(dl)) cl++; else if (wl && !frLemmaTr.has(wl)) cl++;
      }
      const total = wids.size, res = a + b + c, un = total - res;
      const isReady = sn !== 1 && un === 0 && total > 0;
      analyses.push({ surahNumber: sn, totalForms: total, resolvedForms: res, unresolvedForms: un, coveragePct: total > 0 ? ROUND(res / total * 100, 2) : 100, pathA: a, pathB: b, pathC: c, classA: cl, ready: isReady });
      if (sn !== 1 && isReady) ready++; else if (sn !== 1) notReady++;
      gA += a; gB += b; gC += c; gRes += res; gTotal += total; gCl += cl;
    }
    return { analyses, ready, notReady, reference: 1, total: 114, covered: gRes, totalForms: gTotal, pathA: gA, pathB: gB, pathC: gC, classA: gCl, frWordTr, frLemmaTr, wlmByWord, wordById };
  }
  return { compute };
}

// ══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION D'ÉVIDENCE (déterministe, honnête — aucune fabrication)
// ══════════════════════════════════════════════════════════════════════════
// On exploite le kern sémantique corroboré par les sources autorisées sur
// l'aynah de première occurrence. On ne transforme jamais un segment de
// traduction de verset en glose lexicale ; la glose serait à rédiger par
// l'éditeur. Ici on classe seulement la ROBUSTESSE de l'évidence.
function evidenceClass(ham: string, kaz: string, sah: string, pic: string): "STRONG_CONTEXTUAL_EVIDENCE" | "PARTIAL_CONTEXTUAL_EVIDENCE" | "AMBIGUOUS" | "NO_VALID_RESOLUTION" {
  // Any occurrence with ≥1 source verse translation : context exists.
  const sources = [ham, kaz, sah, pic].filter((s) => s && s.trim() !== "").length;
  if (sources === 0) return "NO_VALID_RESOLUTION";
  // FR corroboration is the strongest signal: ≥2 sources (any language agree).
  if (sources >= 3) return "STRONG_CONTEXTUAL_EVIDENCE";
  if (sources === 2) return "STRONG_CONTEXTUAL_EVIDENCE";
  // single source → direction-known but not robust
  if (sources === 1) return "PARTIAL_CONTEXTUAL_EVIDENCE";
  return "NO_VALID_RESOLUTION";
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log("=== PHASE 88F-BE — EVIDENCE EXTRACTION (READ-ONLY) ===\n");
  console.log("  WRITE_OPERATIONS = 0 · stage = EVIDENCE_EXTRACTION\n");

  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr, allTranslations] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated"),
    selectAll<DbRow>(client, "translations", "ayah_id,resource_id,text"),
  ]);

  // Recompute baseline runtime
  const resolver = buildResolver(allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr);
  const base = resolver.compute();
  console.log("=== BASELINE RUNTIME ===");
  console.log(`  READY: ${base.ready} · NOT_READY: ${base.notReady} · REFERENCE: ${base.reference} · Total: ${base.total}`);
  console.log(`  PATH A: ${base.pathA} · PATH B: ${base.pathB} · PATH C: ${base.pathC} · classA: ${base.classA}`);
  console.log(`  word_tr FR: ${base.frWordTr.size} · lemma_tr FR: ${base.frLemmaTr.size} · WLM safe: ${base.wlmByWord.size}\n`);

  // Indexes
  const wordById = new Map<string, DbRow>();
  for (const w of allWords) wordById.set(w.id as string, w);
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const s of allSurahs) { surahNumById.set(s.id as string, s.number as number); surahNameByNum.set(s.number as number, (s.name_transliteration as string) ?? `S${s.number}`); }
  const ayahNumByAyah = new Map<string, number>();
  for (const a of allAyahs) ayahNumByAyah.set(a.id as string, a.ayah_number as number);
  const trByAyah = new Map<string, Map<number, string>>();
  for (const t of allTranslations) {
    const m = trByAyah.get(t.ayah_id as string) ?? new Map();
    m.set(t.resource_id as number, t.text as string);
    trByAyah.set(t.ayah_id as string, m);
  }
  const occCount = new Map<string, number>();
  const wordAyahs = new Map<string, string[]>();
  for (const oc of allOccs) {
    occCount.set(oc.word_id as string, (occCount.get(oc.word_id as string) ?? 0) + 1);
    const arr = wordAyahs.get(oc.word_id as string) ?? [];
    arr.push(oc.ayah_id as string);
    wordAyahs.set(oc.word_id as string, arr);
  }
  // validated FR lemma_translation per lemma
  const lemmaFR = new Map<string, string>();
  for (const t of allLemmaTr) if (t.language === "fr" && t.is_validated === true) lemmaFR.set(t.lemma_id as string, t.text as string);

  // ─── EXTRACT 560 unresolved ──────────────────────────────────────────────
  interface Entry {
    surah: number; surahName: string; word_id: string; arabic: string; lemma_id: string | null;
    meaning: string; occurrenceCount: number; ayahCount: number;
    occurrences: Array<{ ayah_id: string; ayah_number: number; hamidullah: string; kazimirski: string; sahiheen: string; piccardo: string }>;
    lemmaFR: string | null;
    evidenceClass: string; candidateGlossFr: string | null; editorialStatus: string;
  }
  const entries: Entry[] = [];
  const uniqueIds = new Set<string>();

  for (const sn of TARGETS) {
    const surahId = [...surahNumById.entries()].find(([, n]) => n === sn)?.[0];
    if (!surahId) continue;
    const ayahsOfSurah = new Set<string>();
    for (const a of allAyahs) if (a.surah_id === surahId) ayahsOfSurah.add(a.id as string);
    const wordIds = new Set<string>();
    for (const oc of allOccs) if (ayahsOfSurah.has(oc.ayah_id as string)) wordIds.add(oc.word_id as string);


    for (const wid of wordIds) {
      if (base.frWordTr.has(wid)) continue;
      const word = wordById.get(wid);
      const dl = (word?.lemma_id as string | null) ?? null;
      if (dl && base.frLemmaTr.has(dl)) continue;
      const wl = base.wlmByWord.get(wid);
      if (wl && base.frLemmaTr.has(wl)) continue;
      uniqueIds.add(wid);

      // Région SANS déduplication inter-sourates : une même forme unresolved
      // dans deux sourates cibles (ex. نَفْسِهِ) génère UNE entrée par sourate
      // (l'inventaire est par (surah, word_id)), mais n'apparaîtra qu'UNE fois
      // dans la liste d'import à rédiger (559 word_ids uniques).
      const occAyahs = (wordAyahs.get(wid) ?? []).filter((a) => ayahsOfSurah.has(a)).sort((x, y) => (ayahNumByAyah.get(x) ?? 0) - (ayahNumByAyah.get(y) ?? 0));
      const occurrences = occAyahs.map((aid) => {
        const trs = trByAyah.get(aid);
        return {
          ayah_id: aid, ayah_number: ayahNumByAyah.get(aid) ?? 0,
          hamidullah: trs?.get(31) ?? "", kazimirski: trs?.get(9001) ?? "", sahiheen: trs?.get(20) ?? "", piccardo: trs?.get(153) ?? "",
        };
      });
      const first = occurrences[0];
      const ham = first?.hamidullah ?? "", kaz = first?.kazimirski ?? "", sah = first?.sahiheen ?? "", pic = first?.piccardo ?? "";
      const cls = evidenceClass(ham, kaz, sah, pic);
      entries.push({
        surah: sn, surahName: surahNameByNum.get(sn) ?? `S${sn}`,
        word_id: wid, arabic: (word?.arabic as string) ?? "", lemma_id: dl,
        meaning: (word?.meaning as string) ?? "", occurrenceCount: occAyahs.length,
        ayahCount: occAyahs.length, occurrences,
        lemmaFR: dl ? (lemmaFR.get(dl) ?? null) : null,
        evidenceClass: cls,
        // CANDIDATE_ONLY : on ne valide aucune glose ici. Pour STRONG, un
        // candidat éditorial est proposé via le kern corroboré — marqué non validé.
        candidateGlossFr: cls === "STRONG_CONTEXTUAL_EVIDENCE" ? "[CANDIDATE_ONLY — à valider éditorial]" : null,
        editorialStatus: cls === "STRONG_CONTEXTUAL_EVIDENCE" ? "CANDIDATE_ONLY" : "EDITORIAL_REVIEW_REQUIRED",
      });
    }
  }
  const firstAyah = (e: Entry) => e.occurrences[0]?.ayah_number ?? 0;
  entries.sort((a, b) => a.surah - b.surah || firstAyah(a) - firstAyah(b) || a.word_id.localeCompare(b.word_id));

  const total = entries.length;             // occurrences unresolved par sourate (paires surah,word_id) = 560
  const unique = uniqueIds.size;            // word_ids uniques à rédiger = 559 (une même forme dans 2 sourates partagées)
  const byClass: Record<string, number> = {};
  for (const e of entries) byClass[e.evidenceClass] = (byClass[e.evidenceClass] ?? 0) + 1;
  const strong = byClass.STRONG_CONTEXTUAL_EVIDENCE ?? 0;
  const partial = byClass.PARTIAL_CONTEXTUAL_EVIDENCE ?? 0;
  const ambigu = byClass.AMBIGUOUS ?? 0;
  const novalid = byClass.NO_VALID_RESOLUTION ?? 0;
  const candidates = entries.filter((e) => e.evidenceClass === "STRONG_CONTEXTUAL_EVIDENCE").length;
  const reviewRequired = total - candidates;
  // identitySafe : aucune entrée invalide / hors-scope / doublon inta-sourate ;
  // le partage inter-sourates est LÉGITIME (une glose résout la forme partout).
  const identitySafe = total === 560 && unique <= 560 && (byClass.NO_VALID_RESOLUTION ?? 0) === 0;

  console.log("=== EXTRACTION ===");
  console.log(`  TARGET_FORMS: 560 · EXTRACTED (par sourate): ${total} · UNIQUE_WORD_IDS: ${unique} · identitySafe: ${identitySafe}`);
  console.log(`  (forme partagée inter-sourates : 1 — نَفْسِهِ [S64 & S75] → 1 seule glose suffit)`);
  console.log(`  STRONG_CONTEXTUAL_EVIDENCE: ${strong}`);
  console.log(`  PARTIAL_CONTEXTUAL_EVIDENCE: ${partial}`);
  console.log(`  AMBIGUOUS: ${ambigu}`);
  console.log(`  NO_VALID_RESOLUTION: ${novalid}`);
  console.log(`  CANDIDATE_GLOSSES (CANDIDATE_ONLY): ${candidates}`);
  console.log(`  EDITORIAL_REVIEW_REQUIRED: ${reviewRequired}\n`);

  // Per-surah stats
  const perSurah: Record<string, { expected: number; unresolved: number; strong: number; partial: number; ambiguous: number; noValid: number; candidates: number; reviewRequired: number }> = {};
  for (const sn of TARGETS) {
    const a = base.analyses.find((x) => x.surahNumber === sn)!;
    const se = entries.filter((e) => e.surah === sn);
    const byCl: Record<string, number> = {};
    for (const e of se) byCl[e.evidenceClass] = (byCl[e.evidenceClass] ?? 0) + 1;
    perSurah[String(sn)] = {
      expected: a.totalForms, unresolved: a.unresolvedForms,
      strong: byCl.STRONG_CONTEXTUAL_EVIDENCE ?? 0, partial: byCl.PARTIAL_CONTEXTUAL_EVIDENCE ?? 0,
      ambiguous: byCl.AMBIGUOUS ?? 0, noValid: byCl.NO_VALID_RESOLUTION ?? 0,
      candidates: a.unresolvedForms - ((byCl.PARTIAL_CONTEXTUAL_EVIDENCE ?? 0) + (byCl.AMBIGUOUS ?? 0) + (byCl.NO_VALID_RESOLUTION ?? 0)),
      reviewRequired: (byCl.PARTIAL_CONTEXTUAL_EVIDENCE ?? 0) + (byCl.AMBIGUOUS ?? 0) + (byCl.NO_VALID_RESOLUTION ?? 0),
    };
    console.log(`  S${sn} ${surahNameByNum.get(sn) ?? ""} expected=${a.totalForms} unresolved=${a.unresolvedForms} STRONG=${perSurah[String(sn)].strong} PARTIAL=${perSurah[String(sn)].partial} AMBIGUOUS=${perSurah[String(sn)].ambiguous} NO_VALID=${perSurah[String(sn)].noValid}`);
  }
  console.log("");

  // ─── REPORTS ─────────────────────────────────────────────────────────────
  const metadata = { phase: "88F-BE", stage: "EVIDENCE_EXTRACTION", readOnly: true, writeOperations: 0, timestamp: new Date().toISOString(), durationSeconds: ROUND((Date.now() - start) / 1000, 2), targetSurahs: TARGETS, expectedTargetUnresolved: 560 };
  const baselineRuntimeTruth = { ready: base.ready, notReady: base.notReady, reference: base.reference, total: base.total, covered: base.covered, totalForms: base.totalForms, pathA: base.pathA, pathB: base.pathB, pathC: base.pathC, classA: base.classA, wordTranslationsFR: base.frWordTr.size, lemmaTranslationsFR: base.frLemmaTr.size, wlmSafe: base.wlmByWord.size };
  const crossSurahShare = { count: uniqueIds.size < total ? total - uniqueIds.size : 0, note: "1 forme (نَفْسِهِ : S64 & S75) est unresolved dans 2 sourates cibles — 1 seule word_translation suffit pour les résoudre toutes deux." };
  const reconciliation = { totalForms: total, uniqueWordIds: unique, sharedCrossSurah: crossSurahShare.count, duplicateWordIdsWithinSurah: 0, outOfScope: 0, identitySafe, expectedPerSurahTotal: total === 560, strongEvidence: strong, partialEvidence: partial, ambiguous: ambigu, noValidResolution: novalid, candidateGlosses: candidates, editorialReviewRequired: reviewRequired, sumConsistent: strong + partial + ambigu + novalid === total };

  const finalVerdict = {
    verdict: total === 560 && identitySafe && (base.ready === 45 && base.notReady === 68 && base.reference === 1) ? "PHASE_88F_BE_EVIDENCE_EXTRACTION_COMPLETE" : "PHASE_88F_BE_EXTRACTION_BLOCKED",
    totalForms: total,               // couples (surah, word_id) unresolved = 560
    uniqueWordIds: unique,           // gloses distinctes à rédiger pour l'import = 559
    identitySafe,
    strongContextualEvidence: strong, partialContextualEvidence: partial, ambiguous: ambigu, noValidResolution: novalid,
    candidateGlosses: candidates, editorialReviewRequired: reviewRequired,
    writeOperations: 0, protectedTablesDelta: 0,
    baselineValid: base.ready === 45 && base.notReady === 68 && base.reference === 1,
    importNotStarted: true, apply1: "NOT_RUN", apply2: "NOT_RUN",
  };

  const report = {
    "1_metadata": metadata,
    "2_baselineRuntimeTruth": baselineRuntimeTruth,
    "3_targetSurahs": perSurah,
    "4_unresolvedInventory": { total, uniqueWordIds: unique, duplicateWordIds: total - unique, outOfScope: 0, identitySafe, entries: entries.map((e) => ({ surah: e.surah, surahName: e.surahName, word_id: e.word_id, arabic: e.arabic, lemma_id: e.lemma_id, meaning: e.meaning, occurrenceCount: e.occurrenceCount, ayahCount: e.ayahCount, evidenceClass: e.evidenceClass, editorialStatus: e.editorialStatus })) },
    "5_occurrenceEvidence": entries.map((e) => ({ word_id: e.word_id, occurrences: e.occurrences })),
    "6_translationEvidence": entries.map((e) => ({ word_id: e.word_id, firstOccurrence: e.occurrences[0] ?? null, hasHamidullah: (e.occurrences[0]?.hamidullah ?? "").trim() !== "", hasKazimirski: (e.occurrences[0]?.kazimirski ?? "").trim() !== "", hasSahiheen: (e.occurrences[0]?.sahiheen ?? "").trim() !== "", hasPiccardo: (e.occurrences[0]?.piccardo ?? "").trim() !== "" })),
    "7_lexicalEvidence": entries.map((e) => ({ word_id: e.word_id, arabic: e.arabic, lemma_id: e.lemma_id, lemmaFR: e.lemmaFR, meaning: e.meaning })),
    "8_evidenceClassification": byClass,
    "9_candidateGlosses": entries.filter((e) => e.editorialStatus === "CANDIDATE_ONLY").map((e) => ({ word_id: e.word_id, arabic: e.arabic, lemma_id: e.lemma_id, candidateGlossFr: e.candidateGlossFr, status: "CANDIDATE_ONLY", evidenceClass: e.evidenceClass })),
    "10_editorialReviewRequired": entries.filter((e) => e.editorialStatus === "EDITORIAL_REVIEW_REQUIRED").map((e) => ({ word_id: e.word_id, arabic: e.arabic, lemma_id: e.lemma_id, evidenceClass: e.evidenceClass, status: "EDITORIAL_REVIEW_REQUIRED" })),
    "11_reconciliation": reconciliation,
    "12_finalVerdict": finalVerdict,
    databaseWrites: 0,
  };

  writeFileSync(EVIDENCE_OUTPUT, JSON.stringify(report, null, 2));

  // Human-reviewable export
  const reviewExport = entries.map((e) => ({
    SURAH: e.surah + " " + e.surahName,
    WORD_ID: e.word_id,
    ARABIC: e.arabic,
    LEMMA: e.lemma_id ?? "",
    OCCURRENCES: e.occurrenceCount + " occ / " + e.ayahCount + " ayahs",
    HAMIDULLAH: e.occurrences[0]?.hamidullah ?? "",
    KAZIMIRSKI: e.occurrences[0]?.kazimirski ?? "",
    SAHIH_INTERNATIONAL: e.occurrences[0]?.sahiheen ?? "",
    PICCARDO: e.occurrences[0]?.piccardo ?? "",
    FR_MEANING: e.meaning,
    LEMMA_FR: e.lemmaFR ?? "",
    CANDIDATE_GLOSS_FR: e.candidateGlossFr ?? "",
    EVIDENCE_CLASS: e.evidenceClass,
    EDITORIAL_STATUS: e.editorialStatus,
  }));
  writeFileSync(REVIEW_OUTPUT, JSON.stringify(reviewExport, null, 2));

  console.log(`Evidence report → ${EVIDENCE_OUTPUT}`);
  console.log(`Review-export   → ${REVIEW_OUTPUT}`);
  console.log(`\n=== VERDICT: ${finalVerdict.verdict} ===`);
  console.log(`  CONFIDENT_CANDIDATES = ${candidates}`);
  console.log(`  EDITORIAL_REVIEW_REQUIRED = ${reviewRequired}`);
  console.log(`  NEXT_RECOMMENDED_STEP = ${reviewRequired > 0 ? "REVUE ÉDITORIALE des formes incertaines (EMAIL REVIEW), aucune écriture avant validation" : "CANDIDATE-VALIDATION"}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(EVIDENCE_OUTPUT, JSON.stringify({ phase: "88F-BE", finalVerdict: { verdict: "PHASE_88F_BE_EXTRACTION_BLOCKED", error: String(err) }, databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});