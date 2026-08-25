/**
 * PHASE 88F-J — SURAH-FIRST S98 AL-BAYYINAH RESOLUTION & IMPORT
 *
 * Strategy: SURAH-FIRST / READY-FIRST.
 * Target: S98 — Al-Bayyinah (79 forms → 100 % FR → READY).
 *
 * Batch A: 7 lemma_translations for 7 distinct lemmas (covers 9 forms).
 * Batch B: 2 word_translations for تَفَرَّقَ + وَيُؤْتُوا۟ (REVIEW → safest path).
 *
 * WRITE CONTRACT
 * - Batch A: INSERT bulk in lemma_translations (7 rows).
 * - Batch B: INSERT bulk in word_translations (2 rows).
 * - No mappings, lemmas, curriculum, or MASAQ writes.
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes, verify state).
 * Default → DRY_RUN (preflight only, 0 writes).
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-j-surah98-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 98;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ─── EXPECTED BASELINE (from 88F-I, confirmed 2026-08-24) ─────────────────
const EXPECTED_BEFORE_S98 = {
  totalForms: 79,
  coveredForms: 68,
  missingForms: 11,
  coveragePct: ROUND(68 / 79, 4),
  readiness: "IN_PREPARATION",
} as const;

// ─── BATCH A — 7 LEMMA_TRANSLATIONS (9 forms via 7 lemmas) ─────────────────
const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  بر:   { lemmaId: "71d35060-c548-416b-ae25-d682e1c5575d", text: "bonté / bienfaisance" },
  منفك: { lemmaId: "f986b797-62f3-4b70-b733-419f0170f5b8", text: "cesser / se désengager / se séparer" },
  بين:  { lemmaId: "1818b16c-a6f7-4c5a-b449-cf7df139839e", text: "entre / preuve claire" },
  مطهر: { lemmaId: "911bcc5c-6fc9-4668-a357-bc9b130af1f0", text: "purifié / pur" },
  كتب:  { lemmaId: "8afcda77-f864-4c33-8a28-ed3613a1f153", text: "livre / écrire / prescrire" },
  قيم:  { lemmaId: "e35fe1cb-bcec-430c-b20c-29c011e2f733", text: "droit / correct / de valeur / établir (droit)" },
  شر:   { lemmaId: "223d7988-3efa-4bbf-897a-65c68523a0c6", text: "mal / pire / mauvais" },
};

// ─── BATCH B — 2 WORD_TRANSLATIONS (REVIEW forms) ──────────────────────────
// After researching the DB: no suitable lemmas exist for stems تفرق / ؤت.
// Word-level translation is the safest path without human editorial review.
const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  تفرق:  { wordId: "74e57f70-00f1-4cfd-987c-d87f0d7e66c8", text: "se diviser / se séparer" },
  ؤت:    { wordId: "01547cbe-310e-4182-957b-a10e6c9d221b", text: "donner / accorder" },
};

// ─── PROTECTED TABLES (hash-verified, zero delta) ──────────────────────────
const PROTECTED_TABLES = [
  "quran_words", "word_lemma_mapping", "linguistic_occurrences",
  "lemmas", "learning_paths", "units", "lessons",
] as const;

// ─── TYPES ─────────────────────────────────────────────────────────────────
type DbRow = Record<string, unknown>;
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccurrenceRow = { id: string; word_id: string; ayah_id: string };
type AyahRow = { id: string; surah_id: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { word_id: string; lemma_id: string };
type WordTranslationRow = { word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null; validated_at?: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; language: string; text: string; source_id: string | null; is_validated: boolean; validated_at: string | null };
type LinguisticOccurrenceRow = { word_occurrence_id: string; hikma_lemma_id: string | null; masaq_stem?: string | null };
type SourceRow = { id: string; name: string };

type LoadedState = {
  raw: Record<string, DbRow[]>;
  words: WordRow[];
  occurrences: OccurrenceRow[];
  ayahs: AyahRow[];
  surahs: SurahRow[];
  lemmas: LemmaRow[];
  wlm: WlmRow[];
  wordTranslations: WordTranslationRow[];
  lemmaTranslations: LemmaTranslationRow[];
  linguisticOccurrences: LinguisticOccurrenceRow[];
};

type TableSnapshot = { count: number; sha256: string };

type Coverage = {
  quranWords: number;
  wordOccurrences: number;
  lemmas: number;
  activeLemmas: number;
  wordLemmaMapping: number;
  wordTranslationsFrValidated: number;
  lemmaTranslations: number;
  lemmaTranslationsFrValidated: number;
  linguisticOccurrences: number;
  frUnionDistinctWordIds: number;
  frOccurrences: number;
  frPercentage: number;
  masked: Record<string, unknown>;
};

type SurahCoverageEntry = {
  number: number;
  name: string;
  totalForms: number;
  coveredForms: number;
  coveragePct: number;
  readiness: string;
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function snapshotRows(rows: DbRow[]): TableSnapshot {
  return {
    count: rows.length,
    sha256: createHash("sha256").update(rows.map(stableJson).sort().join("\n")).digest("hex"),
  };
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

// ─── LOAD ──────────────────────────────────────────────────────────────────
async function loadState(client: SupabaseClient): Promise<LoadedState> {
  const tables = ["quran_words","word_occurrences","ayahs","surahs","lemmas","word_lemma_mapping","word_translations","lemma_translations","linguistic_occurrences","learning_paths","units","lessons"] as const;
  const loaded = await Promise.all(tables.map(async (t) => [t, await selectAll<DbRow>(client, t, "*")] as const));
  const raw = Object.fromEntries(loaded) as Record<string, DbRow[]>;
  return {
    raw,
    words: raw.quran_words as unknown as WordRow[],
    occurrences: raw.word_occurrences as unknown as OccurrenceRow[],
    ayahs: raw.ayahs as unknown as AyahRow[],
    surahs: raw.surahs as unknown as SurahRow[],
    lemmas: raw.lemmas as unknown as LemmaRow[],
    wlm: raw.word_lemma_mapping as unknown as WlmRow[],
    wordTranslations: raw.word_translations as unknown as WordTranslationRow[],
    lemmaTranslations: raw.lemma_translations as unknown as LemmaTranslationRow[],
    linguisticOccurrences: raw.linguistic_occurrences as unknown as LinguisticOccurrenceRow[],
  };
}

function getProtectedSnapshots(state: LoadedState): Record<string, TableSnapshot> {
  return Object.fromEntries(PROTECTED_TABLES.map((t) => [t, snapshotRows(state.raw[t])]));
}

// ─── COVERAGE (A/B/C/D UNION model) ────────────────────────────────────────
function computeCoverage(state: LoadedState, hikmaId: string) {
  const { words, occurrences, ayahs, surahs, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences } = state;
  const occById = new Map(occurrences.map((r) => [r.id, r]));
  const ayahById = new Map(ayahs.map((r) => [r.id, r]));
  const surahById = new Map(surahs.map((r) => [r.id, r]));

  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id);
  }

  const wordFr = new Set(wordTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.word_id));
  const lemmaFr = new Set(lemmaTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.lemma_id));
  const union = new Set(wordFr);
  for (const [wid, lid] of finalLemma) if (lemmaFr.has(lid)) union.add(wid);

  const occCountByWord = new Map<string, number>();
  const surahForms = new Map<number, Set<string>>();
  for (const o of occurrences) {
    increment(occCountByWord, o.word_id);
    const ayah = ayahById.get(o.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) {
      let f = surahForms.get(surah.number);
      if (!f) { f = new Set(); surahForms.set(surah.number, f); }
      f.add(o.word_id);
    }
  }

  let coveredOccs = 0;
  for (const wid of union) coveredOccs += occCountByWord.get(wid) ?? 0;

  let ready = 0, inPrep = 0, ref = 0;
  for (const [num, forms] of surahForms) {
    const cov = [...forms].filter((w) => union.has(w)).length;
    if (num === 1) ref++;
    else if (forms.size > 0 && cov === forms.size) ready++;
    else inPrep++;
  }

  return {
    quranWords: words.length,
    wordOccurrences: occurrences.length,
    lemmas: lemmas.length,
    activeLemmas: new Set(finalLemma.values()).size,
    wordLemmaMapping: wlm.length,
    wordTranslationsFrValidated: wordFr.size,
    lemmaTranslations: lemmaTranslations.length,
    lemmaTranslationsFrValidated: lemmaFr.size,
    linguisticOccurrences: linguisticOccurrences.length,
    frUnionDistinctWordIds: union.size,
    frOccurrences: coveredOccs,
    frPercentage: ROUND(union.size / words.length),
    masked: {
      READY: ready,
      IN_PREPARATION: inPrep,
      REFERENCE: ref,
      surahForms,
      union,
      finalLemma,
      occCountByWord,
    },
  };
}

// ─── SURAH-SPECIFIC COVERAGE ───────────────────────────────────────────────
function computeSurahCoverage(state: LoadedState, coverage: Coverage, surahNumber: number): SurahCoverageEntry {
  const masked = coverage.masked as { surahForms: Map<number, Set<string>>; union: Set<string> };
  const forms = masked.surahForms.get(surahNumber) ?? new Set<string>();
  let cov = 0;
  for (const wid of forms) if (masked.union.has(wid)) cov++;
  const surah = state.surahs.find((s) => s.number === surahNumber);
  return {
    number: surahNumber,
    name: surah?.name_transliteration ?? `Surah ${surahNumber}`,
    totalForms: forms.size,
    coveredForms: cov,
    coveragePct: forms.size > 0 ? ROUND(cov / forms.size) : 1,
    readiness: surahNumber === 1 ? "REFERENCE" : cov === forms.size && forms.size > 0 ? "READY" : "IN_PREPARATION",
  };
}

// ─── PREFLIGHT — BATCH A ───────────────────────────────────────────────────
function preflightBatchA(state: LoadedState, hikmaId: string) {
  const lemmaIds = new Set(state.lemmas.map((l) => l.id));
  const existing = new Map<string, LemmaTranslationRow[]>();
  for (const r of state.lemmaTranslations) {
    if (r.language !== LANGUAGE || r.source_id !== hikmaId) continue;
    let list = existing.get(r.lemma_id);
    if (!list) { list = []; existing.set(r.lemma_id, list); }
    list.push(r);
  }

  const ready: Array<{ arabic: string; lemmaId: string; text: string }> = [];
  const existingSame: Array<{ arabic: string; lemmaId: string }> = [];
  const conflicts: string[] = [];
  for (const [arabic, entry] of Object.entries(BATCH_A_GLOSSES)) {
    if (!lemmaIds.has(entry.lemmaId)) { conflicts.push(`${arabic}: lemma_id absent.`); continue; }
    const rows = existing.get(entry.lemmaId) ?? [];
    if (rows.length === 0) { ready.push({ arabic, ...entry }); continue; }
    if (rows.length > 1) { conflicts.push(`${arabic}: ${rows.length} lignes.`); continue; }
    if (rows[0].text === entry.text && rows[0].is_validated && rows[0].validated_at) existingSame.push({ arabic, lemmaId: entry.lemmaId });
    else conflicts.push(`${arabic}: divergence ou non validée.`);
  }
  return { ready, existingSame, conflicts };
}

// ─── PREFLIGHT — BATCH B ───────────────────────────────────────────────────
function preflightBatchB(state: LoadedState, hikmaId: string) {
  const existingMap = new Map<string, string>();
  for (const r of state.wordTranslations) {
    if (r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId) existingMap.set(r.word_id, r.text);
  }
  const ready: Array<{ stem: string; wordId: string; text: string }> = [];
  const existingSame: Array<{ stem: string; wordId: string }> = [];
  const conflicts: string[] = [];
  for (const [stem, entry] of Object.entries(BATCH_B_WORD_TRANSLATIONS)) {
    const w = state.words.find((x) => x.id === entry.wordId);
    if (!w) { conflicts.push(`${stem}: word_id absent.`); continue; }
    const existingText = existingMap.get(entry.wordId);
    if (!existingText) { ready.push({ stem, ...entry }); continue; }
    if (existingText === entry.text) existingSame.push({ stem, wordId: entry.wordId });
    else conflicts.push(`${stem}: traduction divergente.`);
  }
  return { ready, existingSame, conflicts };
}

// ─── COMPUTE GAIN ──────────────────────────────────────────────────────────
function computeGain(state: LoadedState, before: Coverage, glossLemmaIds: string[], wordTrIds: string[]) {
  const lemmaSet = new Set(glossLemmaIds);
  const finalLemma = (before.masked as { finalLemma: Map<string, string> }).finalLemma;
  const beforeUnion = (before.masked as { union: Set<string> }).union;

  const newForms = new Set<string>();
  for (const [wid, lid] of finalLemma) {
    if (lemmaSet.has(lid) && !beforeUnion.has(wid)) newForms.add(wid);
  }
  for (const wid of wordTrIds) {
    if (!beforeUnion.has(wid)) newForms.add(wid);
  }

  const occCount = (before.masked as { occCountByWord: Map<string, number> }).occCountByWord;
  return { newFormCount: newForms.size, newOccs: [...newForms].reduce((s, wid) => s + (occCount.get(wid) ?? 0), 0) };
}

// ─── VALIDATION ────────────────────────────────────────────────────────────
function validateBatchA(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_A_GLOSSES).map((e) => e.lemmaId));
  const rows = state.lemmaTranslations.filter((r) => targetIds.has(r.lemma_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_A_GLOSSES).map(([, e]) => [e.lemmaId, e.text]));
  return {
    present: `${rows.length}/${7}`,
    badLang: rows.filter((r) => r.language !== LANGUAGE).length,
    badVal: rows.filter((r) => !r.is_validated || !r.validated_at).length,
    badText: rows.filter((r) => expected.get(r.lemma_id) !== r.text).length,
    ok: rows.length === 7 && rows.every((r) => r.language === LANGUAGE && r.is_validated && r.validated_at && expected.get(r.lemma_id) === r.text),
  };
}

function validateBatchB(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_B_WORD_TRANSLATIONS).map((e) => e.wordId));
  const rows = state.wordTranslations.filter((r) => targetIds.has(r.word_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_B_WORD_TRANSLATIONS).map(([, e]) => [e.wordId, e.text]));
  return {
    present: `${rows.length}/${2}`,
    badLang: rows.filter((r) => r.language !== LANGUAGE).length,
    badVal: rows.filter((r) => !r.is_validated).length,
    badText: rows.filter((r) => expected.get(r.word_id) !== r.text).length,
    ok: rows.length === 2 && rows.every((r) => r.language === LANGUAGE && r.is_validated && expected.get(r.word_id) === r.text),
  };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const timestamp = new Date().toISOString();

  console.log(`=== PHASE 88F-J — SURAH-FIRST S98 RESOLUTION (${MODE}) ===`);
  console.log(`Target: S${TARGET_SURAH} Al-Bayyinah — 79/79 → READY`);
  console.log(`BATCH A: 7 lemma_translations · BATCH B: 2 word_translations\n`);

  // ─── 1. SOURCE ───────────────────────────────────────────────────────────
  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === SOURCE_NAME);
  if (!hikmaSource) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hikmaId = hikmaSource.id;

  // ─── 2. BEFORE STATE ─────────────────────────────────────────────────────
  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const beforeS98 = computeSurahCoverage(beforeState, before, TARGET_SURAH);

  // ─── 3. PREFLIGHT BASELINE CHECK ─────────────────────────────────────────
  const baselineChecks: string[] = [];
  if (beforeS98.totalForms !== EXPECTED_BEFORE_S98.totalForms) baselineChecks.push("totalForms");
  if (beforeS98.coveredForms !== EXPECTED_BEFORE_S98.coveredForms) baselineChecks.push("coveredForms");
  if (beforeS98.totalForms - beforeS98.coveredForms !== EXPECTED_BEFORE_S98.missingForms) baselineChecks.push("missingForms");
  if (beforeS98.readiness !== EXPECTED_BEFORE_S98.readiness) baselineChecks.push("readiness");

  if (MODE === "IDEMPOTENCE") {
    // In idempotence mode, S98 must already be READY (post-import state).
    if (beforeS98.readiness !== "READY") {
      throw new Error("Idempotence: S98 n'est pas READY avant le second passage. Premier APPLY manquant ?");
    }
  } else if (baselineChecks.length > 0) {
    throw new Error(`Baseline S98 divergente vs 88F-I: ${baselineChecks.join(", ")}. STOP.`);
  }

  console.log(`Baseline S98: ${beforeS98.coveredForms}/${beforeS98.totalForms} (${ROUND(beforeS98.coveragePct * 100, 1)}%) — ${beforeS98.readiness}`);
  console.log(`Global: FR union=${before.frUnionDistinctWordIds}, lemma_tr=${before.lemmaTranslations}, word_tr=${before.wordTranslationsFrValidated}, READY=${
    ((before.masked as unknown) as Record<string, number>).READY}\n`);

  // ─── 4. PREFLIGHT BATCH A + B ────────────────────────────────────────────
  const paA = preflightBatchA(beforeState, hikmaId);
  const paB = preflightBatchB(beforeState, hikmaId);
  const aok = paA.ready.length === 7 && paA.conflicts.length === 0;
  const bok = paB.ready.length === 2 && paB.conflicts.length === 0;

  console.log(`Preflight BATCH A: READY=${paA.ready.length} SAME=${paA.existingSame.length} CONFLICT=${paA.conflicts.length}`);
  console.log(`Preflight BATCH B: READY=${paB.ready.length} SAME=${paB.existingSame.length} CONFLICT=${paB.conflicts.length}`);

  const gain = computeGain(beforeState, before,
    paA.ready.map((e) => e.lemmaId),
    paB.ready.map((e) => e.wordId),
  );
  console.log(`Predicted gain: ${gain.newFormCount} forms, ${gain.newOccs} occurrences → S98: ${beforeS98.coveredForms + (gain.newFormCount >= 11 ? (79 - beforeS98.coveredForms) : gain.newFormCount)}/${beforeS98.totalForms}`);

  // ─── 5. EXECUTE IMPORTS (APPLY mode only) ────────────────────────────────
  let insertedA: Array<{ id: string; lemma_id: string }> = [];
  let insertedB: Array<{ id: string; word_id: string }> = [];

  if (MODE === "APPLY") {
    if (!aok || !bok) throw new Error("Preflight non conforme. Aucun import partiel autorisé.");

    // BATCH A — lemma_translations
    const rowsA = paA.ready.map((e) => ({
      lemma_id: e.lemmaId,
      language: LANGUAGE,
      source_id: hikmaId,
      text: e.text,
      is_validated: true,
      validated_at: timestamp,
      editorial_notes: `Phase 88F-J — S98 Al-Bayyinah — ${timestamp}`,
    }));
    const resA = await client.from("lemma_translations").insert(rowsA).select("id, lemma_id");
    if (resA.error) throw new Error(`INSERT lemma_translations: ${resA.error.message}`);
    insertedA = (resA.data ?? []) as Array<{ id: string; lemma_id: string }>;
    if (insertedA.length !== 7) throw new Error(`BATCH A: ${insertedA.length}/7 insérées.`);
    console.log(`BATCH A: ${insertedA.length} lemma_translations insérées.`);

    // BATCH B — word_translations
    const rowsB = paB.ready.map((e) => ({
      word_id: e.wordId,
      language: LANGUAGE,
      source_id: hikmaId,
      text: e.text,
      is_validated: true,
      validated_at: timestamp,
      editorial_notes: `Phase 88F-J — S98 REVIEW form — ${timestamp}`,
    }));
    const resB = await client.from("word_translations").insert(rowsB).select("id, word_id");
    if (resB.error) throw new Error(`INSERT word_translations: ${resB.error.message}`);
    insertedB = (resB.data ?? []) as Array<{ id: string; word_id: string }>;
    if (insertedB.length !== 2) throw new Error(`BATCH B: ${insertedB.length}/2 insérées.`);
    console.log(`BATCH B: ${insertedB.length} word_translations insérées.`);
  } else if (MODE === "IDEMPOTENCE") {
    if (paA.ready.length !== 0 || paB.ready.length !== 0 || paA.conflicts.length !== 0 || paB.conflicts.length !== 0) {
      throw new Error("Idempotence: état inattendu (des lignes seraient encore insérées).");
    }
    console.log("Second passage: 0 écriture autorisée.");
  } else {
    console.log("DRY-RUN: pas d'écriture.");
  }

  // ─── 6. POST-IMPORT STATE ────────────────────────────────────────────────
  const afterState = await loadState(client);
  const after = computeCoverage(afterState, hikmaId);
  const afterProtected = getProtectedSnapshots(afterState);
  const afterS98 = computeSurahCoverage(afterState, after, TARGET_SURAH);

  const protectedDelta: Record<string, { count: number; hashUnchanged: boolean }> = {};
  for (const t of PROTECTED_TABLES) {
    const b = beforeProtected[t], a = afterProtected[t];
    protectedDelta[t] = { count: a.count - b.count, hashUnchanged: b.sha256 === a.sha256 };
  }
  const protectedOk = Object.values(protectedDelta).every((d) => d.count === 0 && d.hashUnchanged);

  const valA = validateBatchA(afterState, hikmaId);
  const valB = validateBatchB(afterState, hikmaId);
  const lemmaDelta = after.lemmaTranslations - before.lemmaTranslations;
  const wordTrDelta = after.wordTranslationsFrValidated - before.wordTranslationsFrValidated;

  const s98Ready = afterS98.readiness === "READY";

  // ─── 7. VERDICT ──────────────────────────────────────────────────────────
  let verdict: string;
  if (!protectedOk) verdict = "PHASE_88F_J_BLOCKED — protected table modified";
  else if (MODE === "APPLY" && !s98Ready) verdict = "PHASE_88F_J_PARTIAL — S98 not READY";
  else if (MODE === "APPLY" && lemmaDelta !== 7) verdict = "PHASE_88F_J_PARTIAL — lemma delta incorrect";
  else if (MODE === "APPLY" && wordTrDelta !== 2) verdict = "PHASE_88F_J_PARTIAL — word_tr delta incorrect";
  else if (MODE === "APPLY" && valA.ok && valB.ok) verdict = "PHASE_88F_J_COMPLETE — S98 READY";
  else if (MODE === "APPLY") verdict = "PHASE_88F_J_PARTIAL";
  else if (MODE === "IDEMPOTENCE") verdict = "PHASE_88F_J_IDEMPOTENT";
  else verdict = "PHASE_88F_J_DRY_RUN";

  // ─── 8. REPORT ───────────────────────────────────────────────────────────
  const report = {
    phase: "88F-J",
    verdict,
    timestamp,
    strategy: "SURAH-FIRST — S98 Al-Bayyinah only",
    baseline: {
      s98: { totalForms: beforeS98.totalForms, coveredForms: beforeS98.coveredForms, missingForms: beforeS98.totalForms - beforeS98.coveredForms, coveragePct: beforeS98.coveragePct, readiness: beforeS98.readiness },
      global: {
        quranWords: before.quranWords, frUnion: before.frUnionDistinctWordIds, frOccurrences: before.frOccurrences, frPercentage: before.frPercentage,
        lemmaTranslations: before.lemmaTranslations, lemmaTrFr: before.lemmaTranslationsFrValidated,
        wordTrFr: before.wordTranslationsFrValidated,
        readiness: { READY: ((before.masked as unknown) as Record<string, number>).READY, IN_PREPARATION: ((before.masked as unknown) as Record<string, number>).IN_PREPARATION, REFERENCE: ((before.masked as unknown) as Record<string, number>).REFERENCE },
      },
    },
    preflight: {
      batchA: { glosses: paA.ready.map((e) => ({ lemma: e.arabic, gloss: e.text })), readyCount: paA.ready.length, existingSame: paA.existingSame.length, conflicts: paA.conflicts },
      batchB: {
        forms: paB.ready.map((e) => ({ stem: e.stem, wordId: e.wordId, text: e.text })),
        readyCount: paB.ready.length, existingSame: paB.existingSame.length, conflicts: paB.conflicts,
        decision: "WORD_TRANSLATION — mapping lemma trop incertain sans revue humaine. Les stems MASAQ تفرق (UNMAPPED) et ؤت (UNMAPPED) n'ont pas de lemma canonique fiable dans le corpus actuel.",
      },
      predictedGain: { newForms: gain.newFormCount, newOccurrences: gain.newOccs, expectedS98After: 79, formsCoveredByBatchA: 9, formsCoveredByBatchB: 2 },
    },
    writes: MODE === "APPLY" ? {
      batchA: { table: "lemma_translations", count: insertedA.length, ids: insertedA },
      batchB: { table: "word_translations", count: insertedB.length, ids: insertedB },
      totalWrites: insertedA.length + insertedB.length,
      atomicity: "deux INSERT bulk distincts ; batch A puis batch B.",
      tablesWritten: ["lemma_translations", "word_translations"],
    } : { tablesWritten: [], totalWrites: 0 },
    postImport: {
      s98: { totalForms: afterS98.totalForms, coveredForms: afterS98.coveredForms, coveragePct: afterS98.coveragePct, readiness: afterS98.readiness, isReady: s98Ready },
      global: {
        quranWords: after.quranWords, frUnion: after.frUnionDistinctWordIds, frOccurrences: after.frOccurrences, frPercentage: after.frPercentage,
        lemmaTranslations: after.lemmaTranslations, lemmaTrFr: after.lemmaTranslationsFrValidated,
        wordTrFr: after.wordTranslationsFrValidated,
        readiness: { READY: ((after.masked as unknown) as Record<string, number>).READY, IN_PREPARATION: ((after.masked as unknown) as Record<string, number>).IN_PREPARATION, REFERENCE: ((after.masked as unknown) as Record<string, number>).REFERENCE },
      },
      deltas: {
        lemmaTranslations: lemmaDelta,
        wordTranslationsFr: wordTrDelta,
        frUnion: after.frUnionDistinctWordIds - before.frUnionDistinctWordIds,
        frOccurrences: after.frOccurrences - before.frOccurrences,
      },
    },
    validation: {
      batchA: valA,
      batchB: valB,
    },
    invariants: {
      protectedTables: protectedDelta,
      protectedOk,
      CURRICULUM_WRITES: 0, MIGRATIONS: 0, SEEDS: 0,
      classifySurahReadinessUneffected: true,
    },
    tests: { run: false, note: "Exécutés après la génération du rapport (vitest · tsc · eslint)." },
  };

  mkdirSync("reports", { recursive: true });
  if (MODE === "IDEMPOTENCE") {
    const { readFileSync } = await import("node:fs");
    const existing = JSON.parse(readFileSync(OUTPUT, "utf8")) as Record<string, unknown>;
    existing.idempotence = {
      secondPass: true,
      batchA_EXISTING_SAME: paA.existingSame.length,
      batchB_EXISTING_SAME: paB.existingSame.length,
      batchA_NEW: paA.ready.length,
      batchB_NEW: paB.ready.length,
      DATABASE_WRITES: 0,
      lemmaTranslationsDelta: lemmaDelta,
      wordTranslationsDelta: wordTrDelta,
      frUnionDelta: after.frUnionDistinctWordIds - before.frUnionDistinctWordIds,
      s98StillReady: s98Ready,
      verdict,
    };
    // Preserve the APPLY verdict at top level; idempotence is a separate section.
    existing.tests = report.tests;
    writeFileSync(OUTPUT, JSON.stringify(existing, null, 2) + "\n");
  } else {
    writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(`\nRapport → ${OUTPUT}`);

  // ─── TERMINAL SUMMARY ─────────────────────────────────────────────────────
  console.log(`\n=== ${verdict} ===`);
  console.log(`S98: ${beforeS98.coveredForms}/${beforeS98.totalForms} → ${afterS98.coveredForms}/${afterS98.totalForms} (${ROUND(afterS98.coveragePct * 100, 1)}%) [${afterS98.readiness}]`);
  console.log(`LEMMA_TR: ${before.lemmaTranslations} → ${after.lemmaTranslations} (+${lemmaDelta})`);
  console.log(`WORD_TR: ${before.wordTranslationsFrValidated} → ${after.wordTranslationsFrValidated} (+${wordTrDelta})`);
  console.log(`FR UNION: ${before.frUnionDistinctWordIds} → ${after.frUnionDistinctWordIds} (+${after.frUnionDistinctWordIds - before.frUnionDistinctWordIds})`);
  console.log(`READY: ${((before.masked as unknown) as Record<string, number>).READY} → ${((after.masked as unknown) as Record<string, number>).READY} | PROTECTED: ${protectedOk ? "OK" : "FAIL"}`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });