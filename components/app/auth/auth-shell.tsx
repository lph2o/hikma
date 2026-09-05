import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { AuthBrandPanel } from "./auth-brand-panel";
import { cn } from "@/lib/utils";

export interface AuthShellProps {
  children: ReactNode;
  showBrandPanel?: boolean;
  className?: string;
}

export function AuthShell({
  children,
  showBrandPanel = true,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col justify-between overflow-x-clip bg-[var(--landing-atmosphere)] px-4 py-6 sm:px-6 lg:px-8">
      {/* Halos lumineux subtils */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 size-96 rounded-full bg-hikma-gold/8 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 size-96 rounded-full bg-hikma-teal-700/6 blur-3xl"
        aria-hidden="true"
      />

      {/* En-tête avec navigation de retour */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-elevated/80 px-3.5 py-1.5 text-body-sm font-medium text-muted-foreground shadow-xs backdrop-blur-sm transition-colors hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          aria-label="Retour à l'accueil Hikma"
        >
          <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Accueil</span>
        </Link>

        <Link href="/" aria-label="Hikma — Logo" className="flex items-center">
          <HikmaLogo size="sm" priority className="size-10 sm:size-12" />
        </Link>
      </header>

      {/* Conteneur principal (Split-screen desktop ou centré mobile) */}
      <main className={cn("relative z-10 mx-auto my-auto w-full max-w-6xl py-8", className)}>
        {showBrandPanel ? (
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">
            <AuthBrandPanel />
            <div className="mx-auto flex w-full max-w-md flex-col">{children}</div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-md flex-col">{children}</div>
        )}
      </main>

      {/* Pied de page discret */}
      <footer className="relative z-20 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-caption text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Confidentialité
        </Link>
        <span className="size-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
        <Link href="/terms" className="hover:text-foreground hover:underline">
          Conditions d&apos;utilisation
        </Link>
        <span className="size-1 rounded-full bg-muted-foreground/30" aria-hidden="true" />
        <span>© {new Date().getFullYear()} Hikma</span>
      </footer>
    </div>
  );
}
