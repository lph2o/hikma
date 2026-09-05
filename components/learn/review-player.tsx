"use client";

// Session de révision (Phase 5).
// Mots dus → exercice (moteur) ou auto-évaluation → feedback → recordAnswer
// (Server Action) → mot suivant → fin.

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { BodyLarge, BodyMedium, Caption, H2 } from "@/components/ui/typography";
import { ArabicText } from "@/components/ui/arabic-text";
import {
  validateAnswer,
  type AnswerResult,
  type ExerciseAnswer,
  type GeneratedExercise,
} from "@/lib/exercises";
import type { ReviewItemWithWord } from "@/lib/review";
import {
  recordReviewAnswer,
  recordWordActivityOnly,
} from "@/lib/learning/actions";
import {
  appendAttempt,
  computeSessionStats,
  pendingWordAttempts,
  type WordAttempts,
} from "@/lib/learning/session";
import { ExerciseCard } from "@/components/learn/exercises";
import { FeedbackPanel } from "@/components/learn/exercises/options-exercise";
import { handleRadioGroupKeyDown } from "@/lib/ui/radio-group-keyboard";

export type ReviewPlayerProps = {
  items: ReviewItemWithWord[];
  /** Exercice généré pour chaque mot (null → auto-évaluation). */
  exercises: (GeneratedExercise | null)[];
  isAuthenticated: boolean;
};

type Phase = "playing" | "submitting" | "error" | "complete";

