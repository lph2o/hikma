import { describe, expect, it } from "vitest";
import {
  IN_FILTER_CHUNK_SIZE,
  getValidatedFrenchLemmaMeaningsByWord,
  getValidatedFrenchMeanings,
  getWordLemmaMappingsByWordIds,
  getUserWordProgress,
} from "../lib/learning/queries";

/**
 * Phase 52 — chunking des `.in()` volumineux du catalogue.
 *
 * Faux client qui FILTRE réellement les lignes selon les valeurs `.in()` (pour
 * prouver absence d'omission / de doublon) et qui compte chaque appel `from()`
 * avec sa colonne `.in()` (pour prouver l'absence de N+1 : nombre d'appels
 * proportionnel au nombre de lots, pas au nombre d'identifiants).
 */

type Row = Record<string, unknown>;

type CallRecord = { table: string; inColumn: string | null; inValues: string[] };

function filteringClient(tables: Record<string, Row[]>) {
  const calls: CallRecord[] = [];
  const builder = (table: string) => {
    let inColumn: string | null = null;
    let inValues: string[] = [];
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      in: (column: string, values: string[]) => {
        inColumn = column;
        inValues = values;
        return chain;
      },
      then: (resolve: (v: unknown) => void) => {
        calls.push({ table, inColumn, inValues });
        const all = tables[table] ?? [];
        let data: Row[] = all;
        const column = inColumn;
        if (column && inValues.length > 0) {
          const set = new Set(inValues);
          data = all.filter((r) => set.has(String(r[column])));
        }
        resolve({ data, error: null });
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

const ids = (n: number, prefix = "w-"): string[] =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("chunking des .in() volumineux — getWordLemmaMappingsByWordIds", () => {
  it("F. tableau vide → aucune requête, map vide", async () => {
    const client = filteringClient({});
    const map = await getWordLemmaMappingsByWordIds(client as never, []);
    expect(map.size).toBe(0);
    expect(client._calls()).toHaveLength(0);
  });

  it("A. petit volume (< chunk) → 1 requête, résultat complet", async () => {
    const list = ids(10);
    const client = filteringClient({
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, list);
    expect(map.size).toBe(10);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(1);
  });

  it("B. exactement chunk size → 1 requête, aucun changement", async () => {
    const list = ids(IN_FILTER_CHUNK_SIZE);
    const client = filteringClient({
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, list);
    expect(map.size).toBe(IN_FILTER_CHUNK_SIZE);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(1);
  });

  it("C. chunk size + 1 → 2 requêtes, résultat complet, aucun doublon", async () => {
    const n = IN_FILTER_CHUNK_SIZE + 1;
    const list = ids(n);
    const client = filteringClient({
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, list);
    expect(map.size).toBe(n);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(2);
  });

  it("D. volume actuel (411) → 2 requêtes, aucun mot perdu, aucun doublon", async () => {
    const list = ids(411);
    const client = filteringClient({
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, list);
    expect(map.size).toBe(411);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(2);
    // Chaque identifiant demandé exactement une fois (déduplication en entrée).
    const queried = client._callsFor("word_lemma_mapping").flatMap((c) => c.inValues);
    expect(queried).toHaveLength(411);
    expect(new Set(queried).size).toBe(411);
  });

  it("E. gros volume futur (1000+) → requêtes proportionnelles aux lots, résultat complet", async () => {
    const list = ids(1001);
    const client = filteringClient({
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, list);
    expect(map.size).toBe(1001);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(5);
  });

  it("G. déduplication : entrée avec doublons → résultat dédupliqué, aucun doublon émis", async () => {
    const distinct = ids(411);
    const duplicated = [...distinct, ...distinct]; // 822 entrées, 411 distincts
    const client = filteringClient({
      word_lemma_mapping: distinct.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
    });
    const map = await getWordLemmaMappingsByWordIds(client as never, duplicated);
    expect(map.size).toBe(411);
    const queried = client._callsFor("word_lemma_mapping").flatMap((c) => c.inValues);
    expect(queried).toHaveLength(411); // dédupliqué avant découpage
    expect(new Set(queried).size).toBe(411);
  });
});

describe("chunking — getValidatedFrenchMeanings (word_translations)", () => {
  it("411 formes → 2 requêtes, toutes les gloses récupérées, aucune perte", async () => {
    const list = ids(411);
    const client = filteringClient({
      word_translations: list.map((id) => ({
        word_id: id,
        text: "glose",
        validated_at: "2026-01-01T00:00:00Z",
        sources: { name: "Hikma — lexique éditorial" },
      })),
    });
    const map = await getValidatedFrenchMeanings(client as never, list);
    expect(map.size).toBe(411);
    expect(client._callsFor("word_translations")).toHaveLength(2);
  });
});

describe("chunking — getUserWordProgress (user_word_progress)", () => {
  it("411 formes → 2 requêtes, progression complète, aucune perte", async () => {
    const list = ids(411);
    const client = filteringClient({
      user_word_progress: list.map((id) => ({ word_id: id })),
    });
    const map = await getUserWordProgress(client as never, "u-1", list);
    expect(map.size).toBe(411);
    expect(client._callsFor("user_word_progress")).toHaveLength(2);
  });
});

describe("chunking — getValidatedFrenchLemmaMeaningsByWord (quran_words + mapping)", () => {
  it("411 formes → quran_words et mapping chunkés, aucune omission", async () => {
    const list = ids(411);
    const client = filteringClient({
      quran_words: list.map((id) => ({ id, lemma_id: null })),
      word_lemma_mapping: list.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
      lemma_translations: [{ lemma_id: "L-rabb", text: "seigneur", validated_at: "2026-01-01T00:00:00Z", sources: { name: "Hikma — lexique éditorial" } }],
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, list);
    expect(map.size).toBe(411);
    expect(client._callsFor("quran_words")).toHaveLength(2);
    expect(client._callsFor("word_lemma_mapping")).toHaveLength(2);
    // lemma_translations reste une seule requête (petite cardinalité de lemmes).
    expect(client._callsFor("lemma_translations")).toHaveLength(1);
    // Aucun N+1 : 2 requêtes par table word_id, jamais 411.
    expect(client._callsFor("quran_words").flatMap((c) => c.inValues)).toHaveLength(411);
  });
});
