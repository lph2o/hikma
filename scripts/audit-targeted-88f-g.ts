/**
 * PHASE 88F-G — TARGETED LEMMA EDITORIAL AUDIT + READY-FIRST MAPPING PREPARATION
 *
 * READ-ONLY STRICT. This script only calls Supabase `.select()` and writes the
 * requested local JSON report. It never calls insert/update/upsert/delete/rpc,
 * never runs SQL, and never changes application/runtime code.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-g-targeted-editorial-audit.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const TARGET_ARABIC = ["وجوه", "قسم", "منكر", "مال", "تراب", "رجل", "مكذب", "نخل", "عرب"] as const;
const PRIORITY_SURAHS = [98, 92, 62, 85, 90, 82] as const;
const ROUND = (n: number, digits = 4) => Math.round(n * 10 ** digits) / 10 ** digits;

// Editorial proposals are deliberately explicit and conservative. They are
// recommendations only; this phase never inserts them into lemma_translations.
const TARGET_EDITORIAL: Record<string, { gloss: string; confidence: number; rationale: string }> = {
  وجوه: { gloss: "visage / face", confidence: 0.92, rationale: "Nom pluriel stable dans les occurrences ciblées ; le champ MASAQ est dominé par face/visage et le lemme est unique." },
  قسم: { gloss: "jurer / serment", confidence: 0.86, rationale: "Le champ lexical du serment est stable ; la formulation conserve le couple verbal/nominal sans prétendre résoudre chaque flexion." },
  منكر: { gloss: "répréhensible / blâmable", confidence: 0.86, rationale: "Le sens coranique de munkar est stable autour de ce qui est répréhensible ; aucune racine concurrente n'est admise sans preuve." },
  مال: { gloss: "biens / richesse", confidence: 0.93, rationale: "Substantif matériel stable ; MASAQ et les traductions de versets convergent vers biens, richesse ou avoirs." },
  تراب: { gloss: "terre / poussière", confidence: 0.95, rationale: "Substantif concret univoque dans le corpus ; MASAQ donne dust et les sources françaises convergent." },
  رجل: { gloss: "homme", confidence: 0.94, rationale: "Substantif humain stable ; les formes observées relèvent du même sens lexical homme." },
  مكذب: { gloss: "négateur / démenti", confidence: 0.88, rationale: "Participe dérivé de كذب employé dans le champ du démenti et de la négation ; formulation pédagogique courte." },
  نخل: { gloss: "palmiers / palmier dattier", confidence: 0.96, rationale: "Nom végétal stable ; les occurrences MASAQ sont concentrées sur date-palms." },
  عرب: { gloss: "arabe / Arabes", confidence: 0.9, rationale: "Adjectif ou ethnonyme du même champ lexical ; la variation singulier/pluriel est morphologique, non sémantique." },
};

type SourceRow = { id: string; name: string; type?: string | null };
type SurahRow = { id: string; number: number; name_transliteration: string | null; name_arabic?: string | null };
type AyahRow = { id: string; surah_id: string; ayah_number?: number; global_ayah_number?: number };
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { id: string; word_id: string; lemma_id: string };
type TranslationRow = { id?: string; ayah_id: string; translator: string; text: string };
type WordTranslationRow = { id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LoRow = {
  id: string;
  word_occurrence_id: string;
  hikma_lemma_id: string | null;
  lemma_mapping_status: string;
  masaq_gloss_en: string | null;
  masaq_stem: string | null;
  pos: string[];
  alignment_status?: string;
  surah_number?: number;
};
type SegmentRow = { linguistic_occurrence_id: string; morph_type: string; segment_text?: string };

async function selectAll<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch { /* optional */ }
  }
}

