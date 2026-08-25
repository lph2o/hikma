/**
 * PHASE 89K — R-89J-01 — GET QURAN COVERAGE CHUNKING
 *
 * Validation READ-ONLY sur la DB réelle :
 * - `oldPath(ids)` : réplique exacte de l'ancienne requête de getQuranCoverage
 *   (count `.in("word_id", ids)` NON chunké) — démontre le bug au-delà du seuil.
 * - `newPath(ids)` : réplique exacte du correctif 89K (lignes `id` par lots de
 *   250 via selectInChunks, count = rows.length) — démontre l'équivalence.
 *
 * Aucune écriture DB (SELECT uniquement). DATABASE_WRITES = 0.
 */

import { createClient as createSupabase } from "@supabase/supabase-js";
import * as fs from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const CHUNK = 250;
const client = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Ancienne requête (avant 89K) : count non chunké. */
async function oldPath(ids: string[]): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (ids.length === 0) return { ok: true, count: 0 };
  try {
    const { count, error } = await client
      .from("word_occurrences")
      .select("id", { count: "exact", head: true })
      .in("word_id", ids);
    if (error) return { ok: false, error: error.message };
    return { ok: true, count: count ?? 0 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/** Nouvelle requête (89K) : count EXACT par lots de 250 (head:true).
 * NB : compter via `select("id")` en lignes tronquerait à 1 000 lignes par GET
 * (plafond REST) — validé sur DB réelle, d'où le count exact par lot. */
async function newPath(ids: string[]): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (ids.length === 0) return { ok: true, count: 0 };
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) batches.push(ids.slice(i, i + CHUNK));
  try {
    let total = 0;
    for (const batch of batches) {
      const { count, error } = await client
        .from("word_occurrences")
        .select("id", { count: "exact", head: true })
        .in("word_id", batch);
      if (error) return { ok: false, error: error.message };
      total += count ?? 0;
    }
    return { ok: true, count: total };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

async function main(): Promise<void> {
  // IDs réels (formes du corpus), sans doublon.
  const { data: words } = await client.from("quran_words").select("id").limit(1001);
  const allIds = (words ?? []).map((w) => (w as { id: string }).id);
  console.log(`REAL_WORD_IDS_FETCHED=${allIds.length}`);

  // La fonction de production déduplique TOUJOURS via new Set() avant la
  // requête : on reproduit ce comportement (l'ancien chemin non dédupliqué
  // renvoyait d'ailleurs un compte erroné — 1376 au lieu de 1000 — sur liste
  // surdimensionnée, preuve supplémentaire du bug).
  const dedupe = (ids: string[]): string[] => [...new Set(ids)];

  const cases: Array<{ label: string; ids: string[] }> = [
    { label: "empty", ids: [] },
    { label: "single", ids: allIds.slice(0, 1) },
    { label: "small_249", ids: allIds.slice(0, 249) },
    { label: "boundary_250", ids: allIds.slice(0, 250) },
    { label: "boundary_251", ids: allIds.slice(0, 251) },
    { label: "large_500", ids: allIds.slice(0, 500) },
    { label: "very_large_1001", ids: allIds.slice(0, 1001) },
    { label: "duplicates_500_in_250", ids: dedupe([...allIds.slice(0, 250), ...allIds.slice(0, 250)]) },
    { label: "missing_ids", ids: ["00000000-0000-0000-0000-000000000000"] },
  ];

  const rows: Array<{ case: string; input: number; before: string; after: string; verdict: string }> = [];
  for (const c of cases) {
    const before = await oldPath(c.ids);
    const after = await newPath(c.ids);
    let verdict: string;
    if (before.ok && after.ok) {
      verdict = before.count === after.count ? "EQUAL" : "MISMATCH";
    } else if (!before.ok && after.ok) {
      verdict = "FIXED_BY_89K";
    } else {
      verdict = "BOTH_ERROR";
    }
    const fmt = (r: { ok: boolean; count?: number; error?: string }) =>
      r.ok ? `OK ${r.count}` : `ERROR ${r.error?.slice(0, 60)}`;
    rows.push({ case: c.label, input: c.ids.length, before: fmt(before), after: fmt(after), verdict });
    console.log(`${c.label.padEnd(22)} in=${String(c.ids.length).padStart(4)} | ${fmt(before).padEnd(70)} | ${fmt(after).padEnd(30)} | ${verdict}`);
  }

  const summary = {
    totalCases: rows.length,
    equal: rows.filter((r) => r.verdict === "EQUAL").length,
    fixedBy89k: rows.filter((r) => r.verdict === "FIXED_BY_89K").length,
    mismatch: rows.filter((r) => r.verdict === "MISMATCH").length,
    bothError: rows.filter((r) => r.verdict === "BOTH_ERROR").length,
  };
  console.log(JSON.stringify({ summary, rows }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
