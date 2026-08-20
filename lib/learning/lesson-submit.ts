// Orchestration PURE de la soumission de fin de leçon (Phase 24H-LESSON-COMPLETION-FAILURE B).
// Découple le CONTRAT DE RETOUR (success / partial / failed) de la persistance
// Supabase : testable sans next/headers ni base.
//
// Hiérarchie respectée : progression pédagogique (user_word_progress/review_items)
// d'abord ; l'activité statistique ne détermine JAMAIS le verdict pédagogique.

import type { WordAttempts } from "./session";

/** Verdict global de la soumission de fin de leçon. */
export type LessonSubmitStatus = "success" | "partial" | "failed";

/** Classification minimale d'une erreur (pour l'UI : retry ou non). */
export type LessonSubmitErrorCode = "RETRYABLE" | "AUTH" | "VALIDATION" | "UNKNOWN";

/** Contrat de retour de submitLessonResults(). */
export type LessonResultsResult = {
  ok: boolean;
  status: LessonSubmitStatus;
  /** Mots réellement persistés (progression pédagogique). */
  savedWordIds: string[];
  /** Mots restant à persister (retry ciblé). */
  pendingWordIds: string[];
  /** true si l'activité quotidienne a été enregistrée (non bloquant). */
  activitySaved: boolean;
  errorCode?: LessonSubmitErrorCode;
  retryable?: boolean;
  error?: string;
};

const AUTH_RE =
  /(row-level security|jwt|token|session|permission denied|not authorized|invalid api key|auth)/i;
const RETRYABLE_RE =
  /(fetch failed|failed to fetch|network|timeout|timed out|etimedout|econnreset|econnrefused|rate limit|temporary|connection|abort|unavailable|429|502|503)/i;
const VALIDATION_RE =
  /(duplicate key|unique constraint|foreign key constraint|violates|check constraint|not-null|invalid input|22p02|23503|23505)/i;

/**
 * Classifie le message d'une erreur Supabase/réseau.
 * Objectif : permettre à l'UI de savoir si c'est une vraie perte de progression
 * ou un problème temporaire. Volontairement minimal (pas d'architecture excessive).
 */
export function classifyLessonSubmitError(
  message: string,
): { code: LessonSubmitErrorCode; retryable: boolean } {
  if (AUTH_RE.test(message)) return { code: "AUTH", retryable: false };
  if (RETRYABLE_RE.test(message)) return { code: "RETRYABLE", retryable: true };
  if (VALIDATION_RE.test(message)) return { code: "VALIDATION", retryable: false };
  return { code: "UNKNOWN", retryable: false };
}

function failureMessage(code: LessonSubmitErrorCode, partial: boolean): string {
  if (partial) {
    return "Ta progression est en partie enregistrée. Réessaie pour terminer la synchronisation.";
  }
  switch (code) {
    case "AUTH":
      return "Ta session a peut-être expiré. Reconnecte-toi puis réessaie.";
    case "VALIDATION":
      return "Impossible d'enregistrer ta progression (données invalides).";
    default:
      return "Impossible d'enregistrer ta progression pour le moment. Vérifie ta connexion puis réessaie.";
  }
}

/**
 * Rejoue la soumission mot par mot en distinguant succès / partiel / échec.
 * `persistWord` est injecté (persistance réelle ou mock) ; `recordActivity` est
 * non bloquant : son échec produit `status: "success"` + `activitySaved: false`.
 */
export async function runLessonSubmission(
  results: WordAttempts[],
  persistWord: (wordId: string, attempts: boolean[]) => Promise<void>,
  recordActivity: () => Promise<void>,
): Promise<LessonResultsResult> {
  const todo = results.filter((r) => r.attempts.length > 0).map((r) => r.wordId);
  const saved: string[] = [];

  try {
    for (const result of results) {
      if (result.attempts.length === 0) continue;
      await persistWord(result.wordId, result.attempts);
      saved.push(result.wordId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const { code, retryable } = classifyLessonSubmitError(message);
    console.error("submitLessonResults failed:", err);
    const partial = saved.length > 0;
    return {
      ok: partial,
      status: partial ? "partial" : "failed",
      savedWordIds: saved,
      pendingWordIds: todo.filter((id) => !saved.includes(id)),
      activitySaved: false,
      errorCode: code,
      retryable,
      error: failureMessage(code, partial),
    };
  }

  try {
    await recordActivity();
    return {
      ok: true,
      status: "success",
      savedWordIds: saved,
      pendingWordIds: [],
      activitySaved: true,
    };
  } catch (err) {
    console.error("recordLessonActivity failed:", err);
    return {
      ok: true,
      status: "success",
      savedWordIds: saved,
      pendingWordIds: [],
      activitySaved: false,
    };
  }
}