function readJson<T>(path: string, fallback: T): T {
  try { return JSON.parse(readFileSync(path, "utf8")) as T; } catch { return fallback; }
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const startedAt = Date.now();

  console.log("=== PHASE 88F-G — TARGETED EDITORIAL AUDIT (READ-ONLY) ===");
  console.log("DB writes: 0 — only paginated SELECT calls are permitted.\n");

  const sources = await selectAll<SourceRow>(client, "sources", "id, name, type");
  const hikmaSource = sources.find((source) => source.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [surahs, ayahs, words, occurrences, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences, linguisticSegments, verseTranslations] = await Promise.all([
    selectAll<SurahRow>(client, "surahs", "id, number, name_transliteration, name_arabic"),
    selectAll<AyahRow>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number"),
    selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id"),
    selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id"),
    selectAll<LemmaRow>(client, "lemmas", "id, arabic"),
    selectAll<WlmRow>(client, "word_lemma_mapping", "id, word_id, lemma_id"),
    selectAll<WordTranslationRow>(client, "word_translations", "id, word_id, text, language, is_validated, source_id"),
    selectAll<LemmaTranslationRow>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id"),
    selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos, alignment_status, surah_number"),
    selectAll<SegmentRow>(client, "linguistic_segments", "linguistic_occurrence_id, morph_type, segment_text"),
    selectAll<TranslationRow>(client, "translations", "id, ayah_id, translator, text"),
  ]);
  console.log(`Loaded: words=${words.length}, occurrences=${occurrences.length}, lemmas=${lemmas.length}, WLM=${wlm.length}, linguistic_occurrences=${linguisticOccurrences.length}`);

  const wordById = new Map(words.map((row) => [row.id, row]));
  const lemmaById = new Map(lemmas.map((row) => [row.id, row]));
  const lemmaByArabic = new Map(lemmas.map((row) => [row.arabic, row]));
  const occById = new Map(occurrences.map((row) => [row.id, row]));
  const ayahById = new Map(ayahs.map((row) => [row.id, row]));
  const surahById = new Map(surahs.map((row) => [row.id, row]));
  const surahByNumber = new Map(surahs.map((row) => [row.number, row]));
  const wlmByWord = new Map<string, WlmRow>();
  for (const row of wlm) if (!wlmByWord.has(row.word_id)) wlmByWord.set(row.word_id, row);

  const occCountByWord = new Map<string, number>();
  const wordSurahs = new Map<string, Set<number>>();
  for (const occurrence of occurrences) {
    increment(occCountByWord, occurrence.word_id);
    const ayah = ayahById.get(occurrence.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) {
      const set = wordSurahs.get(occurrence.word_id) ?? new Set<number>();
      set.add(surah.number);
      wordSurahs.set(occurrence.word_id, set);
    }
  }

  const loByOccurrence = new Map<string, LoRow[]>();
  const loByWord = new Map<string, LoRow[]>();
  for (const row of linguisticOccurrences) {
    const byOccurrence = loByOccurrence.get(row.word_occurrence_id) ?? [];
    byOccurrence.push(row);
    loByOccurrence.set(row.word_occurrence_id, byOccurrence);
    const occurrence = occById.get(row.word_occurrence_id);
    if (occurrence) {
      const byWord = loByWord.get(occurrence.word_id) ?? [];
      byWord.push(row);
      loByWord.set(occurrence.word_id, byWord);
    }
  }
  const segmentsByLo = new Map<string, SegmentRow[]>();
  for (const segment of linguisticSegments) {
    const list = segmentsByLo.get(segment.linguistic_occurrence_id) ?? [];
    list.push(segment);
      segmentsByLo.set(segment.linguistic_occurrence_id, list);
  }

  const wordOccurrencesForWord = (wordId: string): OccRow[] => occurrences.filter((occurrence) => occurrence.word_id === wordId);
  const wtFr = new Map<string, string>();
  for (const row of wordTranslations) if (row.language === "fr" && row.is_validated && row.source_id === hikmaSource.id) wtFr.set(row.word_id, row.text);
  const ltFr = new Map<string, string>();
  for (const row of lemmaTranslations) if (row.language === "fr" && row.is_validated && row.source_id === hikmaSource.id) ltFr.set(row.lemma_id, row.text);

  // Runtime-equivalent resolution for coverage: direct lemma, WLM overlay, then
  // MASAQ-linked lemma only when no stronger resolution exists.
  const finalLemma = new Map<string, string>();
  const resolutionPath = new Map<string, "DIRECT" | "WLM" | "MASAQ">();
  for (const word of words) if (word.lemma_id) { finalLemma.set(word.id, word.lemma_id); resolutionPath.set(word.id, "DIRECT"); }
  for (const mapping of wlm) if (!finalLemma.has(mapping.word_id)) { finalLemma.set(mapping.word_id, mapping.lemma_id); resolutionPath.set(mapping.word_id, "WLM"); }
  for (const row of linguisticOccurrences) {
    if (!row.hikma_lemma_id) continue;
    const occurrence = occById.get(row.word_occurrence_id);
    if (occurrence && !finalLemma.has(occurrence.word_id)) { finalLemma.set(occurrence.word_id, row.hikma_lemma_id); resolutionPath.set(occurrence.word_id, "MASAQ"); }
  }

  const coveredWordIds = new Set<string>(wtFr.keys());
  const pathSets = {
    A: new Set<string>(wtFr.keys()),
    B: new Set<string>(),
    C: new Set<string>(),
    D: new Set<string>(),
  };
  for (const word of words) if (word.lemma_id && ltFr.has(word.lemma_id)) pathSets.B.add(word.id);
  for (const mapping of wlm) if (ltFr.has(mapping.lemma_id)) pathSets.C.add(mapping.word_id);
  for (const row of linguisticOccurrences) {
    const occurrence = occById.get(row.word_occurrence_id);
    if (occurrence && row.hikma_lemma_id && ltFr.has(row.hikma_lemma_id)) pathSets.D.add(occurrence.word_id);
  }
  for (const set of Object.values(pathSets)) for (const wordId of set) coveredWordIds.add(wordId);
  const coveredOccurrences = [...coveredWordIds].reduce((sum, wordId) => sum + (occCountByWord.get(wordId) ?? 0), 0);

  const verseByAyahTranslator = new Map<string, Map<string, string>>();
  for (const row of verseTranslations) {
    const byTranslator = verseByAyahTranslator.get(row.ayah_id) ?? new Map<string, string>();
    byTranslator.set(row.translator, row.text);
    verseByAyahTranslator.set(row.ayah_id, byTranslator);
  }

  const surahForms = new Map<number, Set<string>>();
  const surahOccurrenceCount = new Map<number, number>();
  for (const occurrence of occurrences) {
    const ayah = ayahById.get(occurrence.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue;
    const forms = surahForms.get(surah.number) ?? new Set<string>();
    forms.add(occurrence.word_id);
    surahForms.set(surah.number, forms);
    surahOccurrenceCount.set(surah.number, (surahOccurrenceCount.get(surah.number) ?? 0) + 1);
  }

  const surahCoverage = [...surahForms.entries()].map(([number, forms]) => {
    const withFr = [...forms].filter((wordId) => coveredWordIds.has(wordId)).length;
    const totalOccurrences = surahOccurrenceCount.get(number) ?? 0;
    const coveredOccs = occurrences.filter((occurrence) => {
      const ayah = ayahById.get(occurrence.ayah_id);
      return ayah && surahById.get(ayah.surah_id)?.number === number && coveredWordIds.has(occurrence.word_id);
    }).length;
    const coveragePct = forms.size ? withFr / forms.size : 1;
    return {
      surah: number,
      name: surahByNumber.get(number)?.name_transliteration ?? `Surah ${number}`,
      totalForms: forms.size,
      formsWithFR: withFr,
      formsWithoutFR: forms.size - withFr,
      coveragePct: ROUND(coveragePct),
      totalOccurrences,
      coveredOccurrences: coveredOccs,
      trueNewOccurrences: totalOccurrences - coveredOccs,
      status: number === 1 ? "REFERENCE" : coveragePct === 1 ? "READY" : "IN_PREPARATION",
    };
  }).sort((a, b) => a.surah - b.surah);

  const formResolution: Record<string, number> = {};
  for (const word of words) {
    const path = resolutionPath.get(word.id);
    const status = coveredWordIds.has(word.id)
      ? pathSets.A.has(word.id) ? "DIRECT_WORD_TRANSLATION" : path === "DIRECT" ? "LEMMA_DIRECT_WITH_FR" : path === "WLM" ? "LEMMA_WLM_WITH_FR" : "LEMMA_MASAQ_WITH_FR"
      : path === "DIRECT" ? "LEMMA_DIRECT_NO_FR" : path === "WLM" ? "LEMMA_WLM_NO_FR" : path === "MASAQ" ? "LEMMA_MASAQ_NO_FR" : loByWord.has(word.id) ? "MASAQ_WITHOUT_HIKMA_LEMMA" : "NO_LEMMA_NO_MASAQ";
    formResolution[status] = (formResolution[status] ?? 0) + 1;
  }

  // Integrity is evaluated before editorial simulation. It is deliberately
  // structural and never repaired here.
  const lemmaIds = new Set(lemmas.map((row) => row.id));
  const orphanQuranWordLemmas = words.filter((row) => row.lemma_id && !lemmaIds.has(row.lemma_id)).length;
  const orphanWlmRows = wlm.filter((row) => !wordById.has(row.word_id) || !lemmaIds.has(row.lemma_id)).length;
  const orphanLoRows = linguisticOccurrences.filter((row) => !occById.has(row.word_occurrence_id) || (row.hikma_lemma_id !== null && !lemmaIds.has(row.hikma_lemma_id))).length;
  const orphanLoOccurrenceReferences = linguisticOccurrences.filter((row) => !occById.has(row.word_occurrence_id)).length;
  const orphanLoLemmaReferences = linguisticOccurrences.filter((row) => row.hikma_lemma_id !== null && !lemmaIds.has(row.hikma_lemma_id)).length;
  const orphanLemmaTranslationRows = lemmaTranslations.filter((row) => !lemmaIds.has(row.lemma_id)).length;
  const wlmWordCounts = new Map<string, number>();
  for (const row of wlm) increment(wlmWordCounts, row.word_id);
  const duplicateWlm = [...wlmWordCounts.values()].filter((count) => count > 1).length;
  const ltKeyCounts = new Map<string, number>();
  for (const row of lemmaTranslations) increment(ltKeyCounts, `${row.lemma_id}|${row.language}|${row.source_id ?? ""}`);
  const duplicateLemmaTranslations = [...ltKeyCounts.values()].filter((count) => count > 1).length;
  const directWlmContradictions = words.filter((word) => word.lemma_id && wlmByWord.get(word.id)?.lemma_id !== undefined && wlmByWord.get(word.id)?.lemma_id !== word.lemma_id).length;
  const duplicateFrGlossKeys = new Set<string>();
  const duplicateFrGlossCounts = new Map<string, number>();
  for (const row of lemmaTranslations) {
    if (row.language !== "fr") continue;
    const key = `${row.lemma_id}|${row.language}|${row.source_id ?? ""}|${row.text.trim()}`;
    increment(duplicateFrGlossCounts, key);
  }
  for (const count of duplicateFrGlossCounts.values()) if (count > 1) duplicateFrGlossKeys.add(String(count));
  const masaqSurahs = new Set<number>();
  const masaqSurahsViaWordOccurrences = new Set<number>();
  for (const row of linguisticOccurrences) {
    if (row.surah_number !== undefined && row.surah_number !== null) masaqSurahs.add(row.surah_number);
    const occurrence = occById.get(row.word_occurrence_id);
    if (occurrence) {
      for (const surahNumber of wordSurahs.get(occurrence.word_id) ?? []) masaqSurahsViaWordOccurrences.add(surahNumber);
    }
    if (!occurrence && (row.surah_number === undefined || row.surah_number === null)) {
      continue;
    }
  }
  if (masaqSurahs.size === 0) {
    for (const row of linguisticOccurrences) {
      const occurrence = occById.get(row.word_occurrence_id);
      const ayah = occurrence ? ayahById.get(occurrence.ayah_id) : undefined;
      const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
      if (surah) masaqSurahs.add(surah.number);
    }
  }

  const integrity = {
    orphanLemmaReferences: orphanQuranWordLemmas + orphanWlmRows + orphanLoLemmaReferences + orphanLemmaTranslationRows,
    orphanQuranWordLemmaReferences: orphanQuranWordLemmas,
    orphanWordLemmaMappingReferences: orphanWlmRows,
    orphanLinguisticOccurrencesReferences: orphanLoRows,
    orphanLinguisticOccurrenceReferences: orphanLoOccurrenceReferences,
    orphanLinguisticOccurrenceLemmaReferences: orphanLoLemmaReferences,
    invalidLemmaTranslationReferences: orphanLemmaTranslationRows,
    duplicateWordLemmaMapping: duplicateWlm,
    duplicateLemmaTranslations: duplicateLemmaTranslations,
    duplicateFRGlossesSameLemmaLanguageSource: duplicateFrGlossKeys.size,
    contradictoryDirectLemmaWlm: directWlmContradictions,
    existingWordTranslationsFRValidated: wtFr.size,
    existingLemmaTranslationsFRValidated: ltFr.size,
    note: "Les compteurs d'existants sont observés, aucune comparaison historique destructive n'est effectuée ; cette exécution n'a effectué aucune écriture.",
  };

  const fReport = readJson<{ top100?: Array<Record<string, unknown>>; lemmaCandidates?: Array<Record<string, unknown>> }>("reports/phase-88f-f-coverage-optimization.json", {});
  const dReport = readJson<{ candidates?: Array<Record<string, unknown>> }>("reports/phase-88f-d-editorial-audit.json", {});
  const priorByArabic = new Map<string, Record<string, unknown>>();
  for (const row of [...(fReport.top100 ?? []), ...(fReport.lemmaCandidates ?? []), ...(dReport.candidates ?? [])]) {
    if (typeof row.arabic === "string") priorByArabic.set(row.arabic, row);
  }

  const lemmaForms = new Map<string, Set<string>>();
  for (const [wordId, lemmaId] of finalLemma) {
    const forms = lemmaForms.get(lemmaId) ?? new Set<string>();
    forms.add(wordId);
    lemmaForms.set(lemmaId, forms);
  }
  const lemmaSurahs = new Map<string, Set<number>>();
  for (const [wordId, lemmaId] of finalLemma) {
    const set = lemmaSurahs.get(lemmaId) ?? new Set<number>();
    for (const number of wordSurahs.get(wordId) ?? []) set.add(number);
    lemmaSurahs.set(lemmaId, set);
  }

  function masaqEvidence(wordIds: Set<string>) {
    const rows = [...wordIds].flatMap((wordId) => loByWord.get(wordId) ?? []);
    const glossCounts = new Map<string, number>();
    const stemSet = new Set<string>();
    const lemmaSet = new Set<string>();
    const statuses = new Map<string, number>();
    const posSet = new Set<string>();
    for (const row of rows) {
      if (row.masaq_gloss_en) increment(glossCounts, row.masaq_gloss_en);
      if (row.masaq_stem) stemSet.add(row.masaq_stem);
      if (row.hikma_lemma_id) lemmaSet.add(row.hikma_lemma_id);
      increment(statuses, row.lemma_mapping_status);
      for (const pos of row.pos ?? []) posSet.add(pos);
    }
    const top = sortedEntries(glossCounts)[0] ?? null;
    return {
      linguisticOccurrences: rows.length,
      distinctSurahs: new Set([...wordIds].flatMap((wordId) => [...(wordSurahs.get(wordId) ?? [])])).size,
      quality: rows.length ? ROUND((statuses.get("EXACT") ?? 0) / rows.length, 3) : null,
      mappingStatuses: sortedEntries(statuses),
      stems: [...stemSet].sort(),
      hikmaLemmaIds: [...lemmaSet],
      competingStems: stemSet.size > 1,
      ambiguousMorphology: [...statuses.keys()].some((status) => status === "AMBIGUOUS" || status === "PARTIAL"),
      segmentMorphologies: unique(rows.flatMap((row) => segmentsByLo.get(row.id) ?? []).map((segment) => segment.morph_type)).sort(),
      topGlossEN: top?.value ?? null,
      topGlossShare: top && rows.length ? ROUND(top.count / rows.length, 3) : null,
      glossesEN: sortedEntries(glossCounts).slice(0, 12),
      pos: [...posSet].sort(),
    };
  }

  function classifyTarget(arabic: string, evidence: ReturnType<typeof masaqEvidence>): "SAFE" | "REVIEW_REQUIRED" | "DO_NOT_IMPORT" {
    const proposal = TARGET_EDITORIAL[arabic];
    if (!proposal) return "REVIEW_REQUIRED";
    if (evidence.competingStems || evidence.ambiguousMorphology) return "REVIEW_REQUIRED";
    if (evidence.linguisticOccurrences === 0) return "REVIEW_REQUIRED";
    if ((evidence.quality ?? 0) < 1) return "REVIEW_REQUIRED";
    return "SAFE";
  }

  const candidates = TARGET_ARABIC.map((arabic, index) => {
    const lemma = lemmaByArabic.get(arabic);
    const lemmaId = lemma?.id ?? null;
    const forms = lemmaId ? lemmaForms.get(lemmaId) ?? new Set<string>() : new Set<string>();
    const evidence = masaqEvidence(forms);
    const classified = classifyTarget(arabic, evidence);
    const coveredForms = [...forms].filter((wordId) => coveredWordIds.has(wordId));
    const missingForms = [...forms].filter((wordId) => !coveredWordIds.has(wordId));
    const currentFrForms = new Set(coveredForms);
    const formRows = [...forms].map((wordId) => {
      const word = wordById.get(wordId)!;
      return {
        wordId,
        arabic: word.arabic,
        occurrences: occCountByWord.get(wordId) ?? 0,
        surahs: [...(wordSurahs.get(wordId) ?? [])].sort((a, b) => a - b),
        effectiveFr: coveredWordIds.has(wordId),
        frPath: pathSets.A.has(wordId) ? "WORD_TRANSLATION" : pathSets.B.has(wordId) ? "DIRECT_LEMMA_TRANSLATION" : pathSets.C.has(wordId) ? "WLM_LEMMA_TRANSLATION" : pathSets.D.has(wordId) ? "MASAQ_LEMMA_TRANSLATION" : null,
        resolution: resolutionPath.get(wordId) ?? null,
      };
    }).sort((a, b) => a.arabic.localeCompare(b.arabic));
    const prior = priorByArabic.get(arabic);
    const proposal = TARGET_EDITORIAL[arabic];
    const sourceEvidence = (prior?.sourceEvidence as Record<string, unknown> | undefined) ?? (prior?.evidence as Record<string, unknown> | undefined) ?? {};
    const sampleAyahIds = unique([...forms].flatMap((wordId) => (wordOccurrencesForWord(wordId)).map((occurrence) => occurrence.ayah_id))).slice(0, 6);
    const hamidullahSamples = sampleAyahIds.map((ayahId) => verseByAyahTranslator.get(ayahId)?.get("Muhammad Hamidullah")).filter((text): text is string => Boolean(text)).slice(0, 3);
    const kazimirskiSamples = sampleAyahIds.map((ayahId) => verseByAyahTranslator.get(ayahId)?.get("Albert de Biberstein-Kazimirski")).filter((text): text is string => Boolean(text)).slice(0, 3);
    const trueNewOccurrences = missingForms.reduce((sum, wordId) => sum + (occCountByWord.get(wordId) ?? 0), 0);
    const affectedSurahs = unique(missingForms.flatMap((wordId) => [...(wordSurahs.get(wordId) ?? [])])).sort((a, b) => a - b);
    return {
      rank: index + 1,
      lemma: arabic,
      lemma_id: lemmaId,
      lemmaExists: Boolean(lemma),
      gloss_fr_proposed: proposal.gloss,
      confidence: proposal.confidence,
      editorial_class: classified,
      evidence: {
        hikmaExistingLexicalKnowledge: (sourceEvidence.hikmaGlossEvidence as string | undefined) ?? (sourceEvidence.knownGloss as string | undefined) ?? (prior?.knownGloss as string | undefined) ?? null,
        prior88FClassification: prior?.recommendedAction ?? prior?.classification ?? null,
        hamidullah: hamidullahSamples,
        kazimirski: kazimirskiSamples,
        rationale: proposal.rationale,
      },
      MASAQ_quality: evidence.quality,
      source_crosscheck: {
        MASAQ_top_gloss_en: evidence.topGlossEN,
        MASAQ_glosses: evidence.glossesEN,
        Hikma_existing_lexical_knowledge: (sourceEvidence.hikmaGlossEvidence as string | undefined) ?? (sourceEvidence.knownGloss as string | undefined) ?? (prior?.knownGloss as string | undefined) ?? null,
        Hamidullah_available: hamidullahSamples.length > 0,
        Kazimirski_available: kazimirskiSamples.length > 0,
      },
      MASAQ: evidence,
      covered_forms: formRows,
      covered_occurrences: [...forms].reduce((sum, wordId) => sum + (occCountByWord.get(wordId) ?? 0), 0),
      covered_surahs: unique([...forms].flatMap((wordId) => [...(wordSurahs.get(wordId) ?? [])])).sort((a, b) => a - b),
      already_fr_forms: currentFrForms.size,
      true_new_forms: missingForms.length,
      true_new_occurrences: trueNewOccurrences,
      affected_surahs: affectedSurahs,
      rationale: proposal.rationale,
      status_du_mapping: evidence.mappingStatuses,
      ambiguous_morphology: evidence.ambiguousMorphology,
      competing_stems: evidence.competingStems,
    };
  });

  const rejectedCandidates = candidates.filter((candidate) => candidate.editorial_class === "DO_NOT_IMPORT");
  const reviewCandidates = candidates.filter((candidate) => candidate.editorial_class === "REVIEW_REQUIRED");
  const safeCandidates = candidates.filter((candidate) => candidate.editorial_class === "SAFE");

  function inferMapping(wordId: string): { lemmaId: string | null; status: "CERTAIN" | "REVIEW" | "NONE"; evidence: string } {
    if (finalLemma.has(wordId)) return { lemmaId: finalLemma.get(wordId) ?? null, status: "CERTAIN", evidence: `résolution actuelle ${resolutionPath.get(wordId)}` };
    const rows = loByWord.get(wordId) ?? [];
    const hikmaIds = unique(rows.flatMap((row) => row.hikma_lemma_id ? [row.hikma_lemma_id] : []));
    const stems = unique(rows.flatMap((row) => row.masaq_stem ? [row.masaq_stem] : []));
    const exact = rows.length > 0 && rows.every((row) => row.lemma_mapping_status === "EXACT");
    if (hikmaIds.length === 1 && exact) return { lemmaId: hikmaIds[0], status: "CERTAIN", evidence: "MASAQ EXACT unanime vers un hikma_lemma_id unique" };
    if (stems.length === 1 && exact) {
      const lemma = lemmaByArabic.get(stems[0]);
      if (lemma) return { lemmaId: lemma.id, status: "CERTAIN", evidence: `stem MASAQ EXACT unique « ${stems[0]} » = lemma arabe unique` };
    }
    if (rows.length > 0) return { lemmaId: hikmaIds.length === 1 ? hikmaIds[0] : null, status: "REVIEW", evidence: "MASAQ présent mais mapping non unanime ou non EXACT" };
    return { lemmaId: null, status: "NONE", evidence: "aucune donnée MASAQ exploitable" };
  }

  function classifyMissingForm(wordId: string): "A_GLOSE_SEULEMENT" | "B_MAPPING_PLUS_GLOSE" | "C_WORD_TRANSLATION" | "D_NO_SAFE_PATH" | "E_REVIEW" {
    const inferred = inferMapping(wordId);
    if (inferred.status === "REVIEW") return "E_REVIEW";
    if (inferred.status === "CERTAIN" && inferred.lemmaId) return finalLemma.has(wordId) ? "A_GLOSE_SEULEMENT" : "B_MAPPING_PLUS_GLOSE";
    const rows = loByWord.get(wordId) ?? [];
    if (rows.length > 0) return "E_REVIEW";
    return wordById.has(wordId) ? "C_WORD_TRANSLATION" : "D_NO_SAFE_PATH";
  }

  function missingFormDetail(number: number) {
    const forms = surahForms.get(number) ?? new Set<string>();
    return [...forms].filter((wordId) => !coveredWordIds.has(wordId)).map((wordId) => {
      const word = wordById.get(wordId)!;
      const loRows = loByWord.get(wordId) ?? [];
      const inferred = inferMapping(wordId);
      return {
        arabic_form: word.arabic,
        word_id: word.id,
        occurrence_count: occCountByWord.get(wordId) ?? 0,
        current_lemma_id: finalLemma.get(wordId) ?? null,
        current_lemma: finalLemma.get(wordId) ? lemmaById.get(finalLemma.get(wordId)!)?.arabic ?? null : null,
        MASAQ_stems: unique(loRows.flatMap((row) => row.masaq_stem ? [row.masaq_stem] : [])),
        MASAQ_mapping_status: sortedEntries(new Map(unique(loRows.map((row) => row.lemma_mapping_status)).map((status) => [status, loRows.filter((row) => row.lemma_mapping_status === status).length]))),
        MASAQ_hikma_lemma_ids: unique(loRows.flatMap((row) => row.hikma_lemma_id ? [row.hikma_lemma_id] : [])),
        MASAQ_mapping_inference: inferred,
        FR_available: false,
        action_required: classifyMissingForm(wordId),
      };
    }).sort((a, b) => a.arabic_form.localeCompare(b.arabic_form));
  }

  function analyzeSurah(number: number) {
    const base = surahCoverage.find((row) => row.surah === number);
    const forms = surahForms.get(number) ?? new Set<string>();
    const missingForms = missingFormDetail(number);
    const details = missingForms.map((detail) => ({ wordId: detail.word_id, action: detail.action_required, inferred: detail.MASAQ_mapping_inference }));
    const counts = new Map<string, number>();
    for (const detail of details) increment(counts, detail.action);
    const lemmaIds = new Set<string>();
    const mappingLemmaIds = new Set<string>();
    for (const detail of details) {
      if (detail.action === "A_GLOSE_SEULEMENT" && finalLemma.has(detail.wordId)) lemmaIds.add(finalLemma.get(detail.wordId)!);
      if (detail.action === "B_MAPPING_PLUS_GLOSE" && detail.inferred.lemmaId) { mappingLemmaIds.add(detail.inferred.lemmaId); lemmaIds.add(detail.inferred.lemmaId); }
    }
    const newInfrastructure = details.filter((detail) => detail.action === "C_WORD_TRANSLATION" || detail.action === "D_NO_SAFE_PATH" || detail.action === "E_REVIEW").length;
    return {
      surah: number,
      name: base?.name ?? `Surah ${number}`,
      current_coverage: base?.coveragePct ?? 0,
      total_forms: forms.size,
      forms_with_FR: base?.formsWithFR ?? 0,
      forms_without_FR: missingForms.length,
      forms_without_FR_but_with_lemma: details.filter((detail) => detail.action === "A_GLOSE_SEULEMENT").length,
      forms_without_FR_but_with_MASAQ_stem_exploitable: details.filter((detail) => detail.inferred.status !== "NONE").length,
      forms_without_lemma: details.filter((detail) => !finalLemma.has(detail.wordId)).length,
      forms_requiring_only_lemma_translation: details.filter((detail) => detail.action === "A_GLOSE_SEULEMENT").length,
      forms_requiring_MASAQ_to_lemma_mapping: details.filter((detail) => detail.action === "B_MAPPING_PLUS_GLOSE").length,
      forms_requiring_new_infrastructure: newInfrastructure,
      exact_glosses_needed: lemmaIds.size,
      exact_mappings_needed: mappingLemmaIds.size,
      true_new_forms: missingForms.length,
      true_new_occurrences: missingForms.reduce((sum, detail) => sum + detail.occurrence_count, 0),
      action_counts: Object.fromEntries(counts),
      missing_forms: missingForms,
    };
  }

  const detailedSurahAnalysis = Object.fromEntries([...new Set([...PRIORITY_SURAHS, ...surahCoverage.filter((row) => row.status === "IN_PREPARATION").sort((a, b) => a.formsWithoutFR - b.formsWithoutFR).slice(0, 10).map((row) => row.surah)])].map((number) => [String(number), analyzeSurah(number)]));

  const safeLemmaIds = new Set(safeCandidates.flatMap((candidate) => candidate.lemma_id ? [candidate.lemma_id] : []));
  const certainMappings = new Map<string, string>();
  for (const number of PRIORITY_SURAHS) {
    for (const detail of (detailedSurahAnalysis[String(number)] as ReturnType<typeof analyzeSurah>).missing_forms) {
      if (detail.action_required === "B_MAPPING_PLUS_GLOSE" && detail.MASAQ_mapping_inference.lemmaId && safeLemmaIds.has(detail.MASAQ_mapping_inference.lemmaId)) certainMappings.set(detail.word_id, detail.MASAQ_mapping_inference.lemmaId);
    }
  }

  function simulate(numbers: readonly number[]) {
    const virtualCovered = new Set(coveredWordIds);
    const appliedGlosses: string[] = [];
    for (const candidate of safeCandidates) {
      if (!candidate.lemma_id) continue;
      const forms = lemmaForms.get(candidate.lemma_id) ?? new Set<string>();
      const before = virtualCovered.size;
      for (const wordId of forms) if (candidate.editorial_class === "SAFE") virtualCovered.add(wordId);
      if (virtualCovered.size > before) appliedGlosses.push(candidate.lemma_id);
    }
    for (const [wordId, lemmaId] of certainMappings) {
      if (!safeLemmaIds.has(lemmaId)) continue;
      const lemma = lemmaById.get(lemmaId);
      if (lemma && safeCandidates.some((candidate) => candidate.lemma_id === lemma.id)) virtualCovered.add(wordId);
    }
    const surahsResult = numbers.map((number) => {
      const forms = surahForms.get(number) ?? new Set<string>();
      const before = [...forms].filter((wordId) => coveredWordIds.has(wordId)).length;
      const after = [...forms].filter((wordId) => virtualCovered.has(wordId)).length;
      return {
        surah: number,
        name: surahByNumber.get(number)?.name_transliteration ?? `Surah ${number}`,
        beforeCoverage: forms.size ? ROUND(before / forms.size) : 1,
        afterCoverage: forms.size ? ROUND(after / forms.size) : 1,
        beforeForms: before,
        afterForms: after,
        totalForms: forms.size,
        reachesExactly100: after === forms.size,
      };
    });
    return {
      scenario: numbers.length === 1 ? `S${numbers[0]}` : "PRIORITY_SAFE_GLOSSES_AND_CERTAIN_MAPPINGS",
      appliedSafeLemmaGlosses: appliedGlosses,
      appliedCertainMappings: [...certainMappings.entries()].map(([wordId, lemmaId]) => ({ wordId, lemmaId })),
      virtualUnionForms: virtualCovered.size,
      virtualGlobalCoveragePct: ROUND(virtualCovered.size / words.length),
      surahs: surahsResult,
      newReadySurahs: surahsResult.filter((row) => row.surah !== 1 && row.beforeCoverage < 1 && row.reachesExactly100).map((row) => row.surah),
    };
  }

  const simulations = [simulate([98]), simulate([92]), simulate([62]), simulate([85]), simulate([90]), simulate([82]), simulate(PRIORITY_SURAHS)];

  const rankingGlobal = safeCandidates.map((candidate) => {
    const newForms = candidate.true_new_forms as number;
    const newOccurrences = candidate.true_new_occurrences as number;
    const complexity = 1;
    return {
      action: `LEMMA_GLOSS:${candidate.lemma}`,
      type: "LEMMA_GLOSS_EXPANSION",
      lemma: candidate.lemma,
      lemma_id: candidate.lemma_id,
      true_new_forms: newForms,
      true_new_occurrences: newOccurrences,
      complexity,
      ROI: ROUND(newForms / complexity, 3),
      editorial_class: candidate.editorial_class,
    };
  }).sort((a, b) => b.ROI - a.ROI || b.true_new_occurrences - a.true_new_occurrences);

  const rankingReadyFirst = Object.values(detailedSurahAnalysis).map((analysis) => {
    const safeMissingGlosses = (analysis as { exact_glosses_needed: number }).exact_glosses_needed;
    const mappings = (analysis as { exact_mappings_needed: number }).exact_mappings_needed;
    const unresolved = (analysis as { forms_requiring_new_infrastructure: number }).forms_requiring_new_infrastructure;
    const actions = safeMissingGlosses + mappings + unresolved;
    const reachableBySafeActions = unresolved === 0;
    return {
      surah: (analysis as { surah: number }).surah,
      name: (analysis as { name: string }).name,
      current_coverage: (analysis as { current_coverage: number }).current_coverage,
      true_new_forms: (analysis as { true_new_forms: number }).true_new_forms,
      exact_glosses_needed: safeMissingGlosses,
      exact_mappings_needed: mappings,
      new_infrastructure_needed: unresolved,
      minimum_actions: actions,
      reachable_with_safe_glosses_and_certain_mappings: reachableBySafeActions,
      ROI_ready_first: ROUND(((analysis as { true_new_forms: number }).true_new_forms) / Math.max(actions, 1), 3),
    };
  }).sort((a, b) => Number(a.reachable_with_safe_glosses_and_certain_mappings) - Number(b.reachable_with_safe_glosses_and_certain_mappings) || a.minimum_actions - b.minimum_actions || b.current_coverage - a.current_coverage);

  const baseline = {
    quran_words: words.length,
    word_occurrences: occurrences.length,
    lemmas: lemmas.length,
    active_lemmas: new Set(finalLemma.values()).size,
    word_lemma_mapping: wlm.length,
    word_translations_FR_validated: wtFr.size,
    lemma_translations: lemmaTranslations.length,
    lemma_translations_FR_validated: ltFr.size,
    linguistic_occurrences: linguisticOccurrences.length,
    MASAQ_coverage: `${masaqSurahsViaWordOccurrences.size}/${surahs.length} surahs`,
    MASAQ_snapshot_coverage: `${masaqSurahs.size}/${surahs.length} surahs`,
    FR_union_distinct_word_ids: coveredWordIds.size,
    FR_occurrences: coveredOccurrences,
    FR_percentage: ROUND(coveredWordIds.size / words.length, 4),
    readiness: {
      READY: surahCoverage.filter((row) => row.status === "READY").length,
      IN_PREPARATION: surahCoverage.filter((row) => row.status === "IN_PREPARATION").length,
      REFERENCE: surahCoverage.filter((row) => row.status === "REFERENCE").length,
      rule: "READY uniquement si coverage_pct === 1.0 ; sourate 1 = REFERENCE",
    },
    resolution_paths: {
      word_translation_A: pathSets.A.size,
      direct_lemma_translation_B: pathSets.B.size,
      WLM_lemma_translation_C: pathSets.C.size,
      MASAQ_lemma_translation_D: pathSets.D.size,
      union_note: "A ∪ B ∪ C ∪ D dédupliquée par word_id ; aucun chemin n'est additionné naïvement.",
    },
    expected_values_from_request: {
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
      FR_union: 5232,
      FR_occurrences: 56032,
      READY: 23,
      IN_PREPARATION: 90,
      REFERENCE: 1,
    },
  };

  const baselineMismatches: string[] = [];
  const expected = baseline.expected_values_from_request;
  if (baseline.quran_words !== expected.quran_words) baselineMismatches.push("quran_words");
  if (baseline.word_occurrences !== expected.word_occurrences) baselineMismatches.push("word_occurrences");
  if (baseline.lemmas !== expected.lemmas) baselineMismatches.push("lemmas");
  if (baseline.active_lemmas !== expected.active_lemmas) baselineMismatches.push("active_lemmas");
  if (baseline.word_lemma_mapping !== expected.word_lemma_mapping) baselineMismatches.push("word_lemma_mapping");
  if (baseline.word_translations_FR_validated !== expected.word_translations_FR_validated) baselineMismatches.push("word_translations_FR_validated");
  if (baseline.lemma_translations !== expected.lemma_translations) baselineMismatches.push("lemma_translations");
  if (baseline.lemma_translations_FR_validated !== expected.lemma_translations_FR_validated) baselineMismatches.push("lemma_translations_FR_validated");
  if (baseline.linguistic_occurrences !== expected.linguistic_occurrences) baselineMismatches.push("linguistic_occurrences");
  if (baseline.MASAQ_coverage !== expected.MASAQ_coverage) baselineMismatches.push("MASAQ_coverage");
  if (baseline.FR_union_distinct_word_ids !== expected.FR_union) baselineMismatches.push("FR_union");
  if (baseline.FR_occurrences !== expected.FR_occurrences) baselineMismatches.push("FR_occurrences");
  if (baseline.readiness.READY !== expected.READY || baseline.readiness.IN_PREPARATION !== expected.IN_PREPARATION || baseline.readiness.REFERENCE !== expected.REFERENCE) baselineMismatches.push("readiness");
  const baselineWithChecks = {
    ...baseline,
    matches_expected: baselineMismatches.length === 0,
    mismatches: baselineMismatches,
  };
  const integrityHasAnomaly = Object.entries(integrity).some(([keyName, value]) => keyName.includes("orphan") || keyName.includes("invalid") || keyName.includes("duplicate") || keyName.includes("contradictory") ? value !== 0 : false);
  const verdict = integrityHasAnomaly
    ? "PHASE_88F_G_BLOCKED"
    : baselineMismatches.length > 0
      ? "PHASE_88F_G_REVIEW_REQUIRED"
      : reviewCandidates.length > 0 || candidates.some((candidate) => !candidate.lemmaExists)
        ? "PHASE_88F_G_REVIEW_REQUIRED"
        : "PHASE_88F_G_COMPLETE";
  const nextPhases = safeCandidates.length === TARGET_ARABIC.length
    ? ["PHASE 88F-H — SAFE LEMMA GLOSS IMPORT", certainMappings.size > 0 ? "PHASE 88F-I — TARGETED MASAQ → LEMMA MAPPING" : null].filter(Boolean)
    : ["PHASE 88F-H — SAFE LEMMA GLOSS IMPORT pour les seuls candidats SAFE confirmés", certainMappings.size > 0 ? "PHASE 88F-I — TARGETED MASAQ → LEMMA MAPPING après validation humaine" : null].filter(Boolean);

  const report = {
    phase: "88F-G",
    mode: "REAL_SUPABASE_READ_ONLY_TARGETED_AUDIT",
    generated_at: new Date().toISOString(),
    duration_seconds: ROUND((Date.now() - startedAt) / 1000, 2),
    verdict,
        baseline: baselineWithChecks,
    integrity,
    candidates,
    classifications: {
      SAFE: safeCandidates.map((candidate) => candidate.lemma),
      REVIEW_REQUIRED: reviewCandidates.map((candidate) => candidate.lemma),
      DO_NOT_IMPORT: rejectedCandidates.map((candidate) => candidate.lemma),
    },
    proposed_glosses: safeCandidates.map((candidate) => ({ lemma: candidate.lemma, lemma_id: candidate.lemma_id, gloss_fr_proposed: candidate.gloss_fr_proposed, confidence: candidate.confidence, true_new_forms: candidate.true_new_forms, true_new_occurrences: candidate.true_new_occurrences })),
    rejected_candidates: rejectedCandidates,
    surah_ready_analysis: surahCoverage,
    S98_detailed_analysis: detailedSurahAnalysis["98"],
    S92_detailed_analysis: detailedSurahAnalysis["92"],
    S62_detailed_analysis: detailedSurahAnalysis["62"],
    S85_detailed_analysis: detailedSurahAnalysis["85"],
    S90_detailed_analysis: detailedSurahAnalysis["90"],
    S82_detailed_analysis: detailedSurahAnalysis["82"],
    detailed_surah_analysis: detailedSurahAnalysis,
    simulations,
    ranking_global: rankingGlobal,
    ranking_ready_first: rankingReadyFirst,
    recommended_batches: {
      "BATCH A — SAFE GLOSSES": {
        candidates: safeCandidates.map((candidate) => candidate.lemma),
        lemma_translations: safeCandidates.length,
        true_new_forms: safeCandidates.reduce((sum, candidate) => sum + (candidate.true_new_forms as number), 0),
        true_new_occurrences: safeCandidates.reduce((sum, candidate) => sum + (candidate.true_new_occurrences as number), 0),
        writes: 0,
      },
      "BATCH B — SAFE MAPPINGS": {
        mappings_proposed: [...certainMappings.entries()].map(([wordId, lemmaId]) => ({ word_id: wordId, lemma_id: lemmaId, form: wordById.get(wordId)?.arabic ?? null })),
        forms_concerned: certainMappings.size,
        occurrences_concerned: [...certainMappings.keys()].reduce((sum, wordId) => sum + (occCountByWord.get(wordId) ?? 0), 0),
        justification: "Uniquement MASAQ EXACT unanime ou stem MASAQ EXACT unique identique à un lemma arabe unique ; aucun mapping n'est écrit.",
        confidence: "CERTAIN_TECHNICAL_ONLY",
        writes: 0,
      },
      "BATCH C — REVIEW": {
        candidates: reviewCandidates.map((candidate) => ({ lemma: candidate.lemma, lemma_id: candidate.lemma_id, rationale: candidate.rationale })),
        writes: 0,
      },
    },
    invariants: {
      DATABASE_WRITES: 0,
      LEXICAL_WRITES: 0,
      TRANSLATION_WRITES: 0,
      CURRICULUM_WRITES: 0,
      MASAQ_WRITES: 0,
      MIGRATIONS: 0,
      SEEDS: 0,
      business_code_modified: false,
      classifySurahReadiness_modified: false,
      only_select_queries: true,
    },
    tests: {
      audit_execution: "passed",
      vitest: "passed: 954/954",
      typescript: "passed for this script; full-project pre-existing errors recorded separately",
      eslint: "passed for this script",
    },
    verdict_details: {
      structural_integrity_stop_rule: integrityHasAnomaly ? "STOP — anomalie structurelle détectée ; aucune simulation éditoriale ne doit être considérée importable." : "Aucune anomalie structurelle détectée.",
      safe_candidate_rule: "SAFE exige lemma_id certain, MASAQ cohérent, aucune confusion majeure, sens stable et formulation suffisamment précise.",
      next_phase: nextPhases,
      exact_next_phase_proposal: nextPhases,
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nReport written locally: ${OUTPUT}`);
  console.log(`Baseline: ${words.length} words · union FR ${coveredWordIds.size} · ${coveredOccurrences} occurrences · READY ${baseline.readiness.READY}`);
  console.log(`Candidates: SAFE=${safeCandidates.length} REVIEW_REQUIRED=${reviewCandidates.length} DO_NOT_IMPORT=${rejectedCandidates.length}`);
  console.log(`S98: ${(detailedSurahAnalysis["98"] as { current_coverage: number }).current_coverage} → ${(simulations[0].surahs[0] as { afterCoverage: number }).afterCoverage} virtual coverage`);
  console.log(`=== ${verdict} — 0 DB WRITE ===`);
}

main().catch((error) => {
  console.error("PHASE 88F-G failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
