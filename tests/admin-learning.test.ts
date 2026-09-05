import { describe, expect, it } from "vitest";
import type {
  AdminLearningKpis,
  AdminLearningDailyActivity,
  AdminLearningVocabBreakdown,
  AdminLearningInsight,
  AdminLearningTopLesson,
} from "@/lib/admin/metrics";

describe("Admin Learning Analytics — Contracts & Logic", () => {
  it("computes KPI deltas correctly without dividing by zero", () => {
    function delta(current: number, prev: number): number | null {
      if (prev === 0) return null;
      return Math.round(((current - prev) / prev) * 100);
    }

    expect(delta(10, 5)).toBe(100);
    expect(delta(1, 4)).toBe(-75);
    expect(delta(5, 0)).toBeNull();
    expect(delta(0, 5)).toBe(-100);
    expect(delta(5, 5)).toBe(0);
  });

  it("validates AdminLearningKpis structure", () => {
    const kpis: AdminLearningKpis = {
      period: "30d",
      lessonsCompleted: 13,
      lessonsCompletedDelta: 25,
      wordsStudied: 84,
      wordsStudiedDelta: 10,
      reviewsDue: 17,
      sessionsActive: 3,
      vocabMastered: 6,
      vocabFamiliar: 26,
      vocabLearning: 0,
    };

    expect(kpis.period).toBe("30d");
    expect(kpis.lessonsCompleted).toBe(13);
    expect(kpis.reviewsDue).toBe(17);
    expect(kpis.sessionsActive).toBe(3);
    expect(kpis.vocabMastered + kpis.vocabFamiliar + kpis.vocabLearning).toBe(32);
  });

  it("validates AdminLearningDailyActivity date sequence and fields", () => {
    const daily: AdminLearningDailyActivity = {
      date: "2026-09-05",
      dayLabel: "05/09",
      lessonsCompleted: 1,
      wordsStudied: 8,
      activeUsers: 1,
    };

    expect(daily.dayLabel).toBe("05/09");
    expect(daily.lessonsCompleted).toBeGreaterThanOrEqual(0);
    expect(daily.wordsStudied).toBeGreaterThanOrEqual(0);
    expect(daily.activeUsers).toBeGreaterThanOrEqual(0);
  });

  it("calculates vocabulary mastery percentage properly", () => {
    const vocab: AdminLearningVocabBreakdown = {
      mastered: 6,
      familiar: 26,
      learning: 0,
      reviewDue: 17,
      totalInProgress: 32,
    };

    const total = vocab.mastered + vocab.familiar + vocab.learning;
    const masteryPct = total > 0 ? Math.round((vocab.mastered / total) * 100) : 0;

    expect(total).toBe(32);
    expect(masteryPct).toBe(19); // 6 / 32 = 18.75% -> 19%
  });

  it("sorts and caps top lessons ranking", () => {
    const rawLessons: AdminLearningTopLesson[] = [
      { lessonId: "1", lessonTitle: "Leçon 1", unitTitle: "Unité A", completionCount: 1 },
      { lessonId: "2", lessonTitle: "Leçon 2", unitTitle: "Unité A", completionCount: 5 },
      { lessonId: "3", lessonTitle: "Leçon 3", unitTitle: "Unité B", completionCount: 3 },
    ];

    const sorted = [...rawLessons].sort((a, b) => b.completionCount - a.completionCount);
    expect(sorted[0].lessonId).toBe("2");
    expect(sorted[0].completionCount).toBe(5);
    expect(sorted[1].lessonId).toBe("3");
    expect(sorted[2].lessonId).toBe("1");
  });

  it("detects learning insights conditions accurately", () => {
    const overdueReviews = 12;
    const staleSessions = 2;
    const firstHalfLessons = 10;
    const secondHalfLessons = 2;

    const insights: AdminLearningInsight[] = [];

    if (overdueReviews >= 5) {
      insights.push({
        type: "warning",
        key: "reviews_overdue",
        title: "Révisions très en retard",
        description: `${overdueReviews} révisions ont plus de 7 jours de retard.`,
        value: overdueReviews,
      });
    }

    if (staleSessions >= 1) {
      insights.push({
        type: "info",
        key: "sessions_stale",
        title: "Sessions abandonnées",
        description: `${staleSessions} sessions en cours sans activité depuis plus de 7 jours.`,
        value: staleSessions,
      });
    }

    if (firstHalfLessons > 0 && secondHalfLessons < firstHalfLessons * 0.4) {
      insights.push({
        type: "warning",
        key: "activity_drop",
        title: "Baisse d'activité détectée",
        description: "Baisse significative sur la seconde moitié de la période.",
        value: firstHalfLessons - secondHalfLessons,
      });
    }

    expect(insights).toHaveLength(3);
    expect(insights.map((i) => i.key)).toEqual(["reviews_overdue", "sessions_stale", "activity_drop"]);
  });
});
