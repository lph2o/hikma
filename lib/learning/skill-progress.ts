// Progression par compétence (Phase 23F) + correction 23F-B.
//
// Contrairement à la maîtrise agrégée de user_word_progress (statut + SRS),
// la maîtrise par compétence mesure la FORCE d'une compétence précise sur un
// mot. Phase 23F-B corrige deux défauts démontrés par l'audit 23F-A :
//
//   1. le score était "coarse" (net = corrects - incorrects) : 100 corrects
//      + 96 erreurs donnait 100. Le niveau exige désormais À LA FOIS un
//      « net » suffisant ET une précision minimale (ratio réussites/tentatives) ;
//   2. la récence n'était pas prise en compte : un échec RÉCENT plafonne d'un
//      cran (jamais de chute disproportionnée, symétrique avec les réussites).
//
// La rétention (capacité à retrouver après délai) est mesurée séparément par
// `retentionLevel` : elle ne dépend pas du nombre de réussites mais du TEMPS
// écoulé depuis le dernier rappel réussi sans échec intercurrent.

import type { MasteryLevel } from "./types";
import type { Skill } from "./skills";

/** Compteurs + récence d'UNE compétence sur un mot (persistés dans user_word_skill_progress). */
export type SkillCounters = {
  correctCount: number;
  incorrectCount: number;
  /** Réussites consécutives se terminant à la dernière tentative (0 si dernier échec). */
  currentStreak: number;
  lastCorrectAt: string | null;
  lastIncorrectAt: string | null;
};

/** État de maîtrise d'UNE compétence sur un mot (persisté dans user_word_skill_progress). */
export type SkillProgressState = SkillCounters & {
  skill: Skill;
  mastery: MasteryLevel;
  lastAttemptAt: string | null;
};

/** Pas d'incrément du niveau de maîtrise (0 | 25 | 50 | 75 | 100). */
export const MASTERY_STEP = 25;

/**
 * Seuils d'exactitude (ratio réussites / tentatives) plafonnant le niveau :
 *   100 → précision ≥ 0.85 ; 75 → ≥ 0.70 ; 50 → ≥ 0.50 ; sinon 25.
 * C'est la correction du cas « 100 corrects + 96 erreurs = 100 » : ce cas a une
 * précision ~0.51 → plafonné à 50 (learning), jamais « maîtrisé ».
 */
const ACCURACY_FOR_MASTERED = 0.85;
const ACCURACY_FOR_FAMILIAR = 0.7;
const ACCURACY_FOR_LEARNING = 0.5;

/** Corrects nets requis pour le niveau 100 (volume minimal de réussites). */
const NET_FOR_MASTERED = 4;

/**
 * Niveau de maîtrise d'une compétence à partir de ses compteurs ET de sa
 * récence. Déterministe, explicable, croissant en réussites, pénalisant en
 * erreurs, et sensible aux erreurs récentes (sans chute disproportionnée).
 */
export function skillMasteryLevel(input: SkillCounters): MasteryLevel {
  const { correctCount, incorrectCount, lastCorrectAt, lastIncorrectAt } = input;
  const total = correctCount + incorrectCount;
  if (total === 0) return 0;

  const net = correctCount - incorrectCount;
  const accuracy = correctCount / total;

  const netLevel =
    net >= NET_FOR_MASTERED ? 100 : net >= 3 ? 75 : net >= 2 ? 50 : net >= 1 ? 25 : 0;
  const accuracyCeiling =
    accuracy >= ACCURACY_FOR_MASTERED
      ? 100
      : accuracy >= ACCURACY_FOR_FAMILIAR
        ? 75
        : accuracy >= ACCURACY_FOR_LEARNING
          ? 50
          : 25;

  let level = Math.min(netLevel, accuracyCeiling);

  // Récence : un échec RÉCENT (après le dernier succès, ou aucun succès jamais)
  // exclut la maîtrise complète (plafond 75) — sensible aux erreurs récentes
  // SANS chute disproportionnée (un seul cran ; une réussite remonte).
  const recentError =
    (lastIncorrectAt != null && lastCorrectAt != null && lastIncorrectAt > lastCorrectAt) ||
    (lastIncorrectAt != null && lastCorrectAt == null);
  if (recentError) level = Math.min(level, 75);

  return level as MasteryLevel;
}

