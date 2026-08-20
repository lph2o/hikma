import { describe, expect, it } from "vitest";
import {
  getValidatedFrenchLemmaMeaningsByWord,
  getValidatedFrenchMeanings,
  getWordLemmaMappingsByWordIds,
} from "../lib/learning/queries";
import { resolveWordMeanings } from "../lib/learning/language";
import type { QuranWord } from "../types/quran";

// ---------------------------------------------------------------------------
// Faux client Supabase : builders chaînables + awaitables, avec comptage des
// appels `from()` (pour prouver l'absence de N+1). Les filtres (.eq/.in) sont
// des no-ops : chaque table retourne les données que le test contrôle.
// ---------------------------------------------------------------------------

type FakeTables = Record<string, unknown[]>;

function fakeClient(tables: FakeTables) {
  const calls: string[] = [];
  const dataFor = (table: string) => tables[table] ?? [];

  const builder = (table: string) => {
    calls.push(table);
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
    };
    return Object.assign(chain, {
      then: (resolve: (v: unknown) => void) => {
        resolve({ data: dataFor(table), error: null });
        return undefined;
      },
    });
  };

  return {
    from: (table: string) => builder(table),
    _calls: () => [...calls],
  };
}

const word = (overrides: Partial<QuranWord> = {}): QuranWord => ({
  id: "w-1",
  arabic: "رَبّ",
  transliteration: "rabb",
  meaning: "Lord",
  root: "ر-ب-ب",
  lemma_id: null,
  source_id: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const lemmaFr = (lemmaId: string, text: string) => ({
  lemma_id: lemmaId,
  text,
  validated_at: "2026-01-02T00:00:00Z",
  sources: { name: "Hikma — lexique éditorial" },
});

const formeFr = (wordId: string, text: string) => ({
  word_id: wordId,
  text,
  validated_at: "2026-01-02T00:00:00Z",
  sources: { name: "Hikma — lexique éditorial" },
});

// ---------------------------------------------------------------------------
// getWordLemmaMappingsByWordIds — surcouche additive (batch, SAFE uniquement)
// ---------------------------------------------------------------------------

describe("getWordLemmaMappingsByWordIds", () => {
  it("retourne word_id → lemma_id pour les mappings SAFE", async () => {
    const client = fakeClient({
      word_lemma_mapping: [
        { word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" },
        { word_id: "w-2", lemma_id: "L-rabb", confidence: "safe" },
      ],
    });
    const map = await getWordLemmaMappingsByWordIds(
      client as never,
      ["w-1", "w-2"],
    );
    expect(map.get("w-1")).toBe("L-rabb");
    expect(map.get("w-2")).toBe("L-rabb");
  });

  it("wordIds vide → map vide (aucune requête)", async () => {
    const client = fakeClient({});
    const map = await getWordLemmaMappingsByWordIds(client as never, []);
    expect(map.size).toBe(0);
    expect(client._calls()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getValidatedFrenchLemmaMeaningsByWord — précédence LEMME DIRECT > MAPPING
// ---------------------------------------------------------------------------

describe("getValidatedFrenchLemmaMeaningsByWord — précédence direct > mapping", () => {
  it("C. lemma_id NULL + mapping + glose FR validée → glose du mapping", async () => {
    const client = fakeClient({
      quran_words: [{ id: "w-1", lemma_id: null }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" }],
      lemma_translations: [lemmaFr("L-rabb", "seigneur")],
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]);
    expect(map.get("w-1")?.text).toBe("seigneur");
  });

  it("B. lemma_id direct + mapping différent → LEMME DIRECT prioritaire", async () => {
    const client = fakeClient({
      quran_words: [{ id: "w-1", lemma_id: "L-direct" }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-mapped", confidence: "safe" }],
      lemma_translations: [
        lemmaFr("L-direct", "jour (direct)"),
        lemmaFr("L-mapped", "seigneur (mapping)"),
      ],
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]);
    expect(map.get("w-1")?.text).toBe("jour (direct)");
  });

  it("D. mapping sans glose validée (is_validated=false invisible) → non résolu", async () => {
    // La glose non validée n'apparaît PAS dans lemma_translations (le filtre
    // is_validated=true du monde réel la rend invisible) → rien à retourner.
    const client = fakeClient({
      quran_words: [{ id: "w-1", lemma_id: null }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" }],
      lemma_translations: [], // aucune glose validée pour L-rabb
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]);
    expect(map.has("w-1")).toBe(false);
  });

  it("E. aucun mapping → comportement direct inchangé", async () => {
    const client = fakeClient({
      quran_words: [{ id: "w-1", lemma_id: "L-day" }],
      word_lemma_mapping: [],
      lemma_translations: [lemmaFr("L-day", "jour")],
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]);
    expect(map.get("w-1")?.text).toBe("jour");
  });

  it("F. multi-formes via mapping → même glose de lemme", async () => {
    const client = fakeClient({
      quran_words: [
        { id: "w-1", lemma_id: null },
        { id: "w-2", lemma_id: null },
        { id: "w-3", lemma_id: null },
      ],
      word_lemma_mapping: [
        { word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" },
        { word_id: "w-2", lemma_id: "L-rabb", confidence: "safe" },
        { word_id: "w-3", lemma_id: "L-rabb", confidence: "safe" },
      ],
      lemma_translations: [lemmaFr("L-rabb", "seigneur")],
    });
    const map = await getValidatedFrenchLemmaMeaningsByWord(client as never, [
      "w-1",
      "w-2",
      "w-3",
    ]);
    expect(map.get("w-1")?.text).toBe("seigneur");
    expect(map.get("w-2")?.text).toBe("seigneur");
    expect(map.get("w-3")?.text).toBe("seigneur");
  });
});

// ---------------------------------------------------------------------------
// Chaîne complète FORME > LEMME DIRECT > MAPPING > EN (via resolveWordMeanings)
// ---------------------------------------------------------------------------

describe("chaîne de résolution complète (forme > lemme direct > mapping > EN)", () => {
  it("A. FORME prioritaire sur le mapping (word_translation gagne)", async () => {
    const client = fakeClient({
      word_translations: [formeFr("w-1", "au nom de")],
      quran_words: [{ id: "w-1", lemma_id: null }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" }],
      lemma_translations: [lemmaFr("L-rabb", "seigneur")],
    });
    const [frenchByWord, lemmaFrenchByWord] = await Promise.all([
      getValidatedFrenchMeanings(client as never, ["w-1"]),
      getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]),
    ]);
    const m = resolveWordMeanings(
      word({ id: "w-1", lemma_id: null }),
      frenchByWord.get("w-1"),
      lemmaFrenchByWord.get("w-1"),
    );
    expect(m.text).toBe("au nom de");
    expect(m.language).toBe("fr");
    expect(m.isFallback).toBe(false);
  });

  it("C (bout en bout). forme absente + mapping + glose FR → glose du mapping", async () => {
    const client = fakeClient({
      word_translations: [],
      quran_words: [{ id: "w-1", lemma_id: null }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" }],
      lemma_translations: [lemmaFr("L-rabb", "seigneur")],
    });
    const [frenchByWord, lemmaFrenchByWord] = await Promise.all([
      getValidatedFrenchMeanings(client as never, ["w-1"]),
      getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]),
    ]);
    const m = resolveWordMeanings(
      word({ id: "w-1", lemma_id: null }),
      frenchByWord.get("w-1"),
      lemmaFrenchByWord.get("w-1"),
    );
    expect(m.text).toBe("seigneur");
    expect(m.language).toBe("fr");
    expect(m.isFallback).toBe(false);
    expect(m.isValidated).toBe(true);
  });

  it("D (bout en bout). mapping sans glose validée → fallback EN inchangé", async () => {
    const client = fakeClient({
      word_translations: [],
      quran_words: [{ id: "w-1", lemma_id: null }],
      word_lemma_mapping: [{ word_id: "w-1", lemma_id: "L-rabb", confidence: "safe" }],
      lemma_translations: [],
    });
    const [frenchByWord, lemmaFrenchByWord] = await Promise.all([
      getValidatedFrenchMeanings(client as never, ["w-1"]),
      getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]),
    ]);
    const m = resolveWordMeanings(
      word({ id: "w-1", lemma_id: null, meaning: "Lord" }),
      frenchByWord.get("w-1"),
      lemmaFrenchByWord.get("w-1"),
    );
    expect(m.text).toBe("Lord");
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
  });

  it("H. régression : les 14 gloses de lemme (chemin direct) restent accessibles", async () => {
    // يَوْمَ → lemma_id direct L-day → glose « jour », sans mapping.
    const client = fakeClient({
      word_translations: [],
      quran_words: [{ id: "w-day", lemma_id: "L-day" }],
      word_lemma_mapping: [],
      lemma_translations: [lemmaFr("L-day", "jour")],
    });
    const lemmaFrenchByWord = await getValidatedFrenchLemmaMeaningsByWord(
      client as never,
      ["w-day"],
    );
    const m = resolveWordMeanings(
      word({ id: "w-day", arabic: "يَوْمَ", lemma_id: "L-day", meaning: "day" }),
      undefined,
      lemmaFrenchByWord.get("w-day"),
    );
    expect(m.text).toBe("jour");
    expect(m.language).toBe("fr");
    expect(m.isValidated).toBe(true);
  });

  it("I. régression : les 8 word_translations (forme) restent prioritaires et intactes", async () => {
    const client = fakeClient({
      word_translations: [formeFr("w-1", "le Tout Miséricordieux")],
      quran_words: [{ id: "w-1", lemma_id: "L-rahman" }],
      word_lemma_mapping: [],
      lemma_translations: [lemmaFr("L-rahman", "miséricordieux (lemme)")],
    });
    const [frenchByWord, lemmaFrenchByWord] = await Promise.all([
      getValidatedFrenchMeanings(client as never, ["w-1"]),
      getValidatedFrenchLemmaMeaningsByWord(client as never, ["w-1"]),
    ]);
    const m = resolveWordMeanings(
      word({ id: "w-1", lemma_id: "L-rahman" }),
      frenchByWord.get("w-1"),
      lemmaFrenchByWord.get("w-1"),
    );
    expect(m.text).toBe("le Tout Miséricordieux");
    expect(m.translationSource).toContain("Hikma");
  });
});

// ---------------------------------------------------------------------------
// G. Aucun N+1 : résolution batch (3 requêtes constantes pour N mots)
// ---------------------------------------------------------------------------

describe("résolution batch — aucun N+1", () => {
  it("N mots → 3 requêtes constantes (quran_words + mapping + lemma_translations)", async () => {
    const words = ["w-1", "w-2", "w-3", "w-4", "w-5"];
    const client = fakeClient({
      quran_words: words.map((id) => ({ id, lemma_id: null })),
      word_lemma_mapping: words.map((id) => ({ word_id: id, lemma_id: "L-rabb", confidence: "safe" })),
      lemma_translations: [lemmaFr("L-rabb", "seigneur")],
    });
    await getValidatedFrenchLemmaMeaningsByWord(client as never, words);

    const calls = client._calls();
    expect(calls.filter((t) => t === "quran_words")).toHaveLength(1);
    expect(calls.filter((t) => t === "word_lemma_mapping")).toHaveLength(1);
    expect(calls.filter((t) => t === "lemma_translations")).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });
});
