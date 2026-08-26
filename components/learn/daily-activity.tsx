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
    // Rangée scrollable : les libellés français (« sam. 29 août » ≈ 78px en
    // 12px Poppins, mesuré) ne tiennent pas en 7 colonnes sur mobile (pastille
    // ≈ 28-38px) — les textes débordaient des cartes. Sur mobile la rangée
    // défile (min-w confortable, libellés sur une ligne, jamais rognés) ; sur
    // écran large flex-1 étire les pastilles et les 7 tiennent sans défilement.
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {days.map((day) => (
        <div
          key={day.date}
          title={day.date}
          className={cn(
            "flex min-w-[5.75rem] flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-2",
            day.dueCount > 0
              ? "border-primary/30 bg-primary/8"
              : "border-border bg-surface/50",
          )}
        >
          <span className="whitespace-nowrap text-caption leading-tight text-muted-foreground">
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
        <p className="w-full text-center text-caption text-muted-foreground">
          Aucune révision prévue cette semaine.
        </p>
      ) : null}
    </div>
  );
}

/** Libellé français court d'une date (ex. « 28 juil. ») — locale explicite. */
function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
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
      {/* 30 barres : baseline grise perceptible + jours actifs en teal qui
       * s'élèvent de la même ligne de base (items-end). gap 2px (au lieu de
       * 3px) : barres plus épaisses sur mobile (≈8px à 390, ≈6px à 320). */}
      <div className="flex h-20 items-end gap-[2px]">
        {days.map((day) => {
          // Hauteur minimale pour tous les jours (ligne de base lisible) ;
          // les jours actifs dépassent, proportionnellement au maximum.
          const h = day.wordsStudied > 0 ? Math.max(8, (day.wordsStudied / max) * 100) : 8;
          return (
            <div
              key={day.date}
              title={`${day.date} : ${day.wordsStudied} mot${day.wordsStudied > 1 ? "s" : ""} · ${day.lessonsCompleted} leçon${day.lessonsCompleted > 1 ? "s" : ""}`}
              className={cn(
                "flex-1 rounded-sm transition-colors",
                day.wordsStudied > 0 ? "bg-primary/70" : "bg-input/80",
              )}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      {/* Libellés : jamais de retour à la ligne au milieu d'un mot ; sur très
       * petit écran la rangée se replie proprement ligne par ligne. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Caption className="whitespace-nowrap text-muted-foreground">
          {days[0] ? formatShortDate(days[0].date) : ""}
          {days[0] && days[days.length - 1] ? " → " : ""}
          {days[days.length - 1] ? formatShortDate(days[days.length - 1].date) : ""}
        </Caption>
        {hasAny ? (
          <Caption className="shrink-0 whitespace-nowrap text-muted-foreground">Mots étudiés par jour</Caption>
        ) : (
          <Caption className="text-muted-foreground">
            Aucune activité sur les 30 derniers jours.
          </Caption>
        )}
      </div>
    </div>
  );
}
