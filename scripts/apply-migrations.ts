// Applique les migrations Supabase (supabase/migrations/*.sql) via la
// Management API, sans nécessiter `supabase link` ni le mot de passe DB.
//
// Usage :
//   SUPABASE_ACCESS_TOKEN=<token> npm run db:migrate
//
// Idempotent : chaque migration appliquée est enregistrée dans
// public.hikma_migrations et n'est jamais re-exécutée.

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

type Row = Record<string, unknown>;

async function runQuery(
  api: string,
  token: string,
  query: string,
  readOnly = false,
): Promise<Row[]> {
  const res = await fetch(api, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, read_only: readOnly }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} : ${await res.text()}`);
  }
  return (await res.json()) as Row[];
}

async function main(): Promise<void> {
  loadEnvFiles();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!url || !token) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_ACCESS_TOKEN sont requis.",
    );
  }

  const ref = new URL(url).hostname.split(".")[0];
  const api = `https://api.supabase.com/v1/projects/${ref}/database/query`;

  // Table de suivi (RLS activée, aucune policy : accès service_role uniquement).
  await runQuery(
    api,
    token,
    `create table if not exists public.hikma_migrations (
       version text primary key,
       name text,
       applied_at timestamptz not null default now()
     );
     alter table public.hikma_migrations enable row level security;`,
  );

  const dir = join(process.cwd(), "supabase", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  let applied = 0;
  for (const file of files) {
    // `version` provient des noms de fichiers locaux contrôlés (pas de saisie utilisateur).
    const version = file.replace(/\.sql$/, "");
    const already = await runQuery(
      api,
      token,
      `select 1 as x from public.hikma_migrations where version = '${version}'`,
      true,
    );
    if (already.length > 0) {
      console.log(`⏭  ${version} — déjà appliquée`);
      continue;
    }

    const sql = await readFile(join(dir, file), "utf8");
    await runQuery(api, token, sql);
    await runQuery(
      api,
      token,
      `insert into public.hikma_migrations (version, name) values ('${version}', '${file}')`,
    );
    console.log(`✅ ${version} — appliquée`);
    applied += 1;
  }

  console.log(
    `\nTerminé : ${applied} appliquée(s), ${files.length - applied} déjà en place.`,
  );
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