/** Précision d'une compétence (1 si aucune tentative). */
export function skillAccuracy(correctCount: number, incorrectCount: number): number {
  const total = correctCount + incorrectCount;
  return total === 0 ? 1 : correctCount / total;
}

/** Applique une réponse à l'état d'une compétence (pur, sans I/O). */
export function applySkillAttempt(
  previous: SkillProgressState | null,
  correct: boolean,
  now: Date = new Date(),
): SkillProgressState {
  const correctCount = (previous?.correctCount ?? 0) + (correct ? 1 : 0);
  const incorrectCount = (previous?.incorrectCount ?? 0) + (correct ? 0 : 1);
  const currentStreak = correct ? (previous?.currentStreak ?? 0) + 1 : 0;
  const nowIso = now.toISOString();
  const lastCorrectAt = correct ? nowIso : (previous?.lastCorrectAt ?? null);
  const lastIncorrectAt = correct ? (previous?.lastIncorrectAt ?? null) : nowIso;

  return {
    // `previous.skill` est toujours renseigné par l'appelant (persistSkillAttempt) ;
    // le défaut n'est utilisé que par les tests de logique pure.
    skill: previous?.skill ?? "form_to_meaning",
    correctCount,
    incorrectCount,
    currentStreak,
    lastCorrectAt,
    lastIncorrectAt,
    mastery: skillMasteryLevel({
      correctCount,
      incorrectCount,
      currentStreak,
      lastCorrectAt,
      lastIncorrectAt,
    }),
    lastAttemptAt: nowIso,
  };
}

// ---------------------------------------------------------------------------
// Rétention (capacité à retrouver la connaissance APRÈS un délai)
// ---------------------------------------------------------------------------

export type RetentionInput = {
  correctCount: number;
  incorrectCount: number;
  lastCorrectAt: string | null;
  lastIncorrectAt: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nombre de jours calendaires entiers entre deux dates (fake-clock testable). */
export function daysSince(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Niveau de rétention (0 | 25 | 50 | 75 | 100), dérivé du TEMPS écoulé depuis
 * le dernier rappel réussi, sans échec intercurrent. Ce n'est pas « répondre
 * correctement plusieurs fois » : c'est « la connaissance a survécu un délai ».
 *
 *   - jamais rappelé correctement            → 0 ;
 *   - échec APRÈS le dernier succès (perte)  → 25 ;
 *   - succès récent (< 1 jour)               → 25 (pas encore de preuve de durée) ;
 *   - survécu ≥ 1 jour                       → 50 ;
 *   - survécu ≥ 3 jours                      → 75 ;
 *   - survécu ≥ 7 jours                      → 100 (durable).
 */
export function retentionLevel(input: RetentionInput, now: Date = new Date()): MasteryLevel {
  if (!input.lastCorrectAt) return 0;
  if (input.lastIncorrectAt != null && input.lastIncorrectAt > input.lastCorrectAt) {
    return 25;
  }
  const days = daysSince(new Date(input.lastCorrectAt), now);
  if (days >= 7) return 100;
  if (days >= 3) return 75;
  if (days >= 1) return 50;
  return 25;
}

/**
 * Maîtrise globale dérivée de l'ensemble des compétences (pour les métriques).
 * Moyenne arrondie des niveaux des compétences déjà tentées (0 sinon).
 * N'est PAS écrite dans user_word_progress (la vue agrégée reste inchangée) :
 * c'est une mesure READ-ONLY dérivée, utilisable par l'UI et les rapports.
 */
export function aggregateSkillMastery(
  states: ReadonlyMap<Skill, SkillProgressState>,
): MasteryLevel {
  const values = [...states.values()].map((s) => s.mastery);
  if (values.length === 0) return 0;
  const avg = values.reduce((sum: number, v) => sum + v, 0) / values.length;
  // Arrondi au pas de 25 le plus proche (cohérent avec MasteryLevel).
  const stepped = Math.round(avg / MASTERY_STEP) * MASTERY_STEP;
  return Math.min(100, Math.max(0, stepped)) as MasteryLevel;
}

/** Compétences encore non maîtrisées (niveau < 100), dans l'ordre pédagogique. */
export function weakestSkills(
  states: ReadonlyMap<Skill, SkillProgressState>,
  order: readonly Skill[],
): Skill[] {
  return order.filter((s) => (states.get(s)?.mastery ?? 0) < 100);
}
