"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Caption, H2 } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type HeaderContext = {
  eyebrow?: string;
  title: string;
  backHref?: string;
  backLabel?: string;
};

function getHeaderContext(pathname: string): HeaderContext {
  if (pathname === "/dashboard") return { title: "Accueil" };
  if (pathname === "/learn") return { title: "Apprendre" };
  if (pathname === "/review") return { title: "Réviser" };
  if (pathname === "/profile") return { title: "Profil" };
  if (pathname.startsWith("/learn/units/")) {
    return { eyebrow: "Apprendre", title: "Unité", backHref: "/learn", backLabel: "Retour au parcours" };
  }
  if (pathname.startsWith("/learn/")) {
    return { eyebrow: "Apprendre", title: "Leçon", backHref: "/learn", backLabel: "Retour au parcours" };
  }
  if (pathname.startsWith("/mots/")) {
    return { eyebrow: "Apprendre", title: "Mot étudié", backHref: "/learn", backLabel: "Retour au parcours" };
  }
  return { title: "Hikma" };
}

export function AppHeader() {
  const pathname = usePathname();
  // La leçon possède son propre header de focus, avec sa sortie et son étape.
  // Le shell global reste inchangé pour toutes les autres routes.
  if (pathname.startsWith("/learn/") && !pathname.startsWith("/learn/units/")) {
    return null;
  }
  const context = getHeaderContext(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-background/95 px-5 py-3 backdrop-blur-sm sm:px-8 md:px-10">
      <div className="mx-auto flex min-h-11 w-full max-w-7xl items-center gap-3">
        {context.backHref ? (
          <Button
            render={<Link href={context.backHref} />}
            variant="ghost"
            size="icon"
            aria-label={context.backLabel}
            className="shrink-0 rounded-full"
          >
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
        ) : null}
        <div className="min-w-0">
          {context.eyebrow ? <Caption className="hidden text-primary-strong sm:block">{context.eyebrow}</Caption> : null}
          <H2 className={cn("truncate", context.eyebrow ? "text-lg" : "text-xl")}>{context.title}</H2>
        </div>
      </div>
    </header>
  );
}
