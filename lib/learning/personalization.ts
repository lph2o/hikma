import type {
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
} from "@/types/learning";
import type { OnboardingProfile } from "./onboarding";

/**
 * Copie personnalisée (Phase 33B) — couche d'EXPÉRIENCE uniquement.
 *
 * Ces fonctions sont pures, déterministes, indépendantes de Supabase, du
 * navigateur et du moteur pédagogique. Elles ne lisent aucune donnée Quran
 * supplémentaire et ne modifient JAMAIS :
 *   - le grading, le scoring, le SRS, la maîtrise, le scheduler ;
 *   - l'interleaving, le curriculum, la progression, les exercices.
 *
 * Une préférence utilisateur est une préférence DÉCLARATIVE, jamais un
 * diagnostic de niveau. La progression réelle reste la seule vérité
 * pédagogique ; ces textes n'en sont qu'une présentation plus personnelle.
 */

// ---------------------------------------------------------------------------
// Apprentissage par objectif (learning_goal)
// ---------------------------------------------------------------------------

export function getLearningGoalCopy(goal: LearningGoal | null): string | null {
  if (goal == null) return null;
  switch (goal) {
    case "understand_recitation":
      return "Comprends les mots derrière ce que tu récites.";
    case "memorize_vocabulary":
      return "Fais travailler ta mémoire mot après mot.";
    case "understand_surahs":
      return "Avance progressivement pour mieux comprendre les sourates que tu récites.";
    case "build_vocabulary":
      return "Enrichis petit à petit ton vocabulaire coranique.";
    case "start_gently":
      return "Pas besoin d’aller vite. Commençons simplement, mot après mot.";
  }
}

// ---------------------------------------------------------------------------
// Familiarité avec le Coran (quran_familiarity) — jamais un niveau de compétence
// ---------------------------------------------------------------------------

export function getQuranFamiliarityCopy(
  familiarity: QuranFamiliarity | null,
): string | null {
  if (familiarity == null) return null;
  switch (familiarity) {
    case "beginner":
      return "Découvrons Hikma tranquillement, étape par étape.";
    case "some_surahs":
      return "Pars de sourates que tu connais déjà ou découvre-en de nouvelles.";
    case "regular_recitation":
      return "Mets les mots que tu récites régulièrement en perspective.";
    case "many_surahs":
      return "Profite des sourates que tu connais déjà pour enrichir ton vocabulaire.";
    case "complete_reading":
      return "Explore le vocabulaire derrière les sourates que tu récites régulièrement.";
  }
}

// ---------------------------------------------------------------------------
// Rythme d'apprentissage (learning_pace)
// ---------------------------------------------------------------------------

export function getLearningPaceCopy(pace: LearningPace | null): string | null {
  if (pace == null) return null;
  switch (pace) {
    case "daily_short":
      return "Un peu chaque jour, c’est déjà un bon rythme.";
    case "some_days":
      return "Quelques sessions dans la semaine peuvent suffire pour avancer régulièrement.";
    case "flexible":
      return "Avance quand tu as le temps, sans pression.";
    case "unknown":
      return "Trouve progressivement le rythme qui te convient.";
  }
}

// ---------------------------------------------------------------------------
// Durée quotidienne (daily_duration) — présentation uniquement
// ---------------------------------------------------------------------------

export function getDailyDurationLabel(
  duration: OnboardingProfile["dailyDuration"],
): string | null {
  if (duration == null) return null;
  switch (duration) {
    case 5:
      return "Une petite session de 5 minutes.";
    case 10:
      return "Une session courte d’environ 10 minutes.";
    case 15:
      return "Une session d’environ 15 minutes.";
    case 20:
      return "Une session d’environ 20 minutes.";
    case 30:
      // Jamais « +20 min » : la valeur 30 n'invente aucun daily_goal.
      return "Plus de 20 minutes";
  }
}

// ---------------------------------------------------------------------------
// Copy composée (accueil dashboard)
// ---------------------------------------------------------------------------

export type PersonalizedLearningContext = {
  /** Première visite : aucune session active, aucune leçon terminée. */
  firstVisit: boolean;
  /** Parcours entièrement terminé. */
  allDone: boolean;
};

export type PersonalizedLearningCopy = {
  greeting: string;
  opening: string;
};

