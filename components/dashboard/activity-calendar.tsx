"use client";

// Calendrier d'activité mensuel (Phase 74).
// Affiche une grille mensuelle avec les jours actifs/inactifs/aujourd'hui.
// Navigation : mois précédent / mois suivant / retour au mois courant.
//
// Données : dérivées des journaux d'activité existants
// (user_activity_lessons + user_activity_words). Aucune table nouvelle.
// Calcul pur via computeMonthGrid() de regularity.ts.

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BodySmall } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  computeMonthGrid,
  computeMonthlyActivity,
  WEEKDAYS,
  type CalendarDay,
  type MonthGrid,
  type MonthlyActivity,
} from "@/lib/learning/regularity";

export type ActivityCalendarProps = {
  /** Jours actifs (YYYY-MM-DD), déjà normalisés par getDistinctLearningDays(). */
  learningDays: string[];
  /** Date du jour (YYYY-MM-DD UTC). */
  today: string;
  className?: string;
};

export function ActivityCalendar({
  learningDays,
  today,
  className,
}: ActivityCalendarProps) {
  const [todayParts] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m };
  });

  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);

  const grid: MonthGrid = useMemo(
    () => computeMonthGrid(learningDays, viewYear, viewMonth, today),
    [learningDays, viewYear, viewMonth, today],
  );

  const stats: MonthlyActivity = useMemo(
    () => computeMonthlyActivity(learningDays, viewYear, viewMonth),
    [learningDays, viewYear, viewMonth],
  );

  const isCurrentMonth =
    viewYear === todayParts.year && viewMonth === todayParts.month;

  const canGoNext =
    viewYear < todayParts.year ||
    (viewYear === todayParts.year && viewMonth < todayParts.month);

  const goPrev = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToday = () => {
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* En-tête : navigation + titre */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          aria-label="Mois précédent"
          className="shrink-0 rounded-full"
        >
          <ChevronLeftIcon className="rtl:rotate-180" aria-hidden="true" />
        </Button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold tabular-nums text-center text-foreground">
            {grid.label}
          </span>
          {!isCurrentMonth ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToday}
              className="h-auto py-0.5 text-xs"
            >
              Aujourd&rsquo;hui
            </Button>
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Mois suivant"
          className="shrink-0 rounded-full"
        >
          <ChevronRightIcon className="rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>

      {/* Grille du mois */}
      <div className="flex flex-col gap-1">
        {/* Ligne des jours de la semaine */}
        <div className="grid grid-cols-7 gap-px">            {WEEKDAYS.map((wd) => (
            <span
              key={wd}
              className="text-center text-xs text-muted-foreground tabular-nums"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Semaines */}
        {grid.weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.map((day) => (
              <CalendarCell key={day.date} day={day} />
            ))}
          </div>
        ))}
      </div>

      {/* Résumé du mois */}
      <BodySmall className="text-center text-text-secondary tabular-nums">
        {stats.activeDays === 0
          ? "Aucune activité ce mois"
          : `${stats.activeDays} jour${stats.activeDays > 1 ? "s" : ""} actif${stats.activeDays > 1 ? "s" : ""} sur ${stats.totalDays}`}
      </BodySmall>
    </div>
  );
}

function CalendarCell({ day }: { day: CalendarDay }) {
  const isToday = day.isToday;
  const isActive = day.active;
  const isFuture = day.isFuture;
  const isCurrentMonth = day.isCurrentMonth;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg",
        "h-8 w-8 sm:h-9 sm:w-9",
        // Jour actif : badge doré (accomplissement)
        isActive &&
          isCurrentMonth &&
          "bg-hikma-gold text-primary-foreground font-semibold",
        // Aujourd'hui (non actif) : anneau teal (position actuelle)
        isToday && !isActive && "ring-2 ring-primary ring-inset",
        // Jour futur : atténué
        isFuture && "opacity-30",
        // Jour hors mois : très atténué
        !isCurrentMonth && "opacity-25",
        // Jour passé inactif : neutre
        !isActive && !isToday && isCurrentMonth && !isFuture && "text-muted-foreground",
      )}
      title={day.date}
      role="gridcell"
      aria-label={`${day.date}${isActive ? " — actif" : ""}${isToday ? " — aujourd'hui" : ""}`}
    >
      <span
        className={cn(
          "text-xs tabular-nums leading-none",
          isActive && isCurrentMonth && "text-primary-foreground",
          isToday && !isActive && "font-semibold",
        )}
      >
        {day.day}
      </span>
    </div>
  );
}