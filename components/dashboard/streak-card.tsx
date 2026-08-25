"use client";

// Carte de régularité (Phase 73-74, polish Phase 75).
// Deux variantes :
//   - "compact" (dashboard) : streak + record + semaine + CTA "Voir mon activité"
//   - "full" (page activité) : streak proéminent + métriques secondaires

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import type { RegularityMetrics } from "@/lib/learning/regularity";

export type StreakCardProps = {
  regularity: RegularityMetrics;
  /** true si le streak est rompu aujourd'hui. */
  streakBroken?: boolean;
  /** "compact" (dashboard) ou "full" (page dédiée). Défaut: "full". */
  variant?: "compact" | "full";
  className?: string;
};

export function StreakCard({
  regularity,
  streakBroken = false,
  variant = "full",
  className,
}: StreakCardProps) {
  const streak = regularity.currentStreak;

  if (variant === "compact") {
    return <CompactStreak regularity={regularity} streakBroken={streakBroken} className={className} />;
  }

  const hasStreak = streak >= 1;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Streak actuel — proéminent */}
      <div
        className={cn(
          "flex flex-col items-center gap-1 rounded-2xl px-6 py-4 transition-colors",
          hasStreak &&
            "border border-hikma-gold/35 bg-hikma-gold/8 shadow-[0_0_24px_-8px_color-mix(in_srgb,var(--hikma-gold)_18%,transparent)]",
        )}
      >
        <span className="text-3xl sm:text-4xl leading-none" aria-hidden="true">
          🔥
        </span>
        <span
          className={cn(
            "text-2xl sm:text-3xl font-bold tabular-nums",
            hasStreak ? "text-primary-strong" : "text-foreground",
          )}
        >
          {streak}
        </span>
        <Caption
          className={
            hasStreak ? "text-primary-strong/70" : "text-text-secondary"
          }
        >
          {streak === 0
            ? "Aucune série en cours"
            : streak === 1
              ? "jour de série"
              : "jours de série"}
        </Caption>
      </div>

      {/* Barre de métriques secondaires */}
      <div className="flex items-center gap-4 sm:gap-6">
        <MiniStat
          icon="🏆"
          value={regularity.longestStreak}
          label={regularity.longestStreak === 1 ? "jour (record)" : "jours (record)"}
        />
        <div className="h-8 w-px bg-border-subtle" aria-hidden="true" />
        <MiniStat
          icon="📅"
          value={`${regularity.weeklyActiveDays}/7`}
          label="cette semaine"
        />
      </div>

      {/* Message streak rompu */}
      {streakBroken && regularity.totalActiveDays > 0 ? (
        <Caption className="text-text-secondary text-center">
          Reprends aujourd&rsquo;hui pour relancer ta série.
        </Caption>
      ) : null}
    </div>
  );
}

/**
 * Variante compacte pour le Dashboard (Phase 75).
 * Streak horizontal + métriques + CTA discret.
 */
function CompactStreak({
  regularity,
  streakBroken,
  className,
}: {
  regularity: RegularityMetrics;
  streakBroken: boolean;
  className?: string;
}) {
  const streak = regularity.currentStreak;

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Ligne streak principale */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none" aria-hidden="true">🔥</span>
          <div className="flex flex-col">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {streak}
            </span>
            <Caption className="text-text-secondary">
              {streak === 0
                ? "Aucune série en cours"
                : streak === 1
                  ? "jour de série"
                  : "jours de série"}
            </Caption>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CompactMiniStat
            icon="🏆"
            value={regularity.longestStreak}
            label="record"
          />
          <CompactMiniStat
            icon="📅"
            value={`${regularity.weeklyActiveDays}/7`}
            label="semaine"
          />
        </div>
      </div>

      {/* Message streak rompu */}
      {streakBroken && regularity.totalActiveDays > 0 ? (
        <Caption className="text-text-secondary">
          Reprends aujourd&rsquo;hui pour relancer ta série.
        </Caption>
      ) : null}

      {/* CTA vers page activité */}
      <div className="flex justify-end">
        <Button
          render={<Link href="/activity" />}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          Voir mon activité
        </Button>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  const isRecord = icon === "🏆";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Caption className="text-text-secondary">
        {icon}{" "}
        <span
          className={cn(
            "font-semibold tabular-nums",
            isRecord ? "text-primary-strong" : "text-foreground",
          )}
        >
          {value}
        </span>
      </Caption>
      <Caption className="text-[10px] text-muted-foreground leading-none">
        {label}
      </Caption>
    </div>
  );
}

function CompactMiniStat({
  icon,
  value,
  label,
}: {
  icon: string;
  value: string | number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1 text-xs tabular-nums text-text-secondary">
      {icon}{" "}
      <span className="font-semibold text-foreground">{value}</span>{" "}
      {label}
    </span>
  );
}