import Link from "next/link";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileEditIcon,
  VideoIcon,
} from "lucide-react";
import type { AdminAttentionMetrics } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

interface AttentionAlertsProps {
  metrics: AdminAttentionMetrics;
}

export function AttentionAlerts({ metrics }: AttentionAlertsProps) {
  const alerts = [
    {
      id: "failed_renders",
      title: "Renders vidéo en échec",
      count: metrics.rendersFailed,
      level: "critical" as const,
      description: "Des erreurs sont survenues lors du rendu Remotion.",
      href: "/admin/content-studio/queue",
      cta: "Voir la file",
      icon: AlertCircleIcon,
    },
    {
      id: "pending_renders",
      title: "Renders en attente",
      count: metrics.rendersPending,
      level: "warning" as const,
      description: "Contenus approuvés en attente de génération vidéo.",
      href: "/admin/content-studio/queue",
      cta: "Gérer la file",
      icon: ClockIcon,
    },
    {
      id: "content_review",
      title: "Contenus en attente de validation",
      count: metrics.contentReview,
      level: "info" as const,
      description: "Vidéos soumises à la révision éditoriale.",
      href: "/admin/content-studio",
      cta: "Ouvrir le studio",
      icon: VideoIcon,
    },
    {
      id: "draft_lessons",
      title: "Leçons en brouillon",
      count: metrics.lessonsDraft,
      level: "info" as const,
      description: "Leçons non encore publiées dans le curriculum.",
      href: "/admin/curriculum",
      cta: "Voir le curriculum",
      icon: FileEditIcon,
    },
  ].filter((a) => a.count > 0);

  const allClear = alerts.length === 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <span>Points d&apos;attention</span>
          {allClear ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" />
              Optimal
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              {alerts.length} point{alerts.length > 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>

      {allClear ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2Icon className="size-5 shrink-0" />
          <p className="text-xs sm:text-sm">
            Tous les systèmes sont au vert. Aucun render en échec, aucun contenu bloqué.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex flex-col justify-between gap-3 rounded-xl border p-4 transition-colors",
                  alert.level === "critical" &&
                    "border-destructive/30 bg-destructive/5 text-destructive",
                  alert.level === "warning" &&
                    "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                  alert.level === "info" &&
                    "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg p-1.5 bg-card/60">
                    <Icon className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold">
                      {alert.count} {alert.title}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={alert.href}
                  className="self-end text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {alert.cta} &rarr;
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
