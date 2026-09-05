// Hikma — Video Format System : OUTILS PARTAGÉS DES TEMPLATES ÉDITORIAUX.
//
// Utilisés par tous les templates de format (word-reveal, ayah-immersion, …)
// pour produire EXACTEMENT les mêmes primitives que le Content Studio :
// TextGraphicClip pré-promus (source {sceneIndex, field}) planifiés au début
// de leur scène, avec z-index composés par rôle (jamais max+1 aveugle).
//
// PROTECTION CORAN : le verset (`quran.arabic`) est PROTÉGÉ — le renderer
// arabe + Golden Recitation Follower + la récitation continue ne sont jamais
// contournés (le descripteur protégé n'est jamais promu).
//
// Module PUR et DÉTERMINISTE (aucun UUID, aucun Date.now, aucun Math.random).

import { computeStarts } from "@/lib/content-studio/editor/timeline-ops";
import { listLegacyTexts } from "@/lib/content-studio/graphics/legacy-text-adapter";
import {
  buildTextAnimation,
  createTextGraphicClip,
} from "@/lib/content-studio/graphics/text-graphic";
import type { TextGraphicClip } from "@/lib/content-studio/graphics/text-graphic";
import type { VideoScene } from "@/lib/content-studio/video/types";

/** z-index composé par rôle — jamais `max+1` aveugle (section 21). */
export const ROLE_Z_INDEX: Record<
  "decor" | "intro" | "arabic" | "secondary" | "cta",
  number
> = {
  decor: 1,
  intro: 9,
  arabic: 10,
  secondary: 11,
  cta: 12,
};

/** z-index par (kind de scène, champ) — source de vérité du plan. */
export function zIndexFor(
  sceneKind: string,
  field: string,
): number {
  if (field === "arabic") return ROLE_Z_INDEX.arabic;
  if (sceneKind === "cta") return ROLE_Z_INDEX.cta;
  if (sceneKind === "intro") return ROLE_Z_INDEX.intro;
  return ROLE_Z_INDEX.secondary;
}

/** Animation par rôle : mot arabe = révélation typewriter, sinon fondu. */
export function buildRoleAnimation(sceneKind: string, field: string) {
  if (field === "arabic") {
    return buildTextAnimation("typewriter", { inDurationFrames: 24, outDurationFrames: 0 });
  }
  return buildTextAnimation("fade", { inDurationFrames: 12, outDurationFrames: 0 });
}

/**
 * Promeut les textes hérités de chaque scène en TextGraphicClip éditables
 * (les textes protégés — verset coranique — sont TOUJOURS ignorés).
 * Chaque clip démarre au début de SA scène (starts accumulés) — jamais tout
 * à frame 0. Ids déterministes : `fmt-${prefix}-${sceneIndex}-${field}`.
 */
export function promoteSceneTexts(input: {
  readonly scenes: readonly VideoScene[];
  /** Préfixe d'id du format (ex. "word-reveal", "ayah-immersion"). */
  readonly idPrefix: string;
}): TextGraphicClip[] {
  const { scenes, idPrefix } = input;
  const starts = computeStarts([...scenes]);
  const clips: TextGraphicClip[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    for (const desc of listLegacyTexts(scene, i)) {
      if (desc.protected) continue; // jamais le verset coranique
      const sceneKind = scene.kind;
      clips.push(
        createTextGraphicClip({
          id: `fmt-${idPrefix}-${i}-${desc.field}`,
          text: desc.content,
          direction: desc.direction,
          startFrame: starts[i]!,
          durationInFrames: scene.durationInFrames,
          zIndex: zIndexFor(sceneKind, desc.field),
          style: desc.style,
          transform: desc.transform,
          animation: buildRoleAnimation(sceneKind, desc.field),
          source: { sceneIndex: i, field: desc.field },
        }),
      );
    }
  }
  return clips;
}
