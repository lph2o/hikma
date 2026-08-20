import { describe, expect, it } from "vitest";
import {
  MAX_MINI_REVIEW_WORDS,
  selectArabicRewriteRetryWords,
  selectMiniReviewWords,
  selectReinforcementWords,
  type SkillAttempt,
  type WordAttempts,
} from "@/lib/learning/session";
import {
  getAnticipationCopy,
  getArabicRewriteEmptyCopy,
  getArabicRewriteExactCopy,
  getArabicRewriteIntroCopy,
  getArabicRewriteMismatchCopy,
  getCombinedMiniReviewIntroCopy,
  getLessonProgressCopy,
  getMiniReviewDoneCopy,
  getMiniReviewIntroCopy,
  getSignatureCopy,
  isArabicRewriteExact,
} from "@/lib/learning/lesson-copy";

function attempts(wordId: string, results: boolean[]): WordAttempts {
  return { wordId, attempts: results };
}

describe("selectMiniReviewWords — sélection de la mini-révision", () => {
  it("aucun mot incorrect → aucune mini-révision", () => {
    expect(
      selectMiniReviewWords([
        attempts("a", [true]),
        attempts("b", [true, true]),
      ]),
    ).toEqual([]);
  });

  it("un mot incorrect → une révision", () => {
    expect(
      selectMiniReviewWords([
        attempts("a", [true]),
        attempts("b", [false]),
      ]),
    ).toEqual(["b"]);
  });

  it("plusieurs mots incorrects → ordre de première rencontre", () => {
    expect(
      selectMiniReviewWords([
        attempts("a", [false]),
        attempts("b", [true]),
        attempts("c", [false]),
      ]),
    ).toEqual(["a", "c"]);
  });

  it("un mot correct puis incorrect → candidat (au moins une erreur)", () => {
    expect(selectMiniReviewWords([attempts("a", [true, false])])).toEqual(["a"]);
  });

  it("plafonne à MAX_MINI_REVIEW_WORDS (jamais une deuxième leçon)", () => {
    const results = ["w1", "w2", "w3", "w4", "w5", "w6"].map((id) =>
      attempts(id, [false]),
    );
    const selected = selectMiniReviewWords(results);
    expect(selected.length).toBe(MAX_MINI_REVIEW_WORDS);
    expect(selected).toEqual(["w1", "w2", "w3", "w4"]);
  });

  it("déterministe : le même input donne toujours le même output", () => {
    const input = [
      attempts("x", [false]),
      attempts("y", [true]),
      attempts("z", [false, true]),
    ];
    expect(selectMiniReviewWords(input)).toEqual(selectMiniReviewWords(input));
  });

  it("liste vide → aucune révision, aucune boucle", () => {
    expect(selectMiniReviewWords([])).toEqual([]);
  });
});

describe("lesson-copy — copy pure de la leçon", () => {
  it("signature : null quand aucun contexte d'ayah (jamais inventée)", () => {
    expect(getSignatureCopy(null)).toBeNull();
    expect(getSignatureCopy("")).toBeNull();
  });

  it("signature : référence d'ayah réelle affichée telle quelle", () => {
    expect(getSignatureCopy("Al-Fātiḥah 1:3")).toContain("Al-Fātiḥah 1:3");
    expect(getSignatureCopy("Al-ʿAṣr 103:1")).toContain("tu le récites peut-être déjà");
  });

  it("anticipation : jamais de durée fictive", () => {
    expect(getAnticipationCopy(0)).toBe("Une courte session.");
    expect(getAnticipationCopy(1)).toBe("1 mot · une courte session.");
    expect(getAnticipationCopy(8)).toBe("8 mots · une courte session.");
  });

  it("mini-révision intro : accord singulier/pluriel", () => {
    expect(getMiniReviewIntroCopy(1).message).toBe(
      "1 mot mérite encore un petit rappel.",
    );
    expect(getMiniReviewIntroCopy(2).message).toBe(
      "2 mots méritent encore un petit rappel.",
    );
  });

  it("mini-révision fin : accord singulier/pluriel", () => {
    expect(getMiniReviewDoneCopy(1).message).toBe("Tu viens de renforcer 1 mot.");
    expect(getMiniReviewDoneCopy(3).message).toBe("Tu viens de renforcer 3 mots.");
  });

  it("fin de leçon : nom de sourate absent → null (jamais inventé)", () => {
    expect(getLessonProgressCopy(null)).toBeNull();
    expect(getLessonProgressCopy("")).toBeNull();
  });

  it("fin de leçon : nom de sourate présent → progression affichée", () => {
    expect(getLessonProgressCopy("Al-ʿAṣr")).toBe("Tu progresses dans Al-ʿAṣr.");
  });
});

function attempt(wordId: string, skill: SkillAttempt["skill"], correct: boolean): SkillAttempt {
  return { wordId, skill, correct };
}

