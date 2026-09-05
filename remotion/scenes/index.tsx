import React from "react";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { IntroScene } from "./IntroScene";
import { WordScene } from "./WordScene";
import { MeaningScene } from "./MeaningScene";
import { QuranScene } from "./QuranScene";
import { ExplanationScene } from "./ExplanationScene";
import { CTAScene } from "./CTAScene";

/** Champs texte hérités masquables (textes promus dans l'éditeur graphique). */
export type SceneHiddenTexts = {
  arabic?: boolean;
  transliteration?: boolean;
  text?: boolean;
  subtext?: boolean;
};

/**
 * Dispatcher scène → composant. Chaque scène reçoit UNIQUEMENT les champs qui
 * la concernent ; un `kind` inconnu ne rend rien (défensif, jamais de crash).
 * Les contrôles audio (volume, mute, fade) sont transmis aux scènes concernées.
 * `hidden` masque les champs texte promus (l'éditeur graphique les remplace).
 */
export const SceneRenderer: React.FC<{
  scene: VideoScene;
  hidden?: SceneHiddenTexts;
}> = ({ scene, hidden }) => {
  switch (scene.kind) {
    case "intro":
      return <IntroScene text={scene.text ?? ""} motion={scene.motion} hidden={hidden} />;
    case "word":
      return (
        <WordScene
          arabic={scene.arabic ?? ""}
          transliteration={scene.transliteration ?? null}
          motion={scene.motion}
          hero={scene.hero}
          audioUrl={scene.audioUrl}
          audioVolume={scene.audioVolume}
          audioMuted={scene.audioMuted}
          audioFadeIn={scene.audioFadeIn}
          audioFadeOut={scene.audioFadeOut}
          hideArabic={hidden?.arabic}
          hideTransliteration={hidden?.transliteration}
        />
      );
    case "meaning":
      return <MeaningScene text={scene.text ?? ""} motion={scene.motion} hidden={hidden} />;
    case "quran":
      return (
        <QuranScene
          excerpt={scene.arabic ?? ""}
          reference={scene.subtext ?? ""}
          motion={scene.motion}
          audioUrl={scene.audioUrl}
          audioVolume={scene.audioVolume}
          audioMuted={scene.audioMuted}
          audioFadeIn={scene.audioFadeIn}
          audioFadeOut={scene.audioFadeOut}
          verseConfig={scene.verseConfig}
          studiedWord={scene.verseConfig?.highlight?.wordArabic}
          hideSubtext={hidden?.subtext}
        />
      );
    case "explanation":
      return <ExplanationScene text={scene.text ?? ""} motion={scene.motion} hidden={hidden} />;
    case "cta":
      return <CTAScene text={scene.text ?? ""} motion={scene.motion} hidden={hidden} />;
    default:
      return null;
  }
};
