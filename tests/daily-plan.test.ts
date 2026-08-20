import { describe, expect, it } from "vitest";
import {
  composeDailyPlan,
  getCoachLine,
  type ComposeDailyPlanInput,
  type DailyPlan,
} from "@/lib/learning/daily-plan";
import type { ActivePathSelection } from "@/lib/learning/active-path";
import type { DailyGoalProgress } from "@/lib/learning/activity";
import type { OnboardingProfile } from "@/lib/learning/onboarding";

function selection(over: Partial<ActivePathSelection> = {}): ActivePathSelection {
  return {
    kind: "recommendation",
    surahNumber: 1,
    surahName: "Al-Fātiḥah",
    surahArabic: "الفاتحة",
    lessonSlug: "basmala",
    completedLessons: 0,
    totalLessons: 8,
    ...over,
  };
}

function goal(over: Partial<DailyGoalProgress> = {}): DailyGoalProgress {
  return {
    type: "words",
    goalValue: 5,
    current: 0,
    reached: false,
    percent: 0,
    ...over,
  };
}

function profile(over: Partial<OnboardingProfile> = {}): OnboardingProfile {
  return {
    displayName: null,
    learningGoal: null,
    arabicReadingLevel: null,
    quranFamiliarity: null,
    dailyDuration: null,
    learningPace: null,
    preferredSurahNumber: null,
    ...over,
  };
}

function input(over: Partial<ComposeDailyPlanInput> = {}): ComposeDailyPlanInput {
  return {
    selection: selection(),
    goal: goal(),
    reviewDueCount: 0,
    coveragePercent: 0,
    ...over,
  };
}

describe("composeDailyPlan", () => {
  it("nouvel utilisateur : objectif 0, aucune révision, couverture 0, action disponible", () => {
    const plan = composeDailyPlan(input());
    expect(plan.goal).toMatchObject({ current: 0, target: 5, remaining: 5, completed: false, exceeded: false });
    expect(plan.reviews).toEqual({ dueCount: 0, hasDue: false });
    expect(plan.coverage).toEqual({ percent: 0 });
    expect(plan.action.href).not.toBeNull();
  });

  it("progression en cours : 2/5, action disponible, révisions présentes", () => {
    const plan = composeDailyPlan(
      input({
        selection: selection({ kind: "in_progress", lessonSlug: "surah-103-ayah-2", completedLessons: 1, totalLessons: 3 }),
        goal: goal({ current: 2, percent: 40 }),
        reviewDueCount: 4,
        coveragePercent: 1,
      }),
    );
    expect(plan.action.label).toBe("Continuer");
    expect(plan.action.href).toBe("/learn/surah-103-ayah-2");
    expect(plan.goal).toMatchObject({ current: 2, target: 5, remaining: 3 });
    expect(plan.reviews).toEqual({ dueCount: 4, hasDue: true });
    expect(plan.coverage).toEqual({ percent: 1 });
  });

  it("objectif atteint : 5/5", () => {
    const plan = composeDailyPlan(input({ goal: goal({ current: 5, reached: true, percent: 100 }) }));
    expect(plan.goal.completed).toBe(true);
    expect(plan.goal.exceeded).toBe(false);
    expect(plan.goal.remaining).toBe(0);
  });

  it("objectif dépassé : 7/5 (non plafonné)", () => {
    const plan = composeDailyPlan(input({ goal: goal({ current: 7, reached: true, percent: 100 }) }));
    expect(plan.goal.completed).toBe(true);
    expect(plan.goal.exceeded).toBe(true);
    expect(plan.goal.current).toBe(7);
    expect(plan.goal.target).toBe(5);
  });

  it("révisions zéro : dueCount = 0", () => {
    expect(composeDailyPlan(input({ reviewDueCount: 0 })).reviews).toEqual({ dueCount: 0, hasDue: false });
  });

  it("plusieurs révisions : dueCount > 0", () => {
    expect(composeDailyPlan(input({ reviewDueCount: 6 })).reviews).toEqual({ dueCount: 6, hasDue: true });
  });

  it("couverture simplement propagée", () => {
    expect(composeDailyPlan(input({ coveragePercent: 18 })).coverage.percent).toBe(18);
    expect(composeDailyPlan(input({ coveragePercent: null })).coverage.percent).toBeNull();
  });

  it("aucune action principale (all_done) → plan valide, retombe sur /review", () => {
    const plan = composeDailyPlan(
      input({ selection: selection({ kind: "all_done", lessonSlug: null, surahName: null }) }),
    );
    expect(plan.action.kind).toBe("all_done");
    expect(plan.action.label).toBe("Réviser");
    expect(plan.action.href).toBe("/review");
  });

  it("aucune action principale (none) → état neutre, jamais de href inventé vers une leçon", () => {
    const plan = composeDailyPlan(
      input({ selection: selection({ kind: "none", lessonSlug: null, surahName: null }) }),
    );
    expect(plan.action.kind).toBe("none");
    expect(plan.action.href).toBe("/review"); // route réelle, pas une leçon inventée
  });

  it("l'action dépend UNIQUEMENT de la sélection (aucune préférence en entrée)", () => {
    const base = input({ selection: selection({ kind: "active_session", lessonSlug: "surah-1-ayah-1" }) });
    expect(composeDailyPlan(base).action).toMatchObject({
      kind: "active_session",
      label: "Reprendre",
      href: "/learn/surah-1-ayah-1",
    });
  });
});

describe("getCoachLine", () => {
  function line(over: Partial<ComposeDailyPlanInput> = {}, profileOver: Partial<OnboardingProfile> = {}, firstVisit = false) {
    const plan: DailyPlan = composeDailyPlan(input(over));
    return getCoachLine({ plan, profile: profile(profileOver), firstVisit });
  }

  it("objectif atteint", () => {
    expect(line({ goal: goal({ current: 5, reached: true }) })).toBe(
      "Bravo, ton objectif du jour est atteint.",
    );
  });

  it("objectif dépassé", () => {
    expect(line({ goal: goal({ current: 7, reached: true }) })).toBe(
      "Tu as dépassé ton objectif du jour. 👏",
    );
  });

  it("progression en cours", () => {
    expect(
      line({ selection: selection({ kind: "in_progress", lessonSlug: "x" }) }),
    ).toBe("Continue comme ça, tu avances bien aujourd'hui.");
  });

  it("session active à reprendre", () => {
    expect(
      line({ selection: selection({ kind: "active_session", lessonSlug: "x" }) }),
    ).toBe("Reprends ta leçon, tu avais bien avancé.");
  });

  it("révisions dues (singulier)", () => {
    expect(line({ reviewDueCount: 1 })).toBe("1 mot à réviser t'attend aujourd'hui.");
  });

  it("révisions dues (pluriel)", () => {
    expect(line({ reviewDueCount: 4 })).toBe("4 mots à réviser t'attendent aujourd'hui.");
  });

  it("nouvel utilisateur", () => {
    expect(line({}, {}, true)).toBe("Commence tranquillement avec ta première leçon.");
  });

  it("état neutre (aucun signal particulier)", () => {
    // Pas de progression, pas de révision, pas première visite, pas de préférence tranquille.
    expect(line({ selection: selection({ kind: "recommendation" }), reviewDueCount: 0 })).toBe(
      "Continue ton apprentissage à ton rythme.",
    );
  });

  it("préférence de rythme tranquille disponible → contextualisation", () => {
    expect(
      line(
        { selection: selection({ kind: "recommendation" }), reviewDueCount: 0 },
        { learningPace: "daily_short" },
      ),
    ).toBe("Avance tranquillement, quelques minutes suffisent pour continuer.");
    expect(
      line(
        { selection: selection({ kind: "recommendation" }), reviewDueCount: 0 },
        { dailyDuration: 5 },
      ),
    ).toBe("Avance tranquillement, quelques minutes suffisent pour continuer.");
  });

  it("préférences absentes → pas de branche préférence", () => {
    expect(
      line(
        { selection: selection({ kind: "recommendation" }), reviewDueCount: 0 },
        { learningPace: null, dailyDuration: null },
      ),
    ).toBe("Continue ton apprentissage à ton rythme.");
  });

  it("données incohérentes → retourne toujours une chaîne valide non vide", () => {
    // Combinaisons impossibles : objectif dépassé + première visite + révisions + session.
    const weird: DailyPlan = composeDailyPlan(
      input({
        selection: selection({ kind: "active_session", lessonSlug: "x" }),
        goal: goal({ current: 99, reached: true }),
        reviewDueCount: 3,
        coveragePercent: 42,
      }),
    );
    const result = getCoachLine({ plan: weird, profile: profile(), firstVisit: true });
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);

    // Couverture absente + aucune action + objectif 0 : reste valide.
    const empty: DailyPlan = composeDailyPlan(
      input({
        selection: selection({ kind: "none", lessonSlug: null }),
        goal: goal({ current: 0 }),
        reviewDueCount: 0,
        coveragePercent: null,
      }),
    );
    expect(getCoachLine({ plan: empty, profile: profile(), firstVisit: false }).length).toBeGreaterThan(0);
  });
});
