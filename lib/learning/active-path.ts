import type { SurahProgress } from "./surah-progress";

/**
 * Parcours actif + résumé global (Phase 35B) — couche PURE de composition.
 *
 * Sélectionne le « parcours actif » de l'utilisateur UNIQUEMENT à partir de
 * données pédagogiques réelles (sessions + progression des mots), jamais à
 * partir des préférences déclaratives (preferred_surah_number, learning_goal,
 * …). La recommandation n'intervient que lorsqu'il n'existe AUCUNE action
 * pédagogique prioritaire.
 *
 * Hiérarchie déterministe :
 *
 *   SESSION ACTIVE RÉELLE → PROGRESSION RÉELLE → RECOMMANDATION → FALLBACK
 *
 * Aucune dépendance à Supabase, React, Next.js, MASAQ ou au moteur de
 * recommandation : cette fonction reçoit des données déjà chargées/calculées
 * par les couches existantes et reste testable isolément.
 */

/** Sourate démarrable vue sous l'angle de la sélection (minimal). */
export type ActivePathCatalogItem = {
  surahNumber: number;
  nameArabic: string;
  nameTransliteration: string;
  lessonCount: number;
  state: "REFERENCE" | "READY" | "IN_PREPARATION";
  firstLessonSlug: string | null;
};

/** Session active résolue (sourate + leçon) — reprise prioritaire n°1. */
export type ActiveSessionRef = {
  surahNumber: number;
  lessonSlug: string;
};

/** Recommandation de découverte (ex. `recommendStartingSurah`). */
export type RecommendationRef = {
  surahNumber: number;
  firstLessonSlug: string | null;
};

export type ActivePathKind =
  | "active_session"
  | "in_progress"
  | "recommendation"
  | "fallback"
  | "all_done"
  | "none";

export type ActivePathSelection = {
  kind: ActivePathKind;
  surahNumber: number | null;
  surahName: string | null;
  surahArabic: string | null;
  /** Destination réelle : leçon de reprise / prochaine leçon / première leçon. */
  lessonSlug: string | null;
  completedLessons: number;
  totalLessons: number;
};

/** Résumé global de progression sur les sourates démarrables. */
export type SurahSummary = {
  startedSurahs: number;
  completedSurahs: number;
  availableSurahs: number;
  completedLessons: number;
  totalLessons: number;
};

function isStartable(item: ActivePathCatalogItem): boolean {
  return item.state === "REFERENCE" || item.state === "READY";
}

const NO_SELECTION: ActivePathSelection = {
  kind: "none",
  surahNumber: null,
  surahName: null,
  surahArabic: null,
  lessonSlug: null,
  completedLessons: 0,
  totalLessons: 0,
};

const ALL_DONE: ActivePathSelection = {
  kind: "all_done",
  surahNumber: null,
  surahName: null,
  surahArabic: null,
  lessonSlug: null,
  completedLessons: 0,
  totalLessons: 0,
};

function toSelection(
  kind: ActivePathKind,
  item: ActivePathCatalogItem,
  lessonSlug: string | null,
  completedLessons: number,
  totalLessons: number,
): ActivePathSelection {
  return {
    kind,
    surahNumber: item.surahNumber,
    surahName: item.nameTransliteration,
    surahArabic: item.nameArabic,
    lessonSlug,
    completedLessons,
    totalLessons,
  };
}

/**
 * Sélectionne le parcours actif.
 *
 * `progress` : progression par sourate (toutes sourates, y compris
 * `IN_PREPARATION`) — filtrée ici sur les sourates démarrables uniquement.
 * `activeSession` : la session active la plus récente (globale), déjà résolue
 * vers sa sourate. `recommendation` : suggestion de découverte (peut être
 * null). `catalog` : catalogue complet (noms + état + leçons).
 *
 * Règles :
 *  1. session active réelle → reprise prioritaire (même si la sourate préférée
 *     est différente) ;
 *  2. sinon sourate `in_progress` la plus avancée (completedLessons décroissant,
 *     puis n° de sourate croissant — déterministe) ;
 *  3. sinon recommandation (si elle existe) ;
 *  4. sinon Al-Fātiḥah (parcours de référence) ;
 *  5. sinon aucun parcours.
 *
 * Une sourate `IN_PREPARATION` n'est JAMAIS sélectionnée, même si des données
 * de progression historiques existaient : le catalogue reste la source de
 * vérité de la disponibilité.
 */
