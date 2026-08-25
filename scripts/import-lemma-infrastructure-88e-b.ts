/* eslint-disable @typescript-eslint/no-explicit-any -- script CLI one-shot legacy : types Supabase pragmatiques */
/**
 * Phase 88E-B — SAFE Lemma Infrastructure Import
 *
 * Imports ONLY SAFE lemmas from MASAQ stems → Hikma `lemmas` table.
 * Creates `word_lemma_mapping` entries + updates
 * `linguistic_occurrences.hikma_lemma_id`. NO French glosses.
 *
 * DRY_RUN=true by default. Pass --execute for real import.
 *
 * Usage:
 *   npx tsx scripts/import-lemma-infrastructure-88e-b.ts              → dry-run
 *   npx tsx scripts/import-lemma-infrastructure-88e-b.ts --execute    → real import
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { normalizeWordText } from "../lib/quran/normalize-text";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function skeleton(s: string): string {
  return normalizeWordText(s)
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0622/g, "\u0627")
    .replace(/\u0653/g, "")
    .replace(/\u0670/g, "\u0627");
}

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

// ─── Classification ──────────────────────────────────────────────────────────
const FUNCTION_WORD_PATTERNS = [/^[وبفل]$/, /^[وبفل][وبفل]$/, /^(ال|لل|بسم|فب|وب|فل|بل)$/];

function isFunctionWord(stem: string): boolean {
  return FUNCTION_WORD_PATTERNS.some(p => p.test(stem));
}

type Category = "NEW_LEMMA_SAFE" | "EXISTING_MAPPING" | "EXISTING_LEMMA" | "PARTIAL_REVIEW" | "DUPLICATE" | "UNRESOLVED" | "CONFLICT";

function classifyStem(
  stem: string,
  hikmaLemmaIds: Set<string>,
  lemmaByIdDirect: Map<string, { id: string; arabic: string }>,
  lemmaSkeletonMatch: { id: string; arabic: string } | null,
  posObserved: string[],
): Category {
  for (const hid of hikmaLemmaIds) {
    if (lemmaByIdDirect.get(hid)) return "EXISTING_MAPPING";
  }
  if (hikmaLemmaIds.size > 0) return "CONFLICT";
  if (lemmaSkeletonMatch) return "DUPLICATE";
  if (isFunctionWord(stem)) return "UNRESOLVED";

  const hasLexicalPos = posObserved.some(p => p.startsWith("NOUN") || p.startsWith("VERB") || p.startsWith("ADJ"));
  const isOnlyParticle = posObserved.length > 0 && posObserved.every(p =>
    p.startsWith("PREP") || p.startsWith("CONJ") || p.startsWith("PART") || p === "INVARIABLE");

  if (isOnlyParticle && posObserved.length <= 2) return "UNRESOLVED";
  if (hasLexicalPos) return "NEW_LEMMA_SAFE";
  return "PARTIAL_REVIEW";
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnvFiles();
  const DRY_RUN = !process.argv.includes("--execute");
  const MODE = DRY_RUN ? "DRY_RUN" : "EXECUTE";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log(`=== PHASE 88E-B — SAFE LEMMA IMPORT (${MODE}) ===\n`);

  console.log("→ Loading reference data…");
  const lemmaRows = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  const lemmaBySkel = new Map(lemmaRows.map(l => [skeleton(l.arabic), l]));
  const lemmaByIdDirect = new Map(lemmaRows.map(l => [l.id, l]));

  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");

  const existingMapping = new Map<string, string>();
  for (const w of wordRows) { if (w.lemma_id) existingMapping.set(w.id, w.lemma_id); }
  for (const m of wlmRows) { if (!existingMapping.has(m.word_id)) existingMapping.set(m.word_id, m.lemma_id); }
  console.log(`  lemmas: ${lemmaRows.length} | wlm: ${wlmRows.length} | words: ${wordRows.length}`);

  // MASAQ
  console.log("→ Loading MASAQ…");
  const masaqRows = await selectAll<any>(client, "linguistic_occurrences",
    "id, source_id, word_occurrence_id, surah_number, masaq_word, masaq_stem, masaq_gloss_en, hikma_lemma_id, lemma_mapping_status, pos");

  // Get MASAQ source_id
  const masaqSourceId = masaqRows.find((r: any) => r.source_id)?.source_id as string | undefined;
  if (!masaqSourceId) throw new Error("Impossible de trouver le source_id MASAQ.");
  console.log(`  MASAQ rows: ${masaqRows.length} | source_id: ${masaqSourceId.slice(0, 8)}…`);

  const occToWordMap = new Map<string, string>();
  const { data: occFull } = await client.from("word_occurrences").select("id, word_id");
  for (const o of (occFull ?? []) as Array<{ id: string; word_id: string }>) occToWordMap.set(o.id, o.word_id);

  // Group by masaq_stem
  console.log("→ Grouping by masaq_stem…");
  const stemGroups = new Map<string, {
    rows: any[]; wordIds: Set<string>; formSet: Set<string>;
    posSet: Set<string>; statuses: Set<string>; hikmaLemmaIds: Set<string>;
  }>();
  for (const r of masaqRows) {
    let g = stemGroups.get(r.masaq_stem);
    if (!g) {
      g = { rows: [], wordIds: new Set(), formSet: new Set(), posSet: new Set(), statuses: new Set(), hikmaLemmaIds: new Set() };
      stemGroups.set(r.masaq_stem, g);
    }
    g.rows.push(r);
    const wid = occToWordMap.get(r.word_occurrence_id);
    if (wid) g.wordIds.add(wid);
    g.formSet.add(r.masaq_word);
    if (r.pos) for (const p of r.pos) g.posSet.add(p);
    g.statuses.add(r.lemma_mapping_status);
    if (r.hikma_lemma_id) g.hikmaLemmaIds.add(r.hikma_lemma_id);
  }
  console.log(`  Distinct stems: ${stemGroups.size}`);

  // Classify
  console.log("→ Classifying…");
  const newLemmaSafe: { stem: string; group: ReturnType<typeof stemGroups.get> }[] = [];
  const existingMappings: string[] = [];
  const partialReview: string[] = [];
  const duplicates: string[] = [];
  const unresolved: string[] = [];
  const conflicts: string[] = [];

  for (const [stem, g] of stemGroups) {
    const skel = skeleton(stem);
    const lemmaMatch = lemmaBySkel.get(skel) ?? null;
    const cat = classifyStem(stem, g.hikmaLemmaIds, lemmaByIdDirect, lemmaMatch, [...g.posSet]);

    switch (cat) {
      case "NEW_LEMMA_SAFE": newLemmaSafe.push({ stem, group: g }); break;
      case "EXISTING_MAPPING": existingMappings.push(stem); break;
      case "PARTIAL_REVIEW": partialReview.push(stem); break;
      case "DUPLICATE": duplicates.push(stem); break;
      case "UNRESOLVED": unresolved.push(stem); break;
      case "CONFLICT": conflicts.push(stem); break;
    }
  }

  console.log(`\n─── CLASSIFICATION ───`);
  console.log(`  NEW_LEMMA_SAFE     : ${newLemmaSafe.length}`);
  console.log(`  EXISTING_MAPPING   : ${existingMappings.length}`);
  console.log(`  PARTIAL_REVIEW     : ${partialReview.length}`);
  console.log(`  DUPLICATE          : ${duplicates.length}`);
  console.log(`  UNRESOLVED         : ${unresolved.length}`);
  console.log(`  CONFLICT           : ${conflicts.length}`);

  if (conflicts.length > 0) {
    console.log(`\n⚠ CONFLICT — aborting!`);
    for (const c of conflicts) console.log(`  ${c}`);
    if (!DRY_RUN) { console.log("ABORT."); process.exit(1); }
  }

  if (newLemmaSafe.length === 0) {
    console.log("\nNo new lemmas. Done.");
    return;
  }

  // Prepare
  console.log("\n→ Preparing import data…");

  const newLemmas: { id: string; arabic: string }[] = [];
  const newMappings: { word_id: string; lemma_id: string }[] = [];
  const masaqUpdates: { masaq_id: string; lemma_id: string }[] = [];

  for (const { stem, group: g } of newLemmaSafe) {
    const skel = skeleton(stem);
    if (lemmaBySkel.has(skel)) continue;

    const lemmaId = randomUUID();
    newLemmas.push({ id: lemmaId, arabic: stem });

    for (const wid of g.wordIds) {
      if (existingMapping.has(wid)) continue;
      if (newMappings.some(m => m.word_id === wid)) continue;
      newMappings.push({ word_id: wid, lemma_id: lemmaId });
    }

    for (const r of g.rows) {
      if (r.hikma_lemma_id) continue;
      masaqUpdates.push({ masaq_id: r.id, lemma_id: lemmaId });
    }
  }

  console.log(`  New lemmas         : ${newLemmas.length}`);
  console.log(`  New WLM mappings   : ${newMappings.length}`);
  console.log(`  MASAQ updates      : ${masaqUpdates.length}`);

  // ─── DRY_RUN ──────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log("\n─── DRY_RUN VALIDATION ───");
    for (const nl of newLemmas) {
      if (lemmaBySkel.has(skeleton(nl.arabic))) { console.log(`  ❌ Duplicate: ${nl.arabic}`); process.exit(1); }
    }
    for (const nm of newMappings) {
      if (existingMapping.has(nm.word_id)) { console.log(`  ❌ Overwrite: ${nm.word_id}`); process.exit(1); }
    }
    if (conflicts.length > 0) { console.log(`  ❌ ${conflicts.length} CONFLICTS`); process.exit(1); }
    console.log("  ✅ All checks passed.");

    console.log("\n  Top 20 new lemmas:");
    for (const nl of newLemmas.slice(0, 20)) {
      const g = stemGroups.get(nl.arabic);
      const surahs = new Set(g?.rows.map((r: any) => r.surah_number) ?? []);
      console.log(`    ${nl.arabic.padEnd(20)} | surahs: ${surahs.size} | forms: ${g?.formSet.size ?? 0} | occs: ${g?.rows.length ?? 0}`);
    }

    const plan = {
      phase: "88E-B", mode: "DRY_RUN", timestamp: new Date().toISOString(),
      classification: { newLemmaSafe: newLemmaSafe.length, existingMapping: existingMappings.length, partialReview: partialReview.length, duplicates: duplicates.length, unresolved: unresolved.length, conflicts: conflicts.length },
      expectedWrites: { lemmas: newLemmas.length, wordLemmaMappings: newMappings.length, linguisticOccurrenceUpdates: masaqUpdates.length },
    };
    mkdirSync("reports", { recursive: true });
    writeFileSync("reports/phase-88e-b-import-plan.json", JSON.stringify(plan, null, 2) + "\n");
    console.log(`\n  Plan → reports/phase-88e-b-import-plan.json`);
    console.log(`\n=== DRY_RUN TERMINÉ — 0 écritures ===`);
    console.log(`Pour exécuter l'import : npx tsx scripts/import-lemma-infrastructure-88e-b.ts --execute`);
    return;
  }

  // ─── EXECUTE ──────────────────────────────────────────────────────────────
  console.log("\n⚠ MODE EXECUTION — écritures DB…");

  if (newLemmas.length > 0) {
    console.log(`\n→ Inserting ${newLemmas.length} lemmas…`);
    let done = 0;
    for (let i = 0; i < newLemmas.length; i += 500) {
      const chunk = newLemmas.slice(i, i + 500).map(l => ({ id: l.id, arabic: l.arabic }));
      const { error } = await client.from("lemmas").upsert(chunk, { onConflict: "arabic", ignoreDuplicates: true });
      if (error) throw new Error(`lemmas: ${error.message}`);
      done += chunk.length;
    }
    console.log(`  Inserted: ${done}`);
  }

  if (newMappings.length > 0) {
    console.log(`\n→ Inserting ${newMappings.length} word_lemma_mappings…`);
    let done = 0;
    for (let i = 0; i < newMappings.length; i += 500) {
      const chunk = newMappings.slice(i, i + 500).map(m => ({
        word_id: m.word_id, lemma_id: m.lemma_id,
        source_id: masaqSourceId, mapping_method: "exact_surface", confidence: "safe",
      }));
      const { error } = await client.from("word_lemma_mapping").upsert(chunk, { onConflict: "word_id", ignoreDuplicates: true });
      if (error) throw new Error(`wlm: ${error.message}`);
      done += chunk.length;
    }
    console.log(`  Inserted: ${done}`);
  }

  if (masaqUpdates.length > 0) {
    console.log(`\n→ Updating ${masaqUpdates.length} linguistic_occurrences…`);
    let updated = 0;
    for (let i = 0; i < masaqUpdates.length; i += 500) {
      const chunk = masaqUpdates.slice(i, i + 500);
      for (const u of chunk) {
        const { error } = await client.from("linguistic_occurrences")
          .update({ hikma_lemma_id: u.lemma_id, lemma_mapping_status: "EXACT" })
          .eq("id", u.masaq_id);
        if (error) { console.error(`  err on ${u.masaq_id}: ${error.message}`); continue; }
        updated++;
      }
    }
    console.log(`  Updated: ${updated}`);
  }

  // Post-import audit
  console.log("\n→ Post-import audit…");
  const { count: lc } = await client.from("lemmas").select("*", { count: "exact", head: true });
  const { count: wc } = await client.from("word_lemma_mapping").select("*", { count: "exact", head: true });
  const { count: loM } = await client.from("linguistic_occurrences").select("*", { count: "exact", head: true }).not("hikma_lemma_id", "is", null);
  const { count: loT } = await client.from("linguistic_occurrences").select("*", { count: "exact", head: true });

  console.log(`  lemmas                    : ${lc} (was ${lemmaRows.length})`);
  console.log(`  word_lemma_mapping        : ${wc} (was ${wlmRows.length})`);
  console.log(`  linguistic_occurrences    : ${loT} (mapped: ${loM})`);

  const report = {
    phase: "88E-B", mode: "EXECUTED", timestamp: new Date().toISOString(),
    import: { newLemmas: newLemmas.length, newWlmMappings: newMappings.length, masaqUpdates: masaqUpdates.length, partialReview: partialReview.length, duplicates: duplicates.length, unresolved: unresolved.length, conflicts: conflicts.length },
    postImport: { lemmasTotal: lc, wlmTotal: wc, linguisticOccurrencesMapped: loM, linguisticOccurrencesTotal: loT },
  };
  writeFileSync("reports/phase-88e-b-import-result.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`\n  Report → reports/phase-88e-b-import-result.json`);
  console.log(`\n=== PHASE 88E-B — IMPORT TERMINÉ ===`);
}

main().catch(err => { console.error(err); process.exit(1); });