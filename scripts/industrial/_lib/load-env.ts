/**
 * scripts/industrial/_lib/load-env.ts
 *
 * HTTP-style env loader + factory for a service-role Supabase client.
 * Industrial pipeline: every entry point must go through this loader so
 * that the absence of `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
 * fails loudly (never silently fall back to an anonymous client).
 *
 * READ-ONLY by default. APPLY=1 strikes the writes which each script MUST
 * explicitly gate behind a `if (APPLY)` block + a "scope confirmed by
 * pipeline-orchestrator" gate.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MinimalSupabaseClient = any;

/**
 * Loads `.env.local` then `.env` via Node 22+ native
 * `process.loadEnvFile(...)`. Stays silent on missing files.
 */
export function loadIndustrialEnvFiles(): void {
  for (const path of [".env.local", ".env"]) {
    try {
      (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(path);
    } catch {
      /* absent */
    }
  }
}

export function isApplyEnabled(): boolean {
  return process.env.APPLY === "1" || process.argv.includes("--apply");
}

export function isDryRun(): boolean {
  return process.env.DRY_RUN === "1" || process.argv.includes("--dry-run") || !isApplyEnabled();
}

/**
 * Returns the Supabase service-role client. Imports lazily so that scripts
 * which don't need DB access don't pull in `@supabase/supabase-js`.
 */
export async function buildServiceRoleClient(): Promise<MinimalSupabaseClient> {
  loadIndustrialEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Aborting pipeline: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * CLI flag parser for industrial scripts.
 * Supports `--surahs=1,2,3`, `--batch=ID`, `--apply`, `--dry-run`, `--verify`
 * `--resume=PATH`, `--proposals=PATH`, `--limit=N`, `APPLY=1`, `DRY_RUN=1`.
 */
export interface IndustrialFlags {
  surahs: number[];
  batchId: string | null;
  apply: boolean;
  dryRun: boolean;
  verify: boolean;
  resumePath: string | null;
  proposalsPath: string | null;
  limit: number | null;
}

export function parseIndustrialFlags(argv: string[] = process.argv.slice(2)): IndustrialFlags {
  const get = (k: string): string | undefined =>
    argv.find((a) => a === `--${k}` || a.startsWith(`--${k}=`))?.split("=")[1] ?? (k === "apply" && argv.includes("--apply") ? "1" : undefined);

  const surahRaw = get("surahs");
  const surahs = surahRaw ? Array.from(new Set(surahRaw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && n >= 1 && n <= 114))) : [];

  const limit = get("limit") ? Number(get("limit")) : null;
  const batchId = get("batch") ?? null;
  const resumePath = get("resume") ?? null;
  const proposalsPath = get("proposals") ?? null;
  const verify = argv.includes("--verify");
  const apply = isApplyEnabled() && !argv.includes("--dry-run");

  return {
    surahs,
    batchId,
    apply,
    dryRun: !apply,
    verify,
    resumePath,
    proposalsPath,
    limit: limit && Number.isFinite(limit) && limit > 0 ? limit : null,
  };
}
