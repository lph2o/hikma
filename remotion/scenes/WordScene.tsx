import React from "react";
import { Audio, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HIKMA_THEME } from "../theme";
import { fontFamilyArabic } from "../fonts";
import { SceneShell } from "./SceneShell";
import {
  getBreathingScale,
  getEntranceStyle,
  normalizeMotion,
  normalizeWordHero,
  sweepEnvelope,
  GoldenGlint,
  LightSweep,
  MirrorReflection,
  silverFlatStyle,
  silverTextStyle,
  WordGlow,
  type SweepTiming,
} from "../motion";
import type { SceneMotion, WordHeroSettings } from "@/lib/content-studio/video/types";

/**
 * Scène du MOT — WORD HERO (Phase H2).
 *
 * Le mot arabe est un OBJET PRÉCIEUX : matériau pearl/silver poli (suggéré par
 * la lumière, jamais une plaque/verre — aucun `filter` ni copie arrière lourde),
 * zone typographique sûre (lineHeight 1.5 + overflow visible : HARAKAT JAMAIS
 * COUPÉS), ombre de contact douce (profondeur simulée), reflet miroir lumineux
 * subtil sous la baseline, light sweep multi-couches (copie highlight + masque
 * + bande mobile) qui traverse les glyphes avec atténuation temporaire du mot,
 * éclat doré subtil, glow doux et respiration imperceptible. Tout est
 * DÉTERMINISTE (frame-based), partagé Preview/Render, piloté par `hero`
 * (WordHeroSettings) avec défauts tout ON.
 */
