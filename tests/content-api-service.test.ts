import { describe, expect, it } from "vitest";
import { ContentStudioService } from "../lib/content-api/service";
import { LICENSES_V1 } from "../lib/content-api/banks";

// ---------------------------------------------------------------------------
// Faux client Supabase — même patron que les suites existantes (chaînable,
// données contrôlées par table), étendu pour les besoins du service :
// `.select(spec, { count: "exact", head: true })`, `.maybeSingle()`,
// `.range(from, to)`. Chaque table peut être soit un tableau de lignes
// (comportement par défaut : filtres no-op), soit un handler qui reçoit la
// requête ({ select, head, count, from, to }).
// ---------------------------------------------------------------------------

type HandlerResult = {
  data: unknown;
  count?: number;
  error?: { message: string } | null;
};

type HandlerQuery = {
  select: string | string[];
  head: boolean;
  count: boolean;
  from: number | null;
  to: number | null;
};

type TableHandler = (q: HandlerQuery) => HandlerResult;

type QueryBuilder = {
  select: (spec: string | string[], opts?: { count?: "exact"; head?: boolean }) => QueryBuilder;
  eq: () => QueryBuilder;
  in: () => QueryBuilder;
  order: () => QueryBuilder;
  limit: () => QueryBuilder;
  range: (from: number, to: number) => QueryBuilder;
  maybeSingle: () => { then: (resolve: (v: unknown) => void) => undefined };
  then: (resolve: (v: unknown) => void) => undefined;
};

type FakeSupabase = {
  from: (table: string) => QueryBuilder;
};

function fakeSupabase(tables: Record<string, TableHandler | unknown[]>): FakeSupabase {
  const from = (table: string): QueryBuilder => {
    const handler: TableHandler =
      typeof tables[table] === "function"
        ? (tables[table] as TableHandler)
        : () => {
            const rows = (tables[table] as unknown[] | undefined) ?? [];
            return { data: rows, count: rows.length, error: null };
          };

    let selectSpec: string | string[] = "*";
    let head = false;
    let count = false;
    let rangeFrom: number | null = null;
    let rangeTo: number | null = null;

    const query = {
      select: (spec: string | string[], opts?: { count?: "exact"; head?: boolean }): QueryBuilder => {
        selectSpec = spec;
        if (opts?.count === "exact") count = true;
        if (opts?.head) head = true;
        return query as QueryBuilder;
      },
      eq: (): QueryBuilder => query as QueryBuilder,
      in: (): QueryBuilder => query as QueryBuilder,
      order: (): QueryBuilder => query as QueryBuilder,
      limit: (): QueryBuilder => query as QueryBuilder,
      range: (from: number, to: number): QueryBuilder => {
        rangeFrom = from;
        rangeTo = to;
        return query as QueryBuilder;
      },
      maybeSingle: () => ({
        then: (resolve: (v: unknown) => void) => {
          resolve(compute(true));
          return undefined;
        },
      }),
      then: (resolve: (v: unknown) => void) => {
        resolve(compute(false));
        return undefined;
      },
    } as QueryBuilder;

    const compute = (single: boolean): HandlerResult => {
      const r = handler({ select: selectSpec, head, count, from: rangeFrom, to: rangeTo });
      if (r.error) return r;
      const rows = Array.isArray(r.data) ? r.data : [];
      const sliced =
        rangeFrom != null && rangeTo != null ? rows.slice(rangeFrom, rangeTo + 1) : rows;
      if (single) return { data: sliced[0] ?? null, error: null };
      return { data: sliced, count: r.count, error: null };
    };

    return query;
  };
  return { from: from as FakeSupabase["from"] };
}

// ---------------------------------------------------------------------------
// Fixtures (données réelles B3 : يَوْمَ, wordId du rapport)
// ---------------------------------------------------------------------------

const WORD_ID = "fc581cb3-8d05-410f-9373-a428c8d17e57";
const ARABIC = "يَوْمَ";

const wordRow = {
  id: WORD_ID,
  arabic: ARABIC,
  transliteration: "yawma",
  lemma_id: null,
};

const meaningRow = {
  id: "wt-row-2",
  word_id: WORD_ID,
  text: "jour",
  validated_at: "2026-08-20T00:00:00.000+00:00",
  updated_at: "2026-08-20T00:00:00.000+00:00",
  sources: { name: "Hikma — lexique éditorial" },
};

