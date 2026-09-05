"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";
import { HikmaLogo } from "@/components/ui/hikma-logo";

interface AdminHeaderProps {
  userEmail?: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  "/admin": "Vue d'ensemble",
  "/admin/users": "Gestion des utilisateurs",
  "/admin/learning": "Métriques d'apprentissage",
  "/admin/curriculum": "Santé du curriculum",
  "/admin/quality": "Contrôle qualité & audit",
  "/admin/content-studio": "Content Studio — Bibliothèque",
  "/admin/content-studio/calendar": "Content Studio — Calendrier",
  "/admin/content-studio/queue": "Content Studio — File de production",
};

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname();

  // Trouver le titre de section correspondant
  let currentTitle = "Admin Control Center";
  for (const [route, label] of Object.entries(SECTION_LABELS)) {
    if (pathname === route || (route !== "/admin" && pathname.startsWith(route))) {
      currentTitle = label;
      break;
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Mobile brand & desktop breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 md:hidden">
          <HikmaLogo size="sm" className="size-6" />
          <span className="text-xs font-bold text-foreground">Hikma Admin</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Admin</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-foreground">{currentTitle}</span>
        </div>
      </div>

      {/* Right actions: User Email & App Link */}
      <div className="flex items-center gap-3">
        {userEmail ? (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-subtle px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 text-primary" aria-hidden="true" />
            <span className="max-w-[200px] truncate font-medium">{userEmail}</span>
          </div>
        ) : null}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-subtle px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-interactive hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>App</span>
          <ExternalLinkIcon className="size-3 text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
