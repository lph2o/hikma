/**
 * lib/linguistic/masaq-apply.ts
 *
 * Glue d'ÉCRITURE canonique de la couche linguistique MASAQ (Phase 68B).
 * Réutilise le moteur PUR (`buildImportPlan`/`assertPlanScope`) mais applique le
 * plan de façon idempotente ET auto-réparante, sans N+1 :
 *
 *  - occurrences : upsert BULK `ignoreDuplicates` sur UNIQUE(source_id,
 *    source_record_id) — seules les occurrences absentes sont insérées ;
 *  - segments : upsert BULK `ignoreDuplicates` sur UNIQUE(linguistic_occurrence_id,
 *    segment_no) pour TOUTES les occurrences du plan (pas seulement les nouvelles),
 *    afin de combler tout trou laissé par une interruption antérieure
 *    (occurrence insérée sans ses segments).
 *
 * Invariant de reprise : relancer `applyMasaqPlan` converge toujours vers l'état
 * complet — 0 doublon (UNIQUE + dédup), 0 perte (segments recomputés), 0 réimport
 * destructif (upsert DO NOTHING), réparation automatique des segments manquants.
 *
 * Ne modifie QUE linguistic_occurrences + linguistic_segments. Aucune donnée
 * inventée : chaque ligne dérive strictement du plan produit par buildImportPlan.
 */
import { chunk, selectAllPages } from "@/lib/quran/repositories/shared";
import type { ImportPlan } from "./masaq-plan";

export type MasaqApplyRow = Record<string, unknown>;

export interface MasaqApplyResponse {
  data: MasaqApplyRow[] | null;
  error: { message: string } | null;
}

/** Contrat structurel minimal (chaînable + thenable) satisfait par le client
 * Supabase service-role réel comme par les mocks de test. */
export interface MasaqApplyQuery {
  select: (columns: string) => MasaqApplyQuery;
  eq: (column: string, value: unknown) => MasaqApplyQuery;
  order: (column: string) => MasaqApplyQuery;
  range: (from: number, to: number) => MasaqApplyQuery;
  upsert: (
    rows: MasaqApplyRow[],
    opts?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) => MasaqApplyQuery;
  then: <TResult1 = MasaqApplyResponse, TResult2 = never>(
    onfulfilled?: ((value: MasaqApplyResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => PromiseLike<TResult1 | TResult2>;
}

export interface MasaqApplyClient {
  from: (table: string) => MasaqApplyQuery;
}

export interface MasaqApplyStats {
  inserted: number;
  duplicates: number;
  errors: number;
  segmentsInserted: number;
}

type PlannedOccurrence = ImportPlan["occurrences"][number];

export function buildOccurrenceRow(
  o: PlannedOccurrence,
  sourceId: string,
): MasaqApplyRow {
  return {
    word_occurrence_id: o.wordOccurrenceId,
    source_id: sourceId,
    source_record_id: o.source_record_id,
    surah_number: o.surah,
    ayah_number: o.ayah,
    position: o.position,
    alignment_status: o.alignment_status,
    masaq_word: o.masaq_word,
    masaq_stem: o.masaq_stem,
    masaq_gloss_en: o.masaq_gloss_en,
    hikma_lemma_id: o.lemmaId,
    lemma_mapping_status: o.lemma_mapping_status,
    pos: o.masaq_pos,
    case_mood: o.masaq_case_mood,
    syntactic_roles: o.masaq_syntax,
  };
}

export function buildSegmentRow(
  occurrenceId: string,
  seg: PlannedOccurrence["segments"][number],
): MasaqApplyRow {
  return {
    linguistic_occurrence_id: occurrenceId,
    segment_no: seg.segment_no,
    segment_text: seg.segment_text,
    morph_type: seg.morph_type,
    morph_tag: seg.morph_tag,
    segment_kind: seg.segment_kind,
  };
}

/**
 * PURE + testable : planifie les lignes à écrire.
 *  - occurrences : uniquement celles dont `source_record_id` est absent ;
 *  - segments : TOUTES les occurrences dont l'id est connu (existing ou venant
 *    d'être inséré) — c'est la réparation des segments manquants.
 */
export function planMasaqWrite(
  plan: ImportPlan,
  sourceId: string,
  idByRecord: Map<string, string>,
): { occurrences: MasaqApplyRow[]; segments: MasaqApplyRow[] } {
  const occurrences: MasaqApplyRow[] = [];
  for (const o of plan.occurrences) {
    if (!idByRecord.has(o.source_record_id)) occurrences.push(buildOccurrenceRow(o, sourceId));
  }

  const segments: MasaqApplyRow[] = [];
  for (const o of plan.occurrences) {
    const occId = idByRecord.get(o.source_record_id);
    if (!occId) continue; // occurrence absente (insert en échec) → segment impossible
    for (const seg of o.segments) segments.push(buildSegmentRow(occId, seg));
  }
  return { occurrences, segments };
}

export async function applyMasaqPlan(
  client: MasaqApplyClient,
  sourceId: string,
  plan: ImportPlan,
): Promise<MasaqApplyStats> {
  // 1. Index des occurrences existantes (paginé — le stock dépasse 1000 lignes).
  const idByRecord = new Map<string, string>();
  const existing = await selectAllPages<{ id: string; source_record_id: string }>(
    async (from, to) => {
      const res = await client
        .from("linguistic_occurrences")
        .select("id, source_record_id")
        .eq("source_id", sourceId)
        .order("source_record_id")
        .range(from, to);
      return {
        data: (res.data ?? []) as { id: string; source_record_id: string }[],
        error: res.error,
      };
    },
  );
  for (const r of existing) idByRecord.set(r.source_record_id, r.id);

  // 2. Occurrences : upsert des seules absentes.
  const { occurrences } = planMasaqWrite(plan, sourceId, idByRecord);
  let inserted = 0;
  let errors = 0;
  for (const batch of chunk(occurrences, 400)) {
    const res = await client
      .from("linguistic_occurrences")
      .upsert(batch, { onConflict: "source_id,source_record_id", ignoreDuplicates: true })
      .select("id, source_record_id");
    if (res.error) {
      errors += batch.length;
      continue;
    }
    for (const r of res.data ?? []) {
      if (typeof r.source_record_id === "string" && typeof r.id === "string") {
        idByRecord.set(r.source_record_id, r.id);
      }
    }
    inserted += (res.data ?? []).length;
  }

  // 3. Segments : recomputés APRÈS l'insert (les nouvelles occurrences ont un id),
  //    couvrant TOUTES les occurrences → auto-réparation des trous.
  const { segments } = planMasaqWrite(plan, sourceId, idByRecord);
  let segmentsInserted = 0;
  for (const batch of chunk(segments, 500)) {
    const res = await client
      .from("linguistic_segments")
      .upsert(batch, { onConflict: "linguistic_occurrence_id,segment_no", ignoreDuplicates: true })
      .select("id");
    if (res.error) {
      errors += batch.length;
      continue;
    }
    segmentsInserted += (res.data ?? []).length;
  }

  const duplicates = plan.occurrences.length - inserted - errors;
  return { inserted, duplicates, errors, segmentsInserted };
}
