// Hikma — Content Studio : PANNEAU GRAPHIQUES 3D (Inspector).
//
// Crée/édite/supprime des ThreeGraphicClip (couche 3D additive via
// @react-three/fiber + @remotion/three). Chaque champ est RÉELLEMENT branché :
// une modification ici est immédiatement visible dans le Preview (même
// évaluation pure `evaluateThreeGraphic` que le rendu MP4) et persistée dans
// editor_state.graphics. Aucun rendu automatique — uniquement l'état.
//
// Sections repliables (l'Inspector ne grandit jamais indéfiniment) :
//   FORME (géométrie + matériau) · TRANSFORM (x/y/z, rotation, scale) ·
//   LUMIÈRE · CAMÉRA · KEYFRAMES (position/rotation/scale/opacity).

import React from "react";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import { KeyframeSection, type KeyframeRow } from "@/components/content-studio/editor/keyframe-section";
import {
  THREE_GEOMETRY_KINDS,
  THREE_GEOMETRY_LABELS,
  type ThreeGraphicClip,
} from "@/lib/content-studio/graphics/three-graphic";

const isThreeClip = (clip: GraphicClipBase): clip is ThreeGraphicClip =>
  clip.kind === "three";

/** Lignes de keyframes 3D (même moteur que texte/formes). */
const THREE_KF_ROWS: KeyframeRow[] = [
  { property: "position.x", label: "Pos X", valueOf: (t) => t.x, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "position.y", label: "Pos Y", valueOf: (t) => t.y, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "position.z", label: "Pos Z", valueOf: (t) => (t as ThreeGraphicClip["transform"]).z, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "rotation.x", label: "Rot X", valueOf: (t) => (t as ThreeGraphicClip["transform"]).rotationX, toDisplay: (v) => v, fromDisplay: (s) => s, step: 1 },
  { property: "rotation.y", label: "Rot Y", valueOf: (t) => (t as ThreeGraphicClip["transform"]).rotationY, toDisplay: (v) => v, fromDisplay: (s) => s, step: 1 },
  { property: "rotation.z", label: "Rot Z", valueOf: (t) => (t as ThreeGraphicClip["transform"]).rotationZ, toDisplay: (v) => v, fromDisplay: (s) => s, step: 1 },
  { property: "scale.x", label: "Éch X", valueOf: (t) => t.scaleX, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "scale.y", label: "Éch Y", valueOf: (t) => t.scaleY, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "scale.z", label: "Éch Z", valueOf: (t) => (t as ThreeGraphicClip["transform"]).scaleZ, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "opacity", label: "Opacité", valueOf: (t) => t.opacity, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
];

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-t border-white/8 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/35 transition-colors hover:text-white/60"
      >
        <span>{title}</span>
        <span className="font-mono text-[10px] text-white/25">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="mt-1">{children}</div>}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  const display = Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  return (
    <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
      <span>
        {label} {suffix && <span className="text-white/30">{suffix}</span>}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={display}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-hikma-teal-400 disabled:opacity-40"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";
  return (
    <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
      {label}
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-lg border border-white/10 bg-black/40"
      />
    </label>
  );
}

function PercentField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "%",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const pct = Math.round(Math.max(min, Math.min(max, (Number.isFinite(value) ? value : 0) * 100)));
  return (
    <label className="flex flex-col gap-0.5 text-[10px] text-white/50">
      <span>
        {label} {pct}
        {suffix}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="accent-hikma-teal-500"
      />
    </label>
  );
}

