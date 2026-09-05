import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ArabicKeyboard } from "../components/ui/arabic-keyboard";
import { HikmaExerciseShell } from "../components/learn/exercises/hikma-exercise-shell";

const keyboardMarkup = () =>
  renderToStaticMarkup(
    createElement(ArabicKeyboard, {
      onInsert: () => {},
      onBackspace: () => {},
      onSpace: () => {},
      onClose: () => {},
    }),
  );

describe("Phase 95 — clavier arabe mobile (93-P1-02)", () => {
  it("équilibre les rangées : 6 colonnes mobile, 9 colonnes desktop, aucune queue", () => {
    const html = keyboardMarkup();
    expect(html).toContain("grid grid-cols-6 gap-1.5 sm:hidden");
    expect(html).toContain("hidden grid-cols-9 gap-1.5 sm:grid");
    // 1 groupe + 36 lettres ×2 (mobile/desktop) + 10 diacritiques ×2 + 2 actions + 1 fermeture
    const labels = (html.match(/aria-label="[^"]*"/g) ?? []).length;
    expect(labels).toBe(96);
    // L'ancien layout à queues (grid-cols-7) a disparu.
    expect(html).not.toContain("grid-cols-7");
  });

  it("touches compactes mobile (h-9) / desktop (sm:h-11) et bouton fermer compact", () => {
    const html = keyboardMarkup();
    const keyCount = (html.match(/flex h-9 sm:h-11 select-none/g) ?? []).length;
    expect(keyCount).toBeGreaterThanOrEqual(46); // 36 lettres + diacritiques/actions
    expect(html).toContain("flex size-8 sm:size-9 items-center justify-center rounded-lg");
  });

  it("reste borné : max-h-[46dvh] mobile / sm:max-h-[65dvh] + corps scrollable (la question demeure visible)", () => {
    const html = keyboardMarkup();
    expect(html).toContain("max-h-[46dvh]");
    expect(html).toContain("min-h-0 overflow-y-auto");
  });

  it("respecte la safe-area iOS en pied de clavier", () => {
    const html = keyboardMarkup();
    expect(html).toContain("env(safe-area-inset-bottom)");
  });
});

describe("Phase 95 — barre d'action sticky (93-P1-01)", () => {
  it("rend le CTA principal en barre sticky mobile avec safe-area, statique sur desktop", () => {
    // children est requis par le composant ; les surcharges de createElement
    // de @types/react exigent alors children dans les props (le passage
    // positionnel ne compile pas). Pour un test SSR, c'est la forme la plus
    // simple — la règle stylistique react/no-children-prop est donc désactivée
    // sur cette ligne uniquement.
    const html = renderToStaticMarkup(
      // eslint-disable-next-line react/no-children-prop
      createElement(HikmaExerciseShell, {
        step: 1,
        total: 5,
        skill: "Retrouver le sens",
        primaryAction: createElement("button", null, "Continuer"),
        children: createElement("div", null, "exercice"),
      }),
    );
    expect(html).toContain("sticky bottom-0 z-10");
    expect(html).toContain("env(safe-area-inset-bottom)");
    expect(html).toContain("backdrop-blur-md");
    expect(html).toContain("sm:static");
    expect(html).toContain("Continuer");
  });
});
