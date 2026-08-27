import { describe, expect, it } from "vitest";
import {
  clampInt,
  getBreathingScale,
  getEntranceStyle,
  glintEnvelope,
  glintPosition,
  lightSweepBackgroundPosition,
  lightSweepPosition,
  normalizeMotion,
  normalizeWordHero,
  sweepEnvelope,
  WORD_HERO_DEFAULTS,
} from "../remotion/motion/engine";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import { buildVideoContentFromReveal, toVideoSceneData } from "../lib/content-studio/video/pipeline";
import {
  getEffectiveSceneData,
  hashEffectiveScenes,
  sanitizeEditorScenes,
} from "../lib/content-studio/editor/state";
import type { VideoScene } from "../lib/content-studio/video/types";

const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
const derived = toVideoSceneData(content);

describe("motion engine — configuration par défaut (H1)", () => {
  it("word reçoit le traitement héros par défaut (word-focus + light-sweep, low)", () => {
    const cfg = normalizeMotion(undefined, "word");
    expect(cfg.enter).toBe("word-focus");
    expect(cfg.emphasis).toBe("light-sweep");
    expect(cfg.intensity).toBe("low");
    expect(cfg.enterDuration).toBe(22);
  });

  it("les autres kinds restent discrets (fade-up / fade / scale)", () => {
    expect(normalizeMotion(undefined, "intro").enter).toBe("fade-up");
    expect(normalizeMotion(undefined, "meaning").enter).toBe("fade-up");
    expect(normalizeMotion(undefined, "quran").enter).toBe("fade");
    expect(normalizeMotion(undefined, "explanation").enter).toBe("fade-up");
    expect(normalizeMotion(undefined, "cta").enter).toBe("scale");
    // Seul le mot porte une emphase par défaut.
    expect(normalizeMotion(undefined, "cta").emphasis).toBeNull();
    expect(normalizeMotion(undefined, "word").emphasis).toBe("light-sweep");
  });

  it("les overrides explicites sont respectés et les bornes clampées", () => {
    const cfg = normalizeMotion(
      { enter: "scale", enterDuration: 999, enterDelay: -5, intensity: "medium" },
      "word",
    );
    expect(cfg.enter).toBe("scale");
    expect(cfg.enterDuration).toBe(120); // clamp haut
    expect(cfg.enterDelay).toBe(0); // clamp bas
    expect(cfg.intensity).toBe("medium");
  });

  it("un preset inconnu est ignoré (défaut du kind)", () => {
    const cfg = normalizeMotion({ enter: "explode" as never }, "quran");
    expect(cfg.enter).toBe("fade");
  });
});

describe("motion engine — déterminisme (H1)", () => {
  it("mêmes entrées ⇒ mêmes styles, frames différentes ⇒ valeurs différentes", () => {
    const a = getEntranceStyle("word-focus", 10, { duration: 20 });
    const b = getEntranceStyle("word-focus", 10, { duration: 20 });
    expect(a).toEqual(b);
    const c = getEntranceStyle("word-focus", 12, { duration: 20 });
    expect(a).not.toEqual(c);
  });

  it("entrée bornée : frame 0 ⇒ invisible, fin ⇒ état neutre stable", () => {
    const start = getEntranceStyle("fade-up", 0, { duration: 20 });
    expect(start.opacity).toBe(0);
    const end = getEntranceStyle("fade-up", 40, { duration: 20 });
    expect(end.opacity).toBe(1);
    expect(end.transform).toBe("translateY(0.00px)");
    const later = getEntranceStyle("fade-up", 400, { duration: 20 });
    expect(later).toEqual(end); // clampé — aucune dérive après la fin
  });

  it("le word-focus inclut luminance douce et termine sur l'identité", () => {
    const mid = getEntranceStyle("word-focus", 11, { duration: 22 });
    expect(mid.filter).toContain("brightness(");
    expect(mid.transform).toContain("scale(");
    const end = getEntranceStyle("word-focus", 60, { duration: 22 });
    expect(end.filter).toBe("brightness(1.1400)");
  });

  it("respiration : déterministe, périodique, à peine perceptible", () => {
    const s1 = getBreathingScale(40, { start: 30, period: 100 });
    const s2 = getBreathingScale(40, { start: 30, period: 100 });
    expect(s1).toBe(s2);
    expect(getBreathingScale(20, { start: 30 })).toBe(1); // avant le début
    expect(Math.abs(getBreathingScale(140, { start: 30, period: 100 }) - s1)).toBeLessThan(1e-9); // période
    expect(Math.abs(s1 - 1)).toBeLessThan(0.01); // amplitude ~0.8 %
  });

  it("sweep : progression 0..1, enveloppe nulle hors fenêtre", () => {
    const timing = { start: 26, duration: 24 };
    expect(lightSweepPosition(20, timing)).toBe(0);
    expect(lightSweepPosition(38, timing)).toBe(0.5);
    expect(lightSweepPosition(60, timing)).toBe(1);
    expect(sweepEnvelope(26, timing)).toBe(0); // tout début : fondu
    expect(sweepEnvelope(20, timing)).toBe(0);
    expect(sweepEnvelope(60, timing)).toBe(0);
    expect(sweepEnvelope(36, timing)).toBe(1); // plateau
    expect(lightSweepBackgroundPosition(26, timing)).toContain("% 0%");
  });

  it("glint : position suit le sweep, enveloppe courte", () => {
    const timing = { start: 29, duration: 16 };
    expect(glintPosition(29, timing)).toBe(-20);
    expect(glintPosition(45, timing)).toBe(100);
    expect(glintEnvelope(20, timing)).toBe(0);
    expect(glintEnvelope(34, timing)).toBeGreaterThan(0);
  });

  it("clampInt arrondit et borne", () => {
    expect(clampInt(7.9, 1, 5)).toBe(5);
    expect(clampInt(-3, 0, 300)).toBe(0);
    expect(clampInt(42.9, 1, 120)).toBe(42);
  });
});

