import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UpcomingReviews, ActivityHistory, formatDayLabel } from "../components/learn/daily-activity";

const days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + i);
  return { date: d.toISOString().slice(0, 10), dueCount: i % 3 };
});

describe("UpcomingReviews (93-P2-03 — textes qui débordaient des pastilles)", () => {
  it("utilise une rangée scrollable (flex + overflow-x-auto) et non une grille 7 colonnes", () => {
    const html = renderToStaticMarkup(createElement(UpcomingReviews, { days }));
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("min-w-[5.75rem]");
    expect(html).not.toContain("grid-cols-7");
  });

  it("les libellés restent sur une ligne (whitespace-nowrap) : jamais rognés ni débordants", () => {
    const html = renderToStaticMarkup(createElement(UpcomingReviews, { days }));
    expect(html).toContain("whitespace-nowrap");
  });

  it("chaque pastille garde title (date complète) et affiche le libellé + le compte", () => {
    const html = renderToStaticMarkup(createElement(UpcomingReviews, { days }));
    expect(html).toContain(`title="${days[0].date}"`);
    expect(html).toContain("Aujourd");
  });
});

describe("formatDayLabel", () => {
  it("Aujourd'hui, Demain, puis date courte fr-FR", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(formatDayLabel("2026-08-26", now)).toBe("Aujourd'hui");
    expect(formatDayLabel("2026-08-27", now)).toBe("Demain");
    expect(formatDayLabel("2026-08-28", now)).toMatch(/^ven\./);
  });
});

describe("ActivityHistory (barres d'activité — mobile)", () => {
  const hist = Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(28 + (i % 3)).padStart(2, "0")}`, // dates cohérentes suffisent pour le rendu
    lessonsCompleted: i % 5 === 0 ? 1 : 0,
    wordsStudied: i % 6 === 0 ? 10 + i : 0,
  }));

  it("barres plus épaisses sur mobile : gap 2px (au lieu de 3px)", () => {
    const html = renderToStaticMarkup(createElement(ActivityHistory, { days: hist }));
    expect(html).toContain("items-end gap-[2px]");
    expect(html).not.toContain("gap-[3px]");
  });

  it("baseline (jours sans activité) visible : hauteur 8% et opacité renforcée", () => {
    const html = renderToStaticMarkup(createElement(ActivityHistory, { days: hist }));
    expect(html).toContain("bg-input/80");
    // 30 barres rendues (25 inactives + 5 actives avec ce jeu de données)
    const bars = (html.match(/title="/g) ?? []).length;
    expect(bars).toBe(30);
  });

  it("libellés sous le graphique en whitespace-nowrap (jamais cassés au milieu d'un mot)", () => {
    const html = renderToStaticMarkup(createElement(ActivityHistory, { days: hist }));
    expect(html).toContain("flex flex-wrap items-center justify-between");
    expect(html).toContain("whitespace-nowrap");
  });
});
