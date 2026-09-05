"use client";

// Hikma — Content Studio : TIMELINE PRO NLE (UI2.5).
//
// Timeline de montage inspirée des NLE modernes (Premiere / DaVinci Resolve) :
//   - PISTE V1 : Clips vidéo avec Trim In (gauche), Trim Out (droite), Move et Split
//   - PISTES A1 & A2 : Pistes audio synchronisées avec volume, mute et durées réelles
//   - MODES D'ÉDITION : Select, Trim, Ripple (avec switch instantané)
//   - TRIM FRAME-ACCURATE : handles tactiles larges (≥14px), col-resize, clamp >= 1 frame
//   - SNAP MAGNÉTIQUE (🧲) : alignement aux coupes de scènes, pistes et playhead (±6 frames)
//   - SPLIT (✂) : coupe au playhead (⌘K)
//   - NUDGE CLAVIER : ← / → (±1 frame), Shift+← / Shift+→ (±5 frames)
//   - AUTO-SCROLL : défilement automatique pendant le playback
//   - TRACK LOCK (🔒) & MUTE (🔇) sur chaque piste
//   - ZOOM PRÉCIS : 0.75x à 3x + Fit timeline
//   - PLAYHEAD DORÉ : scrubbing fluide multi-pistes, timecode frame-accurate.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ZoomInIcon,
  ZoomOutIcon,
  Volume2Icon,
  VolumeXIcon,
  LockIcon,
  UnlockIcon,
  ScissorsIcon,
  MagnetIcon,
  LayersIcon,
  MoveIcon,
  Maximize2Icon,
  RotateCcwIcon,
  RotateCwIcon,
} from "lucide-react";
import type { VideoScene } from "@/lib/content-studio/video/types";
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
import {
  computeSnapPoints,
  snapToPoints,
  splitScene,
  nudgeSceneDuration,
  moveGraphicClip,
} from "@/lib/content-studio/editor/timeline-ops";
import { cn } from "@/lib/utils";

const GRAPHIC_LABEL: Record<string, string> = {
  text: "Texte",
  shape: "Forme",
  svg: "SVG",
  sticker: "Sticker",
  background: "Fond",
  three: "3D",
};

function graphicLabel(c: GraphicClipBase): string {
  if (c.kind === "text") {
    const t = (c as unknown as { text?: string; source?: { sceneIndex: number; field: string } }).text ?? "";
    const label = `Texte${t ? ` : “${t.slice(0, 14)}”` : ""}`;
    // Texte hérité promu (source scène) — même clip, même piste G1.
    return (c as { source?: { sceneIndex: number; field: string } }).source
      ? `Scène · ${label}`
      : label;
  }
  if (c.kind === "shape") {
    const s = (c as unknown as { shape?: string }).shape ?? "";
    return `Forme : ${s}`;
  }
  return GRAPHIC_LABEL[c.kind] ?? c.kind;
}

const CLIP_BG: Record<string, string> = {
  intro: "rgba(61, 158, 138, 0.32)",
  word: "rgba(201, 168, 76, 0.40)",
  meaning: "rgba(74, 148, 168, 0.32)",
  quran: "rgba(61, 140, 86, 0.35)",
  explanation: "rgba(122, 112, 184, 0.32)",
  cta: "rgba(201, 168, 76, 0.45)",
};

const CLIP_BORDER: Record<string, string> = {
  intro: "rgba(61, 158, 138, 0.7)",
  word: "rgba(201, 168, 76, 0.85)",
  meaning: "rgba(74, 148, 168, 0.7)",
  quran: "rgba(61, 140, 86, 0.75)",
  explanation: "rgba(122, 112, 184, 0.7)",
  cta: "rgba(201, 168, 76, 0.9)",
};

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

function formatTime(frames: number, fps: number): string {
  const s = frames / fps;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const framePart = Math.floor(frames % fps);
  return `${String(m).padStart(2, "0")}:${String(Math.floor(sec)).padStart(2, "0")}.${String(framePart).padStart(2, "0")}`;
}

export type TimelineMode = "SELECT" | "TRIM" | "RIPPLE";

type TimelineProps = {
  scenes: VideoScene[];
  activeIndex: number;
  frame: number;
  durationInFrames: number;
  fps: number;
  starts: number[];
  playing?: boolean;
  onSeek: (frame: number) => void;
  onSelectScene: (index: number) => void;
  onScenesChange?: (scenes: VideoScene[]) => void;
  /** Clips graphiques (texte, formes…) — piste G1. */
  graphics?: GraphicClipBase[];
  /** Clip graphique sélectionné (id). */
  selectedGraphicId?: string | null;
  onSelectGraphic?: (id: string | null) => void;
  onGraphicsChange?: (clips: GraphicClipBase[]) => void;
};

