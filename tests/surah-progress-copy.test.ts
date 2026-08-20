import { describe, expect, it } from "vitest";
import {
  getSurahCompletionCopy,
  getSurahContinueEncouragement,
  getSurahHeroCopy,
  isSurahCompletionTransition,
} from "@/lib/learning/surah-progress-copy";

describe("getSurahHeroCopy", () => {
  it("accueille un utilisateur sans progression", () => {
    expect(getSurahHeroCopy({ startedCount: 0, completedCount: 0, totalAvailable: 5 })).toEqual({
      title: "Mes sourates",
      subtitle: "Commence ton parcours et découvre progressivement les mots du Coran.",
      footnote: "Une première sourate t’attend.",
    });
  });

  it("encourage un utilisateur avec progression", () => {
    expect(getSurahHeroCopy({ startedCount: 3, completedCount: 1, totalAvailable: 5 })).toEqual({
      title: "Mes sourates",
      subtitle: "Continue ton apprentissage et découvre progressivement les mots du Coran.",
      footnote: "3 sourates commencées · 1 sourate terminée",
    });
  });

  it("célèbre la fin de tous les parcours disponibles", () => {
    expect(getSurahHeroCopy({ startedCount: 0, completedCount: 5, totalAvailable: 5 })).toEqual({
      title: "Mes sourates",
      subtitle: "Bravo, tu as parcouru toutes les sourates actuellement disponibles.",
      footnote: "Tu peux revoir tes parcours terminés.",
    });
  });

  it("gère un catalogue vide sans chiffre inventé", () => {
    expect(getSurahHeroCopy({ startedCount: 0, completedCount: 0, totalAvailable: 0 })).toEqual({
      title: "Mes sourates",
      subtitle: "Les parcours arrivent bientôt.",
      footnote: null,
    });
  });

  it("ne compte jamais les sourates IN_PREPARATION dans les compteurs", () => {
    // Les stats reçues ne contiennent déjà que REFERENCE/READY : le total
    // disponible est explicite et n'inclut jamais les parcours en préparation.
    expect(getSurahHeroCopy({ startedCount: 1, completedCount: 0, totalAvailable: 1 }).footnote).toBe(
      "1 sourate commencée · 0 sourate terminée",
    );
  });
});

describe("getSurahContinueEncouragement", () => {
  it("encourage le tout début", () => {
    expect(getSurahContinueEncouragement(0, 8)).toBe("Tu viens de commencer. Continue à ton rythme.");
  });

  it("encourage un début de parcours", () => {
    expect(getSurahContinueEncouragement(2, 8)).toBe("Tu es sur la bonne voie. Continue là où tu t’es arrêté.");
  });

  it("encourage une progression avancée", () => {
    expect(getSurahContinueEncouragement(5, 8)).toBe("Tu es déjà bien avancé. Continue là où tu t’es arrêté.");
  });

  it("reste neutre sans total exploitable", () => {
    expect(getSurahContinueEncouragement(0, 0)).toBe("Continue à ton rythme.");
  });
});

describe("isSurahCompletionTransition", () => {
  it("dernière leçon + toutes les autres terminées → transition vraie", () => {
    expect(isSurahCompletionTransition(null, { completed: 7, total: 8 })).toBe(true);
  });

  it("leçon intermédiaire → pas de transition", () => {
    expect(
      isSurahCompletionTransition({ title: "Verset 2", href: "/learn/x" }, { completed: 1, total: 8 }),
    ).toBe(false);
  });

  it("sourate déjà terminée (revisite) → pas de transition", () => {
    expect(isSurahCompletionTransition(null, { completed: 8, total: 8 })).toBe(false);
  });

  it("dernière leçon mais des leçons encore non terminées avant → pas de transition", () => {
    expect(isSurahCompletionTransition(null, { completed: 4, total: 8 })).toBe(false);
  });

  it("parcours vide ou sans progression → pas de transition", () => {
    expect(isSurahCompletionTransition(null, null)).toBe(false);
    expect(isSurahCompletionTransition(null, { completed: 0, total: 0 })).toBe(false);
  });

  it("sourate à une seule leçon → terminer cette leçon est une transition", () => {
    expect(isSurahCompletionTransition(null, { completed: 0, total: 1 })).toBe(true);
  });
});

describe("getSurahCompletionCopy", () => {
  it("utilise le nom de la sourate lorsqu'il est fourni", () => {
    expect(getSurahCompletionCopy("Al-Fātiḥah")).toEqual({
      title: "Parcours terminé !",
      message: "Tu viens de parcourir Al-Fātiḥah et de découvrir ses mots.",
    });
  });

  it("reste générique sans nom (jamais de nom inventé)", () => {
    expect(getSurahCompletionCopy(null)).toEqual({
      title: "Parcours terminé !",
      message: "Tu viens de parcourir cette sourate et de découvrir ses mots.",
    });
  });

  it("nettoie un nom vide", () => {
    expect(getSurahCompletionCopy("  ").message).toBe(
      "Tu viens de parcourir cette sourate et de découvrir ses mots.",
    );
  });
});
