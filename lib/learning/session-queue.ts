// File d'attente de session pour les exercices Hikma (Phase 98 / Duolingo-like queue).
//
// Logique PURE, déterministe et indépendante de React et Supabase :
// - File principale : séquence initiale des exercices de la leçon.
// - File de reprise : questions passées par l'utilisateur (mises de côté).
// - À la fin de la file principale, les questions de la file de reprise sont
//   re-présentées jusqu'à ce que l'utilisateur y réponde.
// - Une question passée plusieurs fois continue de revenir.
// - La session ne se termine que lorsque TOUTES les questions ont reçu une réponse.
// - Les IDs des questions passées sont suivis pour éviter d'enregistrer des
//   doublons statistiques dans les résultats SRS.

import type { GeneratedExercise } from "@/lib/exercises";
import { exerciseIdentity } from "@/components/learn/exercises/exercise-identity";

export type ExerciseQueueState = {
  /** Exercice en cours d'affichage (null si la session est terminée). */
  current: GeneratedExercise | null;
  /** Exercices restants dans la séquence initiale. */
  mainQueue: GeneratedExercise[];
  /** Exercices passés en attente d'être re-présentés. */
  repriseQueue: GeneratedExercise[];
  /** Index de progression dans la séquence initiale (0..initialTotal). */
  mainIndex: number;
  /** Nombre total d'exercices dans la séquence initiale. */
  initialTotal: number;
  /** Nombre de questions distinctes ayant reçu une réponse finale. */
  completedCount: number;
  /** Identifiants des exercices passés au moins une fois (anti-doublon SRS). */
  passedExerciseIds: string[];
  /** true si l'exercice courant provient de la file de reprise. */
  isReprise: boolean;
};

/**
 * Initialise l'état de la file d'attente d'exercices.
 * @param exercises Séquence ordonnée complète des exercices de la leçon.
 * @param startIndex Index de départ (ex. restauration d'une session reprise).
 */
export function initExerciseQueue(
  exercises: GeneratedExercise[],
  startIndex = 0,
): ExerciseQueueState {
  const initialTotal = exercises.length;
  if (initialTotal === 0 || startIndex >= initialTotal) {
    return {
      current: null,
      mainQueue: [],
      repriseQueue: [],
      mainIndex: initialTotal,
      initialTotal,
      completedCount: startIndex,
      passedExerciseIds: [],
      isReprise: false,
    };
  }

  const validIndex = Math.max(0, startIndex);
  return {
    current: exercises[validIndex] ?? null,
    mainQueue: exercises.slice(validIndex + 1),
    repriseQueue: [],
    mainIndex: validIndex,
    initialTotal,
    completedCount: validIndex,
    passedExerciseIds: [],
    isReprise: false,
  };
}

/**
 * Passe la question courante :
 * 1. Ajoute l'exercice courant à la fin de la file de reprise.
 * 2. Enregistre l'ID de l'exercice dans `passedExerciseIds` (s'il n'y figure pas déjà).
 * 3. Extrait immédiatement le prochain exercice :
 *    - depuis `mainQueue` s'il en reste ;
 *    - sinon depuis `repriseQueue`.
 */
export function handlePassExercise(
  state: ExerciseQueueState,
): ExerciseQueueState {
  if (!state.current) return state;

  const currentEx = state.current;
  const id = exerciseIdentity(currentEx);

  // Marque l'exercice comme ayant été passé au moins une fois
  const passedExerciseIds = state.passedExerciseIds.includes(id)
    ? state.passedExerciseIds
    : [...state.passedExerciseIds, id];

  // Ajout à la fin de la file de reprise
  const nextRepriseQueue = [...state.repriseQueue, currentEx];

  // Sélection du prochain exercice
  if (state.mainQueue.length > 0) {
    const nextCurrent = state.mainQueue[0];
    const nextMainQueue = state.mainQueue.slice(1);
    return {
      ...state,
      current: nextCurrent,
      mainQueue: nextMainQueue,
      repriseQueue: nextRepriseQueue,
      mainIndex: state.mainIndex + 1,
      passedExerciseIds,
      isReprise: false,
    };
  }

  // Plus d'exercices dans la file principale : passage immédiat en reprise
  const nextCurrent = nextRepriseQueue[0];
  const remainingReprise = nextRepriseQueue.slice(1);
  return {
    ...state,
    current: nextCurrent,
    mainQueue: [],
    repriseQueue: remainingReprise,
    passedExerciseIds,
    isReprise: true,
  };
}

/**
 * Valide et termine l'exercice courant (réponse fournie, bonne ou mauvaise) :
 * 1. L'exercice courant n'est PAS remis dans la file de reprise (il est terminé).
 * 2. Extrait le prochain exercice :
 *    - depuis `mainQueue` s'il en reste ;
 *    - sinon depuis `repriseQueue` ;
 *    - sinon session terminée (`current: null`).
 */
export function handleCompleteExercise(
  state: ExerciseQueueState,
): ExerciseQueueState {
  if (!state.current) return state;

  const completedCount = state.completedCount + 1;

  if (state.mainQueue.length > 0) {
    const nextCurrent = state.mainQueue[0];
    const nextMainQueue = state.mainQueue.slice(1);
    return {
      ...state,
      current: nextCurrent,
      mainQueue: nextMainQueue,
      mainIndex: state.mainIndex + 1,
      completedCount,
      isReprise: false,
    };
  }

  if (state.repriseQueue.length > 0) {
    const nextCurrent = state.repriseQueue[0];
    const remainingReprise = state.repriseQueue.slice(1);
    return {
      ...state,
      current: nextCurrent,
      mainQueue: [],
      repriseQueue: remainingReprise,
      completedCount,
      isReprise: true,
    };
  }

  // Session entièrement terminée
  return {
    ...state,
    current: null,
    mainQueue: [],
    repriseQueue: [],
    completedCount,
    isReprise: false,
  };
}

/** Indique si la file de session est entièrement épuisée (tous les exercices répondus). */
export function isQueueFinished(state: ExerciseQueueState): boolean {
  return (
    state.current === null &&
    state.mainQueue.length === 0 &&
    state.repriseQueue.length === 0
  );
}

/** Nombre d'exercices restants à traiter dans la phase de reprise (courant inclus si isReprise). */
export function getRepriseRemainingCount(state: ExerciseQueueState): number {
  if (!state.isReprise && state.repriseQueue.length === 0) return 0;
  return (state.isReprise && state.current ? 1 : 0) + state.repriseQueue.length;
}
