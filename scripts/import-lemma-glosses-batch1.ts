// Phase 88B — Import batch 1 de gloses de lemmes (TOP 50 LEMMES).
//
// SAFE BY DEFAULT : DRY_RUN=true. Aucune écriture sans APPLY=1 explicite.
// Pattern éprouvé (Phase 31) : vérification anti-divergence + idempotence.
//
// Usage :
//   npx tsx scripts/import-lemma-glosses-batch1.ts                         → DRY-RUN
//   APPLY=1 npx tsx scripts/import-lemma-glosses-batch1.ts                 → import réel
//   APPLY=1 VALIDATE=1 npx tsx scripts/import-lemma-glosses-batch1.ts      → import + validation
//
// Source des propositions : reports/phase-88b-batch1-lemma-proposals.json
// (généré par scripts/audit-lemma-glosses-batch1.ts)
//
// ⚠️ RÈGLE ÉDITORIALE : toutes les lignes importées sont is_validated=false.
// La validation (is_validated=true) nécessite VALIDATE=1 explicite.
//
// Idempotence : UNIQUE(lemma_id, language, source_id). RUN 2 → 0 insertion.
// Rollback : identifier les lignes par (source_id, language, created_at > timestamp).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const APPLY = process.env.APPLY === "1";
const VALIDATE = process.env.VALIDATE === "1";
const INPUT = "reports/phase-88b-batch1-lemma-proposals.json";
const OUTPUT = "reports/phase-88b-batch1-import-result.json";

type Proposal = {
  rank: number;
  lemmaId: string;
  arabic: string;
  editorialClass: "SAFE" | "REVIEW_REQUIRED" | "HIGH_RISK" | "DO_NOT_IMPORT";
  proposedGloss: string | null;
  formsMissing: number;
};

type Report = {
  phase: string;
  top50Lemmas: Proposal[];
};

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch { /* ok */ }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  }
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  const mode = APPLY ? (VALIDATE ? "APPLY+VALIDATE" : "APPLY") : "DRY-RUN";
  const timestamp = new Date().toISOString();
  console.log(`=== PHASE 88B — IMPORT LEMMA GLOSSES BATCH 1 (${mode}) ===`);

  // 1. Lecture des propositions.
  const raw = JSON.parse(readFileSync(INPUT, "utf8")) as Report;
  const proposals = raw.top50Lemmas.filter(
    (p) => p.editorialClass !== "DO_NOT_IMPORT" && p.proposedGloss != null && p.formsMissing > 0,
  );

  // SAFE-only si pas de VALIDATE explicite.
  const toImport = VALIDATE
    ? proposals
    : proposals.filter((p) => p.editorialClass === "SAFE");

  if (toImport.length === 0) {
    console.log("Aucune proposition à importer (toutes déjà couvertes ou sans glose).");
    return;
  }
  console.log(`Propositions à importer : ${toImport.length} (SAFE: ${toImport.filter((p) => p.editorialClass === "SAFE").length}, REVIEW: ${toImport.filter((p) => p.editorialClass === "REVIEW_REQUIRED").length})`);

  // 2. Source éditoriale.
  const { data: srcRows, error: srcErr } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (srcErr) throw new Error(`sources: ${srcErr.message}`);
  const source = (srcRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // 3. Vérification des lemma_ids.
  const lemmaIds = [...new Set(toImport.map((p) => p.lemmaId))];
  const { data: lemmaRows, error: lemmaErr } = await client
    .from("lemmas")
    .select("id, arabic")
    .in("id", lemmaIds);
  if (lemmaErr) throw new Error(`lemmas: ${lemmaErr.message}`);
  const lemmaById = new Map((lemmaRows ?? []).map((l) => [l.id as string, l.arabic as string]));
  for (const p of toImport) {
    if (!lemmaById.has(p.lemmaId)) throw new Error(`Lemma ${p.lemmaId} (${p.arabic}) introuvable.`);
  }

  // 4. État existant (anti-divergence).
  const { data: existingRows, error: existErr } = await client
    .from("lemma_translations")
    .select("lemma_id, text, is_validated")
    .in("lemma_id", lemmaIds)
    .eq("language", LANGUAGE)
    .eq("source_id", source.id);
  if (existErr) throw new Error(`lemma_translations: ${existErr.message}`);
  const existingByLemma = new Map(
    (existingRows ?? []).map((r) => [r.lemma_id as string, r as { text: string; is_validated: boolean }]),
  );

  let insertCount = 0;
  let alreadyExistsCount = 0;
  let validateCount = 0;
  let divergenceCount = 0;

  for (const p of toImport) {
    const existing = existingByLemma.get(p.lemmaId);
    if (existing) {
      if (existing.text !== p.proposedGloss) {
        console.error(`  DIVERGENCE ${p.arabic}: base « ${existing.text} » ≠ proposé « ${p.proposedGloss} »`);
        divergenceCount++;
        continue;
      }
      if (existing.is_validated) {
        alreadyExistsCount++;
        continue;
      }
      if (VALIDATE) validateCount++;
      continue;
    }

    if (APPLY) {
      const { error: insErr } = await client.from("lemma_translations").insert({
        lemma_id: p.lemmaId,
        language: LANGUAGE,
        text: p.proposedGloss,
        source_id: source.id,
        is_validated: false,
        validated_at: null,
        editorial_notes: `Phase 88B — Batch 1 — import ${timestamp}`,
      });
      if (insErr) {
        if (insErr.code === "23505") {
          alreadyExistsCount++;
        } else {
          throw new Error(`lemma_translations insert ${p.arabic}: ${insErr.message}`);
        }
      } else {
        insertCount++;
      }
    } else {
      insertCount++;
    }
  }

  if (divergenceCount > 0) {
    throw new Error(`STOP — ${divergenceCount} divergences détectées. Aucune écriture.`);
  }

  // 5. Validation (si VALIDATE=1).
  if (APPLY && VALIDATE && validateCount > 0) {
    const nowIso = new Date().toISOString();
    for (const p of toImport) {
      const existing = existingByLemma.get(p.lemmaId);
      if (!existing || existing.is_validated) continue;
      const { error: updErr } = await client
        .from("lemma_translations")
        .update({ is_validated: true, validated_at: nowIso })
        .eq("lemma_id", p.lemmaId)
        .eq("language", LANGUAGE)
        .eq("source_id", source.id)
        .eq("is_validated", false);
      if (updErr) throw new Error(`lemma_translations validate ${p.arabic}: ${updErr.message}`);
    }
  }

  const result = {
    phase: "88B",
    batch: 1,
    mode,
    timestamp,
    summary: {
      total: toImport.length,
      inserted: insertCount,
      alreadyExists: alreadyExistsCount,
      validated: APPLY && VALIDATE ? validateCount : 0,
      divergences: divergenceCount,
    },
    rollback:
      "DELETE FROM lemma_translations WHERE source_id = (SELECT id FROM sources WHERE name = 'Hikma — lexique éditorial') AND language = 'fr' AND created_at > '" + timestamp + "'",
  };

  console.log(`\n=== RÉSULTAT ===`);
  console.log(JSON.stringify(result.summary, null, 2));
  if (!APPLY) console.log("\nDRY-RUN terminé. Relancer avec APPLY=1 pour importer.");

  writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n");
  console.log(`Rapport → ${OUTPUT}`);
}

main().catch((err) => {
  console.error("Phase 88B import échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});