export function ReviewPlayer({ items, exercises, isAuthenticated }: ReviewPlayerProps) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [results, setResults] = useState<WordAttempts[]>([]);
  const [phase, setPhase] = useState<Phase>("playing");
  const [error, setError] = useState<string | null>(null);
  // Mots déjà persistés (anti double avancement lors d'un « Réessayer »).
  const savedWordIds = useRef<string[]>([]);
  // Mots persistés dont l'activité du jour reste à enregistrer (retry idempotent).
  const pendingActivity = useRef<string[]>([]);

  const finished = index >= items.length;
  const item = finished ? null : items[index];
  const exercise = finished ? null : exercises[index];
  const selfAssessed = item != null && exercise == null;

  // Auto-évaluation : la réponse choisie détermine directement le résultat.
  const selfAssessedCorrect = selfAssessed && answer ? answer.content === "Oui" : false;
  const result: AnswerResult | null =
    item && exercise && answer ? validateAnswer(exercise, answer) : null;

  function choose(option: GeneratedExercise["options"][number]) {
    if (answer != null || phase !== "playing" || !item) return;
    setAnswer({ optionIndex: option.position - 1, content: option.content });
  }

  function chooseSelfAssessment(correct: boolean) {
    if (answer != null || phase !== "playing" || !item) return;
    setAnswer({ optionIndex: correct ? 0 : 1, content: correct ? "Oui" : "Pas encore" });
  }

  function continueNext() {
    if (!item || answer == null || phase !== "playing") return;
    const correct = exercise ? result?.correct === true : selfAssessedCorrect;

    const nextResults = appendAttempt(results, item.wordId, correct);
    setResults(nextResults);
    setAnswer(null);

    if (index + 1 >= items.length) {
      void finish(nextResults);
    } else {
      setIndex((i) => i + 1);
    }
  }

  async function finish(finalResults: WordAttempts[]) {
    if (!isAuthenticated) {
      setPhase("complete");
      return;
    }
    setPhase("submitting");

    // 1. Persistance pédagogique en parallèle (mots non encore sauvegardés uniquement).
    const pending = pendingWordAttempts(finalResults, savedWordIds.current);
    if (pending.length > 0) {
      const results = await Promise.all(
        pending.map(async (r) => {
          const res = await recordReviewAnswer(
            r.wordId,
            r.attempts[r.attempts.length - 1] ?? false,
          );
          return { wordId: r.wordId, res };
        }),
      );

      let firstError: string | null = null;
      for (const { wordId, res } of results) {
        if (res.ok) {
          savedWordIds.current = [...savedWordIds.current, wordId];
          if (!res.activityRecorded) {
            pendingActivity.current = [...pendingActivity.current, wordId];
          }
        } else if (!firstError) {
          firstError = res.error ?? "Une erreur est survenue.";
        }
      }

      if (firstError) {
        setError(firstError);
        setPhase("error");
        return;
      }
    }

    // 2. Activité restante en parallèle — sans rejouer la progression pédagogique.
    if (pendingActivity.current.length > 0) {
      const activityResults = await Promise.all(
        pendingActivity.current.map(async (wordId) => {
          const res = await recordWordActivityOnly(wordId);
          return { wordId, res };
        }),
      );

      const remainingPending: string[] = [];
      let activityError: string | null = null;
      for (const { wordId, res } of activityResults) {
        if (!res.ok) {
          remainingPending.push(wordId);
          if (!activityError) {
            activityError = "Impossible d'enregistrer l'activité du jour. Réessaie.";
          }
        }
      }
      pendingActivity.current = remainingPending;

      if (activityError) {
        setError(activityError);
        setPhase("error");
        return;
      }
    }
    setPhase("complete");
  }

  if (items.length === 0) {
    return (
      <Card className="items-center gap-4 p-8 text-center">
        <Mascot variant="welcome" size="lg" message="Tout est à jour !" />
        <BodyMedium className="text-muted-foreground">
          Aucun mot à réviser pour le moment.
        </BodyMedium>
        <Button render={<Link href="/learn" />} variant="outline">
          Retour au parcours
        </Button>
      </Card>
    );
  }

  if (phase === "complete") {
    const stats = computeSessionStats(results);
    return (
      <Card className="mx-auto w-full max-w-lg items-center gap-5 p-8 text-center">
        <Mascot variant="learn" size="lg" message="Révision terminée !" />
        <H2>🎉 Révision terminée</H2>
        <div className="grid w-full grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface px-3 py-4">
            <BodyMedium className="text-h3 font-semibold">{stats.total}</BodyMedium>
            <Caption>Réponses</Caption>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface px-3 py-4">
            <BodyMedium className="text-h3 font-semibold">{stats.correct}</BodyMedium>
            <Caption>Correctes</Caption>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface px-3 py-4">
            <BodyMedium className="text-h3 font-semibold">{stats.accuracy}%</BodyMedium>
            <Caption>Précision</Caption>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 pt-2">
          <Button render={<Link href="/dashboard" />} size="lg" className="w-full min-h-12">
            Retour à l&apos;accueil
          </Button>
          <Button render={<Link href="/learn" />} variant="ghost" size="lg" className="w-full min-h-12">
            Retour au parcours
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card className="items-center gap-4 p-8 text-center">
        <Mascot variant="welcome" size="lg" message="Oups…" />
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>Révision non enregistrée</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            setPhase("submitting");
            void finish(results);
          }}
        >
          Réessayer
        </Button>
      </Card>
    );
  }

  if (phase === "submitting" || finished) {
    return (
      <Card className="items-center gap-4 p-10 text-center">
        <Spinner className="size-8 text-primary" />
        <BodyMedium>Enregistrement de la révision…</BodyMedium>
      </Card>
    );
  }

  if (!item) return null;

  const progress = ((index + (answer ? 1 : 0)) / items.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Caption>
            Mot {index + 1} / {items.length}
          </Caption>
          <Caption>Révision</Caption>
        </div>
        <Progress value={progress} aria-label="Progression de la révision" />
      </div>

      <Card>
        {/* La carte contient la QUESTION uniquement ; le feedback se place en
         * dessous, à plat sur la page (même grammaire que HikmaExerciseShell). */}
        <CardContent className="flex flex-col gap-5 p-6">
          {exercise ? (
            <ExerciseCard exercise={exercise} answer={answer} result={result} onChoose={choose} />
          ) : (
            <div className="flex flex-col gap-5">
              <ArabicText className="text-h2 text-center font-normal">{item.arabic}</ArabicText>
              {item.meaning ? (
                <BodyLarge className="text-center">{item.meaning}</BodyLarge>
              ) : null}
              <BodyLarge className="text-center font-medium">Connais-tu ce mot ?</BodyLarge>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Auto-évaluation" onKeyDown={handleRadioGroupKeyDown}>
                {[
                  { label: "Oui", correct: true },
                  { label: "Pas encore", correct: false },
                ].map((opt) => {
                  const isChosen = answer?.content === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      role="radio"
                      aria-checked={isChosen}
                      disabled={answer != null}
                      onClick={() => chooseSelfAssessment(opt.correct)}
                      className={
                        "h-12 rounded-lg border px-4 text-base font-medium transition-colors " +
                        (isChosen
                          ? "border-primary bg-secondary text-secondary-foreground"
                          : "border-input bg-popover text-foreground hover:bg-accent/50")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(selfAssessed && answer) || result ? (
        <div
          className="flex flex-col gap-4 border-t border-border-subtle pt-6 sm:gap-5 sm:pt-8"
          data-slot="review-feedback"
          aria-label="Feedback"
        >
          {selfAssessed && answer ? (
            <div className="flex items-center gap-3 rounded-2xl border border-info/32 bg-info/4 p-4" role="status">
              <Mascot variant="learn" size="sm" message="Bien noté !" />
              <BodyMedium className="text-muted-foreground">
                Auto-évaluation enregistrée.
              </BodyMedium>
            </div>
          ) : null}
          {result ? (
            <FeedbackPanel
              result={result}
              exercise={exercise ?? undefined}
              correctContent={result.correctOption?.content ?? null}
              userAnswer={answer?.content ?? null}
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        {answer != null ? (
          <Button size="lg" onClick={continueNext} className="w-full min-h-12 sm:w-auto sm:min-w-48">
            Continuer
          </Button>
        ) : (
          <Button size="lg" disabled aria-disabled="true" className="w-full min-h-12 sm:w-auto sm:min-w-48">
            Choisis une réponse
          </Button>
        )}
      </div>
    </div>
  );
}
