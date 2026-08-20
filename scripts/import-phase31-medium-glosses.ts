// Phase 31 — import contrôlé des gloses FR éditoriales MEDIUM validées.
//
// Usage :
//   npx tsx scripts/import-phase31-medium-glosses.ts          → DRY-RUN (aucune écriture)
//   APPLY=1 npx tsx scripts/import-phase31-medium-glosses.ts  → import réel (idempotent)
//
// Décision humaine (Phase 31) : APPROUVER 86 (81 ACCEPT + 5 REVISE) ; 1 NEEDS_REVIEW
// (ٱلْمَاعُونَ) NON importé. Les gloses REVISE utilisent leur glose finale corrigée.
//
// Périmètre STRICT : UNIQUEMENT word_translations (fr, is_validated=true), additif.
// Aucune modification de quran_words / word_occurrences / lemmas / lemma_translations /
// word_lemma_mapping / translations / linguistic_* / curriculum / grading / SRS /
// mastery / progression / scoring. Aucune nouvelle source linguistique.
//
// Idempotence : UNIQUE(word_id, language, source_id). RUN 2 → 0 insertion.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { normalizeOrthographic } from "../lib/linguistic/masaq";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const APPLY = process.env.APPLY === "1";
const INPUT = "tmp/phase31-medium-validation.json";
const OUTPUT = "tmp/phase31-import.json";

type Row = {
  word_id: string;
  arabic: string;
  decision: "ACCEPT" | "REVISE" | "REJECT" | "NEEDS_REVIEW";
  final_gloss: string | null;
  surahs: number[];
  first_ref: string | null;
};

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {}
  }
}

async function count(client: SupabaseClient, table: string): Promise<number> {
  const { count: c } = await client.from(table).select("id", { count: "exact", head: true });
  return c ?? 0;
}

