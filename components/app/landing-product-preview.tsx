import { ArrowRightIcon, HeadphonesIcon, SparklesIcon } from "lucide-react";
import { ArabicText } from "@/components/ui/arabic-text";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaFeedback, HikmaProgress } from "@/components/ui/hikma";
import { BodyMedium, BodySmall, Caption } from "@/components/ui/typography";

/**
 * Aperçu éditorial statique de l'expérience Hikma, restylé en double-bezel
 * (coquille externe + cœur concentrique) avec halo doré — langage onboarding.
 * Il montre la hiérarchie réelle d'une leçon sans simuler une interaction ni
 * dupliquer le moteur d'exercices métier.
 */
export function LandingProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0" aria-label="Aperçu d'une leçon Hikma">
      {/* Halo doré derrière l'aperçu */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_50%_20%,color-mix(in_srgb,var(--hikma-gold)_14%,transparent),transparent_62%)]"
        aria-hidden="true"
      />
      <div className="absolute -right-3 top-10 hidden h-44 w-32 rounded-3xl border border-border-subtle bg-surface-subtle/80 shadow-card sm:block lg:-right-8" aria-hidden="true" />
      <div className="absolute -bottom-5 -left-4 hidden h-32 w-40 rounded-3xl border border-hikma-gold/24 bg-surface/80 shadow-card sm:block" aria-hidden="true" />
      <div className="rounded-[2rem] border border-border bg-surface-subtle/80 p-1.5 shadow-card">
        <Card className="landing-product-preview-card overflow-hidden rounded-[calc(2rem-0.375rem)] border-border bg-surface-elevated shadow-none">
          <CardContent className="gap-6 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Caption className="text-primary-strong">Leçon 01 · La Basmala</Caption>
                <BodySmall className="text-text-secondary">Un mot à la fois, avec clarté.</BodySmall>
              </div>
              <span className="rounded-full border border-border-subtle bg-background px-3 py-1.5 text-xs font-medium text-text-secondary">
                En cours
              </span>
            </div>

            <HikmaProgress value={38} label="Mot 3 sur 8" detail="Progression douce" />

            <div className="flex flex-col items-center gap-4 rounded-3xl border border-border-subtle bg-surface-featured px-4 py-6 pt-9 text-center sm:px-6 sm:py-8 sm:pt-10">
              <Caption className="text-primary-strong">VOIR · le mot</Caption>
              <ArabicText as="div" scale="hero">
                ٱلرَّحْمَـٰنِ
              </ArabicText>
              <Caption className="text-text-secondary">ar-raḥmāni</Caption>
              <BodyMedium className="font-medium text-text-primary">Le Tout Miséricordieux</BodyMedium>
              <div className="mt-2 flex items-center gap-2 rounded-full border border-border-subtle bg-background px-3 py-2 text-sm text-text-secondary">
                <HeadphonesIcon className="size-4 text-primary-strong" aria-hidden="true" />
                Audio du mot · dans la leçon
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-primary-strong" aria-hidden="true" />
                  <Caption className="text-primary-strong">PRODUIRE · retrouver</Caption>
                </div>
                <Caption>Choisis le sens</Caption>
              </div>
              <div className="grid gap-2 sm:grid-cols-2" aria-label="Exemple d'options de réponse">
                <div className="flex min-h-12 items-center justify-center rounded-xl border border-success/40 bg-success/8 px-3 py-3 text-center text-sm font-medium text-success-text">
                  Le Tout Miséricordieux
                </div>
                <div className="flex min-h-12 items-center justify-center rounded-xl border border-border-subtle bg-background px-3 py-3 text-center text-sm text-text-secondary">
                  Le Souverain
                </div>
              </div>
              <HikmaFeedback status="correct" className="sm:p-4">
                Le sens est retrouvé. L’explication vient ensuite pour comprendre le mot dans son contexte.
              </HikmaFeedback>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
              <Caption className="text-text-secondary">Un rappel qui respecte ton effort.</Caption>
              <span className="flex items-center gap-1 text-sm font-medium text-primary-strong">
                Continuer <ArrowRightIcon className="size-4" aria-hidden="true" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
