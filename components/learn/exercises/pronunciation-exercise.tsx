"use client";

// Prononciation guidée (Phase 24H-Q1) — écouter → observer → répéter →
// s'enregistrer (LOCAL) → se réécouter → recommencer.
//
// Phase 24H-Q3-B — enrichissement PRUDENT :
//   - détection MIME progressive (MediaRecorder.isTypeSupported) ;
//   - mesures acoustiques DESCRIPTIVES (durée, RMS, silence, saturation) via
//     Web Audio API locale — jamais un verdict de prononciation ;
//   - verdict interne borné NO_SIGNAL | REVIEW_REQUIRED (jamais CORRECT/INCORRECT) ;
//   - auto-évaluation humaine (comparaison modèle/soi).
//
// Confidentialité : l'enregistrement reste ENTIÈREMENT LOCAL (getUserMedia +
// MediaRecorder dans le navigateur, blob → URL objet). Aucun envoi serveur,
// aucun fournisseur externe, aucune conservation. La permission micro n'est
// demandée QU'AU MOMENT du clic, jamais au chargement, et l'exercice
// fonctionne sans micro (répéter à voix haute sans enregistrement).

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, MicIcon, RotateCcwIcon, SquareIcon } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Caption, BodyMedium, BodyLarge } from "@/components/ui/typography";
import { ArabicText } from "@/components/ui/arabic-text";
import type { PhoneticMark } from "@/lib/learning/phonetics";
import {
  analyzeSamples,
  classifyRecording,
  describeRecording,
  type AcousticMetrics,
  type PronunciationProductionVerdict,
} from "@/lib/pronunciation/acoustics";

export type PronunciationGuidedProps = {
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  audioUrl: string | null;
  hints: string[];
  marks: PhoneticMark[];
  /** Dans une carte déjà focalisée sur le mot, masque le doublon de l'en-tête. */
  showWord?: boolean;
  /** Le sens reste derrière la révélation de la découverte quand nécessaire. */
  showMeaning?: boolean;
  /** Fourni → affiche un bouton « C'est bon » final (intégration exercice). */
  onComplete?: () => void;
  /** Fourni → le bouton final est déjà utilisé (désactivé après complétion). */
  completed?: boolean;
};

type RecState = "idle" | "recording" | "recorded";
type MicState = "unknown" | "available" | "unavailable" | "denied";

/** Critères d'auto-évaluation humaine (comparaison modèle / soi). */
type ComparisonChecks = {
  rhythm: boolean;
  sounds: boolean;
  vowels: boolean;
};

function recordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Formats candidats, du plus spécifique au plus générique. */
const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
] as const;

/**
 * Choisit un type MIME supporté par le navigateur, sinon null (le navigateur
 * utilisera son codec par défaut). Ne casse jamais l'exercice pour un codec
 * particulier.
 */
function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const type of CANDIDATE_MIME_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      // isTypeSupported peut lever sur certains moteurs : on continue.
    }
  }
  return null;
}

