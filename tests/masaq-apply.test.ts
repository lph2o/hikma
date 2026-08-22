import { describe, expect, it } from "vitest";
import {
  applyMasaqPlan,
  planMasaqWrite,
  buildOccurrenceRow,
  buildSegmentRow,
  type MasaqApplyClient,
} from "../lib/linguistic/masaq-apply";
import type { ImportPlan } from "../lib/linguistic/masaq-plan";

/**
 * Phase 68B — BUG #3 : interruption partielle entre l'insertion des occurrences
 * et celle des segments. Le glue d'écriture doit être IDEMPOTENT et
 * AUTO-RÉPARANT : relancer converge toujours vers l'état complet —
 * 0 doublon (UNIQUE + dédup), 0 perte (segments recomputés), 0 réimport
 * destructif (upsert DO NOTHING), réparation automatique des segments manquants.
 */

type PlannedOccurrence = ImportPlan["occurrences"][number];

function makeOcc(n: string, segCount: number): PlannedOccurrence {
  return {
    surah: 1,
    ayah: 1,
    position: Number(n),
    source_record_id: n,
    alignment_status: "EXACT",
    masaq_word: `word-${n}`,
    masaq_stem: `stem-${n}`,
    masaq_gloss_en: `gloss-${n}`,
    masaq_pos: ["NOUN"],
    masaq_case_mood: ["GENITIVE"],
    masaq_syntax: ["OBJ"],
    lemma_mapping_status: "EXACT",
    segments: Array.from({ length: segCount }, (_, i) => ({
      segment_no: i + 1,
      segment_text: `seg-${n}-${i + 1}`,
      morph_type: "Stem",
      morph_tag: "NOUN",
      segment_kind: "STEM" as const,
    })),
    wordOccurrenceId: `wo-${n}`,
    quranWordId: `qw-${n}`,
    lemmaId: null,
  };
}

function makePlan(occurrences: PlannedOccurrence[]): ImportPlan {
  return { occurrences, stats: {} as ImportPlan["stats"] };
}

// --- Mock client stateful (SELECT paginé + UPSERT avec UNIQUE ignoreDuplicates) ---

type OccStoreRow = Record<string, unknown> & {
  id: string;
  source_id: string;
  source_record_id: string;
};
type SegStoreRow = Record<string, unknown> & {
  id: string;
  linguistic_occurrence_id: string;
  segment_no: number;
};

function mockClient() {
  const occStore: OccStoreRow[] = [];
  const segStore: SegStoreRow[] = [];

  const project = (row: Record<string, unknown>, cols: string): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const c of cols.split(",").map((s) => s.trim())) {
      if (c in row) out[c] = row[c];
    }
    return out;
  };

  const builder = (table: string) => {
    let selectCols = "*";
    let eqCol: string | null = null;
    let eqVal: unknown;
    const orders: string[] = [];
    let range: { from: number; to: number } | null = null;
    let upsertRows: Record<string, unknown>[] | null = null;
    let ignoreDuplicates = false;

    const chain: Record<string, unknown> = {
      select: (cols: string) => {
        selectCols = cols;
        return chain;
      },
      eq: (col: string, val: unknown) => {
        eqCol = col;
        eqVal = val;
        return chain;
      },
      order: (col: string) => {
        orders.push(col);
        return chain;
      },
      range: (from: number, to: number) => {
        range = { from, to };
        return chain;
      },
      upsert: (rows: Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        upsertRows = rows;
        ignoreDuplicates = opts?.ignoreDuplicates ?? false;
        return chain;
      },
      then: (resolve: (v: { data: Record<string, unknown>[] | null; error: null }) => void) => {
        if (upsertRows) {
          // Mode UPSERT : insertion uniquement des lignes absentes (UNIQUE).
          const inserted: Record<string, unknown>[] = [];
          for (const row of upsertRows) {
            if (table === "linguistic_occurrences") {
              const exists = occStore.some(
                (r) => r.source_id === row.source_id && r.source_record_id === row.source_record_id,
              );
              if (exists && ignoreDuplicates) continue;
              if (exists) continue; // onConflict sans doublon : jamais réécrit
              const id = `occ-${String(row.source_record_id)}`;
              const stored = { ...row, id } as OccStoreRow;
              occStore.push(stored);
              inserted.push(project(stored, selectCols));
            } else {
              const exists = segStore.some(
                (r) =>
                  r.linguistic_occurrence_id === row.linguistic_occurrence_id &&
                  r.segment_no === row.segment_no,
              );
              if (exists && ignoreDuplicates) continue;
              if (exists) continue;
              const id = `seg-${String(row.linguistic_occurrence_id)}-${String(row.segment_no)}`;
              const stored = { ...row, id } as SegStoreRow;
              segStore.push(stored);
              inserted.push(project(stored, selectCols));
            }
          }
          resolve({ data: inserted, error: null });
          return undefined;
        }

        // Mode SELECT : filtrage eq + tri + range + projection.
        let rows: Record<string, unknown>[] =
          table === "linguistic_occurrences" ? (occStore as Record<string, unknown>[]) : (segStore as Record<string, unknown>[]);
        if (eqCol) rows = rows.filter((r) => r[eqCol!] === eqVal);
        if (orders.length > 0) {
          rows = [...rows].sort((a, b) => {
            for (const col of orders) {
              const av = a[col] as string;
              const bv = b[col] as string;
              if (av < bv) return -1;
              if (av > bv) return 1;
            }
            return 0;
          });
        }
        if (range) rows = rows.slice(range.from, range.to + 1);
        resolve({ data: rows.map((r) => project(r, selectCols)), error: null });
        return undefined;
      },
    };
    return chain;
  };

  const client: MasaqApplyClient = {
    from: (t: string) => builder(t) as unknown as ReturnType<MasaqApplyClient["from"]>,
  };

  return { client, occStore, segStore };
}

