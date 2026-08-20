import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { UserWordProgress } from "@/types/learning";
import type { LessonProgressStatus } from "@/lib/learning";
import lockIcon from "@/public/icones/lock.png";
import starIcon from "@/public/icones/star.png";
import sunIcon from "@/public/icones/sun.png";
import tropherIcon from "@/public/icones/tropher.png";

const STATUS_LABEL: Record<LessonProgressStatus, string> = {
  LOCKED: "Verrouillée",
  AVAILABLE: "Disponible",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  MASTERED: "Maîtrisée",
};

const STATUS_ICON: Record<LessonProgressStatus, { src: typeof lockIcon; alt: string } | null> = {
  LOCKED: { src: lockIcon, alt: "Leçon verrouillée" },
  AVAILABLE: { src: sunIcon, alt: "Leçon disponible" },
  IN_PROGRESS: { src: sunIcon, alt: "Leçon en cours" },
  COMPLETED: { src: starIcon, alt: "Leçon terminée" },
  MASTERED: { src: tropherIcon, alt: "Leçon maîtrisée" },
};

export function LessonStatusIcon({ status }: { status: LessonProgressStatus }) {
  const icon = STATUS_ICON[status];
  if (!icon) return null;
  return (
    <Image
      src={icon.src}
      alt={icon.alt}
      width={24}
      height={24}
      className="size-6 object-contain"
    />
  );
}

export function LessonStatusBadge({ status }: { status: LessonProgressStatus }) {
  const variant =
    status === "COMPLETED" || status === "MASTERED"
      ? "success"
      : status === "LOCKED"
        ? "outline"
        : status === "IN_PROGRESS"
          ? "warning"
          : "secondary";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

/** Progression d'une leçon = maîtrise moyenne de ses mots (données réelles). */
export function LessonProgressBar({
  progressRows,
}: {
  progressRows: UserWordProgress[];
}) {
  const seen = progressRows.filter((r) => r.status !== "new");
  const value =
    seen.length > 0
      ? Math.round(seen.reduce((sum, r) => sum + r.mastery, 0) / seen.length)
      : 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} aria-label="Progression de la leçon" className="max-w-32" />
      <span className="text-caption text-muted-foreground tabular-nums">{value}%</span>
    </div>
  );
}
