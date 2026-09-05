"use client";

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle2Icon,
  XCircleIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  LayersIcon,
  CpuIcon,
  FilmIcon,
  CloudUploadIcon,
  XIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RenderStageId = "validate" | "bundle" | "render" | "upload" | "done" | "error";

export interface RenderProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  renderPhase: "idle" | "rendering" | "done" | "failed";
  renderError: string | null;
  renderResult: {
    signedUrl?: string;
    storagePath?: string;
    durationInFrames?: number;
  } | null;
  totalFrames?: number;
  templateKey?: string;
  title?: string;
  onRetry?: () => void;
}

const STAGES = [
  {
    id: "validate",
    name: "1. Validation & Synchronisation Audio",
    desc: "Vérification des scènes Uthmani et durée Al-Afasy",
    icon: LayersIcon,
    minProgress: 0,
    maxProgress: 20,
    durationMs: 2500,
  },
  {
    id: "bundle",
    name: "2. Compilation Remotion Bundle",
    desc: "Chargement des polices Amiri & Poppins, Webpack",
    icon: CpuIcon,
    minProgress: 20,
    maxProgress: 50,
    durationMs: 4500,
  },
  {
    id: "render",
    name: "3. Rendu Headless & Encodage H.264",
    desc: "Génération 1080×1920 @ 30fps avec composition audio",
    icon: FilmIcon,
    minProgress: 50,
    maxProgress: 85,
    durationMs: 7000,
  },
  {
    id: "upload",
    name: "4. Finalisation & Upload Sécurisé",
    desc: "Stockage Supabase Storage & signature de l'URL",
    icon: CloudUploadIcon,
    minProgress: 85,
    maxProgress: 98,
    durationMs: 3000,
  },
] as const;

