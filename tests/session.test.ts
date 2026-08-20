import { describe, expect, it } from "vitest";
import {
  appendAttempt,
  clampSessionIndex,
  computeLessonStatuses,
  computeSessionStats,
  hasSessionProgress,
  pendingWordAttempts,
  replayWordResults,
} from "../lib/learning/session";
import type { ProgressState } from "../lib/learning";
import type { ReviewState } from "../lib/review";
import type { UserWordProgress } from "../types/learning";

const FIXED_NOW = new Date("2026-08-13T12:00:00.000Z");

function progress(over: Partial<ProgressState>): ProgressState {
  return {
    status: "new",
    correctCount: 0,
    incorrectCount: 0,
    mastery: 0,
    intervalDays: 0,
    ...over,
  };
}

function review(over: Partial<ReviewState> = {}): ReviewState {
  return {
    status: "learning",
    intervalDays: 0,
    lastReviewAt: null,
    nextReviewAt: null,
    ...over,
  };
}

function progressRow(over: Partial<UserWordProgress>): UserWordProgress {
  return {
    id: "p1",
    user_id: "u1",
    word_id: "w1",
    status: "new",
    mastery: 0,
    correct_count: 0,
    incorrect_count: 0,
    last_seen_at: null,
    next_review_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("computeSessionStats", () => {
  it("compte mots étudiés, réponses et précision", () => {
    const stats = computeSessionStats([
      { wordId: "w1", attempts: [true, true, false] },
      { wordId: "w2", attempts: [true] },
      { wordId: "w3", attempts: [] }, // jamais répondu → non compté
    ]);
    expect(stats.wordsStudied).toBe(2);
    expect(stats.total).toBe(4);
    expect(stats.correct).toBe(3);
    expect(stats.incorrect).toBe(1);
    expect(stats.accuracy).toBe(75);
  });

  it("précision 0 sans aucune réponse", () => {
    expect(computeSessionStats([]).accuracy).toBe(0);
  });
});

describe("appendAttempt (anti-doublon par mot)", () => {
  it("ajoute une tentative à un mot déjà présent", () => {
    const base = [{ wordId: "w1", attempts: [true] }];
    expect(appendAttempt(base, "w1", false)).toEqual([
      { wordId: "w1", attempts: [true, false] },
    ]);
  });

  it("crée une entrée si le mot est nouveau", () => {
    expect(appendAttempt([], "w1", true)).toEqual([
      { wordId: "w1", attempts: [true] },
    ]);
  });

  it("ne crée jamais deux entrées pour le même mot (anti-double soumission)", () => {
    let results: ReturnType<typeof appendAttempt> = [];
    for (let i = 0; i < 5; i += 1) {
      results = appendAttempt(results, "w1", i % 2 === 0);
    }
    expect(results).toHaveLength(1);
    expect(results[0].attempts).toHaveLength(5);
  });
});

describe("pendingWordAttempts (réessai sans double avancement)", () => {
  it("garde tous les mots répondus quand aucun n'est enregistré", () => {
    const results = [
      { wordId: "w1", attempts: [true] },
      { wordId: "w2", attempts: [false] },
    ];
    expect(pendingWordAttempts(results, [])).toEqual(results);
  });

  it("écarte les mots déjà persistés lors d'un réessai", () => {
    const results = [
      { wordId: "w1", attempts: [true] },
      { wordId: "w2", attempts: [false] },
    ];
    expect(pendingWordAttempts(results, ["w1"])).toEqual([
      { wordId: "w2", attempts: [false] },
    ]);
  });

  it("ignore les mots sans réponse (jamais soumis)", () => {
    const results = [{ wordId: "w1", attempts: [] }];
    expect(pendingWordAttempts(results, [])).toEqual([]);
  });
});

describe("replayWordResults (Learning Engine + Review Engine)", () => {
  it("première bonne réponse → learning, maîtrise 25, révision dans 1 jour", () => {
    const { progress: p, review: r } = replayWordResults(null, null, [true], FIXED_NOW);
    expect(p.status).toBe("learning");
    expect(p.mastery).toBe(25);
    expect(p.correctCount).toBe(1);
    expect(r.status).toBe("learning");
    expect(r.intervalDays).toBe(1);
    expect(r.nextReviewAt).toBe("2026-08-14T12:00:00.000Z");
  });

  it("3 bonnes réponses → familiar (maîtrise 50)", () => {
    const replayed = replayWordResults(null, null, [true, true, true], FIXED_NOW);
    expect(replayed.progress.status).toBe("familiar");
    expect(replayed.progress.mastery).toBe(50);
    expect(replayed.review.intervalDays).toBe(4); // 1 → 2 → 4
  });

  it("une erreur sur un mot maîtrisé rétrograde vers familiar", () => {
    const mastered = progress({
      status: "mastered",
      correctCount: 10,
      incorrectCount: 0,
      mastery: 100,
      intervalDays: 16,
    });
    const graduated = review({ status: "review", intervalDays: 16 });
    const { progress: p, review: r } = replayWordResults(mastered, graduated, [false], FIXED_NOW);
    expect(p.status).toBe("familiar");
    expect(p.incorrectCount).toBe(1);
    expect(r.status).toBe("relearning");
    expect(r.intervalDays).toBe(1);
  });

  it("préserve la progression cumulée existante (réponses successives)", () => {
    const existing = progress({ status: "learning", correctCount: 2, mastery: 25, intervalDays: 2 });
    const existingReview = review({ status: "learning", intervalDays: 2 });
    const { progress: p } = replayWordResults(existing, existingReview, [true], FIXED_NOW);
    expect(p.correctCount).toBe(3);
  });

  it("borne la date de révision même après 30 bonnes réponses (régression Phase 63A)", () => {
    // Cas réel : un mot avec un intervalle stocké énorme (2¹⁸ = 262 144 j,
    // valeur observée en base) reçoit de nombreuses bonnes réponses dans une
    // leçon. Le doublage non borné produisait 2²² jours ≈ année 13 510 →
    // `+013510-04-02T…Z` rejeté par PostgreSQL. La date doit rester valide et
    // bornée à now + MAX_REVIEW_INTERVAL_DAYS.
    const attempts = Array(30).fill(true) as boolean[];
    const { review: r } = replayWordResults(
      null,
      review({ status: "review", intervalDays: 262144 }),
      attempts,
      FIXED_NOW,
    );
    const ms = new Date(r.nextReviewAt!).getTime();
    expect(Number.isNaN(ms)).toBe(false);
    const maxHorizon = FIXED_NOW.getTime() + 365 * 86_400_000;
    expect(ms).toBeLessThanOrEqual(maxHorizon);
    // Format PostgreSQL accepté : jamais d'année à 6 chiffres préfixée « + ».
    expect(r.nextReviewAt!.startsWith("+")).toBe(false);
    expect(r.nextReviewAt).not.toContain("+013510");
  });

  it("l'intervalle n'exprime jamais en secondes ou millisecondes", () => {
    // Le scheduler raisonne en JOURS : 1 jour ≈ 86 400 000 ms, pas 1000 ms.
    const { review: r } = replayWordResults(null, null, [true], FIXED_NOW);
    expect(r.intervalDays).toBe(1);
    const deltaMs = new Date(r.nextReviewAt!).getTime() - FIXED_NOW.getTime();
    expect(deltaMs).toBe(86_400_000); // exactement 1 jour en millisecondes
    expect(deltaMs).not.toBe(1000);
    expect(deltaMs).not.toBe(1000 * 1000);
  });
});

describe("computeLessonStatuses", () => {
  const lessons = [
    { id: "l1", wordIds: ["w1", "w2"] },
    { id: "l2", wordIds: ["w3"] },
    { id: "l3", wordIds: ["w4"] },
  ];

  const map = (rows: UserWordProgress[]) =>
    new Map(rows.map((r) => [r.word_id, r]));

  it("aucune progression : première disponible, les autres verrouillées", () => {
    const statuses = computeLessonStatuses(lessons, new Map());
    expect(statuses.get("l1")).toBe("AVAILABLE");
    expect(statuses.get("l2")).toBe("LOCKED");
    expect(statuses.get("l3")).toBe("LOCKED");
  });

  it("leçon 1 terminée → leçon 2 disponible, leçon 3 verrouillée", () => {
    const progressMap = map([
      progressRow({ word_id: "w1", status: "familiar" }),
      progressRow({ word_id: "w2", status: "mastered" }),
    ]);
    const statuses = computeLessonStatuses(lessons, progressMap);
    expect(statuses.get("l1")).toBe("COMPLETED");
    expect(statuses.get("l2")).toBe("AVAILABLE");
    expect(statuses.get("l3")).toBe("LOCKED");
  });

  it("une leçon partiellement vue → IN_PROGRESS", () => {
    const progressMap = map([
      progressRow({ word_id: "w1", status: "learning" }),
      progressRow({ word_id: "w2", status: "new" }),
    ]);
    const statuses = computeLessonStatuses(lessons, progressMap);
    expect(statuses.get("l1")).toBe("IN_PROGRESS");
  });

  it("complétée seulement si TOUS les mots sont acquis", () => {
    const progressMap = map([
      progressRow({ word_id: "w1", status: "mastered" }),
      progressRow({ word_id: "w2", status: "learning" }),
    ]);
    expect(computeLessonStatuses(lessons, progressMap).get("l1")).toBe("IN_PROGRESS");
  });

  it("une leçon sans mots n'est jamais complétée", () => {
    const statuses = computeLessonStatuses(
      [{ id: "l0", wordIds: [] }, ...lessons],
      new Map(),
    );
    expect(statuses.get("l0")).toBe("AVAILABLE");
  });
});

describe("clampSessionIndex (reprise bornée dans la séquence régénérée)", () => {
  it("NOT_STARTED : index 0 reste 0", () => {
    expect(clampSessionIndex(0, 5)).toBe(0);
  });

  it("5 exercices complétés → position 5", () => {
    expect(clampSessionIndex(5, 10)).toBe(5);
  });

  it("rechargement → position restaurée dans les bornes", () => {
    expect(clampSessionIndex(3, 10)).toBe(3);
  });

  it("borne à la fin si la séquence a raccourci (jamais hors limites)", () => {
    expect(clampSessionIndex(5, 3)).toBe(2);
  });

  it("séquence vide → 0", () => {
    expect(clampSessionIndex(4, 0)).toBe(0);
  });

  it("index négatif → 0", () => {
    expect(clampSessionIndex(-2, 5)).toBe(0);
  });

  it("idempotence : re-clamper est stable", () => {
    const once = clampSessionIndex(5, 10);
    expect(clampSessionIndex(once, 10)).toBe(once);
  });
});

describe("hasSessionProgress (NOT_STARTED vs IN_PROGRESS)", () => {
  const empty = { currentExerciseIndex: 0, results: [], skillAttempts: [] };

  it("nouvelle leçon → NOT_STARTED (false)", () => {
    expect(hasSessionProgress(empty)).toBe(false);
  });

  it("premier exercice complété → IN_PROGRESS (true)", () => {
    expect(hasSessionProgress({ ...empty, currentExerciseIndex: 1 })).toBe(true);
  });

  it("réponses présentes sans index avancé → true", () => {
    expect(
      hasSessionProgress({
        ...empty,
        results: [{ wordId: "w1", attempts: [true] }],
      }),
    ).toBe(true);
  });

  it("compétences en attente de rejeu → true", () => {
    expect(
      hasSessionProgress({
        ...empty,
        skillAttempts: [{ wordId: "w1", skill: "form_to_meaning", correct: true }],
      }),
    ).toBe(true);
  });
});