/** Préfixes de rythme qui se combinent naturellement avec un objectif. */
const PACE_LEAD: Partial<Record<LearningPace, string>> = {
  daily_short: "Un peu chaque jour",
  some_days: "Quelques sessions dans la semaine",
  flexible: "Avance à ton rythme",
  // unknown : pas de préfixe — la copy de rythme se lit seule, sans combinaison.
};

/** Continuations d'objectif (« … pour … ») pour composer une seule phrase. */
const GOAL_CONTINUATION: Record<LearningGoal, string> = {
  understand_recitation: "pour mieux comprendre les mots que tu récites",
  memorize_vocabulary: "pour mémoriser les mots du Coran",
  understand_surahs: "pour mieux comprendre les sourates que tu récites",
  build_vocabulary: "pour enrichir ton vocabulaire coranique",
  start_gently: "pour commencer simplement, mot après mot",
};

function buildOpening(profile: OnboardingProfile): string {
  const goalCopy = getLearningGoalCopy(profile.learningGoal);
  if (goalCopy && profile.learningGoal) {
    const lead = PACE_LEAD[profile.learningPace ?? "unknown"];
    if (lead) return `${lead} ${GOAL_CONTINUATION[profile.learningGoal]}.`;
    return goalCopy;
  }
  const familiarityCopy = getQuranFamiliarityCopy(profile.quranFamiliarity);
  if (familiarityCopy) return familiarityCopy;
  const paceCopy = getLearningPaceCopy(profile.learningPace);
  if (paceCopy) return paceCopy;
  return "Continue ton apprentissage, à ton rythme.";
}

/**
 * Salutation + phrase d'ouverture du dashboard, dérivées uniquement des
 * préférences déclaratives et du contexte (première visite / parcours terminé).
 * Aucune préférence NULL n'est remplacée artificiellement par une valeur.
 */
export function getPersonalizedLearningCopy(
  profile: OnboardingProfile,
  context: PersonalizedLearningContext,
): PersonalizedLearningCopy {
  if (context.allDone) {
    return {
      greeting: "Ton parcours est terminé",
      opening: "Tu peux revoir tes mots ou reprendre une leçon pour les ancrer.",
    };
  }

  const name = profile.displayName?.trim();
  const greeting = name
    ? `Bonjour ${name} 👋`
    : context.firstVisit
      ? "Bienvenue sur Hikma 👋"
      : "Bonjour 👋";

  if (context.firstVisit) {
    return { greeting, opening: "Commençons par quelques mots du Coran." };
  }

  return { greeting, opening: buildOpening(profile) };
}

// ---------------------------------------------------------------------------
// Justification de la recommandation (toujours vraie)
// ---------------------------------------------------------------------------

export type RecommendationTarget = { surahNumber: number } | null;

/**
 * Raison courte et humaine d'une recommandation de sourate. La justification
 * est TOUJOURS vraie : on ne prétend jamais que Hikma a recommandé une sourate
 * que l'utilisateur a lui-même choisie, et on ne diagnostique jamais de niveau.
 */
export function getRecommendationReason(
  profile: Pick<
    OnboardingProfile,
    "preferredSurahNumber" | "dailyDuration" | "arabicReadingLevel"
  >,
  recommendation: RecommendationTarget,
): string | null {
  if (!recommendation) return null;

  // Cas 1 — choix explicite de l'utilisateur.
  const explicit =
    profile.preferredSurahNumber != null &&
    profile.preferredSurahNumber === recommendation.surahNumber;
  if (explicit) return "Tu l’as choisie comme point de départ.";

  // Cas 3 — profil débutant (lecture de l'arabe), signal plus intentionnel.
  if (profile.arabicReadingLevel === "beginner") {
    return "Une première étape simple pour découvrir Hikma.";
  }

  // Cas 2 — préférence de durée courte.
  if (profile.dailyDuration === 5 || profile.dailyDuration === 10) {
    return "Nous te proposons une sourate courte pour commencer tranquillement.";
  }

  // Cas 4 — fallback Al-Fātiḥah (référence).
  if (recommendation.surahNumber === 1) {
    return "Al-Fātiḥah est notre point de départ de référence sur Hikma.";
  }

  // Cas 5 — autre fallback (première sourate disponible).
  return "Une première sourate disponible pour commencer ton parcours.";
}