export function Timeline({
  scenes,
  activeIndex,
  frame,
  durationInFrames,
  fps,
  starts,
  playing = false,
  onSeek,
  onSelectScene,
  onScenesChange,
  graphics = [],
  selectedGraphicId = null,
  onSelectGraphic,
  onGraphicsChange,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Modes & Tools
  const [editMode, setEditMode] = useState<TimelineMode>("SELECT");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState<number>(1); // 0.75x, 1x, 1.5x, 2x, 3x

  // Track locks & mutes
  const [videoLocked, setVideoLocked] = useState(false);
  const [audioWordLocked, setAudioWordLocked] = useState(false);
  const [audioVerseLocked, setAudioVerseLocked] = useState(false);
  const [audioWordMuted, setAudioWordMuted] = useState(false);
  const [audioVerseMuted, setAudioVerseMuted] = useState(false);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<VideoScene[][]>([]);
  const [redoStack, setRedoStack] = useState<VideoScene[][]>([]);

  // Dragging states
  const dragMode = useRef<"playhead" | "trim-in" | "trim-out" | "move" | "g-move" | "g-trim-in" | "g-trim-out" | null>(null);
  const dragSceneIndex = useRef<number>(-1);
  const dragStartX = useRef<number>(0);
  const dragStartDuration = useRef<number>(0);
  const dragGraphicId = useRef<string | null>(null);
  // Snapshots AU DÉBUT du drag : le delta (depuis dragStartX) est TOUJOURS
  // appliqué au snapshot, jamais à l'état courant re-rendu — sinon chaque
  // pointermove ajoute le delta cumulé à une valeur déjà décalée (trim/move
  // 2×, 3×… trop rapide). Même règle que l'overlay canvas.
  const dragSceneSnapshot = useRef<{ durationInFrames: number } | null>(null);
  const dragGraphicSnapshot = useRef<{ startFrame: number; durationInFrames: number } | null>(null);
  // Échelle FIGÉE au début du drag (px/frame). Pendant un trim, la durée totale
  // change (layout flexbox proportionnel) ⇒ `rect.width / durationInFrames` se
  // re-calibrerait à chaque move et fausserait le mapping pixels → frames.
  const dragPxPerFrame = useRef<number>(0);

  // Push to history before mutating
  const pushHistory = useCallback(
    (nextScenes: VideoScene[]) => {
      setHistory((prev) => [...prev.slice(-30), scenes]);
      setRedoStack([]);
      onScenesChange?.(nextScenes);
    },
    [scenes, onScenesChange],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, scenes]);
    onScenesChange?.(prev);
  }, [history, scenes, onScenesChange]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, scenes]);
    onScenesChange?.(next);
  }, [redoStack, scenes, onScenesChange]);

  // Points de snap calculés
  const snapPoints = useMemo(
    () => computeSnapPoints(scenes, starts, frame),
    [scenes, starts, frame],
  );

  // Conversion pixel clientX -> frame
  const xToFrame = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let targetFrame = Math.round(pct * durationInFrames);

      if (snapEnabled) {
        targetFrame = snapToPoints(targetFrame, snapPoints);
      }
      return Math.max(0, Math.min(durationInFrames, targetFrame));
    },
    [durationInFrames, snapEnabled, snapPoints],
  );

  // Échelle pixels → frames FIGÉE au début d'un drag (trim/move). La durée
  // totale change pendant un trim ⇒ une échelle recalculée à chaque move
  // déformerait le mapping (déplacement trop rapide / lent).
  const snapshotPxPerFrame = (): number => {
    const el = trackRef.current;
    if (!el) return 0;
    return el.getBoundingClientRect().width / Math.max(1, durationInFrames);
  };

  // Auto-scroll pendant playback
  useEffect(() => {
    if (!playing || !containerRef.current || durationInFrames === 0) return;
    const container = containerRef.current;
    const playheadRatio = frame / durationInFrames;
    const scrollTarget = playheadRatio * container.scrollWidth - container.clientWidth / 2;
    if (Math.abs(container.scrollLeft - scrollTarget) > 120) {
      container.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }, [frame, playing, durationInFrames]);

  // Handle Split
  const handleSplitAtPlayhead = useCallback(() => {
    if (videoLocked || activeIndex < 0 || activeIndex >= scenes.length) return;
    const next = splitScene(scenes, activeIndex, frame, starts);
    if (next !== scenes) {
      pushHistory(next);
    }
  }, [videoLocked, activeIndex, scenes, frame, starts, pushHistory]);

  // Raccourcis clavier (S pour snap, ⌘Z / ⌘Shift+Z, Nudge ←/→)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      // Snap toggle (S)
      if (e.key === "s" || e.key === "S") {
        if (!e.metaKey && !e.ctrlKey) {
          setSnapEnabled((s) => !s);
        }
      }

      // Split at playhead (⌘K or K)
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        handleSplitAtPlayhead();
      }

      // Undo (⌘Z)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
      }

      // Redo (⌘Shift+Z or ⌘Y)
      if ((e.metaKey || e.ctrlKey) && (e.shiftKey && (e.key === "z" || e.key === "Z") || e.key === "y")) {
        e.preventDefault();
        handleRedo();
      }

      // Nudge (← / →) : scène active ou clip graphique sélectionné
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const delta = e.key === "ArrowLeft" ? -step : step;
        if (selectedGraphicId && onGraphicsChange) {
          onGraphicsChange(moveGraphicClip(graphics, selectedGraphicId, delta));
        } else if (activeIndex >= 0 && activeIndex < scenes.length && !videoLocked) {
          const updated = nudgeSceneDuration(scenes, activeIndex, delta);
          pushHistory(updated);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, scenes, videoLocked, handleUndo, handleRedo, pushHistory, handleSplitAtPlayhead, graphics, selectedGraphicId, onGraphicsChange]);

  // Drag playhead
  const handlePlayheadPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = "playhead";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(xToFrame(e.clientX));
  };

  // Drag Trim In (Left edge)
  const handleTrimInPointerDown = (e: React.PointerEvent, index: number) => {
    if (videoLocked) return;
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = "trim-in";
    dragSceneIndex.current = index;
    dragStartX.current = e.clientX;
    dragStartDuration.current = scenes[index].durationInFrames;
    dragSceneSnapshot.current = { durationInFrames: scenes[index].durationInFrames };
    dragPxPerFrame.current = snapshotPxPerFrame();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Drag Trim Out (Right edge)
  const handleTrimOutPointerDown = (e: React.PointerEvent, index: number) => {
    if (videoLocked) return;
    e.preventDefault();
    e.stopPropagation();
    dragMode.current = "trim-out";
    dragSceneIndex.current = index;
    dragStartX.current = e.clientX;
    dragStartDuration.current = scenes[index].durationInFrames;
    dragSceneSnapshot.current = { durationInFrames: scenes[index].durationInFrames };
    dragPxPerFrame.current = snapshotPxPerFrame();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragMode.current) return;

    if (dragMode.current === "playhead") {
      onSeek(xToFrame(e.clientX));
      return;
    }

    const el = trackRef.current;
    if (!el) return;
    // Échelle du drag : FIGÉE au pointerdown (dragPxPerFrame), fallback calcul
    // direct si absente. Ne JAMAIS recalculer pendant le drag (la durée totale
    // change pendant un trim ⇒ l'échelle vivante fausserait le mapping).
    const pxPerFrame = dragPxPerFrame.current > 0 ? dragPxPerFrame.current : el.getBoundingClientRect().width / durationInFrames;
    const deltaX = e.clientX - dragStartX.current;
    const deltaFrames = Math.round(deltaX / pxPerFrame);

    // --- Clip GRAPHIQUE (piste G1) : move / trim ---
    if (
      dragMode.current === "g-move" ||
      dragMode.current === "g-trim-in" ||
      dragMode.current === "g-trim-out"
    ) {
      const gid = dragGraphicId.current;
      const gsnap = dragGraphicSnapshot.current;
      if (!gid || !gsnap || !onGraphicsChange) return;
      if (dragMode.current === "g-move") {
        // startFrame ABSOLU depuis le snapshot (le delta cumulé ne doit jamais
        // s'ajouter à l'état courant : déplacement 1:1 avec le pointeur).
        onGraphicsChange(
          graphics.map((c) =>
            c.id === gid ? { ...c, startFrame: Math.max(0, gsnap.startFrame + deltaFrames) } : c,
          ),
        );
      } else if (dragMode.current === "g-trim-out") {
        onGraphicsChange(
          graphics.map((c) =>
            c.id === gid
              ? { ...c, durationInFrames: Math.max(1, gsnap.durationInFrames + deltaFrames) }
              : c,
          ),
        );
      } else {
        onGraphicsChange(
          graphics.map((c) => {
            if (c.id !== gid) return c;
            const newDuration = Math.max(1, gsnap.durationInFrames - deltaFrames);
            const actualDelta = gsnap.durationInFrames - newDuration;
            return {
              ...c,
              startFrame: Math.max(0, gsnap.startFrame + actualDelta),
              durationInFrames: newDuration,
            };
          }),
        );
      }
      return;
    }

    const idx = dragSceneIndex.current;
    if (idx < 0 || idx >= scenes.length) return;

    const isRipple = editMode === "RIPPLE";

    if (dragMode.current === "trim-out") {
      // Durée ABSOLUE depuis le snapshot (jamais depuis l'état courant) :
      // sans snapshot, le delta cumulé s'ajouterait à chaque move → 2× trop vite.
      const snap = dragSceneSnapshot.current;
      if (!snap) return;
      const newDuration = Math.max(1, snap.durationInFrames + deltaFrames);
      const next = scenes.map((s, i) => (i === idx ? { ...s, durationInFrames: newDuration } : s));
      onScenesChange?.(next);
    } else if (dragMode.current === "trim-in") {
      const snap = dragSceneSnapshot.current;
      if (!snap) return;
      const newDuration = Math.max(1, snap.durationInFrames - deltaFrames);
      const actualDelta = snap.durationInFrames - newDuration;
      const next = scenes.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, durationInFrames: newDuration };
      });
      // Ripple : compense les scènes PRÉCÉDENTES pour stabiliser la fin.
      if (isRipple && actualDelta !== 0) {
        return onScenesChange?.(
          next.map((s, i) => {
            if (i >= idx) return s;
            const d = Math.max(1, s.durationInFrames + actualDelta);
            return { ...s, durationInFrames: d };
          }),
        );
      }
      onScenesChange?.(next);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode.current && dragMode.current !== "playhead") {
      if (
        dragMode.current === "g-move" ||
        dragMode.current === "g-trim-in" ||
        dragMode.current === "g-trim-out"
      ) {
        // Le clip graphique a déjà été appliqué via onGraphicsChange pendant le drag.
        dragMode.current = null;
        dragGraphicId.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        return;
      }
      pushHistory(scenes);
    }
    dragMode.current = null;
    dragSceneIndex.current = -1;
    dragGraphicId.current = null;
    dragSceneSnapshot.current = null;
    dragGraphicSnapshot.current = null;
    dragPxPerFrame.current = 0;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Handlers de drag des clips graphiques (piste G1)
  const handleGraphicPointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectGraphic?.(id);
    dragMode.current = "g-move";
    dragGraphicId.current = id;
    dragStartX.current = e.clientX;
    const g = graphics.find((c) => c.id === id);
    dragGraphicSnapshot.current = g
      ? { startFrame: g.startFrame, durationInFrames: g.durationInFrames }
      : null;
    dragPxPerFrame.current = snapshotPxPerFrame();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleGraphicTrimInDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectGraphic?.(id);
    dragMode.current = "g-trim-in";
    dragGraphicId.current = id;
    dragStartX.current = e.clientX;
    const g = graphics.find((c) => c.id === id);
    dragGraphicSnapshot.current = g
      ? { startFrame: g.startFrame, durationInFrames: g.durationInFrames }
      : null;
    dragPxPerFrame.current = snapshotPxPerFrame();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleGraphicTrimOutDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectGraphic?.(id);
    dragMode.current = "g-trim-out";
    dragGraphicId.current = id;
    dragStartX.current = e.clientX;
    const g = graphics.find((c) => c.id === id);
    dragGraphicSnapshot.current = g
      ? { startFrame: g.startFrame, durationInFrames: g.durationInFrames }
      : null;
    dragPxPerFrame.current = snapshotPxPerFrame();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Audio tracks — TOUS les clips audio mot (formats en série comme Speed
  // Vocab : chaque scène « Mot N/5 » possède SA prononciation), pas seulement
  // le premier. Le verset reste un clip unique (récitation continue).
  const wordSceneIndexes = scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.kind === "word" && s.audioUrl)
    .map(({ i }) => i);
  const verseSceneIndex = scenes.findIndex((s) => s.kind === "quran" && s.audioUrl);

  const verseTrack = verseSceneIndex >= 0 ? scenes[verseSceneIndex] : null;

  const playheadPct = durationInFrames > 0 ? (frame / durationInFrames) * 100 : 0;
  const baseWidth = Math.max(760, scenes.length * 130 * zoom);

  return (
    <div className="flex flex-col gap-2 select-none text-white">
      {/* ── TOOLBAR SUPÉRIEURE (MODES, SNAP, SPLIT, ZOOM, UNDO) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-2">
        {/* Left: Edit Mode Selector */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/8">
          <button
            type="button"
            onClick={() => setEditMode("SELECT")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
              editMode === "SELECT"
                ? "bg-hikma-teal-600/30 text-hikma-teal-300 border border-hikma-teal-500/40 shadow-sm"
                : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <MoveIcon className="size-3" />
            <span>Select</span>
          </button>

          <button
            type="button"
            onClick={() => setEditMode("TRIM")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
              editMode === "TRIM"
                ? "bg-hikma-teal-600/30 text-hikma-teal-300 border border-hikma-teal-500/40 shadow-sm"
                : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <Maximize2Icon className="size-3" />
            <span>Trim</span>
          </button>

          <button
            type="button"
            onClick={() => setEditMode("RIPPLE")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all",
              editMode === "RIPPLE"
                ? "bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-white/50 hover:bg-white/5 hover:text-white",
            )}
          >
            <LayersIcon className="size-3" />
            <span>Ripple</span>
          </button>
        </div>

        {/* Center: Tools (Snap, Split, Undo/Redo) */}
        <div className="flex items-center gap-1.5">
          {/* Snap 🧲 */}
          <button
            type="button"
            onClick={() => setSnapEnabled((s) => !s)}
            className={cn(
              "flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold transition-all",
              snapEnabled
                ? "border-hikma-teal-500/40 bg-hikma-teal-600/20 text-hikma-teal-300"
                : "border-white/10 bg-white/4 text-white/40 hover:text-white",
            )}
            title="Magnétisme / Snapping (Touche S)"
          >
            <MagnetIcon className="size-3" />
            <span>Snap {snapEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Split ✂ */}
          <button
            type="button"
            onClick={handleSplitAtPlayhead}
            disabled={videoLocked}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/4 px-2 py-1 font-mono text-[10px] font-semibold text-white/70 hover:bg-white/8 hover:text-white disabled:opacity-30"
            title="Couper la scène au playhead (⌘K)"
          >
            <ScissorsIcon className="size-3 text-hikma-gold" />
            <span>Couper</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-white/4">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1 hover:bg-white/10 disabled:opacity-25"
              title="Annuler (⌘Z)"
            >
              <RotateCcwIcon className="size-3" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 hover:bg-white/10 disabled:opacity-25 border-l border-white/10"
              title="Rétablir (⌘Shift+Z)"
            >
              <RotateCwIcon className="size-3" />
            </button>
          </div>
        </div>

        {/* Right: Zoom & Clock */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-hikma-gold">
            {formatTime(frame, fps)} / {formatTime(durationInFrames, fps)}
          </span>

          <div className="flex items-center gap-1 border border-white/10 rounded-lg bg-black/40 px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Math.round((z - 0.25) * 100) / 100))}
              disabled={zoom <= 0.75}
              className="p-1 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ZoomOutIcon className="size-3" />
            </button>
            <span className="font-mono text-[10px] text-white/60 w-8 text-center">{zoom}x</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
              disabled={zoom >= 3}
              className="p-1 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ZoomInIcon className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TIMELINE MULTI-TRACK CONTAINER ── */}
      <div className="grid grid-cols-[64px_1fr] rounded-2xl border border-white/10 bg-black/70 overflow-hidden shadow-2xl">
        {/* ========================================================= */}
        {/* TRACK HEADERS (V1, A1, A2)                                */}
        {/* ========================================================= */}
        <div className="flex flex-col border-r border-white/10 bg-black/50 p-1.5 gap-2 z-20">
          {/* Header Timecode Ruler spacer */}
          <div className="h-5 flex items-center justify-center font-mono text-[9px] text-white/30 border-b border-white/5 pb-1">
            PISTES
          </div>

          {/* V1 Video Track Header */}
          <div className="flex h-14 flex-col justify-between rounded-lg border border-white/8 bg-white/4 p-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-hikma-teal-400">V1</span>
              <button
                type="button"
                onClick={() => setVideoLocked((l) => !l)}
                className="text-white/40 hover:text-white"
                title={videoLocked ? "Piste V1 verrouillée" : "Verrouiller la piste V1"}
              >
                {videoLocked ? <LockIcon className="size-3 text-rose-400" /> : <UnlockIcon className="size-3" />}
              </button>
            </div>
            <span className="text-[8px] text-white/40 font-mono">Vidéo</span>
          </div>

          {/* A1 Word Audio Track Header */}
          <div className="flex h-9 flex-col justify-between rounded-lg border border-white/8 bg-amber-950/20 p-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold text-amber-300">A1</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAudioWordMuted((m) => !m)}
                  className="text-white/40 hover:text-white"
                >
                  {audioWordMuted ? <VolumeXIcon className="size-2.5 text-rose-400" /> : <Volume2Icon className="size-2.5 text-amber-300" />}
                </button>
                <button
                  type="button"
                  onClick={() => setAudioWordLocked((l) => !l)}
                  className="text-white/40 hover:text-white"
                >
                  {audioWordLocked ? <LockIcon className="size-2.5 text-rose-400" /> : <UnlockIcon className="size-2.5" />}
                </button>
              </div>
            </div>
            <span className="text-[7px] text-white/40 truncate">Mot</span>
          </div>

          {/* G1 Graphics Track Header */}
          <div className="flex h-9 flex-col justify-between rounded-lg border border-white/8 bg-fuchsia-950/20 p-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold text-fuchsia-300">G1</span>
              <span className="text-[7px] text-white/30 font-mono">{graphics.length}</span>
            </div>
            <span className="text-[7px] text-white/40 truncate">Graphiques</span>
          </div>

          {/* A2 Verse Audio Track Header */}
          <div className="flex h-9 flex-col justify-between rounded-lg border border-white/8 bg-emerald-950/20 p-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] font-bold text-emerald-300">A2</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAudioVerseMuted((m) => !m)}
                  className="text-white/40 hover:text-white"
                >
                  {audioVerseMuted ? <VolumeXIcon className="size-2.5 text-rose-400" /> : <Volume2Icon className="size-2.5 text-emerald-300" />}
                </button>
                <button
                  type="button"
                  onClick={() => setAudioVerseLocked((l) => !l)}
                  className="text-white/40 hover:text-white"
                >
                  {audioVerseLocked ? <LockIcon className="size-2.5 text-rose-400" /> : <UnlockIcon className="size-2.5" />}
                </button>
              </div>
            </div>
            <span className="text-[7px] text-white/40 truncate">Verset</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MULTI-TRACK LANES SCROLLABLE AREA                         */}
        {/* ========================================================= */}
        <div
          ref={containerRef}
          className="relative w-full overflow-x-auto p-2"
          style={{ scrollbarWidth: "thin" }}
        >
          <div
            ref={trackRef}
            className="relative flex flex-col gap-2 select-none"
            style={{ width: `${baseWidth}px`, minWidth: "100%" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* 1. TIMECODE RULER */}
            <div
              className="relative h-5 w-full border-b border-white/10 cursor-pointer"
              onPointerDown={handlePlayheadPointerDown}
            >
              {Array.from({ length: Math.max(6, Math.floor((durationInFrames / fps) * zoom)) }).map((_, i) => {
                const sec = i * (zoom < 1 ? 2 : 1);
                const pct = durationInFrames > 0 ? ((sec * fps) / durationInFrames) * 100 : 0;
                if (pct > 100) return null;
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex flex-col items-center pointer-events-none"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                  >
                    <span className="h-2 w-px bg-white/30" />
                    <span className="mt-0.5 font-mono text-[8px] text-white/40">
                      {sec}s
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 2. PISTE V1 : CLIPS VIDÉO AVEC TRIM HANDLES */}
            <div className="relative flex h-14 w-full rounded-xl border border-white/10 bg-black/40 overflow-hidden">
              {scenes.map((scene, i) => {
                const isActive = activeIndex === i;
                const isPlaying = frame >= starts[i] && frame < starts[i] + scene.durationInFrames;
                const bg = CLIP_BG[scene.kind] ?? "rgba(61, 158, 138, 0.25)";
                const borderColor = CLIP_BORDER[scene.kind] ?? "rgba(61, 158, 138, 0.6)";
                const durSec = (scene.durationInFrames / fps).toFixed(1);

                return (
                  <div
                    key={`${scene.kind}-${i}`}
                    onClick={() => onSelectScene(i)}
                    className={cn(
                      "group relative flex h-full min-w-0 flex-col justify-center border-r border-white/10 px-3 transition-all duration-100 last:border-r-0 cursor-pointer",
                    )}
                    style={{
                      flex: `${scene.durationInFrames} ${scene.durationInFrames} 0px`,
                      background: isPlaying
                        ? `linear-gradient(135deg, ${bg}, rgba(59,160,140,0.3))`
                        : bg,
                      boxShadow: isActive
                        ? `inset 0 0 0 2px ${borderColor}, 0 0 14px rgba(201,168,76,0.35)`
                        : undefined,
                    }}
                  >
                    {/* TRIM HANDLE IN (GAUCHE) */}
                    {!videoLocked && (
                      <div
                        onPointerDown={(e) => handleTrimInPointerDown(e, i)}
                        aria-label={`Raccourcir début scène ${sceneLabel(scene)}`}
                        className="absolute inset-y-0 left-0 w-3.5 cursor-col-resize touch-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-hikma-teal-400/30 transition-opacity z-10"
                        title="Tirer pour modifier le début (Trim In)"
                      >
                        <div className="h-6 w-1 rounded-full bg-hikma-teal-300 shadow-sm" />
                      </div>
                    )}

                    {/* Clip Content info */}
                    <div className="flex items-center justify-between gap-1 pointer-events-none">
                      <span className={cn("truncate text-[10px] font-bold uppercase", isActive ? "text-white" : "text-white/80")}>
                        {sceneLabel(scene)}
                      </span>
                      <span className="font-mono text-[9px] text-white/50">
                        {durSec}s ({scene.durationInFrames}f)
                      </span>
                    </div>

                    {/* TRIM HANDLE OUT (DROITE) */}
                    {!videoLocked && (
                      <div
                        onPointerDown={(e) => handleTrimOutPointerDown(e, i)}
                        aria-label={`Rallonger fin scène ${sceneLabel(scene)}`}
                        className="absolute inset-y-0 right-0 w-3.5 cursor-col-resize touch-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-hikma-teal-400/30 transition-opacity z-10"
                        title="Tirer pour modifier la durée (Trim Out)"
                      >
                        <div className="h-6 w-1 rounded-full bg-hikma-teal-300 shadow-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. PISTE A1 : AUDIOS DES MOTS (un clip par scène mot sonore) */}
            <div className="relative h-9 w-full rounded-xl border border-white/8 bg-black/40 overflow-hidden">
              {wordSceneIndexes.length > 0 ? (
                wordSceneIndexes.map((idx) => {
                  const track = scenes[idx]!;
                  const startF = starts[idx] ?? 0;
                  const durF = track.audioDuration
                    ? Math.round(track.audioDuration * fps)
                    : track.durationInFrames;
                  const leftPct = durationInFrames > 0 ? (startF / durationInFrames) * 100 : 0;
                  const widthPct = durationInFrames > 0 ? (durF / durationInFrames) * 100 : 0;
                  const isPlaying = frame >= startF && frame < startF + durF;
                  const shortLabel =
                    wordSceneIndexes.length > 1 ? `Mot ${wordSceneIndexes.indexOf(idx) + 1}` : "Prononciation Mot";

                  return (
                    <div
                      key={`audio-word-${idx}`}
                      onClick={() => {
                        onSelectScene(idx);
                        onSeek(startF);
                      }}
                      className={cn(
                        "absolute top-0.5 bottom-0.5 flex items-center gap-1.5 rounded-lg border px-2.5 cursor-pointer transition-all",
                        "border-amber-400/60 bg-gradient-to-r from-amber-950/90 to-yellow-900/80 text-amber-200",
                        isPlaying && "ring-2 ring-hikma-gold shadow-[0_0_12px_rgba(201,168,76,0.5)]",
                        audioWordMuted && "opacity-40 grayscale",
                      )}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(4, widthPct)}%`,
                        minWidth: 60,
                      }}
                    >
                      <Volume2Icon className="size-3 shrink-0" />
                      <span className="truncate text-[9px] font-bold">{shortLabel}</span>
                      <span className="ml-auto font-mono text-[8px] opacity-70">
                        {(track.audioDuration ?? durF / fps).toFixed(1)}s
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center px-3 text-[9px] text-white/30 italic">
                  Aucun audio mot
                </div>
              )}
            </div>

            {/* 3.5. PISTE G1 : CLIPS GRAPHIQUES (texte, formes…) — move + trim */}
            <div className="relative h-9 w-full rounded-xl border border-white/8 bg-black/40 overflow-hidden">
              {graphics.length === 0 ? (
                <div className="flex h-full items-center px-3 text-[9px] text-white/30 italic">
                  Aucun élément graphique (ajoutez un texte ou une forme dans l&apos;Inspector)
                </div>
              ) : (
                graphics.map((clip) => {
                  const leftPct = durationInFrames > 0 ? (clip.startFrame / durationInFrames) * 100 : 0;
                  const widthPct = durationInFrames > 0 ? (clip.durationInFrames / durationInFrames) * 100 : 0;
                  const isActive = selectedGraphicId === clip.id;
                  const kindColor =
                    clip.kind === "text"
                      ? "border-hikma-teal-400/60 bg-hikma-teal-900/60 text-hikma-teal-100"
                      : clip.kind === "three"
                        ? "border-violet-400/60 bg-violet-950/70 text-violet-100"
                        : "border-fuchsia-400/60 bg-fuchsia-950/70 text-fuchsia-100";
                  return (
                    <div
                      key={clip.id}
                      onPointerDown={(e) => handleGraphicPointerDown(e, clip.id)}
                      className={cn(
                        "absolute top-0.5 bottom-0.5 flex items-center gap-1.5 rounded-lg border px-2 cursor-grab touch-none transition-all",
                        kindColor,
                        isActive && "ring-2 ring-hikma-gold shadow-[0_0_12px_rgba(201,168,76,0.5)]",
                      )}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(5, widthPct)}%`,
                        minWidth: 64,
                      }}
                      title="Glisser pour déplacer — bords pour trimer"
                    >
                      {/* Trim In handle (gauche) */}
                      <div
                        onPointerDown={(e) => handleGraphicTrimInDown(e, clip.id)}
                        aria-label={`Raccourcir début ${graphicLabel(clip)}`}
                        className="absolute inset-y-0 left-0 w-2.5 cursor-col-resize touch-none flex items-center justify-center hover:bg-white/20 rounded-l-lg"
                      >
                        <div className="h-4 w-0.5 rounded-full bg-white/60" />
                      </div>
                      <span className="truncate text-[9px] font-bold">{graphicLabel(clip)}</span>
                      <span className="ml-auto font-mono text-[8px] opacity-70">
                        {clip.durationInFrames}f
                      </span>
                      {/* Trim Out handle (droite) */}
                      <div
                        onPointerDown={(e) => handleGraphicTrimOutDown(e, clip.id)}
                        aria-label={`Rallonger fin ${graphicLabel(clip)}`}
                        className="absolute inset-y-0 right-0 w-2.5 cursor-col-resize touch-none flex items-center justify-center hover:bg-white/20 rounded-r-lg"
                      >
                        <div className="h-4 w-0.5 rounded-full bg-white/60" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. PISTE A2 : RÉCITATION DU VERSET (UN SEUL AUDIO CONTINU) */}
            <div className="relative h-9 w-full rounded-xl border border-white/8 bg-black/40 overflow-hidden">
              {verseTrack ? (
                (() => {
                  const startF = starts[verseSceneIndex] ?? 0;
                  const durF = verseTrack.audioDuration
                    ? Math.round(verseTrack.audioDuration * fps)
                    : verseTrack.durationInFrames;
                  const leftPct = durationInFrames > 0 ? (startF / durationInFrames) * 100 : 0;
                  const widthPct = durationInFrames > 0 ? (durF / durationInFrames) * 100 : 0;
                  const isPlaying = frame >= startF && frame < startF + durF;

                  return (
                    <div
                      onClick={() => {
                        onSelectScene(verseSceneIndex);
                        onSeek(startF);
                      }}
                      className={cn(
                        "absolute top-0.5 bottom-0.5 flex items-center gap-1.5 rounded-lg border px-2.5 cursor-pointer transition-all",
                        "border-emerald-400/60 bg-gradient-to-r from-emerald-950/90 to-teal-900/80 text-emerald-200",
                        isPlaying && "ring-2 ring-hikma-gold shadow-[0_0_12px_rgba(201,168,76,0.5)]",
                        audioVerseMuted && "opacity-40 grayscale",
                      )}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(4, widthPct)}%`,
                        minWidth: 80,
                      }}
                    >
                      <Volume2Icon className="size-3 shrink-0" />
                      <span className="truncate text-[9px] font-bold">Récitation Verset</span>
                      <span className="ml-auto font-mono text-[8px] opacity-70">
                        {((verseTrack.audioDuration ?? durF / fps)).toFixed(1)}s
                      </span>
                    </div>
                  );
                })()
              ) : (
                <div className="flex h-full items-center px-3 text-[9px] text-white/30 italic">
                  Aucun audio verset
                </div>
              )}
            </div>

            {/* 5. PLAYHEAD MULTI-PISTES (LASER DORÉ TRAVERSANT) */}
            <div
              onPointerDown={handlePlayheadPointerDown}
              className="absolute inset-y-0 z-30 flex flex-col items-center cursor-ew-resize touch-none"
              style={{
                left: `${playheadPct}%`,
                transform: "translateX(-50%)",
              }}
            >
              {/* Tête diamant dorée */}
              <div
                className="size-4 rotate-45 rounded-[2px] shadow-[0_0_12px_rgba(201,168,76,1)] border border-white/60"
                style={{ background: "#f5d77f" }}
              />
              {/* Ligne laser dorée continue sur toutes les pistes */}
              <div
                className="w-[2px] flex-1 shadow-[0_0_10px_rgba(201,168,76,0.9)]"
                style={{
                  background:
                    "linear-gradient(180deg, #f5d77f 0%, rgba(201,168,76,0.8) 60%, rgba(201,168,76,0.4) 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
