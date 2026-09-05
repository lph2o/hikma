"use client";

// UI d'exercice générique : affiche le prompt (et l'arabe en Amiri/RTL si
// demandé par le moteur) puis la grille d'options. Aucune logique pédagogique
// métier ici : la validation appartient à l'Exercise Engine.

import { Button } from "@/components/ui/button";
import { ArabicText } from "@/components/ui/arabic-text";
import { ExerciseFeedback } from "@/components/ui/exercise";
import { BodyLarge } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  feedbackMoment,
  feedbackStatus,
  isExplanationRelevant,
  islamicFeedbackCopy,
  pedagogicalExplanation,
  shortFeedbackCopy,
  type AnswerOutcome,
  type FeedbackMoment,
} from "./pedagogical-feedback";
import { stableOptionOrder } from "./option-order";
import { handleRadioGroupKeyDown } from "@/lib/ui/radio-group-keyboard";
import type {
  AnswerResult,
  ExerciseAnswer,
  GeneratedExercise,
  GeneratedOption,
} from "@/lib/exercises";

const ARABIC_RE = /[\u0600-\u06FF]/;

/** Affiche une option (arabe en Amiri/RTL, sinon texte simple). */
export function OptionContent({ content }: { content: string }) {
  if (ARABIC_RE.test(content)) {
    return (
      <ArabicText className="text-lg text-center">{content}</ArabicText>
    );
  }
  return <span className="text-base text-center">{content}</span>;
}

export type OnChoose = (option: GeneratedOption) => void;

export type OptionsExerciseProps = {
  exercise: GeneratedExercise;
  answer: ExerciseAnswer | null;
  result: AnswerResult | null;
  onChoose: OnChoose;
  /** Soumission d'une réponse TEXTE LIBRE (rappel machine-noté). */
  onSubmitText?: (content: string) => void;
};

export function optionVariant(
  option: GeneratedOption,
  answer: ExerciseAnswer | null,
  result: AnswerResult | null,
): { variant: "outline" | "destructive"; className?: string } {
  const isChosen = answer?.optionIndex === option.position - 1;
  if (!result) return { variant: "outline" };
  if (option.isCorrect) {
    // Mise en évidence de la bonne réponse (palette Hikma, pas de variante dédiée).
    // Texte AA (success-text) : le blanc (success-foreground) serait illisible sur un fond à 8 %.
    return { variant: "outline", className: "border-success bg-success/8 text-success-text" };
  }
  if (isChosen) return { variant: "destructive" };
  return { variant: "outline" };
}

/** Corps d'un exercice à choix multiples (options issues du moteur). */
export function OptionsExercise({
  exercise,
  answer,
  result,
  onChoose,
}: OptionsExerciseProps) {
  const options = stableOptionOrder(
    exercise.options,
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`,
  );
  return (
    <div className="flex flex-col gap-5">
      {exercise.metadata.showArabic && exercise.metadata.arabic ? (
        <ArabicText className="text-h2 text-center font-normal">
          {exercise.metadata.arabic}
        </ArabicText>
      ) : null}

      <BodyLarge className="text-center">{exercise.prompt}</BodyLarge>

      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Options de réponse"
        onKeyDown={handleRadioGroupKeyDown}
      >
        {options.map((option) => {
          const isChosen = answer?.optionIndex === option.position - 1;
          const { variant, className } = optionVariant(option, answer, result);
          return (
            <Button
              key={option.position}
              variant={variant}
              className={cn(
                "h-auto min-h-12 whitespace-normal px-4 py-3 justify-center",
                className,
              )}
              role="radio"
              aria-checked={isChosen}
              disabled={answer != null}
              onClick={() => onChoose(option)}
            >
              <OptionContent content={option.content} />
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export type FeedbackPanelProps = {
  result: AnswerResult;
  exercise?: GeneratedExercise;
  /** Exercice correct (pour afficher la bonne réponse). */
  correctContent?: string | null;
  /** Réponse brute saisie ou choisie par l'utilisateur, jamais normalisée. */
  userAnswer?: string | null;
  moment?: FeedbackMoment;
  isMilestone?: boolean;
};

/**
 * Panneau de feedback post-validation (délègue à la primitive 24C).
 * - correct → « Bien joué. » ;
 * - incorrect → « Pas tout à fait. » + bonne réponse + explication ;
 * - ambiguous → « Tu étais proche. » + réponse révélée + explication.
 * Aucune récompense inventée : le système XP n'existe pas encore.
 */
export function FeedbackPanel({ result, exercise, correctContent, userAnswer, moment, isMilestone = false }: FeedbackPanelProps) {
  const ambiguous = result.status === "AMBIGUOUS";
  const success = result.correct && !ambiguous;
  const outcome: AnswerOutcome = ambiguous ? "ambiguous" : success ? "correct" : "incorrect";

  // Certains générateurs incluent déjà la bonne réponse dans leur explication.
  // Elle est maintenant affichée dans sa surface dédiée : ne la répétons pas.
  const explanation =
    !success && correctContent && result.explanation?.includes(correctContent)
      ? null
      : result.explanation;

  // L'approfondissement est DISPONIBLE après toute réponse (correct/incorrect/
  // ambiguë) — sa pertinence ne dépend plus du résultat.
  const explanationData = exercise ? pedagogicalExplanation(exercise) : null;
  const relevant = exercise ? isExplanationRelevant(explanationData, exercise.type) : false;
  const shortRecall = exercise ? shortFeedbackCopy(exercise, outcome) : null;
  const resolvedMoment = exercise ? (moment ?? feedbackMoment(exercise, { isMilestone })) : "ordinary";
  const successCopy = islamicFeedbackCopy(resolvedMoment);

  return (
    <ExerciseFeedback
      status={feedbackStatus(result)}
      correctContent={correctContent}
      userAnswer={userAnswer}
      explanation={explanation}
      explanationData={relevant ? explanationData : null}
      shortRecall={shortRecall}
      correctTitle={success ? successCopy.title : undefined}
      correctMessage={success ? successCopy.message : undefined}
    />
  );
}
