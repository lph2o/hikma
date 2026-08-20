// Résumé hebdomadaire (Phase 39B) — couche PURE de composition.
//
// Le résumé ne crée AUCUNE donnée nouvelle : il dérive trois nombres des
// journaux d'activité insert-only déjà chargés (getActivityHistory) :
//   - words      = mots DISTINCTS étudiés sur la période (user_activity_words) ;
//   - lessons    = leçons réellement terminées (user_activity_lessons) ;
//   - activeDays = jours distincts avec au moins une activité pédagogique.
//
// Aucune dépendance à Supabase, React, Next.js : fonctions testables isolément.
// Aucune nouvelle source de vérité, aucun streak, aucune durée d'étude.

/** Un point d'activité quotidienne (forme réelle des journaux, voir activity.ts). */
export type DailyActivityPoint = {
  date: string;
  lessonsCompleted: number;
  wordsStudied: number;
};

/** Résumé hebdomadaire dérivé (jamais stocké). */
export type WeeklySummary = {
  words: number;
  lessons: number;
  activeDays: number;
};

/**
 * Compose le résumé sur les `lastDays` DERNIERS jours de `days` (fenêtre
 * glissante se terminant au dernier élément, cohérente avec la convention UTC
 * de `getActivityHistory`). Une activité multiple le même jour ne compte qu'une
 * fois ; les jours hors fenêtre sont ignorés.
 */
export function composeWeeklySummary(
  days: DailyActivityPoint[],
  lastDays = 7,
): WeeklySummary {
  const window = days.slice(-lastDays);
  let words = 0;
  let lessons = 0;
  let activeDays = 0;
  for (const day of window) {
    words += day.wordsStudied;
    lessons += day.lessonsCompleted;
    if (day.wordsStudied > 0 || day.lessonsCompleted > 0) activeDays += 1;
  }
  return { words, lessons, activeDays };
}

/**
 * Libellé français déterministe, descriptif et non culpabilisant.
 * Exemple : « 12 mots · 3 leçons · 4 jours actifs ».
 * 0 reste au singulier en français (« 0 mot », « 0 leçon », « 0 jour actif »).
 */
export function formatWeeklySummary(summary: WeeklySummary): string {
  const words = `${summary.words} mot${summary.words > 1 ? "s" : ""}`;
  const lessons = `${summary.lessons} leçon${summary.lessons > 1 ? "s" : ""}`;
  const activeDays = `${summary.activeDays} jour${summary.activeDays > 1 ? "s" : ""} actif${summary.activeDays > 1 ? "s" : ""}`;
  return `${words} · ${lessons} · ${activeDays}`;
}
