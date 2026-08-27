// Hikma — Content Studio (UI2.5) : FILTRES DU PIPELINE ÉDITORIAL.
//
// Filtres rapides : Tout · Brouillons · En revue · Prêts · Programmés · Publiés.
// Chips tactiles à défilement horizontal sans overflow global.

import { cn } from "@/lib/utils";
import type { ContentItemStatus } from "@/lib/content-studio/types";

const FILTER_ITEMS: {
  status?: ContentItemStatus;
  label: string;
  dotColor?: string;
}[] = [
  { label: "Tout", dotColor: "bg-white/40" },
  { status: "DRAFT", label: "Brouillons", dotColor: "bg-white/60" },
  { status: "REVIEW", label: "En revue", dotColor: "bg-info" },
  { status: "APPROVED", label: "Prêts", dotColor: "bg-hikma-teal-400" },
  { status: "SCHEDULED", label: "Programmés", dotColor: "bg-warning" },
  { status: "PUBLISHED", label: "Publiés", dotColor: "bg-success" },
];

export function ContentFilters({
  active,
  total,
  hrefFor,
}: {
  statuses: readonly ContentItemStatus[];
  active: ContentItemStatus | undefined;
  total: number;
  hrefFor: (status: ContentItemStatus | undefined) => string;
}) {
  return (
    <div
      role="group"
      aria-label="Filtrer par statut éditorial"
      className="flex items-center gap-2 overflow-x-auto py-1"
      style={{ scrollbarWidth: "none" }}
    >
      {FILTER_ITEMS.map((item) => {
        const isActive = active === item.status;
        return (
          <a
            key={item.label}
            href={hrefFor(item.status)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60",
              isActive
                ? "border-hikma-teal-500/60 bg-hikma-teal-600/25 text-hikma-teal-300 shadow-[0_0_12px_rgba(59,160,140,0.25)]"
                : "border-white/10 bg-white/4 text-white/50 hover:border-white/20 hover:bg-white/8 hover:text-white/80",
            )}
          >
            {item.dotColor && (
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", item.dotColor, isActive && "shadow-[0_0_6px_currentColor]")}
              />
            )}
            <span>{item.label}</span>
            {item.status === undefined && (
              <span className="font-mono text-[10px] text-white/40">
                {total}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
