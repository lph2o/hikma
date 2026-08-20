// Générateur idempotent du pipeline multi-sourates (Phase 21B).
//
// Les mots et versets sont toujours résolus depuis les tables Quran existantes.
// Aucun texte arabe, sens ou traduction n'est construit par ce script.
//
// Usage :
//   npm run seed:multisurah -- --dry-run
//   npm run seed:multisurah -- --surahs=112,113,114,108
//
// Phase 21B : le défaut est limité aux QUATRE sourates pilotes (112, 113, 114,
// 108). Al-Fātiḥah (1) possède un parcours éditorial verrouillé
// (`quran-vocabulary`) et n'est JAMAIS régénérée (`isEditorialSurah`).
//
// Idempotence : upsert sur les clés naturelles (slug / path_id+slug /
// unit_id+slug) + suppression/réinsertion idempotente de lesson_words. Une
// seconde exécution produit un état stable, sans doublon.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isEditorialSurah,
  planSurahCurriculum,
  type SurahCurriculumPlan,
} from "../lib/learning/surah-curriculum";

/** Sourates pilotes Phase 21B (génération contrôlée, pas d'autres sourates). */
const PILOT_SURAHS = [112, 113, 114, 108];

type Surah = { id: string; number: number; name_transliteration: string | null };
type Ayah = { id: string; ayah_number: number };
type Occurrence = { position: number; word_id: string };

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : les variables d'environnement déjà présentes suffisent.
    }
  }
}

function requestedSurahs(): number[] {
  const raw = process.argv.find((arg) => arg.startsWith("--surahs="))?.slice(9);
  const values = raw ? raw.split(",").map(Number) : PILOT_SURAHS;
  const unique = [...new Set(values)].filter((value) => value >= 1 && value <= 114);
  if (unique.length === 0) throw new Error("--surahs doit contenir des numéros entre 1 et 114.");
  return unique;
}

function isDryRun(): boolean {
  return process.argv.includes("--dry-run");
}

async function fetchSurah(client: SupabaseClient, number: number): Promise<Surah> {
  const { data, error } = await client
    .from("surahs")
    .select("id, number, name_transliteration")
    .eq("number", number)
    .single();
  if (error || !data) throw new Error(`Sourate ${number} introuvable : ${error?.message ?? "aucune donnée"}`);
  return data as Surah;
}

/** Mots distincts (ordonnés par position) de chaque verset d'une sourate. */
async function fetchAyahWords(client: SupabaseClient, surahId: string): Promise<Map<number, string[]>> {
  const { data: ayahs, error: ayahError } = await client
    .from("ayahs")
    .select("id, ayah_number")
    .eq("surah_id", surahId)
    .order("ayah_number", { ascending: true });
  if (ayahError) throw new Error(`Versets : ${ayahError.message}`);

  const byAyah = new Map<number, string[]>();
  for (const ayah of (ayahs ?? []) as Ayah[]) {
    const { data: occurrences, error } = await client
      .from("word_occurrences")
      .select("position, word_id")
      .eq("ayah_id", ayah.id)
      .order("position", { ascending: true });
    if (error) throw new Error(`Occurrences ${ayah.ayah_number} : ${error.message}`);
    byAyah.set(ayah.ayah_number, [
      ...new Set((occurrences ?? []).map((row) => (row as Occurrence).word_id)),
    ]);
  }
  return byAyah;
}

/** Écrit le plan d'une sourate en base (upserts idempotents). */
async function writePlan(
  client: SupabaseClient,
  plan: SurahCurriculumPlan,
  dryRun: boolean,
  ayahCount: number,
): Promise<void> {
  if (dryRun) {
    console.log(`DRY-RUN · ${plan.path.slug} · ${plan.lessons.length} leçons potentielles`);
    return;
  }

  const { data: paths, error: pathError } = await client
    .from("learning_paths")
    .upsert(plan.path, { onConflict: "slug" })
    .select("id")
    .single();
  if (pathError || !paths) throw new Error(`Parcours ${plan.path.slug} : ${pathError?.message ?? "échec"}`);

  const { data: units, error: unitError } = await client
    .from("units")
    .upsert({ ...plan.unit, path_id: (paths as { id: string }).id }, { onConflict: "path_id,slug" })
    .select("id")
    .single();
  if (unitError || !units) throw new Error(`Unité ${plan.unit.slug} : ${unitError?.message ?? "échec"}`);
  const unitId = (units as { id: string }).id;

  for (const lesson of plan.lessons) {
    const { data: lessons, error: lessonError } = await client
      .from("lessons")
      .upsert(
        {
          unit_id: unitId,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          objective: lesson.objective,
          difficulty: lesson.difficulty,
          sort_order: lesson.sort_order,
          status: "published",
        },
        { onConflict: "unit_id,slug" },
      )
      .select("id")
      .single();
    if (lessonError || !lessons) throw new Error(`Leçon ${lesson.slug} : ${lessonError?.message ?? "échec"}`);
    const lessonId = (lessons as { id: string }).id;

    // Nettoyage idempotent puis insertion de la liste à jour (lesson_words n'est
    // référencée par aucune FK entrante → suppression/insertion sans risque).
    await client.from("lesson_words").delete().eq("lesson_id", lessonId);
    const { error: wordsError } = await client.from("lesson_words").insert(
      lesson.words.map((word) => ({
        lesson_id: lessonId,
        word_id: word.word_id,
        position: word.position,
        is_new: word.is_new,
        importance: 1,
      })),
    );
    if (wordsError) throw new Error(`Mots ${lesson.slug} : ${wordsError.message}`);
  }
  console.log(`✅ ${plan.path.slug} · ${plan.lessons.length} leçons (${ayahCount} versets)`);
}

async function seedSurah(client: SupabaseClient, surah: Surah, dryRun: boolean): Promise<void> {
  // Parcours éditorial verrouillé : ne jamais régénérer Al-Fātiḥah.
  if (isEditorialSurah(surah.number)) {
    console.log(`⏭  ${surah.number} — parcours éditorial existant conservé`);
    return;
  }

  const wordsByAyah = await fetchAyahWords(client, surah.id);
  if (wordsByAyah.size === 0) throw new Error(`Sourate ${surah.number} sans versets importés.`);

  const plan = planSurahCurriculum(surah, wordsByAyah);
  await writePlan(client, plan, dryRun, wordsByAyah.size);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });
  for (const number of requestedSurahs()) await seedSurah(client, await fetchSurah(client, number), isDryRun());
}

main().catch((error) => {
  console.error("Seed multi-sourates échoué :", error instanceof Error ? error.message : error);
  process.exit(1);
});
