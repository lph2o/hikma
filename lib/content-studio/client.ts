// Hikma — Content Studio : client DB SERVEUR-UNIQUEMENT (registre).
//
// Le registre `content_items` est INTERNE : RLS activée avec ZÉRO policy
// (aucun accès anon/authenticated — ni lecture ni écriture). L'unique accès
// est ce client service_role, confiné côté serveur (jamais importé côté
// client), qui correspond au pattern des scripts d'import (SUPABASE_SERVICE_ROLE_KEY).
//
// Phase A reste intacte : la Content API de consommation (lecture du corpus)
// continue d'utiliser UNIQUEMENT le client ANON (lib/content-api/client.ts).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getContentStudioDbClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole)
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis pour le registre Content Studio (serveur uniquement).",
    );
  cached = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
