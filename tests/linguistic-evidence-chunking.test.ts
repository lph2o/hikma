import { describe, expect, it } from "vitest";
import { getWordLinguisticEvidence } from "../lib/learning/queries";
import { IN_FILTER_CHUNK_SIZE } from "../lib/learning/queries";

/**
 * Phase 68B — BUG #2 : `getWordLinguisticEvidence` construisait un filtre
 * `.in("linguistic_occurrence_id", …)` non chunké. Une sourate entière produit
 * >1000 occurrences (9 → 2498), et l'URL GET dépasse le plafond HTTP/1.1 de
 * Node (undici) → « fetch failed » (Header overflow, seuil mesuré Phase 51 :
 * 395 OK / 397 FAIL). Correction canonique : les deux `.in()` (occurrences ET
 * segments) passent par `selectInChunks` (IN_FILTER_CHUNK_SIZE = 250).
 *
 * Ce test prouve, via l'API publique uniquement :
 *  - volumes >300-400 et >1000 : requêtes proportionnelles aux lots (jamais
 *    N+1), aucune omission, aucun doublon, aucun faux rattachement ;
 *  - petits volumes : comportement inchangé (1 requête par table) ;
 *  - périmètre sourate strictement respecté ;
 *  - politique « première occurrence par mot » préservée.
 */

type OccRow = {
  id: string;
  surah_number: number;
  ayah_number: number;
  position: number;
  masaq_word: string;
  masaq_stem: string | null;
  masaq_gloss_en: string | null;
  pos: string[] | null;
  case_mood: string[] | null;
  syntactic_roles: string[] | null;
  lemma_mapping_status: string | null;
  word_occurrences: { word_id: string };
};

type SegRow = {
  id: string;
  linguistic_occurrence_id: string;
  segment_no: number;
  segment_text: string;
  morph_type: string;
  morph_tag: string;
  segment_kind: "STEM" | "PARTICLE";
};

type CallRecord = { table: string; eq: { column: string; value: unknown } | null; inColumn: string | null; inValues: string[] };

function evidenceClient(occurrences: OccRow[], segments: SegRow[]) {
  const calls: CallRecord[] = [];
  const sortRows = (rows: Record<string, unknown>[], orders: string[]) => {
    if (orders.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const col of orders) {
        const av = a[col] as number | string;
        const bv = b[col] as number | string;
        if (av < bv) return -1;
        if (av > bv) return 1;
      }
      return 0;
    });
  };
  const builder = (table: string) => {
    let eq: CallRecord["eq"] = null;
    let inColumn: string | null = null;
    let inValues: string[] = [];
    const orders: string[] = [];
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        eq = { column, value };
        return chain;
      },
      in: (column: string, values: string[]) => {
        inColumn = column;
        inValues = values;
        return chain;
      },
      order: (column: string) => {
        orders.push(column);
        return chain;
      },
      then: (resolve: (v: { data: unknown[]; error: null }) => void) => {
        calls.push({ table, eq, inColumn, inValues });
        let data: Record<string, unknown>[];
        if (table === "linguistic_occurrences") {
          data = occurrences.filter((r) => {
            if (eq && r.surah_number !== eq.value) return false;
            if (inColumn === "word_occurrences.word_id" && inValues.length > 0) {
              return inValues.includes(r.word_occurrences.word_id);
            }
            return true;
          }) as unknown as Record<string, unknown>[];
        } else {
          data = segments.filter((r) => {
            if (inColumn === "linguistic_occurrence_id" && inValues.length > 0) {
              return inValues.includes(r.linguistic_occurrence_id);
            }
            return true;
          }) as unknown as Record<string, unknown>[];
        }
        resolve({ data: sortRows(data, orders), error: null });
        return undefined;
      },
    };
    return chain;
  };
  return {
    from: (t: string) => builder(t),
    _calls: () => calls,
    _callsFor: (table: string) => calls.filter((c) => c.table === table),
  };
}