const occurrenceRows = [
  {
    a: {
      id: "a-2113",
      ayah_number: 113,
      text_uthmani: "…يَوْمَ ٱلْقِيَـٰمَةِ…",
      surah: { number: 2, name_transliteration: "Al-Baqarah" },
    },
  },
  {
    a: {
      id: "a-3010",
      ayah_number: 10,
      text_uthmani: "…يَوْمَ …",
      surah: { number: 3, name_transliteration: "Al-Imran" },
    },
  },
];

function revealTables(overrides: {
  wordTranslations?: unknown[];
  explanations?: unknown[];
  lemmaTranslations?: unknown[];
  lemmaMappings?: unknown[];
  occurrenceCount?: number;
  quranWords?: unknown[];
} = {}) {
  const quranWords = overrides.quranWords ?? [wordRow];
  const occurrenceCount = overrides.occurrenceCount ?? 131;
  return {
    quran_words: (q: HandlerQuery) => {
      const spec = String(q.select);
      if (spec.includes("wts:"))
        return { data: quranWords, count: quranWords.length, error: null };
      if (spec === "id, arabic, transliteration")
        return { data: quranWords, count: quranWords.length, error: null };
      if (spec === "id, lemma_id")
        return {
          data: quranWords.map((w) => ({
            id: (w as { id: string }).id,
            lemma_id: (w as { lemma_id: string | null }).lemma_id,
          })),
          count: quranWords.length,
          error: null,
        };
      return { data: quranWords, count: quranWords.length, error: null };
    },
    word_translations: overrides.wordTranslations ?? [meaningRow],
    lemma_translations: overrides.lemmaTranslations ?? [],
    word_lemma_mapping: overrides.lemmaMappings ?? [],
    word_explanations: overrides.explanations ?? [],
    word_occurrences: (q: HandlerQuery) =>
      q.head && q.select === "id"
        ? { data: null, count: occurrenceCount, error: null }
        : { data: occurrenceRows, count: occurrenceRows.length, error: null },
  };
}

