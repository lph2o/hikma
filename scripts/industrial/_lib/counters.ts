/**
 * scripts/industrial/_lib/counters.ts
 *
 * Captures the canonical Hikma DB counters (READ-ONLY).
 * Used by 9-STEP PROTOCOL at: baseline → post-apply → verify → regression.
 *
 * Reference tables (all existing in supabase/migrations/00xx*.sql):
 *   quran_words, word_occurrences, ayahs, lemmas, translations,
 *   lemma_translations, word_lemma_mapping, word_translations,
 *   linguistic_occurrences, linguistic_segments, word_explanations,
 *   word_explanation_contexts, learning_paths, units, lessons,
 *   lesson_words, review_items, sources.
 *
 * Phase 68 scope: READ-ONLY. NEVER mutates any table.
 */

export const CANONICAL_COUNTER_TABLES = [
  "quran_words",
  "word_occurrences",
  "ayahs",
  "translations",
  "lemmas",
  "lemma_translations",
  "word_lemma_mapping",
  "word_translations",
  "linguistic_occurrences",
  "linguistic_segments",
  "word_explanations",
  "word_explanation_contexts",
  "learning_paths",
  "units",
  "lessons",
  "lesson_words",
  "review_items",
  "user_word_progress",
  "user_activity_lessons",
  "sources",
] as const;

export type CanonicalTable = typeof CANONICAL_COUNTER_TABLES[number];
export type CanonicalCounters = Record<CanonicalTable, number>;

/**
 * Counts rows in every canonical table using `select("id", { count: "exact", head: true })`
 * — efficient head-only query (no row data).
 */
export async function captureCanonicalCounters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
): Promise<CanonicalCounters> {
  const out = {} as CanonicalCounters;
  for (const table of CANONICAL_COUNTER_TABLES) {
    const { count, error } = await client.from(table).select("id", { count: "exact", head: true });
    if (error) throw new Error(`captureCanonicalCounters: ${table} -> ${error.message}`);
    out[table] = count ?? 0;
  }
  return out;
}

/**
 * Diff two `CanonicalCounters` snapshots. Returns the per-table delta
 * (post - pre). Forbidden: any delta on a table that the calling batch
 * does NOT own (Phase 68 9-STEP PROTOCOL check).
 */
export function diffCounters(
  before: CanonicalCounters,
  after: CanonicalCounters,
): { table: string; delta: number }[] {
  const deltas: { table: string; delta: number }[] = [];
  for (const table of CANONICAL_COUNTER_TABLES) {
    const d = (after[table] ?? 0) - (before[table] ?? 0);
    if (d !== 0) deltas.push({ table, delta: d });
  }
  return deltas;
}

/**
 * Validates that the delta set is contained in `ownedTables`.
 * Returns the lists of unexpected / expected deltas.
 */
export function diffIsContained(
  deltas: { table: string; delta: number }[],
  ownedTables: ReadonlySet<string>,
): { unexpected: { table: string; delta: number }[]; expected: { table: string; delta: number }[] } {
  const unexpected: { table: string; delta: number }[] = [];
  const expected: { table: string; delta: number }[] = [];
  for (const d of deltas) {
    if (ownedTables.has(d.table)) expected.push(d);
    else unexpected.push(d);
  }
  return { unexpected, expected };
}

export function isOwnedTable(
  ownedTables: ReadonlySet<string>,
  table: string,
): table is CanonicalTable {
  return ownedTables.has(table);
}
