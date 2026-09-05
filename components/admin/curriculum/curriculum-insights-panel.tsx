import type { AdminCurriculumInsight } from "@/lib/admin/metrics";
import {
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  CpuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumInsightsPanelProps {
  insights: AdminCurriculumInsight[];
}

const INSIGHT_CONFIG = {
  warning: {
    icon: <AlertTriangleIcon className="size-4" />,
    containerClass: "bg-amber-500/8 border-amber-500/30 text-amber-800 dark:text-amber-300",
    iconClass: "text-amber-500",
  },
  info: {
    icon: <InfoIcon className="size-4" />,
    containerClass: "bg-sky-500/8 border-sky-500/30 text-sky-800 dark:text-sky-300",
    iconClass: "text-sky-500",
  },
  success: {
    icon: <CheckCircleIcon className="size-4" />,
    containerClass: "bg-emerald-500/8 border-emerald-500/30 text-emerald-800 dark:text-emerald-300",
    iconClass: "text-emerald-500",
  },
};

export function CurriculumInsightsPanel({ insights }: CurriculumInsightsPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Santé du Corpus & Points de vigilance
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Indicateurs de complétude et architecture de génération.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {insights.map((insight) => {
          const cfg = INSIGHT_CONFIG[insight.type];
          return (
            <div
              key={insight.key}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-xs",
                cfg.containerClass,
              )}
            >
              <span className={cn("mt-0.5 shrink-0", cfg.iconClass)}>{cfg.icon}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{insight.title}</span>
                <span className="opacity-90">{insight.description}</span>
              </div>
            </div>
          );
        })}

        {/* Note architecturale sur la génération dynamique des exercices */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-xs text-primary-strong">
          <CpuIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Moteur d&apos;exercices à la volée</span>
            <span className="opacity-90">
              La table SQL <code className="rounded bg-primary/10 px-1 py-0.5">exercises</code> est intentionnellement vide : les exercices et distracteurs sont synthétisés dynamiquement en temps réel par le rule engine applicatif à partir des 4 503 liaisons <code className="rounded bg-primary/10 px-1 py-0.5">lesson_words</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
