"use client";

// Session de leçon (Phase 5) + reprise persistante (Phase 24E).
//
// Orchestration UI de la boucle :
//   exercice → réponse → validation (moteur) → feedback → suivant → fin.
// La persistance (recordAnswer) est déléguée aux Server Actions ; le moteur
// pédagogique (generate/validate/score) n'est jamais réimplémenté ici.
//
// Phase 24E : l'état de session (position + réponses en attente) est sauvegardé
// automatiquement après chaque exercice et restauré à l'ouverture. La séquence
// d'exercices étant DÉTERMINISTE (lesson + maîtrise + données), on ne persiste
// PAS les questions, seulement la position et les réponses non encore rejouées.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Spinner } from "@/components/ui/spinner";
import { BodyMedium } from "@/components/ui/typography";
import {
  validateAnswer,
  type AnswerResult,
  type ExerciseAnswer,
  type GeneratedExercise,
  type GeneratedOption,
} from "@/lib/exercises";
import {
  clearLessonSession,
  recordLessonActivityOnly,
  saveLessonSession,
  submitLessonResults,
  submitSkillAttempts,
  type SkillAttemptInput,
} from "@/lib/learning/actions";
import { skillForExerciseType } from "@/lib/learning";
import {
  appendAttempt,
  clampSessionIndex,
  computeSessionStats,
  hasSessionProgress,
  pendingWordAttempts,
  selectReinforcementWords,
  type LessonSessionState,
  type WordAttempts,
} from "@/lib/learning/session";
import {
  initExerciseQueue,
  handlePassExercise,
  handleCompleteExercise,
  isQueueFinished,
  getRepriseRemainingCount,
  type ExerciseQueueState,
} from "@/lib/learning/session-queue";
import { exerciseIdentity } from "@/components/learn/exercises/exercise-identity";
import { ExerciseCard } from "@/components/learn/exercises";
import { exerciseSkillLabel, HikmaExerciseShell } from "@/components/learn/exercises/hikma-exercise-shell";
import { FeedbackPanel } from "@/components/learn/exercises/options-exercise";
import { LessonComplete } from "@/components/learn/lesson-complete";
import { LessonDiscovery } from "@/components/learn/lesson-discovery";
import { MiniReview } from "@/components/learn/mini-review";
import { HikmaLessonFocusHeader } from "@/components/learn/hikma-lesson-focus";
import type { LessonAyahContext } from "@/lib/learning/queries";

/** Mot présenté pendant la Découverte (F2) — données réelles de la leçon. */
export type DiscoveryWord = {
  wordId: string;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  meaningLanguage?: string;
  meaningFallback?: boolean;
  /** Provenance de la traduction retenue (ex. « Hikma — lexique éditorial »). */
  translationSource?: string;
  /** true si la traduction retenue est une traduction Hikma validée. */
  isValidated?: boolean;
  /** URL audio réelle, si une ressource enregistrée existe pour ce mot. */
  audioUrl?: string | null;
  /** Référence d'ayah réelle où le mot apparaît (ex. « Al-Fātiḥah 1:3 »), ou null. */
  ayahRef?: string | null;
};

export type LessonPlayerProps = {
  lessonId: string;
  lessonTitle: string;
  lessonObjective?: string | null;
  exercises: GeneratedExercise[];
  /** Mots de la leçon (ordre réel des lesson_words) pour l'étape Découverte. */
  discovery?: DiscoveryWord[];
  /** Exercice de prononciation guidée (24H-Q1), auto-évalué, pour la découverte. */
  guidedPronunciation?: GeneratedExercise | null;
  isAuthenticated: boolean;
  nextLesson: { title: string; href: string } | null;
  pathProgress: { completed: number; total: number } | null;
  /** Nom de la sourate (transliteration), si connu — jamais inventé. */
  surahName?: string | null;
  /** Session à reprendre (position + réponses en attente), ou null. */
  resumeState?: LessonSessionState | null;
  ayahContext?: LessonAyahContext[];
  meaningFallback?: boolean;
  audioUnavailable?: boolean;
};

type Phase = "discovery" | "playing" | "miniReview" | "submitting" | "error" | "complete";

