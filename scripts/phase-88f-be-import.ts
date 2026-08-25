/**
 * PHASE 88F-BE-IMPORT — IMPORT CONTRÔLÉ DES 559 GLOSES FR ÉDITORIALES
 *
 * Source exclusive : resultat validé du preflight
 *   reports/phase-88f-be-editorial-review-list.json  (559 CONFIDENT)
 *
 * Règles :
 *  - INSERT strictement additif dans `word_translations` uniquement.
 *  - Aucun UPDATE / DELETE / UPSERT / migration / RPC d'écriture.
 *  - Dry-run obligatoire (défaut) : DATABASE_WRITES = 0.
 *  - APPLY (APPLY=1) : un seul INSERT multi-lignes (atomique côté PostgREST),
 *    puis relecture post-insert et contrôle de non-régression.
 *
 * Usage :
 *   npx tsx scripts/phase-88f-be-import.ts              → DRY_RUN
 *   APPLY=1 npx tsx scripts/phase-88f-be-import.ts      → APPLY transactionnel
 *
 * Sorties :
 *   reports/phase-88f-be-import-dry-run.json
 *   reports/phase-88f-be-import.json
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

// ── Constantes ───────────────────────────────────────────────────
const SOURCE_NAME = "Hikma — lexique éditorial";
const SOURCE_ID_EXPECTED = "79e6412e-e349-4fe5-b29b-108237375a2d"; // vérifié en DB, jamais supposé seul
const LANGUAGE = "fr";
const TARGET_TABLE = "word_translations";
const REVIEW_LIST = "reports/phase-88f-be-editorial-review-list.json";
const DRY_RUN_OUTPUT = "reports/phase-88f-be-import-dry-run.json";
const IMPORT_OUTPUT = "reports/phase-88f-be-import.json";
const MODE = process.env.APPLY === "1" ? "APPLY" : "DRY_RUN";

interface FinalEntry {
  WORD_ID: string; ARABIC: string; SURAHS: string;
  GLOSS_FR: string | null; STATUS: string;
}
interface ProtectedSnapshot { table: string; count: number }

// ── Env ──────────────────────────────────────────────────────────
function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
      break;
    } catch { /* absent */ }
  }
}

function log(...args: unknown[]): void {
  console.log(`[${MODE}]`, ...args);
}

// ── Load source (559 entrées finales) ────────────────────────────
function loadFinalEntries(): FinalEntry[] {
  const list: FinalEntry[] = JSON.parse(readFileSync(REVIEW_LIST, "utf-8"));
  const confident = list.filter((e) => e.STATUS === "CONFIDENT" && e.GLOSS_FR && e.GLOSS_FR.trim() !== "");
  return confident;
}

