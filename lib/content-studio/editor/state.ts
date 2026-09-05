// Hikma — Content Studio (Phase F) : RÉSOLUTION DE L'ÉTAT D'ÉDITION.
//
// Fonctions PURES : compte tenu d'un contenu (payload → VideoSceneData dérivé)
// et d'un éventuel editor_state, on calcule le montage EFFECTIF utilisé par la
// preview ET le rendu. Null editor_state ⇒ montage déterministe de la pipeline.
// Chaque scène du montage effectif est un objet propre (jamais la référence du
// payload — l'édition ne mute jamais les données sources).

import { createHash } from "node:crypto";
import { toVideoSceneData } from "@/lib/content-studio/video/pipeline";
import {
  isMotionPreset,
  type SceneMotion,
  type VideoContent,
  type WordHeroSettings,
  type VerseDisplayConfig,
} from "@/lib/content-studio/video/types";
import { sanitizeGraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import {
  createTextGraphicClip,
  sanitizeTextSource,
} from "@/lib/content-studio/graphics/text-graphic";
import { sanitizeShapeClip } from "@/lib/content-studio/graphics/shape-graphic";
import { createThreeGraphicClip } from "@/lib/content-studio/graphics/three-graphic";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import type { VideoEditorState } from "./types";

const clampInt = (v: number, min: number, max: number): number =>
  Math.min(Math.max(Math.trunc(v), min), max);

const clampNum = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

const clamp01 = (v: number): number => clampNum(v, 0, 1);

/**
 * Sanitisation STRICTE de la couche motion (H1) : seuls les presets connus et
 * les bornes numériques légitimes sont admis ; tout le reste est DROPPÉ.
 * Ordre de clés FIXE ⇒ hash stable pour des configurations identiques.
 */
function sanitizeMotion(raw: unknown): SceneMotion | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const m = raw as Record<string, unknown>;
  const out: SceneMotion = {};
  if (typeof m.enter === "string" && isMotionPreset(m.enter)) out.enter = m.enter;
  if (typeof m.enterDuration === "number" && Number.isFinite(m.enterDuration)) {
    out.enterDuration = clampInt(m.enterDuration, 5, 120);
  }
  if (typeof m.enterDelay === "number" && Number.isFinite(m.enterDelay)) {
    out.enterDelay = clampInt(m.enterDelay, 0, 300);
  }
  if (typeof m.emphasis === "string" && isMotionPreset(m.emphasis)) {
    out.emphasis = m.emphasis;
  }
  if (typeof m.emphasisDelay === "number" && Number.isFinite(m.emphasisDelay)) {
    out.emphasisDelay = clampInt(m.emphasisDelay, 0, 600);
  }
  if (m.intensity === "low") out.intensity = "low";
  else if (m.intensity === "medium") out.intensity = "medium";
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Sanitisation STRICTE de la couche Word Hero (H2) : seuls les champs connus et
 * les bornes numériques légitimes sont admis ; tout le reste est DROPPÉ.
 * Ordre de clés FIXE (matériau, miroir, sweep, glint, glow, respiration,
 * profondeur) ⇒ hash stable pour des configurations identiques.
 */
function sanitizeHero(raw: unknown): WordHeroSettings | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const h = raw as Record<string, unknown>;
  const out: WordHeroSettings = {};
  if (h.material === "silver") out.material = "silver";

  if (typeof h.mirror === "object" && h.mirror !== null) {
    const m = h.mirror as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["mirror"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.opacity === "number" && Number.isFinite(m.opacity)) sub.opacity = clamp01(m.opacity);
    if (typeof m.blur === "number" && Number.isFinite(m.blur)) sub.blur = clampNum(m.blur, 0, 6);
    if (Object.keys(sub).length > 0) out.mirror = sub;
  }
  if (typeof h.lightSweep === "object" && h.lightSweep !== null) {
    const m = h.lightSweep as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["lightSweep"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.intensity === "number" && Number.isFinite(m.intensity)) sub.intensity = clamp01(m.intensity);
    if (typeof m.duration === "number" && Number.isFinite(m.duration)) sub.duration = clampInt(m.duration, 10, 60);
    if (Object.keys(sub).length > 0) out.lightSweep = sub;
  }
  if (typeof h.goldenGlint === "object" && h.goldenGlint !== null) {
    const m = h.goldenGlint as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["goldenGlint"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.intensity === "number" && Number.isFinite(m.intensity)) sub.intensity = clamp01(m.intensity);
    if (Object.keys(sub).length > 0) out.goldenGlint = sub;
  }
  if (typeof h.glow === "object" && h.glow !== null) {
    const m = h.glow as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["glow"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.intensity === "number" && Number.isFinite(m.intensity)) sub.intensity = clamp01(m.intensity);
    if (Object.keys(sub).length > 0) out.glow = sub;
  }
  if (typeof h.breathing === "object" && h.breathing !== null) {
    const m = h.breathing as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["breathing"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.intensity === "number" && Number.isFinite(m.intensity)) sub.intensity = clamp01(m.intensity);
    if (Object.keys(sub).length > 0) out.breathing = sub;
  }
  if (typeof h.depth === "object" && h.depth !== null) {
    const m = h.depth as Record<string, unknown>;
    const sub: NonNullable<WordHeroSettings["depth"]> = {};
    if (typeof m.enabled === "boolean") sub.enabled = m.enabled;
    if (typeof m.intensity === "number" && Number.isFinite(m.intensity)) sub.intensity = clamp01(m.intensity);
    if (Object.keys(sub).length > 0) out.depth = sub;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const ALLOWED_VERSE_MODES = new Set([
  "standard",
  "large",
  "highlight-word",
  "line-by-line",
  "progressive",
  "word-focus",
]);

const ALLOWED_HIGHLIGHT_STYLES = new Set([
  "color",
  "background",
  "underline",
  "glow",
  "scale",
]);

const ALLOWED_FOLLOWER_STYLES = new Set([
  "gold-highlight",
  "gold-glow",
  "gold-underline",
  "gold-background",
  "gold-sweep",
  "gold-scale",
]);

function sanitizeVerseConfig(raw: unknown): VerseDisplayConfig | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const v = raw as Record<string, unknown>;
  const out: VerseDisplayConfig = {};

  if (typeof v.mode === "string" && ALLOWED_VERSE_MODES.has(v.mode)) {
    out.mode = v.mode as VerseDisplayConfig["mode"];
  }
  if (typeof v.showTranslation === "boolean") {
    out.showTranslation = v.showTranslation;
  }
  if (typeof v.translation === "object" && v.translation !== null) {
    const t = v.translation as Record<string, unknown>;
    const trans: NonNullable<VerseDisplayConfig["translation"]> = {};
    if (typeof t.text === "string") trans.text = t.text;
    if (t.language === "fr" || t.language === "en" || t.language === "it") {
      trans.language = t.language;
    }
    if (typeof t.sourceName === "string") trans.sourceName = t.sourceName;
    if (t.position === "below" || t.position === "card" || t.position === "separate") {
      trans.position = t.position;
    }
    if (typeof t.fontSize === "number" && Number.isFinite(t.fontSize)) {
      trans.fontSize = clampInt(t.fontSize, 18, 60);
    }
    if (typeof t.opacity === "number" && Number.isFinite(t.opacity)) {
      trans.opacity = clamp01(t.opacity);
    }
    if (Object.keys(trans).length > 0) out.translation = trans;
  }
  if (typeof v.typography === "object" && v.typography !== null) {
    const tp = v.typography as Record<string, unknown>;
    const typo: NonNullable<VerseDisplayConfig["typography"]> = {};
    if (typeof tp.fontSize === "number" && Number.isFinite(tp.fontSize)) {
      typo.fontSize = clampInt(tp.fontSize, 36, 120);
    }
    if (typeof tp.lineHeight === "number" && Number.isFinite(tp.lineHeight)) {
      typo.lineHeight = clampNum(tp.lineHeight, 1.2, 3.0);
    }
    if (tp.alignment === "center" || tp.alignment === "right") {
      typo.alignment = tp.alignment;
    }
    if (Object.keys(typo).length > 0) out.typography = typo;
  }
  if (typeof v.highlight === "object" && v.highlight !== null) {
    const hl = v.highlight as Record<string, unknown>;
    const high: NonNullable<VerseDisplayConfig["highlight"]> = {};
    if (typeof hl.wordArabic === "string") high.wordArabic = hl.wordArabic;
    if (typeof hl.style === "string" && ALLOWED_HIGHLIGHT_STYLES.has(hl.style)) {
      high.style = hl.style as NonNullable<VerseDisplayConfig["highlight"]>["style"];
    }
    if (Object.keys(high).length > 0) out.highlight = high;
  }
  if (typeof v.follower === "object" && v.follower !== null) {
    const f = v.follower as Record<string, unknown>;
    const foll: NonNullable<VerseDisplayConfig["follower"]> = {};
    if (typeof f.enabled === "boolean") foll.enabled = f.enabled;
    if (typeof f.style === "string" && ALLOWED_FOLLOWER_STYLES.has(f.style)) {
      foll.style = f.style as NonNullable<VerseDisplayConfig["follower"]>["style"];
    }
    if (typeof f.intensity === "number" && Number.isFinite(f.intensity)) {
      foll.intensity = clamp01(f.intensity);
    }
    if (typeof f.glow === "number" && Number.isFinite(f.glow)) {
      foll.glow = clamp01(f.glow);
    }
    if (typeof f.transition === "number" && Number.isFinite(f.transition)) {
      foll.transition = clampInt(f.transition, 0, 30);
    }
    if (Array.isArray(f.words)) {
      foll.words = f.words
        .filter((w): w is Record<string, unknown> => typeof w === "object" && w !== null)
        .map((w) => ({
          wordId: typeof w.wordId === "string" ? w.wordId : undefined,
          arabic: typeof w.arabic === "string" ? w.arabic : "",
          startFrame: Math.max(0, Math.trunc(Number(w.startFrame) || 0)),
          endFrame: Math.max(1, Math.trunc(Number(w.endFrame) || 1)),
        }));
    }
    if (Object.keys(foll).length > 0) out.follower = foll;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

const ALLOWED_KINDS = new Set([
  "intro",
  "word",
  "meaning",
  "quran",
  "explanation",
  "cta",
]);

/**
 * Sanitisation STRICTE des scènes éditées (défense côté serveur).
 * N'admet que les kind connus, clamp min 1 frame, garde uniquement les champs
 * de montage légitimes ; toute donnée inconnue (entre autres des secrets ou
 * champs parasites) est DROPPÉE. Utilisée par la Server Action avant écriture.
 */
export function sanitizeEditorScenes(
  raw: unknown,
): { scenes: VideoEditorState["scenes"] | null; reason?: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { scenes: null, reason: "empty_or_not_array" };
  }
  const scenes: VideoEditorState["scenes"] = [];
  for (const rawScene of raw) {
    if (typeof rawScene !== "object" || rawScene === null) {
      return { scenes: null, reason: "invalid_scene" };
    }
    const s = rawScene as Record<string, unknown>;
    if (typeof s.kind !== "string" || !ALLOWED_KINDS.has(s.kind)) {
      return { scenes: null, reason: "unknown_kind:" + String(s.kind) };
    }
    const dur = Math.max(Math.trunc(Number(s.durationInFrames)), 1);
    if (!Number.isFinite(dur)) return { scenes: null, reason: "invalid_duration" };
    const scene: VideoEditorState["scenes"][number] = {
      kind: s.kind as VideoEditorState["scenes"][number]["kind"],
      durationInFrames: dur,
    };
    if (typeof s.title === "string" && s.title) scene.title = s.title;
    if (typeof s.arabic === "string" && s.arabic) scene.arabic = s.arabic;
    if (typeof s.transliteration === "string") {
      scene.transliteration = s.transliteration;
    } else if (s.transliteration === null) {
      scene.transliteration = null;
    }
    if (typeof s.text === "string" && s.text) scene.text = s.text;
    if (typeof s.subtext === "string" && s.subtext) {
      scene.subtext = s.subtext;
    } else if (s.subtext === null) {
      scene.subtext = null;
    }
    if (typeof s.audioUrl === "string" && s.audioUrl) {
      scene.audioUrl = s.audioUrl;
    } else if (s.audioUrl === null) {
      scene.audioUrl = null;
    }
    if (typeof s.audioDuration === "number" && Number.isFinite(s.audioDuration)) {
      scene.audioDuration = s.audioDuration;
    } else if (s.audioDuration === null) {
      scene.audioDuration = null;
    }
    if (typeof s.audioVolume === "number" && Number.isFinite(s.audioVolume)) {
      scene.audioVolume = clamp01(s.audioVolume);
    }
    if (typeof s.audioMuted === "boolean") {
      scene.audioMuted = s.audioMuted;
    }
    if (typeof s.audioFadeIn === "number" && Number.isFinite(s.audioFadeIn)) {
      scene.audioFadeIn = Math.max(0, Math.trunc(s.audioFadeIn));
    }
    if (typeof s.audioFadeOut === "number" && Number.isFinite(s.audioFadeOut)) {
      scene.audioFadeOut = Math.max(0, Math.trunc(s.audioFadeOut));
    }
    if (typeof s.audioStartFrom === "number" && Number.isFinite(s.audioStartFrom)) {
      scene.audioStartFrom = Math.max(0, Math.trunc(s.audioStartFrom));
    }
    const motion = sanitizeMotion(s.motion);
    if (motion) scene.motion = motion;
    const hero = sanitizeHero(s.hero);
    if (hero) scene.hero = hero;
    const verseConfig = sanitizeVerseConfig(s.verseConfig);
    if (verseConfig) scene.verseConfig = verseConfig;
    scenes.push(scene);
  }
  return { scenes };
}

/**
 * Scène ÉPURÉE : ne conserve QUE les champs de montage légitimes d'une
 * VideoScene, avec valeurs normalisées (durée ≥ 1 frame, nullables propres).
 * Toute donnée parasite (potentiellement des secrets) est DROPPÉE.
 */
function cleanScene(s: VideoSceneInput): VideoEditorState["scenes"][number] {
  const scene: VideoEditorState["scenes"][number] = {
    kind: s.kind,
    durationInFrames: Math.max(Math.trunc(s.durationInFrames), 1),
  };
  if (s.title !== undefined) scene.title = s.title;
  if (s.arabic !== undefined) scene.arabic = s.arabic;
  if (s.transliteration !== undefined) {
    scene.transliteration = s.transliteration ?? null;
  }
  if (s.text !== undefined) scene.text = s.text;
  if (s.subtext !== undefined) scene.subtext = s.subtext ?? null;
  if (s.audioUrl !== undefined) scene.audioUrl = s.audioUrl ?? null;
  if (s.audioDuration !== undefined) scene.audioDuration = s.audioDuration ?? null;
  if (typeof s.audioVolume === "number" && Number.isFinite(s.audioVolume)) {
    scene.audioVolume = clamp01(s.audioVolume);
  }
  if (typeof s.audioMuted === "boolean") {
    scene.audioMuted = s.audioMuted;
  }
  if (typeof s.audioFadeIn === "number" && Number.isFinite(s.audioFadeIn)) {
    scene.audioFadeIn = Math.max(0, Math.trunc(s.audioFadeIn));
  }
  if (typeof s.audioFadeOut === "number" && Number.isFinite(s.audioFadeOut)) {
    scene.audioFadeOut = Math.max(0, Math.trunc(s.audioFadeOut));
  }
  if (typeof s.audioStartFrom === "number" && Number.isFinite(s.audioStartFrom)) {
    scene.audioStartFrom = Math.max(0, Math.trunc(s.audioStartFrom));
  }
  const motion = sanitizeMotion(s.motion);
  if (motion) scene.motion = motion;
  const hero = sanitizeHero(s.hero);
  if (hero) scene.hero = hero;
  const verseConfig = sanitizeVerseConfig(s.verseConfig);
  if (verseConfig) scene.verseConfig = verseConfig;
  return scene;
}

/** Type minimal de scène accepté (module-pure, aucune importation React). */
interface VideoSceneInput {
  kind: VideoEditorState["scenes"][number]["kind"];
  durationInFrames: number;
  title?: string | undefined;
  arabic?: string | undefined;
  transliteration?: string | null | undefined;
  text?: string | undefined;
  subtext?: string | null | undefined;
  audioUrl?: string | null | undefined;
  audioDuration?: number | null | undefined;
  audioVolume?: number | undefined;
  audioMuted?: boolean | undefined;
  audioFadeIn?: number | undefined;
  audioFadeOut?: number | undefined;
  audioStartFrom?: number | undefined;
  motion?: SceneMotion | undefined;
  hero?: WordHeroSettings | undefined;
  verseConfig?: VerseDisplayConfig | undefined;
}

/**
 * Montage EFFECTIF (source de vérité unique) d'un contenu : scènes dérivées du
 * payload, surchargées par editor_state.scenes s'il est présent ET non vide.
 * Utilisé par Preview, Timeline, Inspector ET Render (aucune logique divergente).
 */
export function getEffectiveSceneData(
  content: VideoContent,
  editorState: VideoEditorState | null | undefined,
): { scenes: VideoEditorState["scenes"]; derivedScenes: VideoEditorState["scenes"]; hasEdits: boolean } {
  const derivedScenes = toVideoSceneData(content).scenes;
  if (editorState && Array.isArray(editorState.scenes) && editorState.scenes.length > 0) {
    const clean = editorState.scenes.map((s, i) => {
      const cleaned = cleanScene(s);

      // Correspondance robuste avec la scène dérivée (même kind à l'index courant ou première occurrence du kind)
      const matchingDerived =
        derivedScenes[i]?.kind === s.kind
          ? derivedScenes[i]
          : derivedScenes.find((d) => d.kind === s.kind);

      if (matchingDerived) {
        // Rafraîchir l'URL audio depuis la source dérivée officielle (évite les URLs signées expirées et les mauvais ponts audio)
        if (!cleaned.audioUrl || cleaned.audioUrl === "") {
          cleaned.audioUrl = matchingDerived.audioUrl ?? null;
        } else if (matchingDerived.audioUrl && (s.kind === "word" || s.kind === "quran")) {
          cleaned.audioUrl = matchingDerived.audioUrl;
        }

        if (cleaned.audioDuration == null && matchingDerived.audioDuration != null) {
          cleaned.audioDuration = matchingDerived.audioDuration;
        } else if (matchingDerived.audioDuration != null && (s.kind === "word" || s.kind === "quran")) {
          cleaned.audioDuration = matchingDerived.audioDuration;
        }

        // Si la durée de la scène Coran était le fallback par défaut (90 frames / 3s)
        // ou inférieure à l'audio réel du verset, aligner exactement sur la durée de récitation
        if (
          s.kind === "quran" &&
          typeof matchingDerived.audioDuration === "number" &&
          matchingDerived.audioDuration > 0
        ) {
          const exactAudioFrames = Math.max(1, Math.round(matchingDerived.audioDuration * 30));
          if (cleaned.durationInFrames === 90 || cleaned.durationInFrames < exactAudioFrames) {
            cleaned.durationInFrames = exactAudioFrames;
          }
        }
      }

      return cleaned;
    });
    return { scenes: clean, derivedScenes, hasEdits: true };
  }
  return { scenes: derivedScenes, derivedScenes, hasEdits: false };
}

/** Alias retrocompatible Phase F. */
export function resolveEffectiveSceneData(
  content: VideoContent,
  editorState: VideoEditorState | null | undefined,
): { scenes: VideoEditorState["scenes"]; hasEdits: boolean } {
  const { scenes, hasEdits } = getEffectiveSceneData(content, editorState);
  return { scenes, hasEdits };
}

/**
 * Hash STABLE des scènes effectives — base de l'invalidation de rendu.
 * Les overrides d'édition produisent un hash différent de la version dérivée ;
 * après un rendu, on compare effectiveHash vs renderedHash pour décider si le
 * MP4 stocké correspond encore au montage courant.
 */
export function hashEffectiveScenes(scenes: readonly VideoSceneInput[]): string {
  const serialized = scenes.map((s) =>
    JSON.stringify([
      s.kind,
      s.durationInFrames,
      s.title ?? "",
      s.arabic ?? "",
      s.transliteration ?? "",
      s.text ?? "",
      s.subtext ?? "",
      s.motion ?? null,
      s.hero ?? null,
      s.verseConfig ?? null,
    ]),
  );
  return createHash("sha256").update(serialized.join("\n")).digest("hex");
}

// ---------------------------------------------------------------------------
// CLIPS GRAPHIQUES (LOT 1) — couche additive, rétro-compatible.
// Les clips graphiques (texte/forme/SVG/sticker/background/3D) sont stockés
// dans editor_state.graphics et RENDUS par la même composition (Preview == Render).
// Sanitization STRICTE (jamais NaN/Infinity, bornes sûres), hash stable.
// ---------------------------------------------------------------------------

/**
 * Sanitisation STRICTE de la collection graphics (défense serveur).
 * Chaque clip est re-sanitisé (base + kind) ; les clips invalides sont DROPPÉS.
 */
export function sanitizeEditorGraphics(
  raw: unknown,
): { graphics: GraphicClipBase[] | null; reason?: string } {
  if (!Array.isArray(raw)) {
    return { graphics: null, reason: "not_array" };
  }
  if (raw.length === 0) return { graphics: [] };

  const graphics: GraphicClipBase[] = [];
  for (const rawClip of raw) {
    if (typeof rawClip !== "object" || rawClip === null) {
      return { graphics: null, reason: "invalid_clip" };
    }
    const c = rawClip as Record<string, unknown>;
    const kind = c.kind;
    if (kind === "text") {
      const clip = createTextGraphicClip({
        id: typeof c.id === "string" ? c.id : undefined,
        startFrame: typeof c.startFrame === "number" ? c.startFrame : undefined,
        durationInFrames:
          typeof c.durationInFrames === "number" ? c.durationInFrames : undefined,
        zIndex: typeof c.zIndex === "number" ? c.zIndex : undefined,
        transform:
          typeof c.transform === "object" && c.transform !== null
            ? (c.transform as Record<string, unknown>)
            : undefined,
        keyframes: Array.isArray(c.keyframes) ? (c.keyframes as never) : undefined,
        text: typeof c.text === "string" ? c.text : "",
        style:
          typeof c.style === "object" && c.style !== null
            ? (c.style as Record<string, unknown>)
            : undefined,
        animation:
          typeof c.animation === "object" && c.animation !== null
            ? (c.animation as never)
            : undefined,
        direction: c.direction === "rtl" ? "rtl" : "ltr",
        source: sanitizeTextSource(c.source),
      });
      graphics.push(clip);
    } else if (kind === "shape") {
      // Forme : payload détaillé sanitisé (forme/fill/stroke/épaisseur).
      graphics.push(sanitizeShapeClip(c));
    } else if (kind === "three") {
      // Clip 3D : payload détaillé sanitisé (géométrie/matériau/lumières/
      // caméra) — jamais NaN/Infinity, bornes sûres, rétrocompatible.
      graphics.push(
        createThreeGraphicClip({
          id: typeof c.id === "string" ? c.id : undefined,
          startFrame: typeof c.startFrame === "number" ? c.startFrame : undefined,
          durationInFrames:
            typeof c.durationInFrames === "number" ? c.durationInFrames : undefined,
          zIndex: typeof c.zIndex === "number" ? c.zIndex : undefined,
          transform:
            typeof c.transform === "object" && c.transform !== null
              ? (c.transform as Record<string, unknown>)
              : undefined,
          keyframes: Array.isArray(c.keyframes) ? (c.keyframes as never) : undefined,
          geometry:
            typeof c.geometry === "object" && c.geometry !== null
              ? (c.geometry as Record<string, unknown>)
              : undefined,
          material:
            typeof c.material === "object" && c.material !== null
              ? (c.material as Record<string, unknown>)
              : undefined,
          lighting:
            typeof c.lighting === "object" && c.lighting !== null
              ? (c.lighting as Record<string, unknown>)
              : undefined,
          camera:
            typeof c.camera === "object" && c.camera !== null
              ? (c.camera as Record<string, unknown>)
              : undefined,
        }),
      );
    } else if (GRAPHIC_KINDS.has(kind as string)) {
      // SVG/stickers/backgrounds/3D : base sanitisée (payload détaillé ajouté
      // par leurs modules respectifs dans les lots suivants).
      const base = sanitizeGraphicClipBase({
        kind: kind as GraphicClipBase["kind"],
        id: typeof c.id === "string" ? c.id : undefined,
        startFrame: typeof c.startFrame === "number" ? c.startFrame : undefined,
        durationInFrames:
          typeof c.durationInFrames === "number" ? c.durationInFrames : undefined,
        zIndex: typeof c.zIndex === "number" ? c.zIndex : undefined,
        transform:
          typeof c.transform === "object" && c.transform !== null
            ? (c.transform as Record<string, unknown>)
            : undefined,
        keyframes: Array.isArray(c.keyframes) ? (c.keyframes as never) : undefined,
      });
      graphics.push({ ...base, kind: kind as GraphicClipBase["kind"] });
    } else {
      // kind inconnu → REJET global : un clip corrompu ne doit jamais effacer
      // silencieusement toute la collection graphique à la sauvegarde.
      return { graphics: null, reason: "unknown_kind:" + String(kind) };
    }
  }
  return { graphics };
}

const GRAPHIC_KINDS = new Set<string>([
  "text",
  "shape",
  "svg",
  "sticker",
  "background",
  "three",
]);

/**
 * Graphics EFFECTIFS d'un editor_state : collection re-sanitisée à la lecture
 * (on ne fait jamais confiance aux données stockées). [] si absente.
 */
export function getEffectiveGraphics(
  editorState: VideoEditorState | null | undefined,
): GraphicClipBase[] {
  if (!editorState || !Array.isArray(editorState.graphics)) return [];
  const { graphics } = sanitizeEditorGraphics(editorState.graphics);
  return graphics ?? [];
}

/**
 * Hash STABLE des clips graphiques — invalidation de rendu : toute
 * modification visuelle d'un clip (texte, style, transform, keyframes, durée)
 * change le hash ⇒ le MP4 stocké est considéré obsolète.
 */
export function hashEffectiveGraphics(graphics: readonly GraphicClipBase[]): string {
  const serialized = graphics.map((g) => {
    const r = g as unknown as Record<string, unknown>;
    return JSON.stringify([
      g.kind,
      g.startFrame,
      g.durationInFrames,
      g.zIndex,
      g.transform,
      g.keyframes ?? null,
      // Texte
      r.text ?? "",
      r.style ?? null,
      r.animation ?? null,
      r.direction ?? null,
      // Source (promotion d'un texte hérité) — participe au hash du rendu
      r.source ?? null,
      // Formes
      r.shape ?? null,
      r.fill ?? null,
      r.stroke ?? null,
      r.roundness ?? null,
      r.sides ?? null,
      r.thickness ?? null,
      r.aspect ?? null,
      r.shadow ?? null,
      r.glow ?? null,
      r.blur ?? null,
    ]);
  });
  return createHash("sha256").update(serialized.join("\n")).digest("hex");
}
