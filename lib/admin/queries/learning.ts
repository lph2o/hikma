import { getAdminDbClient } from "@/lib/admin/dal";
import type {
  AdminLearningKpis,
  AdminLearningDailyActivity,
  AdminLearningVocabBreakdown,
  AdminLearningInsight,
  AdminLearningTopLesson,
} from "@/lib/admin/metrics";

/**
 * Période d'analyse disponible pour le dashboard Learning.
 * "7d" = 7 derniers jours, "30d" = 30 derniers jours.
 */
export type LearningPeriod = "7d" | "30d";

function getPeriodStart(period: LearningPeriod): { dateStr: string; isoStr: string } {
  const days = period === "7d" ? 7 : 30;
  const start = new Date(Date.now() - (days - 1) * 86400000);
  return {
    dateStr: start.toISOString().split("T")[0],
    isoStr: start.toISOString(),
  };
}

/**
 * KPIs principaux du dashboard Learning pour une période donnée.
 *
 * Sources :
 * - Leçons terminées  → user_activity_lessons (1 ligne = 1 complétion unique par user×date×lesson)
 * - Mots étudiés      → user_activity_words (1 ligne = 1 mot distinct par user×date×word)
 * - Révisions dues    → review_items.next_review_at ≤ now()
 * - Sessions actives  → lesson_sessions.status = 'in_progress'
 * - Vocabulaire       → user_word_progress (mastered/familiar/learning)
 * - Sessions complétées → NOT available via lesson_sessions.completed_at (toujours null)
 *   → proxy : nb de jours distincts avec activité (user_activity_lessons)
 */
