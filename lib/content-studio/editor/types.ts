// Hikma — Content Studio (Phase F) : COUCHE D'ÉDITION VIDÉO.
//
// Séparation STRICTE (même discipline que video/types.ts) :
//   - payload contractuel V1   → GELÉ, jamais muté (sources Quran read-only) ;
//   - VideoSceneData dérivé     → montage DÉTERMINISTE de la pipeline ;
//   - VideoEditorState          → couche d'édition du studio, stockée dans
//                                 content_items.editor_state (nullable).
//
// `editor_state` est la liste COMPLÈTE des scènes telles qu'éditées. Si elle
// est null, la preview et le rendu utilisent exactement le montage déterministe
// de la pipeline. Si elle est présente, elle REMPLACE la liste des scènes pour
// la preview ET le rendu (source de vérité commune : pas de divergence).
//
// Seuls les champs de MONTAGE sont éditables (textes de scène, durée) — les
// données du corpus (quran_words, ayahs, translations) restent intouchables.

import type { VideoScene } from "@/lib/content-studio/video/types";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";

/**
 * Couche d'édition vidéo persistée — liste complète des scènes éditées + clips
 * graphiques (texte, forme, SVG, sticker, background, 3D) ADDITIFS : les
 * anciens editor_state sans `graphics` continuent de fonctionner à l'identique.
 */
export type VideoEditorState = {
  scenes: VideoScene[];
  /** Clips graphiques superposés aux scènes (collection optionnelle). */
  graphics?: GraphicClipBase[];
};