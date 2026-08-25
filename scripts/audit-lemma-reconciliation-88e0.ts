/* eslint-disable @typescript-eslint/no-explicit-any -- script CLI one-shot legacy : types Supabase pragmatiques */
/**
 * Phase 88E-0 — Lemma Reference Integrity Reconciliation
 * READ-ONLY — traces the 8 CONFLICT stems from Phase 88E-A
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const STEMS = ["اسم", "حمد", "رحمن", "رحيم", "له", "عالم", "على", "رحم"];

async function selectAll(client: ReturnType<typeof createClient>, table: string, cols: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as any[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function main() {
  loadEnvFiles();
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  // Load all reference tables
  const lemmaRows = await selectAll(c, "lemmas", "id, arabic");
  const lemmaById = new Map(lemmaRows.map((l: any) => [l.id, { id: l.id, arabic: l.arabic }]));
  console.log(`lemmas: ${lemmaRows.length}`);

  const ltRows = await selectAll(c, "lemma_translations", "lemma_id, text, is_validated, source_id");
  const ltByLemma = new Map<string, any[]>();
  for (const r of ltRows as any[]) {
    const arr = ltByLemma.get(r.lemma_id) ?? [];
    arr.push(r);
    ltByLemma.set(r.lemma_id, arr);
  }

  const { data: ocFull } = await c.from("word_occurrences").select("id, word_id");
  const occToWord = new Map((ocFull ?? []).map((o: any) => [o.id, o.word_id]));
  const wordOccCount = new Map<string, number>();
  for (const o of (ocFull ?? []) as any[]) {
    wordOccCount.set(o.word_id, (wordOccCount.get(o.word_id) ?? 0) + 1);
  }

  const reports: any[] = [];

  for (const stem of STEMS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`STEM: ${stem}`);
    console.log(`${"=".repeat(60)}`);

    const { data: lo } = await c.from("linguistic_occurrences")
      .select("id, surah_number, ayah_number, masaq_word, masaq_stem, masaq_gloss_en, hikma_lemma_id, lemma_mapping_status, pos, word_occurrence_id")
      .eq("masaq_stem", stem);

    const rows = (lo ?? []) as any[];
    const withLemma = rows.filter((r: any) => r.hikma_lemma_id);
    const hikmaIds = [...new Set(withLemma.map((r: any) => r.hikma_lemma_id))];
    const statuses = [...new Set(rows.map((r: any) => r.lemma_mapping_status))];
    const glossEns = [...new Set(rows.map((r: any) => r.masaq_gloss_en).filter(Boolean))];
    const posSet = [...new Set(rows.flatMap((r: any) => r.pos ?? []))];
    const surahSet = [...new Set(rows.map((r: any) => r.surah_number))].sort((a: number, b: number) => a - b);
    const wordSamples = [...new Set(rows.map((r: any) => r.masaq_word))].slice(0, 10);

    console.log(`  MASAQ rows         : ${rows.length}`);
    console.log(`  with hikma_lemma_id : ${withLemma.length}`);
    console.log(`  hikma_lemma_ids     : ${hikmaIds.map((id: string) => id.slice(0, 12) + "…")}`);
    console.log(`  mapping_statuses    : ${statuses}`);
    console.log(`  gloss_en            : ${glossEns.slice(0, 5)}`);
    console.log(`  POS                 : ${posSet.slice(0, 8)}`);
    console.log(`  surahs              : ${surahSet}`);
    console.log(`  word samples        : ${wordSamples}`);

    // Check if hikma_lemma_ids exist in lemmas
    let foundLemma: any = null;
    let hasOrphanRef = false;
    for (const hid of hikmaIds) {
      const lm = lemmaById.get(hid);
      if (lm) {
        foundLemma = lm;
        console.log(`  UUID ${hid.slice(0, 12)}… → lemma: ${lm.arabic} ✅`);
        const lts = ltByLemma.get(hid) ?? [];
        console.log(`    lemma_translations: ${lts.length}`);
        for (const lt of lts) console.log(`      "${lt.text}" ${lt.is_validated ? "(validated)" : "(UNVALIDATED)"}`);
      } else {
        hasOrphanRef = true;
        console.log(`  UUID ${hid.slice(0, 12)}… → lemma: ❌ NOT FOUND`);
      }
    }

    // Check word_occurrence → quran_words
    const occIds = [...new Set(rows.map((r: any) => r.word_occurrence_id))];
    const wordIds = [...new Set(occIds.map((oid: string) => occToWord.get(oid)).filter(Boolean))];
    const { data: words } = await c.from("quran_words").select("id, arabic, lemma_id").in("id", wordIds.slice(0, 100));
    console.log(`  quran_words (${(words ?? []).length}):`);
    for (const w of (words ?? []).slice(0, 8) as any[]) {
      const lemmaMatch = w.lemma_id ? (lemmaById.get(w.lemma_id)?.arabic ?? "NOT FOUND") : "null";
      const occs = wordOccCount.get(w.id) ?? 0;
      console.log(`    ${w.id.slice(0, 8)}… ${w.arabic.padEnd(30)} → lemma: ${(w.lemma_id?.slice(0, 8) ?? "null").padEnd(10)} (${lemmaMatch}) — ${occs} occs`);
    }

    // word_lemma_mapping
    const { data: wlm } = await c.from("word_lemma_mapping").select("word_id, lemma_id").in("word_id", wordIds.slice(0, 100));
    console.log(`  word_lemma_mapping: ${(wlm ?? []).length} entries`);
    for (const m of (wlm ?? []).slice(0, 8) as any[]) {
      const lm = lemmaById.get(m.lemma_id);
      console.log(`    word: ${m.word_id.slice(0, 8)}… → lemma: ${m.lemma_id.slice(0, 8)}… ${lm ? lm.arabic : "NOT FOUND"}`);
    }

    // Check for equivalent lemmas by name
    const lemmaNameMap = new Map(lemmaRows.map((l: any) => [l.arabic, l]));
    // Try to find a lemma matching the stem concept
    const matchingLemmas = lemmaRows.filter((l: any) => {
      const a = l.arabic;
      return a.includes(stem) || stem.includes(a) || 
             stem.replace(/[\u064B-\u065F]/g, "") === a.replace(/[\u064B-\u065F]/g, "");
    });
    console.log(`  Candidate lemma matches: ${matchingLemmas.length}`);
    for (const ml of matchingLemmas) console.log(`    ${ml.id.slice(0, 8)}… ${ml.arabic}`);

    // Classification
    let classification = "UNKNOWN";
    if (hasOrphanRef && matchingLemmas.length > 0) {
      classification = "ORPHAN_REFERENCE_WITH_EQUIVALENT";
    } else if (hasOrphanRef) {
      classification = "ORPHAN_REFERENCE";
    } else if (foundLemma) {
      // Already found — this shouldn't be a conflict. Let's double-check
      classification = "EXISTING_EQUIVALENT";
    }

    // Special known cases
    if (stem === "حمد" && matchingLemmas.some((l: any) => l.arabic === "الْحَمْد")) {
      classification = "EXISTING_EQUIVALENT — الْحَمْد exists, حمد is bare stem";
    }

    console.log(`  CLASSIFICATION: ${classification}`);

    reports.push({
      stem,
      masaqGlossEn: glossEns,
      posObserved: posSet,
      surahs: surahSet,
      hikmaLemmaIds: hikmaIds,
      foundLemmaInDB: foundLemma ? { id: foundLemma.id, arabic: foundLemma.arabic } : null,
      matchingLemmasCount: matchingLemmas.length,
      matchingLemmaCandidates: matchingLemmas.map((l: any) => ({ id: l.id, arabic: l.arabic })),
      classification,
      wordSamples,
      totalMasaqRows: rows.length,
      wordsWithExistingLemma: (words ?? []).filter((w: any) => w.lemma_id).length,
      wordsWithWlm: (wlm ?? []).length,
    });
  }

  // Write report
  const report = {
    phase: "88E-0",
    mode: "READ_ONLY_RECONCILIATION",
    timestamp: new Date().toISOString(),
    stems: reports,
    summary: {
      totalStems: STEMS.length,
      classifications: [...new Set(reports.map(r => r.classification))],
      requiresLemmaCreation: reports.filter(r => r.foundLemmaInDB === null).length,
      requiresMappingUpdate: reports.filter(r => r.classification === "ORPHAN_REFERENCE_WITH_EQUIVALENT").length,
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88e0-lemma-reference-reconciliation.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`\n\n  Report → reports/phase-88e0-lemma-reference-reconciliation.json`);
  console.log(`\n=== PHASE 88E-0 TERMINÉ — 0 WRITES ===`);
}

main().catch(err => { console.error(err); process.exit(1); });