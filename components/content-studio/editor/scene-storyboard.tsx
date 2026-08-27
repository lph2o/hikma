"use client";

// Hikma — Content Studio (UI2.5) : STORYBOARD DES SCÈNES.
//
// Rails de scènes horizontal à défilement tactile :
//   - Miniature 9:16 déterministe
//   - Numéro séquentiel
//   - Statut de sélection (Halo teal/or)
//   - Statut de lecture en temps réel (Point pulsing)
//   - Durée précise en secondes

import React from "react";
import { CopyIcon, Trash2Icon } from "lucide-react";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { SceneThumbnail } from "./scene-thumbnail";
import { cn } from "@/lib/utils";

const SCENE_FALLBACK: Record<string, string> = {
  intro: "Intro",
  word: "Mot",
  meaning: "Sens",
  quran: "Coran",
  explanation: "Explication",
  cta: "CTA",
};

function sceneLabel(scene: VideoScene): string {
  if (scene.title) return scene.title;
  return SCENE_FALLBACK[scene.kind] ?? scene.kind;
}

type SceneStoryboardProps = {
  scenes: VideoScene[];
  activeIndex: number;
  fps: number;
  currentFrame: number;
  starts: number[];
  onSelect: (index: number) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
};

export function SceneStoryboard({
  scenes,
  activeIndex,
  fps,
  currentFrame,
  starts,
  onSelect,
  onDuplicate,
  onRemove,
  canRemove,
}: SceneStoryboardProps) {
  return (
    <div
      role="group"
      aria-label="Storyboard des scènes"
      className="flex min-w-0 items-end gap-2.5 overflow-x-auto px-3 py-2"
      style={{ scrollbarWidth: "none" }}
    >
      {scenes.map((scene, i) => {
        const isActive = activeIndex === i;
        const isPlaying =
          currentFrame >= starts[i] &&
          currentFrame < starts[i] + scene.durationInFrames;
        const dur = (scene.durationInFrames / fps).toFixed(1);

        return (
          <div
            key={`${scene.kind}-${i}`}
            className="group relative flex shrink-0 flex-col gap-1.5"
            style={{ width: 76 }}
          >
            {/* Header: Scene # & Playing Indicator */}
            <div className="flex items-center justify-between px-1">
              <span
                className={cn(
                  "font-mono text-[10px] font-bold",
                  isActive ? "text-hikma-teal-300" : "text-white/30",
                )}
              >
                #{String(i + 1).padStart(2, "0")}
              </span>
              {isPlaying && (
                <span
                  aria-label="En cours de lecture"
                  className="flex size-2 rounded-full bg-hikma-teal-400 shadow-[0_0_8px_theme(colors.hikma-teal-400)] animate-pulse"
                />
              )}
            </div>

            {/* Thumbnail Card Button */}
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-pressed={isActive}
              aria-label={`Sélectionner la scène ${sceneLabel(scene)}`}
              className={cn(
                "relative w-full rounded-xl p-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-400",
                isActive
                  ? "bg-gradient-to-b from-hikma-teal-400 to-hikma-gold shadow-[0_0_16px_rgba(59,160,140,0.35)] scale-[1.02]"
                  : "opacity-70 hover:opacity-100 hover:scale-[1.01]",
              )}
            >
              <div className="rounded-[10px] overflow-hidden">
                <SceneThumbnail scene={scene} size="md" />
              </div>
            </button>

            {/* Footer Label + Duration */}
            <div className="flex flex-col items-center gap-0.5 px-0.5">
              <span
                className={cn(
                  "max-w-full truncate text-center text-[10px] font-bold tracking-tight",
                  isActive ? "text-white" : "text-white/50",
                )}
              >
                {sceneLabel(scene)}
              </span>
              <span className="font-mono text-[9px] text-white/30">{dur}s</span>
            </div>

            {/* Hover Actions (Duplicate / Delete) */}
            <div className="absolute -right-1 -top-1 hidden gap-1 z-10 group-hover:flex">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(i);
                }}
                aria-label={`Dupliquer ${sceneLabel(scene)}`}
                className="flex size-6 items-center justify-center rounded-lg border border-white/10 bg-black/80 text-white/70 shadow-lg backdrop-blur hover:text-white"
              >
                <CopyIcon className="size-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                disabled={!canRemove}
                aria-label={`Supprimer ${sceneLabel(scene)}`}
                className="flex size-6 items-center justify-center rounded-lg border border-white/10 bg-black/80 text-rose-400 shadow-lg backdrop-blur hover:text-rose-300 disabled:pointer-events-none disabled:opacity-20"
              >
                <Trash2Icon className="size-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
