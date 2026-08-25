import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArabicText } from "@/components/ui/arabic-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyLarge, BodyMedium, Caption, H2 } from "@/components/ui/typography";
import type { LessonAyahContext } from "@/lib/learning/queries";
import { VerseAudioButton } from "@/components/ui/verse-audio";

export function HikmaLessonFocusHeader({
  title,
  eyebrow = "Apprendre",
  stepLabel,
  exit,
}: {
  title: string;
  eyebrow?: string;
  stepLabel?: string;
  exit?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border-subtle pb-4">
      {exit}
      <div className="min-w-0 flex-1">
        <Caption className="text-primary-strong">{eyebrow}</Caption>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <H2 className="truncate text-xl">{title}</H2>
          {stepLabel ? <Caption className="shrink-0">{stepLabel}</Caption> : null}
        </div>
      </div>
    </header>
  );
}

export function HikmaContextDisclosure({
  contexts,
}: {
  contexts: LessonAyahContext[];
}) {
  if (contexts.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-border-subtle bg-surface-subtle">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium outline-none transition-colors hover:bg-surface-interactive focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-0.5">
          <Caption className="text-primary-strong">À consulter si tu en as besoin</Caption>
          <span>Contexte coranique</span>
        </span>
        <ChevronDownIcon className="size-5 shrink-0 text-text-secondary transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-5 border-t border-border-subtle p-4 sm:p-6">
        {contexts.map((ayah) => (
          <article key={`${ayah.surahNumber}:${ayah.ayahNumber}`} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <Caption className="text-primary-strong">Verset étudié</Caption>
              <Caption className="text-text-secondary">
                {ayah.surahName ?? `Sourate ${ayah.surahNumber}`} · {ayah.surahNumber}:{ayah.ayahNumber}
              </Caption>
            </div>
            <Card className="border-border-subtle bg-surface-elevated shadow-none">
              <CardContent className="items-center gap-4 p-5 text-center sm:p-6">
                <ArabicText as="div" scale="verse" className="font-normal">
                  {ayah.arabic}
                </ArabicText>
              </CardContent>
            </Card>
            <VerseAudioButton
              globalAyahNumber={ayah.globalAyahNumber}
              className="self-start"
            />
            <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background p-5 sm:p-6">
              <Caption>Traduction française</Caption>
              {ayah.french ? (
                <BodyLarge>« {ayah.french} »</BodyLarge>
              ) : (
                <BodyMedium className="text-text-secondary">
                  Traduction française indisponible pour ce verset.
                </BodyMedium>
              )}
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}

export function LessonExitButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" aria-label="Quitter la leçon" onClick={onClick} className="shrink-0 rounded-full">
      <ArrowLeftIcon aria-hidden="true" />
    </Button>
  );
}

export function LessonFocusBackLink() {
  return (
    <Button render={<Link href="/learn" />} variant="ghost" size="icon" aria-label="Retour au parcours" className="shrink-0 rounded-full">
      <ArrowLeftIcon aria-hidden="true" />
    </Button>
  );
}
