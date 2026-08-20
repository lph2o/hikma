// États UX de la page /review (Phase 24H-UX-NAV-REVIEW-B).
// Logique PURE, sans I/O : ne modifie AUCUN calcul SRS / mastery / retention.
// Elle lit seulement les signaux déjà calculés (dueCount, studiedCount,
// nextReviewAt) fournis par la couche applicative.

/** État de la page /review dérivé de données réelles. */
export type ReviewUiState = "NO_PROGRESS" | "UP_TO_DATE" | "DUE";

/**
 * Classe l'état de /review SANS confondre progression et SRS :
 * - DUE        : des mots sont dus (review_items.next_review_at <= now) ;
 * - UP_TO_DATE : l'utilisateur a étudié (user_word_progress > 0) mais rien n'est dû ;
 * - NO_PROGRESS: aucune progression pédagogique connue.
 */
export function classifyReviewState(
  dueCount: number,
  studiedCount: number,
): ReviewUiState {
  if (dueCount > 0) return "DUE";
  if (studiedCount > 0) return "UP_TO_DATE";
  return "NO_PROGRESS";
}

const MS_PER_DAY = 86_400_000;

/**
 * Libellé humain de la prochaine révision (lecture seule de next_review_at).
 * Retourne null si aucune date fiable n'est disponible (on n'invente rien).
 * Fuseau : comparaison en durées absolues (UTC, cohérent avec getActivityDate).
 */
export function formatNextReviewLabel(
  nextReviewAt: string | null,
  now: Date = new Date(),
): string | null {
  if (!nextReviewAt) return null;
  const nextMs = new Date(nextReviewAt).getTime();
  if (Number.isNaN(nextMs)) return null;
  const diffDays = Math.ceil((nextMs - now.getTime()) / MS_PER_DAY);
  if (diffDays <= 0) return null;
  if (diffDays === 1) return "demain";
  return `dans ${diffDays} jours`;
}
