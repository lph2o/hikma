// Hikma — Content Studio : CLIP GRAPHIQUE 3D (ThreeGraphicClip).
//
// Couche 3D ADDITIVE, indépendante du pipeline audio / récitation / texte
// arabe / scènes existantes. Un ThreeGraphicClip est un élément graphique
// standard (même base GraphicClipBase que texte/formes) rendu par une vraie
// scène Three.js via @react-three/fiber (Preview) et @remotion/three (Render).
//
//  - kind "three" (déjà prévu dans GraphicClipKind) ;
//  - transform NORMALISÉ x/y 0..1 du canvas (convention partagée) + z relatif ;
//  - rotation XYZ en degrés, scale XYZ (1 = 100 %) ;
//  - geometry : objet 3D déterministe (box/sphere/torus/plane/cylinder/
//    icosahedron) + paramètres de taille ;
//  - material : couleur, opacité, metalness, roughness (PBR déterministe) ;
//  - lighting : ambiance + directionnelle + point (intensités 0..1) ;
//  - camera : fov, position XYZ (relatif) ;
//  - keyframes : moteur EXISTANT (position.x/y/z, rotation.x/y/z,
//    scale.x/y/z, opacity) — même évaluation pure Preview == Render ;
//  - évaluation `evaluateThreeGraphic(clip, frame)` : fonction PURE du frame,
//    partagée par le Preview (Player) et le rendu (renderMedia).
//
// Le texte arabe coranique reste rendu par le renderer arabe Hikma (shaping,
// harakāt, RTL) — jamais converti en TextGeometry 3D.

import {
  DEFAULT_GRAPHIC_TRANSFORM,
  sanitizeGraphicClipBase,
  sanitizeGraphicTransform,
  type GraphicClipBase,
  type GraphicTransform,
} from "@/lib/content-studio/graphics/graphic-clip";
import { getKeyframeValueAtTime } from "@/lib/content-studio/editor/keyframes";

/** Géométries 3D disponibles (abstraction générique — facile à étendre). */
export type ThreeGeometryKind =
  | "box"
  | "sphere"
  | "torus"
  | "plane"
  | "cylinder"
  | "icosahedron";

export const THREE_GEOMETRY_KINDS: readonly ThreeGeometryKind[] = [
  "box",
  "sphere",
  "torus",
  "plane",
  "cylinder",
  "icosahedron",
];

export const THREE_GEOMETRY_LABELS: Record<ThreeGeometryKind, string> = {
  box: "Cube",
  sphere: "Sphère",
  torus: "Tore",
  plane: "Plan",
  cylinder: "Cylindre",
  icosahedron: "Icosaèdre",
};

/** Paramètres de géométrie (déterministes, JSON-safe, sanitizés). */
export interface ThreeGeometry {
  readonly kind: ThreeGeometryKind;
  /** Taille principale (taille d'arête pour box, rayon pour sphere/icosahedron,
   *  rayon principal pour torus/cylinder, largeur pour plane). */
  readonly size: number;
  /** Rayon du tube (torus) ou rayon secondaire (cylinder) / hauteur (plane). */
  readonly sizeY: number;
  /** Segments (segments radiaux / hauteur). */
  readonly segments: number;
}

/** Matériau PBR simple (déterministe). */
export interface ThreeMaterial {
  readonly color: string;
  readonly opacity: number;
  readonly metalness: number;
  readonly roughness: number;
  readonly emissive: string;
  readonly emissiveIntensity: number;
}

/** Éclairage : ambiante + directionnelle + point (intensités 0..1). */
export interface ThreeLighting {
  readonly ambientIntensity: number;
  readonly directionalIntensity: number;
  readonly directionalX: number;
  readonly directionalY: number;
  readonly directionalZ: number;
  readonly pointIntensity: number;
  readonly pointX: number;
  readonly pointY: number;
  readonly pointZ: number;
}

/** Caméra : fov + position relative au clip (le clip reste au centre). */
export interface ThreeCamera {
  readonly fov: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Transform 3D (étend GraphicTransform avec z et axes séparés). */
export interface ThreeTransform extends GraphicTransform {
  /** Profondeur relative (normalisée sur la hauteur du canvas). */
  readonly z: number;
  /** Rotation sur les trois axes (degrés). */
  readonly rotationX: number;
  readonly rotationY: number;
  readonly rotationZ: number;
  /** Scale sur les trois axes. */
  readonly scaleZ: number;
}

export const DEFAULT_THREE_TRANSFORM: ThreeTransform = {
  ...DEFAULT_GRAPHIC_TRANSFORM,
  z: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scaleZ: 1,
};

export interface ThreeGraphicClip extends GraphicClipBase {
  readonly kind: "three";
  readonly transform: ThreeTransform;
  readonly geometry: ThreeGeometry;
  readonly material: ThreeMaterial;
  readonly lighting: ThreeLighting;
  readonly camera: ThreeCamera;
}

export interface ThreeGraphicInput {
  readonly id?: string;
  readonly startFrame?: number;
  readonly durationInFrames?: number;
  readonly zIndex?: number;
  readonly transform?: Partial<ThreeTransform>;
  readonly geometry?: Partial<ThreeGeometry>;
  readonly material?: Partial<ThreeMaterial>;
  readonly lighting?: Partial<ThreeLighting>;
  readonly camera?: Partial<ThreeCamera>;
  readonly keyframes?: ThreeGraphicClip["keyframes"];
}

const clampFinite = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
};

