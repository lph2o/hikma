import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BodyMedium, Caption, H2 } from "@/components/ui/typography";
import type { QuranCoverage } from "@/lib/learning/queries";
import type { SurahCoverage } from "@/lib/learning/coverage";
import type { ActivePathSelection } from "@/lib/learning/active-path";

export type CoverageCardProps = {
  coverage: QuranCoverage | null;
  surahCoverage: SurahCoverage[];
  selection: ActivePathSelection;
};

/**
 * Carte de couverture coranique pour le Dashboard (Phase 83B).
 *
 * Affiche le pourcentage global + un résumé des sourates couvertes.
 * État vide pédagogique si pas encore de mots compris.
 * Secondaire par rapport au TodayCard.
 */
export function CoverageCard({
  coverage,
  surahCoverage,
  selection,
}: CoverageCardProps) {
  const percent = coverage?.coveragePercent ?? 0;
  const covered = coverage?.coveredOccurrences ?? 0;
  const total = coverage?.totalOccurrences ?? 0;
  const hasWords = percent > 0;

  return (
    <section aria-labelledby="coverage-title">
      <Card className="border-border-subtle bg-surface-elevated">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <H2 id="coverage-title" className="text-lg">
            Ta compréhension du Coran
          </H2>

          {hasWords ? (
            <>
              {/* Barre de progression */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    ≈ {percent}%
                  </span>
                  <Caption className="text-text-secondary tabular-nums">
                    {covered.toLocaleString("fr-FR")} /{" "}
                    {total.toLocaleString("fr-FR")} occurrences
                  </Caption>
                </div>
                <Progress
                  value={percent}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="[&_[data-slot=progress-indicator]]:bg-hikma-gold"
                />
              </div>

              {/* Résumé par sourate */}
              {surahCoverage.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <Caption className="text-text-secondary">
                    {surahCoverage.length} sourate
                    {surahCoverage.length > 1 ? "s" : ""} avec des mots connus
                  </Caption>
                  <div className="flex flex-col gap-1">
                    {surahCoverage.slice(0, 3).map((s) => (
                      <div
                        key={s.surahNumber}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                          {s.surahNumber}
                        </span>
                        <span className="flex-1 truncate font-medium text-foreground">
                          {s.surahName}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {s.coveragePercent}%
                        </span>
                      </div>
                    ))}
                    {surahCoverage.length > 3 ? (
                      <Caption className="text-muted-foreground">
                        + {surahCoverage.length - 3} autre
                        {surahCoverage.length - 3 > 1 ? "s" : ""}
                      </Caption>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <Button
                render={<Link href="/surahs" />}
                variant="ghost"
                size="sm"
                className="w-fit"
              >
                Voir mes sourates
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            </>
          ) : (
            /* État vide */
            <div className="flex flex-col gap-3">
              <BodyMedium className="text-text-secondary">
                Pas encore de mots compris.
              </BodyMedium>
              <Caption className="text-text-secondary">
                Chaque leçon te rapproche de la compréhension du texte.
              </Caption>
              {selection.lessonSlug ? (
                <Button
                  render={
                    <Link href={`/learn/${selection.lessonSlug}`} />
                  }
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  Commencer ma première leçon
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              ) : selection.kind === "none" ? (
                <Button
                  render={<Link href="/review" />}
                  variant="outline"
                  size="sm"
                  className="w-fit"
                >
                  Réviser mes mots
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}