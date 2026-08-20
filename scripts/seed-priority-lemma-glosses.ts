// Phase 21B-F — import + validation des 4 gloses prioritaires.
//
// Usage :
//   DRY_RUN=1 npm run seed:priority-lemma-glosses   → dry-run (aucune écriture)
//   npm run seed:priority-lemma-glosses              → import + validation réels
//
// Périmètre STRICT (Phase 21B-F) : UNIQUEMENT رَبّ / الله / الرَّحْمَـٰن / الْحَمْد.
// لِلَّه est EXCLU (reste REVIEW_REQUIRED). Aucun autre lemme n'est touché.
//
// Idempotent : une seconde exécution n'insère et ne valide rien de nouveau.
// Double garde de validation : UPDATE ... WHERE id = exact_id AND is_validated = false.

import { createClient } from "@supabase/supabase-js";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const DRY_RUN = process.env.DRY_RUN === "1";

/**
 * Gloses autorisées par Phase 21B-E / 21B-F (texte EXACT, jamais reformulé ici).
 * `arabic` = texte arabe du lemme (table `lemmas.arabic`, clé unique).
 */
const GLOSSES: Array<{ arabic: string; text: string; notes: string }> = [
  {
    arabic: "رَبّ",
    text: "Seigneur / maître",
    notes:
      "Phase 21B-E — VALIDATE_CANDIDATE (high). Noyau « Seigneur » convergent : Hamidullah « Seigneur », Kazimirski 1869 « Seigneur / maître », Sahih « Lord », Piccardo « Signore ». Double formulation couvrant la variation sans sur-traduction.",
  },
  {
    arabic: "الله",
    text: "Allah",
    notes:
      "Phase 21B-E — VALIDATE_CANDIDATE (high). Nom propre (translittération standard) — usage Hamidullah « Allah » retenu ; Kazimirski 1869 « Dieu » documenté non retenu (cohérence avec la référence Hikma).",
  },
  {
    arabic: "الرَّحْمَـٰن",
    text: "le Tout-Miséricordieux",
    notes:
      "Phase 21B-E — VALIDATE_CANDIDATE (high). Consensus des traductions sur « Miséricordieux » (Hamidullah « le Tout Miséricordieux », Kazimirski « le Miséricordieux / le Clément », Piccardo « il Compassionevole »). Divergence WBW EN « Gracious » documentée, non suivie.",
  },
  {
    arabic: "الْحَمْد",
    text: "louange",
    notes:
      "Phase 21B-E — VALIDATE_CANDIDATE (high). Noyau lexical « louange » (Hamidullah « Louange ») ; la formule WBW EN « All praises and thanks » est réduite au noyau (anti-réduction documentée).",
  },
];

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
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  }
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  // 1. Source éditoriale (réelle, existante).
  const { data: sourceRows, error: sourceError } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (sourceError) throw new Error(`sources : ${sourceError.message}`);
  const source = (sourceRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // 2. Résolution des lemmas par texte arabe (clé unique).
  const { data: lemmaRows, error: lemmaError } = await client
    .from("lemmas")
    .select("id, arabic")
    .in("arabic", GLOSSES.map((g) => g.arabic));
  if (lemmaError) throw new Error(`lemmas : ${lemmaError.message}`);
  const lemmaByArabic = new Map<string, string>();
  for (const l of (lemmaRows ?? []) as Array<{ id: string; arabic: string }>) {
    lemmaByArabic.set(l.arabic.normalize("NFC"), l.id);
  }

  let inserted = 0;
  let skippedInsert = 0;
  let validated = 0;
  let alreadyValidated = 0;

  for (const gloss of GLOSSES) {
    const lemmaId = lemmaByArabic.get(gloss.arabic.normalize("NFC"));
    if (!lemmaId) throw new Error(`Aucun lemma pour ${JSON.stringify(gloss.arabic)}.`);

    if (DRY_RUN) {
      console.log(
        `[dry-run] ${gloss.arabic} → « ${gloss.text} » (fr, source_id=${source.id}, is_validated=false → true)`,
      );
      continue;
    }

    // ÉTAPE 2 — import (is_validated=false) si absent. Idempotent (23505).
    const { error: insErr } = await client.from("lemma_translations").insert({
      lemma_id: lemmaId,
      language: LANGUAGE,
      text: gloss.text,
      source_id: source.id,
      is_validated: false,
      validated_at: null,
      editorial_notes: gloss.notes,
    });
    if (insErr) {
      if (insErr.code === "23505") {
        skippedInsert += 1; // déjà présente
      } else {
        throw new Error(`lemma_translations ${gloss.arabic} : ${insErr.message}`);
      }
    } else {
      inserted += 1;
    }

    // Récupère la ligne EXACTE (par UNIQUE(lemma_id, language, source_id)).
    const { data: row, error: rowErr } = await client
      .from("lemma_translations")
      .select("id, is_validated, text")
      .eq("lemma_id", lemmaId)
      .eq("language", LANGUAGE)
      .eq("source_id", source.id)
      .limit(1);
    if (rowErr) throw new Error(`lemma_translations read : ${rowErr.message}`);
    const r = (row as Array<{ id: string; is_validated: boolean; text: string }> | null)?.[0];
    if (!r) throw new Error(`Ligne introuvable après import pour ${gloss.arabic}.`);

    // Contrôle de divergence : ne jamais écraser silencieusement un texte différent.
    if (r.text !== gloss.text) {
      throw new Error(
        `DIVERGENCE ${gloss.arabic} : texte en base « ${r.text} » ≠ attendu « ${gloss.text} » — arrêt.`,
      );
    }

    // ÉTAPE 3 — validation effective (double garde id + is_validated=false).
    if (r.is_validated) {
      alreadyValidated += 1;
      continue;
    }
    const { error: updErr } = await client
      .from("lemma_translations")
      .update({ is_validated: true, validated_at: new Date().toISOString() })
      .eq("id", r.id)
      .eq("is_validated", false);
    if (updErr) throw new Error(`lemma_translations update ${gloss.arabic} : ${updErr.message}`);
    validated += 1;
  }

  console.log(
    `\nPhase 21B-F terminée${DRY_RUN ? " (DRY-RUN, aucune écriture)" : ""} : ` +
      `importées=${inserted}, déjà présentes=${skippedInsert}, ` +
      `validées=${validated}, déjà validées=${alreadyValidated}.`,
  );
}

main().catch((err) => {
  console.error("Phase 21B-F échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