export async function getAdminLearningKpis(
  period: LearningPeriod,
): Promise<AdminLearningKpis> {
  const db = getAdminDbClient();
  const { dateStr } = getPeriodStart(period);
  const now = new Date().toISOString();

  const [
    lessonsRes,
    wordsRes,
    reviewsDueRes,
    sessionsActiveRes,
    masteredRes,
    familiarRes,
    learningRes,
    lessonsPrevRes,
    wordsPrevRes,
  ] = await Promise.all([
    // Leçons terminées dans la période
    db
      .from("user_activity_lessons")
      .select("*", { count: "exact", head: true })
      .gte("activity_date", dateStr),
    // Mots étudiés dans la période
    db
      .from("user_activity_words")
      .select("*", { count: "exact", head: true })
      .gte("activity_date", dateStr),
    // Révisions dues maintenant (toutes périodes)
    db
      .from("review_items")
      .select("*", { count: "exact", head: true })
      .lte("next_review_at", now),
    // Sessions en cours (leçons démarrées mais non terminées)
    db
      .from("lesson_sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    // Vocabulaire maîtrisé (toutes périodes — progression cumulée)
    db
      .from("user_word_progress")
      .select("*", { count: "exact", head: true })
      .eq("status", "mastered"),
    // Vocabulaire familier
    db
      .from("user_word_progress")
      .select("*", { count: "exact", head: true })
      .eq("status", "familiar"),
    // Vocabulaire en apprentissage
    db
      .from("user_word_progress")
      .select("*", { count: "exact", head: true })
      .eq("status", "learning"),
    // Période précédente (comparaison) — leçons
    db
      .from("user_activity_lessons")
      .select("*", { count: "exact", head: true })
      .lt("activity_date", dateStr)
      .gte(
        "activity_date",
        new Date(
          Date.now() -
            (period === "7d" ? 14 : 60) * 86400000,
        )
          .toISOString()
          .split("T")[0],
      ),
    // Période précédente — mots
    db
      .from("user_activity_words")
      .select("*", { count: "exact", head: true })
      .lt("activity_date", dateStr)
      .gte(
        "activity_date",
        new Date(
          Date.now() -
            (period === "7d" ? 14 : 60) * 86400000,
        )
          .toISOString()
          .split("T")[0],
      ),
  ]);

  const lessonsCount = lessonsRes.count ?? 0;
  const wordsCount = wordsRes.count ?? 0;
  const lessonsPrev = lessonsPrevRes.count ?? 0;
  const wordsPrev = wordsPrevRes.count ?? 0;

  function delta(current: number, prev: number): number | null {
    if (prev === 0) return null;
    return Math.round(((current - prev) / prev) * 100);
  }

  return {
    period,
    lessonsCompleted: lessonsCount,
    lessonsCompletedDelta: delta(lessonsCount, lessonsPrev),
    wordsStudied: wordsCount,
    wordsStudiedDelta: delta(wordsCount, wordsPrev),
    reviewsDue: reviewsDueRes.count ?? 0,
    sessionsActive: sessionsActiveRes.count ?? 0,
    vocabMastered: masteredRes.count ?? 0,
    vocabFamiliar: familiarRes.count ?? 0,
    vocabLearning: learningRes.count ?? 0,
  };
}

/**
 * Série temporelle d'activité jour par jour sur la période.
 * Retourne TOUS les jours (les jours sans activité ont des compteurs à 0).
 */
export async function getAdminLearningActivityChart(
  period: LearningPeriod,
): Promise<AdminLearningDailyActivity[]> {
  const db = getAdminDbClient();
  const days = period === "7d" ? 7 : 30;
  const { dateStr } = getPeriodStart(period);

  const [lessonsRes, wordsRes] = await Promise.all([
    db
      .from("user_activity_lessons")
      .select("activity_date, user_id")
      .gte("activity_date", dateStr),
    db
      .from("user_activity_words")
      .select("activity_date, user_id")
      .gte("activity_date", dateStr),
  ]);

  // Construire le calendrier complet
  const now = new Date();
  const mapByDate = new Map<
    string,
    { lessons: number; words: number; users: Set<string> }
  >();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    mapByDate.set(key, { lessons: 0, words: 0, users: new Set() });
  }

  for (const r of (lessonsRes.data ?? []) as Array<{
    activity_date: string;
    user_id: string;
  }>) {
    const entry = mapByDate.get(r.activity_date);
    if (entry) {
      entry.lessons += 1;
      if (r.user_id) entry.users.add(r.user_id);
    }
  }

  for (const r of (wordsRes.data ?? []) as Array<{
    activity_date: string;
    user_id: string;
  }>) {
    const entry = mapByDate.get(r.activity_date);
    if (entry) {
      entry.words += 1;
      if (r.user_id) entry.users.add(r.user_id);
    }
  }

  const result: AdminLearningDailyActivity[] = [];
  mapByDate.forEach((val, dateStr) => {
    const [, month, day] = dateStr.split("-");
    result.push({
      date: dateStr,
      dayLabel: `${day}/${month}`,
      lessonsCompleted: val.lessons,
      wordsStudied: val.words,
      activeUsers: val.users.size,
    });
  });

  return result;
}

/**
 * Répartition du vocabulaire SRS (pyramide mastery).
 */
export async function getAdminLearningVocabBreakdown(): Promise<AdminLearningVocabBreakdown> {
  const db = getAdminDbClient();

  const [masteredRes, familiarRes, learningRes, reviewDueRes, totalProgressRes] =
    await Promise.all([
      db
        .from("user_word_progress")
        .select("*", { count: "exact", head: true })
        .eq("status", "mastered"),
      db
        .from("user_word_progress")
        .select("*", { count: "exact", head: true })
        .eq("status", "familiar"),
      db
        .from("user_word_progress")
        .select("*", { count: "exact", head: true })
        .eq("status", "learning"),
      db
        .from("review_items")
        .select("*", { count: "exact", head: true })
        .lte("next_review_at", new Date().toISOString()),
      db.from("user_word_progress").select("*", { count: "exact", head: true }),
    ]);

  return {
    mastered: masteredRes.count ?? 0,
    familiar: familiarRes.count ?? 0,
    learning: learningRes.count ?? 0,
    reviewDue: reviewDueRes.count ?? 0,
    totalInProgress: totalProgressRes.count ?? 0,
  };
}

