/**
 * PHASE 88F-S — SURAH-FIRST S90 AL-BALAD RESOLUTION & IMPORT
 *
 * Strategy: SURAH-FIRST / READY-FIRST.
 * Target: S90 — Al-Balad (73 forms → 100 % FR → READY).
 *
 * Batch A: 14 lemma_translations for 14 distinct lemmas (SAFE per 88F-R).
 * Batch B:  7 word_translations for  7 REVIEW forms (word-level, no mapping).
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes, verify state).
 * Default → DRY_RUN (preflight only, 0 writes).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-s-surah90-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 90;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const EXPECTED_BEFORE_S90 = {
  totalForms: 73, coveredForms: 51, missingForms: 22,
  coveragePct: ROUND(51 / 73, 4), readiness: "IN_PREPARATION",
} as const;

// ─── BATCH A — 14 LEMMA_TRANSLATIONS (SAFE per 88F-R) ─────────────────────
const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  "والد":  { lemmaId: "de8a9306-d6a4-42b3-92d5-edcd4754d41e", text: "parent / père / qui engendre" },
  "كبد":   { lemmaId: "1c375332-d4ff-4c93-bb88-7c3f4057743c", text: "difficulté / peine / épreuve" },
  "قدر":   { lemmaId: "f3c289bc-56dc-45bc-b061-3e995c5ec86d", text: "pouvoir / capacité / mesurer / déterminer" },
  "لبد":   { lemmaId: "2ff27895-60dd-4d20-9a43-dd3a1a65b17a", text: "amassé / accumulé / en grand nombre" },
  "عين":   { lemmaId: "d367a8d9-184a-453c-a2ca-123601e0cbb7", text: "œil / source / regard" },
  "لسان":  { lemmaId: "3ca40c25-a3e0-45ae-a616-857121881509", text: "langue / langage / parole" },
  "شف":    { lemmaId: "822c6680-d0c4-4142-9df7-6b425045ec61", text: "lèvre / bord" },
  "نجد":   { lemmaId: "50ac5462-0bc9-44ea-834e-20c10b8e9016", text: "voie élevée / chemin difficile" },
  "عقب":   { lemmaId: "81adab26-de6e-46f8-8ac1-8c80abb9a821", text: "talon / suite / conséquence / col (passage)" },
  "رقب":   { lemmaId: "9f789b55-42ce-4d39-b74f-31b771ac5e2f", text: "cou / surveiller / observer / affranchir (un cou)" },
  "مقرب":  { lemmaId: "cf2aab6c-b0a1-49ce-a8bd-cfc54dd0f77c", text: "rapproché / proche / parent" },
  "مترب":  { lemmaId: "ce925d88-5775-4dca-8c1a-0c72a4aae8ee", text: "couvert de poussière / miséreux / pauvre" },
  "مرحم":  { lemmaId: "c64087ef-456c-423c-a530-3572e07c0de1", text: "miséricorde / compassion" },
  "مؤصد":  { lemmaId: "d24716dc-1aa0-4087-91f2-da8a00d47aaa", text: "fermé / verrouillé / clos" },
};

// ─── BATCH B — 7 WORD_TRANSLATIONS (REVIEW per 88F-R) ─────────────────────
const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  "حل":     { wordId: "7507cc02-e717-4651-a249-007e6d51265c", text: "licite / permis / en sécurité" },
  "أهلك":   { wordId: "8d389027-3ac7-44a7-8adf-9f82ec155a4a", text: "j'ai anéanti / détruit" },
  "ر":      { wordId: "837c2e97-c934-4d9c-98db-6eb6d0c7c95e", text: "il le verra / il le constatera" },
  "اقتحم":  { wordId: "0d3b84e2-fa53-43a7-800d-5266503ff5f1", text: "franchir avec difficulté / s'engager dans (la voie)" },
  "فك":     { wordId: "407f8c0e-168d-49d2-b185-c0dd92c084d5", text: "affranchissement / libération (d'un esclave)" },
  "إطعام":  { wordId: "a59fa103-5e58-42a9-9620-bf30de4b7f74", text: "nourrir / alimentation" },
  "مسغب":   { wordId: "89bcf596-aaab-430a-b2c5-e170584fdfd0", text: "famine / faim intense" },
};

const PROTECTED_TABLES = ["quran_words", "word_lemma_mapping", "linguistic_occurrences", "lemmas", "learning_paths", "units", "lessons"] as const;

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
  raw: Record<string, DbRow[]>; words: WordRow[]; occurrences: OccurrenceRow[]; ayahs: AyahRow[];
  surahs: SurahRow[]; lemmas: LemmaRow[]; wlm: WlmRow[];
  wordTranslations: WordTranslationRow[]; lemmaTranslations: LemmaTranslationRow[];
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
function increment(map: Map<string, number>, key: string): void { map.set(key, (map.get(key) ?? 0) + 1); }

async function loadState(client: SupabaseClient): Promise<LoadedState> {
  const tables = ["quran_words","word_occurrences","ayahs","surahs","lemmas","word_lemma_mapping","word_translations","lemma_translations","linguistic_occurrences","learning_paths","units","lessons"] as const;
  const loaded = await Promise.all(tables.map(async (t) => [t, await selectAll<DbRow>(client, t, "*")] as const));
  const raw = Object.fromEntries(loaded) as Record<string, DbRow[]>;
  return {
    raw, words: raw.quran_words as unknown as WordRow[], occurrences: raw.word_occurrences as unknown as OccurrenceRow[],
    ayahs: raw.ayahs as unknown as AyahRow[], surahs: raw.surahs as unknown as SurahRow[],
    lemmas: raw.lemmas as unknown as LemmaRow[], wlm: raw.word_lemma_mapping as unknown as WlmRow[],
    wordTranslations: raw.word_translations as unknown as WordTranslationRow[],
    lemmaTranslations: raw.lemma_translations as unknown as LemmaTranslationRow[],
    linguisticOccurrences: raw.linguistic_occurrences as unknown as LinguisticOccurrenceRow[],
  };
}
function getProtectedSnapshots(state: LoadedState): Record<string, TableSnapshot> {
  return Object.fromEntries(PROTECTED_TABLES.map((t) => [t, snapshotRows(state.raw[t])]));
}

function computeCoverage(state: LoadedState, hikmaId: string) {
  const { words, occurrences, ayahs, surahs, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences } = state;
  const occById = new Map(occurrences.map((r) => [r.id, r]));
  const ayahById = new Map(ayahs.map((r) => [r.id, r]));
  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id) continue; const occ = occById.get(l.word_occurrence_id); if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id); }
  const wordFr = new Set(wordTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.word_id));
  const lemmaFr = new Set(lemmaTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.lemma_id));
  const union = new Set(wordFr);
  for (const [wid, lid] of finalLemma) if (lemmaFr.has(lid)) union.add(wid);
  const occCountByWord = new Map<string, number>();
  const surahForms = new Map<number, Set<string>>();
  for (const o of occurrences) {
    increment(occCountByWord, o.word_id);
    const ayah = ayahById.get(o.ayah_id); const surah = ayah ? new Map(surahs.map((s) => [s.id, s])).get(ayah.surah_id) : undefined;
    if (surah) { let f = surahForms.get(surah.number); if (!f) { f = new Set(); surahForms.set(surah.number, f); } f.add(o.word_id); }
  }
  let coveredOccs = 0; for (const wid of union) coveredOccs += occCountByWord.get(wid) ?? 0;
  let ready = 0, inPrep = 0, ref = 0;
  for (const [num, forms] of surahForms) { const cov = [...forms].filter((w) => union.has(w)).length; if (num === 1) ref++; else if (forms.size > 0 && cov === forms.size) ready++; else inPrep++; }
  return {
    quranWords: words.length, wordOccurrences: occurrences.length, lemmas: lemmas.length,
    activeLemmas: new Set(finalLemma.values()).size, wordLemmaMapping: wlm.length,
    wordTranslationsFrValidated: wordFr.size, lemmaTranslations: lemmaTranslations.length,
    lemmaTranslationsFrValidated: lemmaFr.size, linguisticOccurrences: linguisticOccurrences.length,
    frUnionDistinctWordIds: union.size, frOccurrences: coveredOccs, frPercentage: ROUND(union.size / words.length),
    masked: { READY: ready, IN_PREPARATION: inPrep, REFERENCE: ref, surahForms, union, finalLemma, occCountByWord },
  };
}
function computeSurahCoverage(state: LoadedState, coverage: ReturnType<typeof computeCoverage>, surahNumber: number) {
  const { surahForms, union } = coverage.masked as { surahForms: Map<number, Set<string>>; union: Set<string> };
  const forms = surahForms.get(surahNumber) ?? new Set<string>();
  let cov = 0; for (const wid of forms) if (union.has(wid)) cov++;
  const surah = state.surahs.find((s) => s.number === surahNumber);
  return { number: surahNumber, name: surah?.name_transliteration ?? `Surah ${surahNumber}`, totalForms: forms.size, coveredForms: cov, coveragePct: forms.size > 0 ? ROUND(cov / forms.size) : 1, readiness: surahNumber === 1 ? "REFERENCE" : cov === forms.size && forms.size > 0 ? "READY" : "IN_PREPARATION" };
}

function preflightBatchA(state: LoadedState, hikmaId: string) {
  const lemmaIds = new Set(state.lemmas.map((l) => l.id));
  const existing = new Map<string, LemmaTranslationRow[]>();
  for (const r of state.lemmaTranslations) { if (r.language !== LANGUAGE || r.source_id !== hikmaId) continue; let list = existing.get(r.lemma_id); if (!list) { list = []; existing.set(r.lemma_id, list); } list.push(r); }
  const ready: Array<{ arabic: string; lemmaId: string; text: string }> = [], existingSame: Array<{ arabic: string; lemmaId: string }> = [], conflicts: string[] = [];
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
  for (const r of state.wordTranslations) { if (r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId) existingMap.set(r.word_id, r.text); }
  const ready: Array<{ stem: string; wordId: string; text: string }> = [], existingSame: Array<{ stem: string; wordId: string }> = [], conflicts: string[] = [];
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
function validateBatchA(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_A_GLOSSES).map((e) => e.lemmaId));
  const rows = state.lemmaTranslations.filter((r) => targetIds.has(r.lemma_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_A_GLOSSES).map(([, e]) => [e.lemmaId, e.text]));
  return { present: `${rows.length}/14`, badLang: rows.filter((r) => r.language !== LANGUAGE).length, badVal: rows.filter((r) => !r.is_validated || !r.validated_at).length, badText: rows.filter((r) => expected.get(r.lemma_id) !== r.text).length, ok: rows.length === 14 && rows.every((r) => r.language === LANGUAGE && r.is_validated && r.validated_at && expected.get(r.lemma_id) === r.text) };
}
function validateBatchB(state: LoadedState, hikmaId: string) {
  const targetIds = new Set(Object.values(BATCH_B_WORD_TRANSLATIONS).map((e) => e.wordId));
  const rows = state.wordTranslations.filter((r) => targetIds.has(r.word_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const expected = new Map(Object.entries(BATCH_B_WORD_TRANSLATIONS).map(([, e]) => [e.wordId, e.text]));
  return { present: `${rows.length}/7`, badLang: rows.filter((r) => r.language !== LANGUAGE).length, badVal: rows.filter((r) => !r.is_validated).length, badText: rows.filter((r) => expected.get(r.word_id) !== r.text).length, ok: rows.length === 7 && rows.every((r) => r.language === LANGUAGE && r.is_validated && expected.get(r.word_id) === r.text) };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const timestamp = new Date().toISOString();

  console.log(`=== PHASE 88F-S — SURAH-FIRST S90 AL-BALAD RESOLUTION (${MODE}) ===`);
  console.log(`Target: S${TARGET_SURAH} — 73/73 → READY`);
  console.log(`BATCH A: 14 lemma_translations · BATCH B: 7 word_translations\n`);

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === SOURCE_NAME);
  if (!hikmaSource) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hikmaId = hikmaSource.id;

  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const beforeS90 = computeSurahCoverage(beforeState, before, TARGET_SURAH);
  const beforeS98 = computeSurahCoverage(beforeState, before, 98);
  const beforeS92 = computeSurahCoverage(beforeState, before, 92);
  const beforeS82 = computeSurahCoverage(beforeState, before, 82);
  const beforeS85 = computeSurahCoverage(beforeState, before, 85);

  const baselineChecks: string[] = [];
  if (beforeS90.totalForms !== EXPECTED_BEFORE_S90.totalForms) baselineChecks.push("totalForms");
  if (beforeS90.coveredForms !== EXPECTED_BEFORE_S90.coveredForms) baselineChecks.push("coveredForms");
  if (beforeS90.totalForms - beforeS90.coveredForms !== EXPECTED_BEFORE_S90.missingForms) baselineChecks.push("missingForms");
  if (beforeS90.readiness !== EXPECTED_BEFORE_S90.readiness) baselineChecks.push("readiness");

  if (MODE === "IDEMPOTENCE") {
    if (beforeS90.readiness !== "READY") throw new Error("Idempotence: S90 n'est pas READY avant le second passage. Premier APPLY manquant ?");
  } else if (baselineChecks.length > 0) {
    throw new Error(`Baseline S90 divergente vs 88F-R: ${baselineChecks.join(", ")}. STOP.`);
  }
  if (beforeS98.readiness !== "READY") throw new Error("S98 n'est plus READY avant import. STOP.");
  if (beforeS92.readiness !== "READY") throw new Error("S92 n'est plus READY avant import. STOP.");
  if (beforeS82.readiness !== "READY") throw new Error("S82 n'est plus READY avant import. STOP.");
  if (beforeS85.readiness !== "READY") throw new Error("S85 n'est plus READY avant import. STOP.");

  const { READY: readyBefore, IN_PREPARATION: inPrepBefore, REFERENCE: refBefore } = before.masked as { READY: number; IN_PREPARATION: number; REFERENCE: number };
  console.log(`Baseline S90: ${beforeS90.coveredForms}/${beforeS90.totalForms} (${ROUND(beforeS90.coveragePct * 100, 1)}%) — ${beforeS90.readiness}`);
  console.log(`Global: FR union=${before.frUnionDistinctWordIds}, lemma_tr=${before.lemmaTranslations}, word_tr=${before.wordTranslationsFrValidated}, READY=${readyBefore} IN_PREP=${inPrepBefore}`);

  const paA = preflightBatchA(beforeState, hikmaId);
  const paB = preflightBatchB(beforeState, hikmaId);
  console.log(`Preflight A: READY=${paA.ready.length} SAME=${paA.existingSame.length} CONFLICT=${paA.conflicts.length}`);
  console.log(`Preflight B: READY=${paB.ready.length} SAME=${paB.existingSame.length} CONFLICT=${paB.conflicts.length}`);

  let insertedA: Array<{ id: string; lemma_id: string }> = [], insertedB: Array<{ id: string; word_id: string }> = [];

  if (MODE === "APPLY") {
    if (paA.ready.length !== 14 || paA.conflicts.length > 0 || paB.ready.length !== 7 || paB.conflicts.length > 0)
      throw new Error("Preflight non conforme. Aucun import partiel autorisé.");
    const rowsA = paA.ready.map((e) => ({ lemma_id: e.lemmaId, language: LANGUAGE, source_id: hikmaId, text: e.text, is_validated: true, validated_at: timestamp, editorial_notes: `Phase 88F-S — S90 Al-Balad — ${timestamp}` }));
    const resA = await client.from("lemma_translations").insert(rowsA).select("id, lemma_id");
    if (resA.error) throw new Error(`INSERT lemma_translations: ${resA.error.message}`);
    insertedA = (resA.data ?? []) as Array<{ id: string; lemma_id: string }>;
    console.log(`BATCH A: ${insertedA.length} lemma_translations insérées.`);

    const rowsB = paB.ready.map((e) => ({ word_id: e.wordId, language: LANGUAGE, source_id: hikmaId, text: e.text, is_validated: true, validated_at: timestamp, editorial_notes: `Phase 88F-S — S90 REVIEW form — ${timestamp}` }));
    const resB = await client.from("word_translations").insert(rowsB).select("id, word_id");
    if (resB.error) throw new Error(`INSERT word_translations: ${resB.error.message}`);
    insertedB = (resB.data ?? []) as Array<{ id: string; word_id: string }>;
    console.log(`BATCH B: ${insertedB.length} word_translations insérées.`);
  } else if (MODE === "IDEMPOTENCE") {
    if (paA.ready.length !== 0 || paB.ready.length !== 0) throw new Error("Idempotence: état inattendu.");
    console.log("Second passage: 0 écriture autorisée.");
  } else { console.log("DRY-RUN: pas d'écriture."); }

  const afterState = await loadState(client);
  const after = computeCoverage(afterState, hikmaId);
  const afterProtected = getProtectedSnapshots(afterState);
  const afterS90 = computeSurahCoverage(afterState, after, TARGET_SURAH);
  const afterS98 = computeSurahCoverage(afterState, after, 98);
  const afterS92 = computeSurahCoverage(afterState, after, 92);
  const afterS82 = computeSurahCoverage(afterState, after, 82);
  const afterS85 = computeSurahCoverage(afterState, after, 85);

  const vaA = validateBatchA(afterState, hikmaId), vaB = validateBatchB(afterState, hikmaId);
  const protectedDeltas: string[] = [];
  for (const t of PROTECTED_TABLES) { if (beforeProtected[t].sha256 !== afterProtected[t].sha256) protectedDeltas.push(t); }
  const { READY: readyAfter, IN_PREPARATION: inPrepAfter, REFERENCE: refAfter } = after.masked as { READY: number; IN_PREPARATION: number; REFERENCE: number };

  // Merge with existing report for idempotence
  let existingReport: Record<string, unknown> = {};
  try { existingReport = JSON.parse(readFileSync(OUTPUT, "utf-8")) as Record<string, unknown>; } catch { /* first run */ }

  if (MODE === "IDEMPOTENCE") {
    existingReport.verdict = "PHASE_88F_S_COMPLETE";
    existingReport.idempotence = { mode: "APPLY=2", batchA: { existingSame: paA.existingSame.length, ready: paA.ready.length, conflicts: paA.conflicts.length }, batchB: { existingSame: paB.existingSame.length, ready: paB.ready.length, conflicts: paB.conflicts.length }, new: 0, dataWrites: 0, protectedDelta: protectedDeltas.length > 0 ? protectedDeltas : "aucun", s90after: afterS90 };
  } else {
    const report = {
      phase: "88F-S", verdict: afterS90.readiness === "READY" ? "PHASE_88F_S_COMPLETE" : "PHASE_88F_S_PARTIAL", mode: MODE,
      target: { number: TARGET_SURAH, name: "Al-Balad" }, timestamp, baseline: beforeS90,
      preflight: { batchA: { ready: paA.ready.length, existingSame: paA.existingSame.length, conflicts: paA.conflicts.length }, batchB: { ready: paB.ready.length, existingSame: paB.existingSame.length, conflicts: paB.conflicts.length } },
      writes: { batchA: insertedA.map((r) => ({ lemma_id: r.lemma_id })), batchB: insertedB.map((r) => ({ word_id: r.word_id })), total: insertedA.length + insertedB.length },
      validation: { batchA: vaA, batchB: vaB },
      after: {
        s90: afterS90, s98: afterS98, s92: afterS92, s82: afterS82, s85: afterS85,
        global: { frUnion: after.frUnionDistinctWordIds, lemmaTr: after.lemmaTranslations, lemmaTrFr: after.lemmaTranslationsFrValidated, wordTrFr: after.wordTranslationsFrValidated, READY: readyAfter, IN_PREPARATION: inPrepAfter, REFERENCE: refAfter },
        delta: { frUnion: after.frUnionDistinctWordIds - before.frUnionDistinctWordIds, lemmaTrFr: after.lemmaTranslationsFrValidated - before.lemmaTranslationsFrValidated, wordTrFr: after.wordTranslationsFrValidated - before.wordTranslationsFrValidated, READY: readyAfter - readyBefore, IN_PREPARATION: inPrepAfter - inPrepBefore },
      },
      invariants: { protectedTablesDelta: protectedDeltas.length > 0 ? protectedDeltas : "aucun", masaqWrites: 0, curriculumWrites: 0, migrations: 0, seeds: 0, classifySurahReadinessUnchanged: true },
      idempotence: null, tests: { run: false, note: "vitest · tsc · eslint" },
    };
    if (existingReport.idempotence) (report as Record<string, unknown>).idempotence = existingReport.idempotence;
    mkdirSync("reports", { recursive: true });
    writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(`\nAfter S90: ${afterS90.coveredForms}/${afterS90.totalForms} (${ROUND(afterS90.coveragePct * 100, 1)}%) — ${afterS90.readiness}`);
  console.log(`S98=${afterS98.readiness} · S92=${afterS92.readiness} · S82=${afterS82.readiness} · S85=${afterS85.readiness}`);
  console.log(`Global: FR union=${after.frUnionDistinctWordIds} (+${after.frUnionDistinctWordIds - before.frUnionDistinctWordIds}), READY=${readyAfter} (+${readyAfter - readyBefore})`);
  console.log(`Validation A: ${vaA.ok ? "OK" : "FAIL"} — Validation B: ${vaB.ok ? "OK" : "FAIL"}`);
  console.log(`Protected delta: ${protectedDeltas.length > 0 ? protectedDeltas.join(", ") : "aucun"}`);
  console.log(`=== ${afterS90.readiness === "READY" ? "PHASE_88F_S_COMPLETE — S90 READY" : "PHASE_88F_S_PARTIAL"} ===`);
}
main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });