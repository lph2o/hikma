import { describe, expect, it } from "vitest";
import {
  applySkillAttempt,
  aggregateSkillMastery,
  buildCumulativeSequence,
  defaultSkillToType,
  retentionLevel,
  daysSince,
  selectNextStep,
  skillForExerciseType,
  skillMasteryLevel,
  SKILL_ORDER,
  weakestSkills,
  type Skill,
  type SkillProgressState,
  type WordBankEntry,
} from "../lib/learning";

function word(id: string, arabic: string, meaning: string): WordBankEntry {
  return { wordId: id, arabic, transliteration: null, meaning };
}

const BANK = [word("w1", "رَبِّ", "Seigneur"), word("w2", "ٱللَّهِ", "Allah")];

function state(
  skill: Skill,
  correct: number,
  incorrect: number,
  lastCorrectAt: string | null = null,
  lastIncorrectAt: string | null = null,
): SkillProgressState {
  const currentStreak = incorrect > 0 ? 0 : correct;
  return {
    skill,
    correctCount: correct,
    incorrectCount: incorrect,
    currentStreak,
    lastCorrectAt,
    lastIncorrectAt,
    mastery: skillMasteryLevel({
      correctCount: correct,
      incorrectCount: incorrect,
      currentStreak,
      lastCorrectAt,
      lastIncorrectAt,
    }),
    lastAttemptAt: null,
  };
}

describe("compétences ↔ types d'exercice", () => {
  it("associe chaque type à sa compétence", () => {
    expect(skillForExerciseType("WORD_TO_TRANSLATION")).toBe("meaning_recognition");
    expect(skillForExerciseType("COMPLETE_WORD")).toBe("meaning_recognition");
    expect(skillForExerciseType("TRANSLATION_TO_WORD")).toBe("form_recognition");
    expect(skillForExerciseType("REVERSE_TRANSLATION")).toBe("form_recognition");
    expect(skillForExerciseType("MULTIPLE_CHOICE")).toBe("form_recognition");
    expect(skillForExerciseType("FORM_TO_MEANING")).toBe("form_to_meaning");
    expect(skillForExerciseType("MEANING_TO_FORM")).toBe("meaning_to_form");
    expect(skillForExerciseType("AUDIO_TO_WORD")).toBe("audio_recognition");
    expect(skillForExerciseType("WORD_TO_AUDIO")).toBe("audio_recognition");
    expect(skillForExerciseType("CONTEXT_RECOGNITION")).toBe("context_recognition");
    expect(skillForExerciseType("LEMMA_RELATION")).toBe("lemma_relation");
  });

  it("l'auto-évaluation non notée ne cible aucune compétence", () => {
    expect(skillForExerciseType("WORD_RECOGNITION")).toBeNull();
  });

  it("la rétention est une mesure dérivée (pas de type d'exercice)", () => {
    expect(defaultSkillToType("retention")).toBeNull();
  });

  it("les compétences de rappel sont distinctes des compétences de reconnaissance", () => {
    expect(skillForExerciseType("FORM_TO_MEANING")).not.toBe(
      skillForExerciseType("WORD_TO_TRANSLATION"),
    );
  });
});

describe("maîtrise par compétence (précision + volume + récence)", () => {
  const m = (
    c: number,
    i: number,
    lastCorrectAt: string | null = null,
    lastIncorrectAt: string | null = null,
  ) =>
    skillMasteryLevel({
      correctCount: c,
      incorrectCount: i,
      currentStreak: i > 0 ? 0 : c,
      lastCorrectAt,
      lastIncorrectAt,
    });

  it("le niveau croît en corrects nets et les erreurs pénalisent", () => {
    expect(m(0, 0)).toBe(0);
    expect(m(1, 0)).toBe(25);
    expect(m(2, 0)).toBe(50);
    expect(m(3, 0)).toBe(75);
    expect(m(4, 0)).toBe(100);
    expect(m(4, 1)).toBe(75); // net 3, précision 0.8
    expect(m(1, 1)).toBe(0); // net 0
  });

  it("100 corrects + 96 erreurs ne donne plus 100 (la précision plafonne)", () => {
    const level = m(100, 96);
    expect(level).toBeLessThan(100);
    expect(level).toBe(50); // précision ~0.51 → plafond 50
  });

  it("la maîtrise complète exige ≥ 85% de précision", () => {
    expect(m(6, 1)).toBe(100); // 6/7 = 0.857 ≥ 0.85, net 5
    expect(m(5, 1)).toBe(75); // 5/6 = 0.833 < 0.85
  });

  it("une erreur diminue le niveau (pas un simple compteur de réussites)", () => {
    const prev = state("form_to_meaning", 4, 0); // 100
    const next = applySkillAttempt(prev, false);
    expect(next.mastery).toBe(75);
    expect(next.incorrectCount).toBe(1);
    expect(next.currentStreak).toBe(0);
  });

  it("une erreur récente exclut la maîtrise complète (plafond 75), sans chute disproportionnée", () => {
    expect(m(4, 1, "2026-08-16T00:00:00Z", "2026-08-17T00:00:00Z")).toBe(75);
    // Succès APRÈS l'erreur → plus d'échec récent (même précision).
    expect(m(5, 1, "2026-08-18T00:00:00Z", "2026-08-17T00:00:00Z")).toBe(75);
  });

  it("applique une réponse à un état vide", () => {
    const next = applySkillAttempt(null, true);
    expect(next.correctCount).toBe(1);
    expect(next.mastery).toBe(25);
  });

  it("agrège les compétences en une moyenne (métrique dérivée)", () => {
    const map = new Map<Skill, SkillProgressState>([
      ["meaning_recognition", state("meaning_recognition", 4, 0)], // 100
      ["form_recognition", state("form_recognition", 2, 0)], // 50
    ]);
    expect(aggregateSkillMastery(map)).toBe(75);
    expect(aggregateSkillMastery(new Map())).toBe(0);
  });

  it("liste les compétences faibles dans l'ordre pédagogique", () => {
    const map = new Map<Skill, SkillProgressState>([
      ["meaning_recognition", state("meaning_recognition", 4, 0)], // maîtrisé
    ]);
    const weak = weakestSkills(map, SKILL_ORDER);
    expect(weak).not.toContain("meaning_recognition");
    expect(weak[0]).toBe("form_recognition");
  });
});

describe("rétention (capacité à retrouver après délai)", () => {
  const base = new Date("2026-08-16T12:00:00Z");
  const day = (n: number) => new Date(base.getTime() + n * 24 * 60 * 60 * 1000);

  it("mesure le temps écoulé entre deux dates", () => {
    expect(daysSince(day(0), day(3))).toBe(3);
  });

  it("retourne 0 si jamais rappelé correctement", () => {
    expect(
      retentionLevel(
        { correctCount: 0, incorrectCount: 1, lastCorrectAt: null, lastIncorrectAt: day(0).toISOString() },
        day(0),
      ),
    ).toBe(0);
  });

  it("un échec après le dernier succès marque la perte (25)", () => {
    expect(
      retentionLevel(
        {
          correctCount: 3,
          incorrectCount: 1,
          lastCorrectAt: day(0).toISOString(),
          lastIncorrectAt: day(1).toISOString(),
        },
        day(1),
      ),
    ).toBe(25);
  });

  it("progresse avec le délai : 25 (J0) → 50 (J1) → 75 (J3) → 100 (J7)", () => {
    const lastCorrect = day(0).toISOString();
    const input = { correctCount: 4, incorrectCount: 0, lastCorrectAt: lastCorrect, lastIncorrectAt: null };
    expect(retentionLevel(input, day(0))).toBe(25);
    expect(retentionLevel(input, day(1))).toBe(50);
    expect(retentionLevel(input, day(3))).toBe(75);
    expect(retentionLevel(input, day(7))).toBe(100);
  });

  it("scénario Jour 0 succès → Jour 1 erreur → Jour 3 récupération", () => {
    expect(
      retentionLevel(
        { correctCount: 1, incorrectCount: 0, lastCorrectAt: day(0).toISOString(), lastIncorrectAt: null },
        day(0),
      ),
    ).toBe(25);
    expect(
      retentionLevel(
        {
          correctCount: 1,
          incorrectCount: 1,
          lastCorrectAt: day(0).toISOString(),
          lastIncorrectAt: day(1).toISOString(),
        },
        day(1),
      ),
    ).toBe(25); // perte
    expect(
      retentionLevel(
        {
          correctCount: 2,
          incorrectCount: 1,
          lastCorrectAt: day(3).toISOString(),
          lastIncorrectAt: day(1).toISOString(),
        },
        day(3),
      ),
    ).toBe(25); // récupération récente : pas encore de délai prouvé
  });
});

describe("séquenceur cumulatif", () => {
  it("un débutant suit reconnaissance → rappel → audio → contexte → lemme", () => {
    const steps = buildCumulativeSequence(BANK, new Map());
    const types = steps.map((s) => s.exerciseType);

    // Ronde 1 : reconnaissance du sens (2 mots)…
    expect(types[0]).toBe("WORD_TO_TRANSLATION");
    expect(types[1]).toBe("WORD_TO_TRANSLATION");
    // …puis reconnaissance de la forme…
    expect(types[2]).toBe("TRANSLATION_TO_WORD");
    // …puis rappel (forme → sens), production, audio, contexte, lemme.
    expect(types).toContain("FORM_TO_MEANING");
    expect(types).toContain("MEANING_TO_FORM");
    expect(types).toContain("AUDIO_TO_WORD");
    expect(types).toContain("CONTEXT_RECOGNITION");
    expect(types).toContain("LEMMA_RELATION");
  });

  it("saute les compétences déjà maîtrisées (utilisateur avancé)", () => {
    const progress = new Map<string, Map<Skill, SkillProgressState>>([
      [
        "w1",
        new Map([
          ["meaning_recognition", state("meaning_recognition", 4, 0)],
          ["form_recognition", state("form_recognition", 4, 0)],
        ]),
      ],
    ]);
    const steps = buildCumulativeSequence(BANK, progress);
    const w1Types = steps.filter((s) => s.wordId === "w1").map((s) => s.exerciseType);
    // w1 : plus de reconnaissance (maîtrisée), mais rappel + audio restent.
    expect(w1Types).not.toContain("WORD_TO_TRANSLATION");
    expect(w1Types).not.toContain("TRANSLATION_TO_WORD");
    expect(w1Types).toContain("FORM_TO_MEANING");
  });

  it("selectNextStep renvoie la compétence la plus faible du premier mot", () => {
    const step = selectNextStep(BANK, new Map());
    expect(step).toEqual({
      wordId: "w1",
      exerciseType: "WORD_TO_TRANSLATION",
      skill: "meaning_recognition",
    });
  });

  it("selectNextStep renvoie null quand tout est maîtrisé", () => {
    const progress = new Map<string, Map<Skill, SkillProgressState>>();
    for (const w of BANK) {
      const perWord = new Map<Skill, SkillProgressState>();
      for (const skill of SKILL_ORDER) perWord.set(skill, state(skill, 4, 0));
      progress.set(w.wordId, perWord);
    }
    expect(selectNextStep(BANK, progress)).toBeNull();
  });
});

describe("ré-activation par rétention (compétence faible = revient)", () => {
  it("ré-active le rappel maîtrisé tant que la rétention < 3 jours", () => {
    const progress = new Map<string, Map<Skill, SkillProgressState>>([
      [
        "w1",
        new Map([
          ["form_to_meaning", state("form_to_meaning", 4, 0)], // 100
          ["meaning_to_form", state("meaning_to_form", 4, 0)], // 100
          ["retention", state("retention", 0, 0, null, null)], // mastery dérivée < 75
        ]),
      ],
    ]);
    // Force la rétention dérivée (25 = rappel récent, pas encore stable).
    progress.get("w1")!.get("retention")!.mastery = 25;

    const steps = buildCumulativeSequence(BANK, progress);
    const w1Recall = steps.filter(
      (s) => s.wordId === "w1" && s.exerciseType === "FORM_TO_MEANING",
    );
    expect(w1Recall.length).toBeGreaterThan(0);
  });

  it("ne ré-active pas le rappel quand la rétention est stable (≥ 75)", () => {
    const progress = new Map<string, Map<Skill, SkillProgressState>>([
      [
        "w1",
        new Map([
          ["form_to_meaning", state("form_to_meaning", 4, 0)],
          ["meaning_to_form", state("meaning_to_form", 4, 0)],
          ["retention", state("retention", 0, 0, null, null)],
        ]),
      ],
    ]);
    progress.get("w1")!.get("retention")!.mastery = 75;

    const steps = buildCumulativeSequence(BANK, progress);
    expect(
      steps.some((s) => s.wordId === "w1" && s.exerciseType === "FORM_TO_MEANING"),
    ).toBe(false);
  });
});

describe("scénario USER_NEW — 10 étapes successives", () => {
  it("progresse de la reconnaissance vers le rappel sans tout recommencer", () => {
    const progress = new Map<string, Map<Skill, SkillProgressState>>();
    const steps: Array<{ wordId: string; skill: Skill }> = [];

    for (let i = 0; i < 10; i++) {
      const step = selectNextStep(BANK, progress);
      if (!step) break;
      steps.push(step);

      // Simule une bonne réponse → mise à jour de la maîtrise de la compétence.
      const perWord = progress.get(step.wordId) ?? new Map<Skill, SkillProgressState>();
      perWord.set(
        step.skill,
        applySkillAttempt(perWord.get(step.skill) ?? null, true),
      );
      progress.set(step.wordId, perWord);
    }

    expect(steps).toHaveLength(10);
    // Commence par la reconnaissance du sens du premier mot.
    expect(steps[0].skill).toBe("meaning_recognition");
    // A atteint le rappel (production) au bout de 10 étapes.
    expect(steps.map((s) => s.skill)).toContain("form_to_meaning");
    // Jamais deux compétences non adjacentes ne sont introduites en désordre.
    const seenSkills = [...new Set(steps.map((s) => s.skill))];
    const orderIdx = seenSkills.map((s) => SKILL_ORDER.indexOf(s));
    expect(orderIdx).toEqual([...orderIdx].sort((a, b) => a - b));
  });
});

describe("scénario USER_PARTIAL_MASTERY", () => {
  it("n'introduit que les éléments nouveaux et réactive les compétences faibles", () => {
    // w1 : reconnaissance déjà maîtrisée ; w2 : débutant.
    const progress = new Map<string, Map<Skill, SkillProgressState>>([
      [
        "w1",
        new Map([
          ["meaning_recognition", state("meaning_recognition", 4, 0)],
          ["form_recognition", state("form_recognition", 4, 0)],
          ["form_to_meaning", state("form_to_meaning", 1, 0)], // faible (25)
        ]),
      ],
    ]);

    const steps = buildCumulativeSequence(BANK, progress);

    // w1 ne refait pas la reconnaissance (déjà 100)…
    const w1 = steps.filter((s) => s.wordId === "w1");
    expect(w1.some((s) => s.exerciseType === "WORD_TO_TRANSLATION")).toBe(false);
    expect(w1.some((s) => s.exerciseType === "TRANSLATION_TO_WORD")).toBe(false);
    // …mais réactive sa compétence faible (rappel).
    expect(w1.some((s) => s.exerciseType === "FORM_TO_MEANING")).toBe(true);

    // w2 reçoit la séquence complète.
    const w2 = steps.filter((s) => s.wordId === "w2");
    expect(w2.some((s) => s.exerciseType === "WORD_TO_TRANSLATION")).toBe(true);
  });
});
