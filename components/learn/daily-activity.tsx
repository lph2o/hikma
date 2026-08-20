// F4/F5 — Affichage des révisions à venir (7 jours) et de l'historique
// d'activité (30 jours). Composants serveur, données réelles uniquement.

import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/** Libellé français déterministe d'une date (locale explicite). */
export function formatDayLabel(date: string, now: Date = new Date()): string {
  const d = new Date(`${date}T12:00:00.000Z`);
  const today = now.toISOString().slice(0, 10);
  if (date === today) return "Aujourd'hui";
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (date === tomorrow.toISOString().slice(0, 10)) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

/** F5 — Révisions à venir sur les 7 prochains jours (lecture seule). */
export function UpcomingReviews({
  days,
}: {
  days: Array<{ date: string; dueCount: number }>;
}) {
  const hasAny = days.some((d) => d.dueCount > 0);
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => (
        <div
          key={day.date}
          title={day.date}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border px-1 py-2",
            day.dueCount > 0
              ? "border-primary/30 bg-primary/8"
              : "border-border bg-surface/50",
          )}
        >
          <span className="text-caption leading-tight text-muted-foreground">
            {formatDayLabel(day.date)}
          </span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              day.dueCount > 0 ? "text-foreground" : "text-muted-foreground/60",
            )}
          >
            {day.dueCount}
          </span>
        </div>
      ))}
      {!hasAny ? (
        <p className="col-span-7 text-center text-caption text-muted-foreground">
          Aucune révision prévue cette semaine.
        </p>
      ) : null}
    </div>
  );
}

/** F4 — Barres d'activité des 30 derniers jours (mots étudiés par jour). */
export function ActivityHistory({
  days,
}: {
  days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }>;
}) {
  const max = Math.max(1, ...days.map((d) => d.wordsStudied));
  const hasAny = days.some((d) => d.wordsStudied > 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-20 items-end gap-[3px]">
        {days.map((day) => {
          const h = day.wordsStudied > 0 ? Math.max(8, (day.wordsStudied / max) * 100) : 4;
          return (
            <div
              key={day.date}
              title={`${day.date} : ${day.wordsStudied} mot${day.wordsStudied > 1 ? "s" : ""} · ${day.lessonsCompleted} leçon${day.lessonsCompleted > 1 ? "s" : ""}`}
              className={cn(
                "flex-1 rounded-sm transition-colors",
                day.wordsStudied > 0 ? "bg-primary/70" : "bg-input/40",
              )}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <Caption className="text-muted-foreground">
          {days[0]?.date} → {days[days.length - 1]?.date}
        </Caption>
        {hasAny ? (
          <Caption className="text-muted-foreground">Mots étudiés par jour</Caption>
        ) : (
          <Caption className="text-muted-foreground">
            Aucune activité sur les 30 derniers jours.
          </Caption>
        )}
      </div>
    </div>
  );
}