describe("ContentStudioService.buildReveal — WORD_REVEAL_V1", () => {
  it("mot valide → GENERATED avec identité DB exacte", async () => {
    const service = new ContentStudioService(fakeSupabase(revealTables()) as never);
    const outcome = await service.buildReveal(WORD_ID);
    expect(outcome.status).toBe("GENERATED");
    if (outcome.status !== "GENERATED") return;
    expect(outcome.payload.word.id).toBe(WORD_ID);
    expect(outcome.payload.word.arabic).toBe(ARABIC); // valeur DB, aucune normalisation
    expect(outcome.payload.word.transliteration).toBe("yawma");
    expect(outcome.payload.templateKey).toBe("WORD_REVEAL_V1");
    expect(outcome.payload.status).toBe("GENERATED");
    expect(outcome.payload.contentKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("meaning FR validé — validated:true, aucun fallback, sourceRowId réel (TASK A1)", async () => {
    const service = new ContentStudioService(fakeSupabase(revealTables()) as never);
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.meaning.validated).toBe(true);
    expect(outcome.payload.meaning.text).toBe("jour");
    expect(outcome.payload.meaning.sourceType).toBe("FORME");
    expect(outcome.payload.meaning.sourceId).toBe("wt-row-2");
    // Aucune glose anglaise promue FR : pas de champ fallback/langue étrangère.
    expect(outcome.payload.meaning).not.toHaveProperty("isFallback");
    expect(outcome.payload.meaning).not.toHaveProperty("language");
    // Traçabilité : le canal réellement gagnant est déclaré.
    expect(outcome.payload.sources.meaningSourceId).toBe("wt-row-2");
    expect(outcome.payload.sources.meaningSourceTable).toBe("word_translations");
  });

  it("explication absente → explanation = null (jamais de placeholder)", async () => {
    const service = new ContentStudioService(fakeSupabase(revealTables()) as never);
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.explanation).toBeNull();
  });

  it("explication validée présente → block traçable", async () => {
    const service = new ContentStudioService(
      fakeSupabase(
        revealTables({
          explanations: [
            {
              id: "we-row-3",
              word_id: WORD_ID,
              text: "Le jour, période lumineuse.",
              validated_at: "2026-06-01T00:00:00Z",
              updated_at: "2026-06-01T00:00:00Z",
              sources: { name: "Editorial Hikma" },
            },
          ],
        }),
      ) as never,
    );
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.explanation?.text).toBe("Le jour, période lumineuse.");
    expect(outcome.payload.explanation?.sourceId).toBe("we-row-3");
    expect(outcome.payload.explanation?.validated).toBe(true);
    expect(outcome.payload.sources.explanationSourceId).toBe("we-row-3");
  });

  it("occurrenceCount EXACT via COUNT PostgREST (jamais hardcodé)", async () => {
    const service = new ContentStudioService(
      fakeSupabase(revealTables({ occurrenceCount: 131 })) as never,
    );
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.occurrenceCount).toBe(131);
  });

  it("firstOccurrence = min(surah*1000 + ayah) sur les occurrences réelles, excerpt inaltéré", async () => {
    const service = new ContentStudioService(
      fakeSupabase(revealTables({ occurrenceCount: 2500 })) as never, // 3 pages : boucle paginée
    );
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    // min(2*1000+113=2113, 3*1000+10=3010) = 2113 → Al-Baqarah 113.
    expect(outcome.payload.firstOccurrence.surahNumber).toBe(2);
    expect(outcome.payload.firstOccurrence.surahName).toBe("Al-Baqarah");
    expect(outcome.payload.firstOccurrence.ayahNumber).toBe(113);
    expect(outcome.payload.firstOccurrence.excerptUthmani).toBe("…يَوْمَ ٱلْقِيَـٰمَةِ…");
    expect(outcome.payload.firstOccurrence.verseTranslationFr).toBeNull(); // Hamidullah REVIEW_REQUIRED
    // R1 : l'id `ayahs` RÉEL utilisé est retracé, jamais reconstruit.
    expect(outcome.payload.sources.ayahId).toBe("a-2113");
  });

  it("licences verrouillées V1 (audio DISABLED, verseTranslation REVIEW_REQUIRED)", async () => {
    const service = new ContentStudioService(fakeSupabase(revealTables()) as never);
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.licenses).toEqual(LICENSES_V1);
    expect(outcome.payload.licenses.audio).toBe("DISABLED");
    expect(outcome.payload.licenses.verseTranslation).toBe("REVIEW_REQUIRED");
  });

  it("canal LEMME — sourceType LEMME + lemmaSourceId réel", async () => {
    const tables = revealTables({
      wordTranslations: [],
      lemmaTranslations: [
        {
          id: "lt-row-9",
          lemma_id: "L-1",
          text: "jour",
          validated_at: "2026-01-02T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          sources: { name: "Kazimirski" },
        },
      ],
      quranWords: [{ ...wordRow, lemma_id: "L-1" }],
    });
    const service = new ContentStudioService(fakeSupabase(tables) as never);
    const outcome = await service.buildReveal(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    expect(outcome.payload.meaning.sourceType).toBe("LEMME");
    expect(outcome.payload.meaning.sourceId).toBe("lt-row-9");
    expect(outcome.payload.sources.meaningSourceTable).toBe("lemma_translations");
    expect(outcome.payload.sources.lemmaSourceId).toBe("lt-row-9");
  });

  it("aucune glose FR validée → NO_VALIDATED_MEANING (rejet, jamais fallback EN)", async () => {
    const tables = revealTables({
      wordTranslations: [],
      lemmaTranslations: [],
      lemmaMappings: [],
    });
    const service = new ContentStudioService(fakeSupabase(tables) as never);
    const outcome = await service.buildReveal(WORD_ID);
    expect(outcome).toMatchObject({
      status: "REJECTED",
      code: "NO_VALIDATED_MEANING",
    });
  });

  it("wordId non UUID → ContentApiError INVALID_WORD_ID", async () => {
    const service = new ContentStudioService(fakeSupabase(revealTables()) as never);
    await expect(service.buildReveal("pas-un-uuid")).rejects.toMatchObject({
      code: "INVALID_WORD_ID",
    });
  });

  it("mot inconnu → ContentApiError WORD_NOT_FOUND", async () => {
    const tables = revealTables({ quranWords: [] });
    const service = new ContentStudioService(fakeSupabase(tables) as never);
    await expect(service.buildReveal(WORD_ID)).rejects.toMatchObject({
      code: "WORD_NOT_FOUND",
    });
  });
});