export function PronunciationGuided({
  arabic,
  transliteration,
  meaning,
  audioUrl,
  hints,
  marks,
  showWord = true,
  showMeaning = true,
  onComplete,
  completed = false,
}: PronunciationGuidedProps) {
  const [recState, setRecState] = useState<RecState>("idle");
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  // Le rendu initial reste déterministe côté serveur et côté client. Les API
  // navigateur ne sont consultées qu'après hydratation, sans demander de
  // permission avant l'action explicite « Enregistrer ».
  const [micState, setMicState] = useState<MicState>("unknown");
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Verdict descriptif (Q3-B) — jamais un verdict pédagogique.
  const [verdict, setVerdict] = useState<PronunciationProductionVerdict | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonChecks>({
    rhythm: false,
    sounds: false,
    vowels: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMicState(recordingSupported() ? "available" : "unavailable");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Nettoyage : stoppe le micro, libère l'URL objet et le contexte audio
  // (jamais de fuite, jamais de conservation).
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      void audioCtxRef.current?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecState("idle");
    setVerdict(null);
    setNote(null);
    setComparison({ rhythm: false, sounds: false, vowels: false });
  }, [recordedUrl]);

  /** Décode le blob et calcule des mesures descriptives (local, sans réseau). */
  async function analyzeBlob(blob: Blob): Promise<AcousticMetrics | null> {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      return analyzeSamples(buffer.getChannelData(0), buffer.sampleRate);
    } catch {
      return null;
    }
  }

  async function startRecording() {
    if (micState !== "available" && micState !== "denied") return;
    setVerdict(null);
    setNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecState("recorded");
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        void analyzeBlob(blob).then((m) => {
          setVerdict(m ? classifyRecording(m) : null);
          setNote(m ? describeRecording(m) : null);
        });
      };
      recorder.start();
      setRecState("recording");
    } catch {
      setMicState("denied");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function toggleComparison(key: keyof ComparisonChecks) {
    setComparison((c) => ({ ...c, [key]: !c[key] }));
  }

  const canRecord = micState === "available";
  const canAttemptRecording = canRecord || micState === "denied";
  const hasReviewableSignal = verdict === "REVIEW_REQUIRED";

  return (
    <div className="flex flex-col gap-5">
      {showWord && arabic ? (
        <ArabicText className="text-h2 text-center font-normal">{arabic}</ArabicText>
      ) : null}

      {showWord && transliteration ? (
        <Caption className="text-center text-muted-foreground">
          {transliteration}
        </Caption>
      ) : null}

      {showMeaning && meaning ? (
        <BodyLarge className="text-center">{meaning}</BodyLarge>
      ) : null}

      {/* Écoute du modèle réel (Muallim, AudioPlayer 24F). */}
      {audioUrl ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/20 bg-background p-4">
          <Caption className="text-primary-strong">1 · Écoute</Caption>
          <AudioPlayer key={audioUrl} src={audioUrl} label="Écouter le modèle" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-border-subtle bg-surface-subtle p-4 text-center" role="status">
          <Caption className="text-text-secondary">1 · Écoute</Caption>
          <BodyMedium className="text-text-secondary">Audio momentanément indisponible. Tu peux continuer.</BodyMedium>
        </div>
      )}

      {/* Observe : marques de vocalisation détectées dans la forme réelle. */}
      {marks.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Caption className="text-primary-strong">2 · Observe</Caption>
          <div className="flex flex-wrap justify-center gap-2">
          {marks.map((m) => (
            <span
              key={m.key}
              title={m.explanation}
              className="rounded-lg border border-border bg-surface px-3 py-1 text-body-sm text-foreground"
            >
              <ArabicText as="span" className="font-normal">{m.symbol}</ArabicText>{" "}
              {m.label}
            </span>
          ))}
          </div>
        </div>
      ) : null}

      {/* Conseils simples (max 4). */}
      {hints.length > 0 ? (
        <div className="flex flex-col gap-2">
          {hints.map((h) => (
            <p key={h} className="text-body-sm text-muted-foreground leading-relaxed">
              • {h}
            </p>
          ))}
        </div>
      ) : null}

      {/* Répète : enregistrement LOCAL facultatif (jamais envoyé). */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-1 text-center">
            <Caption className="text-primary-strong">3 · Répète</Caption>
          <BodyMedium className="font-medium">Répète à ton tour</BodyMedium>
        </div>

        {micState === "unknown" ? (
          <BodyMedium className="text-center text-muted-foreground" role="status" aria-live="polite">
            Préparation du microphone…
          </BodyMedium>
        ) : micState === "unavailable" ? (
          <BodyMedium className="text-center text-muted-foreground">
            Le microphone n&apos;est pas disponible sur cet appareil ou ce navigateur.
            Tu peux répéter simplement à voix haute.
          </BodyMedium>
        ) : micState === "denied" ? (
          <BodyMedium className="text-center text-muted-foreground">
            L&apos;autorisation du microphone est refusée. Tu peux continuer sans
            enregistrer, ou l&apos;autoriser dans les réglages du navigateur.
          </BodyMedium>
        ) : null}

        {recState === "idle" && canAttemptRecording ? (
            <div className="flex flex-col items-center gap-2">
              <Button size="lg" onClick={startRecording} className="min-h-12" aria-label="Répète à ton tour et enregistre">
                <MicIcon /> {micState === "denied" ? "Réessayer" : "Enregistrer"}
              </Button>
              {micState === "available" ? (
                <Caption className="text-center text-muted-foreground">
                  L&apos;autorisation sera demandée uniquement après ce clic.
                </Caption>
              ) : null}
            </div>
        ) : null}

        {recState === "recording" ? (
          <div className="flex flex-col items-center gap-2">
            <BodyMedium className="text-center text-muted-foreground" role="status">
              Enregistrement…
            </BodyMedium>
            <Button size="lg" variant="destructive-outline" onClick={stopRecording} className="min-h-12">
              <SquareIcon /> Arrêter
            </Button>
          </div>
        ) : null}

        {recState === "recorded" && recordedUrl ? (
          <div className="flex flex-col items-center gap-3">
            <Caption className="text-primary-strong">4 · Compare</Caption>
            <AudioPlayer key={recordedUrl} src={recordedUrl} label="Réécouter ma prononciation" />

            {/* Mesure descriptive (jamais un verdict de prononciation). */}
            {note ? (
              <BodyMedium
                className="text-center text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                {note}
              </BodyMedium>
            ) : null}

            {/* Auto-évaluation humaine (comparaison modèle / soi). */}
            {hasReviewableSignal ? (
              <div className="flex w-full flex-col gap-2">
                <Caption className="text-center text-muted-foreground">
                  Compare ta prononciation avec le modèle. Si tu hésites, réécoute
                  et réessaie.
                </Caption>
                {(
                  [
                    ["rhythm", "Le rythme semble proche"],
                    ["sounds", "Les sons me semblent proches"],
                    ["vowels", "Les voyelles me semblent proches"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="checkbox"
                    aria-checked={comparison[key]}
                    onClick={() => toggleComparison(key)}
                    className="flex min-h-12 items-center justify-between gap-2 rounded-lg border border-input bg-popover px-4 text-left text-body-md text-foreground hover:bg-accent/50"
                  >
                    <span>{label}</span>
                    <span
                      className={
                        "flex size-5 items-center justify-center rounded border " +
                        (comparison[key]
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background")
                      }
                    >
                      {comparison[key] ? <CheckIcon className="size-4" /> : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="lg" onClick={reset} className="min-h-12">
                <RotateCcwIcon /> Réessayer
              </Button>
              {onComplete ? (
                <Button size="lg" onClick={onComplete} disabled={completed} className="min-h-12">
                  <CheckIcon /> C&apos;est bon
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {recState === "recorded" && !recordedUrl ? (
          <BodyMedium className="text-center text-muted-foreground">
            Enregistrement vide — réessaie.
          </BodyMedium>
        ) : null}

        <Caption className="text-center text-muted-foreground">
          Ton enregistrement reste sur ton appareil : rien n&apos;est envoyé ni conservé.
        </Caption>
      </div>
    </div>
  );
}
