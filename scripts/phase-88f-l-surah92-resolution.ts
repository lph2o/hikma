/**
 * PHASE 88F-L — SURAH-FIRST S92 AL-LAYL RESOLUTION & IMPORT
 *
 * Strategy: SURAH-FIRST / READY-FIRST.
 * Target: S92 — Al-Layl (62 forms → 100 % FR → READY).
 *
 * Batch A: 7 lemma_translations for 7 distinct lemmas (SAFE per 88F-K).
 * Batch B: 8 word_translations for 8 REVIEW forms (word-level, no mapping).
 *
 * WRITE CONTRACT
 * - Batch A: INSERT bulk in lemma_translations (7 rows).
 * - Batch B: INSERT bulk in word_translations (8 rows).
 * - No mappings, lemmas, curriculum, or MASAQ writes.
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes, verify state).
 * Default → DRY_RUN (preflight only, 0 writes).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-l-surah92-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 92;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ─── EXPECTED BASELINE (from 88F-K, confirmed 2026-08-24) ─────────────────
const EXPECTED_BEFORE_S92 = {
  totalForms: 62,
  coveredForms: 47,
  missingForms: 15,
  coveragePct: ROUND(47 / 62, 4),
  readiness: "IN_PREPARATION",
} as const;

// ─── BATCH A — 7 LEMMA_TRANSLATIONS (SAFE per 88F-K) ──────────────────────
const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  أتقى: { lemmaId: "71f19c20-a9d6-4722-b536-bb05cf84ffa2", text: "le plus pieux / craignant Dieu" },
  حسني: { lemmaId: "d53c17f6-57e6-47c7-81d7-af93033fa12a", text: "la plus belle (récompense) / le meilleur" },
  عسرى: { lemmaId: "afe85368-f5f5-4bcf-aa97-8b2d8513af5f", text: "difficulté / la plus dure (voie)" },
  جنب:  { lemmaId: "32a1dec4-4450-4bd9-b28b-ba80e57a46a2", text: "écarter / éviter / être éloigné" },
  أحد:  { lemmaId: "f8983c27-924a-464c-b366-286973a36194", text: "un / personne / quelqu'un" },
  شتى:  { lemmaId: "b134c0e2-c02c-4bfa-910f-f41dc6e6dde4", text: "dispersés / divers / séparés" },
  جزي:  { lemmaId: "1743a3d0-263e-469b-9872-941401e2b207", text: "rétribuer / récompenser" },
};

// ─── BATCH B — 8 WORD_TRANSLATIONS (REVIEW per 88F-K) ─────────────────────
const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  سعي:   { wordId: "a05da7b5-8a41-4d60-9444-5cd2fd0f2071", text: "effort / s'efforcer / agir" },
  يسر:   { wordId: "ed0ee449-5926-4798-882c-65ae0c55c443", text: "faciliter / rendre aisé" },
  بخل:   { wordId: "2a7d6fcc-7faa-409d-8436-28e9df4b4e06", text: "être avare / refuser (par avarice)" },
  استغنى: { wordId: "054cc854-8daa-4c2b-a92a-0abbd269a0c0", text: "se passer de / se suffire à soi-même" },
  تردى:  { wordId: "1ad289c0-d33c-4614-bce7-7e037de96a83", text: "tomber / se précipiter (vers la perte)" },
  أنذر:  { wordId: "93eca711-986a-4bcd-9809-972c23b16689", text: "avertir / mettre en garde" },
  تلظى:  { wordId: "9ca6c518-793d-4d38-b85f-871ca0f8ffff", text: "flamber / s'embraser" },
  صلا:   { wordId: "4d12ce47-2345-444d-b107-402ef04382c6", text: "brûler / endurer (le feu)" },
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

function computeSurahCoverage(state: LoadedState, coverage: ReturnType<typeof computeCoverage>, surahNumber: number) {
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
    present: `${rows.length}/${8}`,
    badLang: rows.filter((r) => r.language !== LANGUAGE).length,
    badVal: rows.filter((r) => !r.is_validated).length,
    badText: rows.filter((r) => expected.get(r.word_id) !== r.text).length,
    ok: rows.length === 8 && rows.every((r) => r.language === LANGUAGE && r.is_validated && expected.get(r.word_id) === r.text),
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

  console.log(`=== PHASE 88F-L — SURAH-FIRST S92 AL-LAYL RESOLUTION (${MODE}) ===`);
  console.log(`Target: S${TARGET_SURAH} — 62/62 → READY`);
  console.log(`BATCH A: 7 lemma_translations · BATCH B: 8 word_translations\n`);

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === SOURCE_NAME);
  if (!hikmaSource) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hikmaId = hikmaSource.id;

  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const beforeS92 = computeSurahCoverage(beforeState, before, TARGET_SURAH);
  const beforeS98 = computeSurahCoverage(beforeState, before, 98);

  // Baseline check (only for non-idempotence)
  const baselineChecks: string[] = [];
  if (beforeS92.totalForms !== EXPECTED_BEFORE_S92.totalForms) baselineChecks.push("totalForms");
  if (beforeS92.coveredForms !== EXPECTED_BEFORE_S92.coveredForms) baselineChecks.push("coveredForms");
  if (beforeS92.totalForms - beforeS92.coveredForms !== EXPECTED_BEFORE_S92.missingForms) baselineChecks.push("missingForms");
  if (beforeS92.readiness !== EXPECTED_BEFORE_S92.readiness) baselineChecks.push("readiness");

  if (MODE === "IDEMPOTENCE") {
    if (beforeS92.readiness !== "READY") throw new Error("Idempotence: S92 n'est pas READY avant le second passage. Premier APPLY manquant ?");
  } else if (baselineChecks.length > 0) {
    throw new Error(`Baseline S92 divergente vs 88F-K: ${baselineChecks.join(", ")}. STOP.`);
  }
  if (beforeS98.readiness !== "READY") throw new Error("S98 n'est plus READY avant import. STOP.");

  console.log(`Baseline S92: ${beforeS92.coveredForms}/${beforeS92.totalForms} (${ROUND(beforeS92.coveragePct * 100, 1)}%) — ${beforeS92.readiness}`);
  console.log(`Global: FR union=${before.frUnionDistinctWordIds}, lemma_tr=${before.lemmaTranslations}, word_tr=${before.wordTranslationsFrValidated}, READY=${((before.masked as unknown) as Record<string, number>).READY}`);

  const paA = preflightBatchA(beforeState, hikmaId);
  const paB = preflightBatchB(beforeState, hikmaId);
  const aok = paA.ready.length === 7 && paA.conflicts.length === 0;
  const bok = paB.ready.length === 8 && paB.conflicts.length === 0;

  console.log(`Preflight BATCH A: READY=${paA.ready.length} SAME=${paA.existingSame.length} CONFLICT=${paA.conflicts.length}`);
  console.log(`Preflight BATCH B: READY=${paB.ready.length} SAME=${paB.existingSame.length} CONFLICT=${paB.conflicts.length}`);

  let insertedA: Array<{ id: string; lemma_id: string }> = [];
  let insertedB: Array<{ id: string; word_id: string }> = [];

  if (MODE === "APPLY") {
    if (!aok || !bok) throw new Error("Preflight non conforme. Aucun import partiel autorisé.");

    const rowsA = paA.ready.map((e) => ({
      lemma_id: e.lemmaId, language: LANGUAGE, source_id: hikmaId, text: e.text,
      is_validated: true, validated_at: timestamp,
      editorial_notes: `Phase 88F-L — S92 Al-Layl — ${timestamp}`,
    }));
    const resA = await client.from("lemma_translations").insert(rowsA).select("id, lemma_id");
    if (resA.error) throw new Error(`INSERT lemma_translations: ${resA.error.message}`);
    insertedA = (resA.data ?? []) as Array<{ id: string; lemma_id: string }>;
    if (insertedA.length !== 7) throw new Error(`BATCH A: ${insertedA.length}/7 insérées.`);
    console.log(`BATCH A: ${insertedA.length} lemma_translations insérées.`);

    const rowsB = paB.ready.map((e) => ({
      word_id: e.wordId, language: LANGUAGE, source_id: hikmaId, text: e.text,
      is_validated: true, validated_at: timestamp,
      editorial_notes: `Phase 88F-L — S92 REVIEW form — ${timestamp}`,
    }));
    const resB = await client.from("word_translations").insert(rowsB).select("id, word_id");
    if (resB.error) throw new Error(`INSERT word_translations: ${resB.error.message}`);
    insertedB = (resB.data ?? []) as Array<{ id: string; word_id: string }>;
    if (insertedB.length !== 8) throw new Error(`BATCH B: ${insertedB.length}/8 insérées.`);
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
  const afterS92 = computeSurahCoverage(afterState, after, TARGET_SURAH);
  const afterS98 = computeSurahCoverage(afterState, after, 98);

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
  const s92Ready = afterS92.readiness === "READY";
  const s98StillReady = afterS98.readiness === "READY";

  let verdict: string;
  if (!protectedOk) verdict = "PHASE_88F_L_BLOCKED — protected table modified";
  else if (!s98StillReady) verdict = "PHASE_88F_L_BLOCKED — S98 regressed";
  else if (MODE === "APPLY" && !s92Ready) verdict = "PHASE_88F_L_PARTIAL — S92 not READY";
  else if (MODE === "APPLY" && lemmaDelta !== 7) verdict = "PHASE_88F_L_PARTIAL — lemma delta incorrect";
  else if (MODE === "APPLY" && wordTrDelta !== 8) verdict = "PHASE_88F_L_PARTIAL — word_tr delta incorrect";
  else if (MODE === "APPLY" && valA.ok && valB.ok) verdict = "PHASE_88F_L_COMPLETE — S92 READY";
  else if (MODE === "APPLY") verdict = "PHASE_88F_L_PARTIAL";
  else if (MODE === "IDEMPOTENCE") verdict = "PHASE_88F_L_IDEMPOTENT";
  else verdict = "PHASE_88F_L_DRY_RUN";

  const report = {
    phase: "88F-L",
    verdict,
    timestamp,
    strategy: "SURAH-FIRST — S92 Al-Layl only",
    baseline: {
      s92: { totalForms: beforeS92.totalForms, coveredForms: beforeS92.coveredForms, missingForms: beforeS92.totalForms - beforeS92.coveredForms, coveragePct: beforeS92.coveragePct, readiness: beforeS92.readiness },
      s98: { readiness: beforeS98.readiness },
      global: {
        quranWords: before.quranWords, frUnion: before.frUnionDistinctWordIds, frOccurrences: before.frOccurrences, frPercentage: before.frPercentage,
        lemmaTranslations: before.lemmaTranslations, lemmaTrFr: before.lemmaTranslationsFrValidated,
        wordTrFr: before.wordTranslationsFrValidated,
        readiness: { READY: ((before.masked as unknown) as Record<string, number>).READY, IN_PREPARATION: ((before.masked as unknown) as Record<string, number>).IN_PREPARATION, REFERENCE: ((before.masked as unknown) as Record<string, number>).REFERENCE },
      },
    },
    preflight: {
      batchA: { glosses: paA.ready.map((e) => ({ lemma: e.arabic, gloss: e.text })), readyCount: paA.ready.length, existingSame: paA.existingSame.length, conflicts: paA.conflicts },
      batchB: { forms: paB.ready.map((e) => ({ stem: e.stem, wordId: e.wordId, text: e.text })), readyCount: paB.ready.length, existingSame: paB.existingSame.length, conflicts: paB.conflicts },
    },
    writes: MODE === "APPLY" ? {
      batchA: { table: "lemma_translations", count: insertedA.length, ids: insertedA },
      batchB: { table: "word_translations", count: insertedB.length, ids: insertedB },
      totalWrites: insertedA.length + insertedB.length,
      tablesWritten: ["lemma_translations", "word_translations"],
    } : { tablesWritten: [], totalWrites: 0 },
    postImport: {
      s92: { totalForms: afterS92.totalForms, coveredForms: afterS92.coveredForms, coveragePct: afterS92.coveragePct, readiness: afterS92.readiness, isReady: s92Ready },
      s98: { readiness: afterS98.readiness, stillReady: s98StillReady },
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
    validation: { batchA: valA, batchB: valB },
    invariants: {
      protectedTables: protectedDelta,
      protectedOk,
      CURRICULUM_WRITES: 0, MIGRATIONS: 0, SEEDS: 0,
      classifySurahReadinessUnchanged: true,
    },
    tests: { run: false, note: "Exécutés après la génération du rapport (vitest · tsc · eslint)." },
  };

  mkdirSync("reports", { recursive: true });
  if (MODE === "IDEMPOTENCE") {
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
      s92StillReady: s92Ready,
      s98StillReady,
      verdict,
    };
    existing.tests = report.tests;
    writeFileSync(OUTPUT, JSON.stringify(existing, null, 2) + "\n");
  } else {
    writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(`\nRapport → ${OUTPUT}`);

  console.log(`\n=== ${verdict} ===`);
  console.log(`S92: ${beforeS92.coveredForms}/${beforeS92.totalForms} → ${afterS92.coveredForms}/${afterS92.totalForms} (${ROUND(afterS92.coveragePct * 100, 1)}%) [${afterS92.readiness}]`);
  console.log(`S98: ${beforeS98.readiness} → ${afterS98.readiness} (still READY: ${s98StillReady})`);
  console.log(`LEMMA_TR: ${before.lemmaTranslations} → ${after.lemmaTranslations} (+${lemmaDelta})`);
  console.log(`WORD_TR: ${before.wordTranslationsFrValidated} → ${after.wordTranslationsFrValidated} (+${wordTrDelta})`);
  console.log(`FR UNION: ${before.frUnionDistinctWordIds} → ${after.frUnionDistinctWordIds} (+${after.frUnionDistinctWordIds - before.frUnionDistinctWordIds})`);
  console.log(`READY: ${((before.masked as unknown) as Record<string, number>).READY} → ${((after.masked as unknown) as Record<string, number>).READY} | PROTECTED: ${protectedOk ? "OK" : "FAIL"}`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });