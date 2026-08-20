import { describe, expect, it } from "vitest";
import {
  addDays,
  LeitnerScheduler,
  ReviewEngine,
  REVIEW_GRADUATION_DAYS,
  MAX_REVIEW_INTERVAL_DAYS,
} from "../lib/review";
import type { ReviewState } from "../lib/review";

const FIXED_NOW = new Date("2026-08-13T12:00:00.000Z");

describe("LeitnerScheduler", () => {
  const scheduler = new LeitnerScheduler();

  it("premier contact correct → intervalle 1 jour, learning", () => {
    const s = scheduler.schedule(null, true, FIXED_NOW);
    expect(s.intervalDays).toBe(1);
    expect(s.status).toBe("learning");
    expect(s.nextReviewAt).toBe("2026-08-14T12:00:00.000Z");
  });

  it("bonne réponse → intervalle doublé", () => {
    const state: ReviewState = {
      status: "learning",
      intervalDays: 4,
      lastReviewAt: null,
      nextReviewAt: null,
    };
    const s = scheduler.schedule(state, true, FIXED_NOW);
    expect(s.intervalDays).toBe(8);
    expect(s.status).toBe("review"); // ≥ 7 jours → graduated
  });

  it("mauvaise réponse → intervalle 1 jour, relearning après graduation", () => {
    const state: ReviewState = {
      status: "review",
      intervalDays: 8,
      lastReviewAt: null,
      nextReviewAt: null,
    };
    const s = scheduler.schedule(state, false, FIXED_NOW);
    expect(s.intervalDays).toBe(1);
    expect(s.status).toBe("relearning");
  });

  it("mauvaise réponse en cours d'apprentissage → learning", () => {
    const state: ReviewState = {
      status: "learning",
      intervalDays: 2,
      lastReviewAt: null,
      nextReviewAt: null,
    };
    expect(scheduler.schedule(state, false, FIXED_NOW).status).toBe("learning");
  });

  it("respecte le seuil de graduation", () => {
    expect(REVIEW_GRADUATION_DAYS).toBe(7);
  });

  it("borne l'intervalle au plafond documenté (jamais d'année aberrante)", () => {
    // Régression Phase 63A : le doublage sans borne produisait 2²² jours
    // (~4,19 M j ≈ année 13 510) → `+013510-04-02T…Z` rejeté par PostgreSQL.
    let state: ReviewState | null = {
      status: "learning",
      intervalDays: MAX_REVIEW_INTERVAL_DAYS,
      lastReviewAt: null,
      nextReviewAt: null,
    };
    // 10 bonnes réponses supplémentaires à partir du plafond : l'intervalle
    // doit rester exactement au plafond (pas de croissance exponentielle).
    for (let i = 0; i < 10; i += 1) {
      const s = scheduler.schedule(state, true, FIXED_NOW);
      expect(s.intervalDays).toBe(MAX_REVIEW_INTERVAL_DAYS);
      expect(s.nextReviewAt).toBe(
        addDays(FIXED_NOW, MAX_REVIEW_INTERVAL_DAYS).toISOString(),
      );
      state = {
        status: s.status as ReviewState["status"],
        intervalDays: s.intervalDays,
        lastReviewAt: null,
        nextReviewAt: null,
      };
    }
  });

  it("ne produit jamais un next_review_at au-delà de l'horizon maximal", () => {
    // Cas réel Phase 63A : intervalle stocké 2¹⁸ = 262 144 j (valeur observée
    // en base) + bonnes réponses répétées → doit rester borné à now + 365 j.
    const state: ReviewState = {
      status: "review",
      intervalDays: 262144,
      lastReviewAt: null,
      nextReviewAt: null,
    };
    let s = scheduler.schedule(state, true, FIXED_NOW);
    const maxHorizon = FIXED_NOW.getTime() + MAX_REVIEW_INTERVAL_DAYS * 86_400_000;
    for (let i = 0; i < 30; i += 1) {
      s = scheduler.schedule(
        {
          status: s.status as ReviewState["status"],
          intervalDays: s.intervalDays,
          lastReviewAt: null,
          nextReviewAt: null,
        },
        true,
        FIXED_NOW,
      );
      const ms = new Date(s.nextReviewAt).getTime();
      expect(Number.isNaN(ms)).toBe(false);
      expect(ms).toBeLessThanOrEqual(maxHorizon);
      expect(s.nextReviewAt.startsWith("+")).toBe(false); // jamais +013510-…
    }
  });

  it("préserve le doublage pédagogique sous le plafond", () => {
    // La courbe 1 → 2 → 4 → 8 est inchangée tant qu'on reste sous 365 j.
    let interval = 1;
    for (let i = 0; i < 8; i += 1) {
      const state: ReviewState = {
        status: "learning",
        intervalDays: interval,
        lastReviewAt: null,
        nextReviewAt: null,
      };
      const s = scheduler.schedule(state, true, FIXED_NOW);
      interval = s.intervalDays;
    }
    expect(interval).toBe(256); // 1→2→4→8→16→32→64→128→256 (8 doublages)
  });
});

describe("ReviewEngine.getDueItems", () => {
  const engine = new ReviewEngine();
  const word = (id: string, state: ReviewState | null) => ({
    wordId: id,
    arabic: id,
    transliteration: null,
    meaning: null,
    state,
  });

  it("un mot jamais revu est dû", () => {
    const items = [word("w1", null)];
    expect(engine.getDueItems(items, FIXED_NOW).map((i) => i.wordId)).toEqual(["w1"]);
  });

  it("un mot dont l'échéance est dépassée est dû", () => {
    const past = new Date(FIXED_NOW.getTime() - 1000).toISOString();
    const items = [
      word("w1", { status: "learning", intervalDays: 1, lastReviewAt: null, nextReviewAt: past }),
    ];
    expect(engine.getDueItems(items, FIXED_NOW)).toHaveLength(1);
  });

  it("un mot dont l'échéance est future n'est pas dû", () => {
    const future = new Date(FIXED_NOW.getTime() + 86400_000).toISOString();
    const items = [
      word("w1", { status: "review", intervalDays: 8, lastReviewAt: null, nextReviewAt: future }),
    ];
    expect(engine.getDueItems(items, FIXED_NOW)).toHaveLength(0);
  });
});
