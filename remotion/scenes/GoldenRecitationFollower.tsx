import React from "react";
import { HIKMA_THEME } from "../theme";
import { fontFamilyArabic } from "../fonts";
import type {
  VerseDisplayConfig,
  VerseWordTiming,
} from "@/lib/content-studio/video/types";

export type GoldenRecitationFollowerProps = {
  text: string;
  currentFrame: number;
  durationInFrames: number;
  config?: VerseDisplayConfig;
  studiedWord?: string;
  fontSize?: number;
  lineHeight?: number;
};

/**
 * Calcule des timings proportionnels aux longueurs des mots si aucun timing
 * explicite n'est fourni par l'éditeur.
 */
export function computeDefaultWordTimings(
  words: string[],
  totalFrames: number,
): VerseWordTiming[] {
  if (words.length === 0 || totalFrames <= 0) return [];
  const totalChars = words.reduce((acc, w) => acc + Math.max(1, w.length), 0);
  let currentStart = 0;

  return words.map((word, index) => {
    const isLast = index === words.length - 1;
    const wordWeight = Math.max(1, word.length) / totalChars;
    const duration = isLast
      ? Math.max(1, totalFrames - currentStart)
      : Math.max(1, Math.round(wordWeight * totalFrames));

    const timing: VerseWordTiming = {
      arabic: word,
      startFrame: currentStart,
      endFrame: currentStart + duration,
    };
    currentStart += duration;
    return timing;
  });
}

/**
 * Composant Remotion : GOLDEN RECITATION FOLLOWER (Phase V2).
 *
 * Affiche le texte coranique Uthmani en appliquant une mise en valeur dorée
 * temps réel synchronisée avec la progression de la récitation.
 *
 * Respecte les tokens de la charte Hikma (goldBright #f0d090, gold #c8a058).
 */
export const GoldenRecitationFollower: React.FC<GoldenRecitationFollowerProps> = ({
  text,
  currentFrame,
  durationInFrames,
  config,
  studiedWord,
  fontSize = 72,
  lineHeight = 1.9,
}) => {
  const words = text.trim().split(/\s+/).filter(Boolean);

  const timings: VerseWordTiming[] =
    config?.follower?.words && config.follower.words.length === words.length
      ? config.follower.words
      : computeDefaultWordTimings(words, durationInFrames);

  const followerEnabled = config?.follower?.enabled ?? true;
  const followerStyle = config?.follower?.style ?? "gold-highlight";
  const displayMode = config?.mode ?? "standard";
  const highlightWord = config?.highlight?.wordArabic ?? studiedWord;
  const highlightStyle = config?.highlight?.style ?? "glow";

  // Trouver l'index du mot actif au frame courant
  let activeWordIndex = -1;
  if (followerEnabled && timings.length > 0) {
    for (let i = 0; i < timings.length; i++) {
      const t = timings[i];
      if (currentFrame >= t.startFrame && currentFrame < t.endFrame) {
        activeWordIndex = i;
        break;
      }
    }
    if (activeWordIndex === -1 && currentFrame >= (timings[timings.length - 1]?.endFrame ?? durationInFrames)) {
      activeWordIndex = timings.length - 1;
    }
    if (activeWordIndex === -1) {
      activeWordIndex = 0;
    }
  }

  return (
    <div
      style={{
        direction: "rtl",
        textAlign: config?.typography?.alignment ?? "center",
        fontFamily: fontFamilyArabic,
        fontSize: config?.typography?.fontSize ?? fontSize,
        lineHeight: config?.typography?.lineHeight ?? lineHeight,
        color: HIKMA_THEME.ivory,
        maxWidth: "96%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.45em",
        overflow: "visible",
      }}
    >
      {words.map((word, index) => {
        const isActive = followerEnabled && index === activeWordIndex;
        const isPast = followerEnabled && index < activeWordIndex;
        const isStudied =
          highlightWord &&
          (word.includes(highlightWord) || highlightWord.includes(word));

        // Mode progressif : n'affiche que les mots récités jusqu'au mot actif
        if (displayMode === "progressive" && index > activeWordIndex) {
          return (
            <span
              key={`${word}-${index}`}
              style={{
                opacity: 0,
                transition: "opacity 0.2s ease",
              }}
            >
              {word}
            </span>
          );
        }

        // Mode word-focus : atténue les autres mots
        let baseOpacity = 1;
        if (displayMode === "word-focus") {
          baseOpacity = isStudied || isActive ? 1 : 0.35;
        }

        // Calcul des styles d'animation dorée
        let wordColor: string = HIKMA_THEME.ivory;
        let wordTextShadow: string | undefined;
        let wordBackground: string | undefined;
        let wordBorderBottom: string | undefined;
        let wordTransform: string | undefined;
        let wordFontWeight = 400;

        if (isActive) {
          wordFontWeight = 600;
          switch (followerStyle) {
            case "gold-glow":
              wordColor = HIKMA_THEME.goldBright;
              wordTextShadow = `0 0 24px rgba(240, 208, 144, 0.75), 0 0 8px rgba(200, 160, 88, 0.9)`;
              break;

            case "gold-underline":
              wordColor = HIKMA_THEME.goldBright;
              wordBorderBottom = `3px solid ${HIKMA_THEME.goldBright}`;
              break;

            case "gold-background":
              wordColor = HIKMA_THEME.goldBright;
              wordBackground = "rgba(200, 160, 88, 0.22)";
              break;

            case "gold-scale":
              wordColor = HIKMA_THEME.goldBright;
              wordTransform = "scale(1.08)";
              break;

            case "gold-sweep":
              wordColor = HIKMA_THEME.goldBright;
              wordTextShadow = "0 0 16px rgba(240, 208, 144, 0.6)";
              break;

            case "gold-highlight":
            default:
              wordColor = HIKMA_THEME.goldBright;
              wordTextShadow = "0 0 12px rgba(240, 208, 144, 0.4)";
              break;
          }
        } else if (isPast) {
          // Mots déjà récités : légère teinte dorée reposée
          wordColor = "rgba(248, 248, 240, 0.9)";
        }

        // Surlignage du mot étudié (prioritaire si mode highlight-word ou si activé)
        if (isStudied && (displayMode === "highlight-word" || config?.highlight?.wordArabic)) {
          switch (highlightStyle) {
            case "background":
              wordBackground = "rgba(59, 160, 140, 0.35)";
              wordColor = HIKMA_THEME.goldBright;
              break;
            case "underline":
              wordBorderBottom = `3px solid ${HIKMA_THEME.gold}`;
              wordColor = HIKMA_THEME.goldBright;
              break;
            case "scale":
              wordTransform = "scale(1.1)";
              wordColor = HIKMA_THEME.goldBright;
              break;
            case "color":
              wordColor = HIKMA_THEME.goldBright;
              break;
            case "glow":
            default:
              wordColor = HIKMA_THEME.goldBright;
              wordTextShadow = `0 0 20px rgba(240, 208, 144, 0.8)`;
              break;
          }
        }

        return (
          <span
            key={`${word}-${index}`}
            style={{
              color: wordColor,
              textShadow: wordTextShadow,
              background: wordBackground,
              borderBottom: wordBorderBottom,
              transform: wordTransform,
              fontWeight: wordFontWeight,
              opacity: baseOpacity,
              borderRadius: wordBackground ? "6px" : undefined,
              padding: wordBackground ? "0 6px" : undefined,
              transition: "color 0.15s ease, transform 0.15s ease, text-shadow 0.15s ease",
              display: "inline-block",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
