"use client";

// Hikma — Content Studio : COUCHE INTERACTIVE D'ÉDITION VISUELLE (Preview).
//
// L'utilisateur doit pouvoir sélectionner / déplacer / redimensionner / faire
// pivoter les clips graphiques DIRECTEMENT dans le Preview. Cette couche est
// un outil d'ÉDITION UNIQUEMENT — elle ne remplace JAMAIS le renderer MP4 :
//   - le rendu (Preview Player + renderMedia) reste `GraphicsOverlay` (pur) ;
//   - l'éditeur écrit uniquement dans `editor_state.graphics` via les handlers ;
//   - les coordonnées écran sont converties en coordonnées NORMALISÉES (0..1)
//     par les helpers purs `lib/content-studio/graphics/interaction.ts`
//     (delta depuis le snapshot du drag, clamps taille-aware, responsive) ;
//   - la bounding box est dimensionnée à partir des MÊMES métriques que le
//     rendu (thickness × largeur du canvas) → elle entoure exactement l'élément.
//
// Le texte arabe reste rendu par le moteur HTML de la composition (shaping,
// harakāt, RTL) — cette couche ne rend AUCUN texte, elle ne fait que
// sélectionner/déplacer des cadres.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import { evaluateGraphicTransform } from "@/lib/content-studio/graphics/graphic-clip";
import { graphicClipEndFrame } from "@/lib/content-studio/graphics/graphic-clip";
import type { TextGraphicClip } from "@/lib/content-studio/graphics/text-graphic";
import type { ShapeGraphicClip } from "@/lib/content-studio/graphics/shape-graphic";
import { shapeAspect } from "@/lib/content-studio/graphics/shape-graphic";
import type { ThreeGraphicClip } from "@/lib/content-studio/graphics/three-graphic";
import {
  applyDragDelta,
  applyResizeThickness,
  resizeThicknessFactor,
} from "@/lib/content-studio/graphics/interaction";
import type { LegacyTextDescriptor } from "@/lib/content-studio/graphics/legacy-text-adapter";

type InteractionMode = "select" | "drag" | "resize" | "rotate" | null;

interface GraphicMetrics {
  x: number; // centre normalisé 0..1 (fraction de la largeur)
  y: number; // centre normalisé 0..1 (fraction de la hauteur)
  w: number; // largeur normalisée (fraction de la largeur du canvas)
  h: number; // hauteur normalisée (fraction de la hauteur du canvas)
  rotation: number; // degrés
  visible: boolean;
  label: string;
}

/**
 * Estimation de la boîte d'un clip graphique. Les métriques suivent la MÊME
 * convention que le rendu : w = fraction de la largeur du canvas, h = fraction
 * de la hauteur. Pour les formes la taille réelle est `thickness` × largeur
 * du canvas sur les DEUX axes (container SVG carré) → h = w × aspect ×
 * (canvasW / canvasH) pour que la boîte en PIXELS soit carrée quand l'aspect
 * vaut 1 (cercle, étoile, carré) : bounding box == rendu.
 */
function graphicMetrics(
  clip: GraphicClipBase,
  frame: number,
  canvasW: number,
  canvasH: number,
): GraphicMetrics {
  const t = evaluateGraphicTransform(clip, frame);
  const end = graphicClipEndFrame(clip);
  if (frame < clip.startFrame || frame >= end) {
    return { x: t.x, y: t.y, w: 0.05, h: 0.05, rotation: t.rotation, visible: false, label: clip.id };
  }

  let w = 0.3;
  let h = 0.3;

  if (clip.kind === "text") {
    const textClip = clip as TextGraphicClip;
    const fontSize = textClip.style.fontSize ?? 48;
    const text = textClip.text ?? "";
    // Largeur estimée (fontSize proportionnel au canvas 1080 de large)
    const approxChars = Array.from(text).length;
    const fontSizeW = (fontSize / canvasW) * 1.0;
    w = Math.max(0.08, Math.min(0.9, fontSizeW * approxChars * 0.62 + fontSizeW * 0.6));
    h = Math.max(0.06, (fontSize * 1.25) / canvasH);
  } else if (clip.kind === "shape") {
    const shapeClip = clip as ShapeGraphicClip;
    const aspect = shapeAspect(shapeClip);
    const thickness = Math.max(0.05, Math.min(0.9, shapeClip.thickness ?? 0.4));
    // La forme fait `thickness` de la LARGEUR du canvas, sur les deux axes en
    // pixels (container SVG carré) → hauteur normalisée = w × aspect × ratio.
    w = thickness;
    h = Math.max(0.01, w * aspect * (canvasW / canvasH));
  } else if (clip.kind === "three") {
    const threeClip = clip as ThreeGraphicClip;
    // L'objet 3D fait `geometry.size` de la LARGEUR du canvas (dans le plan
    // visible à la distance de la caméra). La boîte est centrée sur la
    // position normalisée — l'axe Z (profondeur) n'élargit pas la boîte 2D.
    const size = Math.max(0.05, Math.min(3, threeClip.geometry.size));
    w = size;
    h = Math.max(0.01, size * (canvasW / canvasH));
  } else {
    w = 0.25;
    h = 0.25;
  }

  return {
    x: t.x,
    y: t.y,
    w: Math.max(0.03, w) * t.scaleX,
    h: Math.max(0.01, h) * t.scaleY,
    rotation: t.rotation,
    visible: true,
    label:
      clip.kind === "text"
        ? (clip as TextGraphicClip).text
        : clip.kind === "three"
          ? `3D · ${(clip as ThreeGraphicClip).geometry.kind}`
          : clip.kind,
  };
}

