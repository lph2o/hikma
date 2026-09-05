import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Fournit un client Supabase avec la clé service_role, réservé EXCLUSIVEMENT
 * aux requêtes du panneau d'administration côté serveur (Server Components / Server Actions).
 *
 * Ce client contourne RLS pour agréger les métriques globales multi-utilisateurs
 * et administrer le contenu. Ne JAMAIS exporter ou exécuter côté client (navigateur).
 */
export function getAdminDbClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour l'accès Admin (serveur uniquement).",
    );
  }

  cached = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