const SOURCE = "masaq-v2";

describe("planMasaqWrite — planification PURE", () => {
  it("occurrences absentes → toutes à insérer ; segments impossibles sans id", () => {
    const plan = makePlan([makeOcc("1", 2), makeOcc("2", 1)]);
    const { occurrences, segments } = planMasaqWrite(plan, SOURCE, new Map());
    expect(occurrences).toHaveLength(2);
    expect(occurrences.map((o) => o.source_record_id)).toEqual(["1", "2"]);
    expect(segments).toHaveLength(0); // aucun id d'occurrence connu
  });

  it("occurrences déjà présentes → 0 à insérer ; segments de TOUTES calculés (réparation)", () => {
    const plan = makePlan([makeOcc("1", 2), makeOcc("2", 1)]);
    const idByRecord = new Map([
      ["1", "occ-1"],
      ["2", "occ-2"],
    ]);
    const { occurrences, segments } = planMasaqWrite(plan, SOURCE, idByRecord);
    expect(occurrences).toHaveLength(0);
    // 2 occurrences connues → 2 + 1 segments.
    expect(segments).toHaveLength(3);
    expect(segments.filter((s) => s.linguistic_occurrence_id === "occ-1")).toHaveLength(2);
    expect(segments.filter((s) => s.linguistic_occurrence_id === "occ-2")).toHaveLength(1);
  });

  it("interruption : occurrence présente SANS segments → ses segments sont planifiés", () => {
    const plan = makePlan([makeOcc("1", 3)]);
    const idByRecord = new Map([["1", "occ-1"]]);
    const { occurrences, segments } = planMasaqWrite(plan, SOURCE, idByRecord);
    expect(occurrences).toHaveLength(0);
    expect(segments).toHaveLength(3); // réparation automatique
  });
});

describe("buildOccurrenceRow / buildSegmentRow — pas de donnée inventée", () => {
  it("buildOccurrenceRow dérive strictement du plan (aucune valeur ajoutée)", () => {
    const o = makeOcc("7", 1);
    const row = buildOccurrenceRow(o, SOURCE);
    expect(row.source_id).toBe(SOURCE);
    expect(row.source_record_id).toBe("7");
    expect(row.surah_number).toBe(1);
    expect(row.word_occurrence_id).toBe("wo-7");
    expect(row.masaq_word).toBe("word-7");
    expect(Object.keys(row).sort()).toEqual(
      [
        "alignment_status",
        "ayah_number",
        "case_mood",
        "hikma_lemma_id",
        "lemma_mapping_status",
        "masaq_gloss_en",
        "masaq_stem",
        "masaq_word",
        "pos",
        "position",
        "source_id",
        "source_record_id",
        "surah_number",
        "syntactic_roles",
        "word_occurrence_id",
      ].sort(),
    );
  });

  it("buildSegmentRow lie le segment à son occurrence et conserve l'ordre", () => {
    const row = buildSegmentRow("occ-9", makeOcc("9", 2).segments[1]!);
    expect(row.linguistic_occurrence_id).toBe("occ-9");
    expect(row.segment_no).toBe(2);
    expect(row.segment_text).toBe("seg-9-2");
  });
});

describe("applyMasaqPlan — idempotence & réparation", () => {
  it("insertion complète : N occurrences + tous les segments", async () => {
    const { client } = mockClient();
    const plan = makePlan([makeOcc("1", 2), makeOcc("2", 1), makeOcc("3", 2)]);
    const stats = await applyMasaqPlan(client, SOURCE, plan);
    expect(stats.inserted).toBe(3);
    expect(stats.segmentsInserted).toBe(5);
    expect(stats.errors).toBe(0);
    expect(stats.duplicates).toBe(0);
  });

  it("IDEMPOTENCE : seconde exécution → 0 insertion occurrence ET 0 segment", async () => {
    const { client } = mockClient();
    const plan = makePlan([makeOcc("1", 2), makeOcc("2", 1)]);
    await applyMasaqPlan(client, SOURCE, plan);
    const second = await applyMasaqPlan(client, SOURCE, plan);
    expect(second.inserted).toBe(0);
    expect(second.segmentsInserted).toBe(0);
    expect(second.errors).toBe(0);
  });

  it("RÉPARATION : occurrence présente mais segments absents → segments comblés, 0 occurrence réécrite", async () => {
    const { client, occStore } = mockClient();
    // Simule une interruption : occurrence "1" insérée, ses segments jamais écrits.
    occStore.push({ id: "occ-1", source_id: SOURCE, source_record_id: "1" });

    const plan = makePlan([makeOcc("1", 3)]);
    const stats = await applyMasaqPlan(client, SOURCE, plan);

    expect(stats.inserted).toBe(0); // aucune occurrence réécrite
    expect(stats.segmentsInserted).toBe(3); // segments manquants réparés
  });

  it("réimport non destructif : les données existantes ne sont jamais modifiées", async () => {
    const { client, occStore, segStore } = mockClient();
    occStore.push({ id: "occ-1", source_id: SOURCE, source_record_id: "1", masaq_word: "original" });
    segStore.push({ id: "seg-1", linguistic_occurrence_id: "occ-1", segment_no: 1, segment_text: "original" });

    const plan = makePlan([makeOcc("1", 1)]);
    await applyMasaqPlan(client, SOURCE, plan);

    expect(occStore).toHaveLength(1);
    expect(segStore).toHaveLength(1);
    expect(occStore[0]!.masaq_word).toBe("original"); // jamais écrasé
    expect(segStore[0]!.segment_text).toBe("original");
  });
});
