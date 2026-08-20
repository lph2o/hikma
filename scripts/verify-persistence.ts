// Vérification RÉELLE de la persistance Phase 5 (Étape 12–14).
//
// Simule une fin de leçon pour un utilisateur temporaire :
//   réponses d'une leçon → replayWordResults (Learning + Review Engine)
//   → upsert user_word_progress + review_items (Supabase, RLS).
// Puis vérifie que le contexte pédagogique (statuts de leçons) reflète
// la progression. L'utilisateur de test est SUPPRIMÉ à la fin.
//
// Usage :
//   npm run verify:persistence

import { createClient } from "@supabase/supabase-js";
import { replayWordResults } from "../lib/learning/session";
import {
  getActivityDate,
  getDailyActivity,
  getDailyGoalProgress,
} from "../lib/learning/activity";
import type { ReviewState } from "../lib/review";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !anon || !service) {
    throw new Error("Variables Supabase requises.");
  }

  const now = Date.now();
  const email = `persist-test-${now}@hikma.test`;
  let userId = "";
  const checks: Array<{ ok: boolean; msg: string }> = [];
  const check = (ok: boolean, msg: string) => {
    checks.push({ ok, msg });
    console.log(`${ok ? "✅" : "❌"} ${msg}`);
  };

  try {
    // 1. Utilisateur temporaire.
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: service,
        Authorization: `Bearer ${service}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password: "test-password-123", email_confirm: true }),
    });
    if (res.status !== 201 && res.status !== 200) throw new Error(await res.text());
    userId = ((await res.json()) as { id: string }).id;

    const signin = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test-password-123" }),
    });
    const token = ((await signin.json()) as { access_token: string }).access_token;
    const client = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    // 2. Mots réels de la leçon basmala (Al-Fatiha 1:1).
    const { data: lessonRows } = await client
      .from("lessons")
      .select("id")
      .eq("slug", "basmala")
      .limit(1);
    const lessonId = lessonRows?.[0]?.id as string;
    const { data: lwRows } = await client
      .from("lesson_words")
      .select("word_id")
      .eq("lesson_id", lessonId)
      .order("position");
    const wordIds = (lwRows ?? []).map((r) => (r as { word_id: string }).word_id);
    check(wordIds.length >= 4, `Leçon basmala : ${wordIds.length} mots réels chargés`);

    // 3. Réponses simulées : 3 correctes sur chaque mot (→ familiar).
    const attempts = [true, true, true];
    const nowDate = new Date();
    for (const wordId of wordIds) {
      const { data: prog } = await client
        .from("user_word_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("word_id", wordId)
        .maybeSingle();
      const { data: rev } = await client
        .from("review_items")
        .select("*")
        .eq("user_id", userId)
        .eq("word_id", wordId)
        .maybeSingle();

      const progress = prog
        ? { status: prog.status as never, correctCount: prog.correct_count, incorrectCount: prog.incorrect_count, mastery: prog.mastery, intervalDays: rev?.interval_days ?? 0 }
        : null;
      const review: ReviewState | null = rev
        ? { status: rev.status as ReviewState["status"], intervalDays: rev.interval_days, lastReviewAt: rev.last_review_at, nextReviewAt: rev.next_review_at }
        : null;

      const replayed = replayWordResults(progress, review, attempts, nowDate);
      const iso = nowDate.toISOString();

      await client.from("user_word_progress").upsert(
        {
          user_id: userId,
          word_id: wordId,
          status: replayed.progress.status,
          mastery: replayed.progress.mastery,
          correct_count: replayed.progress.correctCount,
          incorrect_count: replayed.progress.incorrectCount,
          last_seen_at: iso,
          next_review_at: replayed.review.nextReviewAt,
          updated_at: iso,
        },
        { onConflict: "user_id,word_id" },
      );
      await client.from("review_items").upsert(
        {
          user_id: userId,
          word_id: wordId,
          status: replayed.review.status,
          interval_days: replayed.review.intervalDays,
          last_review_at: iso,
          next_review_at: replayed.review.nextReviewAt,
          updated_at: iso,
        },
        { onConflict: "user_id,word_id" },
      );
    }

    // 4. Vérifications réelles.
    const { data: progressRows } = await client
      .from("user_word_progress")
      .select("*")
      .eq("user_id", userId);
    const { data: reviewRows } = await client
      .from("review_items")
      .select("*")
      .eq("user_id", userId);

    check(progressRows?.length === wordIds.length, `user_word_progress : ${progressRows?.length}/${wordIds.length} lignes`);
    check(
      (progressRows?.every((r) => r.status === "familiar" && r.mastery === 50)) ?? false,
      "Chaque mot est familiar (3 corrects) avec maîtrise 50",
    );
    check(
      (reviewRows?.every((r) => r.interval_days === 4)) ?? false,
      `review_items : intervalle 4 jours pour chaque mot (${reviewRows?.[0]?.interval_days})`,
    );

    const { count: dueCount } = await client
      .from("review_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString());
    check(dueCount === 0, `Aucun mot dû immédiatement (échéance demain) — ${dueCount} dû(s)`);

    // 5. Statut de leçon dérivé : basmala complétée, al-hamd disponible.
    const { data: lessons } = await client
      .from("lessons")
      .select("id, slug, unit_id, sort_order")
      .eq("status", "published")
      .order("sort_order");
    const lessonWordMap = new Map<string, string[]>();
    for (const lesson of lessons ?? []) {
      // Mots NOUVEAUX uniquement (is_new=true) : la complétion ne dépend pas
      // des mots de révision (identique à getLessonWordMap).
      const { data: lw } = await client
        .from("lesson_words")
        .select("word_id")
        .eq("lesson_id", lesson.id)
        .eq("is_new", true)
        .order("position");
      lessonWordMap.set(lesson.id, (lw ?? []).map((r) => (r as { word_id: string }).word_id));
    }
    const ordered = (lessons ?? []).map((l) => ({
      id: l.id,
      wordIds: lessonWordMap.get(l.id) ?? [],
    }));
    const progressByWord = new Map<string, { status: string }>();
    for (const r of progressRows ?? []) progressByWord.set(r.word_id, r);

    // Réimplémentation locale du calcul (identique à computeLessonStatuses).
    const statuses = new Map<string, string>();
    let previousCompleted = true;
    for (const lesson of ordered) {
      const rows = lesson.wordIds.map((w) => progressByWord.get(w)).filter(Boolean) as Array<{ status: string }>;
      const completed = lesson.wordIds.length > 0 && rows.length === lesson.wordIds.length && rows.every((r) => r.status === "familiar" || r.status === "mastered");
      statuses.set(lesson.id, completed ? "COMPLETED" : !previousCompleted ? "LOCKED" : rows.some((r) => r.status !== "new") ? "IN_PROGRESS" : "AVAILABLE");
      previousCompleted = completed;
    }

    const basmala = (lessons ?? []).find((l) => l.slug === "basmala");
    const hamd = (lessons ?? []).find((l) => l.slug === "al-hamd");
    if (!basmala || !hamd) throw new Error("Leçons basmala / al-hamd introuvables.");
    check(statuses.get(basmala.id) === "COMPLETED", "Leçon basmala → COMPLETED");
    check(statuses.get(hamd.id) === "AVAILABLE", "Leçon al-hamd → AVAILABLE (déverrouillée)");

    // ---------------------------------------------------------------------
    // Phase 6 — Activité quotidienne (journal insert-only, idempotent)
    // ---------------------------------------------------------------------
    const today = getActivityDate(new Date());

    // Enregistrement d'activité de la lesson (INSERT … ON CONFLICT DO NOTHING).
    await client
      .from("user_activity_lessons")
      .upsert(
        { user_id: userId, activity_date: today, lesson_id: lessonId },
        { onConflict: "user_id,activity_date,lesson_id", ignoreDuplicates: true },
      );
    // Re-soumission (retry après erreur partielle) → aucun doublon.
    await client
      .from("user_activity_lessons")
      .upsert(
        { user_id: userId, activity_date: today, lesson_id: lessonId },
        { onConflict: "user_id,activity_date,lesson_id", ignoreDuplicates: true },
      );

    await client.from("user_activity_words").upsert(
      wordIds.map((wordId) => ({ user_id: userId, activity_date: today, word_id: wordId })),
      { onConflict: "user_id,activity_date,word_id", ignoreDuplicates: true },
    );
    // Re-soumission (même mot le même jour) → aucun doublon.
    await client.from("user_activity_words").upsert(
      wordIds.slice(0, 2).map((wordId) => ({ user_id: userId, activity_date: today, word_id: wordId })),
      { onConflict: "user_id,activity_date,word_id", ignoreDuplicates: true },
    );

    const daily = await getDailyActivity(client, userId, today);
    check(daily.lessonsCompleted === 1, "Activité : 1 lesson complétée aujourd'hui (idempotent)");
    check(
      daily.wordsStudied === wordIds.length,
      `Activité : ${daily.wordsStudied}/${wordIds.length} mots distincts (dédup par jour)`,
    );

    // Objectif quotidien : réglage réel + progression dérivée.
    await client.from("user_settings").upsert(
      {
        user_id: userId,
        daily_goal_type: "words",
        daily_goal_value: wordIds.length,
        onboarded: true,
      },
      { onConflict: "user_id", ignoreDuplicates: false },
    );
    const settings = (await client.from("user_settings").select("*").eq("user_id", userId).maybeSingle()).data;
    const goal = await getDailyGoalProgress(client, userId, settings as never, today);
    check(goal.type === "words" && goal.current === wordIds.length, "Objectif words : progression = mots distincts du jour");
    check(goal.reached === true, `Objectif words atteint (${goal.current} >= ${goal.goalValue})`);

    // Changement de jour : l'activité d'hier ne compte pas pour aujourd'hui.
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yDate = getActivityDate(yesterday);
    await client.from("user_activity_words").upsert(
      { user_id: userId, activity_date: yDate, word_id: wordIds[0]! },
      { onConflict: "user_id,activity_date,word_id", ignoreDuplicates: true },
    );
    const todayAfter = await getDailyActivity(client, userId, today);
    const yesterdayDaily = await getDailyActivity(client, userId, yDate);
    check(
      todayAfter.wordsStudied === wordIds.length && yesterdayDaily.wordsStudied === 1,
      `Changement de jour isolé : aujourd'hui ${todayAfter.wordsStudied} · hier ${yesterdayDaily.wordsStudied}`,
    );

    // Objectif lessons : les reviews ne contribuent pas, seule la lesson compte.
    await client.from("user_settings").upsert(
      {
        user_id: userId,
        daily_goal_type: "lessons",
        daily_goal_value: 1,
        onboarded: true,
      },
      { onConflict: "user_id" },
    );
    const settingsLessons = (await client.from("user_settings").select("*").eq("user_id", userId).maybeSingle()).data;
    const goalLessons = await getDailyGoalProgress(client, userId, settingsLessons as never, today);
    check(
      goalLessons.type === "lessons" && goalLessons.current === 1 && goalLessons.reached,
      "Objectif lessons : 1 lesson complétée → objectif atteint",
    );
  } finally {
    if (userId) {
      const del = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: { apikey: service, Authorization: `Bearer ${service}` },
      });
      console.log(`🧹 utilisateur de test supprimé (status ${del.status})`);
    }
  }

  const failed = checks.filter((c) => !c.ok).length;
  console.log(`\n${checks.length - failed}/${checks.length} vérifications de persistance passées.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
