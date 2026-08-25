import { describe, expect, it } from "vitest";
import {
  computeLearningDays,
  computeCurrentStreak,
  computeLongestStreak,
  computeWeeklyConsistency,
  computeRegularityMetrics,
  computeMonthlyActivity,
  computeMonthGrid,
} from "../lib/learning/regularity";

const TODAY = "2026-08-23";
const YESTERDAY = "2026-08-22";
const TWO_DAYS_AGO = "2026-08-21";
const THREE_DAYS_AGO = "2026-08-20";

// ---------------------------------------------------------------------------
// computeLearningDays — déduplication + tri
// ---------------------------------------------------------------------------

describe("computeLearningDays", () => {
  it("tableau vide → tableau vide", () => {
    expect(computeLearningDays([])).toEqual([]);
  });

  it("une seule date → tableau avec cette date", () => {
    expect(computeLearningDays([TODAY])).toEqual([TODAY]);
  });

  it("déduplique les dates identiques", () => {
    expect(computeLearningDays([TODAY, TODAY, TODAY])).toEqual([TODAY]);
  });

  it("trie les dates non triées", () => {
    expect(computeLearningDays([TODAY, YESTERDAY, TWO_DAYS_AGO])).toEqual([
      TWO_DAYS_AGO,
      YESTERDAY,
      TODAY,
    ]);
  });

  it("gère les doublons ET le désordre", () => {
    expect(
      computeLearningDays([TODAY, YESTERDAY, TODAY, TWO_DAYS_AGO, YESTERDAY]),
    ).toEqual([TWO_DAYS_AGO, YESTERDAY, TODAY]);
  });
});

// ---------------------------------------------------------------------------
// computeCurrentStreak
// ---------------------------------------------------------------------------

describe("computeCurrentStreak", () => {
  it("historique vide → 0", () => {
    expect(computeCurrentStreak([], TODAY)).toBe(0);
  });

  it("aujourd'hui uniquement → 1", () => {
    expect(computeCurrentStreak([TODAY], TODAY)).toBe(1);
  });

  it("aujourd'hui + hier → 2", () => {
    expect(computeCurrentStreak([TODAY, YESTERDAY], TODAY)).toBe(2);
  });

  it("aujourd'hui + hier + avant-hier → 3", () => {
    expect(computeCurrentStreak([TODAY, YESTERDAY, TWO_DAYS_AGO], TODAY)).toBe(3);
  });

  it("trou hier → streak = 1 (seulement aujourd'hui)", () => {
    // Aujourd'hui est actif, hier non → le streak ne remonte pas.
    expect(computeCurrentStreak([TODAY, TWO_DAYS_AGO], TODAY)).toBe(1);
  });

  it("activité uniquement hier, pas aujourd'hui → 0", () => {
    expect(computeCurrentStreak([YESTERDAY], TODAY)).toBe(0);
  });

  it("activité uniquement avant-hier, pas aujourd'hui → 0", () => {
    expect(computeCurrentStreak([TWO_DAYS_AGO], TODAY)).toBe(0);
  });

  it("longue séquence consécutive → streak = longueur", () => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(2026, 7, 23 - i, 12, 0, 0));
      days.push(d.toISOString().slice(0, 10));
    }
    expect(computeCurrentStreak(days, TODAY)).toBe(30);
  });

  it("séquence longue avec trou au milieu → streak = jours après le trou", () => {
    // 2026-08-23, 22, 21 (actifs) — 20 (manquant) — 19, 18 (actifs)
    const days = [TODAY, YESTERDAY, TWO_DAYS_AGO, "2026-08-19", "2026-08-18"];
    expect(computeCurrentStreak(days, TODAY)).toBe(3);
  });

  it("plusieurs activités le même jour → jour compte une seule fois", () => {
    // Simule des doublons (même date plusieurs fois)
    expect(
      computeCurrentStreak(
        [TODAY, TODAY, TODAY, YESTERDAY, YESTERDAY],
        TODAY,
      ),
    ).toBe(2);
  });

  it("dates non triées en entrée → résultat identique", () => {
    expect(
      computeCurrentStreak([YESTERDAY, TODAY, TWO_DAYS_AGO], TODAY),
    ).toBe(3);
  });

  it("activité ancienne uniquement → 0", () => {
    expect(computeCurrentStreak(["2026-08-01"], TODAY)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeLongestStreak
// ---------------------------------------------------------------------------

describe("computeLongestStreak", () => {
  it("historique vide → 0", () => {
    expect(computeLongestStreak([])).toBe(0);
  });

  it("un seul jour → 1", () => {
    expect(computeLongestStreak([TODAY])).toBe(1);
  });

  it("deux jours consécutifs → 2", () => {
    expect(computeLongestStreak([TODAY, YESTERDAY])).toBe(2);
  });

  it("trois jours consécutifs → 3", () => {
    expect(computeLongestStreak([TODAY, YESTERDAY, TWO_DAYS_AGO])).toBe(3);
  });

  it("trou : le plus long streak est le segment le plus long", () => {
    // 23, 22, 21 → 3 jours   / trou / 19, 18, 17 → 3 jours
    const days = [TODAY, YESTERDAY, TWO_DAYS_AGO, "2026-08-19", "2026-08-18", "2026-08-17"];
    expect(computeLongestStreak(days)).toBe(3);
  });

  it("deux séquences de longueur différente → la plus longue", () => {
    // 23, 22 → 2 jours / trou / 20, 19, 18, 17 → 4 jours
    const days = [TODAY, YESTERDAY, THREE_DAYS_AGO, "2026-08-19", "2026-08-18", "2026-08-17"];
    expect(computeLongestStreak(days)).toBe(4);
  });

  it("longest streak ≠ current streak quand le courant est rompu", () => {
    // Longue série ancienne : 01, 02, 03, 04, 05 août → 5 jours
    // Activité récente : 23, 22 → 2 jours (courant) mais longest = 5
    const days = [
      TODAY, YESTERDAY,
      "2026-08-05", "2026-08-04", "2026-08-03", "2026-08-02", "2026-08-01",
    ];
    expect(computeCurrentStreak(days, TODAY)).toBe(2);
    expect(computeLongestStreak(days)).toBe(5);
  });

  it("doublons → aucun impact sur le longest streak", () => {
    expect(
      computeLongestStreak([TODAY, TODAY, YESTERDAY, YESTERDAY]),
    ).toBe(2);
  });

  it("changement de mois : dates consécutives", () => {
    expect(computeLongestStreak(["2026-08-31", "2026-09-01", "2026-09-02"])).toBe(3);
  });

  it("changement d'année : dates consécutives", () => {
    expect(computeLongestStreak(["2025-12-31", "2026-01-01", "2026-01-02"])).toBe(3);
  });

  it("dates non triées en entrée → résultat identique", () => {
    expect(
      computeLongestStreak([YESTERDAY, "2026-08-05", TODAY, "2026-08-04", "2026-08-03"]),
    ).toBe(3); // 03-04-05 août
  });
});

// ---------------------------------------------------------------------------
// computeWeeklyConsistency
// ---------------------------------------------------------------------------

describe("computeWeeklyConsistency", () => {
  it("historique vide → 0/7", () => {
    expect(computeWeeklyConsistency([], TODAY)).toBe(0);
  });

  it("aujourd'hui uniquement → 1/7", () => {
    expect(computeWeeklyConsistency([TODAY], TODAY)).toBe(1);
  });

  it("semaine complète 7/7", () => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(2026, 7, 23 - i, 12, 0, 0));
      days.push(d.toISOString().slice(0, 10));
    }
    expect(computeWeeklyConsistency(days, TODAY)).toBe(7);
  });

  it("semaine partielle 4/7", () => {
    const days = [TODAY, YESTERDAY, "2026-08-20", "2026-08-18"];
    expect(computeWeeklyConsistency(days, TODAY)).toBe(4);
  });

  it("activité hors de la fenêtre de 7 jours → non comptée", () => {
    // 2026-08-15 = il y a 8 jours → hors fenêtre
    const days = [TODAY, "2026-08-15"];
    expect(computeWeeklyConsistency(days, TODAY)).toBe(1);
  });

  it("frontière exacte : aujourd'hui - 6 jours = dans la fenêtre ; -7 jours = hors fenêtre", () => {
    // 2026-08-17 = today - 6 → inclus (7 jours : today..today-6)
    // 2026-08-16 = today - 7 → exclu
    expect(computeWeeklyConsistency(["2026-08-17"], TODAY)).toBe(1);
    expect(computeWeeklyConsistency(["2026-08-16"], TODAY)).toBe(0);
  });

  it("plusieurs activités le même jour → compte une seule fois", () => {
    expect(
      computeWeeklyConsistency([TODAY, TODAY, TODAY, YESTERDAY], TODAY),
    ).toBe(2);
  });

  it("dates non triées → résultat identique", () => {
    expect(
      computeWeeklyConsistency(
        [YESTERDAY, "2026-08-18", TODAY, "2026-08-20"],
        TODAY,
      ),
    ).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// computeRegularityMetrics — agrégation
// ---------------------------------------------------------------------------

describe("computeRegularityMetrics", () => {
  it("historique vide → tout à 0", () => {
    const metrics = computeRegularityMetrics([], TODAY);
    expect(metrics).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      weeklyActiveDays: 0,
      totalActiveDays: 0,
    });
  });

  it("un seul jour → 1 partout", () => {
    const metrics = computeRegularityMetrics([TODAY], TODAY);
    expect(metrics).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      weeklyActiveDays: 1,
      totalActiveDays: 1,
    });
  });

  it("3 jours consécutifs aujourd'hui → streak=3, longest=3, weekly=3, total=3", () => {
    const metrics = computeRegularityMetrics(
      [TODAY, YESTERDAY, TWO_DAYS_AGO],
      TODAY,
    );
    expect(metrics).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      weeklyActiveDays: 3,
      totalActiveDays: 3,
    });
  });

  it("série de 5 jours ancienne + 2 jours récents → current=2, longest=5", () => {
    const days = [
      TODAY, YESTERDAY,
      "2026-08-05", "2026-08-04", "2026-08-03", "2026-08-02", "2026-08-01",
    ];
    const metrics = computeRegularityMetrics(days, TODAY);
    expect(metrics.currentStreak).toBe(2);
    expect(metrics.longestStreak).toBe(5);
    expect(metrics.weeklyActiveDays).toBe(2);
    expect(metrics.totalActiveDays).toBe(7);
  });

  it("activité ancienne uniquement → current=0, longest>0", () => {
    const days = ["2026-08-05", "2026-08-04", "2026-08-03"];
    const metrics = computeRegularityMetrics(days, TODAY);
    expect(metrics.currentStreak).toBe(0);
    expect(metrics.longestStreak).toBe(3);
    expect(metrics.weeklyActiveDays).toBe(0);
    expect(metrics.totalActiveDays).toBe(3);
  });

  it("totalActiveDays correspond au nombre de jours distincts", () => {
    const days = [TODAY, TODAY, YESTERDAY, "2026-08-15", "2026-08-15"];
    const metrics = computeRegularityMetrics(days, TODAY);
    expect(metrics.totalActiveDays).toBe(3); // 3 dates distinctes
  });
});

