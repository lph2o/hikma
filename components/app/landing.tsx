// Landing Hikma — Phase 7C, premium conversion.
// Composant serveur : toutes les scènes marketing restent déterministes entre SSR et hydratation.

import Link from "next/link";
import { ArrowRightIcon, Layers3Icon } from "lucide-react";
import { LandingProductPreview } from "@/components/app/landing-product-preview";
import { LandingProductStory } from "@/components/app/landing-product-story";
import { Button } from "@/components/ui/button";
import { BodyLarge, BodySmall, Caption, H1, H2, Label } from "@/components/ui/typography";
import { Mascot } from "@/components/ui/mascot";
import { HikmaLogo } from "@/components/ui/hikma-logo";

export function LandingPage() {
  return (
    <main className="landing-shell mx-auto flex w-full max-w-7xl flex-col gap-24 px-5 py-7 sm:gap-32 sm:px-8 sm:py-10 lg:gap-36 lg:py-14">
      <header className="flex items-center justify-between gap-4" aria-label="Navigation principale">
        <Link href="/" aria-label="Hikma — accueil" className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <HikmaLogo size="sm" priority />
        </Link>
        <Button render={<Link href="/login" />} variant="outline" size="sm">Se connecter</Button>
      </header>

      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-16" aria-labelledby="landing-title">
        <div className="order-1 flex flex-col items-start gap-6">
          <Label className="text-primary-strong">Comprendre le Coran, mot par mot</Label>
          <H1 id="landing-title" className="max-w-2xl text-h1 sm:text-display">Chaque mot compris ouvre un peu plus le verset.</H1>
          <BodyLarge className="max-w-xl text-text-secondary">
            Hikma relie le mot arabe à son sens, son contexte, sa prononciation et ton propre effort — avec un feedback qui t’explique vraiment.
          </BodyLarge>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button render={<Link href="/learn/basmala" />} size="lg" className="min-h-12 w-full sm:w-auto">Commencer avec Al-Fatiha</Button>
            <Button render={<Link href="#product-proof" />} variant="outline" size="lg" className="min-h-12 w-full sm:w-auto">Découvrir la méthode</Button>
          </div>
          <div className="flex items-center gap-3 text-text-secondary">
            <span className="flex size-8 items-center justify-center rounded-full bg-surface-featured text-primary-strong" aria-hidden="true">✓</span>
            <BodySmall>Une première leçon guidée, sans pression.</BodySmall>
          </div>
        </div>
        <div className="order-2 flex flex-col gap-5 lg:pl-4">
          <div className="flex items-end justify-between gap-4 sm:justify-start">
            <Mascot variant="welcome" size="sm" decorative />
            <Caption className="max-w-xs pb-1 text-text-secondary">Un mot, son sens, puis une vraie place pour le retrouver.</Caption>
          </div>
          <LandingProductPreview />
        </div>
      </section>

      <LandingProductStory />

      <section className="flex flex-col items-center gap-5 rounded-4xl border border-primary/20 bg-surface-featured px-6 py-12 text-center sm:px-10" aria-labelledby="final-cta-title">
        <Label className="text-primary-strong">Ta prochaine étape peut être simple</Label>
        <H2 id="final-cta-title">Commencer à comprendre.</H2>
        <BodyLarge className="max-w-xl text-text-secondary">Commence avec Al-Fatiha, puis avance mot par mot dans une leçon qui respecte ton rythme.</BodyLarge>
        <Button render={<Link href="/learn/basmala" />} size="lg" className="min-h-12">Commencer avec Al-Fatiha <ArrowRightIcon aria-hidden="true" /></Button>
        <Caption className="text-text-secondary">Tu as déjà un compte ? <Link href="/login" className="font-medium text-primary-strong hover:underline">Se connecter</Link></Caption>
      </section>

      <footer className="flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Layers3Icon className="size-4 text-primary-strong" aria-hidden="true" /><span className="font-heading font-semibold">Hikma</span></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary"><Link href="/learn/basmala" className="hover:text-text-primary">Première leçon</Link><Link href="/login" className="hover:text-text-primary">Se connecter</Link><span>Apprendre avec patience.</span></div>
      </footer>
    </main>
  );
}
