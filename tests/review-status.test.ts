import { describe, expect, it } from "vitest";
import {
  classifyReviewState,
  formatNextReviewLabel,
} from "@/lib/learning/review-status";

const day = (d: number) => new Date(Date.UTC(2026, 7, 16, 12, 0, 0) + d * 86_400_000);

describe("classifyReviewState — ne confond pas progression et SRS", () => {
  it("utilisateur sans progression → NO_PROGRESS", () => {
    expect(classifyReviewState(0, 0)).toBe("NO_PROGRESS");
  });

  it("progression mais aucun mot dû → UP_TO_DATE", () => {
    expect(classifyReviewState(0, 4)).toBe("UP_TO_DATE");
  });

  it("mots dus → DUE (prioritaire)", () => {
    expect(classifyReviewState(3, 4)).toBe("DUE");
    expect(classifyReviewState(3, 0)).toBe("DUE");
  });
});

describe("formatNextReviewLabel — lecture seule de next_review_at", () => {
  const now = day(0);

  it("prochaine révision demain", () => {
    expect(formatNextReviewLabel(day(1).toISOString(), now)).toBe("demain");
  });

  it("prochaine révision dans 2 jours", () => {
    expect(formatNextReviewLabel(day(2).toISOString(), now)).toBe("dans 2 jours");
  });

  it("prochaine révision dans 3 jours", () => {
    expect(formatNextReviewLabel(day(3).toISOString(), now)).toBe("dans 3 jours");
  });

  it("absence de prochaine date → null (on n'invente rien)", () => {
    expect(formatNextReviewLabel(null, now)).toBeNull();
  });

  it("date invalide → null", () => {
    expect(formatNextReviewLabel("not-a-date", now)).toBeNull();
  });

  it("date passée ou déjà due → null (rien à annoncer)", () => {
    expect(formatNextReviewLabel(day(-1).toISOString(), now)).toBeNull();
    expect(formatNextReviewLabel(now.toISOString(), now)).toBeNull();
  });

  it("est déterministe et ne mute pas la date d'entrée", () => {
    const ref = now.getTime();
    formatNextReviewLabel(day(1).toISOString(), now);
    expect(now.getTime()).toBe(ref);
    expect(formatNextReviewLabel(day(2).toISOString(), now)).toBe(
      formatNextReviewLabel(day(2).toISOString(), now),
    );
  });
});
