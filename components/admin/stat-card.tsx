import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "info";
  };
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  href,
  className,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-200",
        href && "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-elevated",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex size-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-subtle text-primary transition-colors group-hover:bg-primary/10">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </span>
          {badge ? (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                badge.variant === "success" &&
                  "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                badge.variant === "warning" &&
                  "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                badge.variant === "info" &&
                  "border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
                (!badge.variant || badge.variant === "default") &&
                  "border border-border-subtle bg-surface-subtle text-muted-foreground",
              )}
            >
              {badge.text}
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {href ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-2 opacity-0 focus-visible:opacity-100"
        />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
