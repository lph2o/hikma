import { describe, expect, it } from "vitest";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import { buildVideoContentFromReveal, toVideoSceneData } from "../lib/content-studio/video/pipeline";
import {
  getEffectiveSceneData,
  resolveEffectiveSceneData,
  sanitizeEditorScenes,
  hashEffectiveScenes,
} from "../lib/content-studio/editor/state";

describe("content-studio editor — résolution de l'état d'édition", () => {
  const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
  const derived = toVideoSceneData(content);

  it("sans editor_state → montage déterministe, hasEdits=false", () => {
    const { scenes, hasEdits } = resolveEffectiveSceneData(content, null);
    expect(hasEdits).toBe(false);
    expect(scenes).toEqual(derived.scenes);
  });

  it("avec editor_state → overrides appliqués, hasEdits=true, source intacte", () => {
    const override = derived.scenes.map((s) => ({
      kind: s.kind,
      durationInFrames: s.durationInFrames + 5,
      ...(s.text !== undefined ? { text: s.text } : {}),
      ...(s.arabic !== undefined ? { arabic: s.arabic } : {}),
    }));
    const { scenes, hasEdits } = resolveEffectiveSceneData(content, { scenes: override });
    expect(hasEdits).toBe(true);
    // La source reste déterministe (le payload n'est jamais muté).
    expect(toVideoSceneData(content).scenes).toEqual(derived.scenes);
    // Durée prolongée.
    expect(scenes[0].durationInFrames).toBe(derived.scenes[0].durationInFrames + 5);
  });

  it("getEffectiveSceneData : même entrée → mêmes scènes effectives (source unique)", () => {
    const a = getEffectiveSceneData(content, null);
    const b = getEffectiveSceneData(content, { scenes: [] });
    expect(a.scenes).toEqual(b.scenes);
    expect(a.hasEdits).toBe(false);
    expect(a.derivedScenes).toEqual(derived.scenes);
  });
});

describe("hashEffectiveScenes — version des scènes (G3/G4)", () => {
  const hashContent = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
  const base = toVideoSceneData(hashContent).scenes;

  it("mêmes scènes → même hash (déterministe)", () => {
    expect(hashEffectiveScenes(base)).toBe(hashEffectiveScenes(base));
  });

  it("scène modifiée (durée) → hash différent", () => {
    const mod = base.map((s) => (s.kind === "intro" ? { ...s, durationInFrames: s.durationInFrames + 1 } : s));
    expect(hashEffectiveScenes(mod)).not.toBe(hashEffectiveScenes(base));
  });

  it("texte modifié → hash différent ; ordre permuté → hash différent", () => {
    const [a, b, ...rest] = base;
    const reordered = [b, a, ...rest];
    expect(hashEffectiveScenes(reordered)).not.toBe(hashEffectiveScenes(base));
    const textChanged = base.map((s, i) => (i === 0 ? { ...s, text: "autre" } : s));
    expect(hashEffectiveScenes(textChanged)).not.toBe(hashEffectiveScenes(base));
  });
});

describe("content-studio editor — sanitisation (défense serveur)", () => {
  const good = [
    { kind: "intro", durationInFrames: 45, text: "hook" },
    { kind: "word", durationInFrames: 60, arabic: "يَوْمَ", transliteration: "yawma" },
  ];

  it("accepte des scènes valides, clamp min 1 frame, épure les champs inconnus", () => {
    const { scenes, reason } = sanitizeEditorScenes(good);
    expect(scenes).not.toBeNull();
    expect(reason).toBeUndefined();
    expect(scenes![0].kind).toBe("intro");
    // champ parasite absent du type → droppé
    const withParasite = sanitizeEditorScenes([
      { kind: "cta", durationInFrames: 0, text: "x", somethingEvil: "drop" },
    ]);
    expect(withParasite.scenes![0].durationInFrames).toBe(1); // clamp
    expect("somethingEvil" in (withParasite.scenes![0] as never)).toBe(false);
  });

  it("rejette un kind inconnu, un non-array, une durée invalide", () => {
    expect(sanitizeEditorScenes([{ kind: "nope", durationInFrames: 10 }]).scenes).toBeNull();
    expect(sanitizeEditorScenes([{ kind: "intro", durationInFrames: "xx" }]).scenes).toBeNull();
    expect(sanitizeEditorScenes({}) .scenes).toBeNull();
    expect(sanitizeEditorScenes([]).scenes).toBeNull();
    expect(sanitizeEditorScenes(null).scenes).toBeNull();
  });
});