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
import type { GraphicClipBase } from "@/lib/content-studio/graphics/graphic-clip";
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
  ShapesPanel,
  TextGraphicsPanel,
} from "@/components/content-studio/editor/text-graphics-panel";
import { ThreePanel } from "@/components/content-studio/editor/three-graphics-panel";
import {
  buildTextAnimation,
  createTextGraphicClip,
  defaultTextGraphicClip,
  type TextGraphicClip,
} from "@/lib/content-studio/graphics/text-graphic";
import {
  isLegacyTextPromoted,
  legacyTextKey,
  listLegacyTexts,
  type LegacyTextDescriptor,
} from "@/lib/content-studio/graphics/legacy-text-adapter";
import {
  createShapeGraphicClip,
  defaultShapeGraphicClip,
  type ShapeGraphicClip,
} from "@/lib/content-studio/graphics/shape-graphic";
import {
  createThreeGraphicClip,
  type ThreeGraphicClip,
} from "@/lib/content-studio/graphics/three-graphic";
import { duplicateGraphicClip } from "@/lib/content-studio/editor/timeline-ops";
import { RenderProgressModal } from "@/components/content-studio/editor/render-progress-modal";
import { InteractiveGraphicsOverlay } from "@/components/content-studio/editor/interactive-graphics-overlay";
import {
  SlidersHorizontalIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CopyIcon,
  Trash2Icon,
  DownloadIcon,
  PlayCircleIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
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
  /** Clips graphiques (texte…) chargés depuis editor_state — optionnels. */
  initialGraphics?: GraphicClipBase[];
  status: string;
  renderStatus: string;
  renderPath: string | null;
  hasEdits: boolean;
};

