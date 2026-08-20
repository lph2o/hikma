// Daily Learning Plan (Phase 38B) — couche d'ORCHESTRATION / PRÉSENTATION pure.
//
// Le plan ne décide RIEN : il compose des données déjà déterminées par les
// moteurs existants. Il n'appelle pas Supabase, ne lit pas l'heure, n'écrit
// rien, ne modifie ni SRS, ni mastery, ni curriculum, ni sessions.
//
// Sources de vérité (ne pas recalculer ici) :
//   - prochaine action : selectActiveLearningPath (session → progression →
//     recommandation → fallback) ;
//   - objectif du jour  : getDailyGoalProgress (informatif, jamais moteur) ;
//   - révisions         : getReviewDueCount (review_items, LeitnerScheduler) ;
//   - couverture        : getQuranCoverage (Phase 37, pondérée par occurrences).
//
// Les préférences (daily_duration, learning_pace, learning_goal) ne servent
// qu'à CONTEXTUALISER la narration, jamais à décider la prochaine activité.

import type { ActivePathSelection } from "./active-path";
import type { DailyGoalProgress } from "./activity";
import type { OnboardingProfile } from "./onboarding";

/** Action principale du plan, dérivée UNIQUEMENT de `selectActiveLearningPath`. */
export type DailyPlanAction = {
  kind: ActivePathSelection["kind"];
  /** Libellé court du CTA (Reprendre / Continuer / Découvrir / Réviser). */
  label: string;
  /** Destination réelle (null = aucun CTA, état neutre — jamais inventé). */
  href: string | null;
  /** Contexte court et VRAI (nom de sourate / progression), null si néant. */
  context: string | null;
};

export type DailyPlanGoal = {
  type: "words" | "lessons";
  current: number;
  target: number;
  remaining: number;
  /** true si current >= target (dépassement autorisé, jamais plafonné). */
  completed: boolean;
  /** true si current > target. */
  exceeded: boolean;
};

export type DailyPlan = {
  action: DailyPlanAction;
  goal: DailyPlanGoal;
  reviews: { dueCount: number; hasDue: boolean };
  coverage: { percent: number | null };
};

export type ComposeDailyPlanInput = {
  /** Décision déjà prise par `selectActiveLearningPath`. */
  selection: ActivePathSelection;
  /** Progression d'objectif déjà calculée par `getDailyGoalProgress`. */
  goal: DailyGoalProgress;
  /** Nombre de mots dus (déjà calculé par `getReviewDueCount`). */
  reviewDueCount: number;
  /** Couverture (Phase 37), déjà calculée ; null = indisponible (erreur). */
  coveragePercent: number | null;
};

/** Compose le plan sans recalculer aucune décision pédagogique. */
export function composeDailyPlan(input: ComposeDailyPlanInput): DailyPlan {
  const { selection, goal, reviewDueCount, coveragePercent } = input;

  return {
    action: composeAction(selection),
    goal: {
      type: goal.type,
      current: goal.current,
      target: goal.goalValue,
      remaining: Math.max(0, goal.goalValue - goal.current),
      completed: goal.reached,
      exceeded: goal.current > goal.goalValue,
    },
    reviews: { dueCount: reviewDueCount, hasDue: reviewDueCount > 0 },
    coverage: { percent: coveragePercent },
  };
}

/**
 * Présente la décision de `selectActiveLearningPath` comme une action.
 * Aucun lien n'est reconstruit à partir d'une logique concurrente : le slug de
 * leçon provient de `selection` ; pour `all_done`/`none`, on retombe sur
 * `/review` (route réelle, comportement identique au dashboard actuel).
 */
function composeAction(selection: ActivePathSelection): DailyPlanAction {
  const lessonHref = selection.lessonSlug ? `/learn/${selection.lessonSlug}` : null;

  switch (selection.kind) {
    case "active_session":
      return {
        kind: "active_session",
        label: "Reprendre",
        href: lessonHref,
        context: selection.surahName
          ? `Tu étais en train d'apprendre dans ${selection.surahName}.`
          : "Reprends là où tu t'étais arrêté.",
      };
    case "in_progress":
      return {
        kind: "in_progress",
        label: "Continuer",
        href: lessonHref,
        context: selection.surahName
          ? `Tu es arrivé à ${selection.completedLessons} / ${selection.totalLessons} leçons dans ${selection.surahName}.`
          : `Tu es arrivé à ${selection.completedLessons} / ${selection.totalLessons} leçons.`,
      };
    case "recommendation":
    case "fallback":
      return {
        kind: selection.kind,
        label: "Découvrir",
        href: lessonHref,
        context: selection.surahName ? `Découvre ${selection.surahName}.` : null,
      };
    case "all_done":
      return {
        kind: "all_done",
        label: "Réviser",
        href: "/review",
        context: "Toutes les sourates disponibles sont terminées.",
      };
    case "none":
    default:
      return { kind: "none", label: "Réviser mes mots", href: "/review", context: null };
  }
}

// ---------------------------------------------------------------------------
// Coach narratif — déterministe, sans IA, sans réseau, sans DB.
// ---------------------------------------------------------------------------

export type CoachLineInput = {
  plan: DailyPlan;
  profile: OnboardingProfile;
  /** Première visite : aucune session active, aucune leçon terminée. */
  firstVisit: boolean;
};

/**
 * Une seule phrase, choisie par priorité déterministe et explicable. Chaque
 * phrase n'affirme que des faits présents dans les données. Retourne TOUJOURS
 * une chaîne valide (fallback final), même sur des entrées incohérentes.
 *
 * Hiérarchie : objectif dépassé → objectif atteint → session à reprendre →
 * progression en cours → révisions dues → première visite → rythme tranquille
 * (préférence) → neutre.
 */
export function getCoachLine({ plan, profile, firstVisit }: CoachLineInput): string {
  if (plan.goal.exceeded) return "Tu as dépassé ton objectif du jour. 👏";
  if (plan.goal.completed) return "Bravo, ton objectif du jour est atteint.";
  if (plan.action.kind === "active_session") {
    return "Reprends ta leçon, tu avais bien avancé.";
  }
  if (plan.action.kind === "in_progress") {
    return "Continue comme ça, tu avances bien aujourd'hui.";
  }
  if (plan.reviews.hasDue) {
    return plan.reviews.dueCount === 1
      ? "1 mot à réviser t'attend aujourd'hui."
      : `${plan.reviews.dueCount} mots à réviser t'attendent aujourd'hui.`;
  }
  if (firstVisit) return "Commence tranquillement avec ta première leçon.";
  if (profile.learningPace === "daily_short" || profile.dailyDuration === 5) {
    return "Avance tranquillement, quelques minutes suffisent pour continuer.";
  }
  return "Continue ton apprentissage à ton rythme.";
}
