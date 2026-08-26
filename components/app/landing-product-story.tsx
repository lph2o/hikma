import Link from "next/link";
import { ArrowRightIcon, CheckIcon, CircleIcon, HeadphonesIcon, LockKeyholeIcon, PlayIcon } from "lucide-react";
import { ArabicText } from "@/components/ui/arabic-text";
import { AnswerOption, ExerciseFeedback } from "@/components/ui/exercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HikmaProgress } from "@/components/ui/hikma";
import { HikmaExerciseShell } from "@/components/learn/exercises/hikma-exercise-shell";
import { Reveal } from "@/components/app/landing-reveal";
import { BodyLarge, BodyMedium, BodySmall, Caption, H2, H3 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const WORD = "ٱلرَّحْمَـٰنِ";

/** Eyebrow onboarding : pastille dorée + caption majuscules espacées. */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-hikma-gold" aria-hidden="true" />
      <Caption className="font-semibold uppercase tracking-[0.16em] text-hikma-gold-muted">{children}</Caption>
    </span>
  );
}

/** Coquille double-bezel : enveloppe externe + cœur concentrique. */
function BezelCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[2rem] border border-border bg-surface-subtle/80 p-1.5", className)}>
      <div className="rounded-[calc(2rem-0.375rem)] border border-border bg-surface-elevated shadow-card">
        {children}
      </div>
    </div>
  );
}

function LandingAct({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 flex flex-col gap-8" aria-labelledby={`${id}-title`}>
      <Reveal>
        <div className="flex max-w-2xl flex-col gap-3">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <H2 id={`${id}-title`}>{title}</H2>
        </div>
      </Reveal>
      <Reveal delay={100}>{children}</Reveal>
    </section>
  );
}

function WordLockup({ scale = "hero" as const }: { scale?: "hero" | "word" }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 pt-4 text-center">
      <ArabicText as="div" scale={scale}>{WORD}</ArabicText>
      <BodySmall className="text-text-secondary">ar-Raḥmān</BodySmall>
      <BodyLarge className="font-medium">Le Tout Miséricordieux</BodyLarge>
    </div>
  );
}

function ContextPreview() {
  return (
    <BezelCard>
      <Card className="rounded-[calc(2rem-0.375rem)] border-border bg-surface-elevated shadow-none">
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Caption className="text-primary-strong">COMPRENDRE · le contexte</Caption>
            <Caption className="text-text-secondary">Al-Fatiha · 1:1</Caption>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-border-subtle bg-surface-featured p-6 text-center sm:p-8">
            <Caption>Texte coranique</Caption>
            <ArabicText as="div" scale="verse" className="max-w-full">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </ArabicText>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-background p-5">
            <Caption>Traduction</Caption>
            <BodyLarge>« Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. »</BodyLarge>
          </div>
          <Caption className="text-text-secondary">
            Le texte, le sens et la référence restent séparés pour être lus sans ambiguïté.
          </Caption>
        </CardContent>
      </Card>
    </BezelCard>
  );
}

function AudioPreview() {
  return (
    <div className="flex flex-col gap-5 rounded-4xl border border-border bg-surface-featured p-6 shadow-card sm:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-primary-strong">
          <HeadphonesIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <Caption className="text-primary-strong">ÉCOUTER · le modèle</Caption>
          <H3>Une écoute quand elle aide</H3>
        </div>
      </div>
      <div className="flex min-w-0 flex-col items-center gap-3 rounded-3xl border border-border bg-surface-elevated p-6 text-center">
        <WordLockup scale="word" />
        <Button
          render={<Link href="/learn/basmala" />}
          variant="outline"
          className="mt-1 min-h-12 w-full rounded-full border-hikma-gold/60 text-text-primary hover:border-hikma-gold hover:bg-hikma-gold/8 sm:w-auto"
        >
          Écouter dans la leçon <ArrowRightIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-2 text-center sm:grid-cols-3">
        {["Écoute", "Répète", "Compare"].map((step, index) => (
          <div key={step} className="flex items-center justify-center gap-2 rounded-xl border border-border p-3">
            <span className="flex size-6 items-center justify-center rounded-full border border-hikma-gold/45 bg-hikma-gold/10 text-sm font-semibold text-primary-strong">
              {index + 1}
            </span>
            <BodySmall>{step}</BodySmall>
          </div>
        ))}
      </div>
      <Caption className="text-text-secondary">
        La lecture audio est disponible dans la leçon réelle ; cette page ne simule pas un fichier audio public.
      </Caption>
    </div>
  );
}

