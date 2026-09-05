import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleIcon, LockKeyholeIcon, PlayIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress } from "@/components/ui/hikma";
import { BodyMedium, BodySmall, Caption } from "@/components/ui/typography";
import type { LessonProgressStatus } from "@/lib/learning";
import type { UserWordProgress } from "@/types/learning";
import { cn } from "@/lib/utils";

type HikmaLessonCardProps = {
  title: string;
  objective?: string | null;
  href: string;
  status: LessonProgressStatus;
  progressRows: UserWordProgress[];
};

const STATUS_COPY: Record<LessonProgressStatus, string> = {
  LOCKED: "Termine la leçon précédente pour continuer.",
  AVAILABLE: "Cette étape est prête quand tu l’es.",
  IN_PROGRESS: "Tu peux reprendre là où tu t’es arrêté.",
  COMPLETED: "Leçon terminée — tu peux la revoir quand tu veux.",
  MASTERED: "Leçon maîtrisée — tu peux la revoir quand tu veux.",
};

function getProgress(progressRows: UserWordProgress[]) {
  const seen = progressRows.filter((row) => row.status !== "new");
  return seen.length > 0
    ? Math.round(seen.reduce((sum, row) => sum + row.mastery, 0) / seen.length)
    : 0;
}

export function HikmaLessonCard({
  title,
  objective,
  href,
  status,
  progressRows,
}: HikmaLessonCardProps) {
  const locked = status === "LOCKED";
  const current = status === "IN_PROGRESS";
  const completed = status === "COMPLETED" || status === "MASTERED";
  const progress = getProgress(progressRows);
  const Icon = locked ? LockKeyholeIcon : completed ? CheckIcon : current ? PlayIcon : CircleIcon;
  const action = locked ? null : current ? "Reprendre" : completed ? "Revoir" : "Commencer";

  const content = (
    <Card
      className={cn(
        "relative overflow-hidden border-border-subtle bg-surface-elevated shadow-card transition-[border-color,box-shadow,transform,background-color] duration-150 ease-[var(--ease-hikma)]",
        current && "border-primary/35 bg-surface-featured shadow-elevated",
        locked && "bg-surface-subtle opacity-78",
        !locked &&
          "group-hover:-translate-y-px group-hover:border-primary/35 group-hover:shadow-elevated group-active:scale-[0.99] group-active:opacity-90 group-active:translate-y-0",
      )}
    >
      <CardContent className="gap-4 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border",
              completed && "border-success/30 bg-success/8 text-success-text",
              current && "border-primary/30 bg-primary/10 text-primary-strong",
              status === "AVAILABLE" && "border-border bg-surface text-text-secondary",
              locked && "border-border bg-surface text-text-secondary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <BodyMedium className={cn("font-semibold", current && "text-primary-strong")}>{title}</BodyMedium>
              {current ? <Caption className="text-primary-strong">Tu es ici</Caption> : null}
              {completed ? <Caption className="text-success-text">Terminée</Caption> : null}
              {locked ? <Caption>Verrouillée</Caption> : null}
            </div>
            <BodySmall className="mt-1 text-text-secondary">{objective ?? STATUS_COPY[status]}</BodySmall>
          </div>
          {action ? <ArrowRightIcon className="mt-1 size-5 shrink-0 text-primary-strong transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /> : <LockKeyholeIcon className="mt-1 size-4 shrink-0 text-text-secondary" aria-hidden="true" />}
        </div>
        {current || completed ? <HikmaProgress value={progress} label="Progression de cette leçon" detail={`${progress} %`} /> : null}
        {locked ? <Caption className="border-t border-border-subtle pt-3 text-text-secondary">{STATUS_COPY[status]}</Caption> : null}
      </CardContent>
    </Card>
  );

  if (locked) return <div aria-disabled="true">{content}</div>;

  return (
    <Link href={href} className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
      {content}
      <span className="sr-only">{action} : {title}</span>
    </Link>
  );
}
