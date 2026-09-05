import { getAdminDbClient } from "@/lib/admin/dal";
import { isAdminEmail } from "@/lib/admin/auth";
import type {
  AdminUserListItem,
  AdminUsersListResponse,
  AdminUserDetail,
  AdminUserWordItem,
  AdminUserActivityItem,
} from "@/lib/admin/metrics";

interface GetUsersListOptions {
  page?: number;
  perPage?: number;
  search?: string;
  statusFilter?: "all" | "onboarded" | "not_onboarded" | "active_7d";
}

/**
 * Récupère la liste paginée des utilisateurs pour l'administration.
 * Associe Supabase Auth (emails, sessions) aux données de profil et d'activité.
 */
export async function getAdminUsersList(
  options: GetUsersListOptions = {},
): Promise<AdminUsersListResponse> {
  const db = getAdminDbClient();
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.max(1, Math.min(100, options.perPage ?? 20));

  // 1. Récupération de tous les utilisateurs auth via l'API Admin (paginated)
  const { data: authData, error: authError } = await db.auth.admin.listUsers({
    page,
    perPage: 100, // On récupère un lot suffisant pour fusionner et filtrer
  });

  if (authError) {
    throw new Error(`Erreur lors de la lecture des utilisateurs auth: ${authError.message}`);
  }

  const authUsers = authData.users;
  const userIds = authUsers.map((u) => u.id);

  if (userIds.length === 0) {
    return {
      users: [],
      totalUsers: 0,
      page: 1,
      perPage,
      totalPages: 0,
    };
  }

  // 2. Récupération en parallèle des profils et statistiques d'activité
  const [settingsRes, lessonsRes, wordsRes, progressRes] = await Promise.all([
    db.from("user_settings").select("*").in("user_id", userIds),
    db
      .from("user_activity_lessons")
      .select("user_id, activity_date")
      .in("user_id", userIds),
    db
      .from("user_activity_words")
      .select("user_id, activity_date")
      .in("user_id", userIds),
    db
      .from("user_word_progress")
      .select("user_id, status")
      .in("user_id", userIds),
  ]);

  const settingsMap = new Map<string, Record<string, unknown>>();
  for (const s of settingsRes.data ?? []) {
    settingsMap.set(s.user_id as string, s);
  }

  const lessonsCountMap = new Map<string, number>();
  const lastLessonDateMap = new Map<string, string>();
  for (const l of lessonsRes.data ?? []) {
    const uid = l.user_id as string;
    lessonsCountMap.set(uid, (lessonsCountMap.get(uid) ?? 0) + 1);
    const existing = lastLessonDateMap.get(uid);
    if (!existing || (l.activity_date as string) > existing) {
      lastLessonDateMap.set(uid, l.activity_date as string);
    }
  }

  const wordsCountMap = new Map<string, number>();
  const lastWordDateMap = new Map<string, string>();
  for (const w of wordsRes.data ?? []) {
    const uid = w.user_id as string;
    wordsCountMap.set(uid, (wordsCountMap.get(uid) ?? 0) + 1);
    const existing = lastWordDateMap.get(uid);
    if (!existing || (w.activity_date as string) > existing) {
      lastWordDateMap.set(uid, w.activity_date as string);
    }
  }

  const masteredCountMap = new Map<string, number>();
  for (const p of progressRes.data ?? []) {
    if (p.status === "mastered") {
      const uid = p.user_id as string;
      masteredCountMap.set(uid, (masteredCountMap.get(uid) ?? 0) + 1);
    }
  }

  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // 3. Fusion et mapping
  let mappedUsers: AdminUserListItem[] = authUsers.map((u) => {
    const s = settingsMap.get(u.id);
    const lastLesson = lastLessonDateMap.get(u.id);
    const lastWord = lastWordDateMap.get(u.id);
    const lastSignIn = u.last_sign_in_at ? u.last_sign_in_at.split("T")[0] : null;

    let lastActiveAt: string | null = null;
    const candidates = [lastLesson, lastWord, lastSignIn].filter(Boolean) as string[];
    if (candidates.length > 0) {
      candidates.sort();
      lastActiveAt = candidates[candidates.length - 1];
    }

    return {
      id: u.id,
      email: u.email ?? null,
      displayName: (s?.display_name as string) ?? null,
      isAdmin: isAdminEmail(u.email),
      onboarded: Boolean(s?.onboarded),
      learningGoal: (s?.learning_goal as string) ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      lastActiveAt,
      lessonsCompletedCount: lessonsCountMap.get(u.id) ?? 0,
      wordsStudiedCount: wordsCountMap.get(u.id) ?? 0,
      wordsMasteredCount: masteredCountMap.get(u.id) ?? 0,
    };
  });

  // 4. Filtrage de recherche
  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    mappedUsers = mappedUsers.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)),
    );
  }

  // 5. Filtrage par statut
  if (options.statusFilter === "onboarded") {
    mappedUsers = mappedUsers.filter((u) => u.onboarded);
  } else if (options.statusFilter === "not_onboarded") {
    mappedUsers = mappedUsers.filter((u) => !u.onboarded);
  } else if (options.statusFilter === "active_7d") {
    mappedUsers = mappedUsers.filter(
      (u) => u.lastActiveAt && u.lastActiveAt >= sevenDaysAgoStr,
    );
  }

  // Tri par date de création décroissante
  mappedUsers.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalFiltered = mappedUsers.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const startIndex = (page - 1) * perPage;
  const paginatedUsers = mappedUsers.slice(startIndex, startIndex + perPage);

  return {
    users: paginatedUsers,
    totalUsers: totalFiltered,
    page,
    perPage,
    totalPages,
  };
}

