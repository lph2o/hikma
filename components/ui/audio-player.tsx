"use client";

// Lecteur audio Hikma (brique Design System — Phase 24C, intégré en 24F).
// Remplace le `<audio controls>` natif minimal : états idle/loading/playing/
// paused/ended/error, play/pause/replay/réessayer, clavier, focus, cible
// tactile ≥ 48px. Coordination Phase 24F : un seul audio actif à la fois
// (voir lib/ui/audio-coordinator).

import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";
import { pauseOtherAudios, registerAudio } from "@/lib/ui/audio-coordinator";

export type AudioPlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export type AudioPlayerProps = {
  src: string;
  /** Libellé du bouton principal (verbe pédagogique, défaut « Écouter »). */
  label?: string;
  className?: string;
};

const STATUS_LABEL: Record<AudioPlayerStatus, string> = {
  idle: "",
  loading: "Chargement…",
  playing: "Lecture en cours",
  paused: "",
  ended: "Terminé — réécoute",
  error: "Impossible de lire l'audio. Réessaie.",
};

export function AudioPlayer({
  src,
  label = "Écouter",
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<AudioPlayerStatus>("idle");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const unregister = registerAudio(audio);
    const onPlay = () => {
      // Un seul audio actif : toute lecture stoppe les autres lecteurs.
      pauseOtherAudios(audio);
      setStatus("playing");
    };
    const onPause = () =>
      setStatus((s) => (s === "playing" ? "paused" : s));
    const onEnded = () => setStatus("ended");
    const onWaiting = () => setStatus("loading");
    const onError = () => setStatus("error");

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      unregister();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  // Changement de source (nouvelle question) : réinitialiser via `key={src}`
  // à l'appel (remontage complet) — voir les exercices AUDIO_TO_WORD / WORD_TO_AUDIO.

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ended) audio.currentTime = 0;
    void audio.play().catch(() => setStatus("error"));
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  }, [play]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => setStatus("error"));
  }, []);

  /** Réessai après erreur : recharge l'élément avant de rejouer. */
  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setStatus("loading");
    audio.load();
    void audio.play().catch(() => setStatus("error"));
  }, []);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const isError = status === "error";
  const isEnded = status === "ended";
  const caption = isError ? STATUS_LABEL.error : STATUS_LABEL[status];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)} data-audio-status={status}>
      <audio ref={audioRef} src={src} preload="none">
        Ton navigateur ne supporte pas la lecture audio.
      </audio>

      <div className="flex items-center gap-3">
        <Button
          size="xl"
          onClick={isError ? retry : isEnded ? restart : toggle}
          disabled={isLoading}
          loading={isLoading}
          aria-label={
            isError
              ? "Réessayer"
              : isPlaying
                ? "Mettre en pause"
                : isEnded
                  ? "Rejouer"
                  : label
          }
          className="min-h-12 min-w-12 rounded-full"
        >
          {isPlaying && !isError ? <PauseIcon /> : <PlayIcon />}
        </Button>

        {isEnded ? (
          <Button
            variant="outline"
            size="icon-lg"
            onClick={restart}
            aria-label="Réécouter"
            className="rounded-full"
          >
            <RotateCcwIcon />
          </Button>
        ) : null}

        {isError ? (
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            aria-label="Réessayer"
          >
            Réessayer
          </Button>
        ) : null}
      </div>

      {caption ? (
        <span role="status" aria-live="polite">
          <Caption className={cn(isError && "text-error-text")}>
            {caption}
          </Caption>
        </span>
      ) : null}
    </div>
  );
}
