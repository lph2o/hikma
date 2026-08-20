// Seed du pilote word_lemma_mapping (Phase 21B-C, « Option B »).
//
// Usage :
//   DRY_RUN=1 npm run seed:word-lemma-mapping   → dry-run, AUCUNE écriture
//   npm run seed:word-lemma-mapping              → import idempotent des SAFE
//
// Garanties :
//   - n'importe QUE les mappings classés SAFE (jamais REVIEW_REQUIRED/REJECTED) ;
//   - ne touche JAMAIS quran_words.lemma_id (les formes déjà mappées sont ignorées) ;
//   - idempotent : UNIQUE(word_id) + onConflict ignoreDuplicates → aucun doublon ;
//   - provenance réelle : source « Hikma — lexique éditorial » (source_id réel) ;
//   - aucun fuzzy matching (classifieur lib/quran/lemma-mapping.ts, décomposition exacte).

import { createClient } from "@supabase/supabase-js";
import {
  classifyPilotMappings,
  type LemmaRow,
  type WordRow,
} from "../lib/quran/lemma-mapping";

const EDITORIAL_SOURCE_NAME = "Hikma — lexique éditorial";
const PAGE = 1000;

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {}
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("env Supabase manquant");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });
  const dryRun = process.env.DRY_RUN === "1";

  // Helper local (closure) : aucune annotation `any`, pagination maîtrisée.
  async function all<T>(table: string, select: string): Promise<T[]> {
    const out: T[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await client
        .from(table)
        .select(select)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }

  // 1. Source de provenance (réelle, existante).
  const { data: sourceRows, error: srcErr } = await client
    .from("sources")
    .select("id")
    .eq("name", EDITORIAL_SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources: ${srcErr.message}`);
  const sourceId = (sourceRows?.[0] as { id: string } | undefined)?.id;
  if (!sourceId) {
    throw new Error(
      `STOP — source de provenance « ${EDITORIAL_SOURCE_NAME} » introuvable. Décision de provenance requise.`,
    );
  }
  console.log(`provenance : ${EDITORIAL_SOURCE_NAME} (${sourceId})`);

  // 2. Lemmas + quran_words.
  const lemmas = await all<LemmaRow>("lemmas", "id, arabic");
  const words = await all<WordRow>("quran_words", "id, arabic, meaning, lemma_id");
  console.log(`lemmas: ${lemmas.length} · quran_words: ${words.length}`);

  // 3. Classification (aucune écriture).
  const { safe, reviewRequired, rejected } = classifyPilotMappings(
    words,
    lemmas,
    new Map(), // fréquence remplie plus bas
  );
  console.log(
    `classification brute : SAFE=${safe.length} · REVIEW_REQUIRED=${reviewRequired.length} · REJECTED=${rejected.length}`,
  );

  // 4. Occurrences des candidats (pour le reporting) — batch .in().
  const candidateIds = [...safe, ...reviewRequired, ...rejected].map((c) => c.wordId);
  const freq = new Map<string, number>();
  for (let i = 0; i < candidateIds.length; i += 200) {
    const batch = candidateIds.slice(i, i + 200);
    let from = 0;
    for (;;) {
      const { data, error } = await client
        .from("word_occurrences")
        .select("word_id")
        .in("word_id", batch)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`word_occurrences: ${error.message}`);
      for (const o of (data ?? []) as Array<{ word_id: string }>) {
        freq.set(o.word_id, (freq.get(o.word_id) ?? 0) + 1);
      }
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
  }
  for (const c of [...safe, ...reviewRequired, ...rejected]) {
    c.occurrenceCount = freq.get(c.wordId) ?? 0;
  }
  const safeOcc = safe.reduce((s, c) => s + c.occurrenceCount, 0);

  // 5. DRY-RUN.
  console.log("\n=== DRY-RUN (PILOTE) ===");
  console.log(`SAFE (à importer)          : ${safe.length} formes · ${safeOcc} occurrences`);
  for (const c of safe) {
    console.log(`  SAFE       ${c.arabic} → ${c.proposedLemma} (${c.occurrenceCount})`);
  }
  console.log(`\nREVIEW_REQUIRED (NON importés) : ${reviewRequired.length}`);
  for (const c of reviewRequired) {
    console.log(`  REVIEW     ${c.arabic} → ${c.proposedLemma} (${c.occurrenceCount}) ${c.evidence}`);
  }
  console.log(`\nREJECTED (NON importés)        : ${rejected.length}`);
  for (const c of rejected) {
    console.log(`  REJECTED   ${c.arabic} (${c.occurrenceCount}) ${c.evidence}`);
  }

  if (dryRun) {
    console.log("\nDRY_RUN=1 — aucune écriture effectuée.");
    return;
  }

  // 6. Import idempotent des SAFE uniquement.
  let inserted = 0;
  for (const c of safe) {
    const { error } = await client.from("word_lemma_mapping").upsert(
      {
        word_id: c.wordId,
        lemma_id: c.proposedLemmaId,
        source_id: sourceId,
        mapping_method: c.mappingMethod,
        confidence: "safe",
        evidence: c.evidence,
        editorial_notes: "Pilote 21B-C — mapping SAFE (décomposition exacte, contrôle glose EN)",
      },
      { onConflict: "word_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(`INSERT ${c.arabic}: ${error.message}`);
    inserted++;
  }
  console.log(`\nimport : ${inserted} mappings SAFE insérés (idempotent).`);

  // 7. Vérifications post-import (intégrité, unicité, non-régression).
  const { count: mappingCount } = await client
    .from("word_lemma_mapping")
    .select("id", { count: "exact", head: true });
  const { data: mappingRows, error: mErr } = await client
    .from("word_lemma_mapping")
    .select("word_id, lemma_id, source_id, confidence");
  if (mErr) throw new Error(`word_lemma_mapping: ${mErr.message}`);
  const rows = (mappingRows ?? []) as Array<{
    word_id: string;
    lemma_id: string;
    source_id: string;
    confidence: string;
  }>;

  const wordIds = new Set(rows.map((r) => r.word_id));
  const lemmaIds = new Set(rows.map((r) => r.lemma_id));
  const sourceIds = new Set(rows.map((r) => r.source_id));
  const allSafe = rows.every((r) => r.confidence === "safe");

  const { count: orphanWords } = await client
    .from("quran_words")
    .select("id", { count: "exact", head: true })
    .in("id", [...wordIds]);
  const { count: orphanLemmas } = await client
    .from("lemmas")
    .select("id", { count: "exact", head: true })
    .in("id", [...lemmaIds]);
  const { count: orphanSources } = await client
    .from("sources")
    .select("id", { count: "exact", head: true })
    .in("id", [...sourceIds]);

  console.log("\n=== VÉRIFICATIONS POST-IMPORT ===");
  console.log(`mappings en table        : ${mappingCount}`);
  console.log(`word_id distincts        : ${wordIds.size} (unicité : ${wordIds.size === rows.length})`);
  console.log(`FK word_id valides       : ${orphanWords}/${wordIds.size}`);
  console.log(`FK lemma_id valides      : ${orphanLemmas}/${lemmaIds.size}`);
  console.log(`FK source_id valides     : ${orphanSources}/${sourceIds.size}`);
  console.log(`confidence = safe        : ${allSafe}`);
}

main().catch((err) => {
  console.error("Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
});
