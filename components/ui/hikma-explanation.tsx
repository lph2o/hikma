"use client";

import { ChevronDownIcon, InfoIcon } from "lucide-react";
import { Fragment, useId, useState } from "react";
import { ArabicText } from "@/components/ui/arabic-text";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Button } from "@/components/ui/button";
import { BodyMedium, BodySmall, Caption, H4 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { LinguisticExplanation } from "@/lib/linguistic/explanation";

export type ExplanationAvailability = "verified" | "partial" | "unavailable";

export type HikmaExplanationData = {
  availability: ExplanationAvailability;
  kind: "meaning" | "phonetic" | "context" | "lemma" | "audio";
  /** Données lexicales réellement résolues, affichées seulement après l'effort. */
  meaning?: string | null;
  /**
   * Explication pédagogique de SENS (Phase 44B) : formulation courte validée,
   * distincte de la glose. Afficheée entre la glose et la décomposition MASAQ.
   * null/absent = aucune explication disponible (jamais de bloc vide).
   */
  senseExplanation?: string | null;
  lemmaMeaning?: string | null;
  lemmaRelation?: string | null;
  context?: {
    surahNumber: number;
    ayahNumber: number;
    arabic: string;
    french: string | null;
  } | null;
  audioUrl?: string | null;
  shortText?: string;
  detailText?: string;
  arabic?: string | null;
  transliteration?: string | null;
  phoneticHints?: string[];
  /** Couche linguistique MASAQ normalisée (pédagogique, jamais les tags bruts). */
  linguistic?: LinguisticExplanation | null;
};

const AVAILABILITY_LABELS: Record<ExplanationAvailability, string> = {
  verified: "Explication vérifiée",
  partial: "Repère pédagogique",
  unavailable: "Explication indisponible",
};

export function HikmaExplanation({
  data,
  defaultOpen = false,
  className,
  showAudio = true,
}: {
  data: HikmaExplanationData;
  defaultOpen?: boolean;
  className?: string;
  /** false quand l'audio est déjà affiché par le feedback court (pas de doublon). */
  showAudio?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const unavailable = data.availability === "unavailable";

  return (
    <div className={cn("flex flex-col gap-3", className)} data-slot="hikma-explanation">
      <Button
        type="button"
        variant="ghost"
        className="min-h-11 w-full justify-between rounded-xl px-3 text-left text-info-text hover:bg-info/8"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <InfoIcon className="size-4 shrink-0 text-info" aria-hidden="true" />
          <span>Comprendre ce mot</span>
        </span>
        <ChevronDownIcon
          className={cn("size-4 shrink-0 transition-transform duration-150 ease-[var(--ease-hikma)] motion-reduce:transition-none", open && "rotate-180")}
          aria-hidden="true"
        />
      </Button>

      {open ? (
        <div
          id={contentId}
          className="flex flex-col gap-4 rounded-2xl border border-info/20 bg-info/4 p-4 motion-safe:animate-feedback-in motion-reduce:animate-none sm:p-5"
          role="region"
          aria-label="Explication pédagogique"
        >
          <div className="flex items-center justify-between gap-3">
            <H4>Pourquoi ?</H4>
            <Caption className="text-info-text">{AVAILABILITY_LABELS[data.availability]}</Caption>
          </div>

          {data.arabic ? (
            <div className="flex flex-col items-center gap-1 rounded-xl bg-surface-subtle p-4 text-center">
              <ArabicText as="div" scale="small">{data.arabic}</ArabicText>
              {data.transliteration ? (
                <BodySmall className="text-text-secondary">{data.transliteration}</BodySmall>
              ) : null}
            </div>
          ) : null}

          {unavailable ? (
            <BodyMedium className="text-text-secondary">
              Cette explication détaillée n’est pas encore disponible pour ce mot.
            </BodyMedium>
          ) : (
            <>
              {data.meaning ? (
                <div className="flex flex-col gap-1">
                  <Caption className="text-info-text">Sens</Caption>
                  <BodyMedium>{data.meaning}</BodyMedium>
                </div>
              ) : null}
              {data.senseExplanation ? (
                <div className="flex flex-col gap-1">
                  <Caption className="text-info-text">Pourquoi ce sens&nbsp;?</Caption>
                  <BodyMedium>{data.senseExplanation}</BodyMedium>
                </div>
              ) : null}
              {data.linguistic?.blocks.length ? (
                <div className="flex flex-col gap-3">
                  {data.linguistic.blocks.map((block, index) => {
                    if (block.type === "decomposition") {
                      return (
                        <div
                          key={`${block.type}-${index}`}
                          className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-subtle p-3"
                        >
                          <Caption className="text-info-text">Décomposition</Caption>
                          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
                            {block.segments.map((seg, i) => (
                              <Fragment key={`${seg.text}-${i}`}>
                                {i > 0 ? <span className="text-text-secondary">+</span> : null}
                                <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface px-2 py-1">
                                  <ArabicText as="span" scale="inline">{seg.text}</ArabicText>
                                  <Caption className="text-text-secondary">{seg.label}</Caption>
                                </div>
                              </Fragment>
                            ))}
                          </div>
                          {block.note ? <BodySmall className="text-text-secondary">{block.note}</BodySmall> : null}
                        </div>
                      );
                    }
                    if (block.type === "identity") {
                      return (
                        <div key={`${block.type}-${index}`} className="flex flex-col gap-1">
                          <Caption className="text-info-text">Identification</Caption>
                          <BodyMedium>C’est {block.category}.</BodyMedium>
                        </div>
                      );
                    }
                    if (block.type === "morphology") {
                      return (
                        <div key={`${block.type}-${index}`} className="flex flex-col gap-1">
                          <Caption className="text-info-text">Forme</Caption>
                          <BodyMedium>Ici, le mot est {block.caseText}.</BodyMedium>
                        </div>
                      );
                    }
                    return (
                      <div key={`${block.type}-${index}`} className="flex flex-col gap-1">
                        <Caption className="text-info-text">Fonction</Caption>
                        <BodyMedium>Dans ce verset, ce mot joue le rôle de {block.roleText}.</BodyMedium>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {data.lemmaMeaning ? (
                <div className="flex flex-col gap-1 rounded-xl border border-info/15 bg-surface-subtle p-3">
                  <Caption className="text-info-text">Repère de la même famille</Caption>
                  <BodySmall>{data.lemmaMeaning}</BodySmall>
                </div>
              ) : null}
              {data.lemmaRelation ? <BodySmall className="text-text-secondary">{data.lemmaRelation}</BodySmall> : null}
              {data.shortText ? <BodyMedium>{data.shortText}</BodyMedium> : null}
              {data.detailText ? <BodySmall className="text-text-secondary">{data.detailText}</BodySmall> : null}
              {data.context?.arabic || data.context?.french ? (
                <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-subtle p-3">
                  <Caption className="text-info-text">
                    Contexte · sourate {data.context.surahNumber}, verset {data.context.ayahNumber}
                  </Caption>
                  {data.context.arabic ? <ArabicText as="div" scale="small" className="text-center">{data.context.arabic}</ArabicText> : null}
                  {data.context.french ? <BodySmall className="text-text-secondary">{data.context.french}</BodySmall> : null}
                </div>
              ) : null}
              {data.phoneticHints?.length ? (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-text-secondary">
                  {data.phoneticHints.map((hint) => <li key={hint}><BodySmall>{hint}</BodySmall></li>)}
                </ul>
              ) : null}
              {showAudio && data.audioUrl ? <AudioPlayer src={data.audioUrl} label="Écouter le mot" className="self-start" /> : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
