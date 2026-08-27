// Hikma — MOTION EFFECTS (Phase H1) : composants réutilisables, DÉTERMINISTES.
//
//   MirrorReflection  → reflet miroir sous le mot (flip vertical + masque)
//   LightSweep        → bande de lumière traversant les glyphes (clip texte)
//   GoldenGlint       → éclat doré subtil accompagnant le sweep
//   WordGlow          → halo doré très discret derrière le mot
//
// Tous s'appuient sur les fonctions pures de ./engine (mêmes valeurs en
// Preview et en Render — source unique).

import React from "react";
import {
  clamp,
  glintEnvelope,
  glintPosition,
  lightSweepBackgroundPosition,
  mirrorMaskGradient,
  sweepEnvelope,
  type SweepTiming,
} from "./engine";

// ---------------------------------------------------------------------------
// SILVER ARABIC MATERIAL (Phase H2) — matériau argenté poli via background-clip.
//
// Dégradé métallique vertical multi-niveaux : silver sombre → silver → blanc
// brillant (highlight supérieur) → silver → silver sombre. Remplissage clippé
// AUX GLYPHES (aucun `filter` sur un ancêtre — contrainte du rendu headless).
// ---------------------------------------------------------------------------

// Matériau PEARL / SILVER (Phase H2) : argent clair, blanc ivoire chaud au
// highlight (accueil de la lumière), silver doux en bas. Le métal est SUGGÉRÉ
// par la lumière, jamais par une texture lourde — plusieurs niveaux de
// luminosité, contraste suffisant sur le fond teal sombre, lisibilité intacte.
export const SILVER_GRADIENT =
  "linear-gradient(180deg, #aab2ba 0%, #cdd3d9 16%, #eef1f4 36%, #fffef8 46%, #f8f9fa 54%, #d8dde1 72%, #a7b0b8 100%)";

/** Variante plus sombre (face arrière / profondeur simulée). */
export const SILVER_GRADIENT_DARK =
  "linear-gradient(180deg, #6e7780 0%, #8a939c 20%, #aeb6bd 40%, #c3c9cf 48%, #b9c0c7 55%, #8e979f 75%, #6d767e 100%)";

/**
 * Style texte à remplissage argenté (background-clip: text). `color` et le
 * remplissage du texte sont forcés transparents : seul le dégradé s'affiche,
 * découpé par les glyphes (ligatures/harakāt incluses).
 *
 * CONTRAINTE RENDU HEADLESS : jamais de `background-clip: text` dans un
 * sous-arbre porteur d'un `filter` (le clip ne se peint pas). Pour le reflet
 * (conteneur blur+masque), utiliser `silverFlatStyle` (remplissage uni).
 */
