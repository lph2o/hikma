import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène du SENS : glose FR validée (jamais un fallback EN promu FR). */
export const MeaningScene: React.FC<{ text: string; motion?: SceneMotion }> = ({ text, motion }) => (
  <SceneShell kind="meaning" title="Que signifie ce mot ?" motion={motion}>
    <div
      style={{
        fontSize: 88,
        lineHeight: 1.35,
        textAlign: "center",
        fontWeight: 600,
        color: HIKMA_THEME.cream,
        maxWidth: "94%",
      }}
    >
      {text}
    </div>
  </SceneShell>
);
