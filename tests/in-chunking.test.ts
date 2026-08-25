import { describe, expect, it } from "vitest";
import {
  IN_FILTER_CHUNK_SIZE,
  LESSON_ID_CHUNK_SIZE,
  getSurahCatalog,
  getSurahProgressByUser,
  getCoverageBySurah,
  getValidatedFrenchLemmaMeaningsByWord,
  getValidatedFrenchMeanings,
  getWordLemmaMappingsByWordIds,
  getUserWordProgress,
  getQuranCoverage,
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

function filteringClient(tables: Record<string, Row[]>, fail?: { table: string; callIndex: number }) {
  const calls: CallRecord[] = [];
  const builder = (table: string) => {
    let inColumn: string | null = null;
    let inValues: string[] = [];
    let countMode = false;
    const chain: Record<string, unknown> = {
      select: (_column?: string, opts?: { count?: string }) => {
        if (opts?.count === "exact") countMode = true;
        return chain;
      },
      eq: () => chain,
      not: () => chain,
      order: () => chain,
      limit: () => chain,
      in: (column: string, values: string[]) => {
        inColumn = column;
        inValues = values;
        return chain;
      },
      then: (resolve: (v: unknown) => void) => {
        calls.push({ table, inColumn, inValues });
        // Injection d'erreur (test de propagation) : le n-ième appel de la
        // table ciblée échoue → la fonction doit propager, jamais retourner
        // un résultat partiel.
        if (fail && fail.table === table && calls.filter((c) => c.table === table).length === fail.callIndex) {
          resolve({ data: null, error: { message: `erreur injectée (${table})` } });
          return undefined;
        }
        const all = tables[table] ?? [];
        let data: Row[] = all;
        const column = inColumn;
        if (column && inValues.length > 0) {
          const set = new Set(inValues);
          data = all.filter((r) => set.has(String(r[column])));
        }
        resolve({ data, error: null, count: countMode ? data.length : undefined });
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

const TARGET = [51, 64, 66, 67, 71, 75, 77, 79, 80, 89];

/**
 * Faux curriculum complet : 10 parcours/sourates, `lessonCount` leçons
 * publiées réparties exactement, `wordsPerLesson` lesson_words chacune.
 * Toutes les formes résolvent en FR (word_translations validées) → les 10
 * sourates sont READY. Les tables de lemme restent vides (aucun repli).
 */
function catalogTables(lessonCount: number, wordsPerLesson = 3) {
  return {
    learning_paths: TARGET.map((n, i) => ({
      id: `path-${n}`,
      slug: `surah-${n}`,
      title: `Sourate ${n}`,
      sort_order: i,
      surahs: {
        id: `surah-${n}`,
        number: n,
        name_arabic: `سورة ${n}`,
        name_transliteration: `Surah ${n}`,
      },
    })),
    units: TARGET.map((n) => ({ id: `unit-${n}`, path_id: `path-${n}` })),
    lessons: buildLessons(lessonCount),
    lesson_words: buildLessonWords(lessonCount, wordsPerLesson),
    quran_words: buildWords(lessonCount, wordsPerLesson).map((id) => ({ id, lemma_id: null, meaning: "meaning" })),
    word_translations: buildWords(lessonCount, wordsPerLesson).map((id) => ({
      word_id: id,
      text: "glose",
      validated_at: "2026-01-01T00:00:00Z",
      sources: { name: "Hikma — lexique éditorial" },
    })),
    word_lemma_mapping: [],
    lemma_translations: [],
  };
}

function buildLessons(lessonCount: number): Array<{ id: string; unit_id: string; slug: string; title: string; sort_order: number }> {
  const perPath = Math.floor(lessonCount / TARGET.length);
  const remainder = lessonCount % TARGET.length;
  const lessons: Array<{ id: string; unit_id: string; slug: string; title: string; sort_order: number }> = [];
  TARGET.forEach((n, i) => {
    const count = perPath + (i < remainder ? 1 : 0);
    for (let k = 0; k < count; k += 1) {
      lessons.push({
        id: `lesson-${n}-${k}`,
        unit_id: `unit-${n}`,
        slug: `surah-${n}-ayah-${k + 1}`,
        title: `Leçon ${k + 1}`,
        sort_order: k,
      });
    }
  });
  return lessons;
}

function buildLessonWords(lessonCount: number, wordsPerLesson: number): Array<{ lesson_id: string; word_id: string }> {
  const out: Array<{ lesson_id: string; word_id: string }> = [];
  const perPath = Math.floor(lessonCount / TARGET.length);
  const remainder = lessonCount % TARGET.length;
  TARGET.forEach((n, i) => {
    const count = perPath + (i < remainder ? 1 : 0);
    for (let k = 0; k < count; k += 1) {
      const lessonId = `lesson-${n}-${k}`;
      for (let w = 0; w < wordsPerLesson; w += 1) {
        out.push({ lesson_id: lessonId, word_id: `w-${lessonId}-${w}` });
      }
    }
  });
  return out;
}

function buildWords(lessonCount: number, wordsPerLesson: number): string[] {
  return [...new Set(buildLessonWords(lessonCount, wordsPerLesson).map((lw) => lw.word_id))];
}

describe("chunking des .in() volumineux — getSurahCatalog lesson_words (Phase 88J)", () => {
  const cases: Array<{ label: string; lessons: number; expectedChunks: number }> = [
    { label: "A. 0 lesson IDs", lessons: 0, expectedChunks: 0 },
    { label: "B. 1 lesson ID", lessons: 1, expectedChunks: 1 },
    { label: "C. exactement 200 IDs", lessons: 200, expectedChunks: 1 },
    { label: "D. 201 IDs", lessons: 201, expectedChunks: 2 },
    { label: "E. exactement 400 IDs", lessons: 400, expectedChunks: 2 },
    { label: "F. 401 IDs", lessons: 401, expectedChunks: 3 },
    { label: "G. 547 IDs (volume réel post-88H)", lessons: 547, expectedChunks: 3 },
    { label: "H. 1001 IDs (arbitraire > 547)", lessons: 1001, expectedChunks: 6 },
  ];

  for (const c of cases) {
    it(`${c.label} → ${c.expectedChunks} requête(s) lesson_words, catalogue complet`, async () => {
      const client = filteringClient(catalogTables(c.lessons));
      const catalog = await getSurahCatalog(client as never);
      const calls = client._callsFor("lesson_words");

      expect(calls).toHaveLength(c.expectedChunks);
      // Chaque lot ≤ 200 lesson_ids (aucune URL surdimensionnée).
      for (const call of calls) {
        expect(call.inValues.length).toBeLessThanOrEqual(LESSON_ID_CHUNK_SIZE);
      }
      // Aucun doublon, aucun id perdu : la réunion des lots = tous les ids.
      const queried = calls.flatMap((call) => call.inValues);
      expect(new Set(queried).size).toBe(queried.length);
      expect(queried.length).toBe(c.lessons);

      // Résultat strictement équivalent à la requête unique (même catalogue).
      expect(catalog).toHaveLength(10);
      const totalLessons = catalog.reduce((s, p) => s + p.lessonCount, 0);
      expect(totalLessons).toBe(c.lessons);
      const totalForms = catalog.reduce((s, p) => s + p.formCount, 0);
      expect(totalForms).toBe(c.lessons * 3);
      for (const p of catalog) expect(p.state).toBe("READY");
    });
  }

  it("G2. 547 leçons : chaque lesson_id demandé exactement une fois, formes par sourate cohérentes", async () => {
    const client = filteringClient(catalogTables(547));
    const catalog = await getSurahCatalog(client as never);
    const queried = client._callsFor("lesson_words").flatMap((call) => call.inValues);
    expect(queried).toHaveLength(547);
    expect(new Set(queried).size).toBe(547);
    const perPath = Math.floor(547 / 10);
    const remainder = 547 % 10;
    catalog.forEach((p, i) => {
      const expectedLessons = perPath + (i < remainder ? 1 : 0);
      expect(p.lessonCount).toBe(expectedLessons);
      expect(p.formCount).toBe(expectedLessons * 3);
    });
  });
});

/**
 * Phase 89C (R-003) — chunking du `.in("word_id", …)` de getCoverageBySurah.
 * 3 sourates ; chaque mot a une occurrence dans l'ayah `a{i%9}` (0-2 → s1,
 * 3-5 → s2, 6-8 → s3) pour tester le comptage d'ayahs distincts par sourate.
 */
function coverageTables(n: number) {
  const surahs = [
    { id: "s1", number: 1, name_translation: "Al-Fatiha", ayah_count: 7 },
    { id: "s2", number: 2, name_translation: "Al-Baqara", ayah_count: 286 },
    { id: "s3", number: 3, name_translation: "Al-Imran", ayah_count: 200 },
  ];
  const surahOfAyah = (i: number) => (i < 3 ? "s1" : i < 6 ? "s2" : "s3");
  const word_occurrences = ids(n).map((wid, i) => ({
    word_id: wid,
    ayah_id: `a${i % 9}`,
    ayahs: [{ surah_id: surahOfAyah(i % 9) }],
  }));
  return { surahs, word_occurrences };
}

/** Agrégation indépendante : même sémantique que getCoverageBySurah. */
function expectedCoverage(
  rows: Array<{ word_id: string; ayah_id: string; ayahs: Array<{ surah_id: string }> }>,
  surahs: Array<{ id: string; number: number; name_translation: string; ayah_count: number }>,
) {
  const surahAyahs = new Map<string, Set<string>>();
  for (const r of rows) {
    const sid = r.ayahs[0].surah_id;
    if (!surahAyahs.has(sid)) surahAyahs.set(sid, new Set());
    surahAyahs.get(sid)!.add(r.ayah_id);
  }
  return surahs
    .map((s) => ({
      surahNumber: s.number,
      surahName: s.name_translation,
      totalAyahs: s.ayah_count,
      coveredAyahs: surahAyahs.get(s.id)?.size ?? 0,
      coveragePercent: surahAyahs.get(s.id)?.size
        ? Math.round(((surahAyahs.get(s.id)!.size) / s.ayah_count) * 100)
        : 0,
    }))
    .filter((s) => s.coveredAyahs > 0)
    .sort((a, b) => a.surahNumber - b.surahNumber);
}

describe("chunking des .in() volumineux — getCoverageBySurah word_id (Phase 89C R-003)", () => {
  it("A. tableau vide → aucune requête, résultat []", async () => {
    const client = filteringClient({});
    const result = await getCoverageBySurah(client as never, []);
    expect(result).toEqual([]);
    expect(client._callsFor("word_occurrences")).toHaveLength(0);
  });

  it("B. 1 word_id → 1 requête, résultat agrégé correct", async () => {
    const tables = coverageTables(1);
    const client = filteringClient(tables);
    const result = await getCoverageBySurah(client as never, ids(1));
    expect(client._callsFor("word_occurrences")).toHaveLength(1);
    expect(result).toEqual(expectedCoverage(tables.word_occurrences, tables.surahs));
  });

  it("C. exactement chunk size (250) → 1 requête", async () => {
    const tables = coverageTables(IN_FILTER_CHUNK_SIZE);
    const client = filteringClient(tables);
    await getCoverageBySurah(client as never, ids(IN_FILTER_CHUNK_SIZE));
    expect(client._callsFor("word_occurrences")).toHaveLength(1);
  });

  it("D. chunk size + 1 (251) → 2 requêtes, résultat complet, aucun doublon", async () => {
    const n = IN_FILTER_CHUNK_SIZE + 1;
    const tables = coverageTables(n);
    const client = filteringClient(tables);
    const result = await getCoverageBySurah(client as never, ids(n));
    const calls = client._callsFor("word_occurrences");
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.inValues.length).toBeLessThanOrEqual(IN_FILTER_CHUNK_SIZE);
    }
    const queried = calls.flatMap((call) => call.inValues);
    expect(new Set(queried).size).toBe(queried.length);
    expect(queried.length).toBe(n);
    expect(result).toEqual(expectedCoverage(tables.word_occurrences, tables.surahs));
  });

  it("E. 500 word_ids → 2 requêtes, aucune perte (équivalence d'agrégation stricte)", async () => {
    const n = 500;
    const tables = coverageTables(n);
    const client = filteringClient(tables);
    const result = await getCoverageBySurah(client as never, ids(n));
    expect(client._callsFor("word_occurrences")).toHaveLength(2);
    expect(result).toEqual(expectedCoverage(tables.word_occurrences, tables.surahs));
    expect(result.map((r) => r.coveredAyahs).sort()).toEqual([3, 3, 3]);
  });

  it("F. 1001 word_ids → 5 requêtes (≤ 250 chacune), résultat complet", async () => {
    const n = 1001;
    const tables = coverageTables(n);
    const client = filteringClient(tables);
    const result = await getCoverageBySurah(client as never, ids(n));
    const calls = client._callsFor("word_occurrences");
    expect(calls).toHaveLength(5);
    for (const call of calls) {
      expect(call.inValues.length).toBeLessThanOrEqual(IN_FILTER_CHUNK_SIZE);
    }
    expect(result).toEqual(expectedCoverage(tables.word_occurrences, tables.surahs));
  });

  it("G. déduplication : entrée avec doublons → identifiants dédupliqués avant requêtes, même résultat", async () => {
    const distinct = ids(500);
    const duplicated = [...distinct, ...distinct];
    const tables = coverageTables(500);
    const client = filteringClient(tables);
    const result = await getCoverageBySurah(client as never, duplicated);
    const queried = client._callsFor("word_occurrences").flatMap((call) => call.inValues);
    expect(queried).toHaveLength(500);
    expect(new Set(queried).size).toBe(500);
    expect(result).toEqual(expectedCoverage(tables.word_occurrences, tables.surahs));
  });

  it("H. une erreur sur un chunk est propagée (jamais de résultat partiel)", async () => {
    const tables = coverageTables(500);
    const client = filteringClient(tables, { table: "word_occurrences", callIndex: 2 });
    await expect(getCoverageBySurah(client as never, ids(500))).rejects.toThrow(
      "word_occurrences : erreur injectée (word_occurrences)",
    );
  });
});

describe("chunking des .in() volumineux — getSurahProgressByUser lesson_ids (Phase 88K)", () => {
  const cases: Array<{ label: string; lessons: number; expectedChunks: number }> = [
    { label: "0 lesson ID", lessons: 0, expectedChunks: 0 },
    { label: "1 lesson ID", lessons: 1, expectedChunks: 1 },
    { label: "199 IDs", lessons: 199, expectedChunks: 1 },
    { label: "exactement 200 IDs", lessons: 200, expectedChunks: 1 },
    { label: "201 IDs", lessons: 201, expectedChunks: 2 },
    { label: "399 IDs", lessons: 399, expectedChunks: 2 },
    { label: "exactement 400 IDs", lessons: 400, expectedChunks: 2 },
    { label: "401 IDs", lessons: 401, expectedChunks: 3 },
    { label: "547 IDs (volume réel post-88H)", lessons: 547, expectedChunks: 3 },
    { label: "1001 IDs (arbitraire > 547)", lessons: 1001, expectedChunks: 6 },
  ];

  for (const c of cases) {
    it(`${c.label} → ${c.expectedChunks} requête(s) lesson_words ET lesson_sessions, progression complète`, async () => {
      const tables = catalogTables(c.lessons);
      // getSurahProgressByUser lit lesson_words (is_new) et lesson_sessions par
      // lesson_id ; aucune progression utilisateur (status not_started partout).
      const client = filteringClient({ ...tables, lesson_sessions: [] });
      const progress = await getSurahProgressByUser(client as never, "u-1");

      const lwCalls = client._callsFor("lesson_words");
      const sesCalls = client._callsFor("lesson_sessions");
      expect(lwCalls).toHaveLength(c.expectedChunks);
      expect(sesCalls).toHaveLength(c.expectedChunks);
      for (const call of [...lwCalls, ...sesCalls]) {
        expect(call.inValues.length).toBeLessThanOrEqual(LESSON_ID_CHUNK_SIZE);
      }
      // Réunion des lots = tous les ids, sans doublon (lesson_words ET sessions).
      for (const calls of [lwCalls, sesCalls]) {
        const queried = calls.flatMap((call) => call.inValues);
        expect(new Set(queried).size).toBe(queried.length);
        expect(queried.length).toBe(c.lessons);
      }

      // Résultat complet et non tronqué (même progression qu'avec une requête unique).
      expect(progress).toHaveLength(10);
      expect(progress.reduce((s, p) => s + p.totalLessons, 0)).toBe(c.lessons);
      for (const p of progress) expect(p.status).toBe("not_started");
    });
  }

  it("une erreur sur un chunk lesson_words est propagée (jamais de résultat partiel)", async () => {
    const tables = catalogTables(547);
    const client = filteringClient({ ...tables, lesson_sessions: [] }, { table: "lesson_words", callIndex: 2 });
    await expect(getSurahProgressByUser(client as never, "u-1")).rejects.toThrow(
      "lesson_words : erreur injectée (lesson_words)",
    );
  });

  it("une erreur sur un chunk lesson_sessions est propagée (jamais de résultat partiel)", async () => {
    const tables = catalogTables(547);
    const client = filteringClient({ ...tables, lesson_sessions: [] }, { table: "lesson_sessions", callIndex: 1 });
    await expect(getSurahProgressByUser(client as never, "u-1")).rejects.toThrow(
      "lesson_sessions : erreur injectée (lesson_sessions)",
    );
  });
});

/**
 * Phase 89K (R-89J-01) — chunking du `.in("word_id", …)` de getQuranCoverage.
 * Chaque mot distinct a exactement une occurrence ; la couverture = nombre
 * d'occurrences des mots compris. `selectInChunks` ne pouvant pas compter
 * (plafond REST 1 000 lignes, validé sur DB réelle : 250 mots / 1 376
 * occurrences → troncature à 1 000), le correctif utilise un count exact par
 * lot (head:true) avec les mêmes primitives (chunk + Promise.all + erreurs).
 */
function coverageProgressTables(n: number, progressRows = n) {
  const distinct = ids(n);
  const word_occurrences = distinct.map((wid, i) => ({ id: `occ-${i}`, word_id: wid }));
  const user_word_progress = Array.from({ length: progressRows }, (_, i) => ({
    word_id: distinct[i % distinct.length],
    status: "mastered",
  }));
  return { word_occurrences, user_word_progress };
}

describe("chunking des .in() volumineux — getQuranCoverage word_id (Phase 89K R-89J-01)", () => {
  it("A. aucun mot compris → 1 seule requête (total), couverture 0, aucune requête .in", async () => {
    const tables = coverageProgressTables(10, 0);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    expect(result).not.toBeNull();
    expect(result?.coveredOccurrences).toBe(0);
    expect(result?.totalOccurrences).toBe(10);
    expect(result?.coveragePercent).toBe(0);
    expect(client._callsFor("word_occurrences")).toHaveLength(1); // total uniquement
  });

  it("B. 1 word_id → 1 requête de couverture, résultat correct", async () => {
    const tables = coverageProgressTables(1);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    expect(result?.coveredOccurrences).toBe(1);
    expect(result?.totalOccurrences).toBe(1);
    expect(result?.coveragePercent).toBe(100);
    expect(client._callsFor("word_occurrences")).toHaveLength(2);
  });

  it("C. exactement chunk size (250) → 1 requête de couverture", async () => {
    const tables = coverageProgressTables(IN_FILTER_CHUNK_SIZE);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    expect(result?.coveredOccurrences).toBe(IN_FILTER_CHUNK_SIZE);
    expect(client._callsFor("word_occurrences")).toHaveLength(2);
  });

  it("D. chunk size + 1 (251) → 2 requêtes de couverture, résultat complet, aucun doublon", async () => {
    const n = IN_FILTER_CHUNK_SIZE + 1;
    const tables = coverageProgressTables(n);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    const calls = client._callsFor("word_occurrences");
    expect(calls).toHaveLength(3); // total + 2 lots
    for (const call of calls.slice(1)) {
      expect(call.inColumn).toBe("word_id");
      expect(call.inValues.length).toBeLessThanOrEqual(IN_FILTER_CHUNK_SIZE);
    }
    const queried = calls.slice(1).flatMap((c) => c.inValues);
    expect(new Set(queried).size).toBe(queried.length);
    expect(queried.length).toBe(n);
    expect(result?.coveredOccurrences).toBe(n);
    expect(result?.coveragePercent).toBe(100);
  });

  it("E. 500 word_ids → 2 requêtes de couverture, aucune perte", async () => {
    const tables = coverageProgressTables(500);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    expect(client._callsFor("word_occurrences")).toHaveLength(3);
    expect(result?.coveredOccurrences).toBe(500);
    expect(result?.totalOccurrences).toBe(500);
    expect(result?.coveragePercent).toBe(100);
  });

  it("F. 1001 word_ids → 5 requêtes de couverture (≤ 250 chacune), résultat complet", async () => {
    const n = 1001;
    const tables = coverageProgressTables(n);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    const calls = client._callsFor("word_occurrences");
    expect(calls).toHaveLength(6); // total + 5 lots
    for (const call of calls.slice(1)) {
      expect(call.inValues.length).toBeLessThanOrEqual(IN_FILTER_CHUNK_SIZE);
    }
    expect(result?.coveredOccurrences).toBe(n);
  });

  it("G. déduplication : progression avec doublons → ids dédupliqués avant découpage, même résultat", async () => {
    const distinct = ids(250);
    const duplicated = [...distinct, ...distinct]; // 500 lignes de progression, 250 distincts
    const tables = coverageProgressTables(250, duplicated.length);
    const client = filteringClient(tables);
    const result = await getQuranCoverage(client as never, "u-1");
    const queried = client
      ._callsFor("word_occurrences")
      .slice(1)
      .flatMap((c) => c.inValues);
    expect(queried).toHaveLength(250);
    expect(new Set(queried).size).toBe(250);
    expect(result?.coveredOccurrences).toBe(250);
  });

  it("H. une erreur sur un lot de couverture → null (jamais de résultat partiel, comportement antérieur conservé)", async () => {
    const tables = coverageProgressTables(500);
    const client = filteringClient(tables, { table: "word_occurrences", callIndex: 2 });
    const result = await getQuranCoverage(client as never, "u-1");
    expect(result).toBeNull();
  });
});
