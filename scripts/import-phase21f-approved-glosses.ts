// Phase 21F — import contrôlé des gloses approuvées en Phase 21E + 21E-B.
//
// Usage :
//   DRY_RUN=1 npm run tsx scripts/import-phase21f-approved-glosses.ts   (ou npx tsx …)
//   npx tsx scripts/import-phase21f-approved-glosses.ts                  → import réel
//
// Source de vérité éditoriale : tmp/phase21e-human-gloss-review.json (ready_for_import)
// + tmp/phase21e-b-yakun-final-review.json (يَكُن → « être »).
//
// Périmètre STRICT (aucune nouvelle décision sémantique) :
//   - word_translations  : 45 gloses de FORME FR validées (40 ACCEPT + 4 MODIFY + يَكُن) ;
//   - word_lemma_mapping : 1 mapping éditorial وَٱلنَّاسِ → نَاس (réutilise la glose existante).
// AUCUN nouveau lemme · AUCUNE lemma_translation · AUCUNE traduction d'ayah copiée ·
// AUCUNE modification de quran_words/word_occurrences/translations/audio/Fātiḥah.
//
// Idempotent : UNIQUE(word_id, language, source_id) + ON CONFLICT ; UNIQUE(word_id)
// sur word_lemma_mapping. RUN 2 → 0 insertion, 0 modification destructive.
//
// Source de provenance : « Hikma — lexique éditorial » (source_id réel, jamais 31/9001/20/153).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const APPLY = process.env.APPLY === "1";

