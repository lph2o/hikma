/**
 * Hikma — plan d'import MASAQ (Phase 24G).
 *
 * Fonctions PURES de construction du plan d'import (aucune dépendance Supabase,
 * aucune écriture). Le script `scripts/import-masaq-fatihah.ts` orchestre les
 * écritures ; ce module reste testable isolément.
 *
 * Règles invariantes (Phase 24F) :
 *  - Alignement par (surah, ayah, position) — JAMAIS par chaîne arabe seule ;
 *  - source_record_id = ID de ligne MASAQ (mot) — idempotence ;
 *  - les clitiques restent des segments (jamais des mots lexicaux) ;
 *  - racines / schèmes : AUCUNE donnée MASAQ → toujours 0 ;
 *  - gloss EN MASAQ = EVIDENCE (jamais glose FR).
 */

import {
  alignKey,
  classifyAlignment,
  classifyLemmaMatch,
  classifySegment,
  type AlignmentStatus,
  type LemmaMappingStatus,
  type SegmentKind,
} from "./masaq";

/** Colonnes réelles du CSV MASAQ v2 (19) — vérifiées Phase 24D/24F. */
export const MASAQ_COLUMNS = [
  "ID",
  "Sura_No",
  "Verse_No",
  "Word_No",
  "Segment_No",
  "Word",
  "Without_Diacritics",
  "Segmented_Word",
  "Morph_Tag",
  "Morph_Type",
  "Punctuation_Mark",
  "Invariable_Declinable",
  "Syntactic_Role",
  "Possessive_Construct",
  "Case_Mood",
  "Case_Mood_Marker",
  "Phrase",
  "Phrasal_Function",
  "Gloss",
] as const;

export interface MasaqCsvRow {
  ID: string;
  Sura_No: string;
  Verse_No: string;
  Word_No: string;
  Segment_No: string;
  Word: string;
  Without_Diacritics: string;
  Segmented_Word: string;
  Morph_Tag: string;
  Morph_Type: string;
  Punctuation_Mark: string;
  Invariable_Declinable: string;
  Syntactic_Role: string;
  Possessive_Construct: string;
  Case_Mood: string;
  Case_Mood_Marker: string;
  Phrase: string;
  Phrasal_Function: string;
  Gloss: string;
}

/** Occurrence côté Hikma (champ minimaux nécessaires au plan + ids pour l'insert). */
export interface HikmaOccurrenceInput {
  surah: number;
  ayah: number;
  position: number;
  text: string;
  wordOccurrenceId?: string | null;
  quranWordId?: string | null;
  lemmaId?: string | null;
  lemmaArabic?: string | null;
}

export interface PlannedSegment {
  segment_no: number;
  segment_text: string;
  morph_type: string;
  morph_tag: string;
  segment_kind: SegmentKind;
}

export interface PlannedOccurrence {
  surah: number;
  ayah: number;
  position: number;
  /** ID de ligne MASAQ (mot) — clé d'idempotence UNIQUE(source_id, source_record_id). */
  source_record_id: string;
  alignment_status: AlignmentStatus;
  masaq_word: string;
  masaq_stem: string | null;
  masaq_gloss_en: string;
  masaq_pos: string[];
  masaq_case_mood: string[];
  masaq_syntax: string[];
  lemma_mapping_status: LemmaMappingStatus;
  segments: PlannedSegment[];
  wordOccurrenceId?: string | null;
  quranWordId?: string | null;
  lemmaId?: string | null;
}

export interface PlanStats {
  hikmaOccurrences: number;
  masaqWords: number;
  aligned: number;
  exact: number;
  exactOrthographic: number;
  variantOrthographyDocumented: number;
  ambiguous: number;
  missing: string[];
  extra: string[];
  distinctPosTags: number;
  segmentCount: number;
  minSurah: number | null;
  maxSurah: number | null;
  /** MASAQ ne fournit pas de racine → toujours 0. */
  roots: number;
  /** MASAQ ne fournit pas de schème → toujours 0 (PATTERN = FUTURE_WORK). */
  schemes: number;
}

export interface ImportPlan {
  occurrences: PlannedOccurrence[];
  stats: PlanStats;
}

/**
 * Parse le CSV MASAQ (lignes segment par segment). N'utilise pas de quote : les
 * champs arabes ne contiennent pas de virgule (vérifié Phase 24D).
 */
export function parseMasaqCsv(text: string): MasaqCsvRow[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(",");
  const rows: MasaqCsvRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    rows.push(row as unknown as MasaqCsvRow);
  }
  return rows;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((v) => v != null && v !== ""))];
}

/**
 * Morph_Type conformes au CHECK de `linguistic_segments` ('Prefix','Stem','Suffix').
 * Les marqueurs i3rab vides de MASAQ (`Other_i3rab`, Morph_Tag="None") sont des
 * artefacts sans forme réelle : exclus à l'import (AVAILABLE ≠ INFERABLE) ET
 * exclus des agrégats POS/cas/syntaxe (ils pollueraient le cas/mode réel).
 */
const IMPORTABLE_MORPH_TYPES = new Set(["Prefix", "Stem", "Suffix"]);

function importableSegments(segs: MasaqCsvRow[]): MasaqCsvRow[] {
  return segs.filter(
    (s) =>
      IMPORTABLE_MORPH_TYPES.has(s.Morph_Type) &&
      s.Morph_Tag !== "None" &&
      (s.Segmented_Word ?? "").trim() !== "" &&
      (s.Segmented_Word ?? "").trim() !== "None",
  );
}

/**
 * Construit le plan d'import (additif, isolé) pour une sourate donnée.
 *
 * - filtre MASAQ sur `opts.surah` (défaut 1) ;
 * - aligne par (surah, ayah, position) ;
 * - ne crée AUCUN mot lexical nouveau : les segments ne sont que des segments ;
 * - racines / schèmes : 0 (jamais déduits).
 */
