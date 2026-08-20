import { describe, expect, it } from "vitest";
import {
  getActivityDate,
  getActivityHistory,
  getDailyActivity,
  getDailyGoalProgress,
  getUpcomingReviewCounts,
  getUserSettings,
  DEFAULT_DAILY_GOAL_TYPE,
  DEFAULT_DAILY_GOAL_VALUE,
} from "../lib/learning/activity";
import type { DailyGoalType } from "../types/learning";

// ---------------------------------------------------------------------------
// Faux client Supabase : builders chaînables ET awaitables (résultats contrôlés)
// ---------------------------------------------------------------------------

type TableResult = {
  count?: number;
  data?: unknown[];
  row?: unknown;
};

function fakeClient(tables: Record<string, TableResult>) {
  const dataFor = (table: string) => tables[table]?.data ?? [];
  const countFor = (table: string) =>
    tables[table]?.count ?? dataFor(table).length;

  const builder = (table: string) => {
    let isHead = false;
    const chain: Record<string, unknown> = {
      eq: () => chain,
      gte: () => chain,
      lte: () => chain,
      order: () => chain,
      limit: () => chain,
      select: (_sel: unknown, opts?: { head?: boolean }) => {
        if (opts?.head) isHead = true;
        return chain;
      },
      maybeSingle: async () => ({
        data: dataFor(table)[0] ?? null,
        error: null,
      }),
    };
    // Awaitable → { count, error } pour head, sinon { data, error }.
    return Object.assign(chain, {
      then: (resolve: (v: unknown) => void) => {
        resolve(
          isHead
            ? { count: countFor(table), error: null }
            : { data: dataFor(table), error: null },
        );
        return undefined;
      },
    }) as unknown as ReturnType<NonNullable<SupabaseClientLike["from"]>>;
  };

  return { from: (table: string) => builder(table) };
}

type SupabaseClientLike = {
  from: (table: string) => unknown;
};

// ---------------------------------------------------------------------------
// getActivityDate — définition unique du jour (UTC, Phase 6)
// ---------------------------------------------------------------------------

describe("getActivityDate (jour UTC unique, sans timezone)", () => {
  it("renvoie YYYY-MM-DD en UTC", () => {
    expect(getActivityDate(new Date("2026-08-13T12:00:00.000Z"))).toBe("2026-08-13");
  });

  it("23:59 UTC appartient au même jour", () => {
    expect(getActivityDate(new Date("2026-08-13T23:59:59.999Z"))).toBe("2026-08-13");
  });

  it("00:00 UTC bascule au jour suivant (changement de jour)", () => {
    expect(getActivityDate(new Date("2026-08-14T00:00:00.000Z"))).toBe("2026-08-14");
  });

  it("le paramètre timeZone ne change PAS le comportement quand il est absent", () => {
    expect(getActivityDate(new Date("2026-08-13T10:00:00.000Z"))).toBe(
      getActivityDate(new Date("2026-08-13T10:00:00.000Z")),
    );
  });
});

// ---------------------------------------------------------------------------
// getDailyGoalProgress — progression dérivée, jamais stockée
// ---------------------------------------------------------------------------

const TODAY = "2026-08-13";

function goalClient(daily: { lessons: number; words: number }, settings?: {
  daily_goal_type: DailyGoalType;
  daily_goal_value: number;
}) {
  const tables: Record<string, TableResult> = {
    user_activity_lessons: {
      data: Array.from({ length: daily.lessons }, (_, i) => ({ id: `l${i}` })),
    },
    user_activity_words: {
      data: Array.from({ length: daily.words }, (_, i) => ({ id: `w${i}` })),
    },
  };
  if (settings) {
    tables.user_settings = { data: [{ user_id: "u1", ...settings, onboarded: true }] };
  }
  return fakeClient(tables);
}

