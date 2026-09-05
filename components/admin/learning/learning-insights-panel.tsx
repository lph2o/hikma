import type { AdminLearningInsight } from "@/lib/admin/metrics";
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningInsightsPanelProps {
  insights: AdminLearningInsight[];
}

const INSIGHT_CONFIG = {
  warning: {
    icon: <AlertTriangleIcon className="size-4" />,
    containerClass: "bg-amber-500/8 border-amber-500/30 text-amber-700 dark:text-amber-400",
    iconClass: "text-amber-500",
  },
  info: {
    icon: <InfoIcon className="size-4" />,
    containerClass: "bg-sky-500/8 border-sky-500/30 text-sky-700 dark:text-sky-400",
    iconClass: "text-sky-500",
  },
  success: {
    icon: <CheckCircleIcon className="size-4" />,
    containerClass: "bg-emerald-500/8 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    iconClass: "text-emerald-500",
  },
};

export function LearningInsightsPanel({ insights }: LearningInsightsPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div>
        <h2 className="text-base font-semibold text-foreground">Points d&apos;attention</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Alertes calculées uniquement depuis les données réelles.
        </p>
      </div>

      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircleIcon className="size-4 shrink-0" />
          <span>Aucun point d&apos;attention détecté. Tout est au vert.</span>
        </div>
      ) : (
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
                  <span className="opacity-80">{insight.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
