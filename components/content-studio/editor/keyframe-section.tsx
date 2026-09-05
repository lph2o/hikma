// Hikma — Content Studio : SECTION KEYFRAMES (Inspector).
//
// UI de gestion des keyframes d'un clip graphique (texte ou forme), branchée
// sur le moteur PUR `lib/content-studio/editor/keyframes.ts` (porté d'OpenReel,
// MIT). Le temps des keyframes est LOCAL au clip (frames) ; l'évaluation
// `evaluateGraphicTransform(clip, frame)` est partagée Preview (overlay) et
// Render (Remotion) → PREVIEW == RENDER.
//
// Interactions :
//   - ◈ ajoute/supprime un keyframe au PLAYHEAD (valeur = valeur VISUELLE
//     courante : interpolée entre keyframes, sinon transform de base) ;
//   - chaque keyframe affiche son temps (clic = seek), sa valeur (édition
//     directe), son easing (select) et une suppression (✕) ;
//   - la barre du haut matérialise la durée du clip : diamants = keyframes,
//     trait = playhead, clic = seek.
//   - "Tout effacer" retire les keyframes du clip (retour au transform).

import React from "react";
import type { GraphicTransform } from "@/lib/content-studio/graphics/graphic-clip";
import {
  addKeyframe,
  getKeyframeValueAtTime,
  removeKeyframe,
  sortKeyframes,
  updateKeyframe,
  type HikmaKeyframe,
} from "@/lib/content-studio/editor/keyframes";

export interface KeyframeRow {
  property: string;
  label: string;
  valueOf: (t: GraphicTransform) => number;
  /** Convertit une valeur normalisée en valeur d'affichage (input). */
  toDisplay: (v: number) => number;
  /** Convertit la valeur d'affichage en valeur normalisée. */
  fromDisplay: (s: number) => number;
  step: number;
}

/**
 * Lignes par défaut (transform 2D : texte/forme). Les clips 3D fournissent
 * leurs propres lignes (position.x/y/z, rotation.x/y/z, scale.x/y/z, opacity)
 * via la prop `rows` — même moteur de keyframes partagé.
 */
const ROWS: KeyframeRow[] = [
  { property: "position.x", label: "X", valueOf: (t) => t.x, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "position.y", label: "Y", valueOf: (t) => t.y, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "scale.x", label: "Échelle X", valueOf: (t) => t.scaleX, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "scale.y", label: "Échelle Y", valueOf: (t) => t.scaleY, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
  { property: "rotation", label: "Rotation", valueOf: (t) => t.rotation, toDisplay: (v) => v, fromDisplay: (s) => s, step: 1 },
  { property: "opacity", label: "Opacité", valueOf: (t) => t.opacity, toDisplay: (v) => v * 100, fromDisplay: (s) => s / 100, step: 1 },
];

const EASING_OPTIONS: string[] = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "hold"];

/** Clip partiel — compatible texte ET forme (transform + keyframes). */
interface KeyframeClipLike {
  id: string;
  startFrame: number;
  durationInFrames: number;
  transform: GraphicTransform;
  keyframes?: readonly HikmaKeyframe[];
}

