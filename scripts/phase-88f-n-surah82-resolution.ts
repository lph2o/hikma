/**
 * PHASE 88F-N — SURAH-FIRST S82 AL-INFITAR RESOLUTION & IMPORT
 *
 * Strategy: SURAH-FIRST / READY-FIRST.
 * Target: S82 — Al-Infitar (66 forms → 100 % FR → READY).
 *
 * Batch A: 10 lemma_translations (SAFE per 88F-M).
 * Batch B: 7 word_translations (REVIEW per 88F-M, word-level, no mapping).
 *
 * WRITE CONTRACT
 * - Batch A: INSERT bulk in lemma_translations (10 rows).
 * - Batch B: INSERT bulk in word_translations (7 rows).
 * - No mappings, lemmas, curriculum, or MASAQ writes.
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes, verify state).
 * Default → DRY_RUN (preflight only, 0 writes).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-n-surah82-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 82;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const EXPECTED_BEFORE_S82 = { totalForms: 66, coveredForms: 49, missingForms: 17, coveragePct: ROUND(49 / 66, 4), readiness: "IN_PREPARATION" } as const;

const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  كواكب: { lemmaId: "711c82ec-4173-4e75-9159-607b73f709dd", text: "étoiles / astres" },
  فجر:   { lemmaId: "704ad14b-5445-4bd2-a847-010516ae2ce2", text: "faire jaillir / fendre (la terre)" },
  قبور:  { lemmaId: "fb7664d8-b6bd-4b8b-9bab-17e55b4a45a0", text: "tombes / sépultures" },
  صور:   { lemmaId: "37c176d5-bf77-48d7-bf42-af4124bccf19", text: "forme / image / façonner" },
  ركب:   { lemmaId: "c5dc6478-6cd6-4fb4-8479-1ce1a0c416c5", text: "assembler / composer" },
  حافظ:  { lemmaId: "83716d95-7091-462b-a60e-44e6b98d30c0", text: "gardien / qui préserve / protecteur" },
  كاتب:  { lemmaId: "36b5c36e-05fe-45b5-84ac-d3a6842810c2", text: "scribe / écrivain / qui écrit" },
  فجار:  { lemmaId: "6e401987-150e-4943-9313-c6955c9db476", text: "débauchés / pervers / pécheurs" },
  غائب:  { lemmaId: "cd6f9e4f-d908-4ed8-bd8a-8dc1a571e9ac", text: "absent / caché" },
  ملك:   { lemmaId: "e7dfc440-ab32-4cdf-8d60-4b89d400f78f", text: "roi / posséder / maîtriser" },
};

const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  انفطر: { wordId: "8046669c-8bad-4da8-9f5a-892b77a11fc9", text: "se fendre / s'entrouvrir" },
  انتثر: { wordId: "3d396a28-9e9a-44ce-b312-917fb6b6b767", text: "se disperser / se répandre" },
  بعثر:  { wordId: "8b8b7f45-772a-4fcf-81e2-ded3ce2b1e39", text: "être dispersé / renversé" },
  أخر:   { wordId: "0e1c439c-a45a-4d2d-a234-e85336634e03", text: "retarder / différer" },
  غر:    { wordId: "af86614b-6ae0-42bf-aabe-f3c53ca449f2", text: "tromper / séduire" },
  سوا:   { wordId: "31905a0b-c8ff-468f-884f-be9a067f2c55", text: "façonner / égaliser / proportionner" },
  عدل:   { wordId: "f0ed8f8b-3644-4447-bdd1-30dbe4d0e72d", text: "ajuster / proportionner / équilibrer" },
};

const PROTECTED_TABLES = ["quran_words", "word_lemma_mapping", "linguistic_occurrences", "lemmas", "learning_paths", "units", "lessons"] as const;

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
type LoadedState = { raw: Record<string, DbRow[]>; words: WordRow[]; occurrences: OccurrenceRow[]; ayahs: AyahRow[]; surahs: SurahRow[]; lemmas: LemmaRow[]; wlm: WlmRow[]; wordTranslations: WordTranslationRow[]; lemmaTranslations: LemmaTranslationRow[]; linguisticOccurrences: LinguisticOccurrenceRow[] };
type TableSnapshot = { count: number; sha256: string };

function loadEnvFiles(): void { for (const f of [".env.local", ".env"]) { try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ } } }
async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> { const rows: T[] = []; for (let from = 0; ; from += PAGE_SIZE) { const { data, error } = await client.from(table).select(cols).order("id").range(from, from + PAGE_SIZE - 1); if (error) throw new Error(`${table}: ${error.message}`); const page = (data ?? []) as T[]; rows.push(...page); if (page.length < PAGE_SIZE) return rows; } }
function stableJson(value: unknown): string { if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`; if (value !== null && typeof value === "object") { const obj = value as Record<string, unknown>; return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`).join(",")}}`; } return JSON.stringify(value); }
function snapshotRows(rows: DbRow[]): TableSnapshot { return { count: rows.length, sha256: createHash("sha256").update(rows.map(stableJson).sort().join("\n")).digest("hex") }; }
function increment(map: Map<string, number>, key: string): void { map.set(key, (map.get(key) ?? 0) + 1); }

async function loadState(client: SupabaseClient): Promise<LoadedState> {
  const tables = ["quran_words","word_occurrences","ayahs","surahs","lemmas","word_lemma_mapping","word_translations","lemma_translations","linguistic_occurrences","learning_paths","units","lessons"] as const;
  const loaded = await Promise.all(tables.map(async (t) => [t, await selectAll<DbRow>(client, t, "*")] as const));
  const raw = Object.fromEntries(loaded) as Record<string, DbRow[]>;
  return { raw, words: raw.quran_words as unknown as WordRow[], occurrences: raw.word_occurrences as unknown as OccurrenceRow[], ayahs: raw.ayahs as unknown as AyahRow[], surahs: raw.surahs as unknown as SurahRow[], lemmas: raw.lemmas as unknown as LemmaRow[], wlm: raw.word_lemma_mapping as unknown as WlmRow[], wordTranslations: raw.word_translations as unknown as WordTranslationRow[], lemmaTranslations: raw.lemma_translations as unknown as LemmaTranslationRow[], linguisticOccurrences: raw.linguistic_occurrences as unknown as LinguisticOccurrenceRow[] };
}
function getProtectedSnapshots(state: LoadedState): Record<string, TableSnapshot> { return Object.fromEntries(PROTECTED_TABLES.map((t) => [t, snapshotRows(state.raw[t])])); }

function computeCoverage(state: LoadedState, hikmaId: string) {
  const { words, occurrences, ayahs, surahs, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences } = state;
  const occById = new Map(occurrences.map((r) => [r.id, r]));
  const ayahById = new Map(ayahs.map((r) => [r.id, r]));
  const surahById = new Map(surahs.map((r) => [r.id, r]));
  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id) continue; const occ = occById.get(l.word_occurrence_id); if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id); }
  const wordFr = new Set(wordTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.word_id));
  const lemmaFr = new Set(lemmaTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.lemma_id));
  const union = new Set(wordFr); for (const [wid, lid] of finalLemma) if (lemmaFr.has(lid)) union.add(wid);
  const occCountByWord = new Map<string, number>(); const surahForms = new Map<number, Set<string>>();
  for (const o of occurrences) { increment(occCountByWord, o.word_id); const ayah = ayahById.get(o.ayah_id); const surah = ayah ? surahById.get(ayah.surah_id) : undefined; if (surah) { let f = surahForms.get(surah.number); if (!f) { f = new Set(); surahForms.set(surah.number, f); } f.add(o.word_id); } }
  let coveredOccs = 0; for (const wid of union) coveredOccs += occCountByWord.get(wid) ?? 0;
  let ready = 0, inPrep = 0, ref = 0;
  for (const [num, forms] of surahForms) { const cov = [...forms].filter((w) => union.has(w)).length; if (num === 1) ref++; else if (forms.size > 0 && cov === forms.size) ready++; else inPrep++; }
  return { quranWords: words.length, wordOccurrences: occurrences.length, lemmas: lemmas.length, activeLemmas: new Set(finalLemma.values()).size, wordLemmaMapping: wlm.length, wordTranslationsFrValidated: wordFr.size, lemmaTranslations: lemmaTranslations.length, lemmaTranslationsFrValidated: lemmaFr.size, linguisticOccurrences: linguisticOccurrences.length, frUnionDistinctWordIds: union.size, frOccurrences: coveredOccs, frPercentage: ROUND(union.size / words.length), masked: { READY: ready, IN_PREPARATION: inPrep, REFERENCE: ref, surahForms, union, finalLemma, occCountByWord } };
}

function computeSurahCoverage(state: LoadedState, coverage: ReturnType<typeof computeCoverage>, surahNumber: number) {
  const m = coverage.masked as { surahForms: Map<number, Set<string>>; union: Set<string> };
  const forms = m.surahForms.get(surahNumber) ?? new Set<string>(); let cov = 0; for (const wid of forms) if (m.union.has(wid)) cov++;
  const surah = state.surahs.find((s) => s.number === surahNumber);
  return { number: surahNumber, name: surah?.name_transliteration ?? `Surah ${surahNumber}`, totalForms: forms.size, coveredForms: cov, coveragePct: forms.size > 0 ? ROUND(cov / forms.size) : 1, readiness: surahNumber === 1 ? "REFERENCE" : cov === forms.size && forms.size > 0 ? "READY" : "IN_PREPARATION" };
}

function preflightBatchA(state: LoadedState, hikmaId: string) {
  const lemmaIds = new Set(state.lemmas.map((l) => l.id));
  const existing = new Map<string, LemmaTranslationRow[]>();
  for (const r of state.lemmaTranslations) { if (r.language !== LANGUAGE || r.source_id !== hikmaId) continue; let list = existing.get(r.lemma_id); if (!list) { list = []; existing.set(r.lemma_id, list); } list.push(r); }
  const ready: Array<{ arabic: string; lemmaId: string; text: string }> = []; const existingSame: Array<{ arabic: string; lemmaId: string }> = []; const conflicts: string[] = [];
  for (const [arabic, entry] of Object.entries(BATCH_A_GLOSSES)) {
    if (!lemmaIds.has(entry.lemmaId)) { conflicts.push(`${arabic}: lemma_id absent.`); continue; }
    const rows = existing.get(entry.lemmaId) ?? []; if (rows.length === 0) { ready.push({ arabic, ...entry }); continue; }
    if (rows.length > 1) { conflicts.push(`${arabic}: ${rows.length} lignes.`); continue; }
    if (rows[0].text === entry.text && rows[0].is_validated && rows[0].validated_at) existingSame.push({ arabic, lemmaId: entry.lemmaId }); else conflicts.push(`${arabic}: divergence ou non validée.`);
  }
  return { ready, existingSame, conflicts };
}

function preflightBatchB(state: LoadedState, hikmaId: string) {
  const existingMap = new Map<string, string>();
  for (const r of state.wordTranslations) { if (r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId) existingMap.set(r.word_id, r.text); }
  const ready: Array<{ stem: string; wordId: string; text: string }> = []; const existingSame: Array<{ stem: string; wordId: string }> = []; const conflicts: string[] = [];
  for (const [stem, entry] of Object.entries(BATCH_B_WORD_TRANSLATIONS)) { const w = state.words.find((x) => x.id === entry.wordId); if (!w) { conflicts.push(`${stem}: word_id absent.`); continue; } const existingText = existingMap.get(entry.wordId); if (!existingText) { ready.push({ stem, ...entry }); continue; } if (existingText === entry.text) existingSame.push({ stem, wordId: entry.wordId }); else conflicts.push(`${stem}: divergence.`); }
  return { ready, existingSame, conflicts };
}

function validateBatchA(state: LoadedState, hikmaId: string) { const targetIds = new Set(Object.values(BATCH_A_GLOSSES).map((e) => e.lemmaId)); const rows = state.lemmaTranslations.filter((r) => targetIds.has(r.lemma_id) && r.language === LANGUAGE && r.source_id === hikmaId); const expected = new Map(Object.entries(BATCH_A_GLOSSES).map(([, e]) => [e.lemmaId, e.text])); return { present: `${rows.length}/10`, badLang: rows.filter((r) => r.language !== LANGUAGE).length, badVal: rows.filter((r) => !r.is_validated || !r.validated_at).length, badText: rows.filter((r) => expected.get(r.lemma_id) !== r.text).length, ok: rows.length === 10 && rows.every((r) => r.language === LANGUAGE && r.is_validated && r.validated_at && expected.get(r.lemma_id) === r.text) }; }
function validateBatchB(state: LoadedState, hikmaId: string) { const targetIds = new Set(Object.values(BATCH_B_WORD_TRANSLATIONS).map((e) => e.wordId)); const rows = state.wordTranslations.filter((r) => targetIds.has(r.word_id) && r.language === LANGUAGE && r.source_id === hikmaId); const expected = new Map(Object.entries(BATCH_B_WORD_TRANSLATIONS).map(([, e]) => [e.wordId, e.text])); return { present: `${rows.length}/7`, badLang: rows.filter((r) => r.language !== LANGUAGE).length, badVal: rows.filter((r) => !r.is_validated).length, badText: rows.filter((r) => expected.get(r.word_id) !== r.text).length, ok: rows.length === 7 && rows.every((r) => r.language === LANGUAGE && r.is_validated && expected.get(r.word_id) === r.text) }; }

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const timestamp = new Date().toISOString();
  console.log(`=== PHASE 88F-N — SURAH-FIRST S82 AL-INFITAR RESOLUTION (${MODE}) ===`);
  console.log(`Target: S${TARGET_SURAH} — 66/66 → READY · BATCH A: 10 lemma_tr · BATCH B: 7 word_tr\n`);

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === SOURCE_NAME);
  if (!hikmaSource) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hikmaId = hikmaSource.id;

  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const beforeS82 = computeSurahCoverage(beforeState, before, TARGET_SURAH);
  for (const s of [98, 92]) { const c = computeSurahCoverage(beforeState, before, s); if (c.readiness !== "READY") throw new Error(`S${s} n'est plus READY avant import. STOP.`); }

  const bc: string[] = [];
  if (beforeS82.totalForms !== EXPECTED_BEFORE_S82.totalForms) bc.push("totalForms");
  if (beforeS82.coveredForms !== EXPECTED_BEFORE_S82.coveredForms) bc.push("coveredForms");
  if (beforeS82.totalForms - beforeS82.coveredForms !== EXPECTED_BEFORE_S82.missingForms) bc.push("missingForms");
  if (MODE === "IDEMPOTENCE") { if (beforeS82.readiness !== "READY") throw new Error("Idempotence: S82 n'est pas READY. Premier APPLY manquant ?"); }
  else if (bc.length > 0) throw new Error(`Baseline S82 divergente vs 88F-M: ${bc.join(", ")}. STOP.`);

  console.log(`Baseline S82: ${beforeS82.coveredForms}/${beforeS82.totalForms} (${ROUND(beforeS82.coveragePct * 100, 1)}%) — ${beforeS82.readiness}`);
  console.log(`Global: FR union=${before.frUnionDistinctWordIds}, lemma_tr=${before.lemmaTranslations}, word_tr=${before.wordTranslationsFrValidated}, READY=${((before.masked as unknown) as Record<string, number>).READY}`);

  const paA = preflightBatchA(beforeState, hikmaId);
  const paB = preflightBatchB(beforeState, hikmaId);
  console.log(`Preflight BATCH A: READY=${paA.ready.length} SAME=${paA.existingSame.length} CONFLICT=${paA.conflicts.length}`);
  console.log(`Preflight BATCH B: READY=${paB.ready.length} SAME=${paB.existingSame.length} CONFLICT=${paB.conflicts.length}`);

  let insertedA: Array<{ id: string; lemma_id: string }> = [];
  let insertedB: Array<{ id: string; word_id: string }> = [];
  if (MODE === "APPLY") {
    if (!(paA.ready.length + paA.existingSame.length === 10 && paA.conflicts.length === 0)) throw new Error("BATCH A preflight non conforme.");
    if (!(paB.ready.length + paB.existingSame.length === 7 && paB.conflicts.length === 0)) throw new Error("BATCH B preflight non conforme.");
    if (paA.ready.length > 0) {
      const rows = paA.ready.map((e) => ({ lemma_id: e.lemmaId, language: LANGUAGE, source_id: hikmaId, text: e.text, is_validated: true, validated_at: timestamp, editorial_notes: `Phase 88F-N — S82 Al-Infitar — ${timestamp}` }));
      const res = await client.from("lemma_translations").insert(rows).select("id, lemma_id");
      if (res.error) throw new Error(`INSERT lemma_translations: ${res.error.message}`);
      insertedA = (res.data ?? []) as Array<{ id: string; lemma_id: string }>;
      if (insertedA.length !== paA.ready.length) throw new Error(`BATCH A: ${insertedA.length}/${paA.ready.length} insérées.`);
    }
    console.log(`BATCH A: ${insertedA.length} lemma_translations insérées (${paA.existingSame.length} déjà présentes).`);
    if (paB.ready.length > 0) {
      const rows = paB.ready.map((e) => ({ word_id: e.wordId, language: LANGUAGE, source_id: hikmaId, text: e.text, is_validated: true, validated_at: timestamp, editorial_notes: `Phase 88F-N — S82 REVIEW form — ${timestamp}` }));
      const res = await client.from("word_translations").insert(rows).select("id, word_id");
      if (res.error) throw new Error(`INSERT word_translations: ${res.error.message}`);
      insertedB = (res.data ?? []) as Array<{ id: string; word_id: string }>;
      if (insertedB.length !== paB.ready.length) throw new Error(`BATCH B: ${insertedB.length}/${paB.ready.length} insérées.`);
    }
    console.log(`BATCH B: ${insertedB.length} word_translations insérées (${paB.existingSame.length} déjà présentes).`);
  } else if (MODE === "IDEMPOTENCE") {
    if (paA.ready.length !== 0 || paB.ready.length !== 0) throw new Error("Idempotence: des lignes seraient encore insérées.");
    console.log("Second passage: 0 écriture autorisée.");
  } else { console.log("DRY-RUN: pas d'écriture."); }

  const afterState = await loadState(client);
  const after = computeCoverage(afterState, hikmaId);
  const afterProtected = getProtectedSnapshots(afterState);
  const afterS82 = computeSurahCoverage(afterState, after, TARGET_SURAH);
  for (const s of [98, 92]) { const c = computeSurahCoverage(afterState, after, s); if (c.readiness !== "READY") console.error(`WARN: S${s} n'est plus READY après import !`); }

  const pd: Record<string, { count: number; hashUnchanged: boolean }> = {};
  for (const t of PROTECTED_TABLES) { const b = beforeProtected[t], a = afterProtected[t]; pd[t] = { count: a.count - b.count, hashUnchanged: b.sha256 === a.sha256 }; }
  const protOk = Object.values(pd).every((d) => d.count === 0 && d.hashUnchanged);
  const valA = validateBatchA(afterState, hikmaId);
  const valB = validateBatchB(afterState, hikmaId);
  const ltDelta = after.lemmaTranslations - before.lemmaTranslations;
  const wtDelta = after.wordTranslationsFrValidated - before.wordTranslationsFrValidated;
  const s82Ready = afterS82.readiness === "READY";
  const beforeReady = ((before.masked as unknown) as Record<string, number>).READY;
  const afterReady = ((after.masked as unknown) as Record<string, number>).READY;

  const verdict = protOk ? (MODE === "APPLY" ? (s82Ready && valA.ok && valB.ok ? "PHASE_88F_N_COMPLETE — S82 READY" : "PHASE_88F_N_PARTIAL") : MODE === "IDEMPOTENCE" ? "PHASE_88F_N_IDEMPOTENT" : "PHASE_88F_N_DRY_RUN") : "PHASE_88F_N_BLOCKED — protected table modified";

  const report = {
    phase: "88F-N", verdict, timestamp, strategy: "SURAH-FIRST — S82 Al-Infitar only",
    baseline: { s82: { totalForms: beforeS82.totalForms, coveredForms: beforeS82.coveredForms, missingForms: beforeS82.totalForms - beforeS82.coveredForms, coveragePct: beforeS82.coveragePct, readiness: beforeS82.readiness },
      global: { quranWords: before.quranWords, frUnion: before.frUnionDistinctWordIds, frOccurrences: before.frOccurrences, frPercentage: before.frPercentage, lemmaTranslations: before.lemmaTranslations, lemmaTrFr: before.lemmaTranslationsFrValidated, wordTrFr: before.wordTranslationsFrValidated, readiness: { READY: beforeReady, IN_PREPARATION: ((before.masked as unknown) as Record<string, number>).IN_PREPARATION, REFERENCE: ((before.masked as unknown) as Record<string, number>).REFERENCE } } },
    preflight: { batchA: { glosses: paA.ready.map((e) => ({ lemma: e.arabic, gloss: e.text })), readyCount: paA.ready.length, existingSame: paA.existingSame.length, conflicts: paA.conflicts }, batchB: { forms: paB.ready.map((e) => ({ stem: e.stem, wordId: e.wordId, text: e.text })), readyCount: paB.ready.length, existingSame: paB.existingSame.length, conflicts: paB.conflicts } },
    writes: { batchA: { table: "lemma_translations", count: insertedA.length, ids: insertedA }, batchB: { table: "word_translations", count: insertedB.length, ids: insertedB }, totalWrites: insertedA.length + insertedB.length, tablesWritten: ["lemma_translations", "word_translations"] },
    postImport: { s82: { totalForms: afterS82.totalForms, coveredForms: afterS82.coveredForms, coveragePct: afterS82.coveragePct, readiness: afterS82.readiness, isReady: s82Ready },
      global: { quranWords: after.quranWords, frUnion: after.frUnionDistinctWordIds, frOccurrences: after.frOccurrences, frPercentage: after.frPercentage, lemmaTranslations: after.lemmaTranslations, lemmaTrFr: after.lemmaTranslationsFrValidated, wordTrFr: after.wordTranslationsFrValidated, readiness: { READY: afterReady, IN_PREPARATION: ((after.masked as unknown) as Record<string, number>).IN_PREPARATION, REFERENCE: ((after.masked as unknown) as Record<string, number>).REFERENCE } },
      deltas: { lemmaTranslations: ltDelta, wordTranslationsFr: wtDelta, frUnion: after.frUnionDistinctWordIds - before.frUnionDistinctWordIds, frOccurrences: after.frOccurrences - before.frOccurrences } },
    validation: { batchA: valA, batchB: valB },
    invariants: { protectedTables: pd, protectedOk: protOk, CURRICULUM_WRITES: 0, MIGRATIONS: 0, SEEDS: 0 },
    tests: { run: false, note: "Exécutés après la génération du rapport (vitest · tsc · eslint)." },
  };

  mkdirSync("reports", { recursive: true });
  if (MODE === "IDEMPOTENCE") { const ex = JSON.parse(readFileSync(OUTPUT, "utf8")) as Record<string, unknown>; ex.idempotence = { secondPass: true, batchA_EXISTING_SAME: paA.existingSame.length, batchB_EXISTING_SAME: paB.existingSame.length, batchA_NEW: paA.ready.length, batchB_NEW: paB.ready.length, DATABASE_WRITES: 0, lemmaTranslationsDelta: ltDelta, wordTranslationsDelta: wtDelta, s82StillReady: s82Ready, verdict }; ex.tests = report.tests; writeFileSync(OUTPUT, JSON.stringify(ex, null, 2) + "\n"); }
  else { writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n"); }
  console.log(`\nRapport → ${OUTPUT}`);
  console.log(`\n=== ${verdict} ===`);
  console.log(`S82: ${beforeS82.coveredForms}/${beforeS82.totalForms} → ${afterS82.coveredForms}/${afterS82.totalForms} (${ROUND(afterS82.coveragePct * 100, 1)}%) [${afterS82.readiness}]`);
  console.log(`LEMMA_TR: ${before.lemmaTranslations} → ${after.lemmaTranslations} (+${ltDelta}) · WORD_TR: ${before.wordTranslationsFrValidated} → ${after.wordTranslationsFrValidated} (+${wtDelta})`);
  console.log(`READY: ${beforeReady} → ${afterReady} | PROTECTED: ${protOk ? "OK" : "FAIL"}`);
}
main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });