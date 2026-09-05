import type { Metadata } from "next";
import {
  UsersIcon,
  ActivityIcon,
  UserPlusIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  GraduationCapIcon,
  DatabaseIcon,
  CalendarDaysIcon,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { ActivityChart } from "@/components/admin/activity-chart";
import { AttentionAlerts } from "@/components/admin/attention-alerts";
import {
  getAdminOverviewMetrics,
  getAdminAttentionMetrics,
  getAdminActivityChart30d,
  getQuranLegacyCounts,
  getLatestQuranImport,
} from "@/lib/admin/queries/overview";
import { requireAdmin } from "@/lib/admin/auth";
import { Caption } from "@/components/ui/typography";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vue d'ensemble — Admin Control Center | Hikma",
  robots: { index: false, follow: false },
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    overviewMetrics,
    attentionMetrics,
    activityData,
    legacyCounts,
    lastImport,
  ] = await Promise.all([

    getAdminOverviewMetrics(),
    getAdminAttentionMetrics(),
    getAdminActivityChart30d(),
    getQuranLegacyCounts(),
    getLatestQuranImport(),
  ]);

  const timestampStr = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Vue d&apos;ensemble
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm mt-0.5">
            Pilotage en temps réel de l&apos;activité, de l&apos;apprentissage et du contenu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">
            Synchronisé à {timestampStr}
          </span>
        </div>
      </div>

      {/* 6 KPI Cards du Data Contract */}
      <section aria-label="Indicateurs clés de performance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Utilisateurs"
            value={overviewMetrics.totalUsers}
            subtitle={`${overviewMetrics.newUsers7d} nouveaux sur 7j`}
            icon={UsersIcon}
          />
          <StatCard
            title="Actifs (7j)"
            value={overviewMetrics.activeUsers7d}
            subtitle="Leçons ou mots étudiés"
            icon={ActivityIcon}
            badge={{
              text: "7 jours",
              variant: overviewMetrics.activeUsers7d > 0 ? "success" : "default",
            }}
          />
          <StatCard
            title="Nouveaux (7j)"
            value={overviewMetrics.newUsers7d}
            subtitle="Inscriptions récentes"
            icon={UserPlusIcon}
          />
          <StatCard
            title="Sessions (7j)"
            value={overviewMetrics.sessions7d}
            subtitle="Leçons complétées"
            icon={CheckCircle2Icon}
          />
          <StatCard
            title="Leçons"
            value={overviewMetrics.lessonsPublished}
            subtitle="Publiées dans l'app"
            icon={BookOpenIcon}
          />
          <StatCard
            title="Couverture FR"
            value={`${overviewMetrics.coveragePercent}%`}
            subtitle={`${overviewMetrics.validatedQuranWords.toLocaleString("fr-FR")} formes`}
            icon={GraduationCapIcon}
            badge={{
              text: "Coran",
              variant: "info",
            }}
          />
        </div>
      </section>

      {/* Graphique d'activité sur 30 jours */}
      <section aria-label="Graphique d'activité">
        <ActivityChart data={activityData} />
      </section>

      {/* Points d'attention / Qualité & Erreurs */}
      <section aria-label="Points d'attention">
        <AttentionAlerts metrics={attentionMetrics} />
      </section>

      {/* Rétrocompatibilité — Données coraniques & Dernier Import */}
      <section aria-label="Données coraniques et infrastructure">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="size-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Base de données coranique &amp; Imports
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Lecture seule
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {legacyCounts.map(({ key, label, count }) => (
              <div
                key={key}
                className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-subtle p-3"
              >
                <Caption className="text-[11px] text-muted-foreground">{label}</Caption>
                <span className="text-lg font-bold text-foreground">
                  {count == null ? "—" : count.toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>

          {/* Statut dernier import */}
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-subtle p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CalendarDaysIcon className="size-3.5 text-muted-foreground" />
              <span>Dernier import enregistré</span>
            </div>
            {lastImport ? (
              <div className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-4">
                <div>
                  Statut :{" "}
                  <span className="font-medium text-foreground">{lastImport.status}</span>
                </div>
                <div>
                  Démarré :{" "}
                  <span className="font-medium text-foreground">
                    {lastImport.started_at
                      ? new Date(lastImport.started_at).toLocaleString("fr-FR")
                      : "—"}
                  </span>
                </div>
                <div>
                  Insérés :{" "}
                  <span className="font-medium text-foreground">
                    {lastImport.records_imported}
                  </span>
                </div>
                <div>
                  Échecs :{" "}
                  <span className="font-medium text-foreground">
                    {lastImport.records_failed}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun import enregistré.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
