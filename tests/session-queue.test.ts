import { describe, expect, it } from "vitest";
import type { GeneratedExercise } from "@/lib/exercises";
import {
  initExerciseQueue,
  handlePassExercise,
  handleCompleteExercise,
  isQueueFinished,
  getRepriseRemainingCount,
} from "@/lib/learning/session-queue";
import { appendAttempt, type WordAttempts } from "@/lib/learning/session";
import { exerciseIdentity } from "@/components/learn/exercises/exercise-identity";

/** Génère des exercices factices avec des IDs et mots cibles distincts. */
function createMockExercise(id: string, wordId: string): GeneratedExercise {
  return {
    id,
    type: "WORD_TO_TRANSLATION",
    prompt: `Traduire le mot ${wordId}`,
    difficulty: 1,
    options: [
      { position: 1, content: "Option A", isCorrect: true, wordId },
      { position: 2, content: "Option B", isCorrect: false, wordId: "distractor" },
    ],
    metadata: {
      targetWordId: wordId,
      arabic: null,
      transliteration: null,
      meaning: null,
    },
  };
}

describe("session-queue — Moteur de file de session (Duolingo-like)", () => {
  const q1 = createMockExercise("q1", "word-1");
  const q2 = createMockExercise("q2", "word-2");
  const q3 = createMockExercise("q3", "word-3");
  const q4 = createMockExercise("q4", "word-4");
  const q5 = createMockExercise("q5", "word-5");

  it("1. toutes les questions répondues correctement → session terminée sans reprise", () => {
    let queue = initExerciseQueue([q1, q2, q3]);
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(false);

    queue = handleCompleteExercise(queue);
    expect(queue.current?.id).toBe("q2");
    expect(queue.isReprise).toBe(false);

    queue = handleCompleteExercise(queue);
    expect(queue.current?.id).toBe("q3");
    expect(queue.isReprise).toBe(false);

    queue = handleCompleteExercise(queue);
    expect(queue.current).toBeNull();
    expect(queue.repriseQueue).toHaveLength(0);
    expect(isQueueFinished(queue)).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(0);
  });

  it("2. une question passée → revient à la fin après la séquence initiale", () => {
    // Q1 → Q2(passée) → Q3 → Q2(reprise) → fin
    let queue = initExerciseQueue([q1, q2, q3]);

    // Réponse Q1
    queue = handleCompleteExercise(queue);
    expect(queue.current?.id).toBe("q2");

    // Q2 passée
    queue = handlePassExercise(queue);
    // Avance immédiatement vers Q3
    expect(queue.current?.id).toBe("q3");
    expect(queue.isReprise).toBe(false);
    expect(queue.repriseQueue).toHaveLength(1);
    expect(queue.repriseQueue[0].id).toBe("q2");

    // Réponse Q3 → Q2 revient en reprise
    queue = handleCompleteExercise(queue);
    expect(queue.current?.id).toBe("q2");
    expect(queue.isReprise).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(1);

    // Réponse finale sur Q2
    queue = handleCompleteExercise(queue);
    expect(queue.current).toBeNull();
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("3. plusieurs questions passées → reviennent dans l'ordre où elles ont été passées", () => {
    // Q1 → Q2(passée) → Q3(passée) → Q4 → Q2(reprise) → Q3(reprise)
    let queue = initExerciseQueue([q1, q2, q3, q4]);

    queue = handleCompleteExercise(queue); // Q1 terminée
    queue = handlePassExercise(queue); // Q2 passée
    expect(queue.current?.id).toBe("q3");

    queue = handlePassExercise(queue); // Q3 passée
    expect(queue.current?.id).toBe("q4");
    expect(queue.isReprise).toBe(false);

    // Fin de la série initiale avec Q4
    queue = handleCompleteExercise(queue); // Q4 terminée
    expect(queue.current?.id).toBe("q2"); // Q2 en premier
    expect(queue.isReprise).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(2);

    queue = handleCompleteExercise(queue); // Q2 terminée
    expect(queue.current?.id).toBe("q3"); // Q3 ensuite
    expect(queue.isReprise).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(1);

    queue = handleCompleteExercise(queue); // Q3 terminée
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("4. toutes les questions passées → reviennent toutes dans la file de reprise", () => {
    // Q1(passée) → Q2(passée) → Q3(passée) → Q1 → Q2 → Q3
    let queue = initExerciseQueue([q1, q2, q3]);

    queue = handlePassExercise(queue); // Q1 passée
    expect(queue.current?.id).toBe("q2");

    queue = handlePassExercise(queue); // Q2 passée
    expect(queue.current?.id).toBe("q3");

    queue = handlePassExercise(queue); // Q3 passée
    // File principale terminée, reprise commence avec Q1
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(3);

    queue = handleCompleteExercise(queue); // Q1 terminée
    expect(queue.current?.id).toBe("q2");

    queue = handleCompleteExercise(queue); // Q2 terminée
    expect(queue.current?.id).toBe("q3");

    queue = handleCompleteExercise(queue); // Q3 terminée
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("5. une question passée plusieurs fois → continue de revenir jusqu'à réponse", () => {
    // 1 seule question : Q1 → Passer → Q1 → Passer → Q1 → Répondre → fin
    let queue = initExerciseQueue([q1]);
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(false);

    // 1er pass
    queue = handlePassExercise(queue);
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(true);
    expect(isQueueFinished(queue)).toBe(false);

    // 2e pass consécutif
    queue = handlePassExercise(queue);
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(true);
    expect(isQueueFinished(queue)).toBe(false);

    // 3e pass consécutif
    queue = handlePassExercise(queue);
    expect(queue.current?.id).toBe("q1");
    expect(queue.isReprise).toBe(true);
    expect(isQueueFinished(queue)).toBe(false);

    // Réponse finale
    queue = handleCompleteExercise(queue);
    expect(queue.current).toBeNull();
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("6. mélange réponses correctes + questions passées", () => {
    // Q1 ✓, Q2 passer, Q3 ✓, Q4 passer, Q5 ✓ → Q2, Q4
    let queue = initExerciseQueue([q1, q2, q3, q4, q5]);

    queue = handleCompleteExercise(queue); // Q1 ✓
    queue = handlePassExercise(queue); // Q2 passer
    queue = handleCompleteExercise(queue); // Q3 ✓
    queue = handlePassExercise(queue); // Q4 passer
    queue = handleCompleteExercise(queue); // Q5 ✓

    // Entrée en reprise : Q2 puis Q4
    expect(queue.current?.id).toBe("q2");
    expect(queue.isReprise).toBe(true);
    expect(getRepriseRemainingCount(queue)).toBe(2);

    queue = handleCompleteExercise(queue); // Q2 ✓
    expect(queue.current?.id).toBe("q4");
    expect(getRepriseRemainingCount(queue)).toBe(1);

    queue = handleCompleteExercise(queue); // Q4 ✓
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("7. vérification que la session ne se termine pas tant qu'il reste une question dans la file de reprise", () => {
    let queue = initExerciseQueue([q1, q2]);
    queue = handlePassExercise(queue); // Q1 passée
    expect(isQueueFinished(queue)).toBe(false);

    queue = handleCompleteExercise(queue); // Q2 complétée
    // Q1 doit maintenant être courante, la session n'est PAS finie
    expect(queue.current?.id).toBe("q1");
    expect(isQueueFinished(queue)).toBe(false);

    // Encore passée en reprise
    queue = handlePassExercise(queue);
    expect(queue.current?.id).toBe("q1");
    expect(isQueueFinished(queue)).toBe(false);

    // Complétée
    queue = handleCompleteExercise(queue);
    expect(isQueueFinished(queue)).toBe(true);
  });

  it("8. vérification que les résultats SRS ne considèrent jamais « passé » comme correct", () => {
    // Simule la collecte des résultats avec LessonPlayer :
    // Lorsqu'une question est passée, elle enregistre `false`.
    // Lorsqu'elle est passée plusieurs fois, elle n'ajoute pas de doublon.
    // Même si elle est répondue correctement en reprise, son statut reste non-acquis (false)
    // pour que le SRS ne la sur-évalue pas.
    let results: WordAttempts[] = [];
    const passedIds = new Set<string>();

    function recordPass(ex: GeneratedExercise) {
      const id = exerciseIdentity(ex);
      if (!passedIds.has(id)) {
        passedIds.add(id);
        results = appendAttempt(results, ex.metadata.targetWordId, false);
      }
    }

    function recordAnswer(ex: GeneratedExercise, isCorrect: boolean) {
      const id = exerciseIdentity(ex);
      if (!passedIds.has(id)) {
        results = appendAttempt(results, ex.metadata.targetWordId, isCorrect);
      }
    }

    // Q1 répondue directement correcte
    recordAnswer(q1, true);
    // Q2 passée 3 fois
    recordPass(q2);
    recordPass(q2);
    recordPass(q2);
    // Q2 répondue correcte en reprise
    recordAnswer(q2, true);

    const w1Result = results.find((r) => r.wordId === "word-1");
    const w2Result = results.find((r) => r.wordId === "word-2");

    expect(w1Result?.attempts).toEqual([true]);
    // Q2 doit contenir exactement [false] : jamais de `true` pour une question passée,
    // et pas de répétition de `false` malgré les 3 passes.
    expect(w2Result?.attempts).toEqual([false]);
    expect(w2Result?.attempts.includes(true)).toBe(false);
  });

  it("9. vérification qu'une question correctement répondue est retirée définitivement de la file de session", () => {
    let queue = initExerciseQueue([q1, q2]);
    queue = handleCompleteExercise(queue); // Q1 terminée
    expect(queue.repriseQueue.find((ex) => ex.id === "q1")).toBeUndefined();

    queue = handleCompleteExercise(queue); // Q2 terminée
    expect(queue.repriseQueue).toHaveLength(0);
    expect(isQueueFinished(queue)).toBe(true);
  });
});
