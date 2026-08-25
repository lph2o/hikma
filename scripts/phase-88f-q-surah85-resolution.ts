/**
 * PHASE 88F-Q — SURAH-FIRST S85 AL-BURUJ RESOLUTION & IMPORT
 *
 * Strategy: SURAH-FIRST / READY-FIRST.
 * Target: S85 — Al-Buruj (98 forms → 100 % FR → READY).
 *
 * Batch A: 13 lemma_translations for 13 distinct lemmas (SAFE per 88F-P).
 * Batch B:  5 word_translations for  5 REVIEW forms (word-level, no mapping).
 *
 * WRITE CONTRACT
 * - Batch A: INSERT bulk in lemma_translations (13 rows).
 * - Batch B: INSERT bulk in word_translations (5 rows).
 * - No mappings, lemmas, curriculum, or MASAQ writes.
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes, verify state).
 * Default → DRY_RUN (preflight only, 0 writes).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-q-surah85-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 85;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ─── EXPECTED BASELINE (from 88F-P, verified 2026-08-24) ─────────────────
const EXPECTED_BEFORE_S85 = {
  totalForms: 98,
  coveredForms: 80,
  missingForms: 18,
  coveragePct: ROUND(80 / 98, 4),
  readiness: "IN_PREPARATION",
} as const;

// ─── BATCH A — 13 LEMMA_TRANSLATIONS (SAFE per 88F-P) ─────────────────────
const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  "بروج":  { lemmaId: "30eae095-6508-48c6-b5f4-ac305370b71a", text: "constellations / tours / signes célestes" },
  "موعود": { lemmaId: "17aede51-873c-4133-bf39-85377b4ae3c8", text: "promis / destiné / fixé" },
  "شاهد":  { lemmaId: "da7b0617-e248-45ab-9ee7-a7f571ce1dbb", text: "témoin / qui observe" },
  "مشهود": { lemmaId: "d1b451fe-7589-451f-8d11-b511fae1a39a", text: "témoigné / attesté / observé" },
  "أخدود": { lemmaId: "b2213b20-2d26-4eaf-ae2d-984761443c64", text: "fossé / tranchée / sillon" },
  "وقود":  { lemmaId: "bee67b4d-c6de-4b0a-b9d2-af3289103ec4", text: "combustible / carburant (du feu)" },
  "قعود":  { lemmaId: "6de01566-7105-4693-89e7-cde9e67bb4d5", text: "assis / installé" },
  "شهود":  { lemmaId: "7abd7022-bf0c-4c7e-8440-c60c4f4fc35a", text: "témoins / présents" },
  "ودود":  { lemmaId: "3e5c528b-10f0-4510-aaf5-823675fc9ad8", text: "aimant / affectueux / plein d'amour" },
  "مجيد":  { lemmaId: "809b7aeb-a4e7-4e35-9117-9e72425bd777", text: "glorieux / magnanime / noble" },
  "جنود":  { lemmaId: "7a8faf2f-2aa5-4167-8f7a-de6d3581a841", text: "armées / troupes / soldats" },
  "لوح":   { lemmaId: "0c71fb06-0d56-477b-9efb-4cfc8f3a1315", text: "tablette / planche / surface" },
  "محفوظ": { lemmaId: "af80f399-f2b9-4be2-9ac4-cb4c6895ab48", text: "préservé / protégé / gardé" },
};

// ─── BATCH B — 5 WORD_TRANSLATIONS (REVIEW per 88F-P) ─────────────────────
const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  "نقم":   { wordId: "07e811a1-415f-4569-8c9b-5130b6cdaa41",  text: "se venger / punir / châtier" },
  "فتن":   { wordId: "730a207b-700a-41dc-be49-f384474c5d32",  text: "persécuter / éprouver (par le feu)" },
  "بطش":   { wordId: "cfec775a-b358-467f-b469-856d04c937e9",  text: "emprise / prise violente / puissance" },
  "عيد":   { wordId: "4a2f03b3-c41f-4f84-bccd-df3276e9a954",  text: "répéter / ramener / faire revenir" },
  "تكذيب": { wordId: "2e5d73da-c90a-4221-acc0-a7ee0fda0033",  text: "démenti / accusation de mensonge" },
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
type LinguisticOccurrenceRow = { word_occurrence_id: string; hikma_lemma_id: string | null };
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

// ─── HELPERS ───────────────────────────────────────────────────────────────
function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ }
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
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function snapshotRows(rows: DbRow[]): TableSnapshot {
  return { count: rows.length, sha256: createHash("sha256").update(rows.map(stableJson).sort().join("\n")).digest("hex") };
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
      READY: ready, IN_PREPARATION: inPrep, REFERENCE: ref,
      surahForms, union, finalLemma, occCountByWord,
    },
  };
}

function computeSurahCoverage(state: LoadedState, coverage: ReturnType<typeof computeCoverage>, surahNumber: number) {
  const { surahForms, union } = coverage.masked as { surahForms: Map<number, Set<string>>; union: Set<string> };
  const forms = surahForms.get(surahNumber) ?? new Set<string>();
  let cov = 0;
  for (const wid of forms) if (union.has(wid)) cov++;
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

// ─── PREFLIGHT ─────────────────────────────────────────────────────────────
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

// ─── VALIDATION ────────────────────────────────────────────────────────────
function validateBatchA(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_A_GLOSSES).map((e) => e.lemmaId));
  const rows = state.lemmaTranslations.filter((r) => targetIds.has(r.lemma_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_A_GLOSSES).map(([, e]) => [e.lemmaId, e.text]));
  return {
    present: `${rows.length}/${13}`,
    badLang: rows.filter((r) => r.language !== LANGUAGE).length,
    badVal: rows.filter((r) => !r.is_validated || !r.validated_at).length,
    badText: rows.filter((r) => expected.get(r.lemma_id) !== r.text).length,
    ok: rows.length === 13 && rows.every((r) => r.language === LANGUAGE && r.is_validated && r.validated_at && expected.get(r.lemma_id) === r.text),
  };
}

function validateBatchB(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_B_WORD_TRANSLATIONS).map((e) => e.wordId));
  const rows = state.wordTranslations.filter((r) => targetIds.has(r.word_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_B_WORD_TRANSLATIONS).map(([, e]) => [e.wordId, e.text]));
  return {
    present: `${rows.length}/${5}`,
    badLang: rows.filter((r) => r.language !== LANGUAGE).length,
    badVal: rows.filter((r) => !r.is_validated).length,
    badText: rows.filter((r) => expected.get(r.word_id) !== r.text).length,
    ok: rows.length === 5 && rows.every((r) => r.language === LANGUAGE && r.is_validated && expected.get(r.word_id) === r.text),
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

  console.log(`=== PHASE 88F-Q — SURAH-FIRST S85 AL-BURUJ RESOLUTION (${MODE}) ===`);
  console.log(`Target: S${TARGET_SURAH} — 98/98 → READY`);
  console.log(`BATCH A: 13 lemma_translations · BATCH B: 5 word_translations\n`);

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === SOURCE_NAME);
  if (!hikmaSource) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hikmaId = hikmaSource.id;

  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const beforeS85 = computeSurahCoverage(beforeState, before, TARGET_SURAH);
  const beforeS98 = computeSurahCoverage(beforeState, before, 98);
  const beforeS92 = computeSurahCoverage(beforeState, before, 92);
  const beforeS82 = computeSurahCoverage(beforeState, before, 82);

  // Baseline check (skip for idempotence — S85 should already be READY)
  const baselineChecks: string[] = [];
  if (beforeS85.totalForms !== EXPECTED_BEFORE_S85.totalForms) baselineChecks.push("totalForms");
  if (beforeS85.coveredForms !== EXPECTED_BEFORE_S85.coveredForms) baselineChecks.push("coveredForms");
  if (beforeS85.totalForms - beforeS85.coveredForms !== EXPECTED_BEFORE_S85.missingForms) baselineChecks.push("missingForms");
  if (beforeS85.readiness !== EXPECTED_BEFORE_S85.readiness) baselineChecks.push("readiness");

  if (MODE === "IDEMPOTENCE") {
    if (beforeS85.readiness !== "READY") throw new Error("Idempotence: S85 n'est pas READY avant le second passage. Premier APPLY manquant ?");
  } else if (baselineChecks.length > 0) {
    throw new Error(`Baseline S85 divergente vs 88F-P: ${baselineChecks.join(", ")}. STOP.`);
  }
  if (beforeS98.readiness !== "READY") throw new Error("S98 n'est plus READY avant import. STOP.");
  if (beforeS92.readiness !== "READY") throw new Error("S92 n'est plus READY avant import. STOP.");
  if (beforeS82.readiness !== "READY") throw new Error("S82 n'est plus READY avant import. STOP.");

  const { READY: readyBefore, IN_PREPARATION: inPrepBefore, REFERENCE: refBefore } = before.masked as { READY: number; IN_PREPARATION: number; REFERENCE: number };
  console.log(`Baseline S85: ${beforeS85.coveredForms}/${beforeS85.totalForms} (${ROUND(beforeS85.coveragePct * 100, 1)}%) — ${beforeS85.readiness}`);
  console.log(`Global: FR union=${before.frUnionDistinctWordIds}, lemma_tr=${before.lemmaTranslations}, word_tr=${before.wordTranslationsFrValidated}, READY=${readyBefore} IN_PREP=${inPrepBefore} REF=${refBefore}`);

  const paA = preflightBatchA(beforeState, hikmaId);
  const paB = preflightBatchB(beforeState, hikmaId);
  const aok = paA.ready.length === 13 && paA.conflicts.length === 0;
  const bok = paB.ready.length === 5 && paB.conflicts.length === 0;

  console.log(`Preflight BATCH A: READY=${paA.ready.length} SAME=${paA.existingSame.length} CONFLICT=${paA.conflicts.length}`);
  console.log(`Preflight BATCH B: READY=${paB.ready.length} SAME=${paB.existingSame.length} CONFLICT=${paB.conflicts.length}`);

  let insertedA: Array<{ id: string; lemma_id: string }> = [];
  let insertedB: Array<{ id: string; word_id: string }> = [];

  if (MODE === "APPLY") {
    if (!aok || !bok) throw new Error("Preflight non conforme. Aucun import partiel autorisé.");

    const rowsA = paA.ready.map((e) => ({
      lemma_id: e.lemmaId, language: LANGUAGE, source_id: hikmaId, text: e.text,
      is_validated: true, validated_at: timestamp,
      editorial_notes: `Phase 88F-Q — S85 Al-Buruj — ${timestamp}`,
    }));
    const resA = await client.from("lemma_translations").insert(rowsA).select("id, lemma_id");
    if (resA.error) throw new Error(`INSERT lemma_translations: ${resA.error.message}`);
    insertedA = (resA.data ?? []) as Array<{ id: string; lemma_id: string }>;
    if (insertedA.length !== 13) throw new Error(`BATCH A: ${insertedA.length}/13 insérées.`);
    console.log(`BATCH A: ${insertedA.length} lemma_translations insérées.`);

    const rowsB = paB.ready.map((e) => ({
      word_id: e.wordId, language: LANGUAGE, source_id: hikmaId, text: e.text,
      is_validated: true, validated_at: timestamp,
      editorial_notes: `Phase 88F-Q — S85 REVIEW form — ${timestamp}`,
    }));
    const resB = await client.from("word_translations").insert(rowsB).select("id, word_id");
    if (resB.error) throw new Error(`INSERT word_translations: ${resB.error.message}`);
    insertedB = (resB.data ?? []) as Array<{ id: string; word_id: string }>;
    if (insertedB.length !== 5) throw new Error(`BATCH B: ${insertedB.length}/5 insérées.`);
    console.log(`BATCH B: ${insertedB.length} word_translations insérées.`);
  } else if (MODE === "IDEMPOTENCE") {
    if (paA.ready.length !== 0 || paB.ready.length !== 0 || paA.conflicts.length !== 0 || paB.conflicts.length !== 0) {
      throw new Error("Idempotence: état inattendu (des lignes seraient encore insérées).");
    }
    console.log("Second passage: 0 écriture autorisée.");
  } else {
    console.log("DRY-RUN: pas d'écriture.");
  }

  const afterState = await loadState(client);
  const after = computeCoverage(afterState, hikmaId);
  const afterProtected = getProtectedSnapshots(afterState);
  const afterS85 = computeSurahCoverage(afterState, after, TARGET_SURAH);
  const afterS98 = computeSurahCoverage(afterState, after, 98);
  const afterS92 = computeSurahCoverage(afterState, after, 92);
  const afterS82 = computeSurahCoverage(afterState, after, 82);

  const vaA = validateBatchA(afterState, hikmaId);
  const vaB = validateBatchB(afterState, hikmaId);

  // Protected tables delta
  const protectedDeltas: string[] = [];
  for (const t of PROTECTED_TABLES) {
    if (beforeProtected[t].sha256 !== afterProtected[t].sha256) protectedDeltas.push(t);
  }

  const { READY: readyAfter, IN_PREPARATION: inPrepAfter, REFERENCE: refAfter } = after.masked as { READY: number; IN_PREPARATION: number; REFERENCE: number };
  const dataWrites = insertedA.length + insertedB.length;

  // ─── IDEMPOTENCE MERGE (like 88F-L) ──────────────────────────────────────
  let existingReport: Record<string, unknown> = {};
  try {
    const raw = readFileSync(OUTPUT, "utf-8");
    existingReport = JSON.parse(raw) as Record<string, unknown>;
  } catch { /* first run */ }

  if (MODE === "IDEMPOTENCE") {
    existingReport.verdict = "PHASE_88F_Q_COMPLETE";
    existingReport.idempotence = {
      mode: "APPLY=2",
      batchA: { existingSame: paA.existingSame.length, ready: paA.ready.length, conflicts: paA.conflicts.length },
      batchB: { existingSame: paB.existingSame.length, ready: paB.ready.length, conflicts: paB.conflicts.length },
      new: 0, dataWrites: 0,
      protectedDelta: protectedDeltas.length > 0 ? protectedDeltas : "aucun",
      s85after: afterS85,
    };
  } else {
    const report = {
      phase: "88F-Q",
      verdict: afterS85.readiness === "READY" ? "PHASE_88F_Q_COMPLETE" : "PHASE_88F_Q_PARTIAL",
      mode: MODE,
      target: { number: TARGET_SURAH, name: "Al-Buruj" },
      timestamp,
      baseline: beforeS85,
      preflight: {
        batchA: { ready: paA.ready.length, existingSame: paA.existingSame.length, conflicts: paA.conflicts.length },
        batchB: { ready: paB.ready.length, existingSame: paB.existingSame.length, conflicts: paB.conflicts.length },
      },
      writes: {
        batchA: insertedA.map((r) => ({ lemma_id: r.lemma_id, id: r.id })),
        batchB: insertedB.map((r) => ({ word_id: r.word_id, id: r.id })),
        total: dataWrites,
      },
      validation: { batchA: vaA, batchB: vaB },
      after: {
        s85: afterS85,
        s98: afterS98,
        s92: afterS92,
        s82: afterS82,
        global: {
          frUnion: after.frUnionDistinctWordIds,
          lemmaTr: after.lemmaTranslations,
          lemmaTrFr: after.lemmaTranslationsFrValidated,
          wordTrFr: after.wordTranslationsFrValidated,
          READY: readyAfter, IN_PREPARATION: inPrepAfter, REFERENCE: refAfter,
        },
        delta: {
          frUnion: after.frUnionDistinctWordIds - before.frUnionDistinctWordIds,
          lemmaTrFr: after.lemmaTranslationsFrValidated - before.lemmaTranslationsFrValidated,
          wordTrFr: after.wordTranslationsFrValidated - before.wordTranslationsFrValidated,
          READY: readyAfter - readyBefore,
          IN_PREPARATION: inPrepAfter - inPrepBefore,
        },
      },
      invariants: {
        protectedTablesDelta: protectedDeltas.length > 0 ? protectedDeltas : "aucun",
        masaqWrites: 0,
        curriculumWrites: 0,
        migrations: 0,
        seeds: 0,
        classifySurahReadinessUnchanged: true,
      },
      idempotence: null,
      tests: { run: false, note: "vitest · tsc · eslint" },
    };
    // Merge idempotence section into existing report if present
    if (existingReport.idempotence) (report as Record<string, unknown>).idempotence = existingReport.idempotence;
    mkdirSync("reports", { recursive: true });
    writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  }

  console.log(`\nAfter S85: ${afterS85.coveredForms}/${afterS85.totalForms} (${ROUND(afterS85.coveragePct * 100, 1)}%) — ${afterS85.readiness}`);
  console.log(`S98=${afterS98.readiness} · S92=${afterS92.readiness} · S82=${afterS82.readiness}`);
  console.log(`Global: FR union=${after.frUnionDistinctWordIds} (+${after.frUnionDistinctWordIds - before.frUnionDistinctWordIds}), READY=${readyAfter} (+${readyAfter - readyBefore})`);
  console.log(`Validation A: ${vaA.ok ? "OK" : "FAIL"} — Validation B: ${vaB.ok ? "OK" : "FAIL"}`);
  console.log(`Protected delta: ${protectedDeltas.length > 0 ? protectedDeltas.join(", ") : "aucun"}`);
  console.log(`=== ${afterS85.readiness === "READY" ? "PHASE_88F_Q_COMPLETE — S85 READY" : "PHASE_88F_Q_PARTIAL"} ===`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });