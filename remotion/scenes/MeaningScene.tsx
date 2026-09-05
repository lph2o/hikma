import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène du SENS : glose FR validée (jamais un fallback EN promu FR).
 *  `hidden.text` masque le texte quand il est promu dans l'éditeur graphique. */
export const MeaningScene: React.FC<{
  text: string;
  motion?: SceneMotion;
  hidden?: { text?: boolean };
}> = ({ text, motion, hidden }) => (
  <SceneShell kind="meaning" title="Que signifie ce mot ?" motion={motion}>
    {!hidden?.text && (
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
    )}
  </SceneShell>
);
