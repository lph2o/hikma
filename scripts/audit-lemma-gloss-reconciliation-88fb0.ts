/* eslint-disable @typescript-eslint/no-explicit-any -- script CLI one-shot legacy : types Supabase pragmatiques */
/**
 * Phase 88F-B0 — SAFE Lemma Gloss Reconciliation & Import Readiness
 * READ-ONLY STRICT — 0 DB writes.
 *
 * Loads 30 SAFE proposals from 88F-A. For each:
 *   1. Verifies lemma_id exists in `lemmas`
 *   2. Checks for existing `lemma_translations` (duplicate/conflict)
 *   3. Recalculates true gain (deduplicated new FR forms + correct occurrences)
 *   4. Simulates surah readiness impact
 *   5. Classifies: READY_FOR_IMPORT | EXISTING_SAME | CONFLICT_REVIEW | EDITORIAL_REVIEW | DATA_REVIEW
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

type SafeProposal = {
  rank: number; lemmaId: string; arabic: string; masaqGlossEn: string | null;
  proposedFrGloss: string; classification: string; rationale: string;
  formsWithFr: number; formsWithoutFr: number;
  newFormsCovered: number; newOccurrencesCovered: number;
  forms: number; occs: number; surahs: number;
};

type ReconciliationEntry = {
  rank: number; lemmaId: string; arabic: string; proposedFrGloss: string;
  status: "READY_FOR_IMPORT" | "EXISTING_SAME" | "CONFLICT_REVIEW" | "EDITORIAL_REVIEW" | "DATA_REVIEW" | "DO_NOT_IMPORT";
  lemmaExists: boolean;
  existingLtCount: number;
  existingLtTexts: string[];
  hasMismatch: boolean;
  formsAssociated: number;
  trueNewForms: number;
  trueNewOccs: number;
  affectedSurahNums: number[];
  issues: string[];
};

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88F-B0 — SAFE LEMMA GLOSS RECONCILIATION (READ-ONLY) ===\n");

  // ─── Load 30 SAFE proposals ──────────────────────────────────────────────
  let report88fa: any;
  try {
    report88fa = JSON.parse(readFileSync("reports/phase-88f-a-top100-editorial-proposals.json", "utf-8"));
  } catch {
    console.log("ERROR: 88F-A report not found. Run Phase 88F-A first.");
    process.exit(1);
  }

  const safeProposals: SafeProposal[] = report88fa.safeProposals;
  console.log(`Loaded ${safeProposals.length} SAFE proposals from 88F-A.\n`);

  // ─── Load reference data ──────────────────────────────────────────────────
  console.log("→ Loading reference data…");
  const lemmas = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  const lemmaById = new Map(lemmas.map(l => [l.id, l]));

  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  const wtRows = await selectAll<{ word_id: string; text: string; language: string; is_validated: boolean; source_id: string }>(client, "word_translations", "word_id, text, language, is_validated, source_id");
  const ltRows = await selectAll<{ lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string }>(client, "lemma_translations", "lemma_id, text, language, is_validated, source_id");

  // Get Hikma source ID
  const { data: srcData } = await client.from("sources").select("id").eq("name", "Hikma — lexique éditorial").limit(1);
  const hikmaSourceId = (srcData?.[0] as any)?.id as string;
  if (!hikmaSourceId) throw new Error("Hikma source not found.");

  // Build lookups
  const wordById = new Map(wordRows.map(w => [w.id, w]));

  // word_translations FR validated (Hikma only)
  const wtFrSet = new Set(wtRows.filter(r => r.language === "fr" && r.is_validated).map(r => r.word_id));

  // lemma_translations FR (all, for existing check)
  const ltByLemma = new Map<string, Array<{ text: string; is_validated: boolean; source_id: string }>>();
  for (const r of ltRows) {
    if (r.language !== "fr") continue;
    const arr = ltByLemma.get(r.lemma_id) ?? [];
    arr.push({ text: r.text, is_validated: r.is_validated, source_id: r.source_id });
    ltByLemma.set(r.lemma_id, arr);
  }

  // Final lemma resolution (direct + WLM + MASAQ indirect)
  const finalLemma = new Map<string, string>();
  for (const w of wordRows) { if (w.lemma_id) finalLemma.set(w.id, w.lemma_id); }
  for (const m of wlmRows) { if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id); }

  // MASAQ indirect
  const occToWord = new Map<string, string>();
  const occAyahMap = new Map<string, string>(); // occ_id → ayah_id
  const occLightAll = await selectAll<{ id: string; word_id: string; ayah_id: string }>(client, "word_occurrences", "id, word_id, ayah_id");
  for (const o of occLightAll) { occToWord.set(o.id, o.word_id); occAyahMap.set(o.id, o.ayah_id); }

  const masaqRows = await selectAll<{ word_occurrence_id: string; hikma_lemma_id: string | null }>(client, "linguistic_occurrences", "word_occurrence_id, hikma_lemma_id");
  for (const m of masaqRows) {
    if (!m.hikma_lemma_id) continue;
    const wid = occToWord.get(m.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, m.hikma_lemma_id);
  }

  console.log(`  lemmas: ${lemmas.length} | words: ${wordRows.length} | resolved: ${finalLemma.size} | wt_fr: ${wtFrSet.size} | lt: ${ltRows.length}`);

  // ─── Occurrences per word (for gain calculation) ─────────────────────────
  const occCountByWord = new Map<string, number>();
  for (const o of occLightAll) {
    occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);
  }

  // Surah lookup
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const surahRows = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const surahNameByNum = new Map(surahRows.map(s => [s.number, s.name_transliteration ?? `Surah ${s.number}`]));
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));

  // Formes par sourate (using occAyahMap for correctness)
  const surahForms = new Map<number, Set<string>>();
  for (const o of occLightAll) {
    const sid = occAyahMap.get(o.id);
    const sn = sid ? ayahToSurah.get(sid) : undefined;
    const snum = sn ? surahNumById.get(sn) : undefined;
    if (snum === undefined) continue;
    let set = surahForms.get(snum);
    if (!set) { set = new Set(); surahForms.set(snum, set); }
    set.add(o.word_id);
  }

  // ─── Reconcile each proposal ─────────────────────────────────────────────
  console.log("\n→ Reconciling 30 SAFE proposals…\n");

  const entries: ReconciliationEntry[] = [];
  let totalTrueNewForms = 0;
  let totalTrueNewOccs = 0;

  for (const p of safeProposals) {
    const entry: ReconciliationEntry = {
      rank: p.rank,
      lemmaId: p.lemmaId,
      arabic: p.arabic,
      proposedFrGloss: p.proposedFrGloss,
      status: "READY_FOR_IMPORT", // default, may change
      lemmaExists: false,
      existingLtCount: 0,
      existingLtTexts: [],
      hasMismatch: false,
      formsAssociated: 0,
      trueNewForms: 0,
      trueNewOccs: 0,
      affectedSurahNums: [],
      issues: [],
    };

    // 1. Lemma exists?
    const lemma = lemmaById.get(p.lemmaId);
    if (!lemma) {
      entry.status = "DATA_REVIEW";
      entry.lemmaExists = false;
      entry.issues.push(`lemma_id ${p.lemmaId.slice(0, 8)}… not found in lemmas table`);
      entries.push(entry);
      continue;
    }
    entry.lemmaExists = true;

    // 2. Existing lemma_translations for Hikma source?
    const existing = ltByLemma.get(p.lemmaId) ?? [];
    const existingHikma = existing.filter(e => e.source_id === hikmaSourceId);
    entry.existingLtCount = existingHikma.length;
    entry.existingLtTexts = existingHikma.map(e => e.text);

    if (existingHikma.length > 0) {
      const sameText = existingHikma.some(e => e.text === p.proposedFrGloss);
      if (sameText) {
        entry.status = "EXISTING_SAME";
        entry.issues.push(`lemma_translation already exists with same text: "${p.proposedFrGloss}"`);
      } else {
        entry.status = "CONFLICT_REVIEW";
        entry.hasMismatch = true;
        entry.issues.push(`existing lemma_translation differs: "${existingHikma[0].text}" vs proposed "${p.proposedFrGloss}"`);
      }
    }

    // 3. Count forms associated with this lemma
    const formIds: string[] = [];
    for (const [wid, lid] of finalLemma) {
      if (lid === p.lemmaId) formIds.push(wid);
    }
    entry.formsAssociated = formIds.length;

    // 4. True new FR forms (forms not already covered by word_translations OR lemma_translations)
    const alreadyCovered = new Set<string>(wtFrSet);
    // Add forms covered by existing lemma_translations
    for (const [lid, lts] of ltByLemma) {
      const hikmaValidated = lts.filter(e => e.is_validated && e.source_id === hikmaSourceId);
      if (hikmaValidated.length === 0) continue;
      for (const [wid, flid] of finalLemma) {
        if (flid === lid) alreadyCovered.add(wid);
      }
    }

    let newFormsForThisLemma = 0;
    let newOccsForThisLemma = 0;
    for (const fid of formIds) {
      if (!alreadyCovered.has(fid)) {
        newFormsForThisLemma++;
        newOccsForThisLemma += occCountByWord.get(fid) ?? 0;
      }
    }
    entry.trueNewForms = newFormsForThisLemma;
    entry.trueNewOccs = newOccsForThisLemma;

    if (newFormsForThisLemma === 0 && entry.status === "READY_FOR_IMPORT") {
      entry.status = "EXISTING_SAME"; // effectively no gain
      entry.issues.push("all forms already covered by existing word_translations or lemma_translations");
    }

    // 5. Surahs affected
    const affectedSurahs = new Set<number>();
    for (const o of occLightAll) {
      if (!formIds.includes(o.word_id)) continue;
      const sid = occAyahMap.get(o.id);
      const surahId = sid ? ayahToSurah.get(sid) : undefined;
      const sn = surahId ? surahNumById.get(surahId) : undefined;
      if (sn !== undefined) affectedSurahs.add(sn);
    }
    entry.affectedSurahNums = [...affectedSurahs].sort((a, b) => a - b);

    totalTrueNewForms += newFormsForThisLemma;
    totalTrueNewOccs += newOccsForThisLemma;

    entries.push(entry);
  }

  // ─── Surah readiness simulation ───────────────────────────────────────────
  console.log("→ Simulating surah readiness…");

  // Build the "after" coverage: add proposed lemma glosses to alreadyCovered
  const afterCovered = new Set<string>(wtFrSet);
  for (const [lid, lts] of ltByLemma) {
    const hikmaValidated = lts.filter(e => e.is_validated && e.source_id === hikmaSourceId);
    if (hikmaValidated.length === 0) continue;
    for (const [wid, flid] of finalLemma) {
      if (flid === lid) afterCovered.add(wid);
    }
  }
  // Add proposed SAFE lemmas that are READY_FOR_IMPORT
  for (const e of entries) {
    if (e.status !== "READY_FOR_IMPORT") continue;
    for (const [wid, lid] of finalLemma) {
      if (lid === e.lemmaId) afterCovered.add(wid);
    }
  }

  const surahSim = new Map<number, { before: number; after: number; total: number; name: string }>();
  for (const [sn, forms] of surahForms) {
    let frBefore = 0, frAfter = 0;
    for (const wid of forms) {
      if (wtFrSet.has(wid)) frBefore++;
      else {
        const lid = finalLemma.get(wid);
        if (lid) {
          const lts = ltByLemma.get(lid) ?? [];
          const hikmaVal = lts.filter(e => e.is_validated && e.source_id === hikmaSourceId);
          if (hikmaVal.length > 0) frBefore++;
        }
      }
      if (afterCovered.has(wid)) frAfter++;
    }
    const pctBefore = forms.size > 0 ? Math.round(frBefore / forms.size * 100) : 100;
    const pctAfter = forms.size > 0 ? Math.round(frAfter / forms.size * 100) : 100;
    surahSim.set(sn, { before: pctBefore, after: pctAfter, total: forms.size, name: surahNameByNum.get(sn) ?? `Surah ${sn}` });
  }

  const newlyReady: number[] = [];
  for (const [sn, s] of surahSim) {
    if (sn === 1) continue; // REFERENCE, not READY
    if (s.before < 100 && s.after === 100) newlyReady.push(sn);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const readyForImport = entries.filter(e => e.status === "READY_FOR_IMPORT");
  const existingSame = entries.filter(e => e.status === "EXISTING_SAME");
  const conflictReview = entries.filter(e => e.status === "CONFLICT_REVIEW");
  const editorialReview = entries.filter(e => e.status === "EDITORIAL_REVIEW");
  const dataReview = entries.filter(e => e.status === "DATA_REVIEW");
  const doNotImport = entries.filter(e => e.status === "DO_NOT_IMPORT");

  console.log(`\n━━━ CLASSIFICATION ━━━`);
  console.log(`  READY_FOR_IMPORT  : ${readyForImport.length}`);
  console.log(`  EXISTING_SAME     : ${existingSame.length}`);
  console.log(`  CONFLICT_REVIEW   : ${conflictReview.length}`);
  console.log(`  EDITORIAL_REVIEW  : ${editorialReview.length}`);
  console.log(`  DATA_REVIEW       : ${dataReview.length}`);
  console.log(`  DO_NOT_IMPORT     : ${doNotImport.length}`);

  console.log(`\n━━━ GAIN ━━━`);
  const readyNewForms = readyForImport.reduce((s, e) => s + e.trueNewForms, 0);
  const readyNewOccs = readyForImport.reduce((s, e) => s + e.trueNewOccs, 0);
  console.log(`  True new forms (READY_FOR_IMPORT) : ${readyNewForms}`);
  console.log(`  True new occurrences              : ${readyNewOccs}`);
  console.log(`  Total new forms (all proposals)   : ${totalTrueNewForms}`);
  console.log(`  Total new occurrences (all)       : ${totalTrueNewOccs}`);

  console.log(`\n━━━ SURAH READINESS ━━━`);
  console.log(`  Before: 24 READY`);
  console.log(`  After : ${24 + newlyReady.length} READY`);
  console.log(`  Newly READY: ${newlyReady.length}`);

  if (newlyReady.length > 0) {
    for (const sn of newlyReady) {
      const s = surahSim.get(sn)!;
      console.log(`    Surah ${sn} — ${s.name}: ${s.before}% → ${s.after}%`);
    }
  } else {
    console.log(`    (no new surahs reach 100% — existing word_translations already cover them)`);
  }

  // Show READY_FOR_IMPORT entries
  if (readyForImport.length > 0) {
    console.log(`\n  READY_FOR_IMPORT (${readyForImport.length}):`);
    for (const e of readyForImport) {
      console.log(`    #${e.rank.toString().padStart(3)} ${e.arabic.padEnd(22)} → "${e.proposedFrGloss.padEnd(30)}" | +${e.trueNewForms} forms, +${e.trueNewOccs} occs, ${e.affectedSurahNums.length} surahs`);
    }
  }

  // Show CONFLICT entries
  if (conflictReview.length > 0) {
    console.log(`\n  CONFLICT_REVIEW (${conflictReview.length}):`);
    for (const e of conflictReview) {
      console.log(`    #${e.rank.toString().padStart(3)} ${e.arabic.padEnd(22)} | existing: "${e.existingLtTexts[0]?.slice(0, 30) ?? "? "}" | proposed: "${e.proposedFrGloss.slice(0, 30)}"`);
    }
  }

  // ─── Report ───────────────────────────────────────────────────────────────
  const reconciliationReport = {
    phase: "88F-B0",
    mode: "READ_ONLY_RECONCILIATION",
    timestamp: new Date().toISOString(),
    summary: {
      totalProposals: safeProposals.length,
      readyForImport: readyForImport.length,
      existingSame: existingSame.length,
      conflictReview: conflictReview.length,
      editorialReview: editorialReview.length,
      dataReview: dataReview.length,
      doNotImport: doNotImport.length,
      trueNewForms: totalTrueNewForms,
      trueNewOccs: totalTrueNewOccs,
      readyNewForms,
      readyNewOccs,
      newlyReadySurahs: newlyReady.length,
      newlyReadySurahNums: newlyReady,
    },
    entries,
    surahSimulation: [...surahSim].map(([sn, s]) => ({
      surahNumber: sn, name: s.name, total: s.total, before: s.before, after: s.after, improved: s.after > s.before,
    })).sort((a, b) => a.surahNumber - b.surahNumber),
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88f-b0-reconciliation.json", JSON.stringify(reconciliationReport, null, 2) + "\n");
  console.log(`\n  Report → reports/phase-88f-b0-reconciliation.json`);

  console.log(`\n=== PHASE 88F-B0 — RECONCILIATION TERMINÉE (0 écriture DB) ===`);
  console.log(`\nPHASE_88F_B0_COMPLETE`);
  console.log(`READY_FOR_IMPORT = ${readyForImport.length}`);
  console.log(`EDITORIAL_REVIEW = ${editorialReview.length}`);
  console.log(`DATA_REVIEW = ${dataReview.length}`);
  console.log(`CONFLICT = ${conflictReview.length}`);
  console.log(`EXISTING_SAME = ${existingSame.length}`);
  console.log(`TRUE_NEW_FORMS = ${totalTrueNewForms}`);
  console.log(`TRUE_NEW_OCCURRENCES = ${totalTrueNewOccs}`);
  console.log(`NEWLY_READY_SURAHS = ${newlyReady.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });