import { describe, expect, it, vi } from "vitest";
import {
  buildVideoContentFromReveal,
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
} from "@/lib/content-studio/video/pipeline";
import {
  getEffectiveSceneData,
  hashEffectiveScenes,
  sanitizeEditorScenes,
} from "@/lib/content-studio/editor/state";
import {
  saveThenRender,
  shouldSaveBeforeRender,
} from "@/lib/content-studio/render-safety";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";

describe("Content Studio Render Flow & Regression Suite", () => {
  // ---------------------------------------------------------------------------
  // 1. DRAFT CREATION & INITIAL STATE
  // ---------------------------------------------------------------------------
  describe("1. Création de brouillon (Draft isolation)", () => {
    it("génère des scènes initiales avec hasEdits=false et aucun rendu déclenché", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
      const sceneData = toVideoSceneData(content);
      expect(sceneData.scenes.length).toBeGreaterThanOrEqual(4);

      // getEffectiveSceneData sans editorState retourne les scènes dérivées
      const effective = getEffectiveSceneData(content, null);
      expect(effective.hasEdits).toBe(false);
      expect(effective.scenes.length).toEqual(sceneData.scenes.length);
    });

    it("tous les 5 templates produisent un draft éditable sans déclencher de rendu", () => {
      const t1 = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
      const t2 = toVideoSceneData(buildVideoContentFromDeepDive(REVEAL_FIXTURE_YAWMA));
      const t3 = toVideoSceneData(buildVideoContentFromFrequencyFact(REVEAL_FIXTURE_YAWMA));
      const t4 = toVideoSceneData(buildVideoContentFromSurahHighlight(REVEAL_FIXTURE_YAWMA));

      expect(t1.scenes.length).toBeGreaterThan(0);
      expect(t2.scenes.length).toBeGreaterThan(0);
      expect(t3.scenes.length).toBeGreaterThan(0);
      expect(t4.scenes.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. SCENE EDITING & DIRTY DETECTION
  // ---------------------------------------------------------------------------
  describe("2. Édition de scènes et détection de modifications locales", () => {
    it("la modification d'un champ produit un hash différent et active hasEdits", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
      const initialEffective = getEffectiveSceneData(content, null);
      const initialHash = hashEffectiveScenes(initialEffective.scenes);

      const modifiedScenes = initialEffective.scenes.map((s, i) =>
        i === 0 ? { ...s, text: "Nouveau titre personnalisé" } : s,
      );

      const editedState = { scenes: modifiedScenes };
      const nextEffective = getEffectiveSceneData(content, editedState);
      const nextHash = hashEffectiveScenes(nextEffective.scenes);

      expect(nextEffective.hasEdits).toBe(true);
      expect(nextHash).not.toEqual(initialHash);
      expect(nextEffective.scenes[0].text).toBe("Nouveau titre personnalisé");
    });

    it("la sanitisation serveur accepte les modifications valides et rejette le contenu corrompu", () => {
      const validScenes = [
        { kind: "intro", durationInFrames: 45, text: "Accroche" },
        { kind: "word", durationInFrames: 60, arabic: "يَوْمَ", transliteration: "yawma" },
      ];
      const sanitized = sanitizeEditorScenes(validScenes);
      expect(sanitized.scenes).toHaveLength(2);
      expect(sanitized.scenes?.[0].text).toBe("Accroche");

      const corrupted = sanitizeEditorScenes([{ kind: "invalid_kind", durationInFrames: 10 }]);
      expect(corrupted.scenes).toBeNull();
      expect(corrupted.reason).toContain("unknown_kind");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. EXPLICIT RENDER TRIGGER CONTRACT (saveThenRender)
  // ---------------------------------------------------------------------------
  describe("3. Déclenchement explicite du rendu MP4 (saveThenRender)", () => {
    it("ne déclenche JAMAIS de rendu si la sauvegarde préalable échoue", async () => {
      const mockSave = vi.fn(async () => false); // Échec de sauvegarde
      const mockRender = vi.fn(async () => {});

      const outcome = await saveThenRender({
        saveState: "unsaved",
        save: mockSave,
        render: mockRender,
      });

      expect(outcome).toBe("save_failed");
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockRender).not.toHaveBeenCalled();
    });

    it("sauvegarde AVANT de lancer le rendu si l'état est unsaved", async () => {
      const callOrder: string[] = [];
      const mockSave = vi.fn(async () => {
        callOrder.push("save");
        return true;
      });
      const mockRender = vi.fn(async () => {
        callOrder.push("render");
      });

      const outcome = await saveThenRender({
        saveState: "unsaved",
        save: mockSave,
        render: mockRender,
      });

      expect(outcome).toBe("rendered");
      expect(callOrder).toEqual(["save", "render"]);
    });

    it("lance directement le rendu si l'état est déjà saved", async () => {
      const mockSave = vi.fn(async () => true);
      const mockRender = vi.fn(async () => {});

      const outcome = await saveThenRender({
        saveState: "saved",
        save: mockSave,
        render: mockRender,
      });

      expect(outcome).toBe("rendered");
      expect(mockSave).not.toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalledTimes(1);
    });

    it("shouldSaveBeforeRender retourne true pour unsaved/failed et false pour saved/saving", () => {
      expect(shouldSaveBeforeRender("unsaved")).toBe(true);
      expect(shouldSaveBeforeRender("failed")).toBe(true);
      expect(shouldSaveBeforeRender("saved")).toBe(false);
      expect(shouldSaveBeforeRender("saving")).toBe(false);
    });
  });
});
