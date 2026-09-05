// Hikma — Content Studio : COUCHES D'EFFETS (glow / shadow) en géométrie pure.
//
// Pourquoi : les filtres CSS `drop-shadow()` et `text-shadow` sont rendus à
// pleine intensité par le navigateur (Preview) mais nettement atténués par le
// Chromium headless du rendu Remotion (renderStill/renderMedia) → cassait la
// garantie PREVIEW == RENDER. Les calques ci-dessous reproduisent le même
// rendu visuel (halo progressif, ombre directionnelle douce) avec des FILLS
// PLATS (remplissages SVG / strokes texte), rendus de façon bit-identique par
// les deux moteurs.
//
// Toutes les fonctions sont PURES et DÉTERMINISTES : même entrée → mêmes
// couches → même rendu. Aucune horloge réelle, aucun Math.random().

/** Une couche de halo : copie de la forme mise à l'échelle + opacité. */
export interface ShapeGlowLayer {
  readonly scale: number;
  readonly opacity: number;
}

/** Une couche d'ombre : copie décalée (+ légère mise à l'échelle pour le flou). */
export interface ShapeShadowLayer {
  readonly scale: number;
  readonly dx: number;
  readonly dy: number;
  readonly opacity: number;
}

/** Une couche de halo texte : contour (stroke) de largeur croissante. */
export interface TextGlowLayer {
  readonly strokeWidthPx: number;
  readonly opacity: number;
}

/** Une couche d'ombre texte : copie décalée du texte. */
export interface TextShadowLayer {
  readonly dx: number;
  readonly dy: number;
  readonly opacity: number;
}

/**
 * Applique scale + translation aux ATTRIBUTS d'une géométrie SVG (résultat de
 * evaluateShapeGeometry) SANS utiliser d'attribut `transform` SVG : les
 * coordonnées sont pré-multipliées en JS. Raison : l'origine des `transform`
 * SVG (attribut) n'est pas fiable à l'identique entre le navigateur (Preview)
 * et le Chromium headless du rendu — des coordonnées explicites sont rendues
 * bit-identiques par les deux moteurs (PREVIEW == RENDER garanti).
 *
 * PURE et DÉTERMINISTE : mêmes entrées → mêmes attributs.
 */
export function transformGeometryAttrs(
  attrs: Record<string, string>,
  scale: number,
  dxUnits: number,
  dyUnits: number,
): Record<string, string> {
  const out: Record<string, string> = {};
  const apply = (x: number, y: number): [number, number] => [
    round4(x * scale + dxUnits),
    round4(y * scale + dyUnits),
  ];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "points") {
      out[k] = v
        .trim()
        .split(/\s+/)
        .map((pair) => {
          const [x, y] = pair.split(",").map(Number);
          if (!Number.isFinite(x) || !Number.isFinite(y)) return pair;
          const [nx, ny] = apply(x, y);
          return `${nx},${ny}`;
        })
        .join(" ");
    } else if (k === "x" || k === "x1" || k === "x2" || k === "cx") {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? String(apply(n, 0)[0]) : v;
    } else if (k === "y" || k === "y1" || k === "y2" || k === "cy") {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? String(apply(0, n)[1]) : v;
    } else if (k === "width" || k === "height" || k === "rx" || k === "ry" || k === "r") {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? String(round4(n * scale)) : v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

/** Alpha d'une couleur hex (#RRGGBB, #RRGGBBAA, #RGB, #RGBA) — 1 par défaut. */
export function hexAlpha(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 1;
  }
  return 1;
}

/**
 * Couches de halo pour une FORME : `layers` copies concentriques, échelle de
 * 1 à 1 + radius/(size/2), opacité décroissante (décroissance sub-linéaire
 * pour un halo doux). La dernière couche est transparente (bord fondu).
 */
