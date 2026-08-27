"use client";

// Hikma — Content Studio (UI2.5) : WORKSPACE CRÉATIF D'ÉDITION VIDÉO.
//
// SINGLE PLAYER INSTANCE ARCHITECTURE (Bugfix mobile playback) :
//   - Un SEUL composant <Player> est monté dans le DOM, responsive mobile/desktop.
//   - playerRef.current est TOUJOURS relié à l'instance active (aucun conflit de ref).
//   - Synchronisation bidirectionnelle via event listeners Remotion (frameupdate, play, pause, ended).
//   - Raccourcis clavier (Space, ←/→, ⌘S, Escape) et réactivité temps réel.
//   - Disposition 3 colonnes sur Desktop (Scènes | Stage+Timeline | Inspecteur) et vue verticale épurée sur Mobile.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { HikmaWordVideo } from "@/remotion/HikmaWordVideo";
import type { VideoScene, WordHeroSettings } from "@/lib/content-studio/video/types";
import type { ContentItemStatus, RenderStatus } from "@/lib/content-studio/types";
import {
  saveThenRender,
  type StudioSaveState,
} from "@/lib/content-studio/render-safety";
import { Button } from "@/components/ui/button";
import { BodySmall, Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { saveEditorState } from "@/app/admin/content-studio/actions";
import { ProjectHeader } from "@/components/content-studio/editor/project-header";
import { TransportBar } from "@/components/content-studio/editor/transport-bar";
import { SceneStoryboard } from "@/components/content-studio/editor/scene-storyboard";
import { Timeline } from "@/components/content-studio/editor/timeline";
import { InspectorTabs } from "@/components/content-studio/editor/inspector-tabs";
import { SceneThumbnail } from "@/components/content-studio/editor/scene-thumbnail";
import {
  SlidersHorizontalIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CopyIcon,
  Trash2Icon,
  DownloadIcon,
} from "lucide-react";

type EditableTextField = "text" | "subtext" | "arabic" | "transliteration";

const SCENE_EDITABLE: Record<string, EditableTextField[]> = {
  intro: ["text"],
  word: ["arabic", "transliteration"],
  meaning: ["text", "subtext"],
  quran: ["arabic", "subtext"],
  explanation: ["text"],
  cta: ["text"],
};

const SCENE_FALLBACK: Record<string, string> = {
  intro: "Intro",
  word: "Mot",
  meaning: "Sens",
  quran: "Coran",
  explanation: "Explication",
  cta: "CTA",
};

type RenderPhase = "idle" | "rendering" | "done" | "failed";

function sceneLabel(scene: VideoScene, index: number): string {
  if (scene.title) return scene.title;
  return `${SCENE_FALLBACK[scene.kind] ?? scene.kind} ${index + 1}`;
}

function formatClock(frame: number, fps: number): string {
  const total = Math.max(Math.floor(frame / fps), 0);
  const s = Math.floor(total % 60);
  const m = Math.floor((total / 60) % 60);
  const frac = frame % fps;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(frac).padStart(2, "0")}`;
}

const STAGE_BG: React.CSSProperties = {
  background:
    "radial-gradient(ellipse 90% 70% at 50% 20%, rgba(201, 168, 76, 0.07), transparent 60%), linear-gradient(175deg, #0e1613 0%, #060908 100%)",
};

export type VideoEditorProps = {
  contentKey: string;
  templateKey: string;
  title?: string;
  fps: number;
  width: number;
  height: number;
  initialScenes: VideoScene[];
  status: string;
  renderStatus: string;
  renderPath: string | null;
  hasEdits: boolean;
};

type RenderResponse = {
  renderStatus: string;
  signedUrl?: string;
  storagePath?: string;
  durationInFrames?: number;
  fps?: number;
  error?: { code: string; message: string };
};

export function VideoEditor({
  contentKey,
  templateKey,
  title,
  fps,
  width,
  height,
  initialScenes,
  status,
  renderStatus: initialRenderStatus,
}: VideoEditorProps) {
  const [scenes, setScenes] = useState<VideoScene[]>(initialScenes);
  const [selected, setSelected] = useState(0);
  const [saveState, setSaveState] = useState<StudioSaveState>("saved");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [renderPhase, setRenderPhase] = useState<RenderPhase>("idle");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>(
    initialRenderStatus === "RENDERED" || initialRenderStatus === "RENDERING"
      ? (initialRenderStatus as RenderStatus)
      : "NOT_RENDERED",
  );
  const [renderResult, setRenderResult] = useState<{
    signedUrl?: string;
    storagePath?: string;
    durationInFrames?: number;
  } | null>(null);

  const [frame, setFrame] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const durationInFrames = useMemo(
    () => scenes.reduce((acc, s) => acc + s.durationInFrames, 0),
    [scenes],
  );

  const starts = useMemo(() => {
    const arr: number[] = [];
    let acc = 0;
    for (const s of scenes) {
      arr.push(acc);
      acc += s.durationInFrames;
    }
    return arr;
  }, [scenes]);

  const activeIndex = Math.min(Math.max(selected, 0), Math.max(scenes.length - 1, 0));
  const selectedScene = scenes[activeIndex];
  const hasSelectedEdits =
    selectedScene && (SCENE_EDITABLE[selectedScene.kind] ?? []).length > 0;

  const locallyRendered = renderStatus === "RENDERED";

  // Synchronisation événementielle robuste via les listeners de Remotion Player
  useEffect(() => {
    const currentP = playerRef.current;
    if (!currentP) return;

    const onFrame = (e: { detail: { frame: number } }) => {
      setFrame(e.detail.frame);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    currentP.addEventListener("frameupdate", onFrame);
    currentP.addEventListener("play", onPlay);
    currentP.addEventListener("pause", onPause);
    currentP.addEventListener("ended", onEnded);

    return () => {
      currentP.removeEventListener("frameupdate", onFrame);
      currentP.removeEventListener("play", onPlay);
      currentP.removeEventListener("pause", onPause);
      currentP.removeEventListener("ended", onEnded);
    };
  }, []);

  const markEdited = useCallback(() => {
    setSaveState("unsaved");
    setRenderStatus("NOT_RENDERED");
    setRenderPhase("idle");
    setRenderResult(null);
    setRenderError(null);
  }, []);

  const updateSceneField = useCallback(
    (field: EditableTextField, index: number, value: string | null) => {
      setScenes((prev) =>
        prev.map((s, i) => {
          if (i !== index) return s;
          const next = { ...s };
          if (value === null) delete next[field];
          else next[field] = value;
          return next;
        }),
      );
      markEdited();
    },
    [markEdited],
  );

  const updateSceneDuration = useCallback(
    (index: number, durationInFramesValue: number) => {
      const dur = Math.max(Math.trunc(durationInFramesValue), 1);
      setScenes((prev) =>
        prev.map((s, i) => (i === index ? { ...s, durationInFrames: dur } : s)),
      );
      markEdited();
    },
    [markEdited],
  );

  const updateHero = useCallback(
    (patch: (hero: WordHeroSettings) => WordHeroSettings) => {
      setScenes((prev) =>
        prev.map((s, i) =>
          i === activeIndex ? { ...s, hero: patch(s.hero ?? {}) } : s,
        ),
      );
      markEdited();
    },
    [activeIndex, markEdited],
  );

  const updateSceneAudio = useCallback(
    (patch: Partial<VideoScene>) => {
      setScenes((prev) =>
        prev.map((s, i) => (i === activeIndex ? { ...s, ...patch } : s)),
      );
      markEdited();
    },
    [activeIndex, markEdited],
  );

  const updateVerseConfig = useCallback(
    (patch: (cfg: NonNullable<VideoScene["verseConfig"]>) => NonNullable<VideoScene["verseConfig"]>) => {
      setScenes((prev) =>
        prev.map((s, i) =>
          i === activeIndex ? { ...s, verseConfig: patch(s.verseConfig ?? {}) } : s,
        ),
      );
      markEdited();
    },
    [activeIndex, markEdited],
  );

  const handleScenesChange = useCallback(
    (nextScenes: VideoScene[]) => {
      setScenes(nextScenes);
      markEdited();
    },
    [markEdited],
  );

  const removeScene = useCallback(
    (index: number) => {
      setScenes((prev) =>
        prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
      );
      if (index <= activeIndex) setSelected((p) => Math.max(p - 1, 0));
      markEdited();
    },
    [activeIndex, markEdited],
  );

  const duplicateScene = useCallback(
    (index: number) => {
      setScenes((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, {
          ...prev[index],
          title: `${prev[index].title ?? SCENE_FALLBACK[prev[index].kind] ?? "Scène"} (copie)`,
        });
        return next;
      });
      setSelected(index + 1);
      markEdited();
    },
    [markEdited],
  );

  const reorderScene = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= scenes.length) return;
      setScenes((prev) => {
        const next = [...prev];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      setSelected(target);
      markEdited();
    },
    [scenes.length, markEdited],
  );

  const seekToFrame = useCallback(
    (frameValue: number) => {
      const nextFrame = Math.max(0, Math.min(Math.trunc(frameValue), durationInFrames));
      setFrame(nextFrame);
      playerRef.current?.seekTo?.(nextFrame);
    },
    [durationInFrames],
  );

  const seekToScene = useCallback(
    (index: number) => {
      setSelected(index);
      seekToFrame(starts[index]);
    },
    [starts, seekToFrame],
  );

  const handlePlayPause = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.isPlaying()) {
      p.pause();
      setPlaying(false);
    } else {
      // Si on est à la fin ou tout proche, relancer depuis le début
      if (frame >= durationInFrames - 1) {
        p.seekTo(0);
        setFrame(0);
      }
      p.play();
      setPlaying(true);
    }
  }, [frame, durationInFrames]);

  const handleMuteToggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) {
      setMuted((m) => !m);
      return;
    }
    if (muted) {
      p.unmute();
      setMuted(false);
    } else {
      p.mute();
      setMuted(true);
    }
  }, [muted]);

  const handlePrevScene = useCallback(() => {
    if (activeIndex > 0) seekToScene(activeIndex - 1);
  }, [activeIndex, seekToScene]);

  const handleNextScene = useCallback(() => {
    if (activeIndex < scenes.length - 1) seekToScene(activeIndex + 1);
  }, [activeIndex, scenes.length, seekToScene]);

  // ---------------------------------------------------------------------------
  // Save + Render
  // ---------------------------------------------------------------------------

  const runSave = useCallback(
    async (preserveRenderState = false): Promise<boolean> => {
      setSaveState("saving");
      const form = new FormData();
      form.set("contentKey", contentKey);
      form.set("scenes", JSON.stringify(scenes));
      try {
        const result = await saveEditorState(form);
        if (result.ok) {
          setSaveState("saved");
          if (!preserveRenderState) {
            setRenderStatus("NOT_RENDERED");
            setRenderPhase("idle");
            setRenderResult(null);
          }
          return true;
        }
        setSaveState("failed");
        return false;
      } catch {
        setSaveState("failed");
        return false;
      }
    },
    [contentKey, scenes],
  );

  const runRender = useCallback(async () => {
    setRenderPhase("rendering");
    setRenderStatus("RENDERING");
    setRenderError(null);
    setRenderResult(null);

    const outcome = await saveThenRender({
      saveState,
      save: () => runSave(true),
      render: async () => {
        let res: Response;
        try {
          res = await fetch("/api/admin/content-studio/render", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentKey }),
          });
        } catch {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError("Impossible de contacter le serveur de rendu.");
          return;
        }
        let data: RenderResponse;
        try {
          data = (await res.json()) as RenderResponse;
        } catch {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError("Réponse de rendu invalide.");
          return;
        }
        if (!res.ok || data.error) {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError(data.error?.message ?? "Échec du rendu.");
          return;
        }
        setRenderPhase("done");
        setRenderStatus("RENDERED");
        setRenderResult({
          signedUrl: data.signedUrl,
          storagePath: data.storagePath,
          durationInFrames: data.durationInFrames,
        });
      },
    });

    if (outcome === "save_failed") {
      setRenderPhase("failed");
      setRenderStatus("FAILED");
      setRenderError(
        "Sauvegarde échouée — rendu annulé par sécurité pour éviter un export désynchronisé.",
      );
    }
  }, [saveState, runSave, contentKey]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      return (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        (t as HTMLElement).isContentEditable
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void runSave();
        return;
      }
      if (e.key === "Escape") {
        setInspectorOpen(false);
        return;
      }
      if (e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea, select")) return;
      if (e.key === " ") {
        e.preventDefault();
        handlePlayPause();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        seekToFrame(frame + Math.round(fps * 0.5));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekToFrame(frame - Math.round(fps * 0.5));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runSave, frame, fps, seekToFrame, handlePlayPause]);

  const editReady = scenes.length > 0 && durationInFrames / fps >= 0.1;
  const saveDisabled = saveState === "saving" || saveState === "saved";
  const renderDisabled = renderPhase === "rendering" || saveState === "saving" || !editReady;
  const renderLabel =
    renderPhase === "rendering"
      ? "Rendu…"
      : locallyRendered
        ? "Rendre à nouveau"
        : "Rendre MP4";

  // ---------------------------------------------------------------------------
  // Shared Inspector Component
  // ---------------------------------------------------------------------------

  const inspectorBody = selectedScene ? (
    <div className="flex flex-col">
      {/* Scene Header Strip */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5 bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 shrink-0">
            <SceneThumbnail scene={selectedScene} size="sm" />
          </div>
          <div>
            <span className="block text-xs font-bold text-white">
              {sceneLabel(selectedScene, activeIndex)}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-hikma-teal-400">
              {selectedScene.kind}
            </span>
          </div>
        </div>

        {/* Scene Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => reorderScene(activeIndex, -1)}
            aria-label="Déplacer vers la gauche"
            className="flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <ArrowUpIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => reorderScene(activeIndex, 1)}
            aria-label="Déplacer vers la droite"
            className="flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <ArrowDownIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => duplicateScene(activeIndex)}
            aria-label="Dupliquer la scène"
            className="flex size-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <CopyIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => removeScene(activeIndex)}
            disabled={scenes.length <= 1}
            aria-label="Supprimer la scène"
            className="flex size-7 items-center justify-center rounded-lg text-rose-400/60 hover:bg-rose-900/30 hover:text-rose-300 disabled:pointer-events-none disabled:opacity-20"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <InspectorTabs
        scene={selectedScene}
        index={activeIndex}
        fps={fps}
        onField={updateSceneField}
        onDuration={updateSceneDuration}
        onHero={updateHero}
        onAudio={updateSceneAudio}
        onVerseConfig={updateVerseConfig}
      />
    </div>
  ) : null;

  return (
    <div className="flex w-full flex-1 flex-col select-none">
      <ProjectHeader
        eyebrow={templateKey}
        title={title ?? templateKey}
        status={status as ContentItemStatus}
        renderStatus={renderStatus}
        saveState={saveState}
        saveDisabled={saveDisabled}
        onSave={() => void runSave()}
        renderLabel={renderLabel}
        renderVariant={locallyRendered ? "secondary" : "default"}
        renderLoading={renderPhase === "rendering"}
        renderDisabled={renderDisabled}
        renderTitle="Exporter la vidéo au format 9:16"
        onRender={() => void runRender()}
      />

      {/* ── UNIFIED RESPONSIVE WORKSPACE ───────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:gap-0 lg:px-4 lg:py-5">
        {/* Left: Scenes List (Desktop only) */}
        <aside className="hidden flex-col gap-1.5 rounded-l-2xl border border-white/8 bg-black/40 p-3 lg:flex">
          <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
            Scènes de montage ({scenes.length})
          </span>
          <div className="flex flex-col gap-1 overflow-y-auto">
            {scenes.map((s, i) => {
              const isActive = activeIndex === i;
              const isPlaying = frame >= starts[i] && frame < starts[i] + s.durationInFrames;
              return (
                <button
                  key={`${s.kind}-${i}`}
                  type="button"
                  onClick={() => seekToScene(i)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl p-2 text-left transition-all",
                    isActive
                      ? "bg-hikma-teal-600/20 shadow-[inset_0_0_0_1px_rgba(59,160,140,0.5)]"
                      : "hover:bg-white/4",
                  )}
                >
                  <div className="w-8 shrink-0">
                    <SceneThumbnail scene={s} size="sm" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("truncate text-xs font-bold", isActive ? "text-white" : "text-white/70")}>
                      {sceneLabel(s, i)}
                    </span>
                    <span className="font-mono text-[9px] text-white/30">
                      {(s.durationInFrames / fps).toFixed(1)}s
                    </span>
                  </div>
                  {isPlaying && (
                    <span className="size-2 rounded-full bg-hikma-teal-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Stage + Transport + Storyboard + Timeline (SINGLE Player mounted) */}
        <div className="flex min-w-0 flex-1 flex-col border-white/8 bg-[#090d0b] lg:border-y">
          {/* 1. Preview 9:16 Dominant */}
          <div
            className="flex flex-1 items-center justify-center px-4 py-4 sm:p-6"
            style={STAGE_BG}
          >
            <div className="relative w-full max-w-[270px] sm:max-w-[300px] lg:max-w-[320px] xl:max-w-[360px]">
              {/* Info badge top */}
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl bg-black/50 px-3 py-1 backdrop-blur-md">
                <Caption className="font-mono text-[9px] sm:text-[10px] text-white/70">
                  9:16 · {width}×{height} · {fps}fps
                </Caption>
                <Caption className="font-mono text-[9px] sm:text-[10px] text-hikma-gold">
                  {formatClock(frame, fps)}
                </Caption>
              </div>

              {/* Video Canvas — SINGLE Remotion Player instance */}
              <div
                className="overflow-hidden rounded-2xl shadow-[0_20px_60px_-14px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                style={{ aspectRatio: "9/16" }}
              >
                <Player
                  ref={playerRef}
                  component={HikmaWordVideo}
                  inputProps={{ scenes }}
                  durationInFrames={durationInFrames}
                  fps={fps}
                  compositionWidth={width}
                  compositionHeight={height}
                  controls={false}
                  autoPlay={false}
                  initiallyMuted={muted}
                  acknowledgeRemotionLicense
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* 2. Transport Bar */}
          <div className="border-t border-white/8 bg-black/40 py-1">
            <TransportBar
              frame={frame}
              durationInFrames={durationInFrames}
              fps={fps}
              playing={playing}
              muted={muted}
              onPlayPause={handlePlayPause}
              onPrevScene={handlePrevScene}
              onNextScene={handleNextScene}
              onMuteToggle={handleMuteToggle}
              hasPrev={activeIndex > 0}
              hasNext={activeIndex < scenes.length - 1}
            />
          </div>

          {/* 3. Storyboard Rail (Mobile visible) */}
          <div className="border-t border-white/6 bg-black/20 lg:hidden">
            <SceneStoryboard
              scenes={scenes}
              activeIndex={activeIndex}
              fps={fps}
              currentFrame={frame}
              starts={starts}
              onSelect={seekToScene}
              onDuplicate={duplicateScene}
              onRemove={removeScene}
              canRemove={scenes.length > 1}
            />
          </div>

          {/* 4. Timeline */}
          <div className="border-t border-white/8 bg-black/60 p-3 sm:p-4">
            <Timeline
              scenes={scenes}
              activeIndex={activeIndex}
              frame={frame}
              durationInFrames={durationInFrames}
              fps={fps}
              starts={starts}
              playing={playing}
              onSeek={seekToFrame}
              onSelectScene={seekToScene}
              onScenesChange={handleScenesChange}
            />
          </div>

          {/* 5. Mobile Inspector Trigger Button (< lg) */}
          {selectedScene && (
            <div className="px-3 pt-3 pb-6 lg:hidden">
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]",
                  hasSelectedEdits
                    ? "border-hikma-teal-500/40 bg-hikma-teal-600/15 text-hikma-teal-300 shadow-[0_0_15px_rgba(59,160,140,0.15)]"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10",
                )}
              >
                <SlidersHorizontalIcon className="size-4" />
                <span>Personnaliser la scène {sceneLabel(selectedScene, activeIndex)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Inspector (Desktop permanent sidebar) */}
        <aside className="hidden flex-col overflow-y-auto rounded-r-2xl border border-white/8 bg-black/40 lg:flex">
          {inspectorBody}
        </aside>
      </div>

      {/* Result / Error Banners */}
      {renderResult?.signedUrl && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              ✓
            </span>
            <div>
              <span className="block text-xs font-bold text-emerald-300">Vidéo MP4 prête à la diffusion</span>
              <span className="text-[10px] text-white/50">Rendu effectué avec succès</span>
            </div>
          </div>
          <a
            href={renderResult.signedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            <DownloadIcon className="size-3.5" />
            <span>Voir / Télécharger</span>
          </a>
        </div>
      )}

      {renderError && (
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4">
          <BodySmall className="text-rose-400 text-xs">
            Échec du rendu : {renderError}
          </BodySmall>
          <Button
            type="button"
            variant="destructive-outline"
            size="sm"
            onClick={() => void runRender()}
            className="text-xs"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* ── MOBILE BOTTOM SHEET (Half-height, Draggable handle) ────────── */}
      {selectedScene && inspectorOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer l'inspecteur"
            onClick={() => setInspectorOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t border-white/12 bg-[#0d1411] shadow-[0_-16px_48px_rgba(0,0,0,0.8)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Drag Handle */}
            <div
              className="mx-auto my-2.5 h-1 w-12 rounded-full bg-white/20"
              aria-hidden="true"
            />
            <div className="flex items-center justify-between px-4 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                Personnalisation de la scène
              </span>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/8 hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            {inspectorBody}
          </div>
        </div>
      )}
    </div>
  );
}
