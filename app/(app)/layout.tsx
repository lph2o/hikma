import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/app-nav";
import { AppHeader } from "@/components/app/app-header";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";
import { isOnboardingComplete } from "@/lib/learning/onboarding";
import { isAdminEmail } from "@/lib/content-studio/admin";

export const dynamic = "force-dynamic";

/**
 * Coquille applicative : sidebar desktop + bottom navigation mobile.
 * Toutes les routes de l'expérience utilisateur vivent dans ce groupe.
 *
 * - Utilisateur connecté → coquille complète (sidebar, header) ;
 *   si son onboarding est antérieur à la version courante → /onboarding
 *   (Phase 32D, groupe séparé pour éviter toute boucle).
 * - Visiteur anonyme (leçons publiques) → AUCUNE coquille : pas de sidebar ni
 *   de header applicatif, pour ne pas confondre l'essai public avec le
 *   dashboard. La page leçon fournit son propre header de focus.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return <div className="min-h-dvh">{children}</div>;
  }

  const settings = await getUserSettings(client, user.id);
  if (!isOnboardingComplete(settings)) redirect("/onboarding");

  const isAdminUser = isAdminEmail(user.email);

  return (
    <div className="min-h-dvh">
      <AppNav isAdminUser={isAdminUser} />
      <div className="md:pl-64">
        <AppHeader />
        {/* pb-28 : dégagement pour la barre flottante mobile (PHASE 96) —
         * hauteur ≈ 56px + safe-area, aucun contenu ni CTA caché derrière. */}
        <main className="pb-28 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