/**
 * Récupère le détail complet d'un utilisateur par son identifiant.
 */
export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const db = getAdminDbClient();

  // 1. Utilisateur auth
  const { data: authData, error: authError } =
    await db.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    return null;
  }

  const u = authData.user;

  // 2. Settings, progression et activités en parallèle
  const [settingsRes, progressRes, activitiesRes] = await Promise.all([
    db
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("user_word_progress")
      .select(
        "word_id, status, mastery, correct_count, incorrect_count, next_review_at, quran_words(arabic, transliteration, word_translations(text, language, is_validated))",
      )
      .eq("user_id", userId)
      .order("mastery", { ascending: false })
      .limit(100),
    db
      .from("user_activity_lessons")
      .select("activity_date, lesson_id, lessons(id, title, units(title))")
      .eq("user_id", userId)
      .order("activity_date", { ascending: false })
      .limit(50),
  ]);

  const s = settingsRes.data;

  // Progression mots
  let masteredWords = 0;
  let familiarWords = 0;
  let learningWords = 0;

  const words: AdminUserWordItem[] = [];
  for (const raw of (progressRes.data ?? []) as Array<Record<string, unknown>>) {
    const status = (raw.status as string) ?? "new";
    if (status === "mastered") masteredWords++;
    else if (status === "familiar") familiarWords++;
    else if (status === "learning") learningWords++;

    const qw = raw.quran_words as Record<string, unknown> | null;
    let meaning: string | null = null;
    if (qw && Array.isArray(qw.word_translations)) {
      const validFr = (qw.word_translations as Array<{
        text?: string;
        language?: string;
        is_validated?: boolean;
      }>).find((t) => t.language === "fr" && t.is_validated);
      if (validFr?.text) meaning = validFr.text;
    }

    words.push({
      wordId: raw.word_id as string,
      arabic: (qw?.arabic as string) ?? "",
      transliteration: (qw?.transliteration as string) ?? null,
      meaning,
      status,
      mastery: (raw.mastery as number) ?? 0,
      correctCount: (raw.correct_count as number) ?? 0,
      incorrectCount: (raw.incorrect_count as number) ?? 0,
      nextReviewAt: (raw.next_review_at as string) ?? null,
    });
  }

  // Activités récentes
  const recentActivities: AdminUserActivityItem[] = [];
  for (const raw of (activitiesRes.data ?? []) as Array<Record<string, unknown>>) {
    const l = raw.lessons as { id?: string; title?: string; units?: { title?: string } } | null;
    recentActivities.push({
      activityDate: raw.activity_date as string,
      lessonId: raw.lesson_id as string,
      lessonTitle: l?.title ?? "Leçon sans titre",
      unitTitle: l?.units?.title ?? null,
    });
  }

  return {
    id: u.id,
    email: u.email ?? null,
    displayName: (s?.display_name as string) ?? null,
    isAdmin: isAdminEmail(u.email),
    onboarded: Boolean(s?.onboarded),
    learningGoal: (s?.learning_goal as string) ?? null,
    dailyGoalType: (s?.daily_goal_type as string) ?? null,
    dailyGoalValue: (s?.daily_goal_value as number) ?? null,
    arabicReadingLevel: (s?.arabic_reading_level as string) ?? null,
    quranFamiliarity: (s?.quran_familiarity as string) ?? null,
    timezone: (s?.timezone as string) ?? null,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    progress: {
      totalWords: words.length,
      masteredWords,
      familiarWords,
      learningWords,
    },
    words,
    recentActivities,
  };
}