describe("selectArabicRewriteRetryWords — retry d'écriture arabe", () => {
  it("aucun mot → liste vide", () => {
    expect(selectArabicRewriteRetryWords([])).toEqual([]);
  });

  it("un mot raté sur meaning_to_form → sélectionné", () => {
    expect(
      selectArabicRewriteRetryWords([attempt("a", "meaning_to_form", false)]),
    ).toEqual(["a"]);
  });

  it("quatre mots ratés → quatre sélectionnés", () => {
    const atts = ["a", "b", "c", "d"].map((id) =>
      attempt(id, "meaning_to_form", false),
    );
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["a", "b", "c", "d"]);
  });

  it("plus de quatre mots ratés → plafonné à 4", () => {
    const atts = ["a", "b", "c", "d", "e", "f"].map((id) =>
      attempt(id, "meaning_to_form", false),
    );
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["a", "b", "c", "d"]);
  });

  it("erreurs hors meaning_to_form → exclues", () => {
    const atts = [
      attempt("a", "meaning_to_form", false),
      attempt("b", "form_to_meaning", false),
      attempt("c", "meaning_recognition", false),
      attempt("d", "audio_recognition", false),
    ];
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["a"]);
  });

  it("mots corrects exclus (même sur meaning_to_form)", () => {
    const atts = [
      attempt("a", "meaning_to_form", true),
      attempt("b", "meaning_to_form", false),
    ];
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["b"]);
  });

  it("doublons dédupliqués", () => {
    const atts = [
      attempt("a", "meaning_to_form", false),
      attempt("a", "meaning_to_form", false),
      attempt("b", "meaning_to_form", false),
    ];
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["a", "b"]);
  });

  it("ordre déterministe (première rencontre)", () => {
    const atts = [
      attempt("x", "meaning_to_form", false),
      attempt("y", "meaning_recognition", false),
      attempt("z", "meaning_to_form", false),
    ];
    expect(selectArabicRewriteRetryWords(atts)).toEqual(["x", "z"]);
  });
});

describe("selectReinforcementWords — sélection combinée sans chevauchement", () => {
  function wa(wordId: string, results: boolean[]): WordAttempts {
    return { wordId, attempts: results };
  }

  it("aucune erreur → deux listes vides", () => {
    expect(selectReinforcementWords([], [])).toEqual({
      arabicRetryWordIds: [],
      selfReviewWordIds: [],
    });
  });

  it("1 erreur arabe + 1 erreur de sens → séparées, sans doublon", () => {
    const sel = selectReinforcementWords(
      [wa("a", [false]), wa("b", [false])],
      [
        attempt("a", "meaning_to_form", false),
        attempt("b", "form_to_meaning", false),
      ],
    );
    expect(sel.arabicRetryWordIds).toEqual(["a"]);
    expect(sel.selfReviewWordIds).toEqual(["b"]);
  });

  it("4 erreurs arabes + 4 erreurs de sens → 4 et 4 (plafonds indépendants)", () => {
    const results = ["a1", "a2", "a3", "a4", "s1", "s2", "s3", "s4"].map((id) =>
      wa(id, [false]),
    );
    const skillAttempts = [
      ...["a1", "a2", "a3", "a4"].map((id) => attempt(id, "meaning_to_form", false)),
      ...["s1", "s2", "s3", "s4"].map((id) => attempt(id, "form_to_meaning", false)),
    ];
    const sel = selectReinforcementWords(results, skillAttempts);
    expect(sel.arabicRetryWordIds).toEqual(["a1", "a2", "a3", "a4"]);
    expect(sel.selfReviewWordIds).toEqual(["s1", "s2", "s3", "s4"]);
  });

  it("5+ erreurs arabes → retry plafonné à 4, la 5e ne fuit PAS vers l'auto-éval", () => {
    const results = ["a1", "a2", "a3", "a4", "a5", "s1"].map((id) =>
      wa(id, [false]),
    );
    const skillAttempts = [
      ...["a1", "a2", "a3", "a4", "a5"].map((id) => attempt(id, "meaning_to_form", false)),
      attempt("s1", "form_to_meaning", false),
    ];
    const sel = selectReinforcementWords(results, skillAttempts);
    expect(sel.arabicRetryWordIds).toEqual(["a1", "a2", "a3", "a4"]);
    expect(sel.selfReviewWordIds).toEqual(["s1"]);
    expect(sel.selfReviewWordIds).not.toContain("a5");
  });

  it("un mot correct sur meaning_to_form n'entre ni en retry ni en self", () => {
    const sel = selectReinforcementWords(
      [wa("a", [true])],
      [attempt("a", "meaning_to_form", true)],
    );
    expect(sel.arabicRetryWordIds).toEqual([]);
    expect(sel.selfReviewWordIds).toEqual([]);
  });
});

describe("lesson-copy — retry arabe (36E)", () => {
  it("isArabicRewriteExact : forme exacte → true", () => {
    expect(isArabicRewriteExact("رَبّ", "رَبّ")).toBe(true);
  });

  it("isArabicRewriteExact : diacritiques manquantes → false", () => {
    expect(isArabicRewriteExact("رب", "رَبّ")).toBe(false);
  });

  it("isArabicRewriteExact : saisie vide → false (jamais félicité)", () => {
    expect(isArabicRewriteExact("", "رَبّ")).toBe(false);
  });

  it("isArabicRewriteExact : lexème différent → false", () => {
    expect(isArabicRewriteExact("رحم", "رَبّ")).toBe(false);
  });

  it("intro retry arabe : accord singulier/pluriel", () => {
    expect(getArabicRewriteIntroCopy(1).message).toContain("un mot");
    expect(getArabicRewriteIntroCopy(2).message).toContain("2 mots");
  });

  it("intro combiné : retry arabe seul, auto-éval seul, ou les deux", () => {
    expect(getCombinedMiniReviewIntroCopy(0, 3)).toEqual(
      getMiniReviewIntroCopy(3),
    );
    expect(getCombinedMiniReviewIntroCopy(2, 0)).toEqual(
      getArabicRewriteIntroCopy(2),
    );
    const both = getCombinedMiniReviewIntroCopy(2, 1);
    expect(both.message).toContain("2 mots à réécrire et 1 à revoir");
  });

  it("feedback retry arabe : trois formulations non nulles et non punitives", () => {
    expect(getArabicRewriteExactCopy().length).toBeGreaterThan(0);
    expect(getArabicRewriteMismatchCopy()).not.toContain("Incorrect");
    expect(getArabicRewriteEmptyCopy()).not.toContain("Erreur");
  });
});
