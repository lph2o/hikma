import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { HIKMA_THEME } from "./theme";
import { SceneRenderer } from "./scenes";

/**
 * Composition principale : enchaîne les scènes de VideoSceneData en séquences
 * temporelles consécutives (décalage cumulé). Déterministe : mêmes scènes,
 * mêmes frames ⇒ même rendu. Aucune logique éditoriale ici — uniquement du
 * montage. La durée est calculée par `calculateMetadata` (Root.tsx).
 */
export const HikmaWordVideo: React.FC<{ scenes: VideoScene[] }> = ({ scenes }) => {
  // Décalages calculés sans mutation (règle react-hooks) : la scène i commence
  // après la somme des durées des scènes précédentes.
  const sequenced = scenes.map((scene, index) => ({
    scene,
    from: scenes.slice(0, index).reduce((acc, s) => acc + s.durationInFrames, 0),
  }));
  return (
    <AbsoluteFill style={{ backgroundColor: HIKMA_THEME.charcoalDeep }}>
      {sequenced.map(({ scene, from }, index) => (
        <Sequence
          key={`${scene.kind}-${index}`}
          from={from}
          durationInFrames={scene.durationInFrames}
          name={`${scene.kind} (${index})`}
        >
          <SceneRenderer scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
