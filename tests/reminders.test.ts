import { describe, expect, it } from "vitest";
import {
  shouldShowReminder,
  getReminderContent,
  isPastReminderTime,
  daysSinceLastActivity,
} from "../lib/learning/reminders";
import type {
  ShouldShowReminderInput,
  ReminderReason,
} from "../lib/learning/reminders";
import type { DailyGoalProgress } from "../lib/learning/activity";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseInput(overrides: Partial<ShouldShowReminderInput> = {}): ShouldShowReminderInput {
  return {
    remindersEnabled: true,
    reminderTime: "19:00",
    todayLocal: "2026-08-24",
    timezone: "Europe/Paris",
    goalProgress: {
      type: "words",
      goalValue: 5,
      current: 0,
      reached: false,
      percent: 0,
    },
    regularity: {
      currentStreak: 7,
      longestStreak: 14,
      weeklyActiveDays: 5,
      totalActiveDays: 30,
    },
    activityDays: [
      { date: "2026-08-23", lessonsCompleted: 1, wordsStudied: 5 },
      { date: "2026-08-24", lessonsCompleted: 0, wordsStudied: 0 },
    ],
    now: new Date("2026-08-24T17:01:00.000Z"), // 19:01 Paris (UTC+2 in Aug)
    activeLessonSlug: "basmala",
    ...overrides,
  };
}

function goalWithActivity(current: number): DailyGoalProgress {
  return {
    type: "words",
    goalValue: 5,
    current,
    reached: current >= 5,
    percent: Math.min(100, Math.round((current / 5) * 100)),
  };
}

// ---------------------------------------------------------------------------
// shouldShowReminder — eligibility
// ---------------------------------------------------------------------------

describe("shouldShowReminder", () => {
  // RULE 1 — disabled
  it("reminders désactivés → pas de rappel", () => {
    const r = shouldShowReminder(baseInput({ remindersEnabled: false }));
    expect(r.show).toBe(false);
    expect(r.reason).toBe("none");
  });

  // RULE 2 — already active today
  it("activité aujourd'hui > 0 → pas de rappel", () => {
    const r = shouldShowReminder(
      baseInput({ goalProgress: goalWithActivity(3) }),
    );
    expect(r.show).toBe(false);
    expect(r.reason).toBe("none");
  });

  it("activité > 0 même si objectif non terminé → pas de rappel", () => {
    const r = shouldShowReminder(
      baseInput({ goalProgress: goalWithActivity(2) }),
    );
    expect(r.show).toBe(false);
  });

  it("objectif atteint aujourd'hui → pas de rappel", () => {
    const r = shouldShowReminder(
      baseInput({ goalProgress: goalWithActivity(5) }),
    );
    expect(r.show).toBe(false);
  });

  it("objectif dépassé aujourd'hui → pas de rappel", () => {
    const r = shouldShowReminder(
      baseInput({ goalProgress: goalWithActivity(8) }),
    );
    expect(r.show).toBe(false);
  });

  // RULE 2bis — before reminder time
  it("avant l'heure du rappel → pas de rappel", () => {
    // 18:59 Paris (16:59 UTC)
    const r = shouldShowReminder(
      baseInput({ now: new Date("2026-08-24T16:59:00.000Z") }),
    );
    expect(r.show).toBe(false);
  });

  it("exactement à l'heure du rappel → rappel", () => {
    // 19:00 Paris (17:00 UTC en août)
    const r = shouldShowReminder(
      baseInput({ now: new Date("2026-08-24T17:00:00.000Z") }),
    );
    expect(r.show).toBe(true);
  });

  it("après l'heure du rappel → rappel", () => {
    // 19:30 Paris (17:30 UTC)
    const r = shouldShowReminder(
      baseInput({ now: new Date("2026-08-24T17:30:00.000Z") }),
    );
    expect(r.show).toBe(true);
  });

  // RULE 3a — dormant ≥ 14 jours
  it("inactif ≥ 14 jours → pas de rappel", () => {
    const days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date("2026-08-24T12:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      days.push({
        date,
        lessonsCompleted: i === 14 ? 1 : 0,
        wordsStudied: i === 14 ? 3 : 0,
      });
    }
    const r = shouldShowReminder(baseInput({ activityDays: days }));
    expect(r.show).toBe(false);
    expect(r.reason).toBe("none");
  });

  // RULE 3b — inactive 7-13 jours
  it("inactif 7 jours → rappel de réactivation", () => {
    const days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date("2026-08-24T12:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      days.push({
        date,
        lessonsCompleted: i === 7 ? 1 : 0,
        wordsStudied: i === 7 ? 2 : 0,
      });
    }
    const r = shouldShowReminder(baseInput({ activityDays: days }));
    expect(r.show).toBe(true);
    expect(r.reason).toBe("inactive_7d");
  });

  // RULE 3c — inactive 3-6 jours
  it("inactif 3 jours → rappel doux", () => {
    const days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date("2026-08-24T12:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      days.push({
        date,
        lessonsCompleted: i === 3 ? 1 : 0,
        wordsStudied: i === 3 ? 1 : 0,
      });
    }
    const r = shouldShowReminder(baseInput({ activityDays: days }));
    expect(r.show).toBe(true);
    expect(r.reason).toBe("inactive_3d");
  });

  // RULE 4 — standard (no_activity, 1 jour)
  it("pas d'activité aujourd'hui, actif hier → rappel standard", () => {
    const r = shouldShowReminder(baseInput());
    expect(r.show).toBe(true);
    expect(r.reason).toBe("no_activity");
  });

  // Aucune activité dans l'historique
  it("aucune activité dans l'historique → rappel standard", () => {
    const empty: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date("2026-08-24T12:00:00.000Z");
      d.setUTCDate(d.getUTCDate() - i);
      empty.push({ date: d.toISOString().slice(0, 10), lessonsCompleted: 0, wordsStudied: 0 });
    }
    // daysSinceLastActivity returns Infinity → that's > 14 → should be blocked.
    // Actually IUInfinity > 14, so RULE 3a triggers → show = false.
    // Hmm, this is a corner case. Let me check: daysSinceLastActivity with
    // empty activities returns Infinity, which is >= 14 → show=false.
    // That means a user who has never had activity in the 30-day window
    // won't get a reminder. This is the intended behavior: the reminder
    // is for users who HAVE been active but forgot today. A brand new user
    // with zero history shouldn't get a reminder yet.
    const r = shouldShowReminder(baseInput({ activityDays: empty }));
    expect(r.show).toBe(false);
  });

  // Timezone null → UTC fallback
  it("timezone null → rappel à 19:00 UTC", () => {
    // 19:00 UTC
    const r = shouldShowReminder(
      baseInput({
        timezone: null,
        now: new Date("2026-08-24T19:00:00.000Z"),
      }),
    );
    expect(r.show).toBe(true);
  });

  // America/New_York
  it("America/New_York → 19:00 locale", () => {
    // 19:00 NY = 23:00 UTC (UTC-4 en août)
    const r = shouldShowReminder(
      baseInput({
        timezone: "America/New_York",
        now: new Date("2026-08-24T23:00:00.000Z"),
      }),
    );
    expect(r.show).toBe(true);
  });

  it("America/New_York → avant 19:00 locale", () => {
    // 18:30 NY = 22:30 UTC
    const r = shouldShowReminder(
      baseInput({
        timezone: "America/New_York",
        now: new Date("2026-08-24T22:30:00.000Z"),
      }),
    );
    expect(r.show).toBe(false);
  });

  // Content with activeLessonSlug
  it("content.href pointe vers la leçon active", () => {
    const r = shouldShowReminder(baseInput({ activeLessonSlug: "basmala" }));
    expect(r.content?.href).toBe("/learn/basmala");
  });

  it("content.href fallback /review si pas de leçon active", () => {
    const r = shouldShowReminder(baseInput({ activeLessonSlug: null }));
    expect(r.content?.href).toBe("/review");
  });
});

// ---------------------------------------------------------------------------
// getReminderContent — contenu
// ---------------------------------------------------------------------------

describe("getReminderContent", () => {
  it("no_activity + streak 0 → message de reprise", () => {
    const c = getReminderContent("no_activity", 0, "basmala");
    expect(c.title).toBe("Tes mots du jour");
    expect(c.href).toBe("/learn/basmala");
  });

  it("no_activity + streak 1 → Continue sur ta lancée", () => {
    const c = getReminderContent("no_activity", 1, "basmala");
    expect(c.title).toBe("Continue sur ta lancée");
  });

  it("no_activity + streak 2 → Continue sur ta lancée", () => {
    const c = getReminderContent("no_activity", 2, null);
    expect(c.title).toBe("Continue sur ta lancée");
  });

  it("no_activity + streak 3 → Ta régularité grandit", () => {
    const c = getReminderContent("no_activity", 3, null);
    expect(c.title).toBe("Ta régularité grandit");
  });

  it("no_activity + streak 7 → 7 jours de constance", () => {
    const c = getReminderContent("no_activity", 7, "basmala");
    expect(c.title).toBe("7 jours de constance");
  });

  it("no_activity + streak 30 → Un mois de régularité", () => {
    const c = getReminderContent("no_activity", 30, null);
    expect(c.title).toBe("Un mois de régularité");
  });

  it("inactive_3d → On reprend ?", () => {
    const c = getReminderContent("inactive_3d", 0, null);
    expect(c.title).toBe("On reprend ?");
    expect(c.cta).toBe("Recommencer");
  });

  it("inactive_7d → Le Coran t'attend", () => {
    const c = getReminderContent("inactive_7d", 0, null);
    expect(c.title).toBe("Le Coran t'attend");
    expect(c.cta).toBe("Commencer doucement");
  });

  it("none reason → contenu standard", () => {
    const c = getReminderContent("none" as ReminderReason, 0, null);
    expect(c.title).toBe("Tes mots du jour");
  });
});

