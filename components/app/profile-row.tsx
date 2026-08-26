import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * Row de préférence (PHASE 97) : une ligne compacte avec icône, libellé,
 * valeur actuelle à droite et chevron — le pattern settings moderne
 * (Android Material / iOS) remplaçant les champs de formulaire empilés.
 * S'utilise comme Link (navigation vers une sous-page) ou comme bouton
 * (ex. se déconnecter, soumission de formulaire).
 */
export function ProfileRow({
  icon: Icon,
  label,
  value,
  href,
  submit = false,
  destructive = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  href?: string;
  submit?: boolean;
  destructive?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-primary-strong">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn("text-sm font-medium", destructive && "text-error-text")}
        >
          {label}
        </span>
        {value ? (
          <Caption className="truncate text-text-secondary" title={value}>
            {value}
          </Caption>
        ) : null}
      </span>
      {href || submit ? (
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      ) : null}
    </>
  );

  const classes = cn(
    "group flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-focus",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={submit ? "submit" : "button"} className={classes}>
      {inner}
    </button>
  );
}
