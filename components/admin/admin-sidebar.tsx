"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  ShieldAlertIcon,
  FolderKanbanIcon,
  CalendarDaysIcon,
  SendIcon,
  ArrowLeftIcon,
} from "lucide-react";

import { HikmaLogo } from "@/components/ui/hikma-logo";
import { Caption } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  exact?: boolean;
}

const CONTROL_CENTER_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Vue d'ensemble",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: UsersIcon,
  },
  {
    href: "/admin/learning",
    label: "Apprentissage",
    icon: GraduationCapIcon,
  },
  {
    href: "/admin/curriculum",
    label: "Curriculum",
    icon: BookOpenIcon,
  },
  {
    href: "/admin/quality",
    label: "Qualité & Audit",
    icon: ShieldAlertIcon,
  },
];

const STUDIO_NAV: NavItem[] = [
  {
    href: "/admin/content-studio",
    label: "Bibliothèque",
    icon: FolderKanbanIcon,
    exact: true,
  },
  {
    href: "/admin/content-studio/calendar",
    label: "Calendrier",
    icon: CalendarDaysIcon,
  },
  {
    href: "/admin/content-studio/queue",
    label: "File de production",
    icon: SendIcon,
  },
];

function AdminNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium outline-none transition-all duration-150",
        active
          ? "bg-primary/10 text-primary-strong font-semibold shadow-[inset_0_0_0_1px_rgba(59,160,140,0.25)]"
          : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden="true"
      />
      <span>{item.label}</span>
      {active && (
        <span
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar md:flex"
      aria-label="Navigation administration"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-4">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          aria-label="Hikma Admin"
        >
          <HikmaLogo size="sm" className="size-8" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Hikma Admin
              <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                PROD
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav
        className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5"
        aria-label="Sections du centre de contrôle"
      >
        {/* Pilotage */}
        <div className="flex flex-col gap-1">
          <Caption className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/80">
            Pilotage
          </Caption>
          {CONTROL_CENTER_NAV.map((item) => (
            <AdminNavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Content Studio */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 pb-1">
            <Caption className="text-[10px] font-bold uppercase tracking-[0.14em] text-hikma-gold">
              Content Studio
            </Caption>
            <span className="text-[9px] font-semibold text-hikma-gold-muted/80">
              V2.5
            </span>
          </div>
          {STUDIO_NAV.map((item) => (
            <AdminNavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer / Retour App */}
      <div className="border-t border-border-subtle p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeftIcon className="size-4 shrink-0" aria-hidden="true" />
          <span>Retour à l&apos;application</span>
        </Link>
      </div>
    </aside>
  );
}
