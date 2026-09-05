// Hikma — Content Studio : COUCHE 3D Remotion (ThreeGraphicClip).
//
// Rendu DÉTERMINISTE d'un clip 3D par-dessus les scènes via @remotion/three
// (`ThreeCanvas`) : la même fonction pure `evaluateThreeGraphic(clip, frame)`
// est utilisée par le Preview (Player) et le rendu (renderMedia) →
// PREVIEW == RENDER par construction. Source temporelle unique :
// useCurrentFrame(). Aucune horloge réelle, aucun Math.random.
//
// Le texte arabe coranique reste rendu par le renderer arabe Hikma (jamais
// converti en TextGeometry 3D) — la 3D est une couche graphique ADDITIVE.

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import type { ThreeGraphicClip } from "@/lib/content-studio/graphics/three-graphic";
import { evaluateThreeGraphic } from "@/lib/content-studio/graphics/three-graphic";

/**
 * Convertit la position normalisée (x: 0..1 largeur, y: 0..1 hauteur) et la
 * taille normalisée en unités world Three.js, cohérentes avec la caméra
 * perspective : le plan visible (hauteur monde) à distance `cameraZ` est
 * `2 * cameraZ * tan(fov/2)` ; la largeur monde en dérive par l'aspect 9:16.
 * Déterministe — mêmes entrées ⇒ mêmes unités monde.
 */
function worldMapping(
  canvasW: number,
  canvasH: number,
  cameraZ: number,
  fov: number,
): { worldW: number; worldH: number } {
  const aspect = canvasH > 0 ? canvasW / canvasH : 9 / 16;
  const worldH = 2 * Math.max(0.5, cameraZ) * Math.tan(((Math.max(5, Math.min(120, fov))) * Math.PI) / 360);
  const worldW = worldH * aspect;
  return { worldW, worldH };
}

/** Géométrie Three.js correspondant au type (déterministe, paramétrée). */
const ThreeGeometryMesh: React.FC<{
  kind: ThreeGraphicClip["geometry"]["kind"];
  size: number;
  sizeY: number;
  segments: number;
}> = ({ kind, size, sizeY, segments }) => {
  const s = Math.max(0.001, size);
  const s2 = Math.max(0.001, sizeY);
  const seg = Math.max(3, Math.floor(segments));
  switch (kind) {
    case "box":
      return <boxGeometry args={[s, s, s]} />;
    case "sphere":
      return <sphereGeometry args={[s / 2, seg, Math.max(3, Math.floor(seg / 2))]} />;
    case "torus":
      return <torusGeometry args={[s / 2, Math.min(s / 2, s2 / 2), Math.max(3, Math.floor(seg / 2)), seg]} />;
    case "plane":
      return <planeGeometry args={[s, s2]} />;
    case "cylinder":
      return <cylinderGeometry args={[s / 2, s / 2, s2, seg]} />;
    case "icosahedron":
      return <icosahedronGeometry args={[s / 2, 0]} />;
    default:
      return <boxGeometry args={[s, s, s]} />;
  }
};

/** Un clip 3D évalué au frame courant, rendu dans sa propre scène R3F. */
export const ThreeGraphicLayer: React.FC<{ clip: ThreeGraphicClip }> = ({ clip }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const localEnd = clip.startFrame + Math.max(clip.durationInFrames, 1);
  const visible = frame >= clip.startFrame && frame < localEnd;

  const evaluated = evaluateThreeGraphic(clip, frame);

  const { worldW, worldH } = worldMapping(width, height, evaluated.camera.z, evaluated.camera.fov);
  // Position : centre du canvas (0.5, 0.5) → origine monde.
  const worldX = (evaluated.x - 0.5) * worldW;
  const worldY = (0.5 - evaluated.y) * worldH;
  // Taille : `geometry.size` est une fraction de la LARGEUR du canvas.
  const objectSize = evaluated.geometry.size * worldW;

  const materialColor = evaluated.material.color;
  const opacity = Math.max(0, Math.min(1, evaluated.material.opacity * evaluated.opacity));
  const emissive = evaluated.material.emissive;
  const emissiveIntensity = evaluated.material.emissiveIntensity;

  // Le mesh est à l'origine de sa scène ; on positionne la CAMÉRA (relative au
  // clip) + les lumières. La rotation du clip s'applique au mesh.
  const cameraProps = useMemo(
    () => ({
      position: [evaluated.camera.x, evaluated.camera.y, evaluated.camera.z] as const,
      fov: evaluated.camera.fov,
    }),
    [evaluated.camera.x, evaluated.camera.y, evaluated.camera.z, evaluated.camera.fov],
  );

  const meshProps = useMemo(
    () => ({
      position: [worldX, worldY, evaluated.z] as const,
      rotation: [
        (evaluated.rotationX * Math.PI) / 180,
        (evaluated.rotationY * Math.PI) / 180,
        (evaluated.rotationZ * Math.PI) / 180,
      ] as const,
      scale: [evaluated.scaleX, evaluated.scaleY, evaluated.scaleZ] as const,
    }),
    [
      worldX,
      worldY,
      evaluated.z,
      evaluated.rotationX,
      evaluated.rotationY,
      evaluated.rotationZ,
      evaluated.scaleX,
      evaluated.scaleY,
      evaluated.scaleZ,
    ],
  );

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        zIndex: clip.zIndex,
        pointerEvents: "none",
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={cameraProps}
        gl={{ alpha: true, antialias: true }}
        style={{ width, height, background: "transparent" }}
      >
        {/* Éclairage (déterministe, intensities 0..1 → 0..3). */}
        <ambientLight intensity={evaluated.lighting.ambientIntensity} />
        <directionalLight
          position={[
            evaluated.lighting.directionalX,
            evaluated.lighting.directionalY,
            evaluated.lighting.directionalZ,
          ]}
          intensity={evaluated.lighting.directionalIntensity}
        />
        {evaluated.lighting.pointIntensity > 0 && (
          <pointLight
            position={[
              evaluated.lighting.pointX,
              evaluated.lighting.pointY,
              evaluated.lighting.pointZ,
            ]}
            intensity={evaluated.lighting.pointIntensity}
          />
        )}
        {/* L'objet : géométrie + matériau PBR déterministe. */}
        <mesh position={meshProps.position} rotation={meshProps.rotation} scale={meshProps.scale}>
          <ThreeGeometryMesh
            kind={evaluated.geometry.kind}
            size={objectSize}
            sizeY={evaluated.geometry.sizeY * worldW}
            segments={evaluated.geometry.segments}
          />
          <meshStandardMaterial
            color={materialColor}
            transparent={opacity < 1}
            opacity={opacity}
            metalness={evaluated.material.metalness}
            roughness={evaluated.material.roughness}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      </ThreeCanvas>
    </div>
  );
};
