import type { SupabaseClient } from "@supabase/supabase-js";

/** Découpe un tableau en lots (limite de taille de requête Supabase). */
export function chunk<T>(items: T[], size = 1000): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export const SELECT_PAGE_SIZE = 1000;

/**
 * Sélectionne TOUTES les lignes d'une table, en paginant (Supabase/PostgREST
 * limite chaque réponse à 1000 lignes par défaut).
 */
export async function selectAll(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  // Boucle de pagination : s'arrête quand une page incomplète est reçue.
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`select ${table}: ${error.message}`);
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
    from += SELECT_PAGE_SIZE;
  }
  return rows;
}

export async function countRows(
  client: SupabaseClient,
  table: string,
): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

export async function upsertInChunks<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  rows: T[],
  onConflict: string,
): Promise<void> {
  if (rows.length === 0) return;
  for (const batch of chunk(rows, 1000)) {
    await upsertBatchWithRetry(client, table, batch, onConflict);
  }
}

const UPSERT_ATTEMPTS = 3;

async function upsertBatchWithRetry<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  batch: T[],
  onConflict: string,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= UPSERT_ATTEMPTS; attempt += 1) {
    try {
      const { error } = await client
        .from(table)
        .upsert(batch as never, { onConflict, ignoreDuplicates: false });
      if (!error) return;
      lastError = new Error(`upsert ${table}: ${error.message}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < UPSERT_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export type UpsertStats = {
  inserted: number;
  updated: number;
  failed: number;
};

/**
 * Upsert idempotent + statistiques insérés/mis à jour/échecs,
 * dérivées de l'évolution du nombre de lignes (aucun pré-fetch de clés).
 */
export async function upsertWithStats<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  rows: T[],
  onConflict: string,
): Promise<UpsertStats> {
  if (rows.length === 0) return { inserted: 0, updated: 0, failed: 0 };
  const before = await countRows(client, table);
  await upsertInChunks(client, table, rows, onConflict);
  const after = await countRows(client, table);
  const inserted = Math.max(0, after - before);
  const updated = Math.max(0, rows.length - inserted);
  const failed = Math.max(0, rows.length - inserted - updated);
  return { inserted, updated, failed };
}
