import React from "react";
import { Composition } from "remotion";
import type { VideoSceneData } from "@/lib/content-studio/video/types";
import { HikmaWordVideo } from "./HikmaWordVideo";

export const COMPOSITION_ID = "HikmaWordVideo";
export const VIDEO_FPS = 30;

/**
 * SceneData par défaut (durée maximale — avec toutes les scènes) : la durée
 * réelle est dérivée des props via calculateMetadata, donc le rendu d'un
 * contenu donné produit exactement la durée de ses scènes.
 */
const DEFAULT_SCENE_DATA: VideoSceneData = {
  scenes: [
    { kind: "intro", durationInFrames: 45, text: "Ce mot apparaît 131 fois dans le Coran." },
    { kind: "word", durationInFrames: 60, arabic: "يَوْمَ", transliteration: "yawma" },
    { kind: "meaning", durationInFrames: 75, text: "jour" },
    { kind: "quran", durationInFrames: 90, arabic: "…", subtext: "Sourate Al-Baqarah · verset 113" },
    { kind: "explanation", durationInFrames: 90, text: "Période lumineuse." },
    { kind: "cta", durationInFrames: 45, text: "Apprends un mot coranique à la fois." },
  ],
  durationInFrames: 405,
  fps: 30,
  width: 1080,
  height: 1920,
  layout: "9:16",
  theme: "HIKMA",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMPOSITION_ID}
        component={HikmaWordVideo}
        durationInFrames={DEFAULT_SCENE_DATA.durationInFrames}
        fps={VIDEO_FPS}
        width={DEFAULT_SCENE_DATA.width}
        height={DEFAULT_SCENE_DATA.height}
        defaultProps={{ scenes: DEFAULT_SCENE_DATA.scenes }}
        calculateMetadata={({ props }) => {
          const scenes = props.scenes ?? [];
          const duration = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
          return { durationInFrames: Math.max(duration, 1) };
        }}
      />
    </>
  );
};
