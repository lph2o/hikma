import Link from "next/link";
import { ArabicText } from "@/components/ui/arabic-text";
import { Caption, BodyMedium } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { VerseAudioButton } from "@/components/ui/verse-audio";
import { cn } from "@/lib/utils";
import type { AyahCoverage as AyahCoverageType } from "@/lib/learning/coverage";

const COMPREHENDED = new Set(["familiar", "mastered"]);

export function AyahCoverage({ ayah }: { ayah: AyahCoverageType }) {
  const complete =
    ayah.totalOccurrences > 0 &&
    ayah.coveredOccurrences === ayah.totalOccurrences;

  return (
    <section
      aria-labelledby={`ayah-heading-${ayah.ayahId}`}
      className="flex flex-col gap-4"
    >
      {/* Rangée 1 : numéro + couverture */}
      <div className="flex items-center gap-3">
        <span
          id={`ayah-heading-${ayah.ayahId}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-sm font-semibold tabular-nums text-primary-strong"
        >
          {ayah.ayahNumber}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            role="progressbar"
            aria-valuenow={ayah.coveragePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Couverture lexicale : ${ayah.coveragePercent} %, ${ayah.coveredOccurrences} occurrences connues sur ${ayah.totalOccurrences}`}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                complete ? "bg-success-text" : "bg-hikma-gold",
              )}
              style={{ width: `${ayah.coveragePercent}%` }}
            />
          </div>
          <Caption className="shrink-0 tabular-nums text-text-secondary">
            {ayah.coveragePercent}&nbsp;%
          </Caption>
        </div>
      </div>

      {/* Rangée 2 : texte arabe + audio dans une carte */}
      <Card className="border-border-subtle bg-surface-elevated">
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <ArabicText
              scale="verse"
              className="leading-loose text-primary-strong"
            >
              {ayah.textUthmani}
            </ArabicText>
            <VerseAudioButton
              globalAyahNumber={ayah.globalAyahNumber}
              className="shrink-0 self-start"
            />
          </div>

          {/* Badges */}
          {ayah.occurrences.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ayah.occurrences.map((occ) => (
                <OccurrenceBadge key={occ.occurrenceId} occ={occ} />
              ))}
            </div>
          )}

          {/* Compteur + statut */}
          <Caption className="text-text-secondary">
            {ayah.coveredOccurrences}/{ayah.totalOccurrences} occurrences
            {complete
              ? " — Couverture lexicale complète"
              : ayah.coveredOccurrences === 0
                ? " — Aucune occurrence connue"
                : " — Couverture lexicale partielle"}
          </Caption>
        </CardContent>
      </Card>

      {/* Rangée 3 : traduction française */}
      {ayah.translationFr ? (
        <BodyMedium className="text-text-secondary" lang="fr">
          {ayah.translationFr}
        </BodyMedium>
      ) : (
        <Caption className="italic text-text-secondary/70" lang="fr">
          Traduction française à venir.
        </Caption>
      )}
    </section>
  );
}

function OccurrenceBadge({
  occ,
}: {
  occ: AyahCoverageType["occurrences"][number];
}) {
  const isKnown = COMPREHENDED.has(occ.status ?? "");

  if (isKnown) {
    return (
      <Link
        href={`/mots/${occ.wordId}`}
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
          "bg-success/8 text-success-text ring-1 ring-inset ring-success-text/25",
          "hover:bg-success/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-success-text",
        )}
      >
        {occ.text}
      </Link>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        "bg-surface-subtle text-text-secondary/60 ring-1 ring-inset ring-border-subtle",
      )}
    >
      {occ.text}
    </span>
  );
}