/** Couleur hex valide sinon fallback. */
function sanitizeColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
  return fallback;
}

const DEFAULT_GEOMETRY: ThreeGeometry = { kind: "box", size: 0.5, sizeY: 0.5, segments: 24 };
const DEFAULT_MATERIAL: ThreeMaterial = {
  color: "#f5d47a",
  opacity: 1,
  metalness: 0.15,
  roughness: 0.45,
  emissive: "#000000",
  emissiveIntensity: 0,
};
// Intensités calibrées pour three r155+ (mode physique : les lumières sont en
// unités réelles, pas legacy). Un matériau métallique sans envMap apparaît
// très sombre → ambiante généreuse + directionnelle forte par défaut.
const DEFAULT_LIGHTING: ThreeLighting = {
  ambientIntensity: 1.2,
  directionalIntensity: 2.2,
  directionalX: 0.5,
  directionalY: 1,
  directionalZ: 0.3,
  pointIntensity: 0,
  pointX: 0,
  pointY: 0,
  pointZ: 1.2,
};
const DEFAULT_CAMERA: ThreeCamera = { fov: 40, x: 0, y: 0, z: 3 };

export function sanitizeThreeGeometry(raw: Partial<ThreeGeometry> | undefined): ThreeGeometry {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GEOMETRY };
  const kind = THREE_GEOMETRY_KINDS.includes(raw.kind as ThreeGeometryKind)
    ? (raw.kind as ThreeGeometryKind)
    : "box";
  return {
    kind,
    size: clampFinite(raw.size, 0.05, 3, DEFAULT_GEOMETRY.size),
    sizeY: clampFinite(raw.sizeY, 0.02, 3, DEFAULT_GEOMETRY.sizeY),
    segments: Math.max(3, Math.floor(clampFinite(raw.segments, 3, 128, DEFAULT_GEOMETRY.segments))),
  };
}

export function sanitizeThreeMaterial(raw: Partial<ThreeMaterial> | undefined): ThreeMaterial {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MATERIAL };
  return {
    color: sanitizeColor(raw.color, DEFAULT_MATERIAL.color),
    opacity: clampFinite(raw.opacity, 0, 1, DEFAULT_MATERIAL.opacity),
    metalness: clampFinite(raw.metalness, 0, 1, DEFAULT_MATERIAL.metalness),
    roughness: clampFinite(raw.roughness, 0, 1, DEFAULT_MATERIAL.roughness),
    emissive: sanitizeColor(raw.emissive, DEFAULT_MATERIAL.emissive),
    emissiveIntensity: clampFinite(raw.emissiveIntensity, 0, 5, DEFAULT_MATERIAL.emissiveIntensity),
  };
}

export function sanitizeThreeLighting(raw: Partial<ThreeLighting> | undefined): ThreeLighting {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_LIGHTING };
  const dir = (v: unknown, fb: number) => clampFinite(v, -10, 10, fb);
  return {
    ambientIntensity: clampFinite(raw.ambientIntensity, 0, 3, DEFAULT_LIGHTING.ambientIntensity),
    directionalIntensity: clampFinite(
      raw.directionalIntensity,
      0,
      3,
      DEFAULT_LIGHTING.directionalIntensity,
    ),
    directionalX: dir(raw.directionalX, DEFAULT_LIGHTING.directionalX),
    directionalY: dir(raw.directionalY, DEFAULT_LIGHTING.directionalY),
    directionalZ: dir(raw.directionalZ, DEFAULT_LIGHTING.directionalZ),
    pointIntensity: clampFinite(raw.pointIntensity, 0, 5, DEFAULT_LIGHTING.pointIntensity),
    pointX: dir(raw.pointX, DEFAULT_LIGHTING.pointX),
    pointY: dir(raw.pointY, DEFAULT_LIGHTING.pointY),
    pointZ: dir(raw.pointZ, DEFAULT_LIGHTING.pointZ),
  };
}

