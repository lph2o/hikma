import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HIKMA_THEME, SAFE_ZONES } from "../theme";
import { fontFamilyLatin } from "../fonts";
import { getEntranceStyle, normalizeMotion } from "../motion";
import type { SceneMotion, VideoSceneKind } from "@/lib/content-studio/video/types";

/**
 * Coquille 9:16 d'une scène : fond dégradé Hikma, zones sûres contractuelles
 * (top 160 / bottom 220), titre doré + filet d'accent, entrée pilotée par le
 * motion engine (déterministe, défauts par kind — aucun aléa).
 */
export const SceneShell: React.FC<{
  kind: VideoSceneKind;
  title?: string;
  motion?: SceneMotion;
  children: React.ReactNode;
}> = ({ kind, title, motion, children }) => {
  const frame = useCurrentFrame();
  const cfg = normalizeMotion(motion, kind);
  const entrance = getEntranceStyle(cfg.enter, frame, {
    duration: cfg.enterDuration,
    delay: cfg.enterDelay,
    intensity: cfg.intensity,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${HIKMA_THEME.teal900} 0%, ${HIKMA_THEME.charcoalDeep} 100%)`,
        opacity: entrance.opacity,
        transform: entrance.transform,
        fontFamily: fontFamilyLatin,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: SAFE_ZONES.topPx,
          left: SAFE_ZONES.rightRailPx,
          right: SAFE_ZONES.rightRailPx,
          bottom: SAFE_ZONES.bottomPx,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {title ? (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: HIKMA_THEME.goldBright,
              }}
            >
              {title}
            </div>
            <div
              style={{
                width: 220,
                height: 6,
                margin: "28px auto 0",
                borderRadius: 3,
                background: `linear-gradient(90deg, ${HIKMA_THEME.goldMuted}, ${HIKMA_THEME.goldBright})`,
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {children}
        </div>
        <div
          style={{
            color: HIKMA_THEME.goldMuted,
            fontSize: 28,
            letterSpacing: 12,
            textTransform: "uppercase",
          }}
        >
          Hikma
        </div>
      </div>
    </AbsoluteFill>
  );
};
