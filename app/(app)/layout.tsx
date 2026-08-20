import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/app-nav";
import { AppHeader } from "@/components/app/app-header";
import { getUserSettings } from "@/lib/learning/activity";
import { createClient } from "@/lib/supabase/server";
import { isOnboardingComplete } from "@/lib/learning/onboarding";

export const dynamic = "force-dynamic";

/**
 * Coquille applicative : sidebar desktop + bottom navigation mobile.
 * Toutes les routes de l'expérience utilisateur vivent dans ce groupe.
 *
 * Phase 32D — tout utilisateur connecté dont la version d’onboarding est
 * antérieure à la version courante est redirigé vers /onboarding. La route vit
 * dans un groupe séparé pour éviter toute boucle.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    const settings = await getUserSettings(client, user.id);
    if (!isOnboardingComplete(settings)) redirect("/onboarding");
  }

  return (
    <div className="min-h-dvh">
      <AppNav />
      <div className="md:pl-64">
        <AppHeader />
        <main className="pb-24 md:pb-10">{children}</main>
      </div>
    </div>
  );
}
