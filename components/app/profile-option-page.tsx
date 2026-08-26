import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BodyMedium, H1 } from "@/components/ui/typography";

/**
 * Coquille des sous-pages de préférence (PHASE 97) : retour vers /profile,
 * titre court et description brève — progressive disclosure, aucun long
 * paragraphe explicatif sur la vue principale.
 */
export function ProfileOptionPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <Link
        href="/profile"
        className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary-strong focus-visible:ring-2 focus-visible:ring-focus"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Profil
      </Link>

      <header className="flex flex-col gap-1.5">
        <H1>{title}</H1>
        {description ? (
          <BodyMedium className="max-w-xl text-text-secondary">{description}</BodyMedium>
        ) : null}
      </header>

      <Card className="border-border-subtle bg-surface-elevated">
        <CardContent className="flex flex-col gap-4 p-6">{children}</CardContent>
      </Card>
    </main>
  );
}
