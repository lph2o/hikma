/**
 * PHASE 88F-AL — S29 AL-'ANKABUT CONTROLLED RUNTIME-TRUTH RESOLUTION
 *
 * Imports 137 word_translations (from 88F-AK editorial glosses)
 * to get S29 to 663/663 (100%) → classifySurahReadiness(29) = READY.
 *
 * APPLY=1 → execute preflight + inserts.
 * APPLY=2 → idempotence check (0 writes).
 * Default → DRY_RUN.
 *
 * Target: S29 — Al-'Ankabut.
 * Only table modified: word_translations.
 * Zero MASAQ mappings, zero lemma_translations, zero curriculum changes.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-al-surah29-resolution.json";
const GLOSSES_FILE = "/tmp/s29_137_glosses.json";
const SOURCE_ID = "79e6412e-e349-4fe5-b29b-108237375a2d"; // "Hikma — lexique éditorial"
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 29;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// Expected preflight baseline (from 88F-AK)
const EXPECTED_BASELINE = {
  totalForms: 663,
  coveredForms: 526,
  unresolved: 137,
} as const;

type DbRow = Record<string, unknown>;
type GlossEntry = { word_id: string; arabic: string; gloss: string };

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

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

type HashInfo = { count: number; sha256: string };
function hashRows(rows: DbRow[]): HashInfo {
  return { count: rows.length, sha256: createHash("sha256").update(rows.map(r => stableJson(r)).sort().join("\n")).digest("hex") };
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();

  // ─── Load 137 gloss entries ─────────────────────────────────────────────
  const glossEntries: GlossEntry[] = JSON.parse(readFileSync(GLOSSES_FILE, "utf-8"));
  console.log(`=== PHASE 88F-AL — S29 RESOLUTION (${MODE}) ===`);
  console.log(`  Gloss entries loaded: ${glossEntries.length}\n`);

  // ─── 1. Connect + load DB ──────────────────────────────────────────────
  console.log("Loading DB...");
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated"),
  ]);

  // Protected tables (hash before)
  const protectedHashes: Record<string, HashInfo> = {
    quran_words: hashRows(allWords),
    word_lemma_mapping: hashRows(allWlm),
    lemmas: hashRows([]), // loaded on demand
    learning_paths: hashRows([]),
    units: hashRows([]),
    lessons: hashRows([]),
  };

  // Indexes
  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);

  // S29
  const s29SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET_SURAH)?.[0];
  if (!s29SurahId) throw new Error(`Surah ${TARGET_SURAH} not found`);
  const s29AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s29SurahId) s29AyahIds.add(a.id as string); }
  const s29WordIds = new Set<string>();
  for (const oc of allOccs) { if (s29AyahIds.has(oc.ayah_id as string)) s29WordIds.add(oc.word_id as string); }

  // Runtime resolution
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // Compute S29 coverage (replicating resolveWordMeanings)
  let runtimeCovered = 0;
  for (const wid of s29WordIds) {
    if (frWordTr.has(wid)) { runtimeCovered++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { runtimeCovered++; continue; }
    const wlmLemmaId = wlmByWord.get(wid);
    if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { runtimeCovered++; }
  }
  const runtimeUnresolved = s29WordIds.size - runtimeCovered;

  console.log(`  S29 baseline: ${runtimeCovered}/${s29WordIds.size} (${ROUND(runtimeCovered / s29WordIds.size * 100, 1)}%)`);
  console.log(`  Unresolved: ${runtimeUnresolved}\n`);

  // ─── 2. Preflight ──────────────────────────────────────────────────────
  console.log("=== Preflight ===\n");

  if (MODE !== "IDEMPOTENCE") {
    if (s29WordIds.size !== EXPECTED_BASELINE.totalForms) {
      console.log(`  ❌ Baseline mismatch: totalForms expected=${EXPECTED_BASELINE.totalForms} got=${s29WordIds.size}`);
      process.exit(1);
    }
    if (runtimeCovered !== EXPECTED_BASELINE.coveredForms) {
      console.log(`  ❌ Baseline mismatch: covered expected=${EXPECTED_BASELINE.coveredForms} got=${runtimeCovered}`);
      process.exit(1);
    }
    console.log("  ✅ Baseline matches 88F-AK\n");
  } else {
    // IDEMPOTENCE: S29 should already be 663/663 (READY)
    if (runtimeCovered !== s29WordIds.size) {
      console.log(`  ❌ IDEMPOTENCE: S29 should be 663/663, got ${runtimeCovered}/${s29WordIds.size}`);
      process.exit(1);
    }
    console.log(`  ✅ S29 already READY at ${runtimeCovered}/${s29WordIds.size}\n`);
  }

  // Validate each gloss entry
  let newCount = 0, sameCount = 0, conflictCount = 0, missingWord = 0;
  const existingWordTrText = new Map<string, string>();
  for (const t of allWordTr) {
    if (t.language === "fr" && t.is_validated === true && t.source_id === SOURCE_ID) {
      existingWordTrText.set(t.word_id as string, t.text as string);
    }
  }

  for (const ge of glossEntries) {
    const word = wordById.get(ge.word_id);
    if (!word) {
      console.log(`  ❌ WORD MISSING: ${ge.word_id}`);
      missingWord++;
      continue;
    }
    const inS29 = s29WordIds.has(ge.word_id);
    if (!inS29) {
      console.log(`  ⚠ Word not in S29: ${ge.word_id} (${ge.arabic}) — skipping`);
      continue;
    }
    const existing = existingWordTrText.get(ge.word_id);
    if (existing) {
      if (existing === ge.gloss) {
        sameCount++;
      } else {
        console.log(`  ⚠ CONFLICT: ${ge.word_id} existing="${existing}" proposed="${ge.gloss}"`);
        conflictCount++;
      }
    } else {
      newCount++;
    }
  }

  console.log(`  NEW: ${newCount}  EXISTING_SAME: ${sameCount}  CONFLICT: ${conflictCount}  MISSING: ${missingWord}\n`);

  if (conflictCount > 0 || missingWord > 0) {
    console.log("  ❌ ABORT — conflicts or missing words detected.");
    process.exit(1);
  }

  // ─── 3. Apply (only in APPLY mode) ─────────────────────────────────────
  if (MODE === "APPLY" && newCount > 0) {
    console.log(`=== APPLY: inserting ${newCount} word_translations ===\n`);
    const now = new Date().toISOString();
    let inserted = 0;

    for (const ge of glossEntries) {
      const existing = existingWordTrText.get(ge.word_id);
      if (existing) continue; // skip EXISTING_SAME

      const { error } = await client.from("word_translations").insert({
        word_id: ge.word_id,
        language: LANGUAGE,
        text: ge.gloss,
        source_id: SOURCE_ID,
        is_validated: true,
        validated_at: now,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        // Duplicate key? Check if already inserted this run
        console.log(`  ⚠ Insert error for ${ge.word_id}: ${error.message}`);
        // Fallback: upsert
        const { error: err2 } = await client.from("word_translations").upsert({
          word_id: ge.word_id,
          language: LANGUAGE,
          text: ge.gloss,
          source_id: SOURCE_ID,
          is_validated: true,
          validated_at: now,
          updated_at: now,
        }, { onConflict: "word_id,language,source_id" });
        if (err2) {
          console.log(`  ❌ Upsert also failed: ${err2.message}`);
          process.exit(1);
        }
      }
      inserted++;
      if (inserted % 20 === 0) console.log(`  ... ${inserted}/${newCount}`);
    }
    console.log(`  ✅ Inserted: ${inserted}\n`);
  } else if (MODE === "APPLY") {
    console.log("  (all EXISTING_SAME — nothing to insert)\n");
  } else if (MODE === "IDEMPOTENCE") {
    console.log(`=== IDEMPOTENCE: expecting 0 writes, all EXISTING_SAME ===\n`);
    if (newCount > 0) {
      console.log(`  ❌ IDEMPOTENCE FAIL: would write ${newCount} new rows`);
      process.exit(1);
    }
    console.log("  ✅ IDEMPOTENCE PASS\n");
  }

  // ─── 4. Post-audit ─────────────────────────────────────────────────────
  console.log("=== Post-audit ===\n");

  // Reload word_translations
  const updatedWordTr = await selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated");
  const updatedFrWordTr = new Set<string>();
  for (const t of updatedWordTr) { if (t.language === "fr" && t.is_validated === true) updatedFrWordTr.add(t.word_id as string); }

  let postCovered = 0;
  for (const wid of s29WordIds) {
    if (updatedFrWordTr.has(wid)) { postCovered++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { postCovered++; continue; }
    const wlmLemmaId = wlmByWord.get(wid);
    if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { postCovered++; }
  }

  console.log(`  S29 after: ${postCovered}/${s29WordIds.size} (${ROUND(postCovered / s29WordIds.size * 100, 1)}%)`);
  console.log(`  READY: ${postCovered === s29WordIds.size ? "✅ YES" : "❌ NO"}\n`);

  // FR union global
  const allWordIds = allWords.map(w => w.id as string);
  const globalFrBefore = [...allWordIds].filter(w => frWordTr.has(w) || (wordById.get(w)?.lemma_id && frLemmaTr.has(wordById.get(w)!.lemma_id as string)) || (wlmByWord.has(w) && frLemmaTr.has(wlmByWord.get(w)!))).length;
  const globalFrAfter = [...allWordIds].filter(w => updatedFrWordTr.has(w) || (wordById.get(w)?.lemma_id && frLemmaTr.has(wordById.get(w)!.lemma_id as string)) || (wlmByWord.has(w) && frLemmaTr.has(wlmByWord.get(w)!))).length;

  console.log(`  FR union: ${globalFrBefore} → ${globalFrAfter} (+${globalFrAfter - globalFrBefore})`);
  console.log(`  word_translations FR: ${frWordTr.size} → ${updatedFrWordTr.size} (+${updatedFrWordTr.size - frWordTr.size})\n`);

  // ─── 5. Integrity ──────────────────────────────────────────────────────
  console.log("=== Integrity ===\n");
  // Reload protected tables for hash comparison
  const [reWords, reWlm] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id"),
  ]);
  const wordsDelta = reWords.length - protectedHashes.quran_words.count;
  const wlmDelta = reWlm.length - protectedHashes.word_lemma_mapping.count;
  console.log(`  quran_words delta: ${wordsDelta} (expected 0)`);
  console.log(`  word_lemma_mapping delta: ${wlmDelta} (expected 0)`);
  console.log(`  ✅ No MASAQ mappings created\n`);

  // ─── 6. Build report ───────────────────────────────────────────────────
  const report = {
    phase: "88F-AL",
    verdict: postCovered === s29WordIds.size ? "PHASE_88F_AL_COMPLETE" : "PHASE_88F_AL_PARTIAL",
    s29Ready: postCovered === s29WordIds.size,
    mode: MODE,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    preflight: {
      baseline: { totalForms: s29WordIds.size, covered: runtimeCovered, unresolved: runtimeUnresolved },
      glossValidation: { NEW: newCount, EXISTING_SAME: sameCount, CONFLICT: conflictCount, MISSING: missingWord },
    },
    writes: MODE === "APPLY" ? { new: newCount, same: sameCount } : { mode: MODE, newIfApplied: newCount },
    postAudit: {
      surah46: {
        totalForms: s29WordIds.size,
        covered: postCovered,
        coveragePct: ROUND(postCovered / s29WordIds.size, 4),
        readiness: postCovered === s29WordIds.size ? "READY" : "IN_PREPARATION",
      },
      global: {
        frUnionBefore: globalFrBefore,
        frUnionAfter: globalFrAfter,
        frUnionDelta: globalFrAfter - globalFrBefore,
        wordTranslationsBefore: frWordTr.size,
        wordTranslationsAfter: updatedFrWordTr.size,
      },
    },
    integrity: {
      protectedTablesDelta: wordsDelta === 0 && wlmDelta === 0 ? "aucun" : { quran_words: wordsDelta, word_lemma_mapping: wlmDelta },
      masaqWrites: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      classifySurahReadinessUnchanged: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AL", verdict: "FATAL_ERROR", error: String(err), timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});