describe("ContentStudioService.buildQuiz — WORD_QUIZ_V1", () => {
  const distractors = [
    { id: "d-1", word_id: "d1", text: "nuit", sources: { name: "S1" } },
    { id: "d-2", word_id: "d2", text: "ciel", sources: { name: "S1" } },
    { id: "d-3", word_id: "d3", text: "terre", sources: { name: "S1" } },
    { id: "d-4", word_id: "d4", text: "mer", sources: { name: "S1" } },
  ].map((r) => ({
    ...r,
    validated_at: "2026-08-20T00:00:00.000+00:00",
    updated_at: "2026-08-20T00:00:00.000+00:00",
  }));

  function quizTables() {
    const allWords = [
      wordRow,
      ...distractors.map((d, i) => ({
        id: d.word_id,
        arabic: `كلمة${i}`,
        transliteration: null,
        lemma_id: null,
      })),
    ];
    return revealTables({
      quranWords: allWords,
      wordTranslations: [meaningRow, ...distractors],
    });
  }

  it("quiz valide — 4 options, 1 correcte, question gelée, banques FR validées", async () => {
    const service = new ContentStudioService(fakeSupabase(quizTables()) as never);
    const outcome = await service.buildQuiz(WORD_ID);
    if (outcome.status !== "GENERATED") throw new Error("attendu GENERATED");
    const quiz = outcome.payload.quiz;
    expect(quiz.question).toBe("Que signifie ce mot ?");
    expect(quiz.options).toHaveLength(4);
    expect(quiz.options.filter((o) => o.isCorrect)).toHaveLength(1);
    const contents = quiz.options.map((o) => o.content);
    expect(new Set(contents).size).toBe(4); // aucun doublon
    expect(quiz.options.every((o) => o.confidence !== "UNKNOWN")).toBe(true);
    expect(quiz.options.find((o) => o.isCorrect)?.content).toBe("jour");
    expect(outcome.payload.word.arabic).toBe(ARABIC);
    expect(outcome.payload.sources.meaningSourceId).toBe("wt-row-2");
    expect(outcome.payload.sources.meaningSourceTable).toBe("word_translations");
    expect(outcome.payload.sources.ayahId).toBeNull(); // R1 : MAY null pour le quiz
    expect(outcome.payload.cta).toBeNull();
    expect(outcome.payload.contentKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("banque insuffisante → le moteur ne produit pas 4 options → QUIZ_SHAPE", async () => {
    const tables = revealTables({ quranWords: [wordRow], wordTranslations: [meaningRow] });
    const service = new ContentStudioService(fakeSupabase(tables) as never);
    const outcome = await service.buildQuiz(WORD_ID);
    expect(outcome).toMatchObject({ status: "REJECTED", code: "QUIZ_SHAPE" });
  });

  it("cible sans glose FR validée → NO_VALIDATED_MEANING", async () => {
    const tables = revealTables({
      quranWords: [wordRow],
      wordTranslations: [],
      lemmaTranslations: [],
      lemmaMappings: [],
    });
    const service = new ContentStudioService(fakeSupabase(tables) as never);
    const outcome = await service.buildQuiz(WORD_ID);
    expect(outcome).toMatchObject({ status: "REJECTED", code: "NO_VALIDATED_MEANING" });
  });

  it("wordId non UUID → ContentApiError INVALID_WORD_ID", async () => {
    const service = new ContentStudioService(fakeSupabase(quizTables()) as never);
    await expect(service.buildQuiz("abc")).rejects.toMatchObject({ code: "INVALID_WORD_ID" });
  });
});

describe("ContentStudioService.listWordCandidates", () => {
  const candidateRows = [
    { id: WORD_ID, arabic: ARABIC, transliteration: "yawma" },
    { id: "c-2", arabic: "قمر", transliteration: "qamar" },
  ];

  function candidateTables() {
    return {
      ...revealTables(),
      quran_words: (q: HandlerQuery) => {
        const spec = String(q.select);
        if (spec.includes("wts:"))
          return { data: candidateRows, count: 6095, error: null }; // contrôle d'audit B3
        return { data: [wordRow], count: 1, error: null };
      },
    };
  }

  it("retourne items + total réel (count exact), sans hardcoder", async () => {
    const service = new ContentStudioService(fakeSupabase(candidateTables()) as never);
    const result = await service.listWordCandidates({ limit: 20, offset: 0 });
    expect(result.total).toBe(6095);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      wordId: WORD_ID,
      arabic: ARABIC,
      hasValidatedFrMeaning: true,
    });
  });

  it("clamp du limit : borne haute 50, borne basse 1", async () => {
    const service = new ContentStudioService(fakeSupabase(candidateTables()) as never);
    const clamped = await service.listWordCandidates({ limit: 999 });
    expect(clamped.limit).toBe(50);
    const floored = await service.listWordCandidates({ limit: 0 });
    expect(floored.limit).toBe(1);
  });

  it("offset négatif → 0", async () => {
    const service = new ContentStudioService(fakeSupabase(candidateTables()) as never);
    const result = await service.listWordCandidates({ limit: 20, offset: -5 });
    expect(result.offset).toBe(0);
  });
});
