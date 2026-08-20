"use client";

// F3 — Anneau de progression de l'objectif quotidien.
// Valeurs 100 % réelles (progression dérivée des journaux d'activité) ;
// composant purement visuel, aucune donnée inventée.

import { cn } from "@/lib/utils";

export type GoalRingProps = {
  /** 0–100. */
  percent: number;
  /** Libellé central (ex. « 3 / 5 »). */
  label: string;
  size?: number;
  className?: string;
};

export function GoalRing({ percent, label, size = 96, className }: GoalRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`Objectif du jour : ${label} (${clamped}%)`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-input"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-[stroke-dashoffset] duration-500",
            clamped >= 100 ? "stroke-success" : "stroke-primary",
          )}
        />
      </svg>
      <span className="absolute max-w-[4.5rem] whitespace-pre-line text-center text-sm font-semibold leading-tight tabular-nums text-foreground">
        {label}
      </span>
    </div>
  );
}
