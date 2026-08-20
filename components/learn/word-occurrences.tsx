"use client";

// F1 — Occurrences d'un mot dans le Coran, paginées (« Afficher plus »).
// Les données viennent exclusivement du serveur (requêtes réelles) ; aucune
// donnée n'est inventée ici.

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArabicText } from "@/components/ui/arabic-text";
import { BodyMedium, Caption } from "@/components/ui/typography";
import { getWordOccurrencesPageAction } from "@/lib/learning/actions";
import type { WordOccurrenceWithContext } from "@/lib/learning/queries";

export type WordOccurrencesProps = {
  wordId: string;
  totalOccurrences: number;
  initial: WordOccurrenceWithContext[];
};

export function WordOccurrences({ wordId, totalOccurrences, initial }: WordOccurrencesProps) {
  const [occurrences, setOccurrences] = useState<WordOccurrenceWithContext[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shown = occurrences.length;
  const remaining = Math.max(0, totalOccurrences - shown);
  const hasMore = remaining > 0;

  function loadMore() {
    setError(null);
    startTransition(async () => {
      const res = await getWordOccurrencesPageAction(wordId, shown);
      if (res.ok && res.occurrences) {
        setOccurrences((prev) => {
          const seen = new Set(prev.map((o) => `${o.surahNumber}:${o.ayahNumber}:${o.position}`));
          const fresh = res.occurrences!.filter(
            (o) => !seen.has(`${o.surahNumber}:${o.ayahNumber}:${o.position}`),
          );
          return [...prev, ...fresh];
        });
      } else {
        setError(res.error ?? "Impossible de charger la suite.");
      }
    });
  }

  if (occurrences.length === 0) {
    return (
      <Caption className="text-center text-muted-foreground">
        Aucune occurrence coranique pour ce mot dans les données.
      </Caption>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Caption className="text-muted-foreground">
          {totalOccurrences} occurrence{totalOccurrences > 1 ? "s" : ""} ·{" "}
          {shown} affichée{shown > 1 ? "s" : ""}
        </Caption>
      </div>

      <ol className="flex flex-col gap-4">
        {occurrences.map((occ, i) => (
          <li
            key={`${occ.surahNumber}:${occ.ayahNumber}:${occ.position}`}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface/50 p-4"
          >
            <Caption className="text-muted-foreground">
              {occ.surahName ?? `Sourate ${occ.surahNumber}`} · {occ.surahNumber}:
              {occ.ayahNumber}
              {i === 0 && occ.position != null ? ` · occurrence n°${occ.position}` : ""}
            </Caption>
            <ArabicText className="text-h4 text-center font-normal leading-[1.9]">
              {occ.arabic}
            </ArabicText>
            {occ.french ? (
              <BodyMedium className="text-center text-muted-foreground">
                {occ.french}
              </BodyMedium>
            ) : (
              <Caption className="text-center text-muted-foreground">
                Traduction française indisponible pour ce verset.
              </Caption>
            )}
          </li>
        ))}
      </ol>

      {hasMore ? (
        <Button
          variant="outline"
          size="lg"
          className="w-full min-h-12"
          onClick={loadMore}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner className="size-4" /> Chargement…
            </span>
          ) : (
            <>Afficher plus ({remaining} restante{remaining > 1 ? "s" : ""})</>
          )}
        </Button>
      ) : null}

      {error ? <Caption className="text-center text-error">{error}</Caption> : null}
    </div>
  );
}
