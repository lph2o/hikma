import { describe, expect, it } from "vitest";
import {
  isEditorialSurah,
  planSurahCurriculum,
  MAX_REVIEW_WORDS,
  type SurahCurriculumPlan,
} from "../lib/learning/surah-curriculum";

// Fixtures STRUCTURELLES — ids de test, aucune donnée coranique réelle.
function surah(number: number, id = `surah-${number}`) {
  return { id, number, name_transliteration: `Name ${number}` };
}

function planFor(
  wordsByAyah: ReadonlyMap<number, readonly string[]>,
  number = 112,
): SurahCurriculumPlan {
  return planSurahCurriculum(surah(number), wordsByAyah);
}

describe("planSurahCurriculum — structure", () => {
  it("crée un slug de parcours dérivé du numéro de sourate, jamais quran-vocabulary", () => {
    const plan = planFor(new Map([[1, ["w1", "w2"]]]));
    expect(plan.path.slug).toBe("quran-surah-112");
    expect(plan.path.slug).not.toBe("quran-vocabulary");
    expect(plan.path.surah_id).toBe("surah-112");
  });

  it("une leçon par verset non vide (jamais un nombre figé)", () => {
    const plan = planFor(
      new Map([
        [1, ["a", "b"]],
        [2, ["c"]],
        [3, []],
        [4, ["d"]],
      ]),
    );
    // Le verset 3 est vide → ignoré.
    expect(plan.lessons.map((l) => l.sort_order)).toEqual([1, 2, 4]);
    expect(plan.lessons).toHaveLength(3);
  });

  it("dérive la difficulté du numéro de verset (1 + floor(ayah/10), plafonné à 5)", () => {
    const plan = planFor(
      new Map([
        [1, ["a"]],
        [11, ["b"]],
        [41, ["c"]],
      ]),
    );
    expect(plan.lessons.map((l) => l.difficulty)).toEqual([1, 2, 5]);
  });
});

describe("planSurahCurriculum — progression cumulative plafonnée", () => {
  it("introduit les mots nouveaux avant la révision, révision plafonnée et récente d'abord", () => {
    const plan = planFor(
      new Map([
        [1, ["w1", "w2", "w3", "w4"]],
        [2, ["w5", "w6", "w7", "w8", "w9"]],
        [3, ["w10"]],
      ]),
    );
    const lesson1 = plan.lessons[0]!;
    expect(lesson1.words.map((w) => w.word_id)).toEqual(["w1", "w2", "w3", "w4"]);
    expect(lesson1.words.every((w) => w.is_new)).toBe(true);

    // Leçon 2 : 5 nouveaux + révision plafonnée aux 4 PLUS RÉCENTS déjà vus,
    // des plus récents d'abord (w4, w3, w2, w1).
    const lesson2 = plan.lessons[1]!;
    const new2 = lesson2.words.filter((w) => w.is_new).map((w) => w.word_id);
    const review2 = lesson2.words.filter((w) => !w.is_new).map((w) => w.word_id);
    expect(new2).toEqual(["w5", "w6", "w7", "w8", "w9"]);
    expect(review2).toEqual(["w4", "w3", "w2", "w1"]);
    expect(review2).toHaveLength(MAX_REVIEW_WORDS);
  });

  it("ne réintroduit jamais un mot déjà nouveau dans la même leçon", () => {
    const plan = planFor(
      new Map([
        [1, ["w1", "w2"]],
        [2, ["w2", "w3"]],
      ]),
    );
    const lesson2 = plan.lessons[1]!;
    const ids = lesson2.words.map((w) => w.word_id);
    expect(new Set(ids).size).toBe(ids.length);
    // w2 (déjà vu) n'est pas un doublon de « nouveau » : il est soit nouveau soit révision.
    expect(lesson2.words.find((w) => w.word_id === "w2")?.is_new).toBe(false);
  });
});

describe("planSurahCurriculum — isolation et absence d'invention", () => {
  it("ne référence que des word_id réellement fournis (aucune donnée inventée)", () => {
    const words = new Map<number, readonly string[]>([
      [1, ["w1", "w2"]],
      [2, ["w2", "w3"]],
    ]);
    const plan = planFor(words);
    const allowed = new Set(["w1", "w2", "w3"]);
    for (const lesson of plan.lessons) {
      for (const word of lesson.words) {
        expect(allowed.has(word.word_id)).toBe(true);
      }
    }
  });

  it("les mots d'une leçon proviennent uniquement des versets de LA sourate planifiée", () => {
    // Deux « sourates » distinctes, même forme de plan : aucune ne contient les
    // mots de l'autre.
    const a = planSurahCurriculum(surah(112), new Map([[1, ["a1", "a2"]]]));
    const b = planSurahCurriculum(surah(113), new Map([[1, ["b1", "b2"]]]));
    const aWords = a.lessons.flatMap((l) => l.words.map((w) => w.word_id));
    const bWords = b.lessons.flatMap((l) => l.words.map((w) => w.word_id));
    for (const id of aWords) expect(bWords).not.toContain(id);
    for (const id of bWords) expect(aWords).not.toContain(id);
    expect(a.path.slug).not.toBe(b.path.slug);
  });
});

describe("planSurahCurriculum — idempotence", () => {
  it("produit exactement le même plan à chaque exécution (RUN 1 = RUN 2)", () => {
    const words = new Map<number, readonly string[]>([
      [1, ["w1", "w2", "w3", "w4"]],
      [2, ["w5", "w6", "w7", "w8", "w9"]],
      [3, ["w10", "w1"]],
    ]);
    const first = planSurahCurriculum(surah(112), words);
    const second = planSurahCurriculum(surah(112), words);
    expect(second).toEqual(first);
  });

  it("ignore les doublons intra-verset sans changer le résultat", () => {
    const deduped = planFor(new Map([[1, ["w1", "w2", "w1"]]]));
    expect(deduped.lessons[0]!.words.map((w) => w.word_id)).toEqual(["w1", "w2"]);
  });
});

describe("isEditorialSurah — garde Al-Fātiḥah", () => {
  it("Al-Fātiḥah (1) est éditoriale ; les sourates pilotes ne le sont pas", () => {
    expect(isEditorialSurah(1)).toBe(true);
    expect(isEditorialSurah(112)).toBe(false);
    expect(isEditorialSurah(113)).toBe(false);
    expect(isEditorialSurah(114)).toBe(false);
    expect(isEditorialSurah(108)).toBe(false);
  });

  it("le plan généré pour la sourate 1 n'écrase jamais le slug éditorial", () => {
    const plan = planSurahCurriculum(surah(1), new Map([[1, ["w1"]]]));
    expect(plan.path.slug).toBe("quran-surah-1");
    expect(plan.path.slug).not.toBe("quran-vocabulary");
  });
});
