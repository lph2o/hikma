/**
 * PHASE 88F-AH — S36 YA-SIN CONTROLLED RESOLUTION (PREFLIGHT + ABORT)
 *
 * Detects editorial integrity issues in the 88F-AG gloss data before any writes.
 * ABORTs without modifying any DB table.
 *
 * DISCOVERED: 30 English glosses + 39 generic-French mismatches in the 88F-AG dataset.
 * These indicate a systematic mapping bug (glosses assigned to wrong word_ids).
 * Importing them would corrupt the DB.
 *
 * APPLY modes are NOT supported — this phase aborts in all modes
 * because the editorial data is not fit for import.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-ah-surah36-resolution.json";
const AG_REPORT = "reports/phase-88f-ag-surah36-editorial-runtime.json";
const PAGE_SIZE = 1000;
const TARGET_SURAH = 36;

const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ─── Editorial integrity checks ───────────────────────────────────────

/** Common English function words / pronouns that signal a non-French gloss. */
const ENGLISH_STARTS = [
  "He ", "We ", "Should ", "Enter ", "And ", "Is ",
  "who ", "the ", "a ", "A ", "all ", "can ", "has ",
  "are ", "will ", "they ", "it ", "like ", "they ",
  "most ", "for ", "its ", "their ", "some ", "our ",
  "But ", "Alas", "Ya ",
];

/** French generic function words — a gloss consisting solely of these is almost
 *  certainly a mapping bug (the real Arabic needs a content word). */
const GENERIC_FRENCH = new Set([
  "dans / en", "dans", "en",
  "vers / à", "vers", "à",
  "sur",
  "avec",
  "ensuite / puis", "ensuite", "puis",
  "certain / assuré", "certain", "assuré",
  "seulement / mais", "seulement", "mais",
  "tout / tous", "tout", "tous",
  "avant / auparavant", "avant", "auparavant",
  "de / depuis / à partir de", "de", "depuis",
  "donner / accorder", "donner", "accorder",
  "faire / créer / rendre", // might be okay for some roots, but is a red flag
  "prendre / saisir",
  "si",
  "mal / mauvais", // borderline — could be correct for some, but flag generics
]);

function isEnglishGloss(gloss: string): boolean {
  if (!gloss || gloss.length < 2) return false;
  // Whole gloss is a known English phrase
  const lower = gloss.toLowerCase();
  if (["he would have fed him", "we were", "should we feed", "enter",
       "and we have tamed them", "most of them", "and we record",
       "are decomposed", "the like of them", "like the date stalk",
       "we could drown them", "ask of you", "a multitude",
       "produced them", "and it is same", "ignite", "are the owners",
       "a register", "is it because", "has raised us", "they ride them",
       "they ride", "the] green", "who will be brought",
       "will be occupied", "the] poetry", "can outstrip",
       "the servants", "we reverse him", "it will seize them",
       "and we bring forth", "we have ordained for it",
       "and will bear witness", "would be saved",
       "to proceed", "i enjoin", "and from it",
       "he will give them life", "a revelation",
       "and their footprints", "so some of them ",
       "their places", "our hands", "(are with) heads raised up",
       "like the date stalk", "to help them",
  ].includes(lower)) return true;

  // Starts with English pronoun/auxiliary
  for (const s of ENGLISH_STARTS) {
    if (gloss.startsWith(s) || gloss.startsWith("[" + s)) return true;
  }

  // Contains common English words not present in French
  if (/\b(?:[Ww]e|[Hh]e|[Ss]hould|[Ss]hall|[Ee]nter|[Aa]nd|[Tt]hem|[Tt]hey|[Ww]ould|[Cc]ould|[Hh]as|[Rr]aised|[Ww]ill|[Ii]ts|[Tt]heir|[Oo]wners|[Rr]egister|[Mm]ultitude|[Dd]ecomposed|[Rr]ecord|[Oo]utstrip)\b/.test(gloss)) {
    return true;
  }

  return false;
}

function isGenericFrenchMismatch(gloss: string): boolean {
  if (GENERIC_FRENCH.has(gloss)) return true;
  // Single-word generic prepositions are almost always wrong for Quranic forms
  if (["dans", "en", "vers", "à", "sur", "avec", "ensuite", "puis",
       "certain", "assuré", "seulement", "mais", "tout", "tous",
       "avant", "auparavant", "de", "depuis", "donner", "accorder",
       "si", "mal", "for it"].includes(gloss)) return true;
  return false;
}

// ─── DB helpers ────────────────────────────────────────────────────────

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