export function shapeGlowLayers(opts: {
  radiusPx: number;
  sizePx: number;
  opacity: number;
  layers?: number;
}): ShapeGlowLayer[] {
  const layers = Math.max(2, Math.min(16, Math.floor(opts.layers ?? 10)));
  const unit = Math.max(1, opts.sizePx / 2);
  const maxScale = 1 + Math.max(0, opts.radiusPx) / unit;
  const base = Math.max(0, Math.min(1, opts.opacity));
  const out: ShapeGlowLayer[] = [];
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const scale = 1 + (maxScale - 1) * t;
    // 0.55 · (1−t)^0.55 : fondu sub-linéaire — halo visible jusqu'au bord
    // (dernière couche à 0 → extrémité fondue).
    const opacity = base * 0.55 * Math.pow(1 - t, 0.55);
    out.push({ scale: round4(scale), opacity: round4(opacity) });
  }
  return out;
}

/**
 * Couches d'ombre pour une FORME : copies décalées le long du vecteur
 * (offsetX, offsetY) avec un léger étirement (flou simulé). L'opacité
 * décroît vers les couches extérieures → ombre douce directionnelle.
 */
export function shapeShadowLayers(opts: {
  offsetX: number;
  offsetY: number;
  blurPx: number;
  sizePx: number;
  opacity: number;
  layers?: number;
}): ShapeShadowLayer[] {
  const layers = Math.max(2, Math.min(10, Math.floor(opts.layers ?? 4)));
  const unit = Math.max(1, opts.sizePx / 2);
  const blur = Math.max(0, opts.blurPx);
  const base = Math.max(0, Math.min(1, opts.opacity));
  const out: ShapeShadowLayer[] = [];
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const k = 1 + 0.4 * t; // l'ombre s'étire légèrement le long de la direction
    out.push({
      scale: round4(1 + (blur / unit) * 0.5 * t),
      dx: round4(opts.offsetX * k),
      dy: round4(opts.offsetY * k),
      opacity: round4(base * 0.55 * (1 - 0.55 * t)),
    });
  }
  return out;
}

/**
 * Couches de halo pour un TEXTE : copies du texte avec un contour
 * (`-webkit-text-stroke`) de largeur croissante et opacité décroissante.
 * Le stroke est centré sur le bord des glyphes → les couches extérieures
 * dessinent un halo progressif autour du texte, y compris l'arabe (RTL,
 * shaping, harakāt inchangés — même chaîne, propriété de peinture seule).
 */
export function textGlowLayers(opts: {
  radiusPx: number;
  opacity: number;
  layers?: number;
}): TextGlowLayer[] {
  const layers = Math.max(2, Math.min(12, Math.floor(opts.layers ?? 6)));
  const radius = Math.max(0, opts.radiusPx);
  const base = Math.max(0, Math.min(1, opts.opacity));
  const maxStroke = Math.max(1, radius * 1.4); // étendue externe ≈ radius
  const out: TextGlowLayer[] = [];
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const w = 0.5 + (maxStroke - 0.5) * t;
    const opacity = base * 0.6 * Math.pow(1 - t, 0.7);
    out.push({ strokeWidthPx: round4(w), opacity: round4(opacity) });
  }
  return out;
}

/**
 * Couches d'ombre pour un TEXTE : copies décalées du texte, opacité
 * décroissante, léger étirement le long de la direction pour le flou.
 */
export function textShadowLayers(opts: {
  offsetX: number;
  offsetY: number;
  blurPx: number;
  opacity: number;
  layers?: number;
}): TextShadowLayer[] {
  const layers = Math.max(2, Math.min(8, Math.floor(opts.layers ?? 4)));
  const blur = Math.max(0, opts.blurPx);
  const base = Math.max(0, Math.min(1, opts.opacity));
  const out: TextShadowLayer[] = [];
  const dir = Math.hypot(opts.offsetX, opts.offsetY);
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    // k étire le décalage le long de la direction pour simuler le flou ;
    // décalage nul (ombre "dans le dos" sans direction) → copies empilées.
    const k = dir > 0.001 ? 1 + ((0.5 * blur) / dir) * t : 1;
    out.push({
      dx: round4(opts.offsetX * k),
      dy: round4(opts.offsetY * k),
      opacity: round4(base * 0.5 * (1 - 0.5 * t)),
    });
  }
  return out;
}