export function selectActiveLearningPath(input: {
  progress: SurahProgress[];
  activeSession: ActiveSessionRef | null;
  recommendation: RecommendationRef | null;
  catalog: ActivePathCatalogItem[];
}): ActivePathSelection {
  const { progress, activeSession, recommendation, catalog } = input;

  const startable = catalog.filter(isStartable);
  const startableNumbers = new Set(startable.map((c) => c.surahNumber));
  const byNumber = new Map(catalog.map((c) => [c.surahNumber, c]));
  const progressByNumber = new Map(progress.map((p) => [p.surahNumber, p]));

  // 1. Session active réelle (globale) — priorité absolue.
  if (activeSession && startableNumbers.has(activeSession.surahNumber)) {
    const p = progressByNumber.get(activeSession.surahNumber) ?? null;
    const item = byNumber.get(activeSession.surahNumber);
    if (item) {
      return toSelection(
        "active_session",
        item,
        activeSession.lessonSlug,
        p?.completedLessons ?? 0,
        p?.totalLessons ?? item.lessonCount,
      );
    }
  }

  // 2. Sourate en cours la plus avancée (déterministe).
  const inProgress = progress
    .filter((p) => p.status === "in_progress" && startableNumbers.has(p.surahNumber))
    .sort(
      (a, b) =>
        b.completedLessons - a.completedLessons || a.surahNumber - b.surahNumber,
    );
  const best = inProgress[0];
  if (best) {
    const item = byNumber.get(best.surahNumber);
    if (item) {
      return toSelection(
        "in_progress",
        item,
        best.nextLessonSlug ?? item.firstLessonSlug,
        best.completedLessons,
        best.totalLessons,
      );
    }
  }

  // 3. Recommandation de découverte — uniquement si elle vise une sourate
  //    réellement `not_started` (jamais une sourate déjà terminée : un
  //    utilisateur qui a tout terminé ne reçoit pas « Découvrir »).
  if (recommendation && startableNumbers.has(recommendation.surahNumber)) {
    const recProgress = progressByNumber.get(recommendation.surahNumber);
    const recNotStarted =
      recProgress == null || recProgress.status === "not_started";
    if (recNotStarted) {
      const item = byNumber.get(recommendation.surahNumber);
      if (item) {
        return toSelection(
          "recommendation",
          item,
          recommendation.firstLessonSlug,
          0,
          item.lessonCount,
        );
      }
    }
  }

  // 4. Découverte de repli : première sourate démarrable non commencée.
  const notStartedStartable = startable.filter((c) => {
    const p = progressByNumber.get(c.surahNumber);
    return p == null || p.status === "not_started";
  });
  if (notStartedStartable.length > 0) {
    const item = notStartedStartable[0];
    return toSelection("fallback", item, item.firstLessonSlug, 0, item.lessonCount);
  }

  // 5. Toutes les sourates démarrables sont terminées → plus rien à découvrir.
  if (startable.length > 0) return ALL_DONE;

  return NO_SELECTION;
}

/**
 * Résumé global de progression sur les sourates démarrables (REFERENCE + READY).
 * Les sourates `IN_PREPARATION` sont exclues des compteurs.
 */
export function summarizeSurahProgress(
  progress: SurahProgress[],
  catalog: ActivePathCatalogItem[],
): SurahSummary {
  const startable = new Set(
    catalog.filter(isStartable).map((c) => c.surahNumber),
  );
  const relevant = progress.filter((p) => startable.has(p.surahNumber));

  return {
    startedSurahs: relevant.filter((p) => p.status === "in_progress").length,
    completedSurahs: relevant.filter((p) => p.status === "completed").length,
    availableSurahs: startable.size,
    completedLessons: relevant.reduce((s, p) => s + p.completedLessons, 0),
    totalLessons: relevant.reduce((s, p) => s + p.totalLessons, 0),
  };
}