// ---------------------------------------------------------------------------
// computeMonthlyActivity (Phase 74)
// ---------------------------------------------------------------------------

describe("computeMonthlyActivity", () => {
  it("mois vide → 0 actifs", () => {
    expect(computeMonthlyActivity([], 2026, 8)).toEqual({
      year: 2026, month: 8, activeDays: 0, totalDays: 31,
    });
  });

  it("un jour actif dans le mois", () => {
    expect(computeMonthlyActivity(["2026-08-23"], 2026, 8)).toMatchObject({
      activeDays: 1, totalDays: 31,
    });
  });

  it("plusieurs jours actifs dans le mois", () => {
    const days = ["2026-08-23", "2026-08-22", "2026-08-15", "2026-08-01"];
    expect(computeMonthlyActivity(days, 2026, 8)).toMatchObject({
      activeDays: 4, totalDays: 31,
    });
  });

  it("activité hors mois → non comptée", () => {
    const days = ["2026-07-31", "2026-09-01"]; // juillet et septembre
    expect(computeMonthlyActivity(days, 2026, 8)).toMatchObject({
      activeDays: 0,
    });
  });

  it("février (non bissextile)", () => {
    expect(computeMonthlyActivity([], 2026, 2)).toMatchObject({
      activeDays: 0, totalDays: 28,
    });
  });

  it("février (bissextile)", () => {
    expect(computeMonthlyActivity([], 2024, 2)).toMatchObject({
      activeDays: 0, totalDays: 29,
    });
  });

  it("mois de 30 jours", () => {
    expect(computeMonthlyActivity([], 2026, 9)).toMatchObject({
      activeDays: 0, totalDays: 30,
    });
  });

  it("doublons → aucun impact", () => {
    const days = ["2026-08-23", "2026-08-23", "2026-08-23"];
    expect(computeMonthlyActivity(days, 2026, 8)).toMatchObject({
      activeDays: 1,
    });
  });
});

// ---------------------------------------------------------------------------
// computeMonthGrid (Phase 74)
// ---------------------------------------------------------------------------

