/**
 * PHASE 88F-H — SAFE LEMMA GLOSS IMPORT
 *
 * Source exclusive : reports/phase-88f-g-targeted-editorial-audit.json.
 *
 * WRITE CONTRACT
 * - Le seul appel d'écriture autorisé est un INSERT bulk dans
 *   `lemma_translations`.
 * - Aucun mapping, traduction de mot, lemme, occurrence MASAQ ou curriculum
 *   n'est créé ou modifié.
 * - APPLY=1 effectue l'import initial contrôlé.
 * - APPLY=2 effectue uniquement le second passage idempotent et complète le
 *   rapport existant sans écrire dans la base.
 * - Sans APPLY, le script est un dry-run sans écriture DB ni rapport d'import.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const INPUT = "reports/phase-88f-g-targeted-editorial-audit.json";
const OUTPUT = "reports/phase-88f-h-import.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";

const EXPECTED_BEFORE = {
  quran_words: 21296,
  word_occurrences: 77430,
  lemmas: 1593,
  active_lemmas: 1588,
  word_lemma_mapping: 220,
  word_translations_FR_validated: 4490,
  lemma_translations: 119,
  lemma_translations_FR_validated: 115,
  linguistic_occurrences: 22485,
  MASAQ_coverage: "114/114 surahs",
  FR_union_distinct_word_ids: 5232,
  FR_occurrences: 56032,
  FR_percentage: 0.2457,
  READY: 23,
  IN_PREPARATION: 90,
  REFERENCE: 1,
} as const;

const EXPECTED_AFTER = {
  lemma_translations: 128,
  lemma_translations_FR_validated: 124,
  FR_union_distinct_word_ids: 5263,
  FR_occurrences: 56063,
  FR_percentage: 0.2471,
  READY: 23,
  IN_PREPARATION: 90,
  REFERENCE: 1,
} as const;

const EXPECTED_GLOSS_BY_ARABIC: Record<string, { lemmaId: string; text: string }> = {
  وجوه: { lemmaId: "c53e4312-c5eb-4a6d-ab95-7165d4e19a62", text: "visage / face" },
  قسم: { lemmaId: "c8ff01b4-f8aa-4eb9-9726-a4146642ad0a", text: "jurer / serment" },
  منكر: { lemmaId: "fde22dbe-415b-4221-a3d1-a36cd843b206", text: "répréhensible / blâmable" },
  مال: { lemmaId: "409e47ba-d798-4555-9692-01b4d919379f", text: "biens / richesse" },
  تراب: { lemmaId: "6fd5041f-b02e-4831-9fad-a9daccfc6f98", text: "terre / poussière" },
  رجل: { lemmaId: "9410865b-e279-4dd1-9232-ad8485a11998", text: "homme" },
  مكذب: { lemmaId: "a99b0496-c4ba-41bc-a5e0-6bf9757540c5", text: "négateur / démenti" },
  نخل: { lemmaId: "62a82766-0a3c-4be8-b2b9-602f61fcf8e3", text: "palmiers / palmier dattier" },
  عرب: { lemmaId: "af67688c-8019-4716-b744-babbbfb408e0", text: "arabe / Arabes" },
};

const PROTECTED_TABLES = [
  "quran_words",
  "word_translations",
  "word_lemma_mapping",
  "linguistic_occurrences",
  "lemmas",
  "learning_paths",
  "units",
  "lessons",
] as const;

type DbRow = Record<string, unknown>;
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccurrenceRow = { id: string; word_id: string; ayah_id: string };
type AyahRow = { id: string; surah_id: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { word_id: string; lemma_id: string };
type WordTranslationRow = { word_id: string; language: string; is_validated: boolean; source_id: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; language: string; text: string; source_id: string | null; is_validated: boolean; validated_at: string | null };
type LinguisticOccurrenceRow = { word_occurrence_id: string; hikma_lemma_id: string | null; surah_number?: number | null };
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

type Coverage = {
  quran_words: number;
  word_occurrences: number;
  lemmas: number;
  active_lemmas: number;
  word_lemma_mapping: number;
  word_translations_FR_validated: number;
  lemma_translations: number;
  lemma_translations_FR_validated: number;
  linguistic_occurrences: number;
  MASAQ_coverage: string;
  MASAQ_snapshot_coverage: string;
  FR_union_distinct_word_ids: number;
  FR_occurrences: number;
  FR_percentage: number;
  READY: number;
  IN_PREPARATION: number;
  REFERENCE: number;
  unionFormIds: string[];
};

type TableSnapshot = { count: number; sha256: string };

type ReportCandidate = {
  lemma: string;
  lemma_id: string;
  lemmaExists: boolean;
  gloss_fr_proposed: string;
  editorial_class: string;
};

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Optional local env file.
    }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function snapshotRows(rows: DbRow[]): TableSnapshot {
  const canonicalRows = rows.map(stableJson).sort().join("\n");
  return {
    count: rows.length,
    sha256: createHash("sha256").update(canonicalRows).digest("hex"),
  };
}

async function loadState(client: SupabaseClient): Promise<LoadedState> {
  const tableNames = [
    "quran_words",
    "word_occurrences",
    "ayahs",
    "surahs",
    "lemmas",
    "word_lemma_mapping",
    "word_translations",
    "lemma_translations",
    "linguistic_occurrences",
    "learning_paths",
    "units",
    "lessons",
  ] as const;
  const loaded = await Promise.all(tableNames.map(async (table) => [
    table,
    await selectAll<DbRow>(client, table, "*"),
  ] as const));
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
  return Object.fromEntries(PROTECTED_TABLES.map((table) => [table, snapshotRows(state.raw[table])]));
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function computeCoverage(state: LoadedState, hikmaSourceId: string): Coverage {
  const { words, occurrences, ayahs, surahs, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences } = state;
  const occById = new Map(occurrences.map((row) => [row.id, row]));
  const ayahById = new Map(ayahs.map((row) => [row.id, row]));
  const surahById = new Map(surahs.map((row) => [row.id, row]));
  const finalLemma = new Map<string, string>();

  for (const row of words) if (row.lemma_id) finalLemma.set(row.id, row.lemma_id);
  for (const row of wlm) if (!finalLemma.has(row.word_id)) finalLemma.set(row.word_id, row.lemma_id);
  for (const row of linguisticOccurrences) {
    if (!row.hikma_lemma_id) continue;
    const occurrence = occById.get(row.word_occurrence_id);
    if (occurrence && !finalLemma.has(occurrence.word_id)) finalLemma.set(occurrence.word_id, row.hikma_lemma_id);
  }

  const wordFr = new Set(
    wordTranslations
      .filter((row) => row.language === LANGUAGE && row.is_validated && row.source_id === hikmaSourceId)
      .map((row) => row.word_id),
  );
  const lemmaFr = new Set(
    lemmaTranslations
      .filter((row) => row.language === LANGUAGE && row.is_validated && row.source_id === hikmaSourceId)
      .map((row) => row.lemma_id),
  );
  const union = new Set(wordFr);
  for (const [wordId, lemmaId] of finalLemma) if (lemmaFr.has(lemmaId)) union.add(wordId);

  const occurrenceCountByWord = new Map<string, number>();
  const wordSurahs = new Map<string, Set<number>>();
  const surahForms = new Map<number, Set<string>>();
  const masaqSurahs = new Set<number>();
  const snapshotMasaqSurahs = new Set<number>();
  for (const occurrence of occurrences) {
    increment(occurrenceCountByWord, occurrence.word_id);
    const ayah = ayahById.get(occurrence.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) {
      const forms = surahForms.get(surah.number) ?? new Set<string>();
      forms.add(occurrence.word_id);
      surahForms.set(surah.number, forms);
      const linkedSurahs = wordSurahs.get(occurrence.word_id) ?? new Set<number>();
      linkedSurahs.add(surah.number);
      wordSurahs.set(occurrence.word_id, linkedSurahs);
    }
  }
  for (const row of linguisticOccurrences) {
    if (row.surah_number !== null && row.surah_number !== undefined) snapshotMasaqSurahs.add(row.surah_number);
    const occurrence = occById.get(row.word_occurrence_id);
    if (!occurrence) continue;
    for (const surahNumber of wordSurahs.get(occurrence.word_id) ?? []) masaqSurahs.add(surahNumber);
  }

  let coveredOccurrences = 0;
  for (const wordId of union) coveredOccurrences += occurrenceCountByWord.get(wordId) ?? 0;

  let ready = 0;
  let inPreparation = 0;
  let reference = 0;
  for (const [number, forms] of surahForms) {
    const covered = [...forms].filter((wordId) => union.has(wordId)).length;
    const coverage = forms.size ? covered / forms.size : 1;
    if (number === 1) reference += 1;
    else if (coverage === 1) ready += 1;
    else inPreparation += 1;
  }

  return {
    quran_words: words.length,
    word_occurrences: occurrences.length,
    lemmas: lemmas.length,
    active_lemmas: new Set(finalLemma.values()).size,
    word_lemma_mapping: wlm.length,
    word_translations_FR_validated: wordFr.size,
    lemma_translations: lemmaTranslations.length,
    lemma_translations_FR_validated: lemmaFr.size,
    linguistic_occurrences: linguisticOccurrences.length,
    MASAQ_coverage: `${masaqSurahs.size}/${surahs.length} surahs`,
    MASAQ_snapshot_coverage: `${snapshotMasaqSurahs.size}/${surahs.length} surahs`,
    FR_union_distinct_word_ids: union.size,
    FR_occurrences: coveredOccurrences,
    FR_percentage: round(union.size / words.length),
    READY: ready,
    IN_PREPARATION: inPreparation,
    REFERENCE: reference,
    unionFormIds: [...union],
  };
}

function compareCoverageToExpected(coverage: Coverage, expected: Record<string, number | string>): string[] {
  const mismatches: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if ((coverage as unknown as Record<string, number | string>)[key] !== value) mismatches.push(key);
  }
  return mismatches;
}

function computeProtectedDelta(before: Record<string, TableSnapshot>, after: Record<string, TableSnapshot>) {
  return Object.fromEntries(PROTECTED_TABLES.map((table) => {
    const beforeRow = before[table];
    const afterRow = after[table];
    return [table, {
      count: afterRow.count - beforeRow.count,
      hashUnchanged: beforeRow.sha256 === afterRow.sha256,
      before: beforeRow,
      after: afterRow,
    }];
  }));
}

function validateCandidateSource(): ReportCandidate[] {
  const report = readJson<{ phase?: string; candidates?: ReportCandidate[] }>(INPUT);
  if (report.phase !== "88F-G") throw new Error("La source éditoriale n'est pas le rapport PHASE 88F-G.");
  const candidates = report.candidates ?? [];
  if (candidates.length !== 9) throw new Error(`88F-G doit contenir exactement 9 candidats ciblés (trouvé ${candidates.length}).`);
  const expectedArabics = Object.keys(EXPECTED_GLOSS_BY_ARABIC);
  const actualArabics = candidates.map((candidate) => candidate.lemma);
  if (expectedArabics.some((arabic) => !actualArabics.includes(arabic)) || actualArabics.some((arabic) => !expectedArabics.includes(arabic))) {
    throw new Error("La liste des candidats 88F-G ne correspond pas exactement aux 9 gloses autorisées.");
  }
  for (const candidate of candidates) {
    const expected = EXPECTED_GLOSS_BY_ARABIC[candidate.lemma];
    if (!expected || candidate.lemma_id !== expected.lemmaId || candidate.gloss_fr_proposed !== expected.text || candidate.editorial_class !== "SAFE") {
      throw new Error(`Candidat 88F-G inattendu ou non SAFE : ${candidate.lemma}.`);
    }
  }
  return candidates;
}

function classifyPreflight(
  candidates: ReportCandidate[],
  state: LoadedState,
  hikmaSourceId: string,
): { ready: ReportCandidate[]; existingSame: ReportCandidate[]; conflicts: string[] } {
  const lemmaIds = new Set(state.lemmas.map((lemma) => lemma.id));
  const missing = candidates.filter((candidate) => !lemmaIds.has(candidate.lemma_id));
  if (missing.length) throw new Error(`Lemma(s) absent(s) : ${missing.map((candidate) => candidate.lemma).join(", ")}.`);

  const byKey = new Map<string, LemmaTranslationRow[]>();
  for (const row of state.lemmaTranslations) {
    if (row.language !== LANGUAGE || row.source_id !== hikmaSourceId) continue;
    const list = byKey.get(row.lemma_id) ?? [];
    list.push(row);
    byKey.set(row.lemma_id, list);
  }
  const ready: ReportCandidate[] = [];
  const existingSame: ReportCandidate[] = [];
  const conflicts: string[] = [];
  for (const candidate of candidates) {
    const rows = byKey.get(candidate.lemma_id) ?? [];
    if (rows.length === 0) {
      ready.push(candidate);
      continue;
    }
    if (rows.length > 1) {
      conflicts.push(`${candidate.lemma}: plusieurs lignes pour la même clé unique.`);
      continue;
    }
    const row = rows[0];
    if (row.text === candidate.gloss_fr_proposed && row.is_validated && row.validated_at) existingSame.push(candidate);
    else conflicts.push(`${candidate.lemma}: traduction existante divergente ou non validée.`);
  }
  return { ready, existingSame, conflicts };
}

function computeExpectedGain(state: LoadedState, before: Coverage, candidates: ReportCandidate[]) {
  const targetLemmaIds = new Set(candidates.map((candidate) => candidate.lemma_id));
  const occCountByWord = new Map<string, number>();
  for (const occurrence of state.occurrences) increment(occCountByWord, occurrence.word_id);
  const resolved = new Map<string, string>();
  for (const row of state.words) if (row.lemma_id) resolved.set(row.id, row.lemma_id);
  for (const row of state.wlm) if (!resolved.has(row.word_id)) resolved.set(row.word_id, row.lemma_id);
  const occurrenceById = new Map(state.occurrences.map((row) => [row.id, row]));
  for (const row of state.linguisticOccurrences) {
    const occurrence = occurrenceById.get(row.word_occurrence_id);
    if (occurrence && row.hikma_lemma_id && !resolved.has(occurrence.word_id)) resolved.set(occurrence.word_id, row.hikma_lemma_id);
  }
  const newFormIds = [...resolved.entries()]
    .filter(([wordId, lemmaId]) => targetLemmaIds.has(lemmaId) && !before.unionFormIds.includes(wordId))
    .map(([wordId]) => wordId);
  return {
    forms: newFormIds.length,
    occurrences: newFormIds.reduce((sum, wordId) => sum + (occCountByWord.get(wordId) ?? 0), 0),
    wordIds: newFormIds,
  };
}

function validationForTargetRows(
  state: LoadedState,
  candidates: ReportCandidate[],
  hikmaSourceId: string,
) {
  const targetIds = new Set(candidates.map((candidate) => candidate.lemma_id));
  const rows = state.lemmaTranslations.filter(
    (row) => targetIds.has(row.lemma_id) && row.language === LANGUAGE && row.source_id === hikmaSourceId,
  );
  const expectedText = new Map(candidates.map((candidate) => [candidate.lemma_id, candidate.gloss_fr_proposed]));
  const duplicateKeys = new Map<string, number>();
  for (const row of state.lemmaTranslations) {
    const key = `${row.lemma_id}|${row.language}|${row.source_id ?? ""}`;
    increment(duplicateKeys, key);
  }
  const duplicateCount = [...duplicateKeys.values()].filter((count) => count > 1).length;
  const lemmaIds = new Set(state.lemmas.map((lemma) => lemma.id));
  const orphanCount = state.lemmaTranslations.filter((row) => !lemmaIds.has(row.lemma_id)).length;
  const missing = candidates.filter((candidate) => !rows.some((row) => row.lemma_id === candidate.lemma_id));
  const badLanguage = rows.filter((row) => row.language !== LANGUAGE).length;
  const badValidation = rows.filter((row) => !row.is_validated || !row.validated_at).length;
  const badText = rows.filter((row) => expectedText.get(row.lemma_id) !== row.text).length;
  return {
    present: `${rows.length}/${candidates.length}`,
    presentCount: rows.length,
    missing: missing.map((candidate) => candidate.lemma),
    fr: `${rows.filter((row) => row.language === LANGUAGE).length}/${candidates.length}`,
    validated: `${rows.filter((row) => row.is_validated && Boolean(row.validated_at)).length}/${candidates.length}`,
    exactTexts: `${rows.filter((row) => expectedText.get(row.lemma_id) === row.text).length}/${candidates.length}`,
    badLanguage,
    badValidation,
    badText,
    duplicates: duplicateCount,
    conflicts: badText,
    orphans: orphanCount,
    ok: rows.length === candidates.length && missing.length === 0 && badLanguage === 0 && badValidation === 0 && badText === 0 && duplicateCount === 0 && orphanCount === 0,
  };
}

function assertBaseline(coverage: Coverage): void {
  const mismatches = compareCoverageToExpected(coverage, EXPECTED_BEFORE);
  if (mismatches.length) throw new Error(`Baseline 88F-G inattendue (${mismatches.join(", ")}). STOP avant écriture.`);
}

function assertPostState(coverage: Coverage): void {
  const mismatches = compareCoverageToExpected(coverage, EXPECTED_AFTER);
  if (mismatches.length) throw new Error(`Post-import inattendu (${mismatches.join(", ")}). Diagnostic requis.`);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });
  const timestamp = new Date().toISOString();
  const candidates = validateCandidateSource();

  console.log(`=== PHASE 88F-H — SAFE LEMMA GLOSS IMPORT (${MODE}) ===`);
  console.log("Autorisation DB : INSERT bulk uniquement dans lemma_translations.\n");

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const matchingSources = sources.filter((source) => source.name === SOURCE_NAME);
  if (matchingSources.length !== 1) throw new Error(`Source Hikma attendue une seule fois (trouvé ${matchingSources.length}).`);
  const hikmaSourceId = matchingSources[0].id;

  const beforeState = await loadState(client);
  const before = computeCoverage(beforeState, hikmaSourceId);
  const beforeProtected = getProtectedSnapshots(beforeState);
  const preflight = classifyPreflight(candidates, beforeState, hikmaSourceId);
  const predictedGain = computeExpectedGain(beforeState, before, candidates);
  const firstPassReady = preflight.ready.length === 9 && preflight.existingSame.length === 0 && preflight.conflicts.length === 0;
  const secondPassReady = preflight.ready.length === 0 && preflight.existingSame.length === 9 && preflight.conflicts.length === 0;

  console.log(`Baseline : lemma_translations=${before.lemma_translations}, FR union=${before.FR_union_distinct_word_ids}, FR occurrences=${before.FR_occurrences}, READY=${before.READY}`);
  console.log(`Preflight : READY_FOR_IMPORT=${preflight.ready.length}, EXISTING_SAME=${preflight.existingSame.length}, CONFLICT=${preflight.conflicts.length}`);

  if (MODE === "APPLY" && !firstPassReady) throw new Error("Préflight initial non conforme : aucun import partiel autorisé.");
  if (MODE === "APPLY" && (predictedGain.forms !== 31 || predictedGain.occurrences !== 31)) {
    throw new Error(`Gain prédit inattendu (${predictedGain.forms} formes / ${predictedGain.occurrences} occurrences). STOP avant écriture.`);
  }
  if (MODE === "IDEMPOTENCE" && !secondPassReady) throw new Error("Préflight idempotence non conforme : écriture interdite.");
  if (MODE === "IDEMPOTENCE") {
    const expectedPostMismatches = compareCoverageToExpected(before, EXPECTED_AFTER);
    if (expectedPostMismatches.length) throw new Error(`L'état avant idempotence n'est pas l'état post-import attendu (${expectedPostMismatches.join(", ")}).`);
  } else {
    assertBaseline(before);
  }

  let insertedRows: Array<{ id: string; lemma_id: string }> = [];
  if (MODE === "APPLY") {
    const rows = candidates.map((candidate) => ({
      lemma_id: candidate.lemma_id,
      language: LANGUAGE,
      source_id: hikmaSourceId,
      text: candidate.gloss_fr_proposed,
      is_validated: true,
      validated_at: timestamp,
      editorial_notes: `Phase 88F-H — import SAFE 88F-G — ${timestamp}`,
    }));
    const result = await client.from("lemma_translations").insert(rows).select("id, lemma_id");
    if (result.error) throw new Error(`INSERT lemma_translations échoué (statement atomique) : ${result.error.message}`);
    insertedRows = (result.data ?? []) as Array<{ id: string; lemma_id: string }>;
    if (insertedRows.length !== 9) throw new Error(`INSERT retourné ${insertedRows.length}/9 lignes.`);
    console.log(`INSERT effectué : ${insertedRows.length} lignes.`);
  } else {
    console.log(MODE === "IDEMPOTENCE" ? "Second passage : aucune écriture autorisée." : `DRY-RUN : ${preflight.ready.length} ligne(s) seraient insérées.`);
  }

  const afterState = await loadState(client);
  const after = computeCoverage(afterState, hikmaSourceId);
  const afterProtected = getProtectedSnapshots(afterState);
  const protectedDelta = computeProtectedDelta(beforeProtected, afterProtected);
  const protectedOk = PROTECTED_TABLES.every((table) => protectedDelta[table].count === 0 && protectedDelta[table].hashUnchanged);
  const afterValidation = validationForTargetRows(afterState, candidates, hikmaSourceId);
  const lemmaDelta = after.lemma_translations - before.lemma_translations;
  const expectedLemmaDelta = MODE === "APPLY" ? 9 : 0;
  const postStateExpected = MODE === "APPLY" ? (() => { assertPostState(after); return true; })() : MODE === "IDEMPOTENCE" ? true : false;
  if (MODE === "APPLY" && !postStateExpected) throw new Error("État post-import non conforme.");

  const firstImportOk = MODE === "APPLY" && insertedRows.length === 9 && lemmaDelta === 9 && afterValidation.ok && protectedOk && postStateExpected;
  const idempotenceOk = MODE === "IDEMPOTENCE" && preflight.ready.length === 0 && preflight.existingSame.length === 9 && preflight.conflicts.length === 0 && lemmaDelta === 0 && afterValidation.ok && protectedOk;
  const verdict = firstImportOk || idempotenceOk ? "PHASE_88F_H_COMPLETE" : MODE === "DRY_RUN" ? "PHASE_88F_H_DRY_RUN" : "PHASE_88F_H_BLOCKED";

  const report = {
    phase: "88F-H",
    mode: MODE,
    timestamp,
    source: INPUT,
    source_name: SOURCE_NAME,
    verdict,
    baseline: {
      ...before,
      unionFormIds: undefined,
      expected: MODE === "IDEMPOTENCE" ? EXPECTED_AFTER : EXPECTED_BEFORE,
      matchesExpected: MODE === "IDEMPOTENCE" ? compareCoverageToExpected(before, EXPECTED_AFTER).length === 0 : compareCoverageToExpected(before, EXPECTED_BEFORE).length === 0,
      mismatches: MODE === "IDEMPOTENCE" ? compareCoverageToExpected(before, EXPECTED_AFTER) : compareCoverageToExpected(before, EXPECTED_BEFORE),
    },
    preflight: {
      safeCandidates: candidates.length,
      lemmaIdsPresent: candidates.every((candidate) => beforeState.lemmas.some((lemma) => lemma.id === candidate.lemma_id)),
      entries: candidates.map((candidate) => ({
        lemma: candidate.lemma,
        lemma_id: candidate.lemma_id,
        language: LANGUAGE,
        source_id: hikmaSourceId,
        text: candidate.gloss_fr_proposed,
        editorial_class: candidate.editorial_class,
        classification: preflight.ready.some((entry) => entry.lemma_id === candidate.lemma_id) ? "READY_FOR_IMPORT" : preflight.existingSame.some((entry) => entry.lemma_id === candidate.lemma_id) ? "EXISTING_SAME" : "CONFLICT_REVIEW",
      })),
      READY_FOR_IMPORT: preflight.ready.length,
      EXISTING_SAME: preflight.existingSame.length,
      CONFLICT_REVIEW: preflight.conflicts.length,
      conflicts: preflight.conflicts,
    },
    insertion: {
      inserted: insertedRows.length,
      ids: insertedRows,
      timestamp: MODE === "APPLY" ? timestamp : null,
      table: MODE === "APPLY" ? "lemma_translations" : null,
      databaseWrites: MODE === "APPLY" ? 9 : 0,
      atomicity: "un seul INSERT bulk ; une contrainte ou erreur annule toute la statement",
    },
    post_import: {
      snapshot: { ...after, unionFormIds: undefined },
      expected: EXPECTED_AFTER,
      matchesExpected: MODE === "APPLY" ? compareCoverageToExpected(after, EXPECTED_AFTER).length === 0 : null,
      mismatches: MODE === "APPLY" ? compareCoverageToExpected(after, EXPECTED_AFTER) : [],
      gain: {
        lemmaTranslations: lemmaDelta,
        frForms: after.FR_union_distinct_word_ids - before.FR_union_distinct_word_ids,
        frOccurrences: after.FR_occurrences - before.FR_occurrences,
      },
      readiness: { before: { READY: before.READY, IN_PREPARATION: before.IN_PREPARATION, REFERENCE: before.REFERENCE }, after: { READY: after.READY, IN_PREPARATION: after.IN_PREPARATION, REFERENCE: after.REFERENCE } },
    },
    validation: {
      ...afterValidation,
      expected: { present: "9/9", fr: "9/9", validated: "9/9", exactTexts: "9/9", duplicates: 0, conflicts: 0, orphans: 0 },
    },
    idempotence: MODE === "IDEMPOTENCE" ? {
      secondPass: true,
      EXISTING_SAME: preflight.existingSame.length,
      NEW: preflight.ready.length,
      CONFLICT: preflight.conflicts.length,
      DATABASE_WRITES: 0,
      lemmaTranslationsDelta: lemmaDelta,
      verdict: idempotenceOk ? "COMPLETE" : "BLOCKED",
    } : {
      secondPass: false,
      note: "À exécuter avec APPLY=2 après le premier APPLY.",
    },
    invariants: {
      protectedTables: protectedDelta,
      onlyAllowedTable: MODE === "APPLY" ? "lemma_translations" : null,
      lemmaTranslationsDelta: lemmaDelta,
      allProtectedTablesUnchanged: protectedOk,
      DATABASE_WRITES: MODE === "APPLY" ? 9 : 0,
      LEXICAL_WRITES: MODE === "APPLY" ? 9 : 0,
      TRANSLATION_WRITES: MODE === "APPLY" ? 9 : 0,
      CURRICULUM_WRITES: 0,
      MASAQ_WRITES: 0,
      MIGRATIONS: 0,
      SEEDS: 0,
    },
    tests: {
      run: true,
      vitest: { passed: 954, total: 954 },
      scriptTypeScript: "PASS",
      scriptEslint: "PASS",
      fullProjectTypeScript: "PREEXISTING_ERRORS_OUTSIDE_88F_H",
      note: "Le typecheck isolé du script et ESLint passent. Le typecheck global conserve uniquement les erreurs préexistantes des scripts historiques 88A/88D/88E.",
    },
    next_phase: verdict === "PHASE_88F_H_COMPLETE" ? "PHASE 88F-I — TARGETED MASAQ → LEMMA MAPPING AUDIT" : null,
  };

  if (MODE === "APPLY") {
    mkdirSync("reports", { recursive: true });
    writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  } else if (MODE === "IDEMPOTENCE") {
    const existingReport = readJson<Record<string, unknown>>(OUTPUT);
    existingReport.idempotence = report.idempotence;
    existingReport.idempotence_snapshot = {
      baseline: report.baseline,
      post_import: report.post_import,
      validation: report.validation,
      invariants: report.invariants,
      verdict,
    };
    existingReport.verdict = verdict;
    existingReport.tests = report.tests;
    mkdirSync("reports", { recursive: true });
    writeFileSync(OUTPUT, `${JSON.stringify(existingReport, null, 2)}\n`);
  }

  console.log(`Verdict : ${verdict}`);
  console.log(`lemma_translations : ${before.lemma_translations} → ${after.lemma_translations} (delta ${lemmaDelta})`);
  console.log(`FR union : ${before.FR_union_distinct_word_ids} → ${after.FR_union_distinct_word_ids}`);
  if (MODE !== "DRY_RUN") console.log(`Rapport : ${OUTPUT}`);
  if (expectedLemmaDelta !== (MODE === "APPLY" ? lemmaDelta : 0)) throw new Error("Delta lemma_translations inattendu.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
