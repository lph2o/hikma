// Navigation Hikma — source unique des routes principales.
// Utilisée par la sidebar / bottom-nav (components/app/app-nav.tsx) et testable
// indépendamment (aucune dépendance React/Next).

import type { LucideIcon } from "lucide-react";
import { BookOpenIcon, FilmIcon, HomeIcon, LibraryIcon, RefreshCcwIcon, ShieldCheckIcon, UserIcon } from "lucide-react";

/** Accueil applicatif : CTA « Continuer mon parcours » de la landing pour les connectés. */
export const APP_HOME_HREF = "/dashboard";

/** Routes de la navigation principale, dans l'ordre d'affichage. */
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon, group: "principal" },
  { href: "/learn", label: "Apprendre", icon: BookOpenIcon, group: "principal" },
  { href: "/surahs", label: "Sourates", icon: LibraryIcon, group: "principal" },
  { href: "/review", label: "Réviser", icon: RefreshCcwIcon, group: "principal" },
  { href: "/profile", label: "Profil", icon: UserIcon, group: "compte" },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon; group: "principal" | "compte" }[];

/** Routes réservées aux administrateurs (affichées dans la sidebar si isAdminUser). */
export const ADMIN_NAV_ITEMS = [
  { href: "/admin/content-studio", label: "Content Studio", icon: FilmIcon, group: "admin" },
  { href: "/admin", label: "Administration", icon: ShieldCheckIcon, group: "admin" },
] as const satisfies readonly { href: string; label: string; icon: LucideIcon; group: "admin" }[];

