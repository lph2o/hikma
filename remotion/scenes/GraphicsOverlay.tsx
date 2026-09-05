// Hikma — Content Studio : COUCHE GRAPHIQUE Remotion (TextGraphicClip).
//
// Rendu DÉTERMINISTE des clips graphiques texte par-dessus les scènes : la même
// fonction pure `evaluateTextGraphic(clip, frame)` est utilisée par le Preview
// (Player) et le rendu (renderMedia) → PREVIEW == RENDER par construction.
// Source temporelle unique : useCurrentFrame(). Aucune horloge réelle.
//
// Le texte arabe reste rendu par le moteur HTML/texte de la composition
// (shaping, harakāt, RTL via direction) — jamais remplacé par un renderer 3D.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  evaluateGraphicTransform,
  hexToRgba,
  type GraphicClipBase,
} from "../../lib/content-studio/graphics/graphic-clip";
import {
  evaluateTextGraphic,
  type TextGraphicClip,
} from "../../lib/content-studio/graphics/text-graphic";
import {
  evaluateShapeGeometry,
  shapeFillColors,
  type ShapeGraphicClip,
} from "../../lib/content-studio/graphics/shape-graphic";
import type { ThreeGraphicClip } from "../../lib/content-studio/graphics/three-graphic";
import { ThreeGraphicLayer } from "./ThreeGraphicLayer";
import {
  hexAlpha,
  shapeGlowLayers,
  shapeShadowLayers,
  textGlowLayers,
  textShadowLayers,
  transformGeometryAttrs,
} from "../../lib/content-studio/graphics/effects-layers";

const isTextClip = (clip: GraphicClipBase): clip is TextGraphicClip =>
  clip.kind === "text";

const isShapeClip = (clip: GraphicClipBase): clip is ShapeGraphicClip =>
  clip.kind === "shape";

const isThreeClip = (clip: GraphicClipBase): clip is ThreeGraphicClip =>
  clip.kind === "three";

/** Rend un clip texte évalué au frame courant (position normalisée 0..1). */
export const TextGraphicLayer: React.FC<{ clip: TextGraphicClip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const localEnd = clip.startFrame + Math.max(clip.durationInFrames, 1);
  // Hors de la fenêtre du clip → invisible (mêmes règles que les scènes).
  if (frame < clip.startFrame || frame >= localEnd) return null;

  const { transform, style, visibleText } = evaluateTextGraphic(clip, frame);
  const strokeWidth = style.strokeWidth ?? 0;

  // Ombre DIRECTIONNELLE + Halo/GLOW : rendus en COUCHES (fills/strokes plats)
  // au lieu de text-shadow — les text-shadow CSS sont nettement atténués par
  // le Chromium headless du rendu (parité Preview == Render garantie).
  const glowColor = style.glowColor;
  const glowRadius = style.glowRadius ?? 0;
  const glowOpacity = style.glowOpacity ?? 0.9;
  const hasGlow = !!glowColor && glowRadius > 0;
  const hasShadow = style.shadowColor !== undefined;
  const glowLayers = hasGlow
    ? textGlowLayers({ radiusPx: glowRadius, opacity: glowOpacity })
    : [];
  const shadowLayers = hasShadow
    ? textShadowLayers({
        offsetX: style.shadowOffsetX ?? 0,
        offsetY: style.shadowOffsetY ?? 0,
        blurPx: style.shadowBlur ?? 0,
        opacity: hexAlpha(style.shadowColor!),
      })
    : [];
  // Gradient linéaire (clip du texte) — le contour (stroke) reste dessiné par-dessus.
  const gradient = style.gradient && style.gradient.colors.length >= 2 ? style.gradient : undefined;

  const fontProps = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    direction: clip.direction,
    whiteSpace: "pre-wrap" as const,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
        opacity: transform.opacity,
        maxWidth: "82%",
        zIndex: clip.zIndex,
        ...fontProps,
        filter: (style.blurRadius ?? 0) > 0 ? `blur(${style.blurRadius}px)` : undefined,
        backgroundColor: style.backgroundColor,
        padding: style.backgroundColor ? "0.35em 0.7em" : undefined,
        borderRadius: style.backgroundColor ? 12 : undefined,
      }}
    >
      {/* Couches d'ombre : copies décalées du texte (derrière le texte). */}
      {shadowLayers.map((l, i) => (
        <span
          key={`text-shadow-${i}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            color: hexToRgba(style.shadowColor!, l.opacity),
            transform: `translate(${l.dx}px, ${l.dy}px)`,
            pointerEvents: "none",
          }}
        >
          {visibleText}
        </span>
      ))}
      {/* Couches de halo : contours croissants (derrière le texte). */}
      {glowLayers.map((l, i) => (
        <span
          key={`text-glow-${i}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            color: "transparent",
            WebkitTextStroke: `${l.strokeWidthPx}px ${hexToRgba(glowColor!, l.opacity)}`,
            pointerEvents: "none",
          }}
        >
          {visibleText}
        </span>
      ))}
      {/* Texte principal : couleur / gradient / contour. */}
      <span
        style={{
          color: gradient ? "transparent" : style.color,
          background: gradient
            ? `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(", ")})`
            : undefined,
          WebkitBackgroundClip: gradient ? "text" : undefined,
          WebkitTextFillColor: gradient ? "transparent" : undefined,
          WebkitTextStroke:
            strokeWidth > 0 && style.strokeColor
              ? `${strokeWidth}px ${style.strokeColor}`
              : undefined,
        }}
      >
        {visibleText}
      </span>
    </div>
  );
};