export function sanitizeThreeCamera(raw: Partial<ThreeCamera> | undefined): ThreeCamera {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CAMERA };
  return {
    fov: clampFinite(raw.fov, 10, 120, DEFAULT_CAMERA.fov),
    x: clampFinite(raw.x, -10, 10, DEFAULT_CAMERA.x),
    y: clampFinite(raw.y, -10, 10, DEFAULT_CAMERA.y),
    z: clampFinite(raw.z, 0.5, 20, DEFAULT_CAMERA.z),
  };
}

/** Sanitise le transform 3D (reprend la base 2D + z/axes 3D). */
export function sanitizeThreeTransform(raw: Partial<ThreeTransform> | undefined): ThreeTransform {
  const base = sanitizeGraphicTransform(raw);
  return {
    ...base,
    z: clampFinite(raw?.z, -3, 3, DEFAULT_THREE_TRANSFORM.z),
    rotationX: clampFinite(raw?.rotationX, -3600, 3600, DEFAULT_THREE_TRANSFORM.rotationX),
    rotationY: clampFinite(raw?.rotationY, -3600, 3600, DEFAULT_THREE_TRANSFORM.rotationY),
    rotationZ: clampFinite(raw?.rotationZ, -3600, 3600, DEFAULT_THREE_TRANSFORM.rotationZ),
    scaleZ: clampFinite(raw?.scaleZ, 0, 10, DEFAULT_THREE_TRANSFORM.scaleZ),
  };
}

/**
 * Crée un ThreeGraphicClip à partir d'une entrée partielle. DÉTERMINISTE :
 * pas d'UUID (id fourni ou dérivé du kind), sanitization stricte (jamais
 * NaN/Infinity, bornes sûres). Utilisable aussi pour la PERSISTANCE (le même
 * sanitizer est appliqué au chargement editor_state).
 */
export function createThreeGraphicClip(input: ThreeGraphicInput): ThreeGraphicClip {
  const base = sanitizeGraphicClipBase({
    id: input.id,
    kind: "three",
    startFrame: input.startFrame,
    durationInFrames: input.durationInFrames,
    zIndex: input.zIndex,
    transform: input.transform,
    keyframes: input.keyframes,
  });
  return {
    ...base,
    kind: "three",
    transform: sanitizeThreeTransform(input.transform),
    geometry: sanitizeThreeGeometry(input.geometry),
    material: sanitizeThreeMaterial(input.material),
    lighting: sanitizeThreeLighting(input.lighting),
    camera: sanitizeThreeCamera(input.camera),
  };
}

/** État évalué d'un clip 3D à un frame donné (PURE du frame). */
export interface EvaluatedThreeGraphic {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotationX: number;
  readonly rotationY: number;
  readonly rotationZ: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly scaleZ: number;
  readonly opacity: number;
  readonly geometry: ThreeGeometry;
  readonly material: ThreeMaterial;
  readonly lighting: ThreeLighting;
  readonly camera: ThreeCamera;
}

const finiteOr = (v: number, fb: number) => (Number.isFinite(v) ? v : fb);

/**
 * Évalue un clip 3D à un frame : les keyframes (s'ils existent) pilotent
 * position.x/y/z, rotation.x/y/z, scale.x/y/z et opacity ; sinon le transform
 * de base s'applique. La géométrie / matériau / lumière / caméra restent ceux
 * du clip (non keyframables dans cette itération). Fonction PURE → même
 * résultat en Preview (Player) et en Render (renderMedia).
 */
export function evaluateThreeGraphic(clip: ThreeGraphicClip, frame: number): EvaluatedThreeGraphic {
  const base = clip.transform;
  const kfs = clip.keyframes;
  const valueFor = (property: string, fallback: number): number => {
    if (!kfs || kfs.length === 0) return fallback;
    const propertyKfs = kfs.filter((kf) => kf.property === property);
    if (propertyKfs.length === 0) return fallback;
    const { value } = getKeyframeValueAtTime(propertyKfs, frame);
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

  return {
    x: finiteOr(valueFor("position.x", base.x), base.x),
    y: finiteOr(valueFor("position.y", base.y), base.y),
    z: finiteOr(valueFor("position.z", base.z), base.z),
    rotationX: finiteOr(valueFor("rotation.x", base.rotationX), base.rotationX),
    rotationY: finiteOr(valueFor("rotation.y", base.rotationY), base.rotationY),
    rotationZ: finiteOr(valueFor("rotation.z", base.rotationZ), base.rotationZ),
    scaleX: finiteOr(valueFor("scale.x", base.scaleX), base.scaleX),
    scaleY: finiteOr(valueFor("scale.y", base.scaleY), base.scaleY),
    scaleZ: finiteOr(valueFor("scale.z", base.scaleZ), base.scaleZ),
    opacity: clampFinite(valueFor("opacity", base.opacity), 0, 1, base.opacity),
    geometry: clip.geometry,
    material: clip.material,
    lighting: clip.lighting,
    camera: clip.camera,
  };
}