describe("computeMonthGrid", () => {
  it("génère une grille avec au moins 4 semaines", () => {
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    expect(grid.weeks.length).toBeGreaterThanOrEqual(4);
    expect(grid.weeks.length).toBeLessThanOrEqual(6);
  });

  it("toutes les semaines ont 7 jours", () => {
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    for (const week of grid.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("août 2026 → 31 jours, nom correct", () => {
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    expect(grid.label).toBe("Août 2026");
    expect(grid.year).toBe(2026);
    expect(grid.month).toBe(8);
    expect(grid.activeDays).toBe(0);
  });

  it("marque les jours actifs", () => {
    const grid = computeMonthGrid(
      ["2026-08-23", "2026-08-22"],
      2026,
      8,
      "2026-08-23",
    );
    expect(grid.activeDays).toBe(2);
    const allDays = grid.weeks.flat();
    const active = allDays.filter((d) => d.active && d.isCurrentMonth);
    expect(active).toHaveLength(2);
  });

  it("marque aujourd'hui", () => {
    const grid = computeMonthGrid(
      ["2026-08-23"],
      2026,
      8,
      "2026-08-23",
    );
    const allDays = grid.weeks.flat();
    const today = allDays.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today?.day).toBe(23);
    expect(today?.active).toBe(true);
  });

  it("marque aujourd'hui même sans activité", () => {
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    const allDays = grid.weeks.flat();
    const today = allDays.find((d) => d.isToday);
    expect(today).toBeDefined();
    expect(today?.day).toBe(23);
    expect(today?.active).toBe(false);
  });

  it("marque les jours futurs", () => {
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    const allDays = grid.weeks.flat();
    const future = allDays.filter((d) => d.isFuture && d.isCurrentMonth);
    // 24–31 août = 8 jours futurs
    expect(future).toHaveLength(8);
    for (const d of future) {
      expect(d.day).toBeGreaterThan(23);
    }
  });

  it("mois sans padding début (commence lundi)", () => {
    // Juillet 2024 commence un lundi
    const grid = computeMonthGrid([], 2024, 7, "2024-07-15");
    const firstWeek = grid.weeks[0];
    const firstDay = firstWeek[0];
    expect(firstDay.day).toBe(1);
    expect(firstDay.isCurrentMonth).toBe(true);
  });

  it("padding du mois précédent", () => {
    // Août 2026 commence un samedi (weekday=5) → 5 jours de padding
    const grid = computeMonthGrid([], 2026, 8, "2026-08-23");
    const firstWeek = grid.weeks[0];
    const paddingDays = firstWeek.filter((d) => !d.isCurrentMonth);
    // Août 2026 commence le samedi → 5 jours de padding (lundi-vendredi)
    expect(paddingDays).toHaveLength(5);
  });

  it("changement d'année : décembre 2025 → janvier 2026", () => {
    const grid = computeMonthGrid(
      ["2025-12-31", "2026-01-01"],
      2026,
      1,
      "2026-01-15",
    );
    // Le 31 décembre 2025 n'est pas dans la grille de janvier
    // Le 1 janvier 2026 est dans la grille
    expect(grid.activeDays).toBe(1);
    const allDays = grid.weeks.flat();
    const jan1 = allDays.find((d) => d.date === "2026-01-01");
    expect(jan1?.active).toBe(true);
  });

  it("février non bissextile → 28 jours", () => {
    const grid = computeMonthGrid([], 2025, 2, "2025-02-10");
    const currentMonthDays = grid.weeks
      .flat()
      .filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(28);
  });

  it("février bissextile → 29 jours", () => {
    const grid = computeMonthGrid([], 2024, 2, "2024-02-10");
    const currentMonthDays = grid.weeks
      .flat()
      .filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(29);
  });

  it("dates non triées → résultat identique", () => {
    const days = ["2026-08-22", "2026-08-23", "2026-08-15"];
    const reversed = ["2026-08-15", "2026-08-23", "2026-08-22"];
    expect(computeMonthGrid(days, 2026, 8, "2026-08-23").activeDays).toBe(
      computeMonthGrid(reversed, 2026, 8, "2026-08-23").activeDays,
    );
  });

  it("doublons → aucun impact", () => {
    const grid = computeMonthGrid(
      ["2026-08-23", "2026-08-23", "2026-08-23"],
      2026,
      8,
      "2026-08-23",
    );
    expect(grid.activeDays).toBe(1);
  });
});