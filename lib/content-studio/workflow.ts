// Hikma — Content Studio (Phase B4) : MACHINE À ÉTATS éditoriale (PURE).
//
// Aucune I/O, aucun effet de bord : les transitions sont validées par une table
// de transitions explicite. Règles P0 :
//   - DRAFT → PUBLISHED et REVIEW → PUBLISHED sont INTERDITS (APPROVED requis) ;
//   - un contenu déjà APPROVED/SCHEDULED/EXPORTED/PUBLISHED dont le payload est
//     modifié repasse à DRAFT (nouvelle validation obligatoire) ;
//   - PUBLISHED est quasi-terminal (seul ARCHIVED est autorisé ensuite) ;
//   - le registre ne réutilise PAS LeitnerScheduler (SRS d'apprentissage) : le
//     statut SCHEDULED est éditorial, pas un intervalle de révision.
//
// Les transitions autorisées (from → to) :
//   DRAFT       → REVIEW, REJECTED, ARCHIVED, EXPORTED
//   REVIEW      → APPROVED, REJECTED, ARCHIVED, DRAFT (rework), EXPORTED
//   APPROVED    → SCHEDULED, REJECTED, ARCHIVED, EXPORTED, DRAFT (réouverture)
//   SCHEDULED   → PUBLISHED, APPROVED (déschedule), ARCHIVED, EXPORTED
//   PUBLISHED   → ARCHIVED
//   REJECTED    → DRAFT (retravail), ARCHIVED
//   ARCHIVED    → DRAFT (restauration)
//   EXPORTED    → SCHEDULED, PUBLISHED (via SCHEDULED), DRAFT, ARCHIVED

import type { ContentItemStatus } from "./types";

const TRANSITIONS: Readonly<Record<ContentItemStatus, readonly ContentItemStatus[]>> = {
  DRAFT: ["REVIEW", "REJECTED", "ARCHIVED", "EXPORTED"],
  REVIEW: ["APPROVED", "REJECTED", "ARCHIVED", "DRAFT", "EXPORTED"],
  APPROVED: ["SCHEDULED", "REJECTED", "ARCHIVED", "EXPORTED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "APPROVED", "ARCHIVED", "EXPORTED"],
  PUBLISHED: ["ARCHIVED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
  EXPORTED: ["SCHEDULED", "DRAFT", "ARCHIVED"],
};

/** Transition valide ? (fonction pure, testable). */
export function canTransition(
  from: ContentItemStatus,
  to: ContentItemStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Exige la transition ; lève une erreur déterministe sinon.
 * Code exploitables par la couche API : INVALID_TRANSITION.
 */
export function assertTransition(
  from: ContentItemStatus,
  to: ContentItemStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_TRANSITION: ${from} → ${to}`);
  }
}

/**
 * Statuts dont la modification du payload exige une NOUVELLE validation :
 * un contenu déjà engagé (approuvé, programmé, exporté ou publié) dont les
 * données changent substantiellement repasse à DRAFT.
 */
export function requiresReapproval(status: ContentItemStatus): boolean {
  return (
    status === "APPROVED" ||
    status === "SCHEDULED" ||
    status === "EXPORTED" ||
    status === "PUBLISHED"
  );
}

/** Statuts à partir desquels un contenu peut être exporté (B7). */
export function canExport(status: ContentItemStatus): boolean {
  return (
    status === "DRAFT" ||
    status === "REVIEW" ||
    status === "APPROVED" ||
    status === "SCHEDULED"
  );
}

/** Statut terminal (aucune production de contenu supplémentaire). */
export function isTerminal(status: ContentItemStatus): boolean {
  return status === "ARCHIVED";
}