export const WordScene: React.FC<{
  arabic: string;
  transliteration: string | null;
  motion?: SceneMotion;
  hero?: WordHeroSettings;
  audioUrl?: string | null;
  audioVolume?: number;
  audioMuted?: boolean;
  audioFadeIn?: number;
  audioFadeOut?: number;
}> = ({ arabic, transliteration, motion, hero, audioUrl, audioVolume = 1, audioMuted = false, audioFadeIn = 0, audioFadeOut = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cfg = normalizeMotion(motion, "word");
  const h = normalizeWordHero(hero);

  // Entrée : opacity + transform uniquement (jamais de `filter` — le clip du
  // matériau argenté et du sweep ne peint pas dans un sous-arbre filtré).
  const entrance = getEntranceStyle(cfg.enter, frame, {
    duration: cfg.enterDuration,
    delay: cfg.enterDelay,
    intensity: cfg.intensity,
  });

  // Respiration : presque imperceptible (amplitude 0,6–1 % selon l'intensité).
  const breath = h.breathing.enabled
    ? getBreathingScale(frame, {
        start: cfg.enterDelay + cfg.enterDuration + 6,
        amplitude: 0.006 + 0.004 * h.breathing.intensity,
      })
    : 1;

  // Reflet : apparaît juste après le début de l'entrée (hiérarchie temporelle).
  const mirrorStart = cfg.enterDelay + Math.min(6, cfg.enterDuration * 0.35);
  const mirrorProgress = interpolate(
    frame,
    [mirrorStart, mirrorStart + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Light sweep (lumière de studio) + éclat doré, décalés dans le temps.
  const sweep: SweepTiming | null = h.lightSweep.enabled
    ? { start: cfg.emphasisDelay, duration: h.lightSweep.duration }
    : null;
  const glint: SweepTiming | null =
    sweep && h.goldenGlint.enabled
      ? { start: cfg.emphasisDelay + 3, duration: 16 }
      : null;

  // Pendant le sweep, un voile sombre (opacité animée, aucun `filter`)
  // assombrit légèrement le mot : la bande blanche ressort comme une réflexion
  // sur métal, puis la pleine luminosité revient.
  const sweepEnv = sweep ? sweepEnvelope(frame, sweep) : 0;
  const dimOpacity = 0.28 * h.lightSweep.intensity * sweepEnv;

  // Boîte du mot (lineHeight × fontSize) — déterministe.
  // ZONE TYPOGRAPHIQUE SÛRE : lineHeight 1.5 + overflow visible ⇒ les
  // diacritiques hautes (fatha, damma, sukun, shadda, tanwin, hamza) et basses
  // (kasra) restent TOUJOURS entièrement visibles, quel que soit le mot.
  const ARABIC_BOX_H = 190 * 1.5;
  const ARABIC_STYLE: React.CSSProperties = {
    direction: "rtl",
    textAlign: "center",
    fontFamily: fontFamilyArabic,
    fontSize: 190,
    lineHeight: 1.5,
    maxWidth: "100%",
    display: "block",
    overflow: "visible",
  };
  // Matériau pearl/silver (clip aux glyphes).
  const materialStyle = silverTextStyle(ARABIC_STYLE);
  // Profondeur simulée = OMBRE DE CONTACT douce sous le mot (jamais de copie
  // arrière nette qui lirait comme une « plaque ») : l'objet paraît posé sur
  // la surface, l'ombre reste diffuse et secondaire.
  const depthShadow = h.depth.enabled
    ? `0 ${(5 + 5 * h.depth.intensity).toFixed(1)}px ${(14 + 12 * h.depth.intensity).toFixed(1)}px rgba(0,0,0,${(0.26 + 0.14 * h.depth.intensity).toFixed(3)})`
    : undefined;

  // Translittération : entrée discrète, légèrement décalée après le mot.
  const translit = getEntranceStyle("fade-up", frame - 8, { duration: 18 });

  return (
    <SceneShell kind="word" title="Le mot" motion={{ enter: "fade" }}>
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
          transform: `scale(${breath.toFixed(4)})`,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: entrance.opacity,
            transform: entrance.transform,
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Halo doux derrière le mot (secondaire — jamais un néon). */}
            {h.glow.enabled ? (
              <WordGlow
                progress={entrance.opacity}
                width={ARABIC_BOX_H * 1.8}
                height={ARABIC_BOX_H}
                intensity={h.glow.intensity}
              />
            ) : null}

            {/* MATÉRIAU PEARL/SILVER (glyphes) + ombre de contact douce. */}
            <div
              style={{
                ...materialStyle,
                position: "relative",
                zIndex: 1,
                textShadow: depthShadow,
              }}
            >
              {arabic}
            </div>

            {/* Voile d'atténuation pendant le sweep (jamais de `filter`).
                ZONE AGRANDIE : le cadre sombre est volontairement plus grand que
                la boîte du mot (padding vertical + horizontal) pour que les
                glyphes arabes ET toutes les voyelles/diacritiques (hautes et
                basses) s'affichent entièrement à l'intérieur, jamais rognées sur
                les bords du cadre. Ne touche ni au style du texte, ni au fond de
                la scène, ni à la translittération/label. */}
            {sweep ? (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  // −120 px en haut/en bas et −70 px de chaque côté : le cadre
                  // dépasse largement les diacritiques les plus hautes et les
                  // jambages les plus bas, quel que soit le mot.
                  top: -120,
                  bottom: -120,
                  left: -70,
                  right: -70,
                  zIndex: 1,
                  background: "rgba(8,16,16,0.9)",
                  opacity: dimOpacity,
                  pointerEvents: "none",
                }}
              />
            ) : null}

            {/* Lumière de studio qui traverse les glyphes. */}
            {sweep ? (
              <LightSweep
                frame={frame}
                timing={sweep}
                textStyle={ARABIC_STYLE}
                intensity={h.lightSweep.intensity}
              >
                {arabic}
              </LightSweep>
            ) : null}

            {/* Éclat doré subtil (détail premium, jamais dominant). */}
            {glint ? (
              <GoldenGlint
                frame={frame}
                timing={glint}
                height={ARABIC_BOX_H}
                intensity={h.goldenGlint.intensity}
              />
            ) : null}

            {/* Reflet miroir sous le mot (silver, masqué, flouté). */}
            {h.mirror.enabled ? (
              <MirrorReflection
                progress={mirrorProgress}
                boxHeight={ARABIC_BOX_H}
                opacity={h.mirror.opacity}
                blur={h.mirror.blur}
              >
                {/* Remplissage uni : le clip ne peint pas sous `blur()` (rendu
                    headless) — c'est le conteneur (masque + blur + opacité)
                    qui crée l'effet de réflexion. */}
                <span style={silverFlatStyle(ARABIC_STYLE)}>{arabic}</span>
              </MirrorReflection>
            ) : null}
          </div>
        </div>
        {transliteration ? (
          <div
            style={{
              marginTop: 150,
              fontSize: 48,
              fontWeight: 500,
              color: HIKMA_THEME.goldBright,
              letterSpacing: 2,
              opacity: translit.opacity,
              transform: translit.transform,
            }}
          >
            {transliteration}
          </div>
        ) : null}
      </div>
    </SceneShell>
  );
};
