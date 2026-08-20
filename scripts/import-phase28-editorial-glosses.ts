// Phase 28 — import contrôlé des 4 gloses FR éditoriales (validation humaine).
//
// Usage :
//   npx tsx scripts/import-phase28-editorial-glosses.ts          → DRY-RUN (aucune écriture)
//   APPLY=1 npx tsx scripts/import-phase28-editorial-glosses.ts  → import réel (idempotent)
//
// Décision humaine (Phase 28) : ACCEPT les 4 propositions en niveau FORME.
//
//   ٱللَّهُ     → « Allah »
//   فِى        → « dans »
//   ٱلنَّاسِ   → « les gens »
//   وَٱلنَّاسِ → « et les gens »
//
// Périmètre STRICT : UNIQUEMENT word_translations (fr, is_validated=true).
// Aucune modification de quran_words / word_occurrences / lemmas /
// lemma_translations / word_lemma_mapping / translations / curriculum / grading /
// SRS / mastery / progression / scoring. Aucune nouvelle source linguistique.
//
// Idempotence : UNIQUE(word_id, language, source_id). RUN 2 → 0 insertion.
// Provenance : « Hikma — lexique éditorial » (source_id réel).
// Défense anti-mauvaise-identification : word_id → forme arabe réelle vérifiée
// par normalisation orthographique (jamais modifiée).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { normalizeOrthographic } from "../lib/linguistic/masaq";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const APPLY = process.env.APPLY === "1";