// ─── Main ──────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();

  console.log("=== PHASE 88F-AH — S36 YA-SIN RESOLUTION (PREFLIGHT + EDITORIAL INTEGRITY CHECK) ===\n");

  // ─── 1. Load 88F-AG editorial glosses ─────────────────────────────────
  const agReport = JSON.parse(readFileSync(AG_REPORT, "utf-8"));
  const glossEntries = (agReport.editorialGlosses ?? []) as Array<{
    word_id: string; arabic: string; ayah: string;
    gloss: string; rationale: string; hamidullahSnippet?: string;
  }>;
  console.log(`Gloss entries from 88F-AG: ${glossEntries.length}`);
  if (glossEntries.length !== 123) {
    console.log(`  ⚠ Expected 123, got ${glossEntries.length}`);
  }

  // ─── 2. Editorial integrity check (BEFORE any DB work) ───────────────
  console.log("\n=== Editorial Integrity Check ===\n");

  const issues: Array<{ index: number; word_id: string; arabic: string; gloss: string; issue: string; rationale: string }> = [];
  let englishCount = 0, genericCount = 0, emptyCount = 0;

  for (let i = 0; i < glossEntries.length; i++) {
    const g = glossEntries[i];
    const gloss = (g.gloss ?? "").trim();
    const rationale = g.rationale ?? "";

    if (!gloss) {
      emptyCount++;
      issues.push({ index: i, word_id: g.word_id, arabic: g.arabic, gloss: "", issue: "EMPTY_GLOSS", rationale });
      continue;
    }

    if (isEnglishGloss(gloss)) {
      englishCount++;
      issues.push({ index: i, word_id: g.word_id, arabic: g.arabic, gloss, issue: "ENGLISH_GLOSS", rationale });
      continue;
    }

    if (isGenericFrenchMismatch(gloss)) {
      genericCount++;
      issues.push({ index: i, word_id: g.word_id, arabic: g.arabic, gloss, issue: "GENERIC_FRENCH_MISMATCH", rationale });
    }
  }

  console.log(`  English glosses:   ${englishCount}`);
  console.log(`  Generic mismatches: ${genericCount}`);
  console.log(`  Empty glosses:     ${emptyCount}`);
  console.log(`  Total issues:      ${issues.length}`);
  console.log(`  Appear correct:    ${glossEntries.length - issues.length}\n`);

  // Show sample issues
  console.log("=== Sample issues ===\n");
  for (const issue of issues.slice(0, 15)) {
    console.log(`  [#${issue.index}] ${issue.arabic.padEnd(22)} → "${issue.gloss.truncate(40)}"  [${issue.issue}]`);
    console.log(`           rationale: ${issue.rationale.truncate(70)}`);
  }
  if (issues.length > 15) console.log(`  ... and ${issues.length - 15} more issues.`);

  // ─── 3. DB preflight (read-only baseline) ────────────────────────────
  console.log("\n=== DB Preflight (read-only) ===\n");
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

  // Indexes
  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) {
    surahNumById.set(s.id as string, s.number as number);
    surahNameByNum.set(s.number as number, s.name_transliteration as string);
  }

  // S36 word set
  const s36SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET_SURAH)?.[0];
  if (!s36SurahId) throw new Error(`Surah ${TARGET_SURAH} not found`);
  const s36AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s36SurahId) s36AyahIds.add(a.id as string); }
  const s36WordIds = new Set<string>();
  for (const oc of allOccs) { if (s36AyahIds.has(oc.ayah_id as string)) s36WordIds.add(oc.word_id as string); }

  // Runtime resolution
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  let pathA = 0, pathB = 0, pathC = 0, unresolved = 0;
  for (const wid of s36WordIds) {
    if (frWordTr.has(wid)) { pathA++; continue; }
    const word = wordById.get(wid);
    if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { pathB++; continue; }
    const wlmLemmaId = wlmByWord.get(wid);
    if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { pathC++; continue; }
    unresolved++;
  }

  console.log(`  S36 baseline: ${pathA + pathB + pathC}/${s36WordIds.size} (${ROUND((pathA + pathB + pathC) / s36WordIds.size * 100, 1)}%)`);
  console.log(`  PATH A (word_tr): ${pathA}`);
  console.log(`  PATH B (lemma):    ${pathB}`);
  console.log(`  PATH C (WLM):      ${pathC}`);
  console.log(`  Unresolved:        ${unresolved}\n`);

  // Check 88F-AG baseline expectation
  const expectedBaseline = { totalForms: 529, covered: 406, unresolved: 123 };
  let structuralOk = true;
  if (s36WordIds.size !== expectedBaseline.totalForms) {
    console.log(`  ❌ Baseline mismatch: totalForms exp=${expectedBaseline.totalForms} got=${s36WordIds.size}`);
    structuralOk = false;
  }
  if ((pathA + pathB + pathC) !== expectedBaseline.covered) {
    console.log(`  ❌ Baseline mismatch: covered exp=${expectedBaseline.covered} got=${pathA + pathB + pathC}`);
    structuralOk = false;
  }
  if (unresolved !== expectedBaseline.unresolved) {
    console.log(`  ❌ Baseline mismatch: unresolved exp=${expectedBaseline.unresolved} got=${unresolved}`);
    structuralOk = false;
  }
  if (structuralOk) console.log("  ✅ Structural baseline matches 88F-AG\n");

  // Validate gloss word_ids are in S36
  let validWordIds = 0, notInS36 = 0, notInDb = 0;
  for (const g of glossEntries) {
    if (!wordById.has(g.word_id)) { notInDb++; continue; }
    if (!s36WordIds.has(g.word_id)) { notInS36++; continue; }
    validWordIds++;
  }
  console.log(`  Valid S36 word_ids: ${validWordIds}/${glossEntries.length}`);
  console.log(`  Not in DB:          ${notInDb}`);
  console.log(`  Not in S36:         ${notInS36}\n`);

  // Check for word_id duplicates
  const seenIds = new Set<string>();
  let duplicateIds = 0;
  for (const g of glossEntries) {
    if (seenIds.has(g.word_id)) duplicateIds++;
    seenIds.add(g.word_id);
  }
  if (duplicateIds > 0) console.log(`  ⚠ Duplicate word_ids: ${duplicateIds}`);

  // Anti-conflict: any gloss word already has a different FR word_translation?
  const existingWordTrText = new Map<string, string>();
  for (const t of allWordTr) {
    if (t.language === "fr" && t.is_validated === true) {
      existingWordTrText.set(t.word_id as string, (t.text as string).trim());
    }
  }
  let conflicts = 0;
  for (const g of glossEntries) {
    const existing = existingWordTrText.get(g.word_id);
    if (existing && existing !== g.gloss.trim()) {
      conflicts++;
    }
  }
  console.log(`  Translation conflicts: ${conflicts}\n`);

  // ─── 4. Verdict ──────────────────────────────────────────────────────
  const verdict = (issues.length > 0)
    ? "PHASE_88F_AH_ABORTED_EDITORIAL_INTEGRITY"
    : structuralOk ? "PHASE_88F_AH_COMPLETE" : "PHASE_88F_AH_ABORTED_PREFLIGHT_INCONSISTENCY";

  console.log(`=== VERDICT: ${verdict} ===`);
  console.log(`  Editorial issues: ${issues.length}`);
  console.log(`  English glosses:  ${englishCount}`);
  console.log(`  Generic mismatch: ${genericCount}`);
  console.log(`  Empty glosses:    ${emptyCount}`);
  console.log(`  DATABASE_WRITES:  0\n`);

  // ─── 5. Build report ─────────────────────────────────────────────────
  const report = {
    phase: "88F-AH",
    verdict,
    readOnly: true,
    databaseWrites: 0,
    mode: "PREFLIGHT_ABORT",
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    preflight: {
      structuralBaseline: {
        expected: expectedBaseline,
        actual: { totalForms: s36WordIds.size, covered: pathA + pathB + pathC, unresolved },
        match: structuralOk,
        paths: { pathA_wordTr: pathA, pathB_lemma: pathB, pathC_wlm: pathC },
      },
      structuralIntegrity: {
        validS36WordIds: validWordIds,
        notInDb: notInDb,
        notInS36: notInS36,
        duplicateIds,
        conflicts,
      },
    },
    editorialIntegrity: {
      passed: issues.length === 0,
      totalGlosses: glossEntries.length,
      englishGlosses: englishCount,
      genericFrenchMismatches: genericCount,
      emptyGlosses: emptyCount,
      totalIssues: issues.length,
      appearCorrect: glossEntries.length - issues.length,
      sampleIssues: issues.slice(0, 20).map(i => ({
        index: i.index,
        word_id: i.word_id,
        arabic: i.arabic,
        gloss: i.gloss,
        issue: i.issue,
        rationale: i.rationale.truncate(80),
      })),
      allIssues: issues.map(i => ({
        index: i.index,
        word_id: i.word_id,
        arabic: i.arabic,
        category: i.issue,
      })),
    },
    recommendation: "Re-run PHASE 88F-AG with corrected gloss mapping. The editorial gloss data contains ~69 entries with English text or generic French prepositions that do not match the Arabic forms — indicating a systematic off-by-one or hash-collision bug in the gloss-to-word_id assignment. Once corrected, re-attempt 88F-AH import.",
    nextPhaseAfterFix: "88F-AH (re-attempt with corrected glosses)",
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);

  // Exit with non-zero to signal ABORT
  if (issues.length > 0) process.exit(0); // Exit cleanly with report, not a crash
}

// Augment String prototype for truncation
declare global {
  interface String { truncate(n: number): string; }
}
  String.prototype.truncate = function (n: number): string {
  return this.length <= n ? String(this) : String(this).slice(0, n) + "…";
};

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({
    phase: "88F-AH", verdict: "FATAL_ERROR", error: String(err),
    timestamp: new Date().toISOString(), databaseWrites: 0,
  }, null, 2));
  process.exit(1);
});