/**
 * Rend un clip forme évalué au frame courant. SVG déterministe : le même
 * evaluateShapeGeometry() alimente Preview (Player) et Render (renderMedia).
 *
 * Taille RÉELLE : le container SVG fait `thickness` × largeur de la
 * composition (px), hauteur = même valeur (container CARRÉ) ⇒ une forme
 * radiale (cercle, étoile…) est exactement `thickness` de la largeur du
 * canvas, sans distorsion d'aspect — le cercle reste parfaitement rond sur
 * tout écran et la bounding box de l'éditeur correspond au rendu.
 */
export const ShapeGraphicLayer: React.FC<{ clip: ShapeGraphicClip }> = ({
  clip,
}) => {
  const frame = useCurrentFrame();
  const { width: canvasW } = useVideoConfig();
  const localEnd = clip.startFrame + Math.max(clip.durationInFrames, 1);
  if (frame < clip.startFrame || frame >= localEnd) return null;

  const { transform } = evaluateTextGraphicLikeTransform(clip, frame);
  const geometry = evaluateShapeGeometry(clip);
  const { from, to, angle } = shapeFillColors(clip);
  const paint = to
    ? `linear-gradient(${angle ?? 90}deg, ${from} 0%, ${to} 100%)`
    : from;
  // Taille du container SVG (px) : thickness × largeur du canvas. 1 unité
  // viewBox = sizePx / 2 px → les largeurs de stroke (px canvas) sont
  // converties en unités viewBox pour rester constantes à l'écran.
  const thickness = Math.max(0.05, Math.min(0.9, clip.thickness ?? 0.4));
  const sizePx = thickness * canvasW;
  const unitPx = Math.max(1, sizePx / 2);
  const strokeWidth = clip.stroke
    ? Math.max(0.5, clip.stroke.width) / unitPx
    : undefined;

  const common = {
    fill: paint,
    fillOpacity: transform.opacity,
    stroke: clip.stroke?.color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // Effets de forme : halo + ombre en COUCHES de remplissages plats (SVG
  // purs, rendus bit-identiques par le navigateur et le headless → parité
  // Preview == Render). Le flou gaussien reste un filtre CSS blur().
  const glow = clip.glow && clip.glow.radius > 0 ? clip.glow : undefined;
  const shadow =
    clip.shadow &&
    (clip.shadow.offsetX !== 0 || clip.shadow.offsetY !== 0 || clip.shadow.blur > 0)
      ? clip.shadow
      : undefined;
  const glowExtentPx = glow ? Math.max(0, glow.radius) : 0;
  const glowUnits = glowExtentPx / unitPx;
  const glowLayers = glow
    ? shapeGlowLayers({ radiusPx: glow.radius, sizePx, opacity: glow.opacity })
    : [];
  const shadowLayers = shadow
    ? shapeShadowLayers({
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY,
        blurPx: shadow.blur,
        sizePx,
        opacity: shadow.opacity,
      })
    : [];
  // Le SVG est agrandi (et centré par marges négatives) pour contenir le halo ;
  // la forme principale garde exactement sa taille (1 unité viewBox = unitPx).
  const glowColor = glow?.color ?? "#f5d47a";
  const shadowColor = shadow?.color ?? "#000000";
  const maxShadowUnits = shadowLayers.reduce(
    (acc, l) => Math.max(acc, Math.abs(l.dx) / unitPx, Math.abs(l.dy) / unitPx, l.scale),
    1,
  );
  const vb = Math.max(1 + glowUnits, maxShadowUnits);
  const svgSize = 2 * vb * unitPx;

  return (
    // Container à la taille RÉELLE de la forme (bounding box de l'éditeur) ;
    // le SVG (plus grand quand il y a un halo) déborde et reste centré via
    // position absolute + translate — pas de marges négatives (mal rendues
    // par le Chromium headless → halo décalé).
    <div
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${transform.scaleX}, ${transform.scaleY})`,
        width: sizePx,
        height: sizePx,
        opacity: transform.opacity,
        zIndex: clip.zIndex,
        filter: (clip.blur ?? 0) > 0 ? `blur(${clip.blur}px)` : undefined,
      }}
    >
      <svg
        viewBox={`${-vb} ${-vb} ${2 * vb} ${2 * vb}`}
        width={svgSize}
        height={svgSize}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "block",
          width: svgSize,
          height: svgSize,
        }}
        aria-hidden="true"
      >
        {/* Couches de halo : copies concentriques (derrière la forme). Les
            coordonnées sont PRÉ-MULTIPLIÉES en JS (aucun transform SVG) pour
            une parité pixel parfaite navigateur / headless. */}
        {glowLayers.map((l, i) => (
          <GeometryShape
            key={`glow-${i}`}
            geometry={{
              element: geometry.element,
              attrs: transformGeometryAttrs(geometry.attrs, l.scale, 0, 0),
            }}
            common={{
              ...common,
              fill: hexToRgba(glowColor, l.opacity),
              stroke: clip.stroke ? hexToRgba(glowColor, l.opacity) : undefined,
            }}
          />
        ))}
        {/* Couches d'ombre : copies décalées (derrière la forme). */}
        {shadowLayers.map((l, i) => (
          <GeometryShape
            key={`shadow-${i}`}
            geometry={{
              element: geometry.element,
              attrs: transformGeometryAttrs(geometry.attrs, l.scale, l.dx / unitPx, l.dy / unitPx),
            }}
            common={{
              ...common,
              fill: hexToRgba(shadowColor, l.opacity),
              stroke: clip.stroke ? hexToRgba(shadowColor, l.opacity) : undefined,
            }}
          />
        ))}
        {/* Forme principale (au-dessus des effets). */}
        <GeometryShape geometry={geometry} common={common} />
      </svg>
    </div>
  );
};

const GeometryShape: React.FC<{
  geometry: ReturnType<typeof evaluateShapeGeometry>;
  common: Record<string, unknown>;
}> = ({ geometry, common }) => {
  const stroke = (common.stroke as string | undefined) ?? undefined;
  const strokeWidth = (common.strokeWidth as number | undefined) ?? undefined;
  const fill = common.fill as string;
  const fillOpacity = common.fillOpacity as number;
  switch (geometry.element) {
    case "rect":
      return (
        <rect
          x={geometry.attrs.x}
          y={geometry.attrs.y}
          width={geometry.attrs.width}
          height={geometry.attrs.height}
          rx={geometry.attrs.rx}
          ry={geometry.attrs.ry}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={geometry.attrs.cx}
          cy={geometry.attrs.cy}
          rx={geometry.attrs.rx}
          ry={geometry.attrs.ry}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "circle":
      return (
        <circle
          cx={geometry.attrs.cx}
          cy={geometry.attrs.cy}
          r={geometry.attrs.r}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "line":
      return (
        <line
          x1={geometry.attrs.x1}
          y1={geometry.attrs.y1}
          x2={geometry.attrs.x2}
          y2={geometry.attrs.y2}
          stroke={stroke ?? fill}
          strokeWidth={strokeWidth ?? 0.06}
          strokeLinecap="round"
        />
      );
    case "polygon":
      return (
        <polygon
          points={geometry.attrs.points}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
};

/** Transform évalué d'un clip graphique (keyframes-first) — partagé. */
function evaluateTextGraphicLikeTransform(
  clip: GraphicClipBase,
  frame: number,
): { transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number; opacity: number } } {
  // Clips texte : moteur texte porté (source de vérité).
  if (clip.kind === "text") {
    const { transform } = evaluateTextGraphic(clip as TextGraphicClip, frame);
    return { transform };
  }
  // Autres kinds : keyframes-first sinon transform de base (évaluation pure).
  return { transform: evaluateGraphicTransform(clip, frame) };
}

/**
 * Superposition de tous les clips graphiques, triés par zIndex (déterministe).
 * Kinds déjà implémentés : texte + formes. Les autres (svg/sticker/background/
 * three) seront rendus par leurs modules respectifs sans changer ce contrat.
 */
export const GraphicsOverlay: React.FC<{ graphics?: GraphicClipBase[] }> = ({
  graphics,
}) => {
  const clips = graphics ?? [];
  if (clips.length === 0) return null;
  const sorted = [...clips].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {sorted.map((clip) => {
        if (isTextClip(clip)) return <TextGraphicLayer key={clip.id} clip={clip} />;
        if (isShapeClip(clip)) return <ShapeGraphicLayer key={clip.id} clip={clip} />;
        if (isThreeClip(clip)) return <ThreeGraphicLayer key={clip.id} clip={clip} />;
        return null;
      })}
    </AbsoluteFill>
  );
};
