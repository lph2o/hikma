"use client";

// Hikma — Content Studio : INSPECTOR AUDIO (Timeline Pro).
//
// Contrôles audio interactifs professionnels pour clips audio :
//   - Volume (0% à 100%) avec slider précis
//   - Sourdine (Mute ON / OFF)
//   - Fade in (0 à 60 frames / 2.0s)
//   - Fade out (0 à 60 frames / 2.0s)
//   - Audio start offset & durée réelle
//   - Prévisualisation du signal audio

import React from "react";
import {
  Volume2Icon,
  VolumeXIcon,
  MusicIcon,
  WavesIcon,
} from "lucide-react";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { cn } from "@/lib/utils";

type InspectorAudioProps = {
  scene: VideoScene;
  sceneIndex: number;
  fps?: number;
  onUpdateAudio: (patch: Partial<VideoScene>) => void;
};

export function InspectorAudio({
  scene,
  sceneIndex,
  fps = 30,
  onUpdateAudio,
}: InspectorAudioProps) {
  const volume = scene.audioVolume ?? 1;
  const isMuted = scene.audioMuted ?? false;
  const fadeIn = scene.audioFadeIn ?? 0;
  const fadeOut = scene.audioFadeOut ?? 0;
  const startFrom = scene.audioStartFrom ?? 0;
  const durSec = scene.audioDuration ?? scene.durationInFrames / fps;

  return (
    <div className="flex flex-col gap-5 p-4 text-xs text-white">
      {/* Header section audio */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-hikma-teal-500/30 bg-hikma-teal-600/20 text-hikma-teal-300">
            <MusicIcon className="size-3.5" />
          </span>
          <div>
            <h4 className="font-bold text-white">
              {scene.kind === "word" ? "Audio du mot" : scene.kind === "quran" ? "Récitation du verset" : "Piste Audio"}
            </h4>
            <span className="text-[10px] font-mono text-white/40">
              Scène {sceneIndex + 1} ({scene.kind}) · {durSec.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Mute toggle button */}
        <button
          type="button"
          onClick={() => onUpdateAudio({ audioMuted: !isMuted })}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition-colors",
            isMuted
              ? "border-rose-500/50 bg-rose-950/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
          )}
        >
          {isMuted ? <VolumeXIcon className="size-3 text-rose-400" /> : <Volume2Icon className="size-3 text-hikma-teal-400" />}
          <span>{isMuted ? "MUTÉ" : "ACTIF"}</span>
        </button>
      </div>

      {/* Signal audio mini-waveform & source info */}
      <div className="rounded-xl border border-white/8 bg-black/40 p-3">
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-2 font-mono">
          <span className="flex items-center gap-1 text-hikma-teal-300">
            <WavesIcon className="size-3" />
            Signal Source
          </span>
          <span>{scene.audioUrl ? "Connecté (128 kbps)" : "Aucun fichier"}</span>
        </div>

        {/* Visualizer bars */}
        <div className="flex h-7 items-center justify-between gap-0.5 rounded-lg bg-black/60 px-2 py-1 border border-white/5">
          {Array.from({ length: 28 }).map((_, i) => {
            const heightPct = Math.sin((i / 28) * Math.PI) * 70 + (i % 3) * 10 + 15;
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-200",
                  isMuted
                    ? "bg-white/10"
                    : "bg-gradient-to-t from-hikma-teal-600 to-hikma-gold/80",
                )}
                style={{ height: `${isMuted ? 15 : heightPct}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* 1. Volume Slider (P0) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="audio-volume-slider" className="text-[11px] font-semibold text-white/70">
            Volume ({Math.round(volume * 100)}%)
          </label>
          <span className="font-mono text-[10px] text-white/40">
            {(volume * 100).toFixed(0)} %
          </span>
        </div>
        <input
          id="audio-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          disabled={isMuted}
          value={volume}
          onChange={(e) => onUpdateAudio({ audioVolume: parseFloat(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-hikma-teal-400 disabled:opacity-30"
        />
      </div>

      {/* 2. Fade In & Fade Out (P0) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 rounded-xl border border-white/6 bg-white/3 p-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-white/60">Fade In</span>
            <span className="font-mono text-white/40">{(fadeIn / fps).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={fadeIn}
            onChange={(e) => onUpdateAudio({ audioFadeIn: parseInt(e.target.value, 10) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-hikma-teal-400"
          />
          <span className="text-[9px] font-mono text-white/30 text-right">{fadeIn} f</span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-xl border border-white/6 bg-white/3 p-2.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-white/60">Fade Out</span>
            <span className="font-mono text-white/40">{(fadeOut / fps).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={fadeOut}
            onChange={(e) => onUpdateAudio({ audioFadeOut: parseInt(e.target.value, 10) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-hikma-teal-400"
          />
          <span className="text-[9px] font-mono text-white/30 text-right">{fadeOut} f</span>
        </div>
      </div>

      {/* 3. Audio Start offset (P0) */}
      <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 p-2.5">
        <div>
          <span className="block text-[10px] font-medium text-white/60">Décalage source</span>
          <span className="text-[9px] text-white/30">Offset de lecture initial</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={startFrom <= 0}
            onClick={() => onUpdateAudio({ audioStartFrom: Math.max(0, startFrom - 5) })}
            className="flex size-6 items-center justify-center rounded border border-white/10 bg-white/5 font-mono text-xs hover:bg-white/10 disabled:opacity-20"
          >
            -5
          </button>
          <span className="font-mono text-xs text-white font-bold">{startFrom} f</span>
          <button
            type="button"
            onClick={() => onUpdateAudio({ audioStartFrom: startFrom + 5 })}
            className="flex size-6 items-center justify-center rounded border border-white/10 bg-white/5 font-mono text-xs hover:bg-white/10"
          >
            +5
          </button>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-[9px] font-bold uppercase text-white/30">Presets :</span>
        <button
          type="button"
          onClick={() => onUpdateAudio({ audioVolume: 1, audioMuted: false, audioFadeIn: 10, audioFadeOut: 15 })}
          className="rounded border border-white/8 bg-white/4 px-2 py-0.5 text-[9px] font-medium text-white/60 hover:bg-white/8 hover:text-white"
        >
          Doux (Fade)
        </button>
        <button
          type="button"
          onClick={() => onUpdateAudio({ audioVolume: 1, audioMuted: false, audioFadeIn: 0, audioFadeOut: 0 })}
          className="rounded border border-white/8 bg-white/4 px-2 py-0.5 text-[9px] font-medium text-white/60 hover:bg-white/8 hover:text-white"
        >
          Direct (Cut)
        </button>
      </div>
    </div>
  );
}
