// Hikma — Content Studio : HELPERS PURS D'INTERACTION (drag / resize / clamps).
//
// Code HIKMA. La logique de manipulation visuelle des GraphicClip est isolée
// en fonctions PURE (aucun DOM, aucun état React) :
//   - le delta en PIXELS écran est converti en coordonnées NORMALISÉES via la
//     taille réelle du conteneur (responsive : fonctionne à toute taille) ;
//   - le clamp est TAILLE-AWARE : un élément de largeur 20 % peut avoir son
//     centre jusqu'à x = 1 + 0.1 (son bord gauche touche le bord droit du
//     canvas) sans jamais disparaître entièrement ;
//   - aucune mutation d'entrée (toujours des copies).
// Ces fonctions sont utilisées par InteractiveGraphicsOverlay (Preview) — le
// render MP4 reste piloté uniquement par l'état persisté, pas par ces helpers.

/** Clamp TAILLE-AWARE d'une position normalisée (0..1 canvas). */
export function clampPosition(value: number, sizeFraction: number): number {
  if (!Number.isFinite(value)) return 0.5;
  if (sizeFraction >= 1) return Math.max(0, Math.min(1, value));
  const half = Math.max(0, sizeFraction) / 2;
  return Math.max(-half, Math.min(1 + half, value));
}

/** Convertit un delta en pixels écran → delta normalisé (0..1 du canvas). */
export function pxDeltaToNormalized(
  dxPx: number,
  dyPx: number,
  canvasW: number,
  canvasH: number,
  containerW: number,
  containerH: number,
): { dx: number; dy: number } {
  const cw = containerW > 0 ? containerW : canvasW;
  const ch = containerH > 0 ? containerH : canvasH;
  return {
    dx: (dxPx / cw) * canvasW,
    dy: (dyPx / ch) * canvasH,
  };
}

/**
 * Applique un delta de drag (pixels écran) au transform d'un clip : calcule la
 * NOUVELLE position normalisée à partir de la position de DÉPART (jamais d'un
 * état obsolète), clampée taille-aware. Ne mute jamais l'entrée.
 */
export function applyDragDelta(
  base: { x: number; y: number },
  dxPx: number,
  dyPx: number,
  opts: {
    canvasW: number;
    canvasH: number;
    containerW: number;
    containerH: number;
    /** Largeur normalisée du clip (pour le clamp taille-aware). */
    clipW?: number;
    /** Hauteur normalisée du clip. */
    clipH?: number;
  },
): { x: number; y: number } {
  const { dx, dy } = pxDeltaToNormalized(
    dxPx,
    dyPx,
    opts.canvasW,
    opts.canvasH,
    opts.containerW,
    opts.containerH,
  );
  const w = opts.clipW ?? 0.1;
  const h = opts.clipH ?? 0.1;
  return {
    x: clampPosition(base.x + dx / opts.canvasW, w),
    y: clampPosition(base.y + dy / opts.canvasH, h),
  };
}

/** Facteur de resize appliqué à l'épaisseur d'une forme (borné). */
export function resizeThicknessFactor(
  thickness: number,
  dxPx: number,
  containerW: number,
): number {
  const delta = containerW > 0 ? dxPx / containerW : 0; // fraction du canvas
  return Math.max(0.3, Math.min(3, 1 + delta * 2));
}

/** Applique le facteur à l'épaisseur (bornes du modèle). */
export function applyResizeThickness(thickness: number, factor: number): number {
  const f = Number.isFinite(factor) ? factor : 1;
  return Math.max(0.05, Math.min(0.9, thickness * f));
}

/**
 * Nouvelle taille d'une forme à partir de Largeur / Hauteur NORMALISÉES
 * (fractions de la largeur du canvas). Le cercle garde width === height
 * (aspect verrouillé à 1). Retourne `null` si la largeur est invalide.
 */
export function sizeFromWidthHeight(
  shape: "circle" | "ellipse" | "rectangle" | "polygon" | "star" | "line" | "arrow",
  width: number,
  height: number,
): { thickness: number; aspect: number } | null {
  if (!Number.isFinite(width) || width <= 0) return null;
  const thickness = Math.max(0.05, Math.min(0.9, width));
  if (shape === "circle") return { thickness, aspect: 1 };
  if (!Number.isFinite(height) || height <= 0) {
    return { thickness, aspect: 1 };
  }
  return {
    thickness,
    aspect: Math.max(0.05, Math.min(2, height / width)),
  };
}
