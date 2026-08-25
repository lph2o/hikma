// Rappels d'apprentissage V1 (Phase 80) — couche PURE de décision.
//
// Le moteur décide si un rappel doit être affiché dans le Dashboard.
// Il ne déclenche rien, n'écrit rien, ne fait pas d'I/O.
// Toutes les données nécessaires sont déjà chargées par le Dashboard.
//
// Architecture :
//   user_settings  ─┐
//   goalProgress   ─┤
//   regularity     ─┤─► shouldShowReminder() → ReminderDecision
//   activityHistory─┤
//   now + timezone ─┘      └─► getReminderContent() → { title, message, cta, href }

import type { DailyGoalProgress } from "./activity";
import type { RegularityMetrics } from "./regularity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReminderReason =
  | "no_activity"
  | "inactive_3d"
  | "inactive_7d"
  | "none";

export type ReminderContent = {
  title: string;
  message: string;
  cta: string;
  href: string;
};

export type ReminderDecision = {
  show: boolean;
  reason: ReminderReason;
  streak: number;
  content: ReminderContent | null;
};

export type ShouldShowReminderInput = {
  remindersEnabled: boolean;
  /** Heure locale configurée, ex: "19:00". */
  reminderTime: string;
  /** Date locale YYYY-MM-DD (getLocalDateKey). */
  todayLocal: string;
  /** Timezone IANA, ex: "Europe/Paris". Null = UTC. */
  timezone: string | null;
  goalProgress: DailyGoalProgress;
  regularity: RegularityMetrics;
  /** Historique d'activité récent (30 jours suffisent). */
  activityDays: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }>;
  /** Instant présent (pour comparer l'heure locale). */
  now: Date;
  /** Slug de la leçon active (pour le CTA), null = fallback /review. */
  activeLessonSlug: string | null;
};

// ---------------------------------------------------------------------------
// Eligibility Engine
// ---------------------------------------------------------------------------

/**
 * Détermine si un rappel d'apprentissage doit être affiché.
 * Règles de priorité stricte (ordre) :
 *   1. reminders désactivés → non
 *   2. activité aujourd'hui > 0 → non
 *   3. avant l'heure configurée → non
 *   4. inactif ≥ 14 jours → non (dormant)
 *   5. inactif ≥ 7 jours → rappel réactivation
 *   6. inactif ≥ 3 jours → rappel doux
 *   7. sinon → rappel standard
 */
export function shouldShowReminder(
  input: ShouldShowReminderInput,
): ReminderDecision {
  const {
    remindersEnabled,
    reminderTime,
    todayLocal,
    timezone,
    goalProgress,
    regularity,
    activityDays,
    now,
    activeLessonSlug,
  } = input;

  const streak = regularity.currentStreak;

  // RULE 1 — désactivé
  if (!remindersEnabled) {
    return { show: false, reason: "none", streak, content: null };
  }

  // RULE 2 — déjà actif aujourd'hui
  if (goalProgress.current > 0) {
    return { show: false, reason: "none", streak, content: null };
  }

  // RULE 2bis — vérifier l'heure locale
  if (!isPastReminderTime(now, reminderTime, timezone)) {
    return { show: false, reason: "none", streak, content: null };
  }

  // RULE 3 — inactivité
  const daysSince = daysSinceLastActivity(activityDays, todayLocal);

  // RULE 3a — dormant (≥ 14 jours)
  if (daysSince >= 14) {
    return { show: false, reason: "none", streak, content: null };
  }

  // RULE 3b — réactivation (≥ 7 jours)
  if (daysSince >= 7) {
    return {
      show: true,
      reason: "inactive_7d",
      streak,
      content: getReminderContent("inactive_7d", streak, activeLessonSlug),
    };
  }

  // RULE 3c — rappel doux (≥ 3 jours)
  if (daysSince >= 3) {
    return {
      show: true,
      reason: "inactive_3d",
      streak,
      content: getReminderContent("inactive_3d", streak, activeLessonSlug),
    };
  }

  // RULE 4 — rappel standard
  return {
    show: true,
    reason: "no_activity",
    streak,
    content: getReminderContent("no_activity", streak, activeLessonSlug),
  };
}

