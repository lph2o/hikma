import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène CTA finale (texte de la banque CTAS_V1, or en accent).
 *  `hidden.text` masque le texte quand il est promu dans l'éditeur graphique. */
export const CTAScene: React.FC<{
  text: string;
  motion?: SceneMotion;
  hidden?: { text?: boolean };
}> = ({ text, motion, hidden }) => (
  <SceneShell kind="cta" title="Hikma" motion={motion}>
    {!hidden?.text && (
      <div
        style={{
          fontSize: 68,
          lineHeight: 1.45,
          textAlign: "center",
          fontWeight: 600,
          color: HIKMA_THEME.goldBright,
          maxWidth: "94%",
        }}
      >
        {text}
      </div>
    )}
  </SceneShell>
);
