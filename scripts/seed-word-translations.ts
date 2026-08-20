// Seed du lexique français Hikma — 8 premières PROPOSITIONS éditoriales.
//
// Phase 7 (Voie B). Usage :
//   npm run seed:word-translations
//
// Idempotent : INSERT ... ON CONFLICT (word_id, language, source_id)
// DO NOTHING. Une seconde exécution n'insère rien de nouveau.
//
// ⚠️ RÈGLE ÉDITORIALE (garantie par la base + le script) :
//   Toutes les lignes insérées sont des PROPOSITIONS :
//     is_validated = false
//     validated_at = NULL
//   Aucune n'est validée automatiquement. La validation est une étape
//   éditoriale humaine distincte, postérieure à ce seed.
//
// Les word_id sont résolus depuis `lesson_words` (source de vérité du
// curriculum) puis appariés aux propositions par forme arabe normalisée
// (NFC). Le texte arabe stocké dans `quran_words` n'est jamais modifié.

import { createClient } from "@supabase/supabase-js";

/**
 * Propositions éditoriales — à valider humainement (jamais automatiquement).
 * La clé est la forme arabe normalisée NFC du mot réel du curriculum.
 */
const PROPOSALS: Array<{ arabic: string; fr: string; notes: string | null }> = [
  { arabic: "بِسْمِ", fr: "Au nom de", notes: "Proposition — à valider" },
  { arabic: "ٱللَّهِ", fr: "d'Allah", notes: "Proposition — à valider" },
  { arabic: "ٱلرَّحْمَـٰنِ", fr: "le Tout Miséricordieux", notes: "Proposition — à valider" },
  { arabic: "ٱلرَّحِيمِ", fr: "le Très Miséricordieux", notes: "Proposition — à valider" },
  { arabic: "ٱلْحَمْدُ", fr: "la louange", notes: "Proposition — à valider" },
  { arabic: "لِلَّهِ", fr: "à Allah", notes: "Proposition — à valider" },
  { arabic: "رَبِّ", fr: "le Seigneur", notes: "Proposition — à valider" },
  { arabic: "ٱلْعَـٰلَمِينَ", fr: "des mondes", notes: "Proposition — à valider" },
];

const SOURCE_NAME = "Hikma — lexique éditorial";

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

  // 1. Source éditoriale Hikma.
  const { data: sourceRows, error: sourceError } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .limit(1);
  if (sourceError) throw new Error(`sources : ${sourceError.message}`);
  const source = (sourceRows as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // 2. Mots réels du curriculum (distincts) via lesson_words.
  const { data: lwRows, error: lwError } = await client
    .from("lesson_words")
    .select("word_id, lessons!inner(status, slug)");
  if (lwError) throw new Error(`lesson_words : ${lwError.message}`);

  const rows = (lwRows ?? []) as Array<{
    word_id: string;
    lessons:
      | { status: string; slug: string }
      | Array<{ status: string; slug: string }>
      | null;
  }>;
  const wordIdSet = new Set<string>();
  for (const row of rows) {
    const lessons = Array.isArray(row.lessons) ? row.lessons : row.lessons ? [row.lessons] : [];
    if (lessons.some((l) => l.status === "published")) wordIdSet.add(row.word_id);
  }
  const wordIds = [...wordIdSet];
  if (wordIds.length !== PROPOSALS.length) {
    throw new Error(
      `Attendu ${PROPOSALS.length} mots distincts du curriculum, trouvé ${wordIds.length}.`,
    );
  }

  // 3. Formes arabes réelles (jamais modifiées) → Map normalisée NFC.
  const { data: wordRows, error: wordError } = await client
    .from("quran_words")
    .select("id, arabic")
    .in("id", wordIds);
  if (wordError) throw new Error(`quran_words : ${wordError.message}`);

  const byNfc = new Map<string, string>();
  for (const w of (wordRows ?? []) as Array<{ id: string; arabic: string }>) {
    const nfc = w.arabic.normalize("NFC");
    if (byNfc.has(nfc)) {
      throw new Error(`Doublon NFC : ${JSON.stringify(nfc)}`);
    }
    byNfc.set(nfc, w.id);
  }

  // 4. Insertion des propositions (ON CONFLICT DO NOTHING, jamais validées).
  let inserted = 0;
  let skipped = 0;
  for (const proposal of PROPOSALS) {
    const wordId = byNfc.get(proposal.arabic.normalize("NFC"));
    if (!wordId) {
      throw new Error(`Aucun quran_word pour ${JSON.stringify(proposal.arabic)}.`);
    }
    const { error } = await client.from("word_translations").insert({
      word_id: wordId,
      language: "fr",
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
      throw new Error(`word_translations ${proposal.arabic} : ${error.message}`);
    }
    inserted += 1;
  }

  console.log(
    `\nSeed terminé : ${inserted} insérée(s), ${skipped} déjà présente(s). ` +
      `Aucune traduction n'est validée (is_validated=false).`,
  );
}

main().catch((err) => {
  console.error("Seed échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