export function RenderProgressModal({
  isOpen,
  onClose,
  renderPhase,
  renderError,
  renderResult,
  totalFrames = 315,
  templateKey = "WORD_REVEAL_V1",
  title = "Vidéo Coranique",
  onRetry,
}: RenderProgressModalProps) {
  const [progress, setProgress] = useState(5);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [simulatedFrame, setSimulatedFrame] = useState(1);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Timer d'avancement simulé fluide et synchronisé avec la phase réelle
  useEffect(() => {
    if (!isOpen || renderPhase !== "rendering") {
      return;
    }

    startTimeRef.current = Date.now();

    const timeout = setTimeout(() => {
      setProgress(5);
      setCurrentStageIndex(0);
      setElapsedSeconds(0);
      setSimulatedFrame(1);
    }, 0);

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - (startTimeRef.current ?? now)) / 1000);
      setElapsedSeconds(elapsed);

      // Calcul progressif réaliste
      setProgress((prev) => {
        if (prev >= 95) return 95; // Plafond en attendant la réponse serveur
        const increment = prev < 30 ? 2.5 : prev < 60 ? 1.8 : prev < 85 ? 1.2 : 0.6;
        const next = Math.min(95, prev + increment);

        // Synchronisation étape active
        if (next < 20) setCurrentStageIndex(0);
        else if (next < 50) setCurrentStageIndex(1);
        else if (next < 85) setCurrentStageIndex(2);
        else setCurrentStageIndex(3);

        // Frame simulé pour le radar de rendu
        const currentCalculatedFrame = Math.min(
          totalFrames,
          Math.max(1, Math.round((next / 100) * totalFrames)),
        );
        setSimulatedFrame(currentCalculatedFrame);

        return next;
      });
    }, 250);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isOpen, renderPhase, totalFrames]);

  const isDone = renderPhase === "done" && Boolean(renderResult?.signedUrl);
  const isFailed = renderPhase === "failed";
  const displayProgress = isDone ? 100 : progress;
  const displayStageIndex = isDone ? 3 : currentStageIndex;

  const handleCopyLink = () => {
    if (!renderResult?.signedUrl) return;
    void navigator.clipboard.writeText(renderResult.signedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isDone ? "Rendu terminé avec succès" : isFailed ? "Échec du rendu vidéo" : "Génération de la vidéo en cours"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop sombre avec flou immersif */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={isDone || isFailed ? onClose : undefined}
      />

      {/* Conteneur Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0d1411] shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        {/* En-tête modal */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                isDone
                  ? "bg-emerald-500/20 text-emerald-400"
                  : isFailed
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-hikma-gold/15 text-hikma-gold-bright animate-pulse",
              )}
            >
              {isDone ? (
                <CheckCircle2Icon className="size-5" />
              ) : isFailed ? (
                <XCircleIcon className="size-5" />
              ) : (
                <SparklesIcon className="size-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isDone
                  ? "Rendu terminé avec succès"
                  : isFailed
                    ? "Échec du rendu vidéo"
                    : "Génération de la vidéo en cours"}
              </h2>
              <p className="text-xs text-white/50">
                {templateKey} · 1080×1920 @ 30fps
              </p>
            </div>
          </div>

          {(isDone || isFailed) && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XIcon className="size-5" />
            </button>
          )}
        </div>

        {/* Corps modal : ÉTAT SUCCÈS (Lecteur Vidéo + Actions) */}
        {isDone && renderResult?.signedUrl ? (
          <div className="flex flex-col gap-6 p-6 sm:p-8 animate-feedback-in">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
              {/* Lecteur Vidéo HD Preview */}
              <div className="relative mx-auto aspect-[9/16] w-44 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                <video
                  src={renderResult.signedUrl}
                  controls
                  playsInline
                  autoPlay
                  className="size-full object-contain"
                />
              </div>

              {/* Détails & Métadonnées de la vidéo exportée */}
              <div className="flex flex-col gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2Icon className="size-3.5" />
                    <span>MP4 Haute Définition</span>
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
                  <p className="text-xs text-white/60">
                    La vidéo a été encodée avec succès et stockée de manière persistante sur Supabase.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-black/40 p-3 text-xs">
                  <div>
                    <span className="text-white/40 block">Résolution</span>
                    <span className="font-semibold text-white">1080 × 1920 (9:16)</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Images</span>
                    <span className="font-semibold text-white">{renderResult.durationInFrames ?? totalFrames} frames @ 30fps</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Durée</span>
                    <span className="font-semibold text-white">
                      {(((renderResult.durationInFrames ?? totalFrames)) / 30).toFixed(1)} s
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Audio</span>
                    <span className="font-semibold text-emerald-400">Verset Al-Afasy (AAC)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a
                    href={renderResult.signedUrl}
                    download={`${templateKey}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:bg-emerald-500 active:scale-[0.98]"
                  >
                    <DownloadIcon className="size-4" />
                    <span>Télécharger MP4</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-xs font-semibold text-white hover:bg-white/10 active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="size-4 text-emerald-400" />
                        <span>Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-4" />
                        <span>Copier lien</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isFailed ? (
          /* Corps modal : ÉTAT ERREUR */
          <div className="flex flex-col items-center gap-6 p-8 text-center animate-feedback-in">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
              <XCircleIcon className="size-9" />
            </div>
            <div className="flex max-w-md flex-col gap-2">
              <h3 className="text-lg font-bold text-white">Le rendu n&apos;a pas pu aboutir</h3>
              <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                {renderError ?? "Une erreur inattendue est survenue pendant la composition Remotion."}
              </p>
            </div>
            <div className="flex gap-3">
              {onRetry && (
                <Button
                  type="button"
                  onClick={onRetry}
                  className="rounded-xl bg-hikma-teal-700 px-5 text-xs font-bold text-white hover:bg-hikma-teal-800"
                >
                  Réessayer le rendu
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          /* Corps modal : ÉTAT RENDU EN COURS (Barre de progression + Radar 9:16 + Étapes) */
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            {/* Barre de progression avec pourcentage et timer */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-hikma-gold-bright flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-hikma-gold animate-ping" />
                  Progression globale
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-white/50">Temps écoulé : {formatTime(elapsedSeconds)}</span>
                  <span className="text-lg text-white font-mono">{Math.round(displayProgress)}%</span>
                </div>
              </div>

              {/* Rail de barre de progression */}
              <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-white/10 bg-black/60 p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-hikma-teal-500 via-hikma-gold to-hikma-gold-bright transition-all duration-300 ease-out shadow-[0_0_12px_rgba(240,208,144,0.4)]"
                  style={{ width: `${Math.max(4, Math.round(displayProgress))}%` }}
                />
              </div>
            </div>

            {/* Visualisation en temps réel : Mini Canvas de rendu 9:16 + Liste des étapes */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
              {/* Radar visuel 9:16 simulé */}
              <div className="relative mx-auto aspect-[9/16] w-36 overflow-hidden rounded-2xl border border-white/15 bg-[#070b09] shadow-xl flex flex-col items-center justify-between p-3">
                {/* Ligne laser de balayage */}
                <div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-hikma-gold-bright to-transparent blur-[1px] opacity-80 animate-bounce"
                  style={{ animationDuration: "1.8s" }}
                />

                <div className="flex w-full items-center justify-between text-[9px] text-white/40 font-mono">
                  <span>REC</span>
                  <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                </div>

                <div className="flex flex-col items-center gap-1 text-center my-auto">
                  <FilmIcon className="size-6 text-hikma-gold/60 animate-pulse" />
                  <span className="text-[10px] font-bold text-white/90">
                    Frame {simulatedFrame}
                  </span>
                  <span className="text-[9px] text-white/40">
                    / {totalFrames} frames
                  </span>
                </div>

                <div className="w-full rounded-md bg-white/5 py-1 text-center text-[9px] font-mono text-emerald-400/80">
                  30.0 FPS · H.264
                </div>
              </div>

              {/* Liste des 4 étapes avec statut visuel */}
              <div className="flex flex-col gap-2.5">
                {STAGES.map((stage, idx) => {
                  const isPassed = displayStageIndex > idx;
                  const isCurrent = displayStageIndex === idx;
                  const StageIcon = stage.icon;

                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5 transition-all",
                        isCurrent
                          ? "border-hikma-gold/40 bg-hikma-gold/10 shadow-[0_0_15px_rgba(200,160,88,0.1)]"
                          : isPassed
                            ? "border-emerald-500/20 bg-emerald-950/20 opacity-80"
                            : "border-white/5 bg-black/20 opacity-40",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs",
                          isCurrent
                            ? "bg-hikma-gold text-black font-bold animate-pulse"
                            : isPassed
                              ? "bg-emerald-500/20 text-emerald-400 font-bold"
                              : "bg-white/10 text-white/50",
                        )}
                      >
                        {isPassed ? <CheckIcon className="size-4" /> : <StageIcon className="size-3.5" />}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span
                          className={cn(
                            "text-xs font-bold truncate",
                            isCurrent
                              ? "text-white"
                              : isPassed
                                ? "text-emerald-300"
                                : "text-white/60",
                          )}
                        >
                          {stage.name}
                        </span>
                        <span className="text-[10px] text-white/50 truncate">
                          {stage.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied d'information */}
            <div className="rounded-xl border border-white/8 bg-black/30 px-4 py-2.5 text-center text-xs text-white/50">
              💡 Le moteur Remotion synthétise la vidéo frame par frame en arrière-plan. Ne fermez pas cet onglet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
