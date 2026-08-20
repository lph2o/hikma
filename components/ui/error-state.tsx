"use client";

// État d'erreur Hikma (brique Design System — Phase 24C).
// N'expose JAMAIS d'information technique (stack trace, Supabase, base de
// données, API, exception). Actions de récupération : Réessayer + Retour.

import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mascot } from "@/components/ui/mascot";
import { BodyMedium, H2 } from "@/components/ui/typography";

export type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  backHref?: string | null;
  backLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Quelque chose s'est mal passé",
  message = "Réessaie dans un instant.",
  onRetry,
  retryLabel = "Réessayer",
  backHref = "/dashboard",
  backLabel = "Retour à l'accueil",
  className,
}: ErrorStateProps): ReactElement {
  return (
    <Card className={cn("items-center gap-4 p-8 text-center", className)}>
      <Mascot variant="welcome" size="lg" message="Oups…" />
      <div className="flex flex-col gap-1">
        <H2>{title}</H2>
        <BodyMedium className="text-muted-foreground">{message}</BodyMedium>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {onRetry ? (
          <Button onClick={onRetry} size="lg" className="min-h-12">
            {retryLabel}
          </Button>
        ) : null}
        {backHref ? (
          <Button
            render={<Link href={backHref} />}
            variant="outline"
            size="lg"
            className="min-h-12"
          >
            {backLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
