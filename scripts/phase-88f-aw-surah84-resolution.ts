/**
 * PHASE 88F-AW — S84 AL-INSHIQAQ CONTROLLED RESOLUTION
 *
 * Imports 24 word_translations (from 88F-AV editorial glosses)
 * to get S84 to 92/92 (100%) → classifySurahReadiness(84) = READY.
 *
 * APPLY=1 → execute preflight + inserts.
 * APPLY=2 → idempotence check (0 writes).
 * Default → DRY_RUN.
 *
 * Target: S84 — Al-Inshiqaq.
 * Only table modified: word_translations.
 * Zero MASAQ mappings, zero lemma_translations, zero curriculum changes.
 *
 * Identity-safe: word_id is the sole key throughout — never array position.
 * Source of truth: reports/phase-88f-av-surah84-editorial-runtime.json
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-aw-surah84-resolution.json";
const AV_REPORT = "reports/phase-88f-av-surah84-editorial-runtime.json";
const SOURCE_ID = "79e6412e-e349-4fe5-b29b-108237375a2d"; // "Hikma — lexique éditorial"
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 84;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// Expected preflight baseline (from 88F-AV)
const EXPECTED_BASELINE = {
  totalForms: 92,
  coveredForms: 68,
  unresolved: 24,
  pathA: 64,
  pathB: 0,
  pathC: 4,
} as const;

// Expected post-import
const EXPECTED_POST = {
  totalForms: 92,
  coveredForms: 92,
  pathA: 88, // 64 + 24
  pathB: 0,
  pathC: 4,
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

function classifyReadiness(surahNumber: number, effectiveFrPct: number): string {
  if (surahNumber === 1) return "REFERENCE";
  if (effectiveFrPct === 100) return "READY";
  return "IN_PREPARATION";
}

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();

  // ─── Load 24 gloss entries from 88F-AV report ─────────────────────────
  const avReport = JSON.parse(readFileSync(AV_REPORT, "utf-8"));
  const glossEntries: GlossEntry[] = avReport.editorialGlosses.map((g: {
    word_id: string; arabic: string; gloss: string;
  }) => ({
    word_id: g.word_id, arabic: g.arabic, gloss: g.gloss,
  }));

  console.log(`=== PHASE 88F-AW — S84 AL-INSHIQAQ CONTROLLED RESOLUTION (${MODE}) ===`);
  console.log(`  Gloss entries loaded from 88F-AV: ${glossEntries.length}\n`);

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
    lemma_translations: hashRows(allLemmaTr),
  };

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

  // S84
  const s84SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET_SURAH)?.[0];
  if (!s84SurahId) throw new Error(`Surah ${TARGET_SURAH} not found`);
  const s84AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s84SurahId) s84AyahIds.add(a.id as string); }
  const s84WordIds = new Set<string>();
  for (const oc of allOccs) { if (s84AyahIds.has(oc.ayah_id as string)) s84WordIds.add(oc.word_id as string); }

  // FR runtime state
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // Compute S84 coverage (replicating resolveWordMeanings)
  let pathA = 0, pathB = 0, pathC = 0;
  const unresolvedIds: string[] = [];
  for (const wid of s84WordIds) {
    if (frWordTr.has(wid)) { pathA++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { pathB++; continue; }
    const wlmLemmaId = wlmByWord.get(wid);
    if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { pathC++; continue; }
    unresolvedIds.push(wid);
  }
  const runtimeCovered = pathA + pathB + pathC;
  const runtimeUnresolved = s84WordIds.size - runtimeCovered;

  console.log(`  S84 baseline: ${runtimeCovered}/${s84WordIds.size} (${ROUND(runtimeCovered / s84WordIds.size * 100, 1)}%)`);
  console.log(`  PATH A=${pathA}  PATH B=${pathB}  PATH C=${pathC}  UNRESOLVED=${runtimeUnresolved}\n`);

  // ─── 2. Preflight ──────────────────────────────────────────────────────
  console.log("=== Preflight ===\n");

  if (MODE !== "IDEMPOTENCE") {
    if (s84WordIds.size !== EXPECTED_BASELINE.totalForms) {
      console.log(`  ABORT: totalForms expected=${EXPECTED_BASELINE.totalForms} got=${s84WordIds.size}`);
      process.exit(1);
    }
    if (runtimeCovered !== EXPECTED_BASELINE.coveredForms) {
      console.log(`  ABORT: covered expected=${EXPECTED_BASELINE.coveredForms} got=${runtimeCovered}`);
      process.exit(1);
    }
    if (runtimeUnresolved !== EXPECTED_BASELINE.unresolved) {
      console.log(`  ABORT: unresolved expected=${EXPECTED_BASELINE.unresolved} got=${runtimeUnresolved}`);
      process.exit(1);
    }
    if (pathA !== EXPECTED_BASELINE.pathA) {
      console.log(`  ABORT: pathA expected=${EXPECTED_BASELINE.pathA} got=${pathA}`);
      process.exit(1);
    }
    if (pathB !== EXPECTED_BASELINE.pathB) {
      console.log(`  ABORT: pathB expected=${EXPECTED_BASELINE.pathB} got=${pathB}`);
      process.exit(1);
    }
    if (pathC !== EXPECTED_BASELINE.pathC) {
      console.log(`  ABORT: pathC expected=${EXPECTED_BASELINE.pathC} got=${pathC}`);
      process.exit(1);
    }
    console.log("  Baseline matches 88F-AV\n");
  } else {
    if (runtimeCovered !== s84WordIds.size) {
      console.log(`  ABORT: S84 should be 92/92, got ${runtimeCovered}/${s84WordIds.size}`);
      process.exit(1);
    }
    console.log(`  S84 already READY at ${runtimeCovered}/${s84WordIds.size}\n`);
  }

  // ─── 3. Validate each gloss entry (IDENTITY-SAFE) ─────────────────────
  console.log("=== Identity validation ===\n");

  let newCount = 0, sameCount = 0, conflictCount = 0, missingWord = 0, outOfScope = 0, invalid = 0;
  const existingWordTrText = new Map<string, string>();
  for (const t of allWordTr) {
    if (t.language === "fr" && t.is_validated === true && t.source_id === SOURCE_ID) {
      existingWordTrText.set(t.word_id as string, t.text as string);
    }
  }

  for (const ge of glossEntries) {
    const word = wordById.get(ge.word_id);
    if (!word) { console.log(`  MISSING: ${ge.word_id}`); missingWord++; continue; }
    const inS84 = s84WordIds.has(ge.word_id);
    if (!inS84) { console.log(`  OUT_OF_SCOPE: ${ge.word_id} (${ge.arabic})`); outOfScope++; continue; }
    if (!ge.gloss || ge.gloss.trim() === "" || ge.gloss === ge.arabic) { console.log(`  INVALID: ${ge.word_id}`); invalid++; continue; }
    const existing = existingWordTrText.get(ge.word_id);
    if (existing) {
      if (existing === ge.gloss) sameCount++;
      else { console.log(`  CONFLICT: ${ge.word_id}`); conflictCount++; }
    } else newCount++;
  }

  const uniqueWordIds = new Set(glossEntries.map(g => g.word_id));
  if (uniqueWordIds.size !== glossEntries.length) {
    console.log(`  ABORT: duplicate word_ids`); process.exit(1);
  }
  const emptyGlosses = glossEntries.filter(g => !g.gloss || g.gloss.trim() === "");
  if (emptyGlosses.length > 0) { console.log(`  ABORT: ${emptyGlosses.length} empty glosses`); process.exit(1); }

  console.log(`  Payload: ${glossEntries.length} entries`);
  console.log(`  Unique word_ids: ${uniqueWordIds.size}`);
  console.log(`  NEW: ${newCount}  EXISTING_SAME: ${sameCount}  CONFLICT: ${conflictCount}  MISSING: ${missingWord}  OUT_OF_SCOPE: ${outOfScope}  INVALID: ${invalid}\n`);

  if (conflictCount > 0 || missingWord > 0 || outOfScope > 0 || invalid > 0) {
    console.log("  ABORT — integrity violations detected.");
    process.exit(1);
  }

  // ─── 4. Apply (only in APPLY mode) ────────────────────────────────────
  let inserted = 0;
  if (MODE === "APPLY" && newCount > 0) {
    console.log(`=== APPLY: inserting ${newCount} word_translations ===\n`);
    const now = new Date().toISOString();
    for (const ge of glossEntries) {
      if (existingWordTrText.get(ge.word_id)) continue;
      const { error } = await client.from("word_translations").insert({
        word_id: ge.word_id, language: LANGUAGE, text: ge.gloss,
        source_id: SOURCE_ID, is_validated: true, validated_at: now, created_at: now, updated_at: now,
      });
      if (error) {
        console.log(`  Insert error for ${ge.word_id}: ${error.message}`);
        const { error: err2 } = await client.from("word_translations").upsert({
          word_id: ge.word_id, language: LANGUAGE, text: ge.gloss,
          source_id: SOURCE_ID, is_validated: true, validated_at: now, updated_at: now,
        }, { onConflict: "word_id,language,source_id" });
        if (err2) { console.log(`  Upsert failed: ${err2.message}`); console.log("  ABORT"); process.exit(1); }
      }
      inserted++;
      if (inserted % 10 === 0) console.log(`  ... ${inserted}/${newCount}`);
    }
    console.log(`  Inserted: ${inserted}\n`);
  } else if (MODE === "APPLY") {
    console.log("  (all EXISTING_SAME — nothing to insert)\n");
  } else if (MODE === "IDEMPOTENCE") {
    console.log(`=== IDEMPOTENCE: expecting 0 writes ===\n`);
    if (newCount > 0) { console.log(`  IDEMPOTENCE FAIL: would write ${newCount}`); process.exit(1); }
    console.log("  IDEMPOTENCE PASS\n");
  } else {
    console.log(`  DRY_RUN: would insert ${newCount} word_translations\n`);
  }

  // ─── 5. Post-audit ────────────────────────────────────────────────────
  console.log("=== Post-audit ===\n");

  const updatedWordTr = await selectAll<DbRow>(client, "word_translations", "id,word_id,language,is_validated");
  const updatedFrWordTr = new Set<string>();
  for (const t of updatedWordTr) { if (t.language === "fr" && t.is_validated === true) updatedFrWordTr.add(t.word_id as string); }

  let postPathA = 0, postPathB = 0, postPathC = 0;
  for (const wid of s84WordIds) {
    if (updatedFrWordTr.has(wid)) { postPathA++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { postPathB++; continue; }
    const wlmLemmaId = wlmByWord.get(wid);
    if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { postPathC++; }
  }
  const postCovered = postPathA + postPathB + postPathC;

  console.log(`  S84 after: ${postCovered}/${s84WordIds.size} (${ROUND(postCovered / s84WordIds.size * 100, 1)}%)`);
  console.log(`  PATH A=${postPathA}  PATH B=${postPathB}  PATH C=${postPathC}`);
  console.log(`  READY: ${postCovered === s84WordIds.size ? "YES" : "NO"}\n`);

  if (MODE === "APPLY" || MODE === "IDEMPOTENCE") {
    if (postPathA !== EXPECTED_POST.pathA) console.log(`  pathA expected=${EXPECTED_POST.pathA} got=${postPathA}`);
    if (postPathB !== EXPECTED_POST.pathB) console.log(`  pathB expected=${EXPECTED_POST.pathB} got=${postPathB}`);
    if (postPathC !== EXPECTED_POST.pathC) console.log(`  pathC expected=${EXPECTED_POST.pathC} got=${postPathC}`);
  }

  // ─── 6. Global reconciliation (all 114 surahs) ────────────────────────
  console.log("=== Global reconciliation (114 surahs) ===\n");

  const allSurahWordIds = new Map<number, Set<string>>();
  for (let i = 1; i <= 114; i++) allSurahWordIds.set(i, new Set());
  const surahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) surahNumByAyahId.set(a.id as string, sn);
  }
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn != null) allSurahWordIds.get(sn)!.add(oc.word_id as string);
  }

  let readyCount = 0, notReadyCount = 0, referenceCount = 0;
  const readySurahs: number[] = [];
  for (let sn = 1; sn <= 114; sn++) {
    const wids = allSurahWordIds.get(sn)!;
    if (wids.size === 0) {
      if (sn === 1) referenceCount++; else notReadyCount++;
      continue;
    }
    let covered = 0;
    for (const wid of wids) {
      if (updatedFrWordTr.has(wid)) { covered++; continue; }
      const word = wordById.get(wid);
      if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { covered++; continue; }
      const wlmLemmaId = wlmByWord.get(wid);
      if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { covered++; }
    }
    const pct = Math.round((covered / wids.size) * 100);
    const state = classifyReadiness(sn, pct);
    if (state === "READY") { readyCount++; readySurahs.push(sn); }
    else if (state === "REFERENCE") referenceCount++;
    else notReadyCount++;
  }

  console.log(`  READY: ${readyCount}`);
  console.log(`  NOT_READY: ${notReadyCount}`);
  console.log(`  REFERENCE: ${referenceCount}`);
  console.log(`  Total: ${readyCount + notReadyCount + referenceCount}`);
  console.log(`  S84 READY: ${readySurahs.includes(84) ? "YES" : "NO"}`);
  console.log(`  S13 READY: ${readySurahs.includes(13) ? "YES" : "NO"}`);
  console.log(`  S29 READY: ${readySurahs.includes(29) ? "YES" : "NO"}`);
  console.log(`  S36 READY: ${readySurahs.includes(36) ? "YES" : "NO"}`);
  console.log(`  S46 READY: ${readySurahs.includes(46) ? "YES" : "NO"}`);
  console.log(`  S62 READY: ${readySurahs.includes(62) ? "YES" : "NO"}`);
  console.log(`  S70 READY: ${readySurahs.includes(70) ? "YES" : "NO"}`);
  console.log(`  S82 READY: ${readySurahs.includes(82) ? "YES" : "NO"}`);
  console.log(`  S85 READY: ${readySurahs.includes(85) ? "YES" : "NO"}`);
  console.log(`  S90 READY: ${readySurahs.includes(90) ? "YES" : "NO"}`);
  console.log(`  S92 READY: ${readySurahs.includes(92) ? "YES" : "NO"}`);
  console.log(`  S98 READY: ${readySurahs.includes(98) ? "YES" : "NO"}\n`);

  // ─── 7. Protected tables ──────────────────────────────────────────────
  console.log("=== Protected tables ===\n");

  const [reWords, reWlm, reLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id"),
    selectAll<DbRow>(client, "lemma_translations", "id"),
  ]);
  const wordsDelta = reWords.length - protectedHashes.quran_words.count;
  const wlmDelta = reWlm.length - protectedHashes.word_lemma_mapping.count;
  const lemmaTrDelta = reLemmaTr.length - protectedHashes.lemma_translations.count;

  console.log(`  quran_words delta: ${wordsDelta}`);
  console.log(`  word_lemma_mapping delta: ${wlmDelta}`);
  console.log(`  lemma_translations delta: ${lemmaTrDelta}`);
  console.log(`  linguistic_occurrences delta: 0 (not modified)`);
  console.log(`  translations delta: 0 (not modified)`);
  console.log(`  curriculum delta: 0 (not modified)`);
  console.log(`  learning_paths delta: 0 (not modified)`);
  console.log(`  No MASAQ mappings created\n`);

  const allProtectedZero = wordsDelta === 0 && wlmDelta === 0 && lemmaTrDelta === 0;

  // ─── 8. FR union ──────────────────────────────────────────────────────
  const allWordIdsArr = allWords.map(w => w.id as string);
  const globalFrBefore = allWordIdsArr.filter(w =>
    frWordTr.has(w) ||
    (wordById.get(w)?.lemma_id && frLemmaTr.has(wordById.get(w)!.lemma_id as string)) ||
    (wlmByWord.has(w) && frLemmaTr.has(wlmByWord.get(w)!))
  ).length;
  const globalFrAfter = allWordIdsArr.filter(w =>
    updatedFrWordTr.has(w) ||
    (wordById.get(w)?.lemma_id && frLemmaTr.has(wordById.get(w)!.lemma_id as string)) ||
    (wlmByWord.has(w) && frLemmaTr.has(wlmByWord.get(w)!))
  ).length;

  console.log(`  FR union: ${globalFrBefore} -> ${globalFrAfter} (+${globalFrAfter - globalFrBefore})`);
  console.log(`  word_translations FR: ${frWordTr.size} -> ${updatedFrWordTr.size} (+${updatedFrWordTr.size - frWordTr.size})\n`);

  // ─── 9. Build report ──────────────────────────────────────────────────
  const s84Ready = postCovered === s84WordIds.size;
  const totalSurahs = readyCount + notReadyCount + referenceCount;
  const verdict = s84Ready && allProtectedZero && totalSurahs === 114
    ? "PHASE_88F_AW_COMPLETE"
    : "PHASE_88F_AW_ABORTED_INTEGRITY";

  const report = {
    phase: "88F-AW",
    verdict,
    s84Ready,
    mode: MODE,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    surah: { number: TARGET_SURAH, name: "Al-Inshiqaq" },

    baseline: {
      totalForms: s84WordIds.size,
      coveredForms: runtimeCovered,
      unresolvedForms: runtimeUnresolved,
      coveragePct: ROUND(runtimeCovered / s84WordIds.size * 100, 4),
      runtimePaths: { pathA_wordTr: pathA, pathB_lemma: pathB, pathC_wlm: pathC },
      classALemmaReachable: 1,
    },

    preflight: {
      expectedGlosses: 24,
      actualGlosses: glossEntries.length,
      uniqueWordIds: uniqueWordIds.size,
      glossValidation: {
        NEW: newCount,
        EXISTING_SAME: sameCount,
        CONFLICT: conflictCount,
        MISSING: missingWord,
        OUT_OF_SCOPE: outOfScope,
        INVALID: invalid,
      },
      emptyGlosses: emptyGlosses.length,
      identitySafe: uniqueWordIds.size === glossEntries.length && emptyGlosses.length === 0,
    },

    import: MODE === "APPLY"
      ? { wordTranslationsInserted: inserted, expected: 24 }
      : { mode: MODE, wouldInsert: newCount },

    postRuntime: {
      totalForms: s84WordIds.size,
      coveredForms: postCovered,
      coveragePct: ROUND(postCovered / s84WordIds.size * 100, 4),
      runtimePaths: { pathA_wordTr: postPathA, pathB_lemma: postPathB, pathC_wlm: postPathC },
      readiness: classifyReadiness(TARGET_SURAH, postCovered === s84WordIds.size ? 100 : Math.round(postCovered / s84WordIds.size * 100)),
      ready: s84Ready,
    },

    globalReconciliation: {
      readyCount,
      notReadyCount,
      referenceCount,
      total: totalSurahs,
      consistencyCheck: totalSurahs === 114,
      s84Ready: readySurahs.includes(84),
      s13Ready: readySurahs.includes(13),
      s29Ready: readySurahs.includes(29),
      s36Ready: readySurahs.includes(36),
      s46Ready: readySurahs.includes(46),
      s62Ready: readySurahs.includes(62),
      s70Ready: readySurahs.includes(70),
      s82Ready: readySurahs.includes(82),
      s85Ready: readySurahs.includes(85),
      s90Ready: readySurahs.includes(90),
      s92Ready: readySurahs.includes(92),
      s98Ready: readySurahs.includes(98),
      readySurahs: readySurahs.sort((a, b) => a - b),
    },

    protectedTables: {
      quran_words: wordsDelta,
      word_lemma_mapping: wlmDelta,
      linguistic_occurrences: 0,
      lemma_translations: lemmaTrDelta,
      translations: 0,
      curriculum: 0,
      learning_paths: 0,
      allDeltaZero: allProtectedZero,
    },

    frUnion: {
      before: globalFrBefore,
      after: globalFrAfter,
      delta: globalFrAfter - globalFrBefore,
      wordTranslationsBefore: frWordTr.size,
      wordTranslationsAfter: updatedFrWordTr.size,
    },

    idempotence: MODE === "IDEMPOTENCE"
      ? { NEW: newCount, EXISTING_SAME: sameCount, CONFLICT: conflictCount, dbDelta: 0, pass: newCount === 0 }
      : { applicableOnReRun: true, expectedNew: 0, expectedExistingSame: 24, expectedConflict: 0 },

    importedWordIds: glossEntries.map(g => g.word_id),

    integrity: {
      databaseWrites: MODE === "APPLY" ? inserted : 0,
      masaqMappingsCreated: 0,
      wlmCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      classifySurahReadinessUnchanged: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report -> ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  S84: ${runtimeCovered}/${s84WordIds.size} -> ${postCovered}/${s84WordIds.size}`);
  console.log(`  READY: ${s84Ready}`);
  console.log(`  Global READY: ${readyCount}  NOT_READY: ${notReadyCount}  REFERENCE: ${referenceCount}`);
  console.log(`  Protected tables: ${allProtectedZero ? "all zero" : "DELTA DETECTED"}`);
  console.log(`  DATABASE_WRITES: ${MODE === "APPLY" ? inserted : 0}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AW", verdict: "FATAL_ERROR", error: String(err), timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});
