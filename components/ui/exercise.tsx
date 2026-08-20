"use client";

// Primitives UI d'exercice Hikma (brique Design System — Phase 24C).
// Uniquement des briques VISUELLES : aucune logique pédagogique, aucune donnée.
// Elles seront consommées par les interfaces d'exercice dans une phase
// ultérieure (24G). Les générateurs d'exercices ne sont PAS modifiés ici.

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2Icon, CircleAlertIcon, CircleHelpIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BodyLarge, BodyMedium, Caption } from "@/components/ui/typography";
import { AudioPlayer } from "@/components/ui/audio-player";
import { HikmaExplanation, type HikmaExplanationData } from "@/components/ui/hikma-explanation";
import { handleRadioGroupKeyDown } from "@/lib/ui/radio-group-keyboard";

const ARABIC_RE = /[\u0600-\u06FF]/;

/* ---------- Conteneur ---------- */

export function ExerciseContainer({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <Card className={cn("gap-5 p-6", className)} data-slot="exercise-container">
      {children}
    </Card>
  );
}

/* ---------- Prompt ---------- */

export function ExercisePrompt({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <BodyLarge className={cn("text-center", className)}>{children}</BodyLarge>
  );
}

/* ---------- Option de réponse ---------- */

export type AnswerOptionVariant =
  | "default"
  | "selected"
  | "correct"
  | "incorrect";

export function AnswerOption({
  children,
  variant = "default",
  checked,
  disabled,
  onClick,
  className,
}: {
  children?: ReactNode;
  variant?: AnswerOptionVariant;
  checked?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}): ReactElement {
  const stateClass =
    variant === "correct"
      ? "border-success/60 bg-success/8 text-success-text"
      : variant === "incorrect"
        ? "border-destructive/60 bg-destructive/8 text-error-text"
        : variant === "selected"
          ? "border-primary bg-secondary text-secondary-foreground"
          : "";

  return (
    <Button
      variant="outline"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 justify-center whitespace-normal rounded-xl px-4 py-3",
        stateClass,
        className,
      )}
    >
      {children}
    </Button>
  );
}

/* ---------- Grille de réponses ---------- */

export function AnswerGrid({
  className,
  children,
  label = "Options de réponse",
}: {
  className?: string;
  children?: ReactNode;
  label?: string;
}): ReactElement {
  return (
    <div
      className={cn("grid gap-2 sm:grid-cols-2", className)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleRadioGroupKeyDown}
    >
      {children}
    </div>
  );
}

/* ---------- Feedback pédagogique ---------- */

export type ExerciseFeedbackStatus = "correct" | "incorrect" | "ambiguous";

const FEEDBACK_MESSAGES: Record<ExerciseFeedbackStatus, string> = {
  correct: "Bien joué.",
  incorrect: "Ce mot n’est pas encore fixé. Voici la bonne réponse.",
  ambiguous: "Ta réponse est proche, mais reste à vérifier.",
};

const FEEDBACK_TITLES: Record<ExerciseFeedbackStatus, string> = {
  correct: "Excellent !",
  incorrect: "Pas encore",
  ambiguous: "À vérifier",
};

const FEEDBACK_ICONS = {
  correct: CheckCircle2Icon,
  incorrect: CircleAlertIcon,
  ambiguous: CircleHelpIcon,
};

export function ExerciseFeedback({
  status,
  message,
  correctContent,
  userAnswer,
  explanation,
  explanationData,
  correctTitle,
  correctMessage,
  shortRecall,
  className,
}: {
  status: ExerciseFeedbackStatus;
  message?: string;
  correctContent?: string | null;
  /** Valeur brute avant normalisation, pour distinguer l'effort de l'attendu. */
  userAnswer?: string | null;
  explanation?: string | null;
  explanationData?: HikmaExplanationData | null;
  correctTitle?: string;
  correctMessage?: string;
  /** Rappel pédagogique court (1 ligne), indépendant du résultat. */
  shortRecall?: string | null;
  className?: string;
}): ReactElement {
  const isCorrect = status === "correct";
  const isAmbiguous = status === "ambiguous";
  const titleClass = isCorrect
    ? "text-success-text"
    : isAmbiguous
      ? "text-warning-text"
      : "text-error-text";
  const Icon = FEEDBACK_ICONS[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 animate-feedback-in sm:p-5",
        isCorrect
          ? "border-success/40 bg-success/8"
          : isAmbiguous
            ? "border-warning/40 bg-warning/8"
            : "border-destructive/40 bg-destructive/8",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", titleClass)} aria-hidden="true" />
      <div className="flex w-full min-w-0 flex-col gap-2">
        <BodyMedium className={cn("font-semibold", titleClass)}>
          {isCorrect ? (correctTitle ?? message ?? FEEDBACK_TITLES[status]) : (message ?? FEEDBACK_TITLES[status])}
        </BodyMedium>
        <BodyMedium className="text-text-secondary">
          {isCorrect ? (correctMessage ?? FEEDBACK_MESSAGES[status]) : FEEDBACK_MESSAGES[status]}
        </BodyMedium>
        {!isCorrect ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-error/32 bg-error/8 p-3">
              <Caption className="text-error-text">Ta réponse</Caption>
              {userAnswer?.length ? (
                ARABIC_RE.test(userAnswer) ? (
                  <ArabicText className="text-h4 text-error-text">{userAnswer}</ArabicText>
                ) : (
                  <BodyMedium className="whitespace-pre-wrap break-words font-medium text-error-text">{userAnswer}</BodyMedium>
                )
              ) : (
                <BodyMedium className="font-medium text-error-text">Aucune réponse</BodyMedium>
              )}
            </div>
            {correctContent ? (
              <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-success/32 bg-success/8 p-3">
                <Caption className="text-success-text">Réponse attendue</Caption>
                {ARABIC_RE.test(correctContent) ? (
                  <ArabicText className="text-h4 text-success-text">{correctContent}</ArabicText>
                ) : (
                  <BodyMedium className="font-medium text-success-text">{correctContent}</BodyMedium>
                )}
              </div>
            ) : null}
          </div>
        ) : correctContent ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-success/32 bg-success/8 p-3">
            <Caption className="text-success-text">Bonne réponse</Caption>
            {ARABIC_RE.test(correctContent) ? (
              <ArabicText className="text-h4 text-success-text">{correctContent}</ArabicText>
            ) : (
              <BodyMedium className="font-medium text-success-text">{correctContent}</BodyMedium>
            )}
          </div>
        ) : null}
        {explanation ? (
          <BodyMedium className="text-muted-foreground">{explanation}</BodyMedium>
        ) : null}
        {shortRecall ? (
          <BodyMedium className="text-muted-foreground">{shortRecall}</BodyMedium>
        ) : null}
        {explanationData?.audioUrl ? (
          <AudioPlayer src={explanationData.audioUrl} label="Écouter le mot" className="self-start" />
        ) : null}
        {explanationData ? (
          <HikmaExplanation
            data={explanationData}
            defaultOpen={status === "incorrect"}
            showAudio={false}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Actions ---------- */

export function ExerciseActions({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      data-slot="exercise-actions"
    >
      {children}
    </div>
  );
}

/* ---------- Progression ---------- */

export function ExerciseProgress({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}): ReactElement {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <Caption>{label}</Caption> : null}
      <Progress value={value} aria-label={label ?? "Progression"} />
    </div>
  );
}