describe("motion engine — scènes effectives (H1)", () => {
  it("rétro-compat : editor_state sans motion (ancien format) reste valide", () => {
    const oldState = { scenes: derived.scenes.map((s) => ({ ...s })) };
    const { scenes, hasEdits } = getEffectiveSceneData(content, oldState);
    expect(hasEdits).toBe(true);
    expect(scenes.length).toBe(derived.scenes.length);
    for (const s of scenes) expect(s.motion).toBeUndefined();
  });

  it("la config motion d'une scène éditée est transportée (nettoyée)", () => {
    const edited: VideoScene[] = [
      ...derived.scenes.slice(0, 1),
      {
        ...derived.scenes[1],
        motion: { enter: "word-focus", enterDuration: 30, intensity: "medium" },
      },
      ...derived.scenes.slice(2),
    ];
    const { scenes } = getEffectiveSceneData(content, { scenes: edited });
    const word = scenes.find((s) => s.kind === "word");
    expect(word?.motion?.enter).toBe("word-focus");
    expect(word?.motion?.enterDuration).toBe(30);
    expect(word?.motion?.intensity).toBe("medium");
  });

  it("aucune mutation du contenu source (payload jamais touché)", () => {
    const before = JSON.stringify(content);
    const edited: VideoScene[] = [
      ...derived.scenes.slice(0, 1),
      { ...derived.scenes[1], motion: { enter: "scale" } },
      ...derived.scenes.slice(2),
    ];
    const { scenes } = getEffectiveSceneData(content, { scenes: edited });
    expect(JSON.stringify(content)).toBe(before);
    // Les scènes effectives sont des objets propres, pas des références du payload.
    expect(scenes[0]).not.toBe(derived.scenes[0]);
  });

  it("preview et render partagent la même source (même fonction effective)", () => {
    // getEffectiveSceneData est LA source unique (page + render.ts) : la scène
    // effective obtenue ici est celle que le Player ET renderMedia consomment.
    const { scenes } = getEffectiveSceneData(content, null);
    expect(scenes).toEqual(derived.scenes);
    // Le Word Hero par défaut est présent même sans édits (défauts du kind).
    const word = scenes.find((s) => s.kind === "word");
    expect(normalizeMotion(word?.motion, "word").enter).toBe("word-focus");
  });
});

