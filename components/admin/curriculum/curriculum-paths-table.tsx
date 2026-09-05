import Link from "next/link";
import type { AdminCurriculumPathItem } from "@/lib/admin/metrics";
import { ChevronRightIcon } from "lucide-react";

interface CurriculumPathsTableProps {
  paths: AdminCurriculumPathItem[];
}

export function CurriculumPathsTable({ paths }: CurriculumPathsTableProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Parcours pédagogiques actifs ({paths.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Hiérarchie complète : Parcours → Unité → Leçons publiées.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-[11px] font-semibold text-muted-foreground">
              <th className="pb-3 pl-2 pr-3">Sourate</th>
              <th className="pb-3 px-3">Titre du parcours</th>
              <th className="pb-3 px-3">Versets</th>
              <th className="pb-3 px-3 text-center">Leçons</th>
              <th className="pb-3 px-3 text-center">Mots enseignés</th>
              <th className="pb-3 px-3 text-right">Détail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {paths.map((p) => (
              <tr
                key={p.id}
                className="group transition-colors hover:bg-surface-subtle"
              >
                {/* Sourate */}
                <td className="py-3 pl-2 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-subtle font-mono text-xs font-bold text-foreground group-hover:bg-primary/10 group-hover:text-primary">
                      {p.surahNumber}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">
                          {p.surahName}
                        </span>
                        {p.surahArabic && (
                          <span className="font-amiri text-xs text-muted-foreground">
                            {p.surahArabic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Titre du parcours */}
                <td className="py-3 px-3">
                  <span className="text-foreground font-medium truncate block max-w-xs sm:max-w-sm">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {p.slug}
                  </span>
                </td>

                {/* Versets */}
                <td className="py-3 px-3 tabular-nums text-muted-foreground">
                  {p.ayahCount} versets
                </td>

                {/* Leçons */}
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {p.lessonCount} leçons
                  </span>
                </td>

                {/* Mots */}
                <td className="py-3 px-3 text-center tabular-nums text-foreground font-semibold">
                  {p.wordsCount}
                </td>

                {/* Action Drill-Down */}
                <td className="py-3 px-3 text-right">
                  <Link
                    href={`/admin/curriculum/${p.surahNumber}`}
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
