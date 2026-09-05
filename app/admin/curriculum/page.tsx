import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getAdminCurriculumKpis,
  getAdminCurriculumPaths,
  getAdminCorpusSurahs,
  getAdminCurriculumInsights,
} from "@/lib/admin/queries/curriculum";
import { CurriculumKpiCards } from "@/components/admin/curriculum/curriculum-kpi-cards";
import { CurriculumInsightsPanel } from "@/components/admin/curriculum/curriculum-insights-panel";
import { CurriculumPathsTable } from "@/components/admin/curriculum/curriculum-paths-table";
import { CorpusSurahsPanel } from "@/components/admin/curriculum/corpus-surahs-panel";
import { ClapperboardIcon, GraduationCapIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Santé du Curriculum — Admin Control Center | Hikma",
  robots: { index: false, follow: false },
};

export default async function AdminCurriculumPage() {
  await requireAdmin();

  // Exécution de toutes les requêtes en parallèle côté serveur
  const [kpis, paths, surahs, insights] = await Promise.all([
    getAdminCurriculumKpis(),
    getAdminCurriculumPaths(),
    getAdminCorpusSurahs(),
    getAdminCurriculumInsights(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Curriculum & Santé du Corpus
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Supervision du contenu pédagogique, des parcours et de la couverture lexicale du Coran.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/learning"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-interactive hover:text-foreground"
          >
            <GraduationCapIcon className="size-3.5" />
            <span>Métriques Apprentissage</span>
          </Link>
          <Link
            href="/admin/content-studio"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-interactive hover:text-foreground"
          >
            <ClapperboardIcon className="size-3.5" />
            <span>Content Studio</span>
          </Link>
        </div>
      </div>

      {/* Cartes KPI */}
      <CurriculumKpiCards kpis={kpis} />

      {/* Points d'attention */}
      <CurriculumInsightsPanel insights={insights} />

      {/* Tableau des parcours actifs */}
      <CurriculumPathsTable paths={paths} />

      {/* Répertoire complet des 114 sourates du corpus */}
      <CorpusSurahsPanel surahs={surahs} />
    </div>
  );
}
