// Régularité d'apprentissage (Phase 73) — couche PURE de calcul.
//
// Le streak est DÉRIVÉ des journaux d'activité existants
// (user_activity_lessons + user_activity_words). Aucune table nouvelle,
// aucune migration, aucune écriture.
//
// Toutes les fonctions sont pures, sans I/O, testables isolément.
// Les dates sont manipulées comme des chaînes YYYY-MM-DD (convention
// cohérente avec getActivityDate() en UTC).

import { getActivityDate } from "./activity";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Métriques de régularité dérivées des journaux d'activité. */
export type RegularityMetrics = {
  /** Jours consécutifs en remontant depuis aujourd'hui (UTC). */
  currentStreak: number;
  /** Plus longue série de jours consécutifs de tout l'historique. */
  longestStreak: number;
  /** Nombre de jours actifs distincts dans la fenêtre de 7 jours. */
  weeklyActiveDays: number;
  /** Nombre total de jours actifs distincts dans l'historique. */
  totalActiveDays: number;
};

/** Activité d'un mois. */
export type MonthlyActivity = {
  /** Année (ex. 2026). */
  year: number;
  /** Mois (1–12). */
  month: number;
  /** Nombre de jours actifs distincts dans le mois. */
  activeDays: number;
  /** Nombre total de jours dans le mois. */
  totalDays: number;
};

/** Une cellule du calendrier d'activité. */
export type CalendarDay = {
  /** Date YYYY-MM-DD. */
  date: string;
  /** Jour du mois (1–31). */
  day: number;
  /** true si ce jour a eu une activité pédagogique. */
  active: boolean;
  /** true si ce jour est aujourd'hui (UTC). */
  isToday: boolean;
  /** true si ce jour appartient au mois affiché (false = padding mois précédent/suivant). */
  isCurrentMonth: boolean;
  /** true si ce jour est dans le futur (> today). */
  isFuture: boolean;
};

/** Grille complète d'un mois calendaire (semaines × jours, 6 ou 7 colonnes selon affichage). */
export type MonthGrid = {
  year: number;
  month: number;
  /** Semaines, chaque semaine = 7 CalendarDay. */
  weeks: CalendarDay[][];
  /** Nom de mois lisible (ex. "Août 2026"). */
  label: string;
  /** Jours actifs dans ce mois. */
  activeDays: number;
};

// ---------------------------------------------------------------------------
// Utilitaires de date (YYYY-MM-DD)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 86_400_000;

/**
 * Convertit une date YYYY-MM-DD en timestamp UTC (midi, pour éviter les
 * décalages de fuseau). Retourne NaN pour une chaîne invalide.
 */
