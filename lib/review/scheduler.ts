import type { ReviewSchedule, ReviewState } from "./types";

/**
 * Abstraction de planification de la répétition espacée.
 * Remplaçable : un scheduler SM-2 ou FSRS pourra implémenter cette même
 * interface (et ajouter ses colonnes par migration dédiée).
 */
export interface ReviewScheduler {
  schedule(state: ReviewState | null, correct: boolean, now?: Date): ReviewSchedule;
}

/** Seuil d'intervalle (jours) au-delà duquel un mot passe en « review ». */
export const REVIEW_GRADUATION_DAYS = 7;

/**
 * Intervalle maximal de révision (jours) — borne de sécurité documentée
 * (Phase 63A).
 *
 * Pourquoi : le doublage de Leitner (`previousInterval * 2`) est sans borne.
 * À partir d'un intervalle déjà long (ex. 2¹⁸ = 262 144 j, valeur réelle
 * observée en base), quelques bonnes réponses supplémentaires atteignent
 * 2²² ≈ 4 194 304 jours ≈ année 13 510 → `toISOString()` produit alors
 * `+013510-04-02T…Z` (année à 6 chiffres préfixée « + ») que PostgreSQL
 * rejette : « time zone displacement out of range ». L'unité du calcul est
 * correcte (jours partout) ; c'est la VALEUR de l'intervalle qui n'est pas
 * bornée.
 *
 * Valeur : 365 jours (1 an) — maximum canonique des implémentations
 * Leitner/SM-2. La courbe pédagogique reste identique sous le plafond
 * (1 → 2 → 4 → … → 256), seule la queue pathologique est bornée.
 *
 * Compatibilité SRS actuel : graduation à 7 j (REVIEW_GRADUATION_DAYS) et
 * seuil « mastered » à 14 j (PROGRESS_RULES.masteredMinIntervalDays) sont
 * largement sous 365 ; les niveaux de maîtrise dépendent d'intervalles
 * bien plus courts. Un mot réussi est révisé au plus une fois par an.
 *
 * Auto-réparation : les lignes existantes dont `interval_days` dépasse le
 * plafond (ex. 262 144) sont recalculées au plafond à la prochaine réponse
 * (aucune donnée supprimée, aucune donnée inventée).
 */
export const MAX_REVIEW_INTERVAL_DAYS = 365;

/**
 * Scheduler par défaut (Leitner simplifié, déterministe) :
 * - bonne réponse : l'intervalle double (1 → 2 → 4 → 8 → 16… jours) ;
 * - mauvaise réponse : l'intervalle revient à 1 jour ;
 * - un mot passe en « review » quand l'intervalle atteint 7 jours ;
 * - une erreur après graduation le ramène en « relearning ».
 *
 * Ce n'est PAS un algorithme scientifique complet (SM-2/FSRS viendront plus
 * tard) : c'est une base déterministe et testable.
 */
export class LeitnerScheduler implements ReviewScheduler {
  schedule(state: ReviewState | null, correct: boolean, now = new Date()): ReviewSchedule {
    const previousInterval = state?.intervalDays ?? 0;

    const intervalDays = Math.min(
      correct
        ? previousInterval === 0
          ? 1
          : previousInterval * 2
        : 1,
      MAX_REVIEW_INTERVAL_DAYS,
    );

    let status: ReviewSchedule["status"];
    if (!correct) {
      status = state && state.status === "review" ? "relearning" : "learning";
    } else if (intervalDays >= REVIEW_GRADUATION_DAYS) {
      status = "review";
    } else {
      status = "learning";
    }

    return {
      status,
      intervalDays,
      nextReviewAt: addDays(now, intervalDays).toISOString(),
    };
  }
}

export function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
