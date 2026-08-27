// Hikma — Content Studio (UI1) : RÉGRESSION P0 — sécurité rendu / sauvegarde.
//
// Scénario de bug corrigé : bouton « Rendre la vidéo » actif pendant
// saveState === "unsaved" → le serveur rendait l'ANCIEN editor_state (les
// modifications locales n'étaient pas encore persistées). Règle : le rendu ne
// part jamais d'un état serveur obsolète.

import { describe, expect, it, vi } from "vitest";
import {
  saveThenRender,
  shouldSaveBeforeRender,
} from "../lib/content-studio/render-safety";

describe("shouldSaveBeforeRender", () => {
  it("exige une sauvegarde quand des modifications locales ne sont pas enregistrées", () => {
    expect(shouldSaveBeforeRender("unsaved")).toBe(true);
    expect(shouldSaveBeforeRender("failed")).toBe(true);
  });

  it("ne sauvegarde pas avant un rendu quand l'état serveur == état local", () => {
    expect(shouldSaveBeforeRender("saved")).toBe(false);
    expect(shouldSaveBeforeRender("saving")).toBe(false);
  });
});

describe("saveThenRender", () => {
  it("rend directement quand tout est déjà enregistré (saved)", async () => {
    const save = vi.fn(async () => true);
    const render = vi.fn(async () => {});

    const outcome = await saveThenRender({ saveState: "saved", save, render });

    expect(outcome).toBe("rendered");
    expect(save).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("sauvegarde PUIS rend quand des modifications sont non enregistrées (unsaved)", async () => {
    const save = vi.fn(async () => true);
    const render = vi.fn(async () => {});

    const outcome = await saveThenRender({ saveState: "unsaved", save, render });

    expect(outcome).toBe("rendered");
    expect(save).toHaveBeenCalledTimes(1);
    // Le rendu ne démarre qu'APRÈS la sauvegarde réussie.
    expect(render.mock.invocationCallOrder[0]).toBeGreaterThan(
      save.mock.invocationCallOrder[0],
    );
  });

  it("annule le rendu si la sauvegarde échoue (failed → save() false) — JAMAIS de rendu", async () => {
    const save = vi.fn(async () => false);
    const render = vi.fn(async () => {});

    const outcome = await saveThenRender({ saveState: "failed", save, render });

    expect(outcome).toBe("save_failed");
    expect(render).not.toHaveBeenCalled();
  });

  it("retente la sauvegarde puis rend si elle finit par réussir (failed → save() true)", async () => {
    const save = vi.fn(async () => true);
    const render = vi.fn(async () => {});

    const outcome = await saveThenRender({ saveState: "failed", save, render });

    expect(outcome).toBe("rendered");
    expect(save).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("ne sauvegarde pas en double quand une sauvegarde est déjà en vol (saving)", async () => {
    const save = vi.fn(async () => true);
    const render = vi.fn(async () => {});

    const outcome = await saveThenRender({ saveState: "saving", save, render });

    expect(outcome).toBe("rendered");
    expect(save).not.toHaveBeenCalled();
    expect(render).toHaveBeenCalledTimes(1);
  });
});