export function buildImportPlan(
  hikma: HikmaOccurrenceInput[],
  csvText: string,
  opts: { surah?: number } = {},
): ImportPlan {
  const surah = opts.surah ?? 1;
  const rows = parseMasaqCsv(csvText);

  const masqByKey = new Map<string, MasaqCsvRow[]>();
  for (const row of rows) {
    if (row.Sura_No !== String(surah)) continue;
    const key = alignKey(Number(row.Sura_No), Number(row.Verse_No), Number(row.Word_No));
    const arr = masqByKey.get(key) ?? [];
    arr.push(row);
    masqByKey.set(key, arr);
  }

  const occurrences: PlannedOccurrence[] = [];
  const missing: string[] = [];
  let exact = 0;
  let exactOrthographic = 0;
  let variant = 0;
  let ambiguous = 0;
  let segmentCount = 0;
  const allPos = new Set<string>();
  let minSurah: number | null = null;
  let maxSurah: number | null = null;

  for (const h of hikma) {
    const key = alignKey(h.surah, h.ayah, h.position);
    const segs = masqByKey.get(key);
    if (!segs || segs.length === 0) {
      missing.push(key);
      continue;
    }

    const masaqWord = segs[0]!.Word;
    const status = classifyAlignment(h.text, masaqWord);
    if (status === "EXACT") exact += 1;
    else if (status === "EXACT_ORTHOGRAPHIC") exactOrthographic += 1;
    else if (status === "VARIANT_ORTHOGRAPHY_DOCUMENTED") variant += 1;
    else ambiguous += 1;

    // Segments importables uniquement : exclut Other_i3rab/None (artefacts).
    const realSegs = importableSegments(segs);
    // segment_no = ordre d'apparition (1..N). MASAQ contient parfois des
    // Segment_No en double (ex. 109:1:2 يَاأَيُّهَا : « يا » et « أي » tous
    // deux n°1) ; la contrainte UNIQUE(linguistic_occurrence_id, segment_no)
    // exige une numérotation unique, et l'ordre est la seule donnée fiable.
    const segments: PlannedSegment[] = realSegs.map((s, i) => ({
      segment_no: i + 1,
      segment_text: s.Segmented_Word,
      morph_type: s.Morph_Type,
      morph_tag: s.Morph_Tag,
      segment_kind: classifySegment(s.Morph_Type, s.Morph_Tag),
    }));
    segmentCount += segments.length;

    const stem = segments.find((s) => s.morph_type === "Stem")?.segment_text ?? null;
    // Agrégats calculés sur les segments RÉELS uniquement (jamais les artefacts).
    const pos = uniqueStrings(realSegs.map((s) => s.Morph_Tag));
    const caseMood = uniqueStrings(realSegs.map((s) => s.Case_Mood));
    const syntax = uniqueStrings(realSegs.map((s) => s.Syntactic_Role));
    for (const p of pos) allPos.add(p);

    minSurah = minSurah === null ? h.surah : Math.min(minSurah, h.surah);
    maxSurah = maxSurah === null ? h.surah : Math.max(maxSurah, h.surah);

    occurrences.push({
      surah: h.surah,
      ayah: h.ayah,
      position: h.position,
      source_record_id: segs[0]!.ID,
      alignment_status: status,
      masaq_word: masaqWord,
      masaq_stem: stem,
      masaq_gloss_en: segs[0]!.Gloss,
      masaq_pos: pos,
      masaq_case_mood: caseMood,
      masaq_syntax: syntax,
      lemma_mapping_status: classifyLemmaMatch(h.lemmaArabic, stem),
      segments,
      wordOccurrenceId: h.wordOccurrenceId,
      quranWordId: h.quranWordId,
      lemmaId: h.lemmaId,
    });
  }

  // Extra : clés MASAQ présentes dans le CSV mais non couvertes par Hikma.
  const alignedKeys = new Set(occurrences.map((o) => alignKey(o.surah, o.ayah, o.position)));
  const extra: string[] = [];
  for (const k of masqByKey.keys()) {
    if (!alignedKeys.has(k)) extra.push(k);
  }

  return {
    occurrences,
    stats: {
      hikmaOccurrences: hikma.length,
      masaqWords: masqByKey.size,
      aligned: occurrences.length,
      exact,
      exactOrthographic,
      variantOrthographyDocumented: variant,
      ambiguous,
      missing,
      extra,
      distinctPosTags: allPos.size,
      segmentCount,
      minSurah,
      maxSurah,
      roots: 0,
      schemes: 0,
    },
  };
}

/**
 * Garde-fou de périmètre : refuse MISSING / EXTRA / AMBIGUOUS, et garantit
 * que le plan est strictement limité à la sourate attendue (min=max=surah).
 * Retourne les stats si le plan est propre, sinon lève une erreur explicite.
 */
export function assertPlanScope(plan: ImportPlan, expectedSurah = 1): PlanStats {
  const { stats } = plan;
  if (stats.missing.length > 0) {
    throw new Error(`STOP — MISSING: ${stats.missing.join(", ")}`);
  }
  if (stats.extra.length > 0) {
    throw new Error(`STOP — EXTRA: ${stats.extra.join(", ")}`);
  }
  if (stats.ambiguous > 0) {
    throw new Error(`STOP — AMBIGUOUS: ${stats.ambiguous}`);
  }
  if (stats.minSurah !== expectedSurah || stats.maxSurah !== expectedSurah) {
    throw new Error(
      `STOP — périmètre sourate violé: min=${stats.minSurah} max=${stats.maxSurah} attendu=${expectedSurah}`,
    );
  }
  return stats;
}