/** Éditeur COMPLET d'un clip 3D (un seul à la fois : le sélectionné). */
function ThreeClipEditor({
  clip,
  onUpdate,
  frame = 0,
  onSeek,
}: {
  clip: ThreeGraphicClip;
  onUpdate: (id: string, patch: Partial<ThreeGraphicClip>) => void;
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  const tr = clip.transform;
  const g = clip.geometry;
  const m = clip.material;
  const l = clip.lighting;
  const c = clip.camera;

  return (
    <div className="mt-2">
      {/* ── FORME (géométrie + matériau) ── */}
      <CollapsibleSection title="Forme" defaultOpen>
        <label className="mb-1 flex flex-col gap-0.5 text-[10px] text-white/50">
          Type
          <select
            value={g.kind}
            onChange={(e) =>
              onUpdate(clip.id, { geometry: { ...g, kind: e.target.value as ThreeGraphicClip["geometry"]["kind"] } })
            }
            className="w-full rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-hikma-teal-400"
          >
            {THREE_GEOMETRY_KINDS.map((k) => (
              <option key={k} value={k} className="bg-black">
                {THREE_GEOMETRY_LABELS[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Taille"
            value={g.size}
            min={0.05}
            max={3}
            step={0.05}
            onChange={(v) => onUpdate(clip.id, { geometry: { ...g, size: v } })}
          />
          <NumberField
            label="Taille Y"
            value={g.sizeY}
            min={0.02}
            max={3}
            step={0.05}
            onChange={(v) => onUpdate(clip.id, { geometry: { ...g, sizeY: v } })}
          />
          <NumberField
            label="Segments"
            value={g.segments}
            min={3}
            max={128}
            step={1}
            onChange={(v) => onUpdate(clip.id, { geometry: { ...g, segments: Math.max(3, Math.floor(v)) } })}
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ColorField label="Couleur" value={m.color} onChange={(c) => onUpdate(clip.id, { material: { ...m, color: c } })} />
          <ColorField label="Émissive" value={m.emissive} onChange={(c) => onUpdate(clip.id, { material: { ...m, emissive: c } })} />
          <PercentField
            label="Opacité"
            value={m.opacity}
            onChange={(v) => onUpdate(clip.id, { material: { ...m, opacity: v } })}
          />
          <PercentField
            label="Intensité émissive"
            value={Math.min(1, m.emissiveIntensity)}
            onChange={(v) => onUpdate(clip.id, { material: { ...m, emissiveIntensity: v * 5 } })}
          />
          <PercentField label="Métal" value={m.metalness} onChange={(v) => onUpdate(clip.id, { material: { ...m, metalness: v } })} />
          <PercentField label="Rugosité" value={m.roughness} onChange={(v) => onUpdate(clip.id, { material: { ...m, roughness: v } })} />
        </div>
      </CollapsibleSection>

      {/* ── TRANSFORM (position/rotation/scale 3D) ── */}
      <CollapsibleSection title="Transform">
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="X" value={tr.x} min={-5} max={6} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, x: v } })} />
          <NumberField label="Y" value={tr.y} min={-5} max={6} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, y: v } })} />
          <NumberField label="Z" value={tr.z} min={-3} max={3} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, z: v } })} />
          <NumberField label="Rotation X" value={tr.rotationX} min={-3600} max={3600} step={1} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, rotationX: v } })} />
          <NumberField label="Rotation Y" value={tr.rotationY} min={-3600} max={3600} step={1} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, rotationY: v } })} />
          <NumberField label="Rotation Z" value={tr.rotationZ} min={-3600} max={3600} step={1} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, rotationZ: v } })} />
          <NumberField label="Échelle X" value={tr.scaleX} min={0} max={10} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, scaleX: v } })} />
          <NumberField label="Échelle Y" value={tr.scaleY} min={0} max={10} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, scaleY: v } })} />
          <NumberField label="Échelle Z" value={tr.scaleZ} min={0} max={10} step={0.01} onChange={(v) => onUpdate(clip.id, { transform: { ...tr, scaleZ: v } })} />
        </div>
      </CollapsibleSection>

      {/* ── LUMIÈRE ── */}
      <CollapsibleSection title="Lumière">
        <div className="grid grid-cols-2 gap-2">
          <PercentField label="Ambiante" value={l.ambientIntensity} max={300} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, ambientIntensity: v * 3 } })} />
          <PercentField label="Directionnelle" value={l.directionalIntensity} max={300} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, directionalIntensity: v * 3 } })} />
          <NumberField label="Dir X" value={l.directionalX} min={-10} max={10} step={0.1} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, directionalX: v } })} />
          <NumberField label="Dir Y" value={l.directionalY} min={-10} max={10} step={0.1} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, directionalY: v } })} />
          <NumberField label="Dir Z" value={l.directionalZ} min={-10} max={10} step={0.1} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, directionalZ: v } })} />
          <PercentField label="Point" value={l.pointIntensity} max={500} onChange={(v) => onUpdate(clip.id, { lighting: { ...l, pointIntensity: v * 5 } })} />
        </div>
      </CollapsibleSection>

      {/* ── CAMÉRA ── */}
      <CollapsibleSection title="Caméra">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="FOV" value={c.fov} min={10} max={120} step={1} onChange={(v) => onUpdate(clip.id, { camera: { ...c, fov: v } })} />
          <NumberField label="Distance" value={c.z} min={0.5} max={20} step={0.1} onChange={(v) => onUpdate(clip.id, { camera: { ...c, z: v } })} />
          <NumberField label="Cam X" value={c.x} min={-10} max={10} step={0.1} onChange={(v) => onUpdate(clip.id, { camera: { ...c, x: v } })} />
          <NumberField label="Cam Y" value={c.y} min={-10} max={10} step={0.1} onChange={(v) => onUpdate(clip.id, { camera: { ...c, y: v } })} />
        </div>
      </CollapsibleSection>

      {/* ── KEYFRAMES 3D (même moteur partagé) ── */}
      <CollapsibleSection title="Keyframes">
        <KeyframeSection
          clip={{ ...clip, transform: tr }}
          frame={frame}
          rows={THREE_KF_ROWS}
          onUpdateKeyframes={(keyframes) => onUpdate(clip.id, { keyframes })}
          onSeek={onSeek}
        />
      </CollapsibleSection>
    </div>
  );
}

