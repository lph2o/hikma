"use client";

import { EyeIcon, EyeOffIcon, CheckCircle2Icon, CircleAlertIcon, CircleHelpIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArabicText } from "@/components/ui/arabic-text";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { Caption, H2, BodyLarge, BodyMedium } from "@/components/ui/typography";

export type HikmaWordProps = {
  arabic: string;
  transliteration?: string | null;
  meaning?: string | null;
  audioUrl?: string | null;
  validated?: boolean;
  className?: string;
};

/** Mot Hikma : arabe premier, aide secondaire, sens lisible et audio optionnel. */
export function HikmaWord({
  arabic,
  transliteration,
  meaning,
  audioUrl,
  validated = false,
  className,
}: HikmaWordProps) {
  return (
    <article className={cn("flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-surface-subtle p-6 text-center", className)}>
      <ArabicText as="div" scale="word">
        {arabic}
      </ArabicText>
      {transliteration ? <Caption className="text-text-secondary">{transliteration}</Caption> : null}
      {meaning ? <BodyLarge>{meaning}</BodyLarge> : null}
      {validated ? <Caption className="text-success-text">Sens français validé</Caption> : null}
      {audioUrl ? <AudioPlayer src={audioUrl} label="Écouter le mot" /> : null}
    </article>
  );
}

export type HikmaProgressProps = {
  value: number;
  label: string;
  detail?: string;
  className?: string;
};

/** Progression pédagogique avec une information humaine, pas seulement un pourcentage. */
export function HikmaProgress({ value, label, detail, className }: HikmaProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <BodyMedium className="font-medium">{label}</BodyMedium>
        {detail ? <Caption>{detail}</Caption> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-hikma-gold transition-transform duration-500 ease-[var(--ease-soft-out)]" style={{ transform: `scaleX(${clamped / 100})`, transformOrigin: "left" }} />
      </div>
    </div>
  );
}

export type HikmaFeedbackStatus = "correct" | "incorrect" | "ambiguous";

const FEEDBACK = {
  correct: { icon: CheckCircle2Icon, title: "Bien retrouvé", className: "border-success/32 bg-success/8", textClassName: "text-success-text" },
  incorrect: { icon: CircleAlertIcon, title: "Pas tout à fait", className: "border-error/32 bg-error/8", textClassName: "text-error-text" },
  ambiguous: { icon: CircleHelpIcon, title: "Ta réponse peut vouloir dire plusieurs choses", className: "border-warning/32 bg-warning/8", textClassName: "text-warning-text" },
} as const;

/** Feedback commun : l’état est exprimé par icône, texte et couleur. */
export function HikmaFeedback({ status, children, className }: { status: HikmaFeedbackStatus; children?: ReactNode; className?: string }) {
  const item = FEEDBACK[status];
  const Icon = item.icon;
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4", item.className, className)} role="status" aria-live="polite">
      <Icon className={cn("mt-0.5 size-5 shrink-0", item.textClassName)} aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <BodyMedium className={cn("font-semibold", item.textClassName)}>{item.title}</BodyMedium>
        {children ? <BodyMedium className="text-text-secondary">{children}</BodyMedium> : null}
      </div>
    </div>
  );
}

/** Révélation volontaire : protège l’effort de rappel avant l’accès à l’aide. */
export function HikmaReveal({ label = "Afficher l’aide", children, className }: { label?: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Button variant="ghost" size="sm" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        {open ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
        {open ? "Masquer l’aide" : label}
      </Button>
      {open ? <div className="animate-feedback-in rounded-2xl border border-border-subtle bg-surface-subtle p-4">{children}</div> : null}
    </div>
  );
}

export function HikmaLessonSection({ eyebrow, title, children, className }: { eyebrow?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {eyebrow ? <Caption className="text-primary-strong">{eyebrow}</Caption> : null}
      <H2>{title}</H2>
      {children}
    </section>
  );
}

export function HikmaExerciseShell({ skill, progress, children, footer, className }: { skill: string; progress?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-5", className)} aria-label={skill}>
      <header className="flex items-center justify-between gap-4">
        <Caption className="text-primary-strong">Tu apprends à {skill}</Caption>
        {progress}
      </header>
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-card">{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </section>
  );
}
