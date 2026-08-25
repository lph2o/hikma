// Landing Hikma — restylée dans le langage visuel de l'onboarding (Phase 32E/71B).
// Composant serveur : toutes les scènes marketing restent déterministes entre SSR et hydratation.

import Link from "next/link";
import { ArrowRightIcon, Layers3Icon, SparklesIcon } from "lucide-react";
import { LandingProductPreview } from "@/components/app/landing-product-preview";
import { LandingProductStory } from "@/components/app/landing-product-story";
import { Reveal } from "@/components/app/landing-reveal";
import { Button } from "@/components/ui/button";
import { BodyLarge, BodySmall, Caption, H1, H2, Label } from "@/components/ui/typography";
import { Mascot } from "@/components/ui/mascot";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { cn } from "@/lib/utils";

/** Eyebrow onboarding : pastille dorée + caption majuscules espacées. */
function EyebrowPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-hikma-gold/32 bg-hikma-gold/8 px-4 py-1.5">
      <span className="size-1.5 rounded-full bg-hikma-gold" aria-hidden="true" />
      <span className="text-xs font-semibold tracking-[0.2em] text-hikma-teal-700">{children}</span>
      <span className="size-1.5 rounded-full bg-hikma-gold" aria-hidden="true" />
    </span>
  );
}

/** Flèche en cercle « bouton-dans-bouton » (kinétique au survol). */
function ArrowSeal() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/16 transition-transform duration-300 ease-[var(--ease-hikma)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-active:scale-95"
    >
      <ArrowRightIcon className="size-4" />
    </span>
  );
}

export function LandingPage({ authenticated = false }: { authenticated?: boolean }) {
  const primaryCta = authenticated
    ? { label: "Continuer mon parcours", href: "/dashboard" }
    : { label: "Commencer avec Al-Fatiha", href: "/learn/basmala" };
  const accountCta = authenticated
    ? { label: "Mon espace", href: "/dashboard" }
    : { label: "Se connecter", href: "/login" };

  return (
    <main className="landing-shell mx-auto flex w-full max-w-7xl flex-col gap-20 px-5 py-4 sm:gap-28 sm:px-8 sm:py-6 lg:gap-32">
      <header className="sticky top-4 z-40" aria-label="Navigation principale">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border border-border bg-surface-elevated/90 px-4 py-2 shadow-card backdrop-blur-md sm:px-5">
          <Link
            href="/"
            aria-label="Hikma — accueil"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <HikmaLogo size="sm" priority className="size-16" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/learn/basmala"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 ease-[var(--ease-hikma)] hover:text-text-primary sm:block"
            >
              Première leçon
            </Link>
            <Button render={<Link href={accountCta.href} />} variant="outline" size="sm" className="rounded-full">
              {accountCta.label}
            </Button>
          </div>
        </nav>
      </header>

      <section
        className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-16"
        aria-labelledby="landing-title"
      >
        <div className="order-1 flex flex-col items-start gap-6">
          <Reveal>
            <EyebrowPill>Comprendre le Coran, mot par mot</EyebrowPill>
          </Reveal>
          <Reveal delay={80}>
            <H1 id="landing-title" className="max-w-2xl text-h1 sm:text-display">
              Chaque mot compris ouvre un peu plus le verset.
            </H1>
          </Reveal>
          <Reveal delay={160}>
            <BodyLarge className="max-w-xl text-text-secondary">
              Hikma relie le mot arabe à son sens, son contexte, sa prononciation et ton propre effort — avec un
              feedback qui t’explique vraiment.
            </BodyLarge>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button render={<Link href={primaryCta.href} />} size="lg" className="group min-h-12 w-full rounded-full sm:w-auto">
                {primaryCta.label} <ArrowSeal />
              </Button>
              <Button render={<Link href="#product-proof" />} variant="outline" size="lg" className="min-h-12 w-full rounded-full sm:w-auto">
                Découvrir la méthode
              </Button>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="flex items-center gap-3 text-text-secondary">
              <span
                className="flex size-8 items-center justify-center rounded-full border border-hikma-gold/45 bg-hikma-gold/12 text-hikma-teal-700"
                aria-hidden="true"
              >
                <SparklesIcon className="size-4" />
              </span>
              <BodySmall>Une première leçon guidée, sans pression.</BodySmall>
            </div>
          </Reveal>
        </div>

        <div className="order-2 flex flex-col gap-5 lg:pl-4">
          <Reveal delay={120} className="flex items-end justify-between gap-4 sm:justify-start">
            <Mascot variant="welcome" size="sm" decorative />
            <Caption className="max-w-xs pb-1 text-text-secondary">
              Un mot, son sens, puis une vraie place pour le retrouver.
            </Caption>
          </Reveal>
          <Reveal delay={200}>
            <LandingProductPreview />
          </Reveal>
        </div>
      </section>

      {/* Fil conducteur : rail de progression doré de l'onboarding */}
      <Reveal delay={80}>
        <div className="flex flex-col gap-3" aria-label="La boucle de la méthode Hikma">
          <div className="flex items-center gap-1.5">
            {["Voir", "Comprendre", "Se rappeler", "Produire", "Retour"].map((stage, index) => (
              <span
                key={stage}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-[background-color] duration-300 ease-[var(--ease-hikma)]",
                  index === 0 ? "bg-hikma-gold" : "bg-hikma-gold/28",
                )}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Caption className="font-medium text-text-secondary">La boucle Hikma</Caption>
            <Caption className="tabular-nums text-hikma-gold-muted">
              Voir → Comprendre → Se rappeler → Produire → Retour
            </Caption>
          </div>
        </div>
      </Reveal>

      <LandingProductStory />

      <Reveal>
        <section
          className="relative isolate flex flex-col items-center gap-5 overflow-hidden rounded-4xl border border-hikma-gold/32 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--hikma-gold)_12%,transparent),transparent_55%),var(--surface-featured)] px-6 py-14 text-center sm:px-10 sm:py-20"
          aria-labelledby="final-cta-title"
        >
          <div
            className="flex size-14 items-center justify-center rounded-full border border-hikma-gold/45 bg-hikma-gold/12 text-hikma-gold-muted"
            aria-hidden="true"
          >
            <SparklesIcon className="size-7" />
          </div>
          <Label className="text-primary-strong">Ta prochaine étape peut être simple</Label>
          <H2 id="final-cta-title">Commencer à comprendre.</H2>
          <BodyLarge className="max-w-xl text-text-secondary">
            Commence avec Al-Fatiha, puis avance mot par mot dans une leçon qui respecte ton rythme.
          </BodyLarge>
          <Button render={<Link href={primaryCta.href} />} size="lg" className="group min-h-12 rounded-full">
            {primaryCta.label} <ArrowSeal />
          </Button>
          {authenticated ? (
            <Caption className="text-text-secondary">Ton parcours t’attend sur ton tableau de bord.</Caption>
          ) : (
            <Caption className="text-text-secondary">
              Tu as déjà un compte ?{" "}
              <Link href="/login" className="font-medium text-primary-strong hover:underline">
                Se connecter
              </Link>
            </Caption>
          )}
        </section>
      </Reveal>

      <footer className="flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers3Icon className="size-4 text-primary-strong" aria-hidden="true" />
          <span className="font-heading font-semibold">Hikma</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary">
          <Link href="/learn/basmala" className="hover:text-text-primary">
            Première leçon
          </Link>
          <Link href={accountCta.href} className="hover:text-text-primary">
            {accountCta.label}
          </Link>
          <span>Apprendre avec patience.</span>
        </div>
      </footer>
    </main>
  );
}
