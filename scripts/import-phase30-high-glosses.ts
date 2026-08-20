// Phase 30 — import contrôlé des gloses FR éditoriales HIGH (validation humaine).
//
// Usage :
//   npx tsx scripts/import-phase30-high-glosses.ts          → DRY-RUN (aucune écriture)
//   APPLY=1 npx tsx scripts/import-phase30-high-glosses.ts  → import réel (idempotent)
//
// Décision humaine (Phase 30) : VALIDER les 103 gloses HIGH ; REVOIR les 87 MEDIUM.
// Les 87 MEDIUM ne sont PAS importées ici (dossier de revue séparé).
//
// Périmètre STRICT : UNIQUEMENT word_translations (fr, is_validated=true), additif.
// Aucune modification de quran_words / word_occurrences / lemmas / lemma_translations /
// word_lemma_mapping / translations / linguistic_* / curriculum / grading / SRS /
// mastery / progression / scoring. Aucune nouvelle source linguistique.
//
// Idempotence : UNIQUE(word_id, language, source_id). RUN 2 → 0 insertion.
// Provenance : « Hikma — lexique éditorial » (source_id réel).
// Défense anti-mauvaise-identification : word_id → forme arabe réelle vérifiée par
// normalisation orthographique (jamais modifiée).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { normalizeOrthographic } from "../lib/linguistic/masaq";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const APPLY = process.env.APPLY === "1";
const INPUT = "tmp/phase30-gloss-review.json";
const OUTPUT = "tmp/phase30-high-import.json";

type ReviewProposal = {
  word_id: string;
  arabic: string;
  transliteration: string;
  meaning_en: string;
  proposed_fr: string;
  confidence: "HIGH" | "MEDIUM";
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
    "linguistic_lemmas",
    "linguistic_roots",
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
  console.log(`=== PHASE 30 — IMPORT ÉDITORIAL DES GLOSES FR HIGH (${mode}) ===`);

  const review = JSON.parse(readFileSync(INPUT, "utf8")) as { proposals: ReviewProposal[] };
  const selected = review.proposals.filter((p) => p.confidence === "HIGH");
  if (selected.length === 0) throw new Error("Aucune glose HIGH dans le dossier de revue.");

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
  const wordIds = selected.map((g) => g.word_id);
  const { data: wordRows, error: wordErr } = await client
    .from("quran_words")
    .select("id, arabic, meaning, lemma_id")
    .in("id", wordIds);
  if (wordErr) throw new Error(`quran_words : ${wordErr.message}`);
  const arabicById = new Map((wordRows ?? []).map((w) => [w.id as string, w.arabic as string]));
  let verified = 0;
  for (const g of selected) {
    const actual = arabicById.get(g.word_id);
    if (!actual) throw new Error(`word_id introuvable pour ${g.arabic}.`);
    const actualNorm = normalizeOrthographic(actual);
    const expectedNorm = normalizeOrthographic(g.arabic);
    if (actualNorm !== expectedNorm) {
      throw new Error(
        `MISMATCH ${g.word_id} : attendu normalisé « ${expectedNorm} », réel « ${actualNorm} » (${actual}) — arrêt.`,
      );
    }
    verified += 1;
  }
  console.log(`  ✓ ${verified}/${selected.length} formes vérifiées (normalisation orthographique).`);

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

  const plan = selected.map((g) => {
    const existing = existingByWord.get(g.word_id);
    if (existing) {
      if (existing.text !== g.proposed_fr) {
        return { ...g, action: "DIVERGENCE", existing_text: existing.text };
      }
      return { ...g, action: existing.is_validated ? "ALREADY_EXISTS" : "VALIDATE_EXISTING", existing_text: existing.text };
    }
    return { ...g, action: "INSERT", existing_text: null };
  });
  const divergences = plan.filter((p) => p.action === "DIVERGENCE");
  if (divergences.length > 0) {
    for (const d of divergences) {
      console.error(`  DIVERGENCE ${d.arabic} : base « ${d.existing_text} » ≠ proposé « ${d.proposed_fr} »`);
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

  // 4. Snapshot AVANT.
  const beforeCounters = await captureCoreCounters(client);

  if (!APPLY) {
    writeFileSync(
      OUTPUT,
      JSON.stringify(
        { phase: "30", mode, decision: "ACCEPT_HIGH_ONLY (validation humaine)", summary, before: { counters: beforeCounters }, plan },
        null,
        2,
      ) + "\n",
    );
    console.log("DRY-RUN terminé : aucune écriture. Relancer avec APPLY=1 pour importer.");
    return;
  }

  // 5. Écritures (APPLY) — additives, idempotentes.
  const nowIso = new Date().toISOString();
  let inserted = 0;
  let alreadyExists = 0;
  let validatedExisting = 0;
  for (const g of selected) {
    const existing = existingByWord.get(g.word_id);
    if (existing) {
      if (existing.text !== g.proposed_fr) throw new Error(`DIVERGENCE ${g.arabic} — arrêt.`);
      if (existing.is_validated) { alreadyExists += 1; continue; }
      const { error } = await client
        .from("word_translations")
        .update({ is_validated: true, validated_at: nowIso })
        .eq("word_id", g.word_id)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id)
        .eq("is_validated", false);
      if (error) throw new Error(`update ${g.arabic} : ${error.message}`);
      validatedExisting += 1;
      continue;
    }
    const { error } = await client.from("word_translations").insert({
      word_id: g.word_id,
      language: LANGUAGE,
      text: g.proposed_fr,
      source_id: source.id,
      is_validated: true,
      validated_at: nowIso,
      editorial_notes: `Phase 30 — import contrôlé (validation humaine, décision ACCEPT_HIGH). Confiance HIGH. Glose éditoriale Hikma de FORME (jamais copiée d'une traduction d'ayah). Sourates : ${(g.surahs ?? []).join(", ")}.`,
    });
    if (error) {
      if (error.code === "23505") { alreadyExists += 1; continue; }
      throw new Error(`insert ${g.arabic} : ${error.message}`);
    }
    inserted += 1;
  }

  // 6. Post-validation.
  const afterCounters = await captureCoreCounters(client);
  const { data: verifyRows } = await client
    .from("word_translations")
    .select("word_id, text")
    .in("word_id", wordIds)
    .eq("language", LANGUAGE)
    .eq("source_id", source.id)
    .eq("is_validated", true);
  const verifiedMap = new Map((verifyRows ?? []).map((r) => [r.word_id as string, r.text as string]));

  const report = {
    phase: "30",
    mode,
    decision: "ACCEPT_HIGH_ONLY (validation humaine)",
    approved_input: selected.length,
    import: { inserted, already_exists: alreadyExists, validated_existing: validatedExisting, divergences: divergences.length },
    post_verified_validated_count: verifiedMap.size,
    non_regression: {
      word_translations_delta: (afterCounters.word_translations ?? 0) - (beforeCounters.word_translations ?? 0),
      others_unchanged: JSON.stringify(
        Object.fromEntries(Object.entries(beforeCounters).filter(([k]) => k !== "word_translations")),
      ) === JSON.stringify(
        Object.fromEntries(Object.entries(afterCounters).filter(([k]) => k !== "word_translations")),
      ),
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
  console.error("Phase 30 (HIGH) échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
