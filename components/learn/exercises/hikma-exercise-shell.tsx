import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress } from "@/components/ui/hikma";
import { Caption, H3 } from "@/components/ui/typography";
import type { ExerciseType } from "@/lib/exercises";

const SKILL_LABELS: Partial<Record<ExerciseType, string>> = {
  WORD_TO_TRANSLATION: "Comprendre le sens",
  TRANSLATION_TO_WORD: "Reconnaître un mot",
  REVERSE_TRANSLATION: "Retrouver la forme arabe",
  MULTIPLE_CHOICE: "Reconnaître la prononciation",
  WORD_RECOGNITION: "Observer ce que tu retiens",
  AUDIO_TO_WORD: "Écouter et identifier",
  WORD_TO_AUDIO: "Lire puis comparer à l’écoute",
  COMPLETE_WORD: "Compléter le sens",
  FORM_TO_MEANING: "Retrouver le sens",
  MEANING_TO_FORM: "Retrouver la forme arabe",
  CONTEXT_RECOGNITION: "Comprendre dans le verset",
  LEMMA_RELATION: "Relier les formes d’un mot",
  PRONUNCIATION_GUIDED: "Écouter et produire",
  PHONETIC_DISCRIMINATION: "Écouter un trait arabe",
};

export function exerciseSkillLabel(type: ExerciseType): string {
  return SKILL_LABELS[type] ?? "Faire un pas de plus";
}

export type HikmaExerciseShellProps = {
  step: number;
  total: number;
  skill: string;
  children: ReactNode;
  feedback?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  status?: "ready" | "selected" | "feedback" | "loading";
  className?: string;
};

/** Grammaire visuelle commune des exercices, sans logique métier. */
export function HikmaExerciseShell({
  step,
  total,
  skill,
  children,
  feedback,
  primaryAction,
  secondaryAction,
  status = "ready",
  className,
}: HikmaExerciseShellProps) {
  const progress = total > 0 ? (step / total) * 100 : 0;

  return (
    <section
      className={cn("flex flex-col gap-7", className)}
      aria-label={`Exercice ${step} sur ${total}`}
      data-slot="hikma-exercise-shell"
      data-status={status}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <Caption className="text-primary-strong">Exercice {step} sur {total}</Caption>
          <Caption>{feedback ? "Réponse enregistrée" : "À toi de jouer"}</Caption>
        </div>
        <HikmaProgress value={progress} label={skill} />
      </header>

      <Card className="rounded-4xl border-border-subtle bg-surface-elevated shadow-card">
        {/* flex flex-col requis : sans lui le gap est un no-op et la ligne de
         * séparation « Ce que tu apprends » colle aux éléments en dessous. */}
        <CardContent className="flex flex-col gap-6 p-6 sm:gap-8 sm:p-8">
          <div className="flex flex-col gap-2 border-b border-border-subtle pb-5">
            <Caption className="text-primary-strong">Ce que tu apprends</Caption>
            <H3>{skill}</H3>
          </div>
          <div className="flex flex-col gap-6" data-slot="exercise-interaction">
            {children}
          </div>
        </CardContent>
      </Card>

      {feedback ? (
        <div className="flex flex-col gap-4 border-t border-border-subtle pt-6 sm:gap-5 sm:pt-8" data-slot="exercise-feedback" aria-label="Feedback">
          {feedback}
        </div>
      ) : null}

      {primaryAction || secondaryAction ? (
        /* Barre d'action sticky sur mobile (93-P1-01) : le CTA principal reste
         * accessible au pouce après la réponse, même si le feedback est long.
         * Le sticky garde sa place dans le flux (pas de layout jump) ; le
         * fond flouté + hairline le lisent sur le contenu ; safe-area iOS
         * respectée. Desktop : comportement naturel d'origine (statique). */
        <footer className="-mx-5 sticky bottom-0 z-10 mt-auto flex flex-col gap-3 border-t border-border-subtle bg-background/95 px-5 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-10px_28px_-20px_rgba(46,42,28,0.28)] backdrop-blur-md sm:static sm:mx-0 sm:mt-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0 sm:shadow-none sm:backdrop-blur-none">
          {secondaryAction}
          {primaryAction}
        </footer>
      ) : null}
    </section>
  );
}