function ExercisePreview() {
  return (
    <HikmaExerciseShell
      step={3}
      total={8}
      skill="Retrouver le sens"
      status="selected"
      primaryAction={
        <Button variant="outline" disabled className="min-h-12 w-full rounded-full border-hikma-gold/60 text-text-primary sm:w-auto">
          Aperçu de la leçon
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <Caption className="text-center text-primary-strong">SE RAPPELER → PRODUIRE</Caption>
        <BodyLarge className="text-center">Quel est le sens de ce mot ?</BodyLarge>
        <div className="flex min-w-0 justify-center rounded-3xl border border-border bg-surface-featured p-6 text-center">
          <ArabicText as="div" scale="word">{WORD}</ArabicText>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Options de démonstration">
          <AnswerOption variant="selected" checked disabled>Le Tout Miséricordieux</AnswerOption>
          <AnswerOption disabled>Le Souverain</AnswerOption>
        </div>
        <Caption className="text-text-secondary">
          Une scène de rappel : la réponse se cherche avant de recevoir un retour.
        </Caption>
      </div>
    </HikmaExerciseShell>
  );
}

function ErrorPreview() {
  return (
    <BezelCard>
      <Card className="rounded-[calc(2rem-0.375rem)] border-border bg-surface-elevated shadow-none">
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <Caption className="text-primary-strong">APRÈS LA RÉPONSE · recevoir du feedback</Caption>
            <H3>L’erreur devient un repère</H3>
            <BodyMedium className="text-text-secondary">
              Hikma ne s’arrête pas à « faux ». Le retour sépare ce que tu as proposé de ce qui était attendu, puis
              laisse l’explication venir au bon moment.
            </BodyMedium>
          </div>
          <ExerciseFeedback
            status="incorrect"
            userAnswer="ils adorent"
            correctContent="nous adorons"
            explanationData={{ availability: "unavailable", kind: "meaning", arabic: "نَعْبُدُ", transliteration: "naʿbudu" }}
          />
          <div className="flex flex-col items-center gap-3 border-t border-border-subtle pt-5 text-center">
            <BodySmall className="max-w-lg text-text-secondary">
              Tu viens de voir comment une réponse devient une occasion de comprendre.
            </BodySmall>
            <Button
              render={<Link href="/learn/basmala" />}
              variant="outline"
              className="min-h-12 w-full rounded-full border-hikma-gold/60 text-text-primary hover:border-hikma-gold hover:bg-hikma-gold/8 sm:w-auto"
            >
              Commencer à comprendre <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </BezelCard>
  );
}

function LearningPathPreview() {
  const states = [
    [CheckIcon, "Leçon terminée", "La Basmala", "Tu peux la revoir quand tu veux.", "text-success-text", "bg-success/8"],
    [PlayIcon, "Leçon en cours", "Les mots de la louange", "Reprendre là où l’on s’est arrêté.", "text-primary-strong", "bg-surface-featured"],
    [CircleIcon, "Prochaine leçon", "Comprendre dans le verset", "Une étape à découvrir.", "text-text-secondary", "bg-surface-elevated"],
    [LockKeyholeIcon, "Leçon verrouillée", "La suite du parcours", "Elle s’ouvrira quand l’étape précédente sera prête.", "text-text-secondary", "bg-surface-subtle"],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-hikma-gold/28 bg-surface-featured p-4">
        <Caption className="font-semibold uppercase tracking-[0.12em] text-hikma-gold-muted">
          Démonstration · pas une progression personnelle
        </Caption>
        <BodyMedium className="mt-1 text-text-secondary">Ton apprentissage avance étape par étape.</BodyMedium>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {states.map(([Icon, status, title, text, iconClass, surface]) => (
          <Card key={status} className={cn("rounded-2xl border-border", surface)}>
            <CardContent className="gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle", iconClass)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <Caption className={iconClass}>{status}</Caption>
                  <H3>{title}</H3>
                  <BodySmall className="text-text-secondary">{text}</BodySmall>
                </div>
              </div>
              <HikmaProgress
                value={status === "Leçon terminée" ? 100 : status === "Leçon en cours" ? 38 : 0}
                label={status === "Leçon terminée" ? "Étape parcourue" : status === "Leçon en cours" ? "Étape actuelle" : "À venir"}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function LandingProductStory() {
  return (
    <>
      <LandingAct id="product-proof" eyebrow="Le produit en clair" title="Un mot, puis tout ce qui aide à le comprendre.">
        <div className="grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-hikma-gold/40 bg-surface-subtle/80 p-1.5">
            <div className="rounded-[calc(2rem-0.375rem)] border border-border bg-surface-elevated shadow-card">
              <Card className="rounded-[calc(2rem-0.375rem)] border-transparent bg-transparent shadow-none">
                <CardContent className="items-center gap-4 p-8 text-center sm:p-10">
                  <Caption className="text-primary-strong">VOIR · la forme</Caption>
                  <WordLockup />
                </CardContent>
              </Card>
            </div>
          </div>
          <ContextPreview />
        </div>
      </LandingAct>

      <LandingAct id="one-word" eyebrow="Un mot · une méthode" title="La compréhension avance dans le même fil.">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <AudioPreview />
          <ExercisePreview />
        </div>
        <div className="mt-6 rounded-4xl border border-border bg-surface-elevated p-6 shadow-card sm:mt-10 sm:p-8" aria-label="Les cinq étapes de la méthode Hikma">
          <div className="relative grid gap-5 sm:grid-cols-5 sm:gap-3">
            <div className="absolute left-[10%] right-[10%] top-4 hidden h-px bg-hikma-gold/35 sm:block" aria-hidden="true" />
            {["Voir le mot", "Comprendre son sens", "Se rappeler", "Produire", "Recevoir un retour"].map((stage, index) => (
              <div key={stage} className="relative flex items-center gap-3 sm:flex-col sm:items-center sm:gap-3 sm:text-center">
                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-hikma-gold/60 bg-surface-elevated text-sm font-semibold text-primary-strong shadow-[0_0_0_4px_var(--surface-elevated)]">
                  {index + 1}
                </span>
                <BodySmall className="pt-0 sm:max-w-32">{stage}</BodySmall>
              </div>
            ))}
          </div>
        </div>
      </LandingAct>

      <LandingAct id="feedback" eyebrow="Quand la réponse n’est pas la bonne" title="Une erreur ne termine pas l’apprentissage.">
        <ErrorPreview />
      </LandingAct>

      <LandingAct id="how-it-works" eyebrow="Le fonctionnement Hikma" title="Un cadre calme pour différents points de départ.">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <LearningPathPreview />
          <div className="flex flex-col justify-center gap-5 rounded-4xl border border-border bg-surface-featured p-6 shadow-card sm:p-8">
            <H3>Un apprentissage qui s’adapte à ton point de départ.</H3>
            <div className="flex flex-col gap-3 text-text-secondary">
              <BodyMedium>
                Que tu débutes, lises déjà l’arabe ou veuilles approfondir certaines sourates, chaque étape garde la
                même intention : comprendre un peu mieux, puis retrouver par toi-même.
              </BodyMedium>
              <BodyMedium>La page montre un parcours de démonstration, pas une progression personnelle.</BodyMedium>
            </div>
          </div>
        </div>
      </LandingAct>
    </>
  );
}
