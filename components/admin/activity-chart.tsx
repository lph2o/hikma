"use client";

import { useState } from "react";
import type { AdminDailyActivity } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface ActivityChartProps {
  data: AdminDailyActivity[];
}

type MetricKey = "lessonsCompleted" | "wordsStudied" | "activeUsers" | "newUsers";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; color: string; barColor: string; unit: string }
> = {
  lessonsCompleted: {
    label: "Leçons complétées",
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
  newUsers: {
    label: "Nouveaux inscrits",
    color: "text-emerald-500",
    barColor: "bg-emerald-500",
    unit: "inscrits",
  },
};

export function ActivityChart({ data }: ActivityChartProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricKey>("lessonsCompleted");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const config = METRIC_CONFIG[selectedMetric];
  const values = data.map((d) => d[selectedMetric]);
  const maxValue = Math.max(...values, 1);
  const totalPeriod = values.reduce((sum, v) => sum + v, 0);

  const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Activité sur 30 jours
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total période :{" "}
            <span className="font-semibold text-foreground">
              {totalPeriod.toLocaleString("fr-FR")} {config.unit}
            </span>
          </p>
        </div>

        {/* Sélecteur d'onglet métrique */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle p-1">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
            const active = selectedMetric === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMetric(key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
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

      {/* Info-bulle dynamique lors du survol */}
      <div className="flex min-h-6 items-center justify-between text-xs text-muted-foreground">
        {hoveredItem ? (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {hoveredItem.date} :
            </span>
            <span className={cn("font-bold", config.color)}>
              {hoveredItem[selectedMetric]} {config.unit}
            </span>
            <span className="text-muted-foreground/60">
              ({hoveredItem.activeUsers} utilisateurs actifs, {hoveredItem.lessonsCompleted} leçons, {hoveredItem.wordsStudied} mots)
            </span>
          </div>
        ) : (
          <span>Survolez une barre pour inspecter le détail du jour</span>
        )}
      </div>

      {/* Graphique en barres */}
      <div className="relative flex h-48 w-full items-end gap-1 sm:gap-1.5 pt-6 pb-6">
        {data.map((item, idx) => {
          const val = item[selectedMetric];
          const heightPercent =
            val === 0 ? 3 : Math.max(8, Math.round((val / maxValue) * 100));
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.date}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Barre */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={cn(
                  "w-full rounded-t-sm transition-all duration-150",
                  val === 0
                    ? "bg-border/40"
                    : cn(config.barColor, isHovered ? "opacity-100 brightness-110" : "opacity-80"),
                )}
              />

              {/* Label de date sous la barre (tous les 5 jours pour lisibilité) */}
              {(idx % 5 === 0 || idx === data.length - 1) && (
                <span className="absolute -bottom-5 text-[10px] text-muted-foreground/70 whitespace-nowrap">
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