describe("getDailyGoalProgress (dérivé des journaux)", () => {
  it("objectif words : progression = mots distincts du jour", async () => {
    const client = goalClient({ lessons: 0, words: 4 }, { daily_goal_type: "words", daily_goal_value: 5 });
    const goal = await getDailyGoalProgress(client as never, "u1", null, TODAY);
    expect(goal.type).toBe("words");
    expect(goal.current).toBe(4);
    expect(goal.goalValue).toBe(5);
    expect(goal.reached).toBe(false);
    expect(goal.percent).toBe(80);
  });

  it("objectif lessons : progression = lessons complétées (reviews exclues)", async () => {
    const client = goalClient({ lessons: 2, words: 7 });
    const settings = { daily_goal_type: "lessons" as DailyGoalType, daily_goal_value: 2 };
    const goal = await getDailyGoalProgress(client as never, "u1", settings as never, TODAY);
    expect(goal.current).toBe(2);
    expect(goal.reached).toBe(true);
    expect(goal.percent).toBe(100);
  });

  it("dépassement d'objectif autorisé, pourcentage borné à 100", async () => {
    const client = goalClient({ lessons: 0, words: 9 }, { daily_goal_type: "words", daily_goal_value: 5 });
    const goal = await getDailyGoalProgress(client as never, "u1", null, TODAY);
    expect(goal.current).toBe(9);
    expect(goal.reached).toBe(true);
    expect(goal.percent).toBe(100);
  });

  it("sans réglages : défauts (words / 5), progression réelle", async () => {
    const client = goalClient({ lessons: 0, words: 2 });
    const goal = await getDailyGoalProgress(client as never, "u1", null, TODAY);
    expect(goal.type).toBe(DEFAULT_DAILY_GOAL_TYPE);
    expect(goal.goalValue).toBe(DEFAULT_DAILY_GOAL_VALUE);
    expect(goal.current).toBe(2);
  });

  it("aucune activité → 0, non atteint", async () => {
    const client = goalClient({ lessons: 0, words: 0 }, { daily_goal_type: "words", daily_goal_value: 5 });
    const goal = await getDailyGoalProgress(client as never, "u1", null, TODAY);
    expect(goal.current).toBe(0);
    expect(goal.reached).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getUserSettings — ligne absente → null (onboarding)
// ---------------------------------------------------------------------------

describe("getUserSettings", () => {
  it("retourne null sans ligne (nouvel utilisateur → onboarding)", async () => {
    const client = fakeClient({});
    expect(await getUserSettings(client as never, "u1")).toBeNull();
  });

  it("retourne les réglages existants (utilisateur backfillé)", async () => {
    const client = fakeClient({
      user_settings: {
        data: [{ user_id: "u1", daily_goal_type: "words", daily_goal_value: 5, onboarded: true }],
      },
    });
    const s = await getUserSettings(client as never, "u1");
    expect(s?.daily_goal_value).toBe(5);
    expect(s?.onboarded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUpcomingReviewCounts (F5) — lecture seule, jours vides à 0
// ---------------------------------------------------------------------------

describe("getUpcomingReviewCounts (F5)", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  function reviewsAt(dates: string[]) {
    return fakeClient({
      review_items: {
        data: dates.map((next_review_at, i) => ({ id: `r${i}`, next_review_at })),
      },
    });
  }

  it("tous les jours à 0 sans révision", async () => {
    const client = fakeClient({});
    const out = await getUpcomingReviewCounts(client as never, "u1", 7, now);
    expect(out).toHaveLength(7);
    expect(out.every((d) => d.dueCount === 0)).toBe(true);
    expect(out[0].date).toBe("2026-08-13");
    expect(out[6].date).toBe("2026-08-19");
  });

  it("place chaque révision sur son jour", async () => {
    const client = reviewsAt([
      "2026-08-13T08:00:00.000Z",
      "2026-08-13T20:00:00.000Z", // même jour UTC
      "2026-08-15T09:00:00.000Z",
    ]);
    const out = await getUpcomingReviewCounts(client as never, "u1", 7, now);
    expect(out.find((d) => d.date === "2026-08-13")?.dueCount).toBe(2);
    expect(out.find((d) => d.date === "2026-08-15")?.dueCount).toBe(1);
    expect(out.find((d) => d.date === "2026-08-14")?.dueCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getActivityHistory (F4) — 30 jours remplis, jours vides à 0
// ---------------------------------------------------------------------------

describe("getActivityHistory (F4)", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("remplit 30 jours avec 0 par défaut", async () => {
    const client = fakeClient({});
    const history = await getActivityHistory(client as never, "u1", 30, now);
    expect(history.days).toHaveLength(30);
    expect(history.days[0].date).toBe("2026-07-15"); // 30 jours en arrière
    expect(history.days[29].date).toBe("2026-08-13");
    expect(history.wordsStudied).toBe(0);
  });

  it("place les comptes réels sur les bons jours", async () => {
    const client = fakeClient({
      user_activity_words: {
        data: [
          { id: "1", activity_date: "2026-08-13" },
          { id: "2", activity_date: "2026-08-13" },
          { id: "3", activity_date: "2026-08-11" },
        ],
      },
      user_activity_lessons: {
        data: [{ id: "1", activity_date: "2026-08-13" }],
      },
    });
    const history = await getActivityHistory(client as never, "u1", 30, now);
    expect(history.wordsStudied).toBe(3);
    expect(history.lessonsCompleted).toBe(1);
    expect(history.days.find((d) => d.date === "2026-08-13")?.wordsStudied).toBe(2);
    expect(history.days.find((d) => d.date === "2026-08-11")?.wordsStudied).toBe(1);
    expect(history.days.find((d) => d.date === "2026-08-12")?.wordsStudied).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getDailyActivity — comptage des journaux
// ---------------------------------------------------------------------------

describe("getDailyActivity", () => {
  it("compte lessons et mots distincts du jour", async () => {
    const client = fakeClient({
      user_activity_lessons: {
        data: [{ id: "l1" }, { id: "l2" }],
      },
      user_activity_words: {
        data: [{ id: "w1" }, { id: "w2" }, { id: "w3" }],
      },
    });
    const daily = await getDailyActivity(client as never, "u1", TODAY);
    expect(daily.lessonsCompleted).toBe(2);
    expect(daily.wordsStudied).toBe(3);
  });
});