async function captureCoreCounters(client: SupabaseClient): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of [
    "quran_words",
    "word_occurrences",
    "ayahs",
    "translations",
    "lemmas",
    "word_translations",
    "lemma_translations",
    "word_lemma_mapping",
    "linguistic_occurrences",
    "linguistic_segments",
  ]) {
    out[t] = await count(client, t);
  }
  return out;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  }
  const client = createClient(url, service, { auth: { persistSession: false } });
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  console.log(`=== PHASE 31 — IMPORT DES GLOSES MEDIUM VALIDÉES (${mode}) ===`);

  const validation = JSON.parse(readFileSync(INPUT, "utf8")) as {
    decisions: Row[];
    summary: Record<string, unknown>;
  };
  const selected = validation.decisions.filter(
    (r) => (r.decision === "ACCEPT" || r.decision === "REVISE") && r.final_gloss != null,
  );
  if (selected.length === 0) throw new Error("Aucune glose validée à importer.");

  // 1. Source de provenance.
  const { data: srcRows, error: srcErr } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources : ${srcErr.message}`);
  const source = (srcRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`STOP — source « ${SOURCE_NAME} » introuvable.`);

  // 2. Défense anti-mauvaise-identification.
  const wordIds = selected.map((r) => r.word_id);
  const { data: wordRows, error: wordErr } = await client
    .from("quran_words")
    .select("id, arabic, meaning, lemma_id")
    .in("id", wordIds);
  if (wordErr) throw new Error(`quran_words : ${wordErr.message}`);
  const arabicById = new Map((wordRows ?? []).map((w) => [w.id as string, w.arabic as string]));
  for (const r of selected) {
    const actual = arabicById.get(r.word_id);
    if (!actual) throw new Error(`word_id introuvable pour ${r.arabic}.`);
    const actualNorm = normalizeOrthographic(actual);
    const expectedNorm = normalizeOrthographic(r.arabic);
    if (actualNorm !== expectedNorm) {
      throw new Error(`MISMATCH ${r.word_id} : attendu « ${expectedNorm} », réel « ${actualNorm} » (${actual}) — arrêt.`);
    }
  }
  console.log(`  ✓ ${selected.length}/${selected.length} formes vérifiées (normalisation orthographique).`);

  // 3. État existant (idempotence + divergence).
  const { data: wtRows, error: wtErr } = await client
    .from("word_translations")
    .select("word_id, text, is_validated")
    .in("word_id", wordIds)
    .eq("language", LANGUAGE)
    .eq("source_id", source.id);
  if (wtErr) throw new Error(`word_translations : ${wtErr.message}`);
  const existingByWord = new Map(
    (wtRows ?? []).map((r) => [r.word_id as string, r as { text: string; is_validated: boolean }]),
  );

  const plan = selected.map((r) => {
    const existing = existingByWord.get(r.word_id);
    if (existing) {
      if (existing.text !== r.final_gloss) {
        return { ...r, action: "DIVERGENCE", existing_text: existing.text };
      }
      return { ...r, action: existing.is_validated ? "ALREADY_EXISTS" : "VALIDATE_EXISTING", existing_text: existing.text };
    }
    return { ...r, action: "INSERT", existing_text: null };
  });
  const divergences = plan.filter((p) => p.action === "DIVERGENCE");
  if (divergences.length > 0) {
    for (const d of divergences) {
      console.error(`  DIVERGENCE ${d.arabic} : base « ${d.existing_text} » ≠ final « ${d.final_gloss} »`);
    }
    throw new Error("STOP — divergences détectées. Aucune écriture.");
  }

  const summary = {
    total_selected: plan.length,
    insert: plan.filter((p) => p.action === "INSERT").length,
    already_exists: plan.filter((p) => p.action === "ALREADY_EXISTS").length,
    validate_existing: plan.filter((p) => p.action === "VALIDATE_EXISTING").length,
    divergence: divergences.length,
  };
  console.log(`\n=== PLAN === ${JSON.stringify(summary)}`);

  const beforeCounters = await captureCoreCounters(client);

  if (!APPLY) {
    writeFileSync(
      OUTPUT,
      JSON.stringify({ phase: "31", mode, decision: "APPROVED_86 (validation humaine)", summary, before: { counters: beforeCounters } }, null, 2) + "\n",
    );
    console.log("DRY-RUN terminé : aucune écriture. Relancer avec APPLY=1 pour importer.");
    return;
  }

  // 4. Écritures (APPLY).
  const nowIso = new Date().toISOString();
  let inserted = 0;
  let alreadyExists = 0;
  let validatedExisting = 0;
  for (const r of selected) {
    const existing = existingByWord.get(r.word_id);
    if (existing) {
      if (existing.text !== r.final_gloss) throw new Error(`DIVERGENCE ${r.arabic} — arrêt.`);
      if (existing.is_validated) { alreadyExists += 1; continue; }
      const { error } = await client
        .from("word_translations")
        .update({ is_validated: true, validated_at: nowIso })
        .eq("word_id", r.word_id)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id)
        .eq("is_validated", false);
      if (error) throw new Error(`update ${r.arabic} : ${error.message}`);
      validatedExisting += 1;
      continue;
    }
    const { error } = await client.from("word_translations").insert({
      word_id: r.word_id,
      language: LANGUAGE,
      text: r.final_gloss,
      source_id: source.id,
      is_validated: true,
      validated_at: nowIso,
      editorial_notes: `Phase 31 — import contrôlé (validation humaine, décision ${r.decision}). Glose éditoriale Hikma de FORME (jamais copiée d'une traduction d'ayah). Sourates : ${(r.surahs ?? []).join(", ")}.`,
    });
    if (error) {
      if (error.code === "23505") { alreadyExists += 1; continue; }
      throw new Error(`insert ${r.arabic} : ${error.message}`);
    }
    inserted += 1;
  }

  // 5. Post-validation + traçabilité (validated_by/validated_at dans le fichier de décision).
  const afterCounters = await captureCoreCounters(client);
  const { data: verifyRows } = await client
    .from("word_translations")
    .select("word_id, text")
    .in("word_id", wordIds)
    .eq("language", LANGUAGE)
    .eq("source_id", source.id)
    .eq("is_validated", true);
  const verifiedMap = new Map((verifyRows ?? []).map((r) => [r.word_id as string, r.text as string]));

  // Mettre à jour le fichier de décision (traçabilité de la validation humaine).
  validation.decisions = validation.decisions.map((d) =>
    selected.some((s) => s.word_id === d.word_id)
      ? { ...d, validated_by: "human", validated_at: nowIso, status: "VALIDATED" }
      : d,
  );
  validation.summary = {
    ...validation.summary,
    imported: { inserted, already_exists: alreadyExists, validated_existing: validatedExisting },
    validated_by: "human",
    validated_at: nowIso,
  };
  writeFileSync(INPUT, JSON.stringify(validation, null, 2) + "\n");

  const report = {
    phase: "31",
    mode,
    decision: "APPROVED_86 (validation humaine)",
    approved_input: selected.length,
    import: { inserted, already_exists: alreadyExists, validated_existing: validatedExisting, divergences: divergences.length },
    post_verified_validated_count: verifiedMap.size,
    non_regression: {
      word_translations_delta: (afterCounters.word_translations ?? 0) - (beforeCounters.word_translations ?? 0),
      others_unchanged:
        JSON.stringify(Object.fromEntries(Object.entries(beforeCounters).filter(([k]) => k !== "word_translations"))) ===
        JSON.stringify(Object.fromEntries(Object.entries(afterCounters).filter(([k]) => k !== "word_translations"))),
      before: beforeCounters,
      after: afterCounters,
    },
    provenance: { source_name: SOURCE_NAME, source_id: source.id },
  };
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log("\n=== RÉSULTAT APPLY ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Phase 31 (MEDIUM) échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
