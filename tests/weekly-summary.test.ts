import { describe, expect, it } from "vitest";
import {
  composeWeeklySummary,
  formatWeeklySummary,
  type DailyActivityPoint,
} from "@/lib/learning/weekly-summary";

function point(date: string, wordsStudied = 0, lessonsCompleted = 0): DailyActivityPoint {
  return { date, wordsStudied, lessonsCompleted };
}

describe("composeWeeklySummary", () => {
  it("retourne 0/0/0 sans aucune activité", () => {
    expect(composeWeeklySummary([])).toEqual({ words: 0, lessons: 0, activeDays: 0 });
    expect(composeWeeklySummary([point("2026-08-13"), point("2026-08-14")])).toEqual({
      words: 0,
      lessons: 0,
      activeDays: 0,
    });
  });

  it("compte une activité de mot", () => {
    expect(composeWeeklySummary([point("2026-08-13", 3)])).toEqual({
      words: 3,
      lessons: 0,
      activeDays: 1,
    });
  });

  it("ne compte un jour actif qu'une seule fois (mots + leçons le même jour)", () => {
    // Les journaux produisent UNE entrée par jour : un jour avec mots ET leçons
    // reste UN seul jour actif.
    expect(composeWeeklySummary([point("2026-08-13", 8, 3)])).toEqual({
      words: 8,
      lessons: 3,
      activeDays: 1,
    });
  });

  it("additionne mots et leçons sur plusieurs jours", () => {
    const days = [
      point("2026-08-11", 2, 1),
      point("2026-08-12", 0, 0),
      point("2026-08-13", 4, 1),
      point("2026-08-14", 6, 1),
    ];
    expect(composeWeeklySummary(days)).toEqual({ words: 12, lessons: 3, activeDays: 3 });
  });

  it("considère une leçon seule comme un jour actif", () => {
    expect(composeWeeklySummary([point("2026-08-13", 0, 1)])).toEqual({
      words: 0,
      lessons: 1,
      activeDays: 1,
    });
  });

  it("gère une semaine partielle (moins de 7 jours disponibles)", () => {
    const days = [point("2026-08-13", 1), point("2026-08-14", 1)];
    expect(composeWeeklySummary(days)).toEqual({ words: 2, lessons: 0, activeDays: 2 });
  });

  it("ignore les jours hors de la fenêtre glissante (seuls les 7 derniers comptent)", () => {
    const days = Array.from({ length: 10 }, (_, i) =>
      point(`2026-08-${String(i + 1).padStart(2, "0")}`, 1),
    );
    // 10 jours, 1 mot chacun : seuls les 7 derniers sont pris en compte.
    expect(composeWeeklySummary(days)).toEqual({ words: 7, lessons: 0, activeDays: 7 });
  });

  it("respecte une fenêtre personnalisée (lastDays)", () => {
    const days = Array.from({ length: 5 }, (_, i) =>
      point(`2026-08-${String(i + 1).padStart(2, "0")}`, 1),
    );
    expect(composeWeeklySummary(days, 3)).toEqual({ words: 3, lessons: 0, activeDays: 3 });
  });
});

describe("formatWeeklySummary", () => {
  it("formate le cas vide au singulier", () => {
    expect(formatWeeklySummary({ words: 0, lessons: 0, activeDays: 0 })).toBe(
      "0 mot · 0 leçon · 0 jour actif",
    );
  });

  it("utilise le pluriel correctement", () => {
    expect(formatWeeklySummary({ words: 12, lessons: 3, activeDays: 4 })).toBe(
      "12 mots · 3 leçons · 4 jours actifs",
    );
  });

  it("utilise le singulier pour les valeurs 1", () => {
    expect(formatWeeklySummary({ words: 1, lessons: 1, activeDays: 1 })).toBe(
      "1 mot · 1 leçon · 1 jour actif",
    );
  });
});