export function KeyframeSection({
  clip,
  frame,
  onUpdateKeyframes,
  onSeek,
  rows = ROWS,
}: {
  clip: KeyframeClipLike;
  /** Frame GLOBAL courant (playhead). */
  frame: number;
  onUpdateKeyframes: (keyframes: HikmaKeyframe[]) => void;
  /** Seek du playhead (pour « déplacer » un keyframe dans le temps). */
  onSeek?: (frame: number) => void;
  /** Lignes personnalisées (transform 3D par défaut pour les clips three). */
  rows?: readonly KeyframeRow[];
}) {
  const keyframes = clip.keyframes ?? [];
  const duration = Math.max(1, clip.durationInFrames);
  const localFrame = Math.max(0, Math.min(duration, frame - clip.startFrame));

  // Valeur VISUELLE d'une propriété à un instant local donné (interpolée).
  const evaluatedValue = (row: KeyframeRow, time: number): number => {
    const propertyKfs = sortKeyframes(keyframes.filter((kf) => kf.property === row.property));
    const { value } = getKeyframeValueAtTime(propertyKfs, time);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return row.valueOf(clip.transform);
  };

  const kfAt = (property: string, time: number): HikmaKeyframe | undefined =>
    keyframes.find((kf) => kf.property === property && kf.time === time);

  const toggleKeyframe = (row: KeyframeRow) => {
    const existing = kfAt(row.property, localFrame);
    if (existing) {
      onUpdateKeyframes(removeKeyframe(keyframes, existing.id));
      return;
    }
    onUpdateKeyframes(
      addKeyframe(keyframes, {
        id: crypto.randomUUID(),
        time: localFrame,
        property: row.property,
        value: evaluatedValue(row, localFrame),
        easing: "linear",
      }),
    );
  };

  const allSorted = sortKeyframes(keyframes);
  const pct = (time: number) => `${Math.max(0, Math.min(100, (time / duration) * 100))}%`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">
          {keyframes.length} keyframe{keyframes.length > 1 ? "s" : ""} — le Transform
          est piloté par les keyframes (Preview = MP4).
        </span>
        {keyframes.length > 0 && (
          <button
            type="button"
            onClick={() => onUpdateKeyframes([])}
            className="rounded-md border border-rose-500/30 bg-rose-950/30 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 hover:bg-rose-900/40"
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* ── Piste : durée du clip + diamants + playhead ── */}
      <div
        role="slider"
        aria-label="Timeline des keyframes du clip"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={Math.round(localFrame)}
        tabIndex={0}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onSeek?.(clip.startFrame + Math.round(frac * duration));
        }}
        className="relative h-7 cursor-crosshair touch-none rounded-lg border border-white/10 bg-black/40"
      >
        {/* Progression jusqu'au playhead */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-lg bg-hikma-teal-500/10"
          style={{ width: pct(localFrame) }}
        />
        {/* Diamants des keyframes */}
        {allSorted.map((kf) => (
          <button
            key={kf.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeek?.(clip.startFrame + kf.time);
            }}
            title={`${kf.property} @ ${kf.time}f — cliquer pour y aller`}
            className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border ${
              kfAt(kf.property, kf.time)
                ? "border-hikma-gold bg-hikma-gold shadow-[0_0_6px_rgba(245,212,122,0.7)]"
                : "border-white/60 bg-white/20"
            }`}
            style={{ left: pct(kf.time) }}
          />
        ))}
        {/* Playhead */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-white/80"
          style={{ left: pct(localFrame) }}
        />
        <span className="pointer-events-none absolute right-1 top-0.5 font-mono text-[8px] text-white/50">
          {Math.round(localFrame)}f / {duration}f
        </span>
      </div>

      {/* ── Lignes par propriété ── */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const propertyKfs = sortKeyframes(keyframes.filter((kf) => kf.property === row.property));
          const atPlayhead = kfAt(row.property, localFrame);
          return (
            <div key={row.property} className="flex flex-col gap-1 rounded-lg border border-white/6 bg-black/20 p-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-14 shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/45">
                  {row.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleKeyframe(row)}
                  title={
                    atPlayhead
                      ? "Supprimer le keyframe au playhead"
                      : `Ajouter un keyframe à ${Math.round(localFrame)}f (valeur courante)`
                  }
                  className={`flex size-5 items-center justify-center rounded-md border transition ${
                    atPlayhead
                      ? "border-hikma-gold/70 bg-hikma-gold/20 text-hikma-gold"
                      : "border-white/15 bg-black/30 text-white/40 hover:border-hikma-gold/60 hover:text-hikma-gold"
                  }`}
                >
                  <span className="inline-block size-1.5 rotate-45 rounded-[1px] bg-current" />
                </button>
                {propertyKfs.length === 0 && (
                  <span className="text-[9px] text-white/25">transform de base</span>
                )}
              </div>
              {propertyKfs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {propertyKfs.map((kf) => (
                    <span
                      key={kf.id}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-1 py-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => onSeek?.(clip.startFrame + kf.time)}
                        title="Aller à ce frame"
                        className="font-mono text-[9px] font-bold text-hikma-gold hover:underline"
                      >
                        {kf.time}f
                      </button>
                      <input
                        type="number"
                        min={0}
                        step={row.step}
                        value={Math.round(row.toDisplay(Number(kf.value)) * 100) / 100}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) return;
                          onUpdateKeyframes(
                            updateKeyframe(keyframes, kf.id, {
                              value: row.fromDisplay(n),
                            }),
                          );
                        }}
                        aria-label={`Valeur ${row.label} du keyframe ${kf.time}f`}
                        className="w-12 rounded border border-white/10 bg-black/60 px-1 py-0.5 font-mono text-[9px] text-white outline-none focus:border-hikma-teal-400"
                      />
                      <select
                        value={EASING_OPTIONS.includes(kf.easing) ? kf.easing : "linear"}
                        onChange={(e) =>
                          onUpdateKeyframes(
                            updateKeyframe(keyframes, kf.id, { easing: e.target.value as HikmaKeyframe["easing"] }),
                          )
                        }
                        aria-label={`Easing du keyframe ${kf.time}f`}
                        className="w-16 rounded border border-white/10 bg-black/60 px-0.5 py-0.5 text-[9px] text-white/70 outline-none"
                      >
                        {EASING_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-black">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => onUpdateKeyframes(removeKeyframe(keyframes, kf.id))}
                        aria-label={`Supprimer le keyframe ${kf.property} @ ${kf.time}f`}
                        title="Supprimer ce keyframe"
                        className="flex size-4 items-center justify-center rounded text-rose-400/70 hover:bg-rose-900/40 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
