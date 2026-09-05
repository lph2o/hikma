"use client";

import { useState } from "react";
import type { AdminLearningDailyActivity } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface LearningActivityChartProps {
  data: AdminLearningDailyActivity[];
  period: "7d" | "30d";
}

type MetricKey = "lessonsCompleted" | "wordsStudied" | "activeUsers";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; color: string; barColor: string; unit: string }
> = {
  lessonsCompleted: {
    label: "Leçons",
    color: "text-primary",
    barColor: "bg-primary",
    unit: "leçons",
  },
  wordsStudied: {
    label: "Mots étudiés",
    color: "text-hikma-gold",
    barColor: "bg-hikma-gold",
    unit: "mots",
  },
  activeUsers: {
    label: "Utilisateurs actifs",
    color: "text-sky-500",
    barColor: "bg-sky-500",
    unit: "actifs",
  },
};

export function LearningActivityChart({ data, period }: LearningActivityChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("lessonsCompleted");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const config = METRIC_CONFIG[selectedMetric];
  const values = data.map((d) => d[selectedMetric]);
  const maxValue = Math.max(...values, 1);
  const totalPeriod = values.reduce((sum, v) => sum + v, 0);
  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  // Label de période
  const periodLabel = period === "7d" ? "7 derniers jours" : "30 derniers jours";

  // Tick tous les N barres selon la période
  const tickEvery = period === "7d" ? 1 : 5;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Activité — {periodLabel}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Total période :{" "}
            <span className="font-semibold text-foreground">
              {totalPeriod.toLocaleString("fr-FR")} {config.unit}
            </span>
          </p>
        </div>

        {/* Sélecteur de métrique */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle p-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
            const active = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {METRIC_CONFIG[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info-bulle survol */}
      <div className="flex min-h-6 items-center gap-2 text-xs text-muted-foreground">
        {hoveredItem ? (
          <>
            <span className="font-medium text-foreground">{hoveredItem.date} :</span>
            <span className={cn("font-bold", config.color)}>
              {hoveredItem[selectedMetric]} {config.unit}
            </span>
            <span className="text-muted-foreground/60">
              ({hoveredItem.lessonsCompleted} leçons · {hoveredItem.wordsStudied} mots · {hoveredItem.activeUsers} user{hoveredItem.activeUsers > 1 ? "s" : ""})
            </span>
          </>
        ) : (
          <span>Survolez une barre pour voir le détail</span>
        )}
      </div>

      {/* Graphique en barres */}
      <div className="relative flex h-44 w-full items-end gap-[2px] pb-6 pt-2">
        {data.map((item, idx) => {
          const val = item[selectedMetric];
          const heightPercent =
            val === 0 ? 4 : Math.max(8, Math.round((val / maxValue) * 100));
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.date}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                style={{ height: `${heightPercent}%` }}
                className={cn(
                  "w-full rounded-t-sm transition-all duration-150",
                  val === 0
                    ? "bg-input/60"
                    : cn(
                        config.barColor,
                        isHovered ? "opacity-100 brightness-110" : "opacity-75",
                      ),
                )}
              />
              {(idx % tickEvery === 0 || idx === data.length - 1) && (
                <span className="absolute -bottom-5 whitespace-nowrap text-[10px] text-muted-foreground/70">
                  {item.dayLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
