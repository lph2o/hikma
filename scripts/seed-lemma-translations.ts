// Seed des gloses LEXICOGRAPHIQUES AU NIVEAU DU LEMME (Kazimirski 1860).
//
// Phase 17C (Option B) — table `lemma_translations` (migration 0021).
// Usage :
//   npm run seed:lemma-translations            # import réel (service role)
//   DRY_RUN=1 npm run seed:lemma-translations  # dry-run (aucune écriture)
//
// Idempotent : INSERT ... ON CONFLICT (lemma_id, language, source_id)
// DO NOTHING. Une seconde exécution n'insère rien de nouveau.
//
// ⚠️ RÈGLE ÉDITORIALE (garantie par la base + le script) :
//   Toutes les lignes insérées sont des PROPOSITIONS :
//     is_validated = false
//     validated_at = NULL
//   Aucune n'est validée automatiquement. La validation est une étape
//   éditoriale humaine distincte, postérieure à ce seed.
//
// ⚠️ AUCUNE GLOSE INVENTÉE : `PROPOSALS` est VIDE par défaut. Les textes
//   français humains (formulés + revus + vérifiés contre le scan) seront
//   ajoutés ici par un réviseur, puis importés.

import { createClient } from "@supabase/supabase-js";

/**
 * Propositions éditoriales — à valider humainement (jamais automatiquement).
 * La clé est le TEXTE ARABE DU LEMME (table `lemmas.arabic`, unique).
 * `fr` = texte source Kazimirski (fidèle à l'OCR, JAMAIS reformulé en glose
 *        pédagogique) — le champ `text` porte donc « ce que dit Kazimirski » ;
 *        la glose pédagogique courte sera une étape éditoriale séparée.
 * `notes` = provenance (édition, tome, page candidate, statut de vérification).
 *
 * ⚠️ SEULES les entrées dont le bloc français Kazimirski est réellement isolé
 * dans le corpus préparé (Phase 16K) sont importées. Les autres (contexte
 * partiel ou vedette non isolée) sont BLOQUÉES : importer une glose reviendrait
 * à inventer une citation — interdit. Elles sont documentées dans le rapport
 * Phase 17D et l'evidence JSON, pas ici.
 */
const PROPOSALS: Array<{ arabic: string; fr: string; notes: string | null }> = [
  {
    arabic: "عَبْد",
    fr: "1. Esclave, opp. à مملوك clave, serf … 2. Serviteur de Dieu, c.-à-d. homme",
    notes: "Kazimirski 1860 — t.2 p.150-151 (f.160-161, candidat) — texte source OCR, scan NON vérifié — SPECIALIST_REVIEW_REQUIRED — glose pédagogique à formuler séparément",
  },
  {
    arabic: "رَحْمَة",
    fr: "1. Clémence, miséricorde (de Dieu). 2. Pitié, compassion, témoignage de compassion, de condoléance. 3. Grâce, faveur.",
    notes: "Kazimirski 1860 — t.1 p.838 (f.848, candidat) — texte source OCR, scan NON vérifié — HUMAN_REVIEW_REQUIRED",
  },
  {
    arabic: "لَا",
    fr: "Non, ne, particule négative, exige que le verbe qui la suit soit mis au futur apocopé.",
    notes: "Kazimirski 1860 — t.2 section ل (page non épinglée) — texte source OCR, scan NON vérifié — SPECIALIST_REVIEW_REQUIRED (unité grammaticale)",
  },
  {
    arabic: "أَرْض",
    fr: "1. Terre, globe terrestre. … terre ferme … 3. Terre, pays, contrée.",
    notes: "Kazimirski 1860 — t.1 p.25 (f.35, candidat) — texte source OCR, scan NON vérifié — HUMAN_REVIEW_REQUIRED",
  },
];

const SOURCE_NAME = "Kazimirski — Dictionnaire arabe-français (1860)";
const LANGUAGE = "fr";
const DRY_RUN = process.env.DRY_RUN === "1";

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
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
    );
  }
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  // 1. Source Kazimirski (idempotente, créée en Phase 17C).
  const { data: sourceRows, error: sourceError } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (sourceError) throw new Error(`sources : ${sourceError.message}`);
  const source = (sourceRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // 2. Résolution des lemmas par TEXTE ARABE (clé unique de `lemmas`).
  const { data: lemmaRows, error: lemmaError } = await client
    .from("lemmas")
    .select("id, arabic")
    .in("arabic", PROPOSALS.map((p) => p.arabic));
  if (lemmaError) throw new Error(`lemmas : ${lemmaError.message}`);
  const lemmaByArabic = new Map<string, string>();
  for (const l of (lemmaRows ?? []) as Array<{ id: string; arabic: string }>) {
    lemmaByArabic.set(l.arabic.normalize("NFC"), l.id);
  }

  // 3. Insertion des PROPOSITIONS (jamais validées, idempotent).
  let inserted = 0;
  let skipped = 0;
  for (const proposal of PROPOSALS) {
    const lemmaId = lemmaByArabic.get(proposal.arabic.normalize("NFC"));
    if (!lemmaId) {
      throw new Error(`Aucun lemma pour ${JSON.stringify(proposal.arabic)}.`);
    }
    if (DRY_RUN) {
      console.log(`[dry-run] lemma ${proposal.arabic} → « ${proposal.fr} » (source_id=${source.id})`);
      continue;
    }
    const { error } = await client.from("lemma_translations").insert({
      lemma_id: lemmaId,
      language: LANGUAGE,
      text: proposal.fr,
      source_id: source.id,
      is_validated: false,
      validated_at: null,
      editorial_notes: proposal.notes,
    });
    if (error) {
      if (error.code === "23505") {
        skipped += 1; // déjà présente (idempotent)
        continue;
      }
      throw new Error(`lemma_translations ${proposal.arabic} : ${error.message}`);
    }
    inserted += 1;
  }

  console.log(
    `\nSeed lemme terminé${DRY_RUN ? " (DRY-RUN, aucune écriture)" : ""} : ` +
      `${inserted} insérée(s), ${skipped} déjà présente(s). ` +
      `Aucune traduction n'est validée (is_validated=false).`,
  );
}

main().catch((err) => {
  console.error("Seed lemme échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
