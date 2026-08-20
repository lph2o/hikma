/**
 * Copie de présentation de la progression par sourate (Phase 34C).
 *
 * Fonctions PURES, déterministes, sans Supabase / React / Next / navigateur /
 * MASAQ / moteur pédagogique. Elles ne produisent que des TEXTES : aucune
 * donnée de progression n'est calculée ici (la source de vérité reste
 * `computeSurahProgress` / `computeLessonStatuses`).
 *
 * Les préférences déclaratives (preferred_surah_number, learning_goal, …) ne
 * sont jamais utilisées pour fabriquer une progression.
 */

/** Résumé réel de l'utilisateur sur les sourates exposables. */
export type SurahOverviewStats = {
  /** Sourates `in_progress` (REFERENCE/READY uniquement). */
  startedCount: number;
  /** Sourates `completed` (REFERENCE/READY uniquement). */
  completedCount: number;
  /** Total des sourates exposables (REFERENCE + READY). */
  totalAvailable: number;
};

export type SurahHeroCopy = {
  title: string;
  subtitle: string;
  /** Compteurs ou note sous le hero — null si rien à afficher. */
  footnote: string | null;
};

/**
 * Hero de `/surahs` : même titre (« Mes sourates »), sous-titre et note qui
 * varient selon la progression réelle. Aucun chiffre inventé.
 */
export function getSurahHeroCopy(stats: SurahOverviewStats): SurahHeroCopy {
  const title = "Mes sourates";

  if (stats.totalAvailable === 0) {
    return {
      title,
      subtitle: "Les parcours arrivent bientôt.",
      footnote: null,
    };
  }

  if (stats.startedCount === 0 && stats.completedCount === 0) {
    return {
      title,
      subtitle: "Commence ton parcours et découvre progressivement les mots du Coran.",
      footnote: "Une première sourate t’attend.",
    };
  }

  if (stats.completedCount === stats.totalAvailable) {
    return {
      title,
      subtitle: "Bravo, tu as parcouru toutes les sourates actuellement disponibles.",
      footnote: "Tu peux revoir tes parcours terminés.",
    };
  }

  const startedLabel =
    stats.startedCount > 1 ? "sourates commencées" : "sourate commencée";
  const completedLabel =
    stats.completedCount > 1 ? "sourates terminées" : "sourate terminée";

  return {
    title,
    subtitle: "Continue ton apprentissage et découvre progressivement les mots du Coran.",
    footnote: `${stats.startedCount} ${startedLabel} · ${stats.completedCount} ${completedLabel}`,
  };
}

/**
 * Encouragement doux pour une carte `in_progress`. Déterministe, jamais
 * culpabilisant, jamais fondé sur la maîtrise ou le SRS.
 */
export function getSurahContinueEncouragement(
  completedLessons: number,
  totalLessons: number,
): string {
  if (totalLessons <= 0) return "Continue à ton rythme.";
  if (completedLessons <= 0) return "Tu viens de commencer. Continue à ton rythme.";
  if (completedLessons < totalLessons / 2) {
    return "Tu es sur la bonne voie. Continue là où tu t’es arrêté.";
  }
  return "Tu es déjà bien avancé. Continue là où tu t’es arrêté.";
}

/**
 * Wording de célébration d'une sourate terminée (`completed` = parcours de
 * découverte terminé, PAS maîtrise complète). Le nom est optionnel : sans nom,
 * un message générique est utilisé (jamais de nom inventé).
 */
export function getSurahCompletionCopy(surahName?: string | null): {
  title: string;
  message: string;
} {
  const name = surahName?.trim();
  return {
    title: "Parcours terminé !",
    message: name
      ? `Tu viens de parcourir ${name} et de découvrir ses mots.`
      : "Tu viens de parcourir cette sourate et de découvrir ses mots.",
  };
}

/**
 * Détecte une VRAIE transition de fin de sourate (Phase 35B).
 *
 * Une sourate passe à `completed` uniquement lorsque, en terminant la leçon
 * courante, TOUTES ses leçons sont terminées. `nextLesson === null` seul ne
 * suffit pas (il signifie « dernière leçon de la séquence », pas « sourate
 * terminée »). On exige :
 *   - c'est la dernière leçon (`nextLesson === null`) ;
 *   - ET le compte de leçons terminées AVANT cette leçon valait
 *     `total - 1` (toutes les autres étaient déjà terminées) ;
 *   - ET il y a au moins une leçon dans le parcours.
 *
 * Ceci évite de célébrer à chaque re-visite d'une sourate déjà terminée
 * (`completed === total` avant la leçon → pas de transition).
 */
export function isSurahCompletionTransition(
  nextLesson: { title: string; href: string } | null,
  pathProgress: { completed: number; total: number } | null,
): boolean {
  if (nextLesson != null) return false;
  if (!pathProgress) return false;
  if (pathProgress.total <= 0) return false;
  return pathProgress.completed === pathProgress.total - 1;
}