// ---------------------------------------------------------------------------
// Reminder Content
// ---------------------------------------------------------------------------

/**
 * Produit le contenu du rappel selon le contexte.
 * Ton : calme, positif, non culpabilisant. Cohérent avec getCoachLine.
 */
export function getReminderContent(
  reason: ReminderReason,
  streak: number,
  activeLessonSlug: string | null,
): ReminderContent {
  const href = activeLessonSlug ? `/learn/${activeLessonSlug}` : "/review";

  switch (reason) {
    case "inactive_7d":
      return {
        title: "Le Coran t'attend",
        message:
          "Apprendre un mot par jour, c'est déjà avancer.",
        cta: "Commencer doucement",
        href,
      };

    case "inactive_3d":
      return {
        title: "On reprend ?",
        message:
          "Chaque jour compte. Ce n'est jamais trop tard pour continuer.",
        cta: "Recommencer",
        href,
      };

    case "no_activity":
    default:
      return standardReminder(streak, href);
  }
}

function standardReminder(streak: number, href: string): ReminderContent {
  if (streak >= 30) {
    return {
      title: "Un mois de régularité",
      message: "Belle discipline. Continue comme ça.",
      cta: "Apprendre maintenant",
      href,
    };
  }
  if (streak >= 7) {
    return {
      title: `${streak} jours de constance`,
      message:
        "Ta régularité se construit jour après jour. Continue aujourd'hui.",
      cta: "Apprendre maintenant",
      href,
    };
  }
  if (streak >= 3) {
    return {
      title: "Ta régularité grandit",
      message: "Chaque jour d'apprentissage compte.",
      cta: "Apprendre maintenant",
      href,
    };
  }
  if (streak >= 1) {
    return {
      title: "Continue sur ta lancée",
      message:
        "Quelques minutes suffisent pour continuer à avancer dans le Coran.",
      cta: "Apprendre maintenant",
      href,
    };
  }
  return {
    title: "Tes mots du jour",
    message:
      "Quelques minutes suffisent pour continuer à avancer dans le Coran.",
    cta: "Apprendre maintenant",
    href,
  };
}

// ---------------------------------------------------------------------------
// Helpers (exportés pour les tests)
// ---------------------------------------------------------------------------

/**
 * Vérifie si l'heure actuelle a dépassé l'heure de rappel configurée
 * dans le timezone de l'utilisateur.
 */
export function isPastReminderTime(
  now: Date,
  reminderTime: string,
  timezone?: string | null,
): boolean {
  // Parse HH:MM
  const [h, m] = reminderTime.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;

  // Obtenir l'heure locale actuelle dans le timezone
  const fmt = timezone
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : new Intl.DateTimeFormat("en-CA", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      });

  const [nowH, nowM] = fmt.format(now).split(":").map(Number);
  if (!Number.isFinite(nowH) || !Number.isFinite(nowM)) return false;

  // Comparaison HH:MM
  if (nowH > h) return true;
  if (nowH === h && nowM >= m) return true;
  return false;
}

/**
 * Calcule le nombre de jours depuis la dernière activité.
 * Parcourt l'historique à l'envers (du plus récent au plus ancien).
 * Retourne le nombre de jours entre todayLocal et la dernière activité.
 * Si aucune activité dans l'historique → Infinity.
 */
export function daysSinceLastActivity(
  activityDays: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }>,
  todayLocal: string,
): number {
  // Parcourt du plus récent au plus ancien
  const sorted = [...activityDays].reverse();
  for (const day of sorted) {
    if (day.wordsStudied > 0 || day.lessonsCompleted > 0) {
      return daysBetween(day.date, todayLocal);
    }
  }
  return Infinity;
}

/**
 * Différence en jours entre deux dates YYYY-MM-DD (positive si b > a).
 */
function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00.000Z`);
  const db = new Date(`${b}T12:00:00.000Z`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}