export function silverTextStyle(
  textStyle: React.CSSProperties,
  gradient: string = SILVER_GRADIENT,
): React.CSSProperties {
  return {
    ...textStyle,
    color: "transparent",
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
}

/**
 * Remplissage argenté UNI (aucun clip, aucun dégradé clippé) — destiné au
 * reflet miroir (conteneur `filter: blur()` + masque) où le clip ne peint pas.
 * La teinte est un silver moyen : le blur + le masque + l'opacité réduite du
 * conteneur produisent déjà l'effet de réflexion ; le remplissage reste net
 * sur les glyphes sans rivaliser avec le mot.
 */
export function silverFlatStyle(
  textStyle: React.CSSProperties,
  color: string = "#bcc4cb",
): React.CSSProperties {
  return { ...textStyle, color, backgroundImage: "none" };
}

// ---------------------------------------------------------------------------
// MirrorReflection — reflet vertical du mot, flouté, masqué, sous le mot.
// ---------------------------------------------------------------------------

export const MirrorReflection: React.FC<{
  /** Progression 0..1 du fondu d'apparition du reflet. */
  progress: number;
  /** Hauteur (px) de la boîte du mot (lineHeight × fontSize). */
  boxHeight: number;
  /** Opacité maximale du reflet (subtile — jamais compétitif avec le mot). */
  opacity?: number;
  blur?: number;
  children: React.ReactNode;
}> = ({ progress, boxHeight, opacity = 0.5, blur = 0.8, children }) => {
  const o = clamp(progress, 0, 1) * opacity;
  const mask = mirrorMaskGradient();
  // La copie s'aligne exactement sur la boîte du mot (top: -boxHeight) ; l'axe
  // de miroir est la BASE DES GLYPHES (bas de la boîte + jambages), calibré
  // pour Amiri 190px avec lineHeight 1.5 (zone sûre diacritiques H2) : ~98,2 %
  // de la boîte. IMPORTANT : les children ne doivent PAS utiliser
  // background-clip:text — le `filter: blur()` du conteneur empêche le clip de
  // se peindre (contrainte du rendu headless) ; on utilise un remplissage plat.
  const axisPct = 98.2;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        height: boxHeight,
        opacity: o,
        pointerEvents: "none",
        filter: `blur(${blur}px)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -boxHeight,
          transform: "scaleY(-1)",
          transformOrigin: `50% ${axisPct.toFixed(2)}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LightSweep (Phase H2 — architecture ROBUSTE multi-couches) :
//
//   mot de base (matériau argenté)
//   + copie highlight (même texte, blanc chaud) DÉCALÉE d'un conteneur masqué
//   + masque STATIQUE (bande diagonale douce au centre du conteneur)
//   + bande mobile : le conteneur glisse (transform) et la copie est
//     contre-translatée ⇒ les glyphes restent parfaitement alignés pendant que
//     la bande de lumière balaie le mot, visible UNIQUEMENT dans les glyphes.
//
// Ne dépend PAS uniquement de background-clip:text (technique fragile en rendu
// headless) : uniquement masque statique + transform, les deux déjà prouvés.
// Aucun `filter` sur un ancêtre (le masque ne peint pas dans un sous-arbre
// filtré). La largeur du mot est MESURÉE (layout déterministe — même valeur en
// Preview et en Render) pour calculer la course de la bande.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// LightSweep (Phase H2) — architecture MULTI-COUCHES ROBUSTE :
//
//   mot de base (matériau pearl/silver)
//   + copie highlight (même texte, blanc chaud) — couche séparée, alignée
//   + clip aux glyphes (background-clip: text — MÉCANISME PROUVÉ dans ce
//     rendu headless ; le masque mobile, testé en H2, ne peint pas la bande)
//   + bande lumineuse mobile (backgroundPosition animé) qui balaie les glyphes
//
// La copie highlight est une vraie couche indépendante du mot de base : si le
// clip échouait, seul l'effet de bande manquerait — jamais le mot lui-même.
// Aucun `filter` sur un ancêtre (le clip ne peint pas dans un sous-arbre
// filtré). La bande est visible UNIQUEMENT à l'intérieur des glyphes.
// ---------------------------------------------------------------------------

/**
 * `textStyle` doit reproduire À L'IDENTIQUE le style du mot de base (police,
 * taille, hauteur de ligne, direction, alignement) — `color` est forcé.
 */
export const LightSweep: React.FC<{
  frame: number;
  timing: SweepTiming;
  textStyle: React.CSSProperties;
  intensity?: number;
  children: React.ReactNode;
}> = ({ frame, timing, textStyle, intensity = 1, children }) => {
  const env = sweepEnvelope(frame, timing);
  const opacity = env * clamp(intensity, 0, 1);
  if (opacity <= 0) return null;
  const backgroundPosition = lightSweepBackgroundPosition(frame, timing);
  const sweepStyle: React.CSSProperties = {
    ...textStyle,
    position: "absolute",
    inset: 0,
    // AU-DESSUS du voile d'atténuation (zIndex 1) : la bande reste lumineuse
    // pendant que le mot de base s'assombrit (empirique : un niveau zIndex
    // inférieur la laisse recouverte — peinture invisible en rendu headless).
    zIndex: 2,
    color: "transparent",
    opacity,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(105deg, transparent 46%, rgba(255,253,244,0.98) 50%, transparent 54%)",
    backgroundSize: "200% 100%",
    backgroundPosition,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    willChange: "background-position, opacity",
  };
  return <div style={sweepStyle}>{children}</div>;
};

// ---------------------------------------------------------------------------
// GoldenGlint — éclat doré bref, discret, accompagnant le sweep.
// ---------------------------------------------------------------------------

export const GoldenGlint: React.FC<{
  frame: number;
  timing: SweepTiming;
  /** Hauteur (px) de la zone illuminée. */
  height: number;
  /** Largeur (px) de l'éclat. */
  width?: number;
  intensity?: number;
  color?: string;
}> = ({ frame, timing, height, width = 180, intensity = 1, color = "rgba(255,238,180,0.55)" }) => {
  const env = glintEnvelope(frame, timing);
  const opacity = env * clamp(intensity, 0, 1);
  if (opacity <= 0) return null;
  const left = glintPosition(frame, timing);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left: `${left.toFixed(2)}%`,
        width,
        height: height * 0.9,
        opacity,
        zIndex: 2,
        pointerEvents: "none",
        mixBlendMode: "screen",
        background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
        willChange: "left, opacity",
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// WordGlow — halo doré très discret derrière le mot (soft-glow).
// ---------------------------------------------------------------------------

export const WordGlow: React.FC<{
  progress: number;
  width: number;
  height: number;
  intensity?: number;
}> = ({ progress, width, height, intensity = 1 }) => {
  const o = Math.min(Math.max(progress, 0), 1) * 0.5 * clamp(intensity, 0, 1);
  if (o <= 0) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width,
        height,
        transform: "translate(-50%, -50%)",
        opacity: o,
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at center, rgba(240,208,144,0.16) 0%, rgba(240,208,144,0.05) 45%, transparent 70%)",
        willChange: "opacity",
      }}
    />
  );
};
