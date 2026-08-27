"use client";

// Hikma — Content Studio (UI2.5) : BARRE DE TRANSPORT VIDÉO.
//
// Contrôles de lecture studio :
//   ‹   ▶   ›    00:12 / 00:42    [Volume / Mute]
//
// Bouton Play central = contrôle principal (accentué en teal).
// Zone tactile $\ge 44 \times 44$ px pour chaque action.

import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatClock(frame: number, fps: number): string {
  const total = Math.max(Math.floor(frame / fps), 0);
  const s = total % 60;
  const m = Math.floor(total / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TransportBar({
  frame,
  durationInFrames,
  fps,
  playing,
  muted,
  onPlayPause,
  onPrevScene,
  onNextScene,
  onMuteToggle,
  hasPrev,
  hasNext,
}: {
  frame: number;
  durationInFrames: number;
  fps: number;
  playing: boolean;
  muted: boolean;
  onPlayPause: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  onMuteToggle: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const current = formatClock(frame, fps);
  const total = formatClock(durationInFrames, fps);

  return (
    <div
      className="flex w-full items-center justify-between gap-2 px-3 py-1"
      role="toolbar"
      aria-label="Contrôles de lecture vidéo"
    >
      {/* Playback Controls (‹ ▶ ›) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrevScene}
          disabled={!hasPrev}
          aria-label="Scène précédente"
          className="flex size-11 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
        >
          <ChevronLeftIcon className="size-5" />
        </button>

        {/* Central Play/Pause Button */}
        <button
          type="button"
          onClick={onPlayPause}
          aria-label={playing ? "Pause (Espace)" : "Lecture (Espace)"}
          className={cn(
            "flex size-11 items-center justify-center rounded-xl font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-400",
            playing
              ? "bg-hikma-teal-600/30 text-hikma-teal-300 shadow-[inset_0_0_0_1px_rgba(59,160,140,0.4)]"
              : "bg-hikma-teal-600 text-white shadow-[0_0_16px_rgba(59,160,140,0.4)] hover:bg-hikma-teal-500 hover:shadow-[0_0_20px_rgba(59,160,140,0.6)]",
          )}
        >
          {playing ? (
            <PauseIcon className="size-5 fill-current" />
          ) : (
            <PlayIcon className="size-5 translate-x-0.5 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={onNextScene}
          disabled={!hasNext}
          aria-label="Scène suivante"
          className="flex size-11 items-center justify-center rounded-xl text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>

      {/* Center Timecode */}
      <div
        aria-label={`Position ${current} sur ${total}`}
        className="flex items-baseline gap-1.5 rounded-lg border border-white/6 bg-black/40 px-3 py-1 font-mono text-xs tabular-nums"
      >
        <span className="font-bold text-white/95">{current}</span>
        <span className="text-white/20">/</span>
        <span className="text-white/40">{total}</span>
      </div>

      {/* Mute toggle button */}
      <button
        type="button"
        onClick={onMuteToggle}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        className="flex size-11 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
      >
        {muted ? (
          <VolumeXIcon className="size-4.5 text-white/40" />
        ) : (
          <Volume2Icon className="size-4.5 text-hikma-teal-400" />
        )}
      </button>
    </div>
  );
}
