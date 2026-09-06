"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  FolderKanbanIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom nav mobile — les 5 routes les plus fréquentes de l'admin.
// Calqué sur le pattern AppNav Phase 96 : pilule flottante fixed bottom-0,
// safe-area, backdrop-blur, pilule active teal, tap-feedback scale.
const BOTTOM_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/users", label: "Users", icon: UsersIcon, exact: false },
  { href: "/admin/learning", label: "Learning", icon: GraduationCapIcon, exact: false },
  { href: "/admin/curriculum", label: "Curriculum", icon: BookOpenIcon, exact: false },
  { href: "/admin/content-studio", label: "Studio", icon: FolderKanbanIcon, exact: false },
] as const;

function AdminBottomNavLink({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  exact: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Zone tactile ≥ 44px, flex-col centré, transitions 150ms
        "group relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium outline-none",
        "transition-[background-color,color,transform] duration-150 ease-[var(--ease-hikma)]",
        "active:scale-[0.97]",
        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-popover",
        active
          ? "bg-primary/10 text-primary-strong"
          : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="leading-none">{label}</span>
    </Link>
  );
}

/**
 * Barre de navigation mobile pour les pages /admin/*.
 * Visible uniquement en dessous de md (768px) — masquée par md:hidden.
 * Pattern identique à AppNav Phase 96 : pilule flottante, safe-area inférieure,
 * surface popover/95 + backdrop-blur-md + shadow-elevated (L3/L4).
 */
export function AdminBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
      aria-label="Navigation administration"
    >
      <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[1.75rem] border border-border-subtle bg-popover/95 p-1.5 shadow-elevated backdrop-blur-md">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <AdminBottomNavLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
