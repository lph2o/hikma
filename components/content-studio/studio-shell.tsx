// Hikma — Content Studio (UI2.5) : SHELL DU STUDIO DE CRÉATION.
//
// Identité studio moderne : atmosphère sombre cinématique (#090e0c),
// navigation à 3 piliers :
//   - CRÉER (Bibliothèque & Projets)
//   - PLANIFIER (Calendrier éditorial)
//   - PUBLIER (File de production)
//
// Desktop : en-tête studio sticky avec logo, wordmark et onglets premium ;
// Mobile : header compact tactile, onglets scrollables sans aucun overflow de page.

import Link from "next/link";
import {
  CalendarDaysIcon,
  FilmIcon,
  FolderKanbanIcon,
  SendIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StudioTab = "library" | "calendar" | "queue";

const TABS: readonly {
  key: StudioTab;
  href: string;
  label: string;
  category: string;
  icon: typeof FolderKanbanIcon;
}[] = [
  {
    key: "library",
    href: "/admin/content-studio",
    label: "Bibliothèque",
    category: "Créer",
    icon: FolderKanbanIcon,
  },
  {
    key: "calendar",
    href: "/admin/content-studio/calendar",
    label: "Calendrier",
    category: "Planifier",
    icon: CalendarDaysIcon,
  },
  {
    key: "queue",
    href: "/admin/content-studio/queue",
    label: "Production",
    category: "Publier",
    icon: SendIcon,
  },
] as const;

function StudioNavLink({
  tab,
  active,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60",
        active
          ? "bg-hikma-teal-600/20 text-hikma-teal-300 shadow-[inset_0_0_0_1px_rgba(59,160,140,0.35)]"
          : "text-white/45 hover:bg-white/6 hover:text-white/80",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-4 shrink-0 transition-colors", active ? "text-hikma-teal-400" : "text-white/40 group-hover:text-white/70")} />
      <span>{tab.label}</span>
      {active && (
        <span
          aria-hidden="true"
          className="absolute -bottom-2.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-hikma-teal-400 shadow-[0_0_8px_rgba(59,160,140,0.8)]"
        />
      )}
    </Link>
  );
}

export function StudioShell({
  active,
  sticky = true,
  children,
  className,
}: {
  active: StudioTab;
  sticky?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-studio="dark"
      className="flex min-h-dvh w-full flex-col text-white"
      style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201, 168, 76, 0.04), transparent 70%), linear-gradient(180deg, #090e0c 0%, #070b09 100%)",
      }}
    >
      {/* Studio header */}
      <header
        className={cn(
          "z-30 border-b border-white/8",
          sticky && "sticky top-0",
        )}
        style={{
          background: "rgba(9, 14, 12, 0.90)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-3 px-3.5 sm:gap-4 sm:px-6">
          {/* Studio Brand */}
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
            aria-label="Retour à l'administration Hikma"
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-hikma-gold/30 bg-gradient-to-br from-hikma-gold/20 to-hikma-gold/5 shadow-[0_0_12px_rgba(201,168,76,0.15)]"
            >
              <FilmIcon className="size-4 text-hikma-gold" />
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-hikma-gold-muted/80">
                Hikma
              </span>
              <span className="text-[13px] font-bold leading-none tracking-tight text-white/90">
                Content Studio
              </span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav
            aria-label="Espaces du studio"
            className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none" }}
          >
            {TABS.map((tab) => (
              <StudioNavLink key={tab.key} tab={tab} active={active === tab.key} />
            ))}
          </nav>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className={cn("flex w-full min-w-0 flex-1 flex-col", className)}>
        {children}
      </main>
    </div>
  );
}