export function LessonPlayer({
  lessonId,
  lessonTitle,
  lessonObjective,
  exercises,
  discovery,
  guidedPronunciation,
  isAuthenticated,
  nextLesson,
  pathProgress,
  surahName,
  resumeState,
  ayahContext = [],
  meaningFallback = false,
  audioUnavailable = false,
}: LessonPlayerProps) {
  const router = useRouter();
  // Reprise : borne la position dans la séquence régénérée (jamais hors limites).
  const initialIndex = resumeState
    ? clampSessionIndex(resumeState.currentExerciseIndex, exercises.length)
    : 0;
  const [queue, setQueue] = useState<ExerciseQueueState>(() =>
    initExerciseQueue(exercises, initialIndex),
  );
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [results, setResults] = useState<WordAttempts[]>(
    resumeState?.results ?? [],
  );
  // Réponses de compétence (multi-dimensionnel, Phase 23F) — collectées pendant
  // la session puis soumises à la fin (couche additive, best-effort).
  const [skillAttempts, setSkillAttempts] = useState<SkillAttemptInput[]>(
    resumeState?.skillAttempts ?? [],
  );
  const [phase, setPhase] = useState<Phase>(
    resumeState && hasSessionProgress(resumeState) ? "playing" : "discovery",
  );
  const [error, setError] = useState<string | null>(null);
  // true si la dernière erreur est un succès PARTIEL (une partie déjà persistée).
  const [errorIsPartial, setErrorIsPartial] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  // Mini-révision de fin (Phase 36C) : mots à re-présenter + nombre renforcé.
  // Retry d'écriture arabe (Phase 36E) : mots ratés sur `meaning_to_form`.
  const [reviewWords, setReviewWords] = useState<DiscoveryWord[]>([]);
  const [arabicRetryWords, setArabicRetryWords] = useState<DiscoveryWord[]>([]);
  const [reinforcedWords, setReinforcedWords] = useState(0);
  // Payload de fin conservé pendant la mini-révision (reprise exacte du finish).
  const pendingFinish = useRef<{
    results: WordAttempts[];
    skillAttempts: SkillAttemptInput[];
  }>({ results: [], skillAttempts: [] });
  // Mots dont la persistance a déjà réussi (utilisé lors d'un « Réessayer »
  // après une erreur partielle — jamais re-soumis, pas de double avancement).
  const savedWordIds = useRef<string[]>([]);
  // true une fois l'activité quotidienne enregistrée (retry = activité seule).
  const activityRecorded = useRef(false);
  // true une fois les réponses de compétence soumises (anti double soumission).
  const skillAttemptsSubmitted = useRef(false);

  const finished = isQueueFinished(queue);
  const current = queue.current;
  const isSelfAssessment =
    current?.type === "WORD_RECOGNITION" ||
    current?.type === "PRONUNCIATION_GUIDED";
  const isFreeText = current?.metadata.freeText === true;
  const result: AnswerResult | null =
    current && answer && !isSelfAssessment
      ? validateAnswer(current, answer)
      : null;

  /** Sauvegarde best-effort de l'état de session (autosave après chaque exercice). */
  function persistSession(
    nextIndex: number,
    nextResults: WordAttempts[],
    nextSkillAttempts: SkillAttemptInput[],
  ) {
    if (!isAuthenticated) return;
    if (
      !hasSessionProgress({
        currentExerciseIndex: nextIndex,
        results: nextResults,
        skillAttempts: nextSkillAttempts,
      })
    ) {
      return;
    }
    void saveLessonSession({
      lessonId,
      currentExerciseIndex: nextIndex,
      results: nextResults,
      skillAttempts: nextSkillAttempts,
    }).catch((err) => {
      console.error("saveLessonSession failed:", err);
    });
  }

  /** Quitte la leçon en sauvegardant la session (si connecté). */
  async function handleQuit() {
    if (isQuitting) return;
    setIsQuitting(true);
    try {
      if (
        isAuthenticated &&
        hasSessionProgress({ currentExerciseIndex: queue.mainIndex, results, skillAttempts })
      ) {
        await saveLessonSession({
          lessonId,
          currentExerciseIndex: queue.mainIndex,
          results,
          skillAttempts,
        });
      }
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la session:", err);
    } finally {
      router.push("/learn");
    }
  }

  function choose(option: GeneratedOption) {
    if (answer != null || phase !== "playing" || !current) return;
    setAnswer({ optionIndex: option.position - 1, content: option.content });
  }

  /** Soumission d'une réponse TEXTE LIBRE (rappel machine-noté). */
  function submitText(content: string) {
    if (answer != null || phase !== "playing" || !current) return;
    setAnswer({ content });
  }

  /** Passe la question en cours : ajout à la file de reprise et passage immédiat. */
  function handlePass() {
    if (!current || answer != null || phase !== "playing") return;

    let nextResults = results;
    let nextSkillAttempts = skillAttempts;

    const id = exerciseIdentity(current);
    const alreadyPassed = queue.passedExerciseIds.includes(id);

    // Si la question n'a pas encore été passée, on enregistre l'échec initial (non correct)
    // pour le SRS, sans doublon statistique même si elle est re-passée plus tard.
    if (!alreadyPassed && !isSelfAssessment) {
      nextResults = appendAttempt(results, current.metadata.targetWordId, false);
      setResults(nextResults);

      const skill = skillForExerciseType(current.type);
      if (skill) {
        nextSkillAttempts = [
          ...skillAttempts,
          { wordId: current.metadata.targetWordId, skill, correct: false },
        ];
        setSkillAttempts(nextSkillAttempts);
      }
    }

    setAnswer(null);
    const nextQueue = handlePassExercise(queue);
    setQueue(nextQueue);
    persistSession(nextQueue.mainIndex, nextResults, nextSkillAttempts);
  }

  /** Passe à l'exercice suivant (ou termine la session) — jamais de double soumission. */
  function continueNext() {
    if (!current) return;
    if (answer == null || phase !== "playing") return;

    // AMBIGUOUS (rappel) : ni succès ni échec compté (neutralité) — la réponse
    // est révélée mais la compétence n'est pas modifiée.
    const isAmbiguous = result?.status === "AMBIGUOUS";

    let nextResults = results;
    let nextSkillAttempts = skillAttempts;

    const id = exerciseIdentity(current);
    const alreadyPassed = queue.passedExerciseIds.includes(id);

    // L'auto-évaluation (WORD_RECOGNITION) n'est pas notée par le moteur :
    // on ne l'enregistre pas dans la progression. AMBIGUOUS est également neutre.
    // Si la question a déjà été passée auparavant, son résultat a déjà été
    // comptabilisé comme non acquis (false) : on ne ré-enregistre pas de tentative supplémentaire.
    if (!alreadyPassed && !isSelfAssessment && !isAmbiguous) {
      const correct = result?.correct === true;
      nextResults = appendAttempt(
        results,
        current.metadata.targetWordId,
        correct,
      );
      setResults(nextResults);

      // Maîtrise par compétence : associe la réponse à la compétence ciblée.
      const skill = skillForExerciseType(current.type);
      if (skill) {
        nextSkillAttempts = [
          ...skillAttempts,
          { wordId: current.metadata.targetWordId, skill, correct },
        ];
        setSkillAttempts(nextSkillAttempts);
      }
    }

    setAnswer(null);
    const nextQueue = handleCompleteExercise(queue);
    setQueue(nextQueue);

    if (isQueueFinished(nextQueue)) {
      // Renforcement de fin (Phases 36C + 36E), SANS re-grading ni re-SRS :
      //  - retry d'écriture arabe pour les mots ratés sur `meaning_to_form` ;
      //  - auto-évaluation pour les AUTRES mots incorrects (jamais en double).
      const toWords = (ids: string[]) =>
        ids
          .map((id) => (discovery ?? []).find((d) => d.wordId === id))
          .filter((d): d is DiscoveryWord => d != null);
      const { arabicRetryWordIds, selfReviewWordIds } = selectReinforcementWords(
        nextResults,
        nextSkillAttempts,
      );
      const arabicRetryWords = toWords(arabicRetryWordIds);
      const reviewWords = toWords(selfReviewWordIds);
      if (arabicRetryWords.length > 0 || reviewWords.length > 0) {
        pendingFinish.current = {
          results: nextResults,
          skillAttempts: nextSkillAttempts,
        };
        setArabicRetryWords(arabicRetryWords);
        setReviewWords(reviewWords);
        setReinforcedWords(0);
        setPhase("miniReview");
        return;
      }
      void finish(nextResults, nextSkillAttempts);
    } else {
      persistSession(nextQueue.mainIndex, nextResults, nextSkillAttempts);
    }
  }

  async function finish(
    finalResults: WordAttempts[],
    finalSkillAttempts: SkillAttemptInput[],
  ) {
    if (!isAuthenticated) {
      setPhase("complete");
      return;
    }
    setPhase("submitting");

    // 1. Persistance pédagogique (mots non encore sauvegardés uniquement).
    const pending = pendingWordAttempts(finalResults, savedWordIds.current);
    if (pending.length > 0) {
      const res = await submitLessonResults(lessonId, pending);
      if (res.savedWordIds.length > 0) {
        savedWordIds.current = [
          ...new Set([...savedWordIds.current, ...res.savedWordIds]),
        ];
      }
      if (res.activitySaved) activityRecorded.current = true;

      if (res.status === "partial") {
        // Une partie de la progression est persistée : JAMAIS « non enregistrée ».
        setErrorIsPartial(true);
        setError(
          res.error ??
            "Ta progression est en partie enregistrée. Réessaie pour terminer la synchronisation.",
        );
        setPhase("error");
        return;
      }
      if (res.status === "failed") {
        // Aucun mot persisté : erreur réelle, clairement identifiée.
        setErrorIsPartial(false);
        setError(
          res.error ??
            "Impossible d'enregistrer ta progression pour le moment. Réessaie.",
        );
        setPhase("error");
        return;
      }
      // success : continue.
    }

    // 2. Activité quotidienne — terminée séparément si absente (idempotente,
    //    sans rejouer la progression pédagogique). NON BLOQUANTE : la pédagogie
    //    est déjà sauvegardée ; une erreur statistique est journalisée côté
    //    serveur mais ne doit JAMAIS être présentée comme une perte de
    //    progression (Phase 24H-ACTIVITY-IDEMPOTENCY).
    if (!activityRecorded.current) {
      const res = await recordLessonActivityOnly(lessonId);
      if (res.activityRecorded) activityRecorded.current = true;
      // res.ok === false → activité statistique seule en échec : on complète
      // quand même (la progression pédagogique est déjà persistée).
    }

    // 3. Maîtrise par compétence (couche additive, best-effort). NON BLOQUANTE :
    //    on ne fait pas attendre la fin de leçon sur les écritures N+1 (~15-20 s).
    if (!skillAttemptsSubmitted.current && finalSkillAttempts.length > 0) {
      skillAttemptsSubmitted.current = true;
      void submitSkillAttempts(finalSkillAttempts).catch((err) => {
        console.error("submitSkillAttempts failed:", err);
      });
    }

    // 4. Session terminée : on nettoie l'état de reprise (leçon complétée).
    //    Non bloquant : la progression est déjà persistée ; une erreur ici
    //    n'affecte pas l'utilisateur (la session expirerait naturellement).
    void clearLessonSession(lessonId).catch((err) => {
      console.error("clearLessonSession failed:", err);
    });

    setPhase("complete");
  }

  if (exercises.length === 0) {
    return (
      <Card className="items-center gap-4 p-8 text-center">
        <Mascot variant="learn" size="lg" message="Rien à faire ici pour l'instant" />
        <BodyMedium className="text-muted-foreground">
          Cette leçon ne contient aucun exercice exploitable.
        </BodyMedium>
        <Button render={<Link href="/learn" />} variant="outline">
          Retour au parcours
        </Button>
      </Card>
    );
  }

  if (phase === "discovery") {
    return (
      <LessonDiscovery
        lessonTitle={lessonTitle}
        lessonObjective={lessonObjective}
        words={discovery ?? []}
        guidedPronunciation={guidedPronunciation}
        isAuthenticated={isAuthenticated}
        onQuit={handleQuit}
        onStart={() => setPhase("playing")}
        ayahContext={ayahContext}
        meaningFallback={meaningFallback}
        audioUnavailable={audioUnavailable}
      />
    );
  }

  if (phase === "miniReview") {
    return (
      <MiniReview
        arabicWords={arabicRetryWords}
        reviewWords={reviewWords}
        onComplete={(reinforced) => {
          setReinforcedWords(reinforced);
          const { results: r, skillAttempts: s } = pendingFinish.current;
          void finish(r, s);
        }}
      />
    );
  }

  if (phase === "complete") {
    return (
      <LessonComplete
        lessonTitle={lessonTitle}
        stats={computeSessionStats(results)}
        nextLesson={nextLesson}
        pathProgress={pathProgress}
        surahName={surahName}
        reinforcedWords={reinforcedWords}
      />
    );
  }

  if (phase === "error") {
    return (
      <Card className="gap-4 p-8 text-center items-center">
        <Mascot
          variant="welcome"
          size="lg"
          message={errorIsPartial ? "Presque terminé !" : "Oups…"}
        />
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>
            {errorIsPartial
              ? "Synchronisation en attente"
              : "Progression non enregistrée"}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => {
              setPhase("submitting");
              void finish(results, skillAttempts);
            }}
          >
            Réessayer
          </Button>
          <Button render={<Link href="/learn" />} variant="outline">
            Retour au parcours
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "submitting" || finished) {
    return (
      <Card className="items-center gap-4 p-10 text-center">
        <Spinner className="size-8 text-primary" />
        <BodyMedium>Enregistrement de ta progression…</BodyMedium>
      </Card>
    );
  }

  if (!current) return null;

  const correctContent = result?.correctOption?.content ?? null;

  const isReprise = queue.isReprise;
  const remainingReprise = getRepriseRemainingCount(queue);
  const stepLabel = isReprise
    ? `À renforcer · Encore ${remainingReprise} question${remainingReprise > 1 ? "s" : ""}`
    : `Exercice ${Math.min(queue.mainIndex + 1, exercises.length)} sur ${exercises.length}`;

  const statusLabel = answer
    ? "Réponse enregistrée"
    : isReprise
      ? "Reprenons celle-ci"
      : "À toi de jouer";

  const progressValue = isReprise
    ? exercises.length > 0
      ? ((exercises.length - remainingReprise) / exercises.length) * 100
      : 100
    : exercises.length > 0
      ? ((queue.mainIndex + 1) / exercises.length) * 100
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header de focus : sortie et position, sans réintroduire le chrome global. */}
      <HikmaLessonFocusHeader
        title={lessonTitle}
        stepLabel={stepLabel}
        exit={(
        <AlertDialog
          open={quitOpen}
          onOpenChange={(open) => {
            if (!isQuitting) setQuitOpen(open);
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Quitter la leçon"
            disabled={isQuitting}
            onClick={() => {
              if (!isQuitting) setQuitOpen(true);
            }}
          >
            <XIcon />
          </Button>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Quitter la leçon ?</AlertDialogTitle>
              <AlertDialogDescription>
                {isAuthenticated
                  ? "Ta progression sera sauvegardée. Tu pourras reprendre exactement où tu t'es arrêté."
                  : "Connecte-toi pour sauvegarder ta progression."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                disabled={isQuitting}
                onClick={() => setQuitOpen(false)}
              >
                Continuer la leçon
              </Button>
              <Button
                variant="destructive"
                loading={isQuitting}
                disabled={isQuitting}
                onClick={() => {
                  void handleQuit();
                }}
              >
                {isQuitting ? "Quitter..." : "Quitter"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
        )}
      />

      {/* Shell visuel commun : l'exercice spécialisé conserve son interaction. */}
      <HikmaExerciseShell
        step={Math.min(queue.mainIndex + 1, exercises.length)}
        total={exercises.length}
        stepLabel={stepLabel}
        statusLabel={statusLabel}
        progressValue={progressValue}
        skill={exerciseSkillLabel(current.type)}
        status={answer ? "feedback" : "ready"}
        feedback={answer ? (
          <>
            {isSelfAssessment ? (
              <div className="flex items-center gap-3 rounded-2xl border border-info/32 bg-info/4 p-4" role="status">
                <Mascot variant="learn" size="sm" message="Bonne réflexion !" />
                <BodyMedium className="text-muted-foreground">
                  À toi de juger — cette étape n&apos;est pas notée.
                </BodyMedium>
              </div>
            ) : null}
            {result ? (
              <FeedbackPanel
                result={result}
                exercise={current}
                correctContent={correctContent}
                userAnswer={answer?.content ?? null}
                isMilestone={isQueueFinished(queue)}
              />
            ) : null}
          </>
        ) : undefined}
        secondaryAction={
          answer == null ? (
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePass}
              className="w-full min-h-12 text-muted-foreground hover:text-foreground sm:w-auto"
            >
              Passer
            </Button>
          ) : null
        }
        primaryAction={
          answer != null ? (
            <Button size="lg" onClick={continueNext} className="w-full min-h-12 sm:w-auto sm:min-w-48">
              Continuer
            </Button>
          ) : (
            <Button size="lg" disabled aria-disabled="true" className="w-full min-h-12 sm:w-auto sm:min-w-48">
              {isFreeText ? "Réponds pour continuer" : "Choisis une réponse"}
            </Button>
          )
        }
      >
          <ExerciseCard
            exercise={current}
            answer={answer}
            result={result}
            onChoose={choose}
            onSubmitText={submitText}
          />
      </HikmaExerciseShell>
    </div>
  );
}
