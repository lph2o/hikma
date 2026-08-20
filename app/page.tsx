import { redirect } from "next/navigation";
import { LandingPage } from "@/components/app/landing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Page d'accueil (Phase 24D) :
 * - visiteur → landing (proposition de valeur + première action) ;
 * - connecté → dashboard (l'expérience utilisateur principale).
 */
export default async function Home() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (user) redirect("/dashboard");

  return <LandingPage />;
}
