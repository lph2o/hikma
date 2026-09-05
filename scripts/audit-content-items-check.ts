// Hikma — AUDIT READ-ONLY : contrainte template_key de content_items (live DB).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
    } catch {
      /* absent — OK */
    }
  }
}

async function rpc(client: SupabaseClient, sql: string): Promise<unknown> {
  // PostgREST ne permet pas SQL arbitraire : on passe par des vues système
  // accessibles en REST pour les contraintes.
  const { data, error } = await client
    .schema("information_schema" as never)
    .from("check_constraints" as never)
    .select("constraint_name, check_clause")
    .ilike("check_clause", "%template_key%");
  if (error) return { note: `information_schema indisponible: ${error.message}` };
  return data;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env requis");
  const client = createClient(url, key, { auth: { persistSession: false } });

  // 1. Valeurs distinctes réellement présentes (lecture sûre)
  const { data: rows, error } = await client
    .from("content_items")
    .select("template_key")
    .limit(500);
  if (error) {
    console.log("PROBE_ERROR", error.message);
    process.exit(1);
  }
  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    const k = (r as { template_key: string }).template_key;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  console.log("DISTINCT_TEMPLATE_KEYS", JSON.stringify([...counts.entries()]));

  // 2. Clause CHECK si lisible via information_schema (exposée ou non)
  const c = await rpc(client, "");
  console.log("CHECK_CONSTRAINTS", JSON.stringify(c));
}

main().catch((e) => {
  console.error("PROBE_ERROR", e instanceof Error ? e.message : e);
  process.exit(1);
});
