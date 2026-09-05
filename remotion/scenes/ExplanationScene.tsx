import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène d'EXPLICATION : explication validée (jamais générée/placeholder).
 *  `hidden.text` masque le texte quand il est promu dans l'éditeur graphique. */
export const ExplanationScene: React.FC<{
  text: string;
  motion?: SceneMotion;
  hidden?: { text?: boolean };
}> = ({ text, motion, hidden }) => (
  <SceneShell kind="explanation" title="Pour aller plus loin" motion={motion}>
    {!hidden?.text && (
      <div
        style={{
          fontSize: 52,
          lineHeight: 1.55,
          textAlign: "center",
          color: HIKMA_THEME.ivory,
          maxWidth: "94%",
        }}
      >
        {text}
      </div>
    )}
  </SceneShell>
);
