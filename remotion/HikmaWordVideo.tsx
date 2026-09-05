import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoScene } from "@/lib/content-studio/video/types";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import { promotedLegacyKeys } from "@/lib/content-studio/graphics/legacy-text-adapter";
import { HIKMA_THEME } from "./theme";
import { SceneRenderer } from "./scenes";
import { GraphicsOverlay } from "./scenes/GraphicsOverlay";

/**
 * Composition principale : enchaîne les scènes de VideoSceneData en séquences
 * temporelles consécutives (décalage cumulé). Déterministe : mêmes scènes,
 * mêmes frames ⇒ même rendu. Aucune logique éditoriale ici — uniquement du
 * montage. La durée est calculée par `calculateMetadata` (Root.tsx).
 */
export const HikmaWordVideo: React.FC<{
  scenes: VideoScene[];
  /** Clips graphiques superposés (texte…) — optionnels, rétro-compatibles. */
  graphics?: GraphicClipBase[];
}> = ({ scenes, graphics }) => {
  // Décalages calculés sans mutation (règle react-hooks) : la scène i commence
  // après la somme des durées des scènes précédentes.
  const sequenced = scenes.map((scene, index) => ({
    scene,
    from: scenes.slice(0, index).reduce((acc, s) => acc + s.durationInFrames, 0),
  }));
  // TEXTES HÉRITÉS PROMUS : chaque clip graphique portant une `source` masque
  // le champ original de sa scène (l'utilisateur a pris le contrôle de la
  // présentation via l'éditeur unifié). Supprimer le clip restaure l'original.
  const promoted = promotedLegacyKeys(graphics ?? []);
  return (
    <AbsoluteFill style={{ backgroundColor: HIKMA_THEME.charcoalDeep }}>
      {sequenced.map(({ scene, from }, index) => (
        <Sequence
          key={`${scene.kind}-${index}`}
          from={from}
          durationInFrames={scene.durationInFrames}
          name={`${scene.kind} (${index})`}
        >
          <SceneRenderer
            scene={scene}
            hidden={{
              arabic: promoted.has(`${index}:arabic`),
              transliteration: promoted.has(`${index}:transliteration`),
              text: promoted.has(`${index}:text`),
              subtext: promoted.has(`${index}:subtext`),
            }}
          />
        </Sequence>
      ))}
      {/* Couche graphique superposée — même évaluation que le Preview. */}
      <GraphicsOverlay graphics={graphics} />
    </AbsoluteFill>
  );
};