export function ThreePanel({
  graphics,
  selectedId = null,
  onSelect,
  onAddThree,
  onUpdateThree,
  onRemove,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  frame = 0,
  onSeek,
}: {
  graphics: readonly GraphicClipBase[];
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onAddThree: (geometry?: ThreeGraphicClip["geometry"]["kind"]) => void;
  onUpdateThree: (id: string, patch: Partial<ThreeGraphicClip>) => void;
  onRemove: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  frame?: number;
  onSeek?: (frame: number) => void;
}) {
  const clips = graphics.filter(isThreeClip);
  return (
    <section className="border-t border-white/8 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/90">
          Graphiques · 3D
        </span>
        <span className="text-[9px] text-white/30">{clips.length} clip(s)</span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {THREE_GEOMETRY_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAddThree(kind)}
            className="rounded-lg border border-white/10 bg-black/30 px-1.5 py-1.5 text-[9px] font-bold text-white/70 transition hover:border-violet-400/50 hover:text-violet-200"
          >
            {THREE_GEOMETRY_LABELS[kind] ?? kind}
          </button>
        ))}
      </div>

      {clips.length === 0 ? (
        <p className="text-[11px] text-white/40">
          Cliquez sur un objet 3D pour l&apos;ajouter à la scène (rendu WebGL
          déterministe — Preview = MP4).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {clips.map((clip) => {
            const isSelected = selectedId === clip.id;
            return (
              <li
                key={clip.id}
                className={`rounded-xl border p-2 transition-colors ${
                  isSelected
                    ? "border-violet-400/50 bg-violet-950/20"
                    : "border-white/8 bg-black/30"
                }`}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSelect?.(isSelected ? null : clip.id)}
                    title={isSelected ? "Replier l'éditeur" : "Modifier cet objet 3D"}
                    className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-1 text-left hover:bg-white/5"
                  >
                    <span className="truncate font-mono text-[9px] uppercase tracking-wider text-white/40">
                      {THREE_GEOMETRY_LABELS[clip.geometry.kind] ?? clip.geometry.kind} · {clip.startFrame}f
                    </span>
                    <span className={`ml-auto text-[10px] ${isSelected ? "text-violet-300" : "text-white/30"}`}>
                      {isSelected ? "▾" : "▸"}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    {onBringToFront && (
                      <button
                        type="button"
                        onClick={() => onBringToFront(clip.id)}
                        aria-label="Mettre l'objet 3D au premier plan"
                        title="Premier plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤴
                      </button>
                    )}
                    {onSendToBack && (
                      <button
                        type="button"
                        onClick={() => onSendToBack(clip.id)}
                        aria-label="Envoyer l'objet 3D en arrière-plan"
                        title="Arrière-plan"
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⤵
                      </button>
                    )}
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => onDuplicate(clip.id)}
                        aria-label={`Dupliquer l'objet 3D ${clip.geometry.kind}`}
                        className="flex size-6 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        ⧉
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(clip.id)}
                      aria-label={`Supprimer l'objet 3D ${clip.geometry.kind}`}
                      className="flex size-6 items-center justify-center rounded-md text-rose-400/60 hover:bg-rose-900/30 hover:text-rose-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <ThreeClipEditor clip={clip} onUpdate={onUpdateThree} frame={frame} onSeek={onSeek} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