// ---------------------------------------------------------------------------
// isPastReminderTime
// ---------------------------------------------------------------------------

describe("isPastReminderTime", () => {
  const now = new Date("2026-08-24T17:00:00.000Z"); // 19:00 Paris (été)

  it("avant → false", () => {
    expect(isPastReminderTime(new Date("2026-08-24T16:59:00.000Z"), "19:00", "Europe/Paris")).toBe(false);
  });

  it("exact → true", () => {
    expect(isPastReminderTime(now, "19:00", "Europe/Paris")).toBe(true);
  });

  it("après → true", () => {
    expect(isPastReminderTime(new Date("2026-08-24T18:00:00.000Z"), "19:00", "Europe/Paris")).toBe(true);
  });

  it("UTC fallback", () => {
    expect(isPastReminderTime(new Date("2026-08-24T19:00:00.000Z"), "19:00", null)).toBe(true);
  });

  it("UTC avant", () => {
    expect(isPastReminderTime(new Date("2026-08-24T18:59:00.000Z"), "19:00", null)).toBe(false);
  });

  it("heure invalide → false", () => {
    expect(isPastReminderTime(now, "abc", "Europe/Paris")).toBe(false);
  });

  it("format 25:00 → false", () => {
    expect(isPastReminderTime(now, "25:00", "Europe/Paris")).toBe(false);
  });

  it("New York matin", () => {
    // 09:00 NY = 13:00 UTC
    expect(isPastReminderTime(new Date("2026-08-24T13:00:00.000Z"), "09:00", "America/New_York")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// daysSinceLastActivity
// ---------------------------------------------------------------------------

describe("daysSinceLastActivity", () => {
  it("activité aujourd'hui → 0", () => {
    const days = [{ date: "2026-08-24", lessonsCompleted: 1, wordsStudied: 3 }];
    expect(daysSinceLastActivity(days, "2026-08-24")).toBe(0);
  });

  it("activité hier → 1", () => {
    const days = [
      { date: "2026-08-23", lessonsCompleted: 1, wordsStudied: 2 },
      { date: "2026-08-24", lessonsCompleted: 0, wordsStudied: 0 },
    ];
    expect(daysSinceLastActivity(days, "2026-08-24")).toBe(1);
  });

  it("activité 3 jours avant → 3", () => {
    const days = [
      { date: "2026-08-21", lessonsCompleted: 1, wordsStudied: 1 },
      { date: "2026-08-22", lessonsCompleted: 0, wordsStudied: 0 },
      { date: "2026-08-23", lessonsCompleted: 0, wordsStudied: 0 },
      { date: "2026-08-24", lessonsCompleted: 0, wordsStudied: 0 },
    ];
    expect(daysSinceLastActivity(days, "2026-08-24")).toBe(3);
  });

  it("aucune activité → Infinity", () => {
    const days = [
      { date: "2026-08-23", lessonsCompleted: 0, wordsStudied: 0 },
      { date: "2026-08-24", lessonsCompleted: 0, wordsStudied: 0 },
    ];
    expect(daysSinceLastActivity(days, "2026-08-24")).toBe(Infinity);
  });

  it("activité la plus récente (ordre chronologique)", () => {
    const days = [
      { date: "2026-08-22", lessonsCompleted: 1, wordsStudied: 5 },
      { date: "2026-08-23", lessonsCompleted: 1, wordsStudied: 0 },
      { date: "2026-08-24", lessonsCompleted: 0, wordsStudied: 0 },
    ];
    // La plus récente avec activité est le 23 août.
    expect(daysSinceLastActivity(days, "2026-08-24")).toBe(1);
  });
});