type ReadyEntry = {
  quran_word_id: string;
  arabic_form: string;
  final_gloss: string | null;
  target_table: string;
  decision: string;
  confidence: string;
};

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, service, { auth: { persistSession: false } });
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  console.log(`=== PHASE 21F — IMPORT CONTRÔLÉ (${mode}) ===`);

  // 0. Charger les décisions éditoriales (aucune reconstruction).
  const e21 = JSON.parse(readFileSync("tmp/phase21e-human-gloss-review.json", "utf8"));
  const e21b = JSON.parse(readFileSync("tmp/phase21e-b-yakun-final-review.json", "utf8"));
  const ready: ReadyEntry[] = e21.ready_for_import;

  // word_translations : entrées 21E ciblant la table + يَكُن (21E-B).
  const wordGlosses: Array<{
    quran_word_id: string;
    arabic_form: string;
    final_gloss: string;
    decision: string;
    confidence: string;
    source_decision: string;
  }> = [];
  const moveToLemma: ReadyEntry[] = [];
  for (const r of ready) {
    if (r.target_table === "word_translations") {
      wordGlosses.push({
        quran_word_id: r.quran_word_id,
        arabic_form: r.arabic_form,
        final_gloss: r.final_gloss ?? "",
        decision: r.decision,
        confidence: r.confidence,
        source_decision: "21E",
      });
    } else {
      moveToLemma.push(r);
    }
  }
  // يَكُن (21E-B, MODIFY → « être », stockage FORME).
  wordGlosses.push({
    quran_word_id: e21b.quran_word_id,
    arabic_form: e21b.arabic_form,
    final_gloss: e21b.final_gloss,
    decision: e21b.decision,
    confidence: e21b.confidence,
    source_decision: "21E-B",
  });

  console.log(`word_translations à importer : ${wordGlosses.length}`);
  console.log(`word_lemma_mapping à importer : ${moveToLemma.length}`);
  console.log(`total décisions : ${wordGlosses.length + moveToLemma.length}`);

  // 1. Source de provenance (réelle, existante).
  const { data: srcRows, error: srcErr } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources : ${srcErr.message}`);
  const source = (srcRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`STOP — source « ${SOURCE_NAME} » introuvable.`);

  // 2. Défense anti-mauvaise-identification : word_id → forme arabe réelle (NFC).
  const allWordIds = [...new Set([...wordGlosses.map((g) => g.quran_word_id), ...moveToLemma.map((m) => m.quran_word_id)])];
  const { data: wordRows, error: wordErr } = await client
    .from("quran_words")
    .select("id, arabic")
    .in("id", allWordIds);
  if (wordErr) throw new Error(`quran_words : ${wordErr.message}`);
  const arabicById = new Map((wordRows ?? []).map((w) => [w.id as string, w.arabic as string]));
  for (const g of [...wordGlosses, ...moveToLemma]) {
    const actual = arabicById.get(g.quran_word_id);
    if (!actual) throw new Error(`word_id introuvable pour ${JSON.stringify(g.arabic_form)}.`);
    if (actual.normalize("NFC") !== g.arabic_form.normalize("NFC")) {
      throw new Error(`MISMATCH ${g.quran_word_id} : attendu ${JSON.stringify(g.arabic_form)}, réel ${JSON.stringify(actual)} — arrêt.`);
    }
  }

  // 3. Résolution du lemme نَاس (réutilisation, pas de nouveau lemme).
  let nasLemmaId: string | null = null;
  if (moveToLemma.length > 0) {
    const { data: lm, error: lmErr } = await client
      .from("lemmas")
      .select("id, arabic")
      .eq("arabic", "نَاس")
      .limit(1);
    if (lmErr) throw new Error(`lemmas : ${lmErr.message}`);
    const lemma = (lm as Array<{ id: string; arabic: string }> | null)?.[0];
    if (!lemma) throw new Error(`STOP — lemme « نَاس » introuvable pour le mapping.`);
    nasLemmaId = lemma.id;
  }

  // 4. État existant (idempotence + doublons).
  const { data: wtRows, error: wtErr } = await client
    .from("word_translations")
    .select("word_id, text, is_validated")
    .in("word_id", wordGlosses.map((g) => g.quran_word_id))
    .eq("language", LANGUAGE)
    .eq("source_id", source.id);
  if (wtErr) throw new Error(`word_translations : ${wtErr.message}`);
  const existingByWord = new Map(
    (wtRows ?? []).map((r) => [r.word_id as string, r as { text: string; is_validated: boolean }]),
  );

  const { data: mapRows, error: mapErr } = await client
    .from("word_lemma_mapping")
    .select("word_id")
    .in("word_id", moveToLemma.map((m) => m.quran_word_id));
  if (mapErr) throw new Error(`word_lemma_mapping : ${mapErr.message}`);
  const existingMappings = new Set((mapRows ?? []).map((r) => r.word_id));

  // 5. Plan + DRY-RUN.
  type PlanEntry = {
    quran_word_id: string;
    arabic_form: string;
    final_gloss: string;
    decision: string;
    confidence: string;
    source_decision: string;
    action: "INSERT" | "ALREADY_EXISTS" | "VALIDATE_EXISTING" | "DIVERGENCE";
    existing_text: string | null;
  };
  const plan: PlanEntry[] = wordGlosses.map((g) => {
    const existing = existingByWord.get(g.quran_word_id);
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
  const mappingPlan = moveToLemma.map((m) => ({
    ...m,
    action: existingMappings.has(m.quran_word_id) ? "ALREADY_EXISTS" : "INSERT",
  }));

  console.log("\n=== PLAN ===");
  for (const p of plan) {
    console.log(`  [${p.action}] ${p.arabic_form} → « ${p.final_gloss} » (${p.source_decision}/${p.decision})`);
  }
  for (const m of mappingPlan) {
    console.log(`  [${m.action}] mapping ${m.arabic_form} → نَاس (${m.decision})`);
  }
  const divergences = plan.filter((p) => p.action === "DIVERGENCE");
  if (divergences.length > 0) {
    for (const d of divergences) {
      console.error(`  DIVERGENCE ${d.arabic_form} : base « ${d.existing_text} » ≠ attendu « ${d.final_gloss} »`);
    }
    throw new Error("STOP — divergences détectées. Aucune écriture.");
  }

  if (!APPLY) {
    console.log("\nDRY-RUN : aucune écriture. Relancer sans DRY_RUN pour appliquer (APPLY=1).");
    return;
  }

  // 6. Écritures (APPLY) — additives, idempotentes.
  const nowIso = new Date().toISOString();
  let inserted = 0;
  let alreadyExists = 0;
  let validatedExisting = 0;
  let mappingInserted = 0;
  let mappingAlready = 0;

  for (const g of wordGlosses) {
    const existing = existingByWord.get(g.quran_word_id);
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
        .eq("word_id", g.quran_word_id)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id)
        .eq("is_validated", false);
      if (error) throw new Error(`word_translations update ${g.arabic_form} : ${error.message}`);
      validatedExisting += 1;
      continue;
    }
    const { error } = await client.from("word_translations").insert({
      word_id: g.quran_word_id,
      language: LANGUAGE,
      text: g.final_gloss,
      source_id: source.id,
      is_validated: true,
      validated_at: nowIso,
      editorial_notes: `Phase 21F — import contrôlé. Décision ${g.decision} (${g.source_decision}). Confiance ${g.confidence}. Glose éditoriale Hikma issue de l'analyse multi-traductions (jamais copiée d'une traduction d'ayah).`,
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

  for (const m of moveToLemma) {
    if (existingMappings.has(m.quran_word_id)) {
      mappingAlready += 1;
      continue;
    }
    const { error } = await client.from("word_lemma_mapping").upsert(
      {
        word_id: m.quran_word_id,
        lemma_id: nasLemmaId,
        source_id: source.id,
        mapping_method: "editorial",
        confidence: "safe",
        evidence: "وَٱلنَّاسِ = و (conjonction) + ال + ناس ; lemme نَاس existant avec glose FR validée « gens / hommes ». Regroupement lexical (21E MOVE_TO_LEMMA).",
        editorial_notes: "Phase 21F — réutilisation du lemme نَاس pour وَٱلنَّاسِ (aucun nouveau lemme, aucune lemma_translation).",
      },
      { onConflict: "word_id", ignoreDuplicates: true },
    );
    if (error) throw new Error(`word_lemma_mapping ${m.arabic_form} : ${error.message}`);
    mappingInserted += 1;
  }

  // 7. Vérification post-import (compteurs).
  const { count: wtCount } = await client
    .from("word_translations")
    .select("id", { count: "exact", head: true })
    .eq("language", LANGUAGE)
    .eq("source_id", source.id)
    .eq("is_validated", true);
  const { data: verifyRows } = await client
    .from("word_translations")
    .select("word_id")
    .in("word_id", wordGlosses.map((g) => g.quran_word_id))
    .eq("language", LANGUAGE)
    .eq("source_id", source.id)
    .eq("is_validated", true);
  const verified = new Set((verifyRows ?? []).map((r) => r.word_id));

  const summary = {
    phase: "21F",
    mode,
    approved_input: wordGlosses.length + moveToLemma.length,
    word_translations: {
      candidates: wordGlosses.length,
      inserted,
      already_exists: alreadyExists,
      validated_existing: validatedExisting,
      divergences: divergences.length,
    },
    word_lemma_mapping: {
      candidates: moveToLemma.length,
      inserted: mappingInserted,
      already_exists: mappingAlready,
    },
    post_verify: {
      fr_validated_total: wtCount ?? 0,
      imported_forms_resolved: verified.size,
      expected_forms: wordGlosses.length,
    },
    idempotence_note: "Relancer ce script doit produire 0 insertion nouvelle.",
  };

  writeFileSync("tmp/phase21f-import-summary.json", JSON.stringify(summary, null, 2) + "\n");
  console.log("\n=== RÉSULTAT APPLY ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("Phase 21F échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
