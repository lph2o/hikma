import { LockIcon } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { BodyMedium, Caption } from "@/components/ui/typography";

// État verrouillé Hikma (brique Design System — Phase 24C).
// Explique ce qui est verrouillé, pourquoi et comment déverrouiller — jamais
// un simple cadenas silencieux (résout U5).

export type LockedStateProps = {
  /** Ce qui est verrouillé (ex. « Leçon suivante »). */
  title: string;
  /** Pourquoi c'est verrouillé. */
  reason?: string;
  /** Comment déverrouiller. */
  hint?: string;
  className?: string;
};

export function LockedState({
  title,
  reason,
  hint,
  className,
}: LockedStateProps): ReactElement {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3",
        className,
      )}
      data-slot="locked-state"
    >
      <LockIcon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1">
        <BodyMedium className="font-medium text-muted-foreground">
          {title}
        </BodyMedium>
        {reason ? <Caption>{reason}</Caption> : null}
        {hint ? (
          <Caption className="font-medium text-primary-strong">{hint}</Caption>
        ) : null}
      </div>
    </div>
  );
}
