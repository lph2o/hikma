import type { Metadata } from "next";
import { LandingPage } from "@/components/app/landing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Canonical explicite (résolu contre metadataBase). La landing n'a aucune
// variation d'URL indexable → aucune chance de duplication de contenu.
export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Page d'accueil (Phase 24D) :
 * - visiteur → landing (proposition de valeur + première action) ;
 * - connecté → landing adaptée : le CTA principal devient « Continuer mon
 *   parcours » vers /dashboard, sans redirection brutale. Les leçons restent
 *   publiques (stratégie de conversion) : « Première leçon » reste accessible.
 */
export default async function Home() {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return <LandingPage authenticated={user != null} />;
}