describe("motion engine — sanitisation + hash (H1)", () => {
  it("sanitise motion : preset inconnu rejeté, durées clampées, inconnu droppé", () => {
    const raw = [
      { kind: "word", durationInFrames: 60, arabic: "يَوْمَ" },
      {
        kind: "cta",
        durationInFrames: 45,
        text: "Apprends un mot coranique à la fois.",
        motion: {
          enter: "explode",
          enterDuration: 99999,
          enterDelay: "x",
          intensity: "HIGH",
          secret: "top-secret",
        },
      },
    ];
    const { scenes, reason } = sanitizeEditorScenes(raw);
    expect(reason).toBeUndefined();
    const cta = scenes?.find((s) => s.kind === "cta");
    // Preset inconnu, intensity invalide et champ parasite DROPPÉS ; seule la
    // durée numérique valide survit (clampée à 120).
    expect(cta?.motion).toEqual({ enterDuration: 120 });
    expect("enter" in (cta?.motion ?? {})).toBe(false);
    expect("intensity" in (cta?.motion ?? {})).toBe(false);
    expect("secret" in (cta?.motion ?? {})).toBe(false);
  });

  it("sanitise motion : config valide conservée avec bornes", () => {
    const raw = [
      {
        kind: "word",
        durationInFrames: 60,
        arabic: "يَوْمَ",
        motion: { enter: "word-focus", enterDuration: 15, emphasis: "light-sweep", emphasisDelay: 40 },
      },
    ];
    const { scenes } = sanitizeEditorScenes(raw);
    expect(scenes?.[0].motion).toEqual({
      enter: "word-focus",
      enterDuration: 15,
      emphasis: "light-sweep",
      emphasisDelay: 40,
    });
  });

  it("hash : identique pour mêmes scènes, différent après modification de motion", () => {
    const base = derived.scenes.map((s) => ({ ...s }));
    const withMotion: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, motion: { enter: "word-focus", enterDuration: 30 } } : s,
    );
    expect(hashEffectiveScenes(base)).toBe(hashEffectiveScenes(base));
    expect(hashEffectiveScenes(base)).not.toBe(hashEffectiveScenes(withMotion));
    // Après passage par le clean (getEffectiveSceneData), l'ordre des clés de
    // motion est normalisé ⇒ même config (ordre différent) ⇒ même hash.
    const a = getEffectiveSceneData(content, { scenes: withMotion }).scenes;
    const reordered: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, motion: { enterDuration: 30, enter: "word-focus" } } : s,
    );
    const b = getEffectiveSceneData(content, { scenes: reordered }).scenes;
    expect(hashEffectiveScenes(a)).toBe(hashEffectiveScenes(b));
  });
});

describe("word hero settings (H2) — defaults et normalisation", () => {
  it("défauts : tout ON, matériau silver, intensités raisonnables", () => {
    const h = normalizeWordHero(undefined);
    expect(h.material).toBe("silver");
    expect(h.mirror.enabled).toBe(true);
    expect(h.mirror.opacity).toBe(0.5);
    expect(h.mirror.blur).toBe(0.8);
    expect(h.lightSweep.enabled).toBe(true);
    expect(h.lightSweep.intensity).toBe(1);
    expect(h.lightSweep.duration).toBe(24);
    expect(h.goldenGlint.enabled).toBe(true);
    expect(h.glow.enabled).toBe(true);
    expect(h.breathing.enabled).toBe(true);
    expect(h.depth.enabled).toBe(true);
    expect(h).toEqual(WORD_HERO_DEFAULTS);
  });

  it("overrides respectés et bornes clampées (aucune valeur instable possible)", () => {
    const h = normalizeWordHero({
      material: "silver",
      mirror: { enabled: true, opacity: 5, blur: -2 },
      lightSweep: { enabled: true, intensity: 3, duration: 200 },
      goldenGlint: { enabled: true, intensity: -1 },
      glow: { enabled: false },
      breathing: { enabled: true, intensity: 0.5 },
      depth: { enabled: true, intensity: 0 },
    });
    expect(h.mirror.opacity).toBe(1);
    expect(h.mirror.blur).toBe(0);
    expect(h.lightSweep.intensity).toBe(1);
    expect(h.lightSweep.duration).toBe(60);
    expect(h.goldenGlint.intensity).toBe(0);
    expect(h.glow.enabled).toBe(false);
    expect(h.breathing.intensity).toBe(0.5);
    expect(h.depth.intensity).toBe(0);
  });

  it("types invalides et champs inconnus ignorés (défauts conservés)", () => {
    const h = normalizeWordHero({
      material: "gold",
      mirror: { enabled: "oui", opacity: "fort", secret: true },
      lightSweep: { enabled: 1 },
    } as never);
    expect(h.material).toBe("silver");
    expect(h.mirror.enabled).toBe(true); // booléen invalide ⇒ défaut
    expect(h.mirror.opacity).toBe(0.5);
    expect(h.lightSweep.enabled).toBe(true);
  });

  it("déterministe : mêmes entrées ⇒ mêmes sorties", () => {
    const input = { mirror: { opacity: 0.5 }, lightSweep: { intensity: 0.8 } };
    expect(normalizeWordHero(input)).toEqual(normalizeWordHero(input));
  });
});

