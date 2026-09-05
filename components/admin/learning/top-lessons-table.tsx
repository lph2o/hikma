import type { AdminLearningTopLesson } from "@/lib/admin/metrics";
import { TrophyIcon } from "lucide-react";

interface TopLessonsTableProps {
  lessons: AdminLearningTopLesson[];
}

export function TopLessonsTable({ lessons }: TopLessonsTableProps) {
  const maxCount = Math.max(...lessons.map((l) => l.completionCount), 1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Leçons les plus complétées
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Classement par nombre de complétions (toutes périodes confondues)
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-xs text-muted-foreground">
          Aucune leçon complétée pour le moment.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {lessons.map((lesson, idx) => {
            const barPct = Math.max(4, Math.round((lesson.completionCount / maxCount) * 100));
            const isTop = idx === 0;
            return (
              <div
                key={lesson.lessonId}
                className="flex items-center gap-3 py-3 text-xs"
              >
                {/* Rang */}
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isTop
                      ? "bg-hikma-gold/20 text-hikma-gold"
                      : "bg-surface-subtle text-muted-foreground"
                  }`}
                >
                  {isTop ? <TrophyIcon className="size-3" /> : idx + 1}
                </span>

                {/* Contenu */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-semibold text-foreground">
                        {lesson.lessonTitle}
                      </span>
                      {lesson.unitTitle && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {lesson.unitTitle}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 font-bold tabular-nums text-foreground">
                      {lesson.completionCount}×
                    </span>
                  </div>

                  {/* Mini barre de progression */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-subtle">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