// word_id = UUID réels résolus en base par (surah, ayah, position). La forme
// attendue est vérifiée via sa normalisation orthographique (sans diacritiques).
const GLOSSES = [
  {
    word_id: "4695a853-6817-4275-908d-94bd025dbfa6", // ٱللَّهُ (112:1:3, 112:2:1)
    arabic_normalized: "الله",
    arabic_form: "ٱللَّهُ",
    final_gloss: "Allah",
    confidence: "HIGH",
    surahs: [112],
  },
  {
    word_id: "81039a74-2bf1-4223-b3fa-9dcea7ac433b", // فِى (113:4:4, 114:5:3)
    arabic_normalized: "في",
    arabic_form: "فِى",
    final_gloss: "dans",
    confidence: "HIGH",
    surahs: [113, 114],
  },
  {
    word_id: "c336b842-404c-43ad-93e4-6afef3e1a6cf", // ٱلنَّاسِ (114:1,2,3,5)
    arabic_normalized: "الناس",
    arabic_form: "ٱلنَّاسِ",
    final_gloss: "les gens",
    confidence: "HIGH",
    surahs: [114],
  },
  {
    word_id: "b0b403d1-7d3f-43f5-8f87-d9e190ee6429", // وَٱلنَّاسِ (114:6:3)
    arabic_normalized: "والناس",
    arabic_form: "وَٱلنَّاسِ",
    final_gloss: "et les gens",
    confidence: "HIGH",
    surahs: [114],
  },
] as const;

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
  console.log(`=== PHASE 28 — IMPORT ÉDITORIAL DES 4 GLOSES FR (${mode}) ===`);

  // 1. Source de provenance (existante).
  const { data: srcRows, error: srcErr } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources : ${srcErr.message}`);
  const source = (srcRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`STOP — source « ${SOURCE_NAME} » introuvable.`);

  // 2. Défense anti-mauvaise-identification : word_id → forme réelle.
  const wordIds = GLOSSES.map((g) => g.word_id);
  const { data: wordRows, error: wordErr } = await client
    .from("quran_words")
    .select("id, arabic, meaning, lemma_id")
    .in("id", wordIds);
  if (wordErr) throw new Error(`quran_words : ${wordErr.message}`);
  const arabicById = new Map((wordRows ?? []).map((w) => [w.id as string, w.arabic as string]));
  for (const g of GLOSSES) {
    const actual = arabicById.get(g.word_id);
    if (!actual) throw new Error(`word_id introuvable pour ${g.arabic_form}.`);
    const actualNorm = normalizeOrthographic(actual);
    if (actualNorm !== g.arabic_normalized) {
      throw new Error(
        `MISMATCH ${g.word_id} : attendu normalisé « ${g.arabic_normalized} », réel « ${actualNorm} » (${actual}) — arrêt.`,
      );
    }
    console.log(`  ✓ ${g.arabic_form} → normalisé « ${actualNorm} » (word_id ${g.word_id})`);
  }

  // 3. État existant (idempotence + détection de doublon/divergence).
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

  const plan = GLOSSES.map((g) => {
    const existing = existingByWord.get(g.word_id);
    if (existing) {
      if (existing.text !== g.final_gloss) {
        return { ...g, action: "DIVERGENCE", existing_text: existing.text };
      }
      return {
        ...g,
        action: existing.is_validated ? "ALREADY_EXISTS" : "VALIDATE_EXISTING",
        existing_text: existing.text,
      };
    }
    return { ...g, action: "INSERT", existing_text: null };
  });

  console.log("\n=== PLAN ===");
  for (const p of plan) {
    console.log(`  [${p.action}] ${p.arabic_form} → « ${p.final_gloss} » (confiance ${p.confidence})`);
  }
  const divergences = plan.filter((p) => p.action === "DIVERGENCE");
  if (divergences.length > 0) {
    for (const d of divergences) {
      console.error(`  DIVERGENCE ${d.arabic_form} : base « ${d.existing_text} » ≠ attendu « ${d.final_gloss} »`);
    }
    throw new Error("STOP — divergences détectées. Aucune écriture.");
  }

  // 4. Snapshot AVANT.
  const beforeCounters = await captureCoreCounters(client);

  if (!APPLY) {
    writeFileSync(
      "tmp/phase28-editorial-gloss-validation.json",
      JSON.stringify(
        {
          phase: "28",
          mode,
          decision: "ACCEPT (validation humaine)",
          plan,
          database_writes: 0,
          before: { counters: beforeCounters },
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    console.log("\nDRY-RUN terminé : aucune écriture. Relancer avec APPLY=1 pour importer.");
    return;
  }

  // 5. Écritures (APPLY) — additives, idempotentes.
  const nowIso = new Date().toISOString();
  let inserted = 0;
  let alreadyExists = 0;
  let validatedExisting = 0;

  for (const g of GLOSSES) {
    const existing = existingByWord.get(g.word_id);
    if (existing) {
      if (existing.text !== g.final_gloss) {
        throw new Error(`DIVERGENCE ${g.arabic_form} — arrêt.`);
      }
      if (existing.is_validated) {
        alreadyExists += 1;
        continue;
      }
      const { error } = await client
        .from("word_translations")
        .update({ is_validated: true, validated_at: nowIso })
        .eq("word_id", g.word_id)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id)
        .eq("is_validated", false);
      if (error) throw new Error(`word_translations update ${g.arabic_form} : ${error.message}`);
      validatedExisting += 1;
      continue;
    }
    const { error } = await client.from("word_translations").insert({
      word_id: g.word_id,
      language: LANGUAGE,
      text: g.final_gloss,
      source_id: source.id,
      is_validated: true,
      validated_at: nowIso,
      editorial_notes: `Phase 28 — import contrôlé (validation humaine, décision ACCEPT). Confiance ${g.confidence}. Glose éditoriale Hikma de FORME (jamais copiée d'une traduction d'ayah). Sourates : ${g.surahs.join(", ")}.`,
    });
    if (error) {
      if (error.code === "23505") {
        alreadyExists += 1;
        continue;
      }
      throw new Error(`word_translations ${g.arabic_form} : ${error.message}`);
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
  const verified = new Map((verifyRows ?? []).map((r) => [r.word_id as string, r.text as string]));

  const report = {
    phase: "28",
    mode,
    decision: "ACCEPT (validation humaine)",
    approved_input: GLOSSES.length,
    import: { inserted, already_exists: alreadyExists, validated_existing: validatedExisting, divergences: divergences.length },
    post_verify: Object.fromEntries(verified),
    non_regression: {
      core_unchanged: JSON.stringify(beforeCounters) === JSON.stringify(afterCounters),
      before: beforeCounters,
      after: afterCounters,
      delta: Object.fromEntries(
        Object.keys(beforeCounters).map((k) => [k, (afterCounters[k] ?? 0) - (beforeCounters[k] ?? 0)]),
      ),
    },
    provenance: { source_name: SOURCE_NAME, source_id: source.id },
  };
  writeFileSync("tmp/phase28-editorial-gloss-validation.json", JSON.stringify(report, null, 2) + "\n");
  console.log("\n=== RÉSULTAT APPLY ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Phase 28 échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