export function InteractiveGraphicsOverlay({
  graphics,
  selectedId,
  frame,
  width,
  height,
  onSelect,
  onChange,
  legacyHits = [],
  onPromoteLegacy,
  zoom = 1,
}: {
  graphics: readonly GraphicClipBase[];
  selectedId: string | null;
  frame: number;
  width: number;
  height: number;
  onSelect: (id: string | null) => void;
  /** Applique une mise à jour (marque l'état non sauvegardé). */
  onChange: (next: GraphicClipBase[]) => void;
  /** Textes hérités de scènes (non promus) visibles au frame courant. */
  legacyHits?: readonly LegacyTextDescriptor[];
  /** Cliquer un texte hérité le promeut dans l'éditeur graphique unifié. */
  onPromoteLegacy?: (sceneIndex: number, field: string) => void;
  /** Zoom d'affichage du canvas (scale CSS). Les deltas pointer doivent être
   *  divisés par ce facteur pour rester 1:1 (1 px pointeur = 1 px objet). */
  zoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxPx, setBoxPx] = useState<{ w: number; h: number } | null>(null);
  const [dragMode, setDragMode] = useState<InteractionMode>(null);
  // Exposé pour les tests d'intégration (attribut DOM observable).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (dragMode) el.setAttribute("data-drag-mode", dragMode);
    else el.removeAttribute("data-drag-mode");
    if (selectedId) el.setAttribute("data-selected", selectedId);
    else el.removeAttribute("data-selected");
  }, [dragMode, selectedId]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragStartClip = useRef<GraphicClipBase | null>(null);

  // Mesure du conteneur (le Player est affiché dans un conteneur 9:16).
  // Garde anti-boucle : on ne met à l'état QUE si les dimensions changent
  // réellement (sinon chaque callback ResizeObserver crée un nouvel objet,
  // re-rendu, re-notification… jusqu'à saturer la profondeur de mise à jour).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setBoxPx((prev) => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (prev && prev.w === w && prev.h === h) return prev;
        return { w, h };
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = useMemo(
    () =>
      graphics.map((c) => ({
        clip: c,
        m: graphicMetrics(c, frame, width, height),
      })),
    [graphics, frame, width, height],
  );

  const selected = selectedId ? graphics.find((c) => c.id === selectedId) : undefined;
  const selectedMetric = selected
    ? graphicMetrics(selected, frame, width, height)
    : undefined;

  // --- interaction : pointer down sur un clip ---
  const beginInteraction = useCallback(
    (e: React.PointerEvent, id: string, mode: "drag" | "resize" | "rotate") => {
      e.stopPropagation();
      e.preventDefault();
      const clip = graphics.find((c) => c.id === id);
      if (!clip) return;
      onSelect(id);
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragStartClip.current = clip;
      setDragMode(mode);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Événement non natif / capture indisponible : le drag continue via le
        // handler du conteneur (bubbling).
      }
    },
    [graphics, onSelect],
  );

  const endInteraction = useCallback(() => {
    setDragMode(null);
    dragStart.current = null;
    dragStartClip.current = null;
  }, []);

  // Filet de sécurité : le pointerup est garanti de mettre fin au drag même si
  // le pointeur a quitté le conteneur ou que la cible a été re-rendue.
  useEffect(() => {
    const onUp = () => endInteraction();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [endInteraction]);

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragMode || !dragStart.current || !dragStartClip.current) return;
      const clip = dragStartClip.current;
      const dxPx = e.clientX - dragStart.current.x;
      const dyPx = e.clientY - dragStart.current.y;
      const el = containerRef.current;

      if (dragMode === "drag") {
        // Métriques du clip SNAPSHOT (taille pour le clamp taille-aware).
        const m = graphicMetrics(clip, frame, width, height);
        // IMPORTANT : le delta est TOUJOURS calculé depuis le point de DÉPART
        // (dragStart.current) et appliqué à la position de DÉPART du clip
        // (dragStartClip = snapshot) — jamais accumulé sur l'état courant.
        // dragStartClip n'est PAS mis à jour pendant le drag, sinon chaque
        // pointermove ajouterait le delta cumulé à une position déjà décalée
        // (l'objet se déplace 2×, 3×… trop vite).
        // Zoom d'affichage : les deltas pointer sont en pixels ÉCRAN ; le
        // conteneur est scale()'é → sa largeur VISUELLE = clientWidth × zoom.
        // La conversion pixels→normalisé doit utiliser cette largeur visuelle
        // pour rester 1:1 (1 px pointeur = 1 px objet).
        const z = zoom > 0 ? zoom : 1;
        const nextPos = applyDragDelta(
          { x: clip.transform.x, y: clip.transform.y },
          dxPx,
          dyPx,
          {
            canvasW: width,
            canvasH: height,
            containerW: (el?.clientWidth ?? width) * z,
            containerH: (el?.clientHeight ?? height) * z,
            clipW: m.w,
            clipH: m.h,
          },
        );
        const next = graphics.map((c) =>
          c.id === clip.id
            ? { ...c, transform: { ...c.transform, x: nextPos.x, y: nextPos.y } }
            : c,
        );
        onChange(next);
      } else if (dragMode === "resize") {
        // Le facteur est calculé depuis le delta (départ) et appliqué à la
        // taille du SNAPSHOT (jamais à la taille courante re-rendue) : sans
        // cette précaution, chaque pointermove agrandit la base du facteur
        // suivant (resize 2×, 3×… trop rapide).
        const z = zoom > 0 ? zoom : 1;
        const factor = resizeThicknessFactor(1, dxPx, (el?.clientWidth ?? width) * z);
        const next = graphics.map((c) => {
          if (c.id !== clip.id) return c;
          if (c.kind === "text") {
            const t = clip as TextGraphicClip;
            return {
              ...c,
              style: {
                ...t.style,
                fontSize: Math.max(12, Math.min(240, Math.round((t.style.fontSize ?? 48) * factor))),
              },
            };
          }
          if (c.kind === "shape") {
            const s = clip as ShapeGraphicClip;
            return { ...c, thickness: applyResizeThickness(s.thickness ?? 0.4, factor) };
          }
          if (c.kind === "three") {
            const t = clip as ThreeGraphicClip;
            const size = Math.max(0.05, Math.min(3, t.geometry.size * factor));
            return { ...c, geometry: { ...t.geometry, size } };
          }
          return c;
        });
        onChange(next);
      } else if (dragMode === "rotate") {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Centre du clip en pixels écran (position normalisée × taille affichée)
        const centerX = rect.left + clip.transform.x * rect.width;
        const centerY = rect.top + clip.transform.y * rect.height;
        // Angle de la poignée (déjà 90° au-dessus du centre au repos → +90°)
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
        const next = graphics.map((c) =>
          c.id === clip.id
            ? { ...c, transform: { ...c.transform, rotation: Math.round(angle) } }
            : c,
        );
        onChange(next);
      }
    },
    [dragMode, graphics, onChange, frame, width, height, zoom],
  );

  const visibleMetrics = metrics.filter(({ m }) => m.visible);
  const activeMetric = selectedMetric && selectedMetric.visible ? selectedMetric : undefined;

  const boxPxFor = (m: GraphicMetrics) => {
    if (!boxPx) return { left: 0, top: 0, w: 0, h: 0 };
    return {
      left: m.x * boxPx.w,
      top: m.y * boxPx.h,
      w: m.w * boxPx.w,
      h: m.h * boxPx.h,
    };
  };

  const sel = activeMetric ? boxPxFor(activeMetric) : null;
  const handleSize = Math.max(10, Math.min(14, (boxPx?.w ?? 270) * 0.05));

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-20 select-none"
      style={{ pointerEvents: "auto" }}
      onPointerMove={handleMove}
      onPointerUp={endInteraction}
      onPointerLeave={endInteraction}
      onPointerDown={(e) => {
        // Clic sur le fond transparent (hors clip et hors handles) → désélection
        if (!dragMode && (e.target as HTMLElement).dataset?.graphicDeselect === "true") {
          onSelect(null);
        }
      }}
    >
      {/* Fond transparent captant le clic de désélection */}
      <div
        className="absolute inset-0"
        data-graphic-deselect="true"
        style={{ pointerEvents: "auto" }}
      />

      {/* Hitboxes des TEXTES HÉRITÉS (non promus) : un clic les promeut dans
          l'éditeur graphique unifié (même moteur texte, effets, timeline,
          MP4). Cadre pointillé doré discret — visible au survol. */}
      {legacyHits.map((d) => {
        const approxChars = Array.from(d.content).length;
        const fontSizeW = (d.style.fontSize / width) * 1.0;
        const w = Math.max(0.08, Math.min(0.9, fontSizeW * approxChars * 0.62 + fontSizeW * 0.6));
        const h = Math.max(0.06, (d.style.fontSize * 1.25) / height);
        const b = boxPxFor({ x: d.transform.x, y: d.transform.y, w, h, rotation: 0, visible: true, label: d.label });
        return (
          <div
            key={d.key}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onPromoteLegacy?.(d.sceneIndex, d.field);
            }}
            className="group absolute rounded-md"
            title={`Rendre « ${d.content.slice(0, 18)} » éditable (texte graphique)`}
            data-legacy-promote={`${d.sceneIndex}:${d.field}`}
            style={{
              left: b.left - b.w / 2,
              top: b.top - b.h / 2,
              width: b.w,
              height: b.h,
              cursor: "pointer",
              pointerEvents: "auto",
              border: "1px dashed rgba(201,168,76,0.45)",
              opacity: 0.28,
            }}
          >
            <span
              className="pointer-events-none absolute -top-5 left-0 hidden whitespace-nowrap rounded-md bg-amber-900/90 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-hikma-gold group-hover:block"
            >
              ✎ {d.label}
            </span>
          </div>
        );
      })}

      {/* Cibles de sélection (transparentes, positionnées sur chaque clip).
          Toujours montées, Y COMPRIS pour le clip sélectionné : le drag reste
          possible directement sur l'élément actif (la boîte de sélection est
          pointerEvents:none et laisse passer les clics vers cette cible). */}
      {visibleMetrics.map(({ clip, m }) => {
        const b = boxPxFor(m);
        return (
          <div
            key={clip.id}
            onPointerDown={(e) => beginInteraction(e, clip.id, "drag")}
            className="absolute rounded-sm"
            title={m.label}
            data-graphic-id={clip.id}
            style={{
              left: b.left - b.w / 2,
              top: b.top - b.h / 2,
              width: b.w,
              height: b.h,
              transform: `rotate(${m.rotation}deg)`,
              cursor: "move",
              pointerEvents: "auto",
            }}
          />
        );
      })}

      {/* Boîte de sélection + handles de l'élément actif */}
      {sel && activeMetric && (
        <div
          className="absolute"
          style={{
            left: sel.left - sel.w / 2,
            top: sel.top - sel.h / 2,
            width: sel.w,
            height: sel.h,
            transform: `rotate(${activeMetric.rotation}deg)`,
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          {/* Bordure de sélection */}
          <div className="absolute inset-0 rounded-md border-[1.5px] border-hikma-teal-300/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_0_12px_rgba(59,160,140,0.35)]" />
          {/* Étiquette */}
          <div className="absolute -top-6 left-0 rounded-md bg-hikma-teal-600/90 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
            {activeMetric.label.slice(0, 18)}
          </div>

          {/* Handle rotation (au-dessus) — masqué pendant un drag */}
          <div
            onPointerDown={(e) => beginInteraction(e, selectedId!, "rotate")}
            className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full border border-hikma-gold bg-[#0d1411] cursor-grab"
            style={{ width: handleSize + 2, height: handleSize + 2, pointerEvents: "auto", display: dragMode ? "none" : undefined }}
            title="Faire pivoter"
            data-graphic-handle="rotate"
          >
            <div className="size-1.5 rounded-full bg-hikma-gold" />
          </div>
          {/* Ligne du handle rotation */}
          <div
            className="absolute left-1/2 -top-7 w-px -translate-x-1/2 bg-hikma-gold/50"
            style={{ height: handleSize + 6, display: dragMode ? "none" : undefined }}
          />

          {/* Handle resize (coin bas-droite) — masqué pendant un drag */}
          <div
            onPointerDown={(e) => beginInteraction(e, selectedId!, "resize")}
            className="absolute -right-2 -bottom-2 rounded-md border border-white bg-hikma-teal-500 cursor-nwse-resize"
            style={{ width: handleSize, height: handleSize, pointerEvents: "auto", display: dragMode ? "none" : undefined }}
            title="Redimensionner"
            data-graphic-handle="resize"
          />
        </div>
      )}

      {/* Guides de centrage (pendant le drag) */}
      {dragMode && (
        <div className="pointer-events-none absolute inset-0 z-40">
          <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-hikma-gold/50" />
          <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-hikma-gold/50" />
        </div>
      )}
    </div>
  );
}
