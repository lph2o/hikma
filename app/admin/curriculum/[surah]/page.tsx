import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminCurriculumSurahDetail } from "@/lib/admin/queries/curriculum";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  LanguagesIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface SurahDetailPageProps {
  params: Promise<{
    surah: string;
  }>;
}

export async function generateMetadata({
  params,
}: SurahDetailPageProps): Promise<Metadata> {
  const { surah: surahParam } = await params;
  const num = parseInt(surahParam, 10);
  return {
    title: `Sourate ${isNaN(num) ? surahParam : num} — Curriculum | Hikma`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminCurriculumSurahPage({
  params,
}: SurahDetailPageProps) {
  await requireAdmin();

  const { surah: surahParam } = await params;
  const surahNumber = parseInt(surahParam, 10);

  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    notFound();
  }

  const detail = await getAdminCurriculumSurahDetail(surahNumber);
  if (!detail) {
    notFound();
  }

  const { surah, corpus, path, lessons } = detail;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Fil d'Ariane & Retour */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/curriculum"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-interactive hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          <span>Retour au curriculum</span>
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          Sourate {surah.number} sur 114
        </span>
      </div>

      {/* En-tête de la Sourate */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-mono text-xl font-bold text-primary">
            {surah.number}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {surah.nameTransliteration}
              </h1>
              <span className="font-amiri text-2xl font-bold text-hikma-gold">
                {surah.nameArabic}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{surah.nameTranslation}</span>
              <span>·</span>
              <span>{surah.ayahCount} versets</span>
              <span>·</span>
              <span className="capitalize">{surah.revelationPlace}</span>
            </div>
          </div>
        </div>

        {/* Badge statut curriculum */}
        <div>
          {path ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" />
              <span>Parcours actif ({lessons.length} leçons)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1 text-xs font-medium text-muted-foreground">
              <CircleDashedIcon className="size-3.5" />
              <span>Aucun parcours structuré</span>
            </span>
          )}
        </div>
      </div>

      {/* Métriques Corpus & Santé */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Formes uniques */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
          <span className="text-xs font-medium text-muted-foreground">
            Formes lexicales uniques
          </span>
          <span className="text-2xl font-bold text-foreground">
            {corpus.uniqueWordsCount}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Dans cette sourate
          </span>
        </div>

        {/* Occurrences */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
          <span className="text-xs font-medium text-muted-foreground">
            Occurrences totales
          </span>
          <span className="text-2xl font-bold text-foreground">
            {corpus.occurrencesCount}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Mots répartis sur les versets
          </span>
        </div>

        {/* Mots traduits */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
          <span className="text-xs font-medium text-muted-foreground">
            Traductions FR validées
          </span>
          <span className="text-2xl font-bold text-foreground">
            {corpus.translatedWordsCount}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Sur {corpus.uniqueWordsCount} formes ({corpus.coveragePct}%)
          </span>
        </div>

        {/* Couverture lexicale */}
        <div className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Couverture lexicale
            </span>
            <LanguagesIcon className="size-4 text-hikma-gold" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              {corpus.coveragePct}%
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
              <div
                className="h-full rounded-full bg-hikma-gold transition-all duration-500"
                style={{ width: `${corpus.coveragePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Détail du Parcours et des Leçons */}
      {path ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {path.title}
                </h2>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {path.slug}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {path.description || "Unité pédagogique : " + path.unitTitle}
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {lessons.length} leçons au total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] font-semibold text-muted-foreground">
                  <th className="pb-3 pl-2 pr-3">Ordre</th>
                  <th className="pb-3 px-3">Titre de la leçon</th>
                  <th className="pb-3 px-3">Objectif</th>
                  <th className="pb-3 px-3 text-center">Difficulté</th>
                  <th className="pb-3 px-3 text-center">Mots</th>
                  <th className="pb-3 px-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {lessons.map((l) => (
                  <tr
                    key={l.id}
                    className="group transition-colors hover:bg-surface-subtle"
                  >
                    <td className="py-3 pl-2 pr-3 font-mono font-bold text-muted-foreground">
                      #{l.sortOrder}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-foreground block">
                        {l.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {l.slug}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground max-w-sm truncate">
                      {l.objective || "—"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-xs font-bold text-foreground">
                        Niv. {l.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums font-semibold text-foreground">
                      {l.wordsCount}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Publiée
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-subtle p-12 text-center">
          <BookOpenIcon className="size-10 text-muted-foreground/50" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              Aucun parcours d&apos;apprentissage créé
            </h3>
            <p className="max-w-md text-xs text-muted-foreground">
              Cette sourate ({surah.nameTransliteration}) ne dispose pas encore de parcours structuré dans la table <code className="rounded bg-surface-subtle px-1 py-0.5">learning_paths</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
