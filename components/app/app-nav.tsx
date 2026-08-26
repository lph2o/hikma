"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HikmaLogo } from "@/components/ui/hikma-logo";
import { Caption } from "@/components/ui/typography";
import { cn, isPathActive } from "@/lib/utils";
import { APP_HOME_HREF, NAV_ITEMS } from "@/lib/navigation";

function NavLink({ href, label, icon: Icon, mobile = false }: { href: string; label: string; icon: typeof NAV_ITEMS[number]["icon"]; mobile?: boolean }) {
  const pathname = usePathname();
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl font-medium outline-none transition-[background-color,color,transform] duration-150 ease-[var(--ease-hikma)] focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        // Mobile (PHASE 96) : item de la barre flottante — zone tactile ≥ 44px,
        // état actif en pilule teal légère, feedback de tap immédiat.
        mobile
          ? "min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-xs active:scale-[0.97]"
          : "px-3 py-2.5 text-sm",
        active
          ? mobile
            ? "bg-primary/10 text-primary-strong"
            : "bg-surface-interactive text-primary-strong"
          : mobile
            ? "text-sidebar-foreground/60 hover:bg-surface-subtle hover:text-sidebar-foreground"
            : "text-sidebar-foreground/76 hover:bg-surface-subtle hover:text-sidebar-foreground",
      )}
    >
      <Icon className={cn("shrink-0", mobile ? "size-5" : "size-5")} aria-hidden="true" />
      <span>{label}</span>
      {!mobile && active ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" /> : null}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const isLessonFocus = pathname.startsWith("/learn/") && !pathname.startsWith("/learn/units/");

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-sidebar md:flex"
        aria-label="Navigation principale"
      >
        <Link
          href={APP_HOME_HREF}
          aria-label="Hikma — accueil"
          className="mx-3 mt-4 flex items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-colors hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-focus"
        >
          <HikmaLogo size="md" className="size-[88px] lg:size-[104px]" />
        </Link>

        <nav className="flex flex-1 flex-col gap-6 px-3 pt-8" aria-label="Sections de l’application">
          <div className="flex flex-col gap-1">
            <Caption className="px-3 pb-2 text-label font-medium uppercase tracking-[0.12em] text-text-secondary">Apprendre</Caption>
            {NAV_ITEMS.filter((item) => item.group === "principal").map((item) => <NavLink key={item.href} {...item} />)}
          </div>
          <div className="flex flex-col gap-1">
            <Caption className="px-3 pb-2 text-label font-medium uppercase tracking-[0.12em] text-text-secondary">Ton espace</Caption>
            {NAV_ITEMS.filter((item) => item.group === "compte").map((item) => <NavLink key={item.href} {...item} />)}
          </div>
        </nav>

        <div className="border-t border-border-subtle px-6 py-5">
          <Caption>Un moment à la fois.</Caption>
        </div>
      </aside>

      {/* Bottom nav mobile (PHASE 96) — barre flottante pilule : surface cream
       * translucide + hairline + shadow-elevated (L3/L4 du système 94), coins
       * arrondis, marges horizontales et safe-area inférieure. Les 5 onglets et
       * leurs libellés sont conservés. Masquée en mode leçon (header de focus). */}
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden",
          isLessonFocus && "hidden",
        )}
        aria-label="Navigation principale"
        aria-hidden={isLessonFocus}
      >
        <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[1.75rem] border border-border-subtle bg-popover/95 p-1.5 shadow-elevated backdrop-blur-md">
          {NAV_ITEMS.map((item) => <NavLink key={item.href} {...item} mobile />)}
        </div>
      </nav>
    </>
  );
}
