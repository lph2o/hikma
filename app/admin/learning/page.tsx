import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminLearningKpis,
  getAdminLearningActivityChart,
  getAdminLearningVocabBreakdown,
  getAdminLearningTopLessons,
  getAdminLearningInsights,
  type LearningPeriod,
} from "@/lib/admin/queries/learning";
import { LearningKpiCards } from "@/components/admin/learning/learning-kpi-cards";
import { LearningActivityChart } from "@/components/admin/learning/learning-activity-chart";
import { VocabProgressPanel } from "@/components/admin/learning/vocab-progress-panel";
import { TopLessonsTable } from "@/components/admin/learning/top-lessons-table";
import { LearningInsightsPanel } from "@/components/admin/learning/learning-insights-panel";
import { PeriodSwitcher } from "@/components/admin/learning/period-switcher";
import { UsersIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Learning — Admin Control Center | Hikma",
  robots: { index: false, follow: false },
};

interface LearningPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

export default async function AdminLearningPage({ searchParams }: LearningPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const rawPeriod = params.period;
  const period: LearningPeriod =
    rawPeriod === "7d" || rawPeriod === "30d" ? rawPeriod : "30d";

  // Toutes les requêtes en parallèle
  const [kpis, activityChart, vocab, topLessons, insights] = await Promise.all([
    getAdminLearningKpis(period),
    getAdminLearningActivityChart(period),
    getAdminLearningVocabBreakdown(),
    getAdminLearningTopLessons(),
    getAdminLearningInsights(period),
  ]);

  const periodLabel = period === "7d" ? "7 derniers jours" : "30 derniers jours";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Analytics Learning
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Activité d&apos;apprentissage réelle · {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Drill-down → liste utilisateurs */}
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-interactive hover:text-foreground"
          >
            <UsersIcon className="size-3.5" />
            <span>Voir les utilisateurs</span>
          </Link>

          {/* Sélecteur de période */}
          <PeriodSwitcher currentPeriod={period} />
        </div>
      </div>

      {/* KPI Cards — 6 métriques */}
      <LearningKpiCards kpis={kpis} />

      {/* Graphique d'activité + Points d'attention */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.42fr]">
        <LearningActivityChart data={activityChart} period={period} />
        <LearningInsightsPanel insights={insights} />
      </div>

      {/* Progression vocabulaire + Top leçons */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.6fr]">
        <VocabProgressPanel vocab={vocab} />
        <TopLessonsTable lessons={topLessons} />
      </div>
    </div>
  );
}
