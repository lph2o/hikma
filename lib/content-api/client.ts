// Hikma Content Studio — client Supabase RUNTIME (ANON uniquement).
//
// Invariant repo : production utilise uniquement la clé anon ; la service_role
// reste confinée aux scripts CLI (jamais importée ici). Aucune donnée
// utilisateur n'est lue par cette couche (corpus public en lecture seule).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ContentApiError } from "./errors";

let cached: SupabaseClient | null = null;

export function getContentStudioClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    throw new ContentApiError(
      "SUPABASE_NOT_CONFIGURED",
      "Variables Supabase absentes de l'environnement serveur.",
    );
  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
