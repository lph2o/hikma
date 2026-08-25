/**
 * PHASE 88F-Z — S46 AL-AHQAF RESOLUTION — PREFLIGHT / ABORT
 *
 * Verdict: PHASE_88F_Z_ABORTED_PREFLIGHT_INCONSISTENCY
 *
 * The 88F-Y audit produced structural classifications (32 SAFE lemmas,
 * 1 SAFE word_tr, 42 REVIEW word_tr) but did NOT provide editorial French
 * gloss text. All 32 lemma gloss entries are placeholders "(à écrire pour ...)".
 * The 42 review word translations have no gloss text. The 88F-Z prompt does
 * not supply gloss text either.
 *
 * Without editorial gloss text, the import cannot proceed. This script:
 * 1. Confirms the DB baseline (482/405/77, IN_PREPARATION).
 * 2. Validates the lemma_ids and word_ids from 88F-Y exist in DB.
 * 3. Lists exactly what editorial content is needed.
 * 4. Aborts with ZERO database writes.
 *
 * Next step: either re-run 88F-Y with editorial gloss production, or
 * provide the 32 lemma glosss + 42 word_tr glosss in an updated prompt.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-z-surah46-resolution.json";
const AUDIT_Y = "reports/phase-88f-y-surah46-audit.json";
const TARGET_SURAH = 46;
const PAGE_SIZE = 1000;

mkdirSync("reports", { recursive: true });

const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// Load audit Y
let auditY: Record<string, unknown>;
try {
  auditY = JSON.parse(readFileSync(AUDIT_Y, "utf-8"));
} catch {
  auditY = {};
}

type DbRow = Record<string, unknown>;
type AuditCandidate = { lemma_id?: string; lemma_arabic?: string; word_id?: string; arabic?: string; gloss?: string };
type MissingItem = { id: string; arabic: string; needsGloss: boolean; path: "lemma_translation" | "word_translation" };

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

async function run(): Promise<void> {
  const start = Date.now();
  const report: Record<string, unknown> = {
    phase: "88F-Z",
    verdict: "PHASE_88F_Z_ABORTED_PREFLIGHT_INCONSISTENCY",
    aborted: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
  };

  // ─── 0: validate audit Y ──────────────────────────────────────────────────
  console.log("=== 0. Validate 88F-Y report ===");
  const safeGlosses: (AuditCandidate & { lemma_id: string })[] = (auditY.safeGlossCandidates as AuditCandidate[] ?? [])
    .filter((c) => typeof c.lemma_id === "string") as (AuditCandidate & { lemma_id: string })[];
  const safeWordTr: (AuditCandidate & { word_id: string })[] = (auditY.safeWordTrCandidates as AuditCandidate[] ?? [])
    .filter((c) => typeof c.word_id === "string") as (AuditCandidate & { word_id: string })[];
  const reviewWordTr: (AuditCandidate & { word_id: string })[] = (auditY.reviewWordTrCandidates as AuditCandidate[] ?? [])
    .filter((c) => typeof c.word_id === "string") as (AuditCandidate & { word_id: string })[];

  const placeholderLemmas = safeGlosses.filter((c) => !c.gloss || c.gloss.startsWith("(à écrire"));
  const missingReviewGlosses = reviewWordTr.filter((c) => !c.gloss || c.gloss.startsWith("(à écrire"));

  console.log(`  safeGlossCandidates: ${safeGlosses.length} total, ${placeholderLemmas.length} placeholders`);
  console.log(`  safeWordTrCandidates: ${safeWordTr.length} total, ${safeWordTr.filter(c => c.gloss && !c.gloss.startsWith("(à écrire")).length} have gloss text`);
  console.log(`  reviewWordTrCandidates: ${reviewWordTr.length} total, ${missingReviewGlosses.length} missing gloss text`);

  const missingEditorial: MissingItem[] = [];
  for (const c of placeholderLemmas) missingEditorial.push({ id: c.lemma_id, arabic: c.lemma_arabic ?? "?", needsGloss: true, path: "lemma_translation" });
  for (const c of missingReviewGlosses) missingEditorial.push({ id: c.word_id, arabic: c.arabic ?? "?", needsGloss: true, path: "word_translation" });

  const expectedWrites = safeGlosses.length + safeWordTr.length + reviewWordTr.length;
  const readyWrites = safeGlosses.length - placeholderLemmas.length + safeWordTr.filter(c => c.gloss && !c.gloss.startsWith("(à écrire")).length;

  console.log(`  writes possible without editorial fabrication: ${readyWrites}/${expectedWrites}`);
  console.log(`  editorial items needing gloss text: ${missingEditorial.length}`);

  report.editorialGap = {
    totalWritesExpected: expectedWrites,
    writesReady: readyWrites,
    writesBlocked: missingEditorial.length,
    placeholderLemmaGlosses: placeholderLemmas.length,
    missingReviewWordTrGlosses: missingReviewGlosses.length,
    readySafeWordTr: safeWordTr.filter(c => c.gloss && !c.gloss.startsWith("(à écrire")).length,
    missingEditorial,
  };

  // ─── 1. connect & load ────────────────────────────────────────────────────
  console.log("\n=== 1. Connect, load DB ===");
  let envLoaded = false;
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); envLoaded = true; break; } catch { /* OK */ }
  }
  if (!envLoaded) console.warn("⚠ Could not load env file — using process.env");

  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  console.log("  connected ✓");

  const allWords = await selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id");
  const allAyahs = await selectAll<DbRow>(client, "ayahs", "id,surah_id");
  const allSurahs = await selectAll<DbRow>(client, "surahs", "id,number,name_transliteration");
  const allLemmas = await selectAll<DbRow>(client, "lemmas", "id,arabic");
  const allWlm = await selectAll<DbRow>(client, "word_lemma_mapping", "word_id,lemma_id");
  const allWordTr = await selectAll<DbRow>(client, "word_translations", "word_id,language,text,source_id,is_validated,validated_at");
  const allLemmaTr = await selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated,validated_at");
  const allOccs = await selectAll<DbRow>(client, "word_occurrences", "word_id,ayah_id");

  // Build indexes
  const ayahToSurah = new Map<string, string>();
  const surahToNumber = new Map<string, number>();
  for (const a of allAyahs) ayahToSurah.set(a.id as string, a.surah_id as string);
  for (const s of allSurahs) surahToNumber.set(s.id as string, s.number as number);

  const lemmaById = new Map<string, DbRow>();
  for (const l of allLemmas) lemmaById.set(l.id as string, l);

  // Compute FR union
  const frByWord = new Set<string>();
  const frWordTr = new Set<string>();
  const frLemmaTr = new Set<string>();
  for (const t of allWordTr) { if ((t.language === "fr") && (t.is_validated === true)) { frWordTr.add(t.word_id as string); frByWord.add(t.word_id as string); } }
  for (const t of allLemmaTr) { if ((t.language === "fr") && (t.is_validated === true)) { frLemmaTr.add(t.lemma_id as string); } }
  // Via WLM: word → lemma → lemma_translation FR
  for (const wl of allWlm) {
    if (frLemmaTr.has(wl.lemma_id as string) && !frByWord.has(wl.word_id as string)) {
      frByWord.add(wl.word_id as string);
    }
  }

  // Compute S46 forms
  const surahIds = new Set<string>();
  for (const s of allSurahs) { if (s.number === TARGET_SURAH) surahIds.add(s.id as string); }
  const ayahIds46 = new Set<string>();
  for (const a of allAyahs) { if (surahIds.has(a.surah_id as string)) ayahIds46.add(a.id as string); }
  const occIds46: string[] = [];
  const wordIds46 = new Set<string>();
  const occByWord46 = new Map<string, number>();
  for (const oc of allOccs) {
    if (ayahIds46.has(oc.ayah_id as string)) {
      occIds46.push(oc.id as string);
      wordIds46.add(oc.word_id as string);
      occByWord46.set(oc.word_id as string, (occByWord46.get(oc.word_id as string) ?? 0) + 1);
    }
  }
  const totalForms46 = wordIds46.size;
  const covered46 = [...wordIds46].filter((w) => frByWord.has(w)).length;
  const missing46 = totalForms46 - covered46;
  const totalOccs46 = occIds46.length;

  console.log(`  S46 baseline: ${covered46}/${totalForms46} (${ROUND(covered46 / totalForms46 * 100, 1)}%)`);

  // Global
  const globalCovered = frByWord.size;
  const globalTotal = allWords.length;
  // (skipping full classifySurahReadiness here — this is a preflight, not an audit)

  report.baseline = {
    surah46: {
      totalForms: totalForms46,
      coveredForms: covered46,
      missingForms: missing46,
      coveragePct: ROUND(covered46 / totalForms46, 4),
      totalOccurrences: totalOccs46,
      readiness: covered46 === totalForms46 ? "READY" : "IN_PREPARATION",
    },
    global: {
      frUnionWordIds: globalCovered,
      totalQuranWords: globalTotal,
      frCoveragePct: ROUND(globalCovered / globalTotal, 4),
    },
  };

  // ─── 2. Validate IDs from audit Y ─────────────────────────────────────────
  console.log("\n=== 2. Validate audit Y IDs in DB ===");
  const validations: { type: string; id: string; arabic: string; inDb: boolean; existingFr: boolean }[] = [];

  // Lemma checks
  const lemmaTrMap = new Map<string, string>(); // lemma_id → text (existing French)
  for (const t of allLemmaTr) {
    if (t.language === "fr" && t.is_validated === true && t.source_id) {
      lemmaTrMap.set(t.lemma_id as string, t.text as string);
    }
  }

  for (const c of safeGlosses) {
    const lemma = lemmaById.get(c.lemma_id);
    const inDb = !!lemma;
    const existingFr = lemmaTrMap.has(c.lemma_id);
    validations.push({
      type: "lemma_translation",
      id: c.lemma_id,
      arabic: c.lemma_arabic ?? (lemma ? lemma.arabic as string : "?"),
      inDb,
      existingFr,
    });
    if (!inDb) console.log(`  ⚠ LEMMA MISSING in DB: ${c.lemma_id} (${c.lemma_arabic})`);
    if (existingFr) console.log(`  ⚠ LEMMA HAS EXISTING FR: ${c.lemma_id} (${c.lemma_arabic}) → "${lemmaTrMap.get(c.lemma_id)}"`);
  }

  // Word checks
  const wordMap = new Map<string, DbRow>();
  for (const w of allWords) wordMap.set(w.id as string, w);
  const wordTrMap = new Map<string, string>();
  for (const t of allWordTr) {
    if (t.language === "fr" && t.is_validated === true) {
      wordTrMap.set(t.word_id as string, t.text as string);
    }
  }

  const allWordCandidates = [...safeWordTr, ...reviewWordTr];
  for (const c of allWordCandidates) {
    const word = wordMap.get(c.word_id);
    const inDb = !!word;
    const existingFr = wordTrMap.has(c.word_id);
    validations.push({
      type: "word_translation",
      id: c.word_id,
      arabic: c.arabic ?? (word ? word.arabic as string : "?"),
      inDb,
      existingFr,
    });
    if (!inDb) console.log(`  ⚠ WORD MISSING in DB: ${c.word_id} (${c.arabic ?? "?"})`);
    if (existingFr) console.log(`  ⚠ WORD HAS EXISTING FR: ${c.word_id} (${c.arabic}) → "${wordTrMap.get(c.word_id)}"`);
  }

  const missingIds = validations.filter(v => !v.inDb);
  const existingFrIds = validations.filter(v => v.existingFr);

  report.idValidation = {
    total: validations.length,
    missingFromDb: missingIds.length,
    existingFrenchTranslations: existingFrIds.length,
    missingItems: missingIds.length > 0 ? missingIds.map(v => ({ type: v.type, id: v.id, arabic: v.arabic })) : [],
    existingFrItems: existingFrIds.length > 0 ? existingFrIds.map(v => ({
      type: v.type, id: v.id, arabic: v.arabic,
      existingText: v.type === "lemma_translation" ? lemmaTrMap.get(v.id) : wordTrMap.get(v.id),
    })) : [],
  };

  if (missingIds.length > 0) {
    console.log(`\n  ❌ ${missingIds.length} IDs missing from DB — aborting.`);
  }
  if (existingFrIds.length > 0) {
    console.log(`  ⚠ ${existingFrIds.length} items already have French translations — CONFLICT risk.`);
  }

  // ─── 3. Final verdict ─────────────────────────────────────────────────────
  const blockerCount = placeholderLemmas.length + missingReviewGlosses.length;
  const cannotProceed = blockerCount > 0 || missingIds.length > 0;

  console.log("\n=== 3. Verdict ===");
  if (cannotProceed) {
    console.log("  ❌ PHASE_88F_Z_ABORTED_PREFLIGHT_INCONSISTENCY");
    if (blockerCount > 0) {
      console.log(`     ${blockerCount} editorial glosses are missing from 88F-Y report`);
      console.log(`     → ${placeholderLemmas.length} lemma_translations need FR text`);
      console.log(`     → ${missingReviewGlosses.length} word_translations need FR text`);
    }
    if (missingIds.length > 0) {
      console.log(`     ${missingIds.length} IDs not found in DB`);
    }
    console.log("     → Re-run 88F-Y with editorial gloss production, or");
    console.log("       supply gloss texts in an updated 88F-Z prompt.");
  } else {
    console.log("  ✅ All glosses present, all IDs valid — ready for APPLY.");
    report.verdict = "PHASE_88F_Z_READY_FOR_APPLY";
  }

  // ─── 4. Write report ──────────────────────────────────────────────────────
  report.durationSeconds = ROUND((Date.now() - start) / 1000, 2);
  report.needsEditorial = {
    lemmaGlossesNeeded: placeholderLemmas.map(c => ({ lemma_id: c.lemma_id, lemma_arabic: c.lemma_arabic, placeholder: c.gloss })),
    wordTranslationsNeeded: missingReviewGlosses.map(c => ({ word_id: c.word_id, arabic: c.arabic })),
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`\n  report → ${OUTPUT}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  const r = {
    phase: "88F-Z",
    verdict: "PHASE_88F_Z_FATAL_ERROR",
    aborted: true,
    databaseWrites: 0,
    error: String(err),
    timestamp: new Date().toISOString(),
  };
  writeFileSync(OUTPUT, JSON.stringify(r, null, 2));
  process.exit(1);
});