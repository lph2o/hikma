"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { AdminCorpusSurahItem } from "@/lib/admin/metrics";
import { SearchIcon, ChevronRightIcon, CheckCircle2Icon, CircleDashedIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CorpusSurahsPanelProps {
  surahs: AdminCorpusSurahItem[];
}

export function CorpusSurahsPanel({ surahs }: CorpusSurahsPanelProps) {
  const [filter, setFilter] = useState<"all" | "with_curriculum" | "without_curriculum">("all");
  const [search, setSearch] = useState("");

  const filteredSurahs = useMemo(() => {
    return surahs.filter((s) => {
      // Filtre catégorie
      if (filter === "with_curriculum" && !s.hasCurriculum) return false;
      if (filter === "without_curriculum" && s.hasCurriculum) return false;

      // Recherche texte
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        s.number.toString() === q ||
        s.name.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        s.arabic.includes(q)
      );
    });
  }, [surahs, filter, search]);

  const withCurriculumCount = useMemo(() => surahs.filter((s) => s.hasCurriculum).length, [surahs]);
  const withoutCurriculumCount = surahs.length - withCurriculumCount;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Répertoire des 114 Sourates du Corpus
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Statut de déploiement pédagogique sourate par sourate.
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher (ex: 1, Fatiha, Ikhlas)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface-subtle py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Onglets de filtrage */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            filter === "all"
              ? "bg-primary/10 text-primary-strong font-semibold"
              : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
          )}
        >
          Toutes ({surahs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("with_curriculum")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            filter === "with_curriculum"
              ? "bg-primary/10 text-primary-strong font-semibold"
              : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
          )}
        >
          Avec parcours ({withCurriculumCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("without_curriculum")}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            filter === "without_curriculum"
              ? "bg-primary/10 text-primary-strong font-semibold"
              : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
          )}
        >
          Sans parcours ({withoutCurriculumCount})
        </button>
      </div>

      {/* Tableau des sourates */}
      <div className="max-h-[32rem] overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border-subtle text-[11px] font-semibold text-muted-foreground">
              <th className="pb-3 pl-2 pr-3">N°</th>
              <th className="pb-3 px-3">Sourate</th>
              <th className="pb-3 px-3">Traduction</th>
              <th className="pb-3 px-3 text-center">Versets</th>
              <th className="pb-3 px-3 text-center">Statut Curriculum</th>
              <th className="pb-3 px-3 text-right">Fiche</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filteredSurahs.map((s) => (
              <tr
                key={s.number}
                className="group transition-colors hover:bg-surface-subtle"
              >
                {/* Numéro */}
                <td className="py-2.5 pl-2 pr-3 font-mono text-xs font-bold text-muted-foreground">
                  {s.number}
                </td>

                {/* Nom */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <span className="font-amiri text-xs text-muted-foreground">
                      {s.arabic}
                    </span>
                  </div>
                </td>

                {/* Traduction */}
                <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs">
                  {s.translation}
                </td>

                {/* Versets */}
                <td className="py-2.5 px-3 text-center tabular-nums text-muted-foreground">
                  {s.ayahCount}
                </td>

                {/* Statut curriculum */}
                <td className="py-2.5 px-3 text-center">
                  {s.hasCurriculum ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2Icon className="size-3" />
                      <span>{s.lessonCount} leçons</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <CircleDashedIcon className="size-3" />
                      <span>Non planifiée</span>
                    </span>
                  )}
                </td>

                {/* Fiche drill-down */}
                <td className="py-2.5 px-3 text-right">
                  <Link
                    href={`/admin/curriculum/${s.number}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                  >
                    <span>Explorer</span>
                    <ChevronRightIcon className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