/**
 * Top leçons par nombre de complétions (toutes périodes).
 */
export async function getAdminLearningTopLessons(): Promise<AdminLearningTopLesson[]> {
  const db = getAdminDbClient();

  // Récupère toutes les entrées (max 1000 via cap REST, suffisant ici)
  const { data, error } = await db
    .from("user_activity_lessons")
    .select("lesson_id")
    .limit(1000);

  if (error || !data) return [];

  const countMap = new Map<string, number>();
  for (const r of data as Array<{ lesson_id: string }>) {
    countMap.set(r.lesson_id, (countMap.get(r.lesson_id) ?? 0) + 1);
  }

  const topIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: lessonRows } = await db
    .from("lessons")
    .select("id, title, slug, units(title)")
    .in("id", topIds);

  const lessonMap = new Map<string, { title: string; unitTitle: string | null }>();
  for (const l of (lessonRows ?? []) as Array<{
    id: string;
    title: string;
    units: { title?: string } | null;
  }>) {
    lessonMap.set(l.id, {
      title: l.title,
      unitTitle: l.units?.title ?? null,
    });
  }

  return topIds.map((id) => ({
    lessonId: id,
    lessonTitle: lessonMap.get(id)?.title ?? "Leçon inconnue",
    unitTitle: lessonMap.get(id)?.unitTitle ?? null,
    completionCount: countMap.get(id) ?? 0,
  }));
}

/**
 * Insights calculés uniquement sur données réelles fiables.
 * Aucune alerte si le seuil n'est pas atteint.
 */
export async function getAdminLearningInsights(
  period: LearningPeriod,
): Promise<AdminLearningInsight[]> {
  const db = getAdminDbClient();
  const insights: AdminLearningInsight[] = [];
  const now = new Date();

  // 1. Révisions très en retard (> 7j depuis l'échéance)
  const overdueThreshold = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { count: overdue } = await db
    .from("review_items")
    .select("*", { count: "exact", head: true })
    .lte("next_review_at", overdueThreshold);

  if ((overdue ?? 0) >= 5) {
    insights.push({
      type: "warning",
      key: "reviews_overdue",
      title: "Révisions très en retard",
      description: `${overdue} révisions ont plus de 7 jours de retard. L'efficacité du SRS est réduite.`,
      value: overdue ?? 0,
    });
  }

  // 2. Sessions in_progress bloquées (dernière activité > 7j)
  const staleThreshold = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { count: staleSessions } = await db
    .from("lesson_sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress")
    .lte("last_activity_at", staleThreshold);

  if ((staleSessions ?? 0) >= 1) {
    insights.push({
      type: "info",
      key: "sessions_stale",
      title: "Sessions abandonnées",
      description: `${staleSessions} session${(staleSessions ?? 0) > 1 ? "s" : ""} en cours sans activité depuis plus de 7 jours.`,
      value: staleSessions ?? 0,
    });
  }

  // 3. Baisse d'activité significative (comparaison demi-périodes)
  const halfPeriodDays = period === "7d" ? 3 : 15;
  const midDate = new Date(now.getTime() - halfPeriodDays * 86400000)
    .toISOString()
    .split("T")[0];
  const { dateStr: startDate } = getPeriodStart(period);

  const [firstHalfRes, secondHalfRes] = await Promise.all([
    db
      .from("user_activity_lessons")
      .select("*", { count: "exact", head: true })
      .gte("activity_date", startDate)
      .lt("activity_date", midDate),
    db
      .from("user_activity_lessons")
      .select("*", { count: "exact", head: true })
      .gte("activity_date", midDate),
  ]);

  const first = firstHalfRes.count ?? 0;
  const second = secondHalfRes.count ?? 0;
  if (first > 0 && second < first * 0.4) {
    insights.push({
      type: "warning",
      key: "activity_drop",
      title: "Baisse d'activité détectée",
      description: `L'activité de la seconde moitié de la période (${second} leçons) est nettement inférieure à la première (${first} leçons).`,
      value: first - second,
    });
  }

  return insights;
}