function occ(wordId: string, ayah: number, position: number, surah = 1): OccRow {
  return {
    id: `occ-${wordId}`,
    surah_number: surah,
    ayah_number: ayah,
    position,
    masaq_word: `m-${wordId}`,
    masaq_stem: `stem-${wordId}`,
    masaq_gloss_en: `gloss-${wordId}`,
    pos: ["NOUN"],
    case_mood: ["GENITIVE"],
    syntactic_roles: ["OBJ"],
    lemma_mapping_status: "EXACT",
    word_occurrences: { word_id: wordId },
  };
}

function seg(occurrenceId: string, n: number, text: string): SegRow {
  return {
    id: `seg-${occurrenceId}-${n}`,
    linguistic_occurrence_id: occurrenceId,
    segment_no: n,
    segment_text: text,
    morph_type: "Stem",
    morph_tag: "NOUN",
    segment_kind: "STEM",
  };
}

describe("getWordLinguisticEvidence — chunking BUG #2 (volumes >1000)", () => {
  it("501 word_ids → 3 lots d'occurrences ET 3 lots de segments, résultat complet, 0 doublon", async () => {
    const n = 501;
    const wordIds = Array.from({ length: n }, (_, i) => `w-${i}`);
    const occurrences = wordIds.map((w, i) => occ(w, 1, i + 1));
    const segments = occurrences.flatMap((o, i) => [seg(o.id, 1, `s${i}-1`), seg(o.id, 2, `s${i}-2`)]);

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, wordIds, 1);

    expect(map.size).toBe(n);
    expect(client._callsFor("linguistic_occurrences")).toHaveLength(3);
    expect(client._callsFor("linguistic_segments")).toHaveLength(3);
    // Chaque identifiant demandé exactement une fois (déduplication en entrée).
    const occIds = client._callsFor("linguistic_occurrences").flatMap((c) => c.inValues);
    expect(occIds).toHaveLength(n);
    expect(new Set(occIds).size).toBe(n);
    const segIds = client._callsFor("linguistic_segments").flatMap((c) => c.inValues);
    expect(segIds).toHaveLength(n);
  });

  it("411 word_ids (volume catalogue réel) → 2 lots, aucune omission", async () => {
    const n = 411;
    const wordIds = Array.from({ length: n }, (_, i) => `w-${i}`);
    const occurrences = wordIds.map((w, i) => occ(w, 1, i + 1));
    const segments = occurrences.map((o) => seg(o.id, 1, `s`));

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, wordIds, 1);

    expect(map.size).toBe(n);
    expect(client._callsFor("linguistic_occurrences")).toHaveLength(2);
    expect(client._callsFor("linguistic_segments")).toHaveLength(2);
  });

  it("250 word_ids = pile un lot → 1 requête par table (aucun changement aux petits volumes)", async () => {
    const n = IN_FILTER_CHUNK_SIZE;
    const wordIds = Array.from({ length: n }, (_, i) => `w-${i}`);
    const occurrences = wordIds.map((w, i) => occ(w, 1, i + 1));
    const segments = occurrences.map((o) => seg(o.id, 1, `s`));

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, wordIds, 1);

    expect(map.size).toBe(n);
    expect(client._callsFor("linguistic_occurrences")).toHaveLength(1);
    expect(client._callsFor("linguistic_segments")).toHaveLength(1);
  });

  it("petit volume (5) → comportement inchangé : 1 requête par table", async () => {
    const wordIds = ["w-1", "w-2", "w-3", "w-4", "w-5"];
    const occurrences = wordIds.map((w, i) => occ(w, 1, i + 1));
    const segments = occurrences.map((o) => seg(o.id, 1, `s`));

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, wordIds, 1);

    expect(map.size).toBe(5);
    expect(client._callsFor("linguistic_occurrences")).toHaveLength(1);
    expect(client._callsFor("linguistic_segments")).toHaveLength(1);
  });
});

