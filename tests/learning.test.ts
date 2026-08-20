import { describe, expect, it } from "vitest";
import {
  accuracy,
  applyAnswer,
  defaultMasteryCalculator,
  nextStatus,
  PROGRESS_RULES,
} from "../lib/learning";
import type { ProgressState } from "../lib/learning";

describe("accuracy", () => {
  it("vaut 1 sans réponse (évite la division par zéro)", () => {
    expect(accuracy(0, 0)).toBe(1);
  });
  it("calcule correct / total", () => {
    expect(accuracy(8, 2)).toBe(0.8);
  });
});

describe("defaultMasteryCalculator", () => {
  const base = { correctCount: 0, incorrectCount: 0, intervalDays: 0 };

  it("mappe chaque statut vers un niveau de maîtrise", () => {
    expect(defaultMasteryCalculator.compute({ ...base, status: "new" })).toBe(0);
    expect(defaultMasteryCalculator.compute({ ...base, status: "learning" })).toBe(25);
    expect(
      defaultMasteryCalculator.compute({ ...base, status: "familiar", intervalDays: 6 }),
    ).toBe(50);
    expect(
      defaultMasteryCalculator.compute({ ...base, status: "familiar", intervalDays: 7 }),
    ).toBe(75);
    expect(defaultMasteryCalculator.compute({ ...base, status: "mastered" })).toBe(100);
  });

  it("ne dépend pas du simple ratio correct/total", () => {
    // familiar à long intervalle vaut 75 même avec 0 correct (l'intervalle prime).
    expect(
      defaultMasteryCalculator.compute({
        status: "familiar",
        correctCount: 0,
        incorrectCount: 0,
        intervalDays: 30,
      }),
    ).toBe(75);
  });
});

describe("applyAnswer (transitions de statut)", () => {
  it("premier contact → learning (maîtrise 25)", () => {
    const r = applyAnswer(null, true, 1);
    expect(r.status).toBe("learning");
    expect(r.correctCount).toBe(1);
    expect(r.incorrectCount).toBe(0);
    expect(r.mastery).toBe(25);
    expect(r.statusChanged).toBe(true);
  });

  it("learning → familiar après assez de bonnes réponses", () => {
    let state: ProgressState | null = null;
    // 3 bonnes réponses consécutives (intervalle croissant).
    for (let i = 1; i <= 3; i += 1) {
      state = applyAnswer(state, true, i);
    }
    expect(state?.status).toBe("familiar");
    expect(state?.correctCount).toBe(3);
    expect(state?.mastery).toBe(50);
  });

  it("familiar → mastered seulement avec assez de corrects + précision + intervalle", () => {
    const notYet: ProgressState = {
      status: "familiar",
      correctCount: PROGRESS_RULES.masteredMinCorrect,
      incorrectCount: 0,
      mastery: 50,
      intervalDays: 14,
    };
    const r = applyAnswer(notYet, true, 14);
    expect(r.status).toBe("mastered");
    expect(r.mastery).toBe(100);
  });

  it("ne passe pas mastered si l'intervalle est trop court", () => {
    const short: ProgressState = {
      status: "familiar",
      correctCount: PROGRESS_RULES.masteredMinCorrect,
      incorrectCount: 0,
      mastery: 50,
      intervalDays: 2,
    };
    const r = applyAnswer(short, true, 2);
    expect(r.status).toBe("familiar");
  });

  it("une erreur au stade mastered rétrograde vers familiar", () => {
    const mastered: ProgressState = {
      status: "mastered",
      correctCount: 10,
      incorrectCount: 0,
      mastery: 100,
      intervalDays: 30,
    };
    const r = applyAnswer(mastered, false, 1);
    expect(r.status).toBe("familiar");
    expect(r.incorrectCount).toBe(1);
  });

  it("nextStatus : une précision insuffisante empêche la promotion", () => {
    // 5 corrects mais 5 incorrects → précision 0.5 (familiar), jamais mastered.
    const status = nextStatus("familiar", true, 5, 5, 30);
    expect(status).toBe("familiar");
  });
});