type RenderResponse = {
  renderStatus: string;
  signedUrl?: string;
  downloadUrl?: string;
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
  initialGraphics,
  status,
  renderStatus: initialRenderStatus,
}: VideoEditorProps) {
  const [scenes, setScenes] = useState<VideoScene[]>(initialScenes);
  const [graphics, setGraphics] = useState<GraphicClipBase[]>(initialGraphics ?? []);
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [saveState, setSaveState] = useState<StudioSaveState>("saved");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [renderPhase, setRenderPhase] = useState<RenderPhase>("idle");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>(
    initialRenderStatus === "RENDERED" ? "RENDERED" : "NOT_RENDERED",
  );
  const [renderResult, setRenderResult] = useState<{
    signedUrl?: string;
    downloadUrl?: string;
    storagePath?: string;
    durationInFrames?: number;
  } | null>(null);
  const [renderModalOpen, setRenderModalOpen] = useState(false);

  const [frame, setFrame] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  // Panneau inférieur (Transport + Timeline) redimensionnable au drag : le stage
  // (flex-1) absorbe l'espace libéré ⇒ le canvas grandit. Hauteur persistée en
  // localStorage ; `null` = hauteur naturelle (mobile / premier chargement).
  // ⚠️ HYDRATATION : on initialise TOUJOURS à null (rendu serveur et client
  // identiques) ; la hauteur persistée est lue APRÈS montage (effet ci-dessous).
  const [timelinePanelH, setTimelinePanelH] = useState<number | null>(null);
  const centerColRef = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const timelineDrag = useRef<{ startY: number; startH: number; maxH: number } | null>(null);
  const playerRef = useRef<PlayerRef>(null);

  // Restauration post-hydratation de la hauteur persistée (jamais pendant le
  // premier rendu : éviter tout mismatch SSR/client).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("hikma:timelinePanelH");
      if (!raw) return;
      const v = Number(raw);
      // lecture localStorage impossible côté serveur : restauration
      // obligatoirement post-montage (pattern anti-mismatch d'hydratation)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(v) && v >= 120 && v <= 1200) setTimelinePanelH(v);
    } catch {
      /* localStorage indisponible (SSR/sandbox) */
    }
  }, []);

  // Persistance de la hauteur du panneau Timeline
  useEffect(() => {
    if (timelinePanelH == null) return;
    try {
      window.localStorage.setItem("hikma:timelinePanelH", String(timelinePanelH));
    } catch {
      /* localStorage indisponible (SSR/sandbox) */
    }
  }, [timelinePanelH]);

  // Drag vertical du séparateur : mesurer la hauteur courante du panneau au
  // début (auto ou explicit), puis appliquer le delta pointeur 1:1 en px,
  // borné [120, colonne - 160] pour garder un canvas utilisable.
  const startTimelineDrag = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const panel = bottomPanelRef.current;
      const col = centerColRef.current;
      if (!panel || !col) return;
      const colH = col.getBoundingClientRect().height;
      const current = timelinePanelH ?? panel.getBoundingClientRect().height;
      timelineDrag.current = {
        startY: e.clientY,
        startH: current,
        maxH: Math.max(colH - 160, 220),
      };
      const move = (ev: PointerEvent) => {
        const d = timelineDrag.current;
        if (!d) return;
        const delta = d.startY - ev.clientY; // tirer vers le haut ⇒ panneau plus petit
        setTimelinePanelH(Math.round(Math.min(Math.max(d.startH + delta, 120), d.maxH)));
      };
      const up = () => {
        timelineDrag.current = null;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    },
    [timelinePanelH],
  );

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
      if (graphics.length > 0) form.set("graphics", JSON.stringify(graphics));
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
    [contentKey, scenes, graphics],
  );

  const runRender = useCallback(async () => {
    setRenderPhase("rendering");
    setRenderStatus("RENDERING");
    setRenderError(null);
    setRenderResult(null);
    setRenderModalOpen(true);

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
        } catch (fetchErr) {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError(
            fetchErr instanceof Error ? fetchErr.message : "Impossible de contacter le serveur de rendu.",
          );
          return;
        }

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          const rawText = await res.text().catch(() => "");
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError(
            `Erreur serveur (${res.status}) : ${rawText.slice(0, 120) || res.statusText || "Réponse non-JSON"}`,
          );
          return;
        }

        let data: RenderResponse;
        try {
          data = (await res.json()) as RenderResponse;
        } catch {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError(`Réponse de rendu invalide (${res.status}).`);
          return;
        }
        if (!res.ok || data.error) {
          setRenderPhase("failed");
          setRenderStatus("FAILED");
          setRenderError(data.error?.message ?? `Échec du rendu (${res.status}).`);
          return;
        }
        // Si le rendu est synchrone et déjà terminé
        if (data.renderStatus === "RENDERED" && data.signedUrl) {
          setRenderPhase("done");
          setRenderStatus("RENDERED");
          setRenderResult({
            signedUrl: data.signedUrl,
            downloadUrl: data.downloadUrl,
            storagePath: data.storagePath,
            durationInFrames: data.durationInFrames,
          });
          return;
        }

        // Rendu asynchrone (Cloud Worker / GitHub Actions) : polling toutes les 3s
        const pollStart = Date.now();
        const maxPollMs = 15 * 60 * 1000; // 15 min max

        while (Date.now() - pollStart < maxPollMs) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          try {
            const pollRes = await fetch(
              `/api/admin/content-studio/render?contentKey=${encodeURIComponent(contentKey)}`,
            );
            if (!pollRes.ok) continue;
            const pollData = (await pollRes.json()) as {
              renderStatus?: string;
              signedUrl?: string;
              downloadUrl?: string;
              renderPath?: string;
              renderError?: string;
            };

            if (pollData.renderStatus === "RENDERED" && pollData.signedUrl) {
              setRenderPhase("done");
              setRenderStatus("RENDERED");
              setRenderResult({
                signedUrl: pollData.signedUrl,
                downloadUrl: pollData.downloadUrl,
                storagePath: pollData.renderPath,
                durationInFrames: data.durationInFrames,
              });
              return;
            }

            if (pollData.renderStatus === "FAILED") {
              setRenderPhase("failed");
              setRenderStatus("FAILED");
              setRenderError(pollData.renderError || "Le rendu a échoué.");
              return;
            }
          } catch {
            // Tolérance aux micro-coupures réseau sur mobile
          }
        }

        setRenderPhase("failed");
        setRenderStatus("FAILED");
        setRenderError("Délai de rendu dépassé (timeout 15 min).");
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
        setSelectedGraphicId(null);
        return;
      }
      // Suppression du clip graphique sélectionné (Delete / Backspace)
      if ((e.key === "Delete" || e.key === "Backspace") && selectedGraphicId) {
        e.preventDefault();
        setGraphics((g) => g.filter((c) => c.id !== selectedGraphicId));
        setSelectedGraphicId(null);
        setSaveState("unsaved");
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
  }, [runSave, frame, fps, seekToFrame, handlePlayPause, selectedGraphicId]);

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

  // ---------------------------------------------------------------------------
  // Graphics (texte) — état local + sauvegarde dans editor_state.graphics
  // ---------------------------------------------------------------------------

  // Décalage en cascade : chaque NOUVEL élément (texte ou forme) se place à
  // CÔTÉ des précédents au lieu d'exactement au-dessus (tous seraient empilés
  // à 0.5/0.5). Motif diagonal de 8 positions, puis retour au centre — le
  // premier élément garde sa position par défaut. Retourne un DELTA (px
  // normalisés) appliqué à la position de base du clip.
  const cascadeDelta = (count: number): { dx: number; dy: number } => {
    const i = count % 8;
    return { dx: i * 0.045, dy: -i * 0.045 * 0.55 };
  };

  const addTextGraphic = useCallback(() => {
    const id = `text-${crypto.randomUUID()}`;
    // Création au PLAYHEAD + au-DESSUS des autres (z-index max+1) : le nouveau
    // clip est immédiatement visible, sélectionné et prêt à être déplacé.
    setGraphics((g) => {
      const zIndex = g.reduce((m, c) => Math.max(m, c.zIndex), 0) + 1;
      const base = defaultTextGraphicClip();
      const d = cascadeDelta(g.length);
      return [
        ...g,
        createTextGraphicClip({
          ...base,
          id,
          startFrame: frame,
          zIndex,
          transform: {
            ...base.transform,
            x: base.transform.x + d.dx,
            y: base.transform.y + d.dy,
          },
        }),
      ];
    });
    setSelectedGraphicId(id);
    setSaveState("unsaved");
  }, [frame]);

  const isTextGraphicClip = (c: GraphicClipBase): c is TextGraphicClip =>
    c.kind === "text";

  const updateTextGraphic = useCallback(
    (id: string, patch: Partial<TextGraphicClip>) => {
      setGraphics((g) =>
        g.map((c) => {
          if (!isTextGraphicClip(c) || c.id !== id) return c;
          return createTextGraphicClip({
            id: c.id,
            startFrame: c.startFrame,
            durationInFrames: c.durationInFrames,
            zIndex: c.zIndex,
            transform: c.transform,
            keyframes: c.keyframes,
            text: c.text,
            style: c.style,
            animation: c.animation,
            direction: c.direction,
            // Préserver l'origine (texte hérité promu) : sans cette ligne,
            // toute édition détacherait le clip de sa scène et l'original
            // réapparaîtrait en double dans le rendu.
            source: c.source,
            ...patch,
          });
        }),
      );
      setSaveState("unsaved");
    },
    [],
  );

  const removeTextGraphic = useCallback((id: string) => {
    setGraphics((g) => g.filter((c) => c.id !== id));
    setSaveState("unsaved");
  }, []);

  // --- Formes --------------------------------------------------------------
  const addShapeGraphic = useCallback(
    (shape: ShapeGraphicClip["shape"]) => {
      const id = `shape-${crypto.randomUUID()}`;
      // Création au PLAYHEAD + au-DESSUS des autres (z-index max+1) + décalage
      // en cascade (jamais empilé exactement sur le précédent).
      setGraphics((g) => {
        const zIndex = g.reduce((m, c) => Math.max(m, c.zIndex), 0) + 1;
        const base = defaultShapeGraphicClip();
        const d = cascadeDelta(g.length);
        return [
          ...g,
          createShapeGraphicClip({
            ...base,
            shape,
            id,
            startFrame: frame,
            zIndex,
            transform: {
              ...base.transform,
              x: base.transform.x + d.dx,
              y: base.transform.y + d.dy,
            },
          }),
        ];
      });
      setSelectedGraphicId(id);
      setSaveState("unsaved");
    },
    [frame],
  );

  const isShapeGraphicClip = (c: GraphicClipBase): c is ShapeGraphicClip =>
    c.kind === "shape";

  const updateShapeGraphic = useCallback(
    (id: string, patch: Partial<ShapeGraphicClip>) => {
      setGraphics((g) =>
        g.map((c) => {
          if (!isShapeGraphicClip(c) || c.id !== id) return c;
          return createShapeGraphicClip({
            id: c.id,
            startFrame: c.startFrame,
            durationInFrames: c.durationInFrames,
            zIndex: c.zIndex,
            transform: c.transform,
            keyframes: c.keyframes,
            shape: c.shape,
            fill: c.fill,
            stroke: c.stroke,
            roundness: c.roundness,
            sides: c.sides,
            thickness: c.thickness,
            aspect: c.aspect,
            ...patch,
          });
        }),
      );
      setSaveState("unsaved");
    },
    [],
  );

  const removeShapeGraphic = useCallback((id: string) => {
    setGraphics((g) => g.filter((c) => c.id !== id));
    setSaveState("unsaved");
  }, []);

  // --- Objets 3D ------------------------------------------------------------
  const addThreeGraphic = useCallback(
    (geometry: ThreeGraphicClip["geometry"]["kind"] = "box") => {
      const id = `three-${crypto.randomUUID()}`;
      // Création au PLAYHEAD + au-DESSUS des autres (z-index max+1) + décalage
      // en cascade (jamais empilé exactement sur le précédent).
      setGraphics((g) => {
        const zIndex = g.reduce((m, c) => Math.max(m, c.zIndex), 0) + 1;
        const base = createThreeGraphicClip({
          id,
          startFrame: frame,
          durationInFrames: 120,
          zIndex,
          geometry: { kind: geometry },
        });
        const d = cascadeDelta(g.length);
        return [
          ...g,
          {
            ...base,
            transform: {
              ...base.transform,
              x: base.transform.x + d.dx,
              y: base.transform.y + d.dy,
            },
          },
        ];
      });
      setSelectedGraphicId(id);
      setSaveState("unsaved");
    },
    [frame],
  );

  const isThreeGraphicClip = (c: GraphicClipBase): c is ThreeGraphicClip =>
    c.kind === "three";

  const updateThreeGraphic = useCallback(
    (id: string, patch: Partial<ThreeGraphicClip>) => {
      setGraphics((g) =>
        g.map((c) => {
          if (!isThreeGraphicClip(c) || c.id !== id) return c;
          return createThreeGraphicClip({
            id: c.id,
            startFrame: c.startFrame,
            durationInFrames: c.durationInFrames,
            zIndex: c.zIndex,
            transform: c.transform,
            keyframes: c.keyframes,
            geometry: c.geometry,
            material: c.material,
            lighting: c.lighting,
            camera: c.camera,
            ...patch,
          });
        }),
      );
      setSaveState("unsaved");
    },
    [],
  );

  const removeThreeGraphic = useCallback((id: string) => {
    setGraphics((g) => g.filter((c) => c.id !== id));
    setSaveState("unsaved");
  }, []);

  const duplicateGraphic = useCallback((id: string) => {
    setGraphics((g) => duplicateGraphicClip(g, id));
    setSaveState("unsaved");
  }, []);

  /** Monte un clip graphique au-dessus de tous (z-index maximal + 1). */
  const bringGraphicToFront = useCallback((id: string) => {
    setGraphics((g) => {
      const max = g.reduce((m, c) => Math.max(m, c.zIndex), 0);
      return g.map((c) => (c.id === id ? { ...c, zIndex: max + 1 } : c));
    });
    setSaveState("unsaved");
  }, []);

  /** Descend un clip graphique sous tous les autres (z-index minimal − 1). */
  const sendGraphicToBack = useCallback((id: string) => {
    setGraphics((g) => {
      const min = g.reduce((m, c) => Math.min(m, c.zIndex), 0);
      return g.map((c) => (c.id === id ? { ...c, zIndex: min - 1 } : c));
    });
    setSaveState("unsaved");
  }, []);

  // ---------------------------------------------------------------------------
  // TEXTES HÉRITÉS (UNIFICATION) — promotion lazy d'un texte de scène en
  // VRAI TextGraphicClip : rendu par GraphicsOverlay, éditable partout
  // (Inspector / Timeline G1 / drag-resize-rotate Preview), persisté dans
  // editor_state.graphics, MP4 identique. La scène masque l'original tant que
  // le clip existe (source). Le verset Quran (quran.arabic) est PROTÉGÉ.
  // ---------------------------------------------------------------------------

  /** Textes de scènes non promus et visibles au frame courant (hitboxes). */
  const legacyHits = useMemo(() => {
    const hits: LegacyTextDescriptor[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const start = starts[i];
      if (!scene || frame < start || frame >= start + scene.durationInFrames) continue;
      for (const d of listLegacyTexts(scene, i)) {
        if (d.protected) continue;
        if (isLegacyTextPromoted(graphics, i, d.field)) continue;
        hits.push(d);
      }
    }
    return hits;
  }, [scenes, starts, frame, graphics]);

  /** Clés des textes hérités déjà promus (pour désactiver les boutons ✎). */
  const promotedKeys = useMemo(
    () =>
      graphics
        .filter(
          (g): g is TextGraphicClip =>
            g.kind === "text" && !!(g as TextGraphicClip).source,
        )
        .map((g) => legacyTextKey(g.source!.sceneIndex, g.source!.field)),
    [graphics],
  );

  /** Promeut un texte de scène en TextGraphicClip (au PLAYHEAD de la scène). */
  const promoteLegacyText = useCallback(
    (sceneIndex: number, field: EditableTextField) => {
      const scene = scenes[sceneIndex];
      if (!scene) return;
      const content = scene[field];
      if (typeof content !== "string" || content.length === 0) return;
      const desc = listLegacyTexts(scene, sceneIndex).find((d) => d.field === field);
      if (!desc || desc.protected) return;
      if (isLegacyTextPromoted(graphics, sceneIndex, field)) return;
      const id = `legacy-${sceneIndex}-${field}-${crypto.randomUUID()}`;
      setGraphics((g) => {
        const zIndex = g.reduce((m, c) => Math.max(m, c.zIndex), 0) + 1;
        return [
          ...g,
          createTextGraphicClip({
            id,
            text: desc.content,
            direction: desc.direction,
            startFrame: starts[sceneIndex],
            durationInFrames: scene.durationInFrames,
            zIndex,
            style: desc.style,
            transform: desc.transform,
            animation: buildTextAnimation("fade", {
              inDurationFrames: 15,
              outDurationFrames: 0,
            }),
            source: { sceneIndex, field: desc.field },
          }),
        ];
      });
      // Le clip promu est immédiatement sélectionné → son éditeur complet
      // (TextClipEditor) s'ouvre dans l'Inspector, sans double rendu.
      setSelectedGraphicId(id);
      setSaveState("unsaved");
    },
    [scenes, starts, graphics],
  );

  const graphicsPanel = (
    <>
      <TextGraphicsPanel
        graphics={graphics}
        selectedId={selectedGraphicId}
        onSelect={setSelectedGraphicId}
        onAddText={addTextGraphic}
        onUpdateText={updateTextGraphic}
        onRemove={removeTextGraphic}
        onDuplicate={duplicateGraphic}
        onBringToFront={bringGraphicToFront}
        onSendToBack={sendGraphicToBack}
        frame={frame}
        onSeek={seekToFrame}
      />
      <ShapesPanel
        graphics={graphics}
        selectedId={selectedGraphicId}
        onSelect={setSelectedGraphicId}
        onAddShape={addShapeGraphic}
        onUpdateShape={updateShapeGraphic}
        onRemove={removeShapeGraphic}
        onDuplicate={duplicateGraphic}
        onBringToFront={bringGraphicToFront}
        onSendToBack={sendGraphicToBack}
        frame={frame}
        onSeek={seekToFrame}
      />
      <ThreePanel
        graphics={graphics}
        selectedId={selectedGraphicId}
        onSelect={setSelectedGraphicId}
        onAddThree={addThreeGraphic}
        onUpdateThree={updateThreeGraphic}
        onRemove={removeThreeGraphic}
        onDuplicate={duplicateGraphic}
        onBringToFront={bringGraphicToFront}
        onSendToBack={sendGraphicToBack}
        frame={frame}
        onSeek={seekToFrame}
      />
    </>
  );

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
        onPromoteText={(index, field) => promoteLegacyText(index, field)}
        promotedKeys={promotedKeys}
      />
    </div>
  ) : null;

  return (
    // ARCHITECTURE LAYOUT STABLE : l'éditeur occupe exactement la hauteur du
    // viewport (moins le header studio h-14). `lg:flex-none` est CRUCIAL : sans
    // lui, flex-grow:1 (flex-1) étire le root pour remplir son parent, qui
    // grandit lui-même avec le contenu (chaîne circulaire via min-h-dvh du
    // shell) — la hauteur explicite serait ignorée et l'Inspector repousserait
    // la Timeline. La grille est bornée par `lg:grid-rows-[minmax(0,1fr)]` :
    // l'Inspector scroll en interne, la page ne s'allonge jamais.
    <div className="flex w-full flex-1 flex-col select-none lg:h-[calc(100dvh-3.5rem)] lg:flex-none lg:overflow-y-auto">
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
      {/* Rangée de grille BORNÉE (minmax(0,1fr)) : les colonnes ne peuvent
          plus s'étendre au-delà de la zone — l'Inspector scroll en interne. */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col lg:grid lg:grid-cols-[240px_minmax(0,1fr)_320px] lg:grid-rows-[minmax(0,1fr)] lg:gap-0 lg:overflow-hidden lg:px-4 lg:py-5">
        {/* Left: Scenes List (Desktop only) */}
        <aside className="hidden min-h-0 flex-col gap-1.5 rounded-l-2xl border border-white/8 bg-black/40 p-3 lg:flex">
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
        <div ref={centerColRef} className="flex min-h-0 min-w-0 flex-1 flex-col border-white/8 bg-[#090d0b] lg:border-y">
          {/* 1. Preview 9:16 Dominant — flex-1 min-h-0 : la zone peut se
              comprimer sans déborder (la Timeline reste visible dessous). */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:p-6"
            style={STAGE_BG}
          >
            {/* Boîte 9:16 contrainte par le STAGE.
                MOBILE : `relative w-full` + `aspect-ratio` → taille par la
                largeur (270×480), le stage grandit avec elle (flux vertical).
                DESKTOP : `lg:absolute lg:inset-0 lg:m-auto lg:w-auto` +
                `aspect-ratio` + `max-h-full` sur le MÊME élément → le
                navigateur transfère la contrainte de hauteur sur la largeur
                (234×417 = 9/16 exact mesuré) et le canvas se plie à la place
                disponible sans chevaucher le transport ni la Timeline.
                PAS de `h-fit` (rend max-h-full inopérant). */}
            <div
              className="relative mx-auto w-full max-h-full max-w-[270px] sm:max-w-[300px] lg:absolute lg:inset-0 lg:m-auto lg:w-auto lg:max-w-[320px] xl:max-w-[360px]"
              style={{ aspectRatio: "9/16", transform: `scale(${previewZoom})` }}
            >
              {/* Info badge top */}
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl bg-black/50 px-3 py-1 backdrop-blur-md">
                <Caption className="font-mono text-[9px] sm:text-[10px] text-white/70">
                  9:16 · {width}×{height} · {fps}fps
                </Caption>
                <Caption className="font-mono text-[9px] sm:text-[10px] text-hikma-gold">
                  {formatClock(frame, fps)}
                </Caption>
              </div>

              {/* Video Canvas — SINGLE Remotion Player instance + couche d'édition */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[0_20px_60px_-14px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                <Player
                  ref={playerRef}
                  component={HikmaWordVideo}
                  inputProps={{ scenes, graphics }}
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
                {/* Édition visuelle : sélection / drag / resize / rotation des
                    clips graphiques + hitboxes des TEXTES HÉRITÉS (clic =
                    promotion dans l'éditeur unifié). Ne modifie QUE
                    editor_state.graphics. */}
                {(graphics.length > 0 || legacyHits.length > 0) && (
                  <InteractiveGraphicsOverlay
                    graphics={graphics}
                    selectedId={selectedGraphicId}
                    frame={frame}
                    width={width}
                    height={height}
                    onSelect={setSelectedGraphicId}
                    onChange={(next) => {
                      setGraphics(next);
                      setSaveState("unsaved");
                    }}
                    legacyHits={legacyHits}
                    zoom={previewZoom}
                    onPromoteLegacy={(sceneIndex, field) =>
                      promoteLegacyText(sceneIndex, field as EditableTextField)
                    }
                  />
                )}
              </div>
            </div>

            {/* Zoom Preview (canvas) — 0.5x → 2x, indépendant du zoom Timeline.
                La boîte est scale()'ée depuis son centre ; `overflow-hidden` du
                stage la rogne aux bords sans jamais chevaucher le transport ni
                la Timeline. */}
            <div className="absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-full border border-white/10 bg-black/70 px-2 py-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                disabled={previewZoom <= 0.5}
                aria-label="Réduire le canvas"
                className="flex size-7 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
              >
                <ZoomOutIcon className="size-3.5" />
              </button>
              <span className="w-9 text-center font-mono text-[10px] text-white/80">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(2, Math.round((z + 0.25) * 100) / 100))}
                disabled={previewZoom >= 2}
                aria-label="Agrandir le canvas"
                className="flex size-7 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
              >
                <ZoomInIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewZoom(1)}
                aria-label="Remettre le zoom du canvas à 100%"
                title="Remettre à 100%"
                className="flex size-7 items-center justify-center rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
              >
                <MaximizeIcon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Séparateur drag vertical (desktop) — redimensionne le panneau
              Transport + Timeline ; le stage flex-1 grandit d'autant. */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Redimensionner la hauteur de la Timeline"
            title="Glisser pour redimensionner la Timeline"
            onPointerDown={startTimelineDrag}
            className="group relative z-20 hidden h-2.5 shrink-0 cursor-row-resize touch-none items-center justify-center border-t border-white/8 bg-black/50 transition-colors hover:bg-black/70 lg:flex"
          >
            <span className="flex items-center gap-1">
              <span className="block h-0.5 w-8 rounded-full bg-white/25 transition-colors group-hover:bg-hikma-teal-400 group-active:bg-hikma-teal-400" />
            </span>
          </div>

          {/* 2. Panneau inférieur : Transport + Storyboard + Timeline
              (hauteur pilotée par le séparateur ci-dessus). */}
          <div
            ref={bottomPanelRef}
            className="flex shrink-0 flex-col"
            style={timelinePanelH != null ? { height: timelinePanelH } : undefined}
          >
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

          {/* 4. Timeline — min-h-0 + overflow : quand le panneau est réduit,
              la Timeline scroll en interne au lieu de déborder. */}
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/8 bg-black/60 p-3 sm:p-4">
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
              graphics={graphics}
              selectedGraphicId={selectedGraphicId}
              onSelectGraphic={setSelectedGraphicId}
              onGraphicsChange={(next) => {
                setGraphics(next);
                setSaveState("unsaved");
              }}
            />
          </div>

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

        {/* Right: Inspector (Desktop permanent sidebar) — hauteur BORNÉE par
            la rangée minmax(0,1fr) + min-h-0 + overflow-y-auto : le scroll est
            LOCAL à l'Inspector, la Timeline reste stable en dessous. */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto rounded-r-2xl border border-white/8 bg-black/40 lg:flex">
          {inspectorBody}
          {graphicsPanel}
        </aside>
      </div>

      {/* Result / Error Banners */}
      {renderResult?.signedUrl && (
        <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              ✓
            </span>
            <div>
              <span className="block text-xs font-bold text-emerald-300">Vidéo MP4 prête à la diffusion</span>
              <span className="text-[10px] text-white/50">Rendu effectué avec succès (1080×1920 @ 30fps)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRenderModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
            >
              <PlayCircleIcon className="size-3.5" />
              <span>Visualiser le rendu</span>
            </button>
            <a
              href={`/api/admin/content-studio/download?contentKey=${encodeURIComponent(contentKey)}`}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-[0.98]"
            >
              <DownloadIcon className="size-3.5" />
              <span>Télécharger</span>
            </a>
          </div>
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

      {/* ── REAL-TIME RENDER PROGRESS & VISUALIZATION MODAL ────────────── */}
      <RenderProgressModal
        isOpen={renderModalOpen}
        onClose={() => setRenderModalOpen(false)}
        renderPhase={renderPhase}
        renderError={renderError}
        renderResult={renderResult}
        totalFrames={durationInFrames}
        templateKey={templateKey}
        title={title ?? templateKey}
        onRetry={() => void runRender()}
      />

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
            {graphicsPanel}
          </div>
        </div>
      )}
    </div>
  );
}