describe("getWordLinguisticEvidence — absence de faux rattachement", () => {
  it("chaque mot reçoit SES segments, jamais ceux d'un autre mot", async () => {
    const occurrences = [
      occ("w-a", 1, 1),
      occ("w-b", 1, 2),
    ];
    const segments = [
      seg("occ-w-a", 1, "alpha"),
      seg("occ-w-a", 2, "alpha2"),
      seg("occ-w-b", 1, "beta"),
    ];

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, ["w-a", "w-b"], 1);

    expect(map.get("w-a")?.segments.map((s) => s.text)).toEqual(["alpha", "alpha2"]);
    expect(map.get("w-b")?.segments.map((s) => s.text)).toEqual(["beta"]);
    expect(map.get("w-a")?.segments.map((s) => s.text)).not.toContain("beta");
  });

  it("les segments d'une occurrence restent ordonnés par segment_no", async () => {
    const occurrences = [occ("w-a", 1, 1)];
    // Insérés dans le désordre pour prouver que le tri est appliqué.
    const segments = [seg("occ-w-a", 3, "trois"), seg("occ-w-a", 1, "un"), seg("occ-w-a", 2, "deux")];

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, ["w-a"], 1);

    expect(map.get("w-a")?.segments.map((s) => s.segmentNo)).toEqual([1, 2, 3]);
  });
});

describe("getWordLinguisticEvidence — périmètre & politique par mot", () => {
  it("respecte le filtre surah_number : les occurrences d'une autre sourate sont exclues", async () => {
    const occurrences = [occ("w-a", 1, 1, 1), occ("w-b", 1, 1, 2)];
    const segments = [seg("occ-w-a", 1, "un"), seg("occ-w-b", 1, "deux")];

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, ["w-a", "w-b"], 1);

    // w-b est en sourate 2 → exclu du résultat malgré son word_id demandé.
    expect(map.has("w-a")).toBe(true);
    expect(map.has("w-b")).toBe(false);
  });

  it("garde la PREMIÈRE occurrence par mot (ordre ayah_number, position)", async () => {
    // w-a apparaît deux fois (ayah 1 puis ayah 2) : seule la première est retenue.
    const occurrences = [
      occ("w-a", 1, 1),
      occ("w-a", 2, 1),
    ];
    const segments = [seg("occ-w-a", 1, "premiere"), seg("occ-w-a", 2, "seconde")];
    // Les deux occurrences partagent le même id d'occurrence source (même mot),
    // on distingue par ayah_number.
    occurrences[0]!.id = "occ-w-a-1";
    occurrences[1]!.id = "occ-w-a-2";
    segments[0] = seg("occ-w-a-1", 1, "premiere");
    segments[1] = seg("occ-w-a-2", 1, "seconde");

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, ["w-a", "w-a"], 1);

    expect(map.size).toBe(1);
    expect(map.get("w-a")?.ayah).toBe(1);
    expect(map.get("w-a")?.segments.map((s) => s.text)).toEqual(["premiere"]);
  });

  it("déduplique les word_ids en entrée (aucun lot en double)", async () => {
    const distinct = Array.from({ length: 300 }, (_, i) => `w-${i}`);
    const duplicated = [...distinct, ...distinct]; // 600 entrées, 300 distincts
    const occurrences = distinct.map((w, i) => occ(w, 1, i + 1));
    const segments = occurrences.map((o) => seg(o.id, 1, `s`));

    const client = evidenceClient(occurrences, segments);
    const map = await getWordLinguisticEvidence(client as never, duplicated, 1);

    expect(map.size).toBe(300);
    const occIds = client._callsFor("linguistic_occurrences").flatMap((c) => c.inValues);
    expect(occIds).toHaveLength(300); // dédupliqué avant découpage
    expect(new Set(occIds).size).toBe(300);
  });
});
