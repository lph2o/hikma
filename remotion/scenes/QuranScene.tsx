import React from "react";
import { Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { HIKMA_THEME } from "../theme";
import { fontFamilyLatin } from "../fonts";
import { SceneShell } from "./SceneShell";
import { GoldenRecitationFollower } from "./GoldenRecitationFollower";
import type {
  SceneMotion,
  VerseDisplayConfig,
} from "@/lib/content-studio/video/types";

/**
 * Scène CORAN MULTI-STYLE & GOLDEN RECITATION FOLLOWER (Phase V2).
 *
 * Supporte :
 *   - 6 modes d'affichage (standard, large, highlight-word, line-by-line, progressive, word-focus)
 *   - Golden Recitation Follower : suivi doré de la récitation en temps réel
 *   - Traduction intégrée : FR (Hamidullah), EN, IT sous forme de texte ou de carte
 *   - Piste audio du verset unique et continue avec clamp endAt frame-accurate.
 */
export const QuranScene: React.FC<{
  excerpt: string;
  reference: string;
  motion?: SceneMotion;
  audioUrl?: string | null;
  audioVolume?: number;
  audioMuted?: boolean;
  audioFadeIn?: number;
  audioFadeOut?: number;
  verseConfig?: VerseDisplayConfig;
  studiedWord?: string;
}> = ({
  excerpt,
  reference,
  motion,
  audioUrl,
  audioVolume = 1,
  audioMuted = false,
  audioFadeIn = 0,
  audioFadeOut = 0,
  verseConfig,
  studiedWord,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const mode = verseConfig?.mode ?? "standard";
  const fontSize = mode === "large" ? 86 : mode === "word-focus" ? 76 : 68;
  const showTranslation = verseConfig?.showTranslation && Boolean(verseConfig.translation?.text);
  const translationPos = verseConfig?.translation?.position ?? "below";

  return (
    <SceneShell kind="quran" title="Dans le Coran" motion={motion}>
      {/* 1. AUDIO UNIQUE DU VERSET (Une seule lecture complète continue) */}
      {audioUrl && !audioMuted ? (
        <Audio
          src={audioUrl}
          endAt={durationInFrames}
          volume={(f) => {
            let vol = audioVolume;
            if (audioFadeIn > 0 && f < audioFadeIn) vol *= f / audioFadeIn;
            if (audioFadeOut > 0 && f > durationInFrames - audioFadeOut) {
              vol *= (durationInFrames - f) / audioFadeOut;
            }
            return Math.max(0, Math.min(1, vol));
          }}
        />
      ) : null}

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {/* 2. TEXTE CORANIQUE UTHMANI + GOLDEN RECITATION FOLLOWER */}
        <GoldenRecitationFollower
          text={excerpt}
          currentFrame={frame}
          durationInFrames={durationInFrames}
          config={verseConfig}
          studiedWord={studiedWord}
          fontSize={fontSize}
        />

        {/* 3. TRADUCTION DU VERSET (Optionnelle, intégrée) */}
        {showTranslation && (
          <div
            style={{
              maxWidth: "90%",
              textAlign: "center",
              fontFamily: fontFamilyLatin,
              fontSize: verseConfig?.translation?.fontSize ?? 34,
              lineHeight: 1.55,
              color: "rgba(248, 248, 240, 0.88)",
              opacity: verseConfig?.translation?.opacity ?? 0.95,
              background:
                translationPos === "card"
                  ? "rgba(0, 40, 40, 0.45)"
                  : undefined,
              border:
                translationPos === "card"
                  ? "1px solid rgba(200, 160, 88, 0.3)"
                  : undefined,
              borderRadius: translationPos === "card" ? 18 : undefined,
              padding: translationPos === "card" ? "16px 24px" : "4px 12px",
              boxShadow:
                translationPos === "card"
                  ? "0 10px 30px rgba(0, 0, 0, 0.3)"
                  : undefined,
              marginTop: 8,
            }}
          >
            <p style={{ margin: 0, fontStyle: "italic" }}>
              « {verseConfig?.translation?.text} »
            </p>
            {verseConfig?.translation?.sourceName && (
              <span
                style={{
                  display: "block",
                  marginTop: 6,
                  fontSize: 22,
                  fontStyle: "normal",
                  color: HIKMA_THEME.goldMuted,
                  letterSpacing: 0.5,
                }}
              >
                — {verseConfig.translation.sourceName}
              </span>
            )}
          </div>
        )}

        {/* 4. RÉFÉRENCE DE LA SOURATE & VERSET */}
        <div
          style={{
            marginTop: showTranslation ? 8 : 24,
            fontSize: 34,
            fontWeight: 500,
            color: HIKMA_THEME.goldBright,
            letterSpacing: 1,
            fontFamily: fontFamilyLatin,
          }}
        >
          {reference}
        </div>
      </div>
    </SceneShell>
  );
};
