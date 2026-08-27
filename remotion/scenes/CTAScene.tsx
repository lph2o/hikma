import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène CTA finale (texte de la banque CTAS_V1, or en accent). */
export const CTAScene: React.FC<{ text: string; motion?: SceneMotion }> = ({ text, motion }) => (
  <SceneShell kind="cta" title="Hikma" motion={motion}>
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
  </SceneShell>
);
