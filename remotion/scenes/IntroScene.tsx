import React from "react";
import { HIKMA_THEME } from "../theme";
import { SceneShell } from "./SceneShell";
import type { SceneMotion } from "@/lib/content-studio/video/types";

/** Scène d'intro : le hook éditorial (banque HOOKS_V1). */
export const IntroScene: React.FC<{ text: string; motion?: SceneMotion }> = ({ text, motion }) => (
  <SceneShell kind="intro" title="Hikma · Un mot du Coran" motion={motion}>
    <div
      style={{
        fontSize: 64,
        lineHeight: 1.45,
        textAlign: "center",
        color: HIKMA_THEME.ivory,
        maxWidth: "92%",
      }}
    >
      {text}
    </div>
  </SceneShell>
);
