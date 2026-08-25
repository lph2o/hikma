import type { ReactNode } from "react";
import Link from "next/link";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { H1, BodySmall } from "@/components/ui/typography";

/**
 * Coquille des pages légales publiques (Phase 89F — R-006).
 * Pages statiques serveur, indexables, sans navigation applicative.
 */
export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex w-fit items-center gap-2"
        aria-label="Retour à l'accueil Hikma"
      >
        <HikmaLogo size="sm" className="size-9" />
      </Link>
      <header className="mb-10 flex flex-col gap-2">
        <H1>{title}</H1>
        <BodySmall className="text-text-secondary">
          Dernière mise à jour : {updatedAt}
        </BodySmall>
      </header>
      <div className="flex flex-col gap-8">{children}</div>
      <footer className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtle pt-6 text-sm text-text-secondary">
        <Link href="/" className="hover:text-text-primary">
          Accueil
        </Link>
        <Link href="/privacy" className="hover:text-text-primary">
          Confidentialité
        </Link>
        <Link href="/terms" className="hover:text-text-primary">
          Conditions
        </Link>
        <Link href="/sources" className="hover:text-text-primary">
          Sources
        </Link>
        <span>Apprendre avec patience.</span>
      </footer>
    </main>
  );
}
