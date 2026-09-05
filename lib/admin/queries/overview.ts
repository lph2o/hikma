import { getAdminDbClient } from "@/lib/admin/dal";
import type {
  AdminOverviewMetrics,
  AdminAttentionMetrics,
  AdminDailyActivity,
  QuranLegacyCount,
} from "@/lib/admin/metrics";
import type { QuranImport } from "@/types/quran";

/**
 * Récupère les KPI clés du panneau d'administration pour la vue d'ensemble.
 */
export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const db = getAdminDbClient();
  const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const d7Iso = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    totalUsersRes,
    newUsers7dRes,
    lessonsPublishedRes,
    activeLessons7dRes,
    activeWords7dRes,
    sessions7dRes,
    totalQuranWordsRes,
    validatedWordsRes,
  ] = await Promise.all([
    db.from("user_settings").select("*", { count: "exact", head: true }),
    db
      .from("user_settings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", d7Iso),
    db
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
    db
      .from("user_activity_lessons")
      .select("user_id")
      .gte("activity_date", d7),
    db
      .from("user_activity_words")
      .select("user_id")
      .gte("activity_date", d7),
    db
      .from("lesson_sessions")
      .select("*", { count: "exact", head: true })
      .gte("completed_at", d7Iso),
    db.from("quran_words").select("*", { count: "exact", head: true }),
    // Audit vérifié : chaque ligne de word_translations (fr, validée) correspond
    // strictement à un word_id unique (6 095 lignes = 6 095 formes uniques).
    // Compter directement sur word_translations est 10x plus rapide et évite la jointure.
    db
      .from("word_translations")
      .select("*", { count: "exact", head: true })
      .eq("language", "fr")
      .eq("is_validated", true),
  ]);


  const activeUserIds = new Set<string>();
  for (const r of (activeLessons7dRes.data ?? []) as Array<{ user_id: string }>) {
    if (r.user_id) activeUserIds.add(r.user_id);
  }
  for (const r of (activeWords7dRes.data ?? []) as Array<{ user_id: string }>) {
    if (r.user_id) activeUserIds.add(r.user_id);
  }

  const totalWords = totalQuranWordsRes.count ?? 0;
  const validatedWords = validatedWordsRes.count ?? 0;
  const coveragePercent =
    totalWords > 0 ? Math.round((validatedWords / totalWords) * 1000) / 10 : 0;

  return {
    totalUsers: totalUsersRes.count ?? 0,
    activeUsers7d: activeUserIds.size,
    newUsers7d: newUsers7dRes.count ?? 0,
    sessions7d: sessions7dRes.count ?? 0,
    lessonsPublished: lessonsPublishedRes.count ?? 0,
    coveragePercent,
    totalQuranWords: totalWords,
    validatedQuranWords: validatedWords,
  };
}

/**
 * Récupère les alertes et points d'attention (qualité, backlog, erreurs).
 */
export async function getAdminAttentionMetrics(): Promise<AdminAttentionMetrics> {
  const db = getAdminDbClient();

  const [failedRes, pendingRes, reviewRes, draftLessonsRes] = await Promise.all([
    db
      .from("content_items")
      .select("*", { count: "exact", head: true })
      .eq("render_status", "FAILED"),
    db
      .from("content_items")
      .select("*", { count: "exact", head: true })
      .eq("render_status", "NOT_RENDERED")
      .eq("status", "APPROVED"),
    db
      .from("content_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "REVIEW"),
    db
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
  ]);

  return {
    rendersFailed: failedRes.count ?? 0,
    rendersPending: pendingRes.count ?? 0,
    contentReview: reviewRes.count ?? 0,
    lessonsDraft: draftLessonsRes.count ?? 0,
  };
}

/**
 * Récupère la série temporelle d'activité sur les 30 derniers jours.
 */
export async function getAdminActivityChart30d(): Promise<AdminDailyActivity[]> {
  const db = getAdminDbClient();

  const now = new Date();
  const d30Date = new Date(Date.now() - 29 * 86400000);
  const d30Str = d30Date.toISOString().split("T")[0];
  const d30Iso = d30Date.toISOString();

  const [lessonsRes, wordsRes, usersRes] = await Promise.all([
    db
      .from("user_activity_lessons")
      .select("activity_date, user_id")
      .gte("activity_date", d30Str),
    db
      .from("user_activity_words")
      .select("activity_date, user_id")
      .gte("activity_date", d30Str),
    db
      .from("user_settings")
      .select("created_at")
      .gte("created_at", d30Iso),
  ]);

  // Initialisation du calendrier sur 30 jours
  const mapByDate = new Map<
    string,
    {
      lessonsCompleted: number;
      wordsStudied: number;
      activeUsers: Set<string>;
      newUsers: number;
    }
  >();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    mapByDate.set(dateStr, {
      lessonsCompleted: 0,
      wordsStudied: 0,
      activeUsers: new Set<string>(),
      newUsers: 0,
    });
  }

  for (const r of (lessonsRes.data ?? []) as Array<{
    activity_date: string;
    user_id: string;
  }>) {
    const entry = mapByDate.get(r.activity_date);
    if (entry) {
      entry.lessonsCompleted += 1;
      if (r.user_id) entry.activeUsers.add(r.user_id);
    }
  }

  for (const r of (wordsRes.data ?? []) as Array<{
    activity_date: string;
    user_id: string;
  }>) {
    const entry = mapByDate.get(r.activity_date);
    if (entry) {
      entry.wordsStudied += 1;
      if (r.user_id) entry.activeUsers.add(r.user_id);
    }
  }

  for (const r of (usersRes.data ?? []) as Array<{ created_at: string }>) {
    if (r.created_at) {
      const dateStr = r.created_at.split("T")[0];
      const entry = mapByDate.get(dateStr);
      if (entry) {
        entry.newUsers += 1;
      }
    }
  }

  const result: AdminDailyActivity[] = [];
  mapByDate.forEach((val, dateStr) => {
    const [, month, day] = dateStr.split("-");
    result.push({
      date: dateStr,
      dayLabel: `${day}/${month}`,
      lessonsCompleted: val.lessonsCompleted,
      wordsStudied: val.wordsStudied,
      activeUsers: val.activeUsers.size,
      newUsers: val.newUsers,
    });
  });

  return result;
}

/**
 * Récupère les compteurs des tables coraniques pour rétrocompatibilité.
 */
export async function getQuranLegacyCounts(): Promise<QuranLegacyCount[]> {
  const db = getAdminDbClient();
  const tables = [
    { key: "surahs", label: "Sourates" },
    { key: "ayahs", label: "Versets" },
    { key: "quran_words", label: "Mots distincts" },
    { key: "word_occurrences", label: "Occurrences" },
    { key: "translations", label: "Traductions" },
    { key: "recitations", label: "Récitants" },
  ] as const;

  const results = await Promise.all(
    tables.map(async ({ key, label }) => {
      try {
        const { count, error } = await db
          .from(key)
          .select("*", { count: "exact", head: true });
        return { key, label, count: error ? null : (count ?? 0) };
      } catch {
        return { key, label, count: null };
      }
    }),
  );

  return results;
}

/**
 * Récupère le dernier enregistrement de la table imports.
 */
export async function getLatestQuranImport(): Promise<QuranImport | null> {
  const db = getAdminDbClient();
  try {
    const { data, error } = await db
      .from("imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as QuranImport | null) ?? null;
  } catch {
    return null;
  }
}