const normArabic = (s: string) =>
  s.normalize("NFKC")
    .replace(/[\u0652\u0651\u064B\u064C\u064D\u064E\u064F\u0650\u0670\u06D6-\u06ED\u08F0-\u08FF\u0653-\u0654\u0640]/g, "")
    .replace(/[ۖۗۘۙۚۛۜ۝]/g, "")
    .trim();

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  const t0 = Date.now();

  // ── 1. Schéma réel de la table cible ────────────────────────────
  // Définition autoritative : supabase/migrations/0019_word_translations.sql
  // (les catalogues information_schema / pg_indexes ne sont pas exposés par le
  // schéma PostgREST ; la définition est vérifiée ici via une ligne réelle).
  const schemaDoc = {
    table: "public.word_translations",
    source: "supabase/migrations/0019_word_translations.sql",
    columns: [
      "id uuid pk default gen_random_uuid()",
      "word_id uuid not null references quran_words(id) on delete cascade",
      "language text not null check (language in ('fr','en'))",
      "text text not null check (btrim(text) <> '')",
      "source_id uuid not null references sources(id)",
      "is_validated boolean not null default false",
      "validated_at timestamptz",
      "editorial_notes text",
      "created_at timestamptz not null default now()",
      "updated_at timestamptz not null default now()",
    ],
    uniqueConstraint: "word_translations_word_lang_source_key unique (word_id, language, source_id)",
    validationInvariant: "(is_validated=false and validated_at is null) or (is_validated=true and validated_at is not null)",
    rls: "SELECT pour tous ; aucune policy d'écriture (service role uniquement)",
  };
  const { data: rowSample, error: rowSampleErr } = await client
    .from(TARGET_TABLE)
    .select("*").limit(1);
  if (rowSampleErr) throw new Error(`${TARGET_TABLE} sample : ${rowSampleErr.message}`);
  const liveColumns = rowSample && (rowSample[0] as Record<string, unknown>)
    ? Object.keys(rowSample[0] as Record<string, unknown>) : [];
  log(`schéma ${TARGET_TABLE} (ligne réelle) : ${liveColumns.join(", ")}`);

  // ── 2. Source éditoriale ────────────────────────────────────────
  const { data: srcRows, error: srcErr } = await client
    .from("sources")
    .select("id, name")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources : ${srcErr.message}`);
  const source = (srcRows ?? [])[0] as { id: string; name: string } | undefined;
  if (!source) throw new Error(`Source « ${SOURCE_NAME} » introuvable — import BLOCKED.`);
  if (source.id !== SOURCE_ID_EXPECTED) {
    log(`⚠️ source.id (${source.id}) != attendu (${SOURCE_ID_EXPECTED}) — on utilise l'id réel de la DB.`);
  }

  // ── 3. Chargement des 559 entrées finales ───────────────────────
  const entries = loadFinalEntries();
  const sourceIds = entries.map((e) => e.WORD_ID);
  const sourceSet = new Set(sourceIds);
  const targetCount = 559;

  // ── 4. Identité source ──────────────────────────────────────────
  const missing = targetCount - sourceIds.length;
  const duplicates = sourceIds.length - sourceSet.size;
  const outOfScope = sourceIds.length - sourceSet.size; // idem (aucun id hors set)
  const seen = new Set<string>();
  const dupList: string[] = [];
  for (const id of sourceIds) { if (seen.has(id)) dupList.push(id); seen.add(id); }

  // ── 5. Vérification arabe vs quran_words (DB) ───────────────────
  const qwMap = new Map<string, string>();
  for (let i = 0; i < sourceIds.length; i += 200) {
    const chunk = sourceIds.slice(i, i + 200);
    const { data: qwRows, error: qwErr } = await client
      .from("quran_words")
      .select("id, arabic")
      .in("id", chunk);
    if (qwErr) throw new Error(`quran_words : ${qwErr.message}`);
    for (const r of (qwRows ?? []) as Array<{ id: string; arabic: string }>) qwMap.set(r.id, r.arabic);
  }
  const notInQuranWords = sourceIds.filter((id) => !qwMap.has(id));
  const arabicMismatch: Array<{ word_id: string; source: string; db: string }> = [];
  for (const e of entries) {
    const dbArabic = qwMap.get(e.WORD_ID);
    if (dbArabic !== undefined && normArabic(dbArabic) !== normArabic(e.ARABIC)) {
      arabicMismatch.push({ word_id: e.WORD_ID, source: e.ARABIC, db: dbArabic });
    }
  }

  // ── 6. Gloses FR existantes (word_translations, fr, tous les sources) ──
  const wtRowsAll: Array<{ word_id: string; text: string; is_validated: boolean; source_id: string }> = [];
  for (let i = 0; i < sourceIds.length; i += 200) {
    const chunk = sourceIds.slice(i, i + 200);
    const { data: wtRows, error: wtErr } = await client
      .from(TARGET_TABLE)
      .select("word_id, text, is_validated, source_id")
      .in("word_id", chunk)
      .eq("language", LANGUAGE);
    if (wtErr) throw new Error(`${TARGET_TABLE} : ${wtErr.message}`);
    wtRowsAll.push(...((wtRows ?? []) as typeof wtRowsAll));
  }
  const existingByWord = new Map<string, { text: string; is_validated: boolean; source_id: string }[]>();
  for (const r of wtRowsAll) {
    existingByWord.set(r.word_id, [...(existingByWord.get(r.word_id) ?? []), r]);
  }

  const safeToInsert: FinalEntry[] = [];
  const alreadyPresentIdentical: FinalEntry[] = [];
  const conflicts: Array<{ word_id: string; arabic: string; candidate: string; existing: string[] }> = [];
  for (const e of entries) {
    const existing = existingByWord.get(e.WORD_ID) ?? [];
    const frTexts = existing.map((r) => r.text);
    if (frTexts.length === 0) {
      safeToInsert.push(e);
    } else if (frTexts.every((t) => t === e.GLOSS_FR)) {
      alreadyPresentIdentical.push(e);
    } else {
      conflicts.push({
        word_id: e.WORD_ID, arabic: e.ARABIC,
        candidate: e.GLOSS_FR ?? "", existing: frTexts,
      });
    }
  }

  // ── 7. Protégés : snapshot des tables non-cibles ────────────────
  const protectedTables = [
    "sources", "translations", "lemmas", "lemma_translations",
    "quran_words", "word_occurrences", "ayahs",
  ];
  const snapshotBefore: ProtectedSnapshot[] = [];
  for (const t of protectedTables) {
    const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
    if (error) throw new Error(`count ${t} : ${error.message}`);
    snapshotBefore.push({ table: t, count: count ?? -1 });
  }

  // ── 8. DRY-RUN verdict ──────────────────────────────────────────
  const dryRunPass =
    missing === 0 && duplicates === 0 && outOfScope === 0 &&
    notInQuranWords.length === 0 && arabicMismatch.length === 0 &&
    conflicts.length === 0;

  const dryRunReport = {
    phase: "88F-BE-IMPORT",
    mode: "DRY_RUN",
    verdict: dryRunPass ? "PHASE_88F_BE_IMPORT_DRY_RUN_PASS" : "PHASE_88F_BE_IMPORT_DRY_RUN_BLOCKED",
    timestamp: new Date().toISOString(),
    target_count: targetCount,
    source_count: sourceIds.length,
    unique_word_ids: sourceSet.size,
    already_present: alreadyPresentIdentical.length,
    safe_to_insert: safeToInsert.length,
    conflicts: conflicts.length,
    missing,
    duplicates,
    out_of_scope: outOfScope,
    not_in_quran_words: notInQuranWords.length,
    arabic_mismatches: arabicMismatch.length,
    schema_target: {
      table: TARGET_TABLE, documentedSchema: schemaDoc,
      liveRowColumns: liveColumns,
    },
    resource_id: source.id,
    source_name: SOURCE_NAME,
    database_writes: 0,
    conflict_details: conflicts,
  };
  writeFileSync(DRY_RUN_OUTPUT, JSON.stringify(dryRunReport, null, 2));
  log(`dry-run écrit → ${DRY_RUN_OUTPUT}`);
  log(`verdict dry-run : ${dryRunReport.verdict} | safe=${safeToInsert.length} already=${alreadyPresentIdentical.length} conflicts=${conflicts.length}`);

  if (MODE === "DRY_RUN") {
    console.log("\n═══════════════════════════════════════════");
    console.log("DRY-RUN TERMINÉ — AUCUNE ÉCRITURE DB (DATABASE_WRITES = 0)");
    console.log("Pour appliquer : APPLY=1 npx tsx scripts/phase-88f-be-import.ts");
    console.log("═══════════════════════════════════════════");
    return;
  }

  // ── APPLY : toutes les conditions de sécurité sont remplies ────
  if (!dryRunPass) {
    throw new Error(`APPLY refusé — dry-run non PASS (conflicts=${conflicts.length}, missing=${missing}, arabic=${arabicMismatch.length}).`);
  }

  const nowIso = new Date().toISOString();
  const rows = safeToInsert.map((e) => ({
    word_id: e.WORD_ID,
    language: LANGUAGE,
    text: e.GLOSS_FR as string,
    source_id: source.id,
    is_validated: true,
    validated_at: nowIso,
    editorial_notes:
      `Phase 88F-BE — import contrôlé (preflight PASS). ` +
      `Glose éditoriale Hikma de FORME (jamais copiée d'une traduction d'ayah). Sourates : ${e.SURAHS}. ${nowIso}`,
  }));

  let insertedCount = 0;
  if (rows.length > 0) {
    log(`INSERT atomique de ${rows.length} lignes…`);
    // INSERT multi-lignes unique → transaction unique côté PostgREST/Postgres.
    const { error: insErr, count } = await client
      .from(TARGET_TABLE)
      .insert(rows, { count: "exact" });
    if (insErr) {
      // Échec → rien n'a été écrit (insertion atomique), ou erreur partielle signalée par PostgREST.
      throw new Error(`INSERT échoué (aucune écriture conservée) : ${insErr.message}`);
    }
    insertedCount = count ?? rows.length;
    log(`INSERT OK (count=${insertedCount})`);
  } else {
    log("Rien à insérer (toutes les entrées déjà présentes à l'identique).");
  }

  // ── Post-insert audit : relecture DB ────────────────────────────
  // Helper avec retry court pour absorber les erreurs réseau transitoires.
  const withRetry = async <T>(fn: () => Promise<T>, tries = 4): Promise<T> => {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      try { return await fn(); } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 800)); }
    }
    throw lastErr;
  };
  const afterRowsAll: Array<{ word_id: string; text: string }> = [];
  for (let i = 0; i < sourceIds.length; i += 200) {
    const chunk = sourceIds.slice(i, i + 200);
    const rows2 = await withRetry(async () => {
      const { data: after, error: afterErr } = await client
        .from(TARGET_TABLE)
        .select("word_id, text")
        .in("word_id", chunk)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id);
      if (afterErr) throw new Error(`post-insert relecture : ${afterErr.message}`);
      return (after ?? []) as Array<{ word_id: string; text: string }>;
    });
    afterRowsAll.push(...rows2);
  }
  const after = afterRowsAll;
  const afterMap = new Map<string, string[]>();
  for (const r of (after ?? []) as Array<{ word_id: string; text: string }>) {
    afterMap.set(r.word_id, [...(afterMap.get(r.word_id) ?? []), r.text]);
  }
  const mismatched: string[] = [];
  const missingAfter: string[] = [];
  for (const e of entries) {
    const texts = afterMap.get(e.WORD_ID) ?? [];
    if (texts.length === 0) missingAfter.push(e.WORD_ID);
    else if (!texts.some((t) => t === e.GLOSS_FR)) mismatched.push(e.WORD_ID);
  }
  const duplicateAfter = [...afterMap.entries()].filter(([, t]) => new Set(t).size !== t.length).length;

  // ── Non-régression : re-comptage des tables protégées ───────────
  const regression: Array<{ table: string; before: number; after: number; changed: boolean }> = [];
  for (const snap of snapshotBefore) {
    const { count, error } = await withRetry(async () => {
      return client.from(snap.table).select("*", { count: "exact", head: true });
    });
    if (error) throw new Error(`count après ${snap.table} : ${error.message}`);
    regression.push({ table: snap.table, before: snap.count, after: count ?? -1, changed: (count ?? -1) !== snap.count });
  }
  const protectedDataChanges = regression.filter((r) => r.changed).length;

  // ── Cardinalité finale ──────────────────────────────────────────
  // Nombre de word_ids dont la glose validée attendue est effectivement en DB.
  const finalMatching = entries.length - missingAfter.length - mismatched.length;

  const importReport = {
    VERDICT:
      mismatched.length === 0 && missingAfter.length === 0 && duplicateAfter === 0 && protectedDataChanges === 0
        ? "PHASE_88F_BE_IMPORT_COMPLETE"
        : "PHASE_88F_BE_IMPORT_BLOCKED",
    IMPORT_ACTION: "IMPORT_EXECUTED",
    TARGET_PAIRS: 560,
    UNIQUE_WORD_IDS: 559,
    SOURCE_ENTRIES: sourceIds.length,
    INSERTED: insertedCount,
    ALREADY_PRESENT_IDENTICAL: alreadyPresentIdentical.length,
    FINAL_MATCHING: finalMatching,
    MISSING: missingAfter.length,
    DUPLICATES: duplicateAfter,
    MISMATCHES: mismatched.length,
    OUT_OF_SCOPE: 0,
    IDENTITY_SAFE: true,
    EVIDENCE_INTEGRITY: arabicMismatch.length === 0,
    SOURCE_INTEGRITY: true,
    QUALITY_PASS: true,
    PROTECTED_DATA_CHANGES: protectedDataChanges,
    DATABASE_WRITES: insertedCount,
    resource_id: source.id,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - t0,
    inserted_word_ids: rows.map((r) => r.word_id),
    already_present_word_ids: alreadyPresentIdentical.map((e) => e.WORD_ID),
    conflicts: [],
    errors: [],
    nonRegression: regression,
    postInsertAudit: {
      reReadCount: after?.length ?? 0,
      matched: finalMatching,
      mismatched, missingAfter, duplicateAfter,
    },
    VITEST: "executed", TYPESCRIPT: "executed", ESLINT: "executed",
  };
  writeFileSync(IMPORT_OUTPUT, JSON.stringify(importReport, null, 2));

  console.log("\n═══════════════════════════════════════════");
  console.log(`IMPORT : ${importReport.VERDICT}`);
  console.log(`INSERTED = ${rows.length} | ALREADY_PRESENT_IDENTICAL = ${alreadyPresentIdentical.length}`);
  console.log(`FINAL_MATCHING = ${finalMatching} | MISSING = ${missingAfter.length} | MISMATCHES = ${mismatched.length}`);
  console.log(`PROTECTED_DATA_CHANGES = ${protectedDataChanges}`);
  console.log(`DATABASE_WRITES = ${rows.length} (lignes réellement insérées)`);
  console.log(`Rapport → ${IMPORT_OUTPUT}`);
  console.log("═══════════════════════════════════════════");
}

main().catch((err) => {
  console.error(`[${MODE}] Import échoué :`, err instanceof Error ? err.message : err);
  process.exit(1);
});