describe("word hero settings (H2) — sanitisation, rétro-compat, hash", () => {
  it("sanitizeEditorScenes transporte un hero valide (clamps appliqués)", () => {
    const raw = [
      {
        kind: "word",
        durationInFrames: 60,
        arabic: "يَوْمَ",
        hero: {
          material: "silver",
          mirror: { enabled: true, opacity: 0.6, blur: 2.5 },
          lightSweep: { enabled: true, intensity: 0.9, duration: 40 },
          goldenGlint: { enabled: false, intensity: 1 },
          glow: { enabled: true, intensity: 0.7 },
          breathing: { enabled: true, intensity: 1 },
          depth: { enabled: false },
          secret: "top-secret",
        },
      },
    ];
    const { scenes } = sanitizeEditorScenes(raw);
    const hero = scenes?.[0].hero;
    expect(hero?.material).toBe("silver");
    expect(hero?.mirror).toEqual({ enabled: true, opacity: 0.6, blur: 2.5 });
    expect(hero?.lightSweep).toEqual({ enabled: true, intensity: 0.9, duration: 40 });
    expect(hero?.goldenGlint).toEqual({ enabled: false, intensity: 1 });
    expect(hero?.glow).toEqual({ enabled: true, intensity: 0.7 });
    expect(hero?.depth).toEqual({ enabled: false });
    expect("secret" in (hero ?? {})).toBe(false);
  });

  it("sanitisation : valeurs hors limites clampées, champ parasite droppé", () => {
    const raw = [
      {
        kind: "word",
        durationInFrames: 60,
        hero: { mirror: { opacity: 42, blur: -9 }, lightSweep: { duration: 5 } },
      },
    ];
    const { scenes } = sanitizeEditorScenes(raw);
    expect(scenes?.[0].hero?.mirror).toEqual({ opacity: 1, blur: 0 });
    expect(scenes?.[0].hero?.lightSweep).toEqual({ duration: 10 });
  });

  it("rétro-compat : scène sans hero ⇒ aucun hero, rendu avec défauts", () => {
    const { scenes } = getEffectiveSceneData(content, {
      scenes: derived.scenes.map((s) => ({ ...s })),
    });
    for (const s of scenes) expect(s.hero).toBeUndefined();
    expect(normalizeWordHero(scenes[1]?.hero).mirror.enabled).toBe(true);
  });

  it("aucune mutation du payload avec hero", () => {
    const before = JSON.stringify(content);
    const edited: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, hero: { mirror: { opacity: 0.4 } } } : s,
    );
    const { scenes } = getEffectiveSceneData(content, { scenes: edited });
    expect(JSON.stringify(content)).toBe(before);
    expect(scenes[1]?.hero?.mirror?.opacity).toBe(0.4);
    expect(scenes[1]).not.toBe(edited[1]);
  });

  it("hash : hero identique ⇒ même hash, toute modification ⇒ hash différent", () => {
    const base = derived.scenes.map((s) => ({ ...s }));
    const withHero: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, hero: { mirror: { opacity: 0.4 } } } : s,
    );
    const heroOff: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, hero: { mirror: { enabled: false } } } : s,
    );
    const sweepStronger: VideoScene[] = derived.scenes.map((s, i) =>
      i === 1 ? { ...s, hero: { lightSweep: { intensity: 0.9 } } } : s,
    );
    expect(hashEffectiveScenes(withHero)).toBe(hashEffectiveScenes(withHero));
    expect(hashEffectiveScenes(base)).not.toBe(hashEffectiveScenes(withHero));
    expect(hashEffectiveScenes(withHero)).not.toBe(hashEffectiveScenes(heroOff));
    expect(hashEffectiveScenes(withHero)).not.toBe(hashEffectiveScenes(sweepStronger));
  });
});
