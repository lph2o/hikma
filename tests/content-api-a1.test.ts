import { describe, expect, it } from "vitest";
import {
  getValidatedFrenchLemmaMeaningsByWord,
  getValidatedFrenchMeanings,
  getValidatedWordExplanations,
} from "../lib/learning/queries";

// ---------------------------------------------------------------------------
// Faux client Supabase (pattern des suites existantes) — builders chaînables,
// données contrôlées par table. Filtres no-op ; l'ordre fourni fait foi.
// ---------------------------------------------------------------------------

type FakeTables = Record<string, unknown[]>;

function fakeClient(tables: FakeTables) {
  const calls: string[] = [];
  const dataFor = (table: string) => tables[table] ?? [];

  const builder = (table: string) => {
    calls.push(table);
    const orders: Array<{ column: string; ascending: boolean }> = [];
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      // Le seul ordre émulé par ce fake est le ORDER BY du resolver réel :
      // updated_at (ASC/DESC). Sans clause, l'ordre du tableau fait foi.
      order: (column: string, opts?: { ascending?: boolean }) => {
        orders.push({ column, ascending: opts?.ascending ?? true });
        return chain;
      },
      limit: () => chain,
    };
    return Object.assign(chain, {
      then: (resolve: (v: unknown) => void) => {
        let rows = dataFor(table);
        for (const o of orders) {
          rows = [...rows].sort((a, b) => {
            const av = (a as Record<string, unknown>)[o.column];
            const bv = (b as Record<string, unknown>)[o.column];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return av < bv ? -1 : 1;
          });
          if (!o.ascending) rows.reverse();
        }
        resolve({ data: rows, error: null });
        return undefined;
      },
    });
  };

  return {
    from: (table: string) => builder(table),
    _calls: () => [...calls],
  };
}

describe("TASK A1 — sourceRowId additif (aucun changement de résolution)", () => {
  const wtRow = {
    id: "wt-row-1",
    word_id: "w-1",
    text: "jour",
    validated_at: "2026-08-19T16:16:09.217+00:00",
    updated_at: "2026-08-19T16:16:09.217+00:00",
    sources: { name: "Hikma — lexique éditorial" },
  };
  // Deuxième glose PLUS RÉCENTE : doit rester la retenue (updated_at DESC inchangé).
  const wtRow2 = {
    id: "wt-row-2",
    word_id: "w-1",
    text: "journée",
    validated_at: "2026-08-20T00:00:00.000+00:00",
    updated_at: "2026-08-20T00:00:00.000+00:00",
    sources: { name: "Autre source" },
  };

  it("expose sourceRowId du row réellement retenu (FORME)", async () => {
    const client = fakeClient({
      word_translations: [wtRow, wtRow2],
    });
    const map = await getValidatedFrenchMeanings(client as never, ["w-1"]);
    const entry = map.get("w-1");
    expect(entry?.text).toBe("journée"); // précédence updated_at DESC préservée
    expect(entry?.validated).toBe(true);
    expect(entry?.sourceRowId).toBe("wt-row-2"); // TASK A1 : id réel gagnant
  });

  it("n'ajoute PAS le champ quand le fixture legacy n'a pas d'id (compatibilité)", async () => {
    const legacy = { word_id: "w-1", text: "jour", validated_at: null, sources: null };
    const map = await getValidatedFrenchMeanings(
      fakeClient({ word_translations: [legacy] }) as never,
      ["w-1"],
    );
    expect(map.get("w-1")).toEqual({
      text: "jour",
      source: null,
      validated: true,
      validatedAt: null,
      sourceRowId: undefined,
    });
  });

  it("expose sourceRowId sur le canal LEMME", async () => {
    const lemmaRow = {
      id: "lt-row-9",
      lemma_id: "L-1",
      text: "jour",
      validated_at: "2026-01-02T00:00:00Z",
      sources: { name: "Kazimirski" },
    };
    const map = await getValidatedFrenchLemmaMeaningsByWord(
      fakeClient({
        quran_words: [{ id: "w-1", lemma_id: "L-1" }],
        lemma_translations: [lemmaRow],
        word_lemma_mapping: [],
      }) as never,
      ["w-1"],
    );
    expect(map.get("w-1")?.text).toBe("jour");
    expect(map.get("w-1")?.sourceRowId).toBe("lt-row-9");
  });

  it("préserve la précédence LEMME DIRECT > MAPPING avec sourceRowId du gagnant", async () => {
    const directLemma = {
      id: "lt-direct",
      lemma_id: "L-direct",
      text: "sens direct",
      validated_at: "2026-01-03T00:00:00Z",
      sources: null,
    };
    const mappedLemma = {
      id: "lt-mapped",
      lemma_id: "L-mapped",
      text: "sens via mapping",
      validated_at: "2026-01-04T00:00:00Z",
      sources: null,
    };
    const map = await getValidatedFrenchLemmaMeaningsByWord(
      fakeClient({
        quran_words: [{ id: "w-1", lemma_id: "L-direct" }],
        word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-mapped" }],
        lemma_translations: [directLemma, mappedLemma],
      }) as never,
      ["w-1"],
    );
    const entry = map.get("w-1");
    expect(entry?.text).toBe("sens direct");
    expect(entry?.sourceRowId).toBe("lt-direct");
  });

  it("expose sourceRowId sur les explications validées", async () => {
    const exRow = {
      id: "we-row-3",
      word_id: "w-1",
      text: "Le jour, période lumineuse.",
      validated_at: "2026-06-01T00:00:00Z",
      sources: { name: "Editorial Hikma" },
    };
    const map = await getValidatedWordExplanations(
      fakeClient({ word_explanations: [exRow] }) as never,
      ["w-1"],
    );
    const entry = map.get("w-1");
    expect(entry?.text).toContain("période lumineuse");
    expect(entry?.sourceRowId).toBe("we-row-3");
  });
});