function dateToTimestamp(date: string): number {
  // On parse explicitement YYYY-MM-DD (indépendant du fuseau système).
  const parts = date.split("-");
  if (parts.length !== 3) return NaN;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return NaN;
  return Date.UTC(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Ajoute `delta` jours à une date YYYY-MM-DD. Retourne une nouvelle chaîne.
 * `delta` peut être négatif.
 */
function addDays(date: string, delta: number): string {
  const ts = dateToTimestamp(date);
  if (Number.isNaN(ts)) return date;
  const d = new Date(ts + delta * MS_PER_DAY);
  return getActivityDate(d); // UTC → YYYY-MM-DD
}

/** Comparaison chronologique déterministe de deux dates YYYY-MM-DD. */
function compareDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Vérifie si deux dates YYYY-MM-DD sont consécutives (b = a + 1 jour).
 * Robuste : manipule les chaînes, pas les objets Date.
 */
function areConsecutive(earlier: string, later: string): boolean {
  return addDays(earlier, 1) === later;
}

// ---------------------------------------------------------------------------
// Fonctions pures de calcul
// ---------------------------------------------------------------------------

/**
 * Déduplique et trie une liste de dates (YYYY-MM-DD).
 * Retourne un tableau trié chronologiquement, sans doublon.
 * Un tableau vide retourne un tableau vide (jamais null/undefined).
 */
export function computeLearningDays(dates: string[]): string[] {
  return [...new Set(dates)].sort(compareDates);
}

/**
 * Calcule le streak courant : nombre de jours consécutifs avec activité
 * en remontant depuis `today` (inclus si `today` fait partie des jours
 * actifs). Une interruption (jour manquant) arrête le comptage.
 *
 * Règles :
 * - Si `today` est actif → on compte `today` et on remonte.
 * - Si `today` n'est pas actif mais `today - 1` l'est → streak = 0
 *   (la série est interrompue aujourd'hui).
 * - Aucun jour actif → 0.
 */
export function computeCurrentStreak(
  days: string[],
  today: string,
): number {
  const set = new Set(computeLearningDays(days));
  if (set.size === 0) return 0;

  // Détermine le point de départ : aujourd'hui si actif, sinon on vérifie
  // si hier était actif (streak = 0 dans les deux cas si aujourd'hui
  // n'est pas actif — la série est rompue).
  if (!set.has(today)) return 0;

  let streak = 1;
  let cursor = today;
  while (true) {
    cursor = addDays(cursor, -1);
    if (set.has(cursor)) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le plus long streak de tout l'historique.
 * Parcourt les jours triés et détecte les séquences consécutives.
 */
export function computeLongestStreak(days: string[]): number {
  const sorted = computeLearningDays(days);
  if (sorted.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (areConsecutive(sorted[i - 1], sorted[i])) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * Calcule le nombre de jours actifs parmi les 7 derniers jours
 * (fenêtre glissante se terminant à `today` inclus).
 *
 * Cohérent avec `composeWeeklySummary` : un jour avec plusieurs
 * activités ne compte qu'une fois.
 */
export function computeWeeklyConsistency(
  days: string[],
  today: string,
): number {
  const set = new Set(computeLearningDays(days));

  // 7 derniers jours : today, today-1, ..., today-6
  let active = 0;
  let cursor = today;
  for (let i = 0; i < 7; i++) {
    if (set.has(cursor)) active += 1;
    cursor = addDays(cursor, -1);
  }

  return active;
}

/**
 * Calcule toutes les métriques de régularité à partir d'une liste de
 * dates d'activité distinctes. Fonction d'agrégation pratique pour
 * l'appelant (dashboard).
 */
export function computeRegularityMetrics(
  days: string[],
  today: string,
): RegularityMetrics {
  const learningDays = computeLearningDays(days);
  return {
    currentStreak: computeCurrentStreak(learningDays, today),
    longestStreak: computeLongestStreak(learningDays),
    weeklyActiveDays: computeWeeklyConsistency(learningDays, today),
    totalActiveDays: learningDays.length,
  };
}

// ---------------------------------------------------------------------------
// Calendrier mensuel (Phase 74)
// ---------------------------------------------------------------------------

/** Mois en français (format long, première lettre majuscule). */
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Jours de la semaine en français (abrégés, commençant lundi). */
const WEEKDAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/**
 * Calcule l'activité d'un mois donné.
 * Pure, sans I/O, déterministe.
 *
 * @param days — Jours actifs (YYYY-MM-DD, déjà dédupliqués ou non).
 * @param year — Année (ex. 2026).
 * @param month — Mois (1–12).
 */
export function computeMonthlyActivity(
  days: string[],
  year: number,
  month: number,
): MonthlyActivity {
  const set = new Set(computeLearningDays(days));
  const totalDays = daysInMonth(year, month);
  let activeDays = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = ymd(year, month, d);
    if (set.has(date)) activeDays += 1;
  }

  return { year, month, activeDays, totalDays };
}

/**
 * Construit la grille d'un mois pour l'affichage calendaire.
 * Chaque semaine commence le lundi (ISO 8601). Les jours hors du mois
 * (padding début/fin) sont marqués `isCurrentMonth: false`.
 *
 * @param days — Jours actifs (YYYY-MM-DD).
 * @param year — Année.
 * @param month — Mois (1–12).
 * @param today — Date du jour (YYYY-MM-DD).
 */
export function computeMonthGrid(
  days: string[],
  year: number,
  month: number,
  today: string,
): MonthGrid {
  const set = new Set(computeLearningDays(days));
  const totalDays = daysInMonth(year, month);
  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  // Premier jour du mois (0 = dimanche, 1 = lundi, …, 6 = samedi).
  const firstWeekday = dateToWeekday(year, month, 1);

  // Dernier jour du mois.
  const lastWeekday = dateToWeekday(year, month, totalDays);

  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Padding début de mois : jours du mois précédent.
  const prevMonthTotal = month === 1
    ? daysInMonth(year - 1, 12)
    : daysInMonth(year, month - 1);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  for (let i = 0; i < firstWeekday; i++) {
    const d = prevMonthTotal - firstWeekday + i + 1;
    const date = ymd(prevYear, prevMonth, d);
    currentWeek.push(makeDay(date, d, set, today, false));
  }

  // Jours du mois courant.
  for (let d = 1; d <= totalDays; d++) {
    const date = ymd(year, month, d);
    currentWeek.push(makeDay(date, d, set, today, true));

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Padding fin de mois : jours du mois suivant.
  if (currentWeek.length > 0) {
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    let d = 1;
    while (currentWeek.length < 7) {
      const date = ymd(nextYear, nextMonth, d);
      currentWeek.push(makeDay(date, d, set, today, false));
      d++;
    }
    weeks.push(currentWeek);
  }

  const activeDays = [...set].filter((date) => {
    const [y, m] = date.split("-").map(Number);
    return y === year && m === month;
  }).length;

  return { year, month, weeks, label, activeDays };
}

/** Jours de la semaine (lundi–dimanche). */
export { WEEKDAY_NAMES as WEEKDAYS };

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Nombre de jours dans un mois (année pour février bissextile). */
function daysInMonth(year: number, month: number): number {
  // Mois 0 = janvier dans Date.UTC, donc on utilise le jour 0 du mois suivant.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Formate YYYY-MM-DD zéro-padded. */
function ymd(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/**
 * Jour de semaine d'une date (0 = lundi … 6 = dimanche, ISO 8601).
 * Utilise Date.UTC pour être indépendant du fuseau système.
 */
function dateToWeekday(year: number, month: number, day: number): number {
  const jsDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  // Date.getUTCDay() : 0 = dimanche → on convertit en lundi=0.
  return jsDay === 0 ? 6 : jsDay - 1;
}

function makeDay(
  date: string,
  day: number,
  activeSet: Set<string>,
  today: string,
  isCurrentMonth: boolean,
): CalendarDay {
  return {
    date,
    day,
    active: activeSet.has(date),
    isToday: date === today,
    isCurrentMonth,
    isFuture: date > today,
  };
}