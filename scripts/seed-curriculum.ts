// Seed du curriculum Al-Fatiha (Phase 23F — parcours cumulatif complet ;
// Phase 23F-B — réduction de la charge cognitive).
//
// Usage :
//   npm run seed:curriculum
//
// Idempotent : s'appuie sur les clés naturelles uniques (slug) et les
// contraintes UNIQUE des tables. Une seconde exécution met à jour sans créer
// de doublons. Les mots référencés sont résolus depuis les occurrences RÉELLES
// d'Al-Fatiha — aucun mot inventé, aucune chaîne arabe codée en dur.
//
// Progression CUMULATIVE : chaque leçon introduit les mots d'un verset
// (is_new = true) puis RÉINTRODUIT un nombre PLAFONNÉ de mots déjà vus
// (is_new = false), pris dans les leçons les plus récentes d'abord.
//
// Phase 23F-B : l'ayah 7 (8 formes) est scindé en deux leçons (4 + 4) et la
// révision est plafonnée à MAX_REVIEW_WORDS par leçon — les leçons passent d'un
// maximum de 15 mots à 8 mots (et ~2× moins d'exercices), sans casser la
// progressivité cumulative.

import { createClient } from "@supabase/supabase-js";

const SURAH_NUMBER = 1;
/** Révision maximale par leçon (réduit la charge cognitive, Phase 23F-B). */
const MAX_REVIEW_WORDS = 4;

type LessonSeed = {
  slug: string;
  title: string;
  description: string;
  objective: string;
  difficulty: number;
  sort_order: number;
  /** Verset dont on introduit les mots (nouveaux). */
  ayah: number;
  /** Tranche [start, end) de la liste UNIQUE des mots du verset (séparation 1:7). */
  wordSlice?: [number, number];
};

const CURRICULUM = {
  path: {
    slug: "quran-vocabulary",
    title: "Quran Vocabulary",
    description: "Les mots essentiels du Coran, un mot à la fois.",
    sort_order: 1,
  },
  unit: {
    slug: "al-fatiha-intro",
    title: "Al-Fatiha",
    description: "Comprendre et mémoriser le vocabulaire de la sourate Al-Fatiha.",
    sort_order: 1,
  },
  lessons: [
    { slug: "basmala", title: "La Basmala", description: "Les quatre mots du verset d'ouverture.", objective: "Reconnaître et comprendre les 4 mots de la Basmala.", difficulty: 1, sort_order: 1, ayah: 1 },
    { slug: "al-hamd", title: "La louange", description: "Les mots du deuxième verset.", objective: "Comprendre les mots de la louange, en réutilisant la Basmala.", difficulty: 1, sort_order: 2, ayah: 2 },
    { slug: "ar-rahman", title: "La miséricorde", description: "Les deux noms de miséricorde (révision).", objective: "Consolider les noms de miséricorde et les mots appris.", difficulty: 2, sort_order: 3, ayah: 3 },
    { slug: "malik-yawm-ad-din", title: "Le Souverain du Jour de la rétribution", description: "Les mots du quatrième verset.", objective: "Comprendre « Souverain », « jour », « rétribution » en contexte.", difficulty: 2, sort_order: 4, ayah: 4 },
    { slug: "iyyaka-nabudu", title: "C'est Toi que nous adorons", description: "Les mots du cinquième verset.", objective: "Comprendre l'adoration et la demande de secours.", difficulty: 2, sort_order: 5, ayah: 5 },
    { slug: "ihdina-sirat", title: "Guide-nous dans le droit chemin", description: "Les mots du sixième verset.", objective: "Comprendre la demande de guidance et le chemin droit.", difficulty: 3, sort_order: 6, ayah: 6 },
    { slug: "sirat-alladhina", title: "Le chemin de ceux que Tu as comblés", description: "Première moitié du septième verset.", objective: "Comprendre « chemin », « ceux qui », « comblés de bienfaits ».", difficulty: 3, sort_order: 7, ayah: 7, wordSlice: [0, 4] },
    { slug: "wa-la-d-dallin", title: "Non pas des égarés", description: "Seconde moitié du septième verset.", objective: "Comprendre « colère », « égarés » et la négation en contexte.", difficulty: 3, sort_order: 8, ayah: 7, wordSlice: [4, 8] },
  ] as LessonSeed[],
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
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
    );
  }

  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  // 1. Résolution des mots depuis les occurrences réelles d'Al-Fatiha.
  const ayahNumbers = [...new Set(CURRICULUM.lessons.map((l) => l.ayah))];

  const { data: surahRow, error: surahError } = await client
    .from("surahs")
    .select("id")
    .eq("number", SURAH_NUMBER)
    .single();
  if (surahError) throw new Error(`sourate ${SURAH_NUMBER} : ${surahError.message}`);
  const surahId = (surahRow as { id: string }).id;

  const { data: ayahRows, error: ayahError } = await client
    .from("ayahs")
    .select("id, ayah_number")
    .eq("surah_id", surahId)
    .in("ayah_number", ayahNumbers);
  if (ayahError) throw new Error(`versets : ${ayahError.message}`);

  const wordIdsByAyah = new Map<number, string[]>();
  for (const ayah of (ayahRows ?? []) as Array<{ id: string; ayah_number: number }>) {
    const { data: occRows, error: occError } = await client
      .from("word_occurrences")
      .select("position, word_id")
      .eq("ayah_id", ayah.id)
      .order("position", { ascending: true });
    if (occError) throw new Error(`occurrences 1:${ayah.ayah_number} : ${occError.message}`);
    wordIdsByAyah.set(
      ayah.ayah_number,
      (occRows ?? []).map((r) => (r as { word_id: string }).word_id),
    );
  }

  // 2. Parcours.
  const { data: pathRows, error: pathError } = await client
    .from("learning_paths")
    .upsert({ ...CURRICULUM.path, surah_id: surahId }, { onConflict: "slug" })
    .select("id");
  if (pathError) throw new Error(`parcours : ${pathError.message}`);
  const pathId = (pathRows as Array<{ id: string }>)[0].id;

  // 3. Unité.
  const { data: unitRows, error: unitError } = await client
    .from("units")
    .upsert(
      { ...CURRICULUM.unit, path_id: pathId },
      { onConflict: "path_id,slug" },
    )
    .select("id");
  if (unitError) throw new Error(`unité : ${unitError.message}`);
  const unitId = (unitRows as Array<{ id: string }>)[0].id;

  // 4. Leçons + mots (nouveaux puis révision), progression cumulative plafonnée.
  //    `introducedByLesson` mémorise les mots NOUVEAUX déjà introduits, leçon
  //    par leçon, pour construire la révision « des plus récents d'abord ».
  const introducedByLesson: Array<{ slug: string; wordIds: string[] }> = [];

  for (const lesson of CURRICULUM.lessons) {
    const { data: lessonRows, error: lessonError } = await client
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
      .select("id");
    if (lessonError) throw new Error(`leçon ${lesson.slug} : ${lessonError.message}`);
    const lessonId = (lessonRows as Array<{ id: string }>)[0].id;

    // Mots nouveaux du verset courant (ordre des occurrences, dédupliqués :
    // une même forme peut apparaître plusieurs fois dans un verset).
    const allAyahWords = [...new Set(wordIdsByAyah.get(lesson.ayah) ?? [])];
    const [sliceStart, sliceEnd] = lesson.wordSlice ?? [0, allAyahWords.length];
    const newWordIds = allAyahWords.slice(sliceStart, sliceEnd);
    if (newWordIds.length === 0) {
      throw new Error(`Aucun mot trouvé pour Al-Fatiha 1:${lesson.ayah}.`);
    }

    // Mots de révision : mots déjà introduits, des plus récents d'abord, plafonnés.
    const seen = new Set(newWordIds);
    const reviewWordIds: string[] = [];
    for (let i = introducedByLesson.length - 1; i >= 0 && reviewWordIds.length < MAX_REVIEW_WORDS; i--) {
      for (const wordId of introducedByLesson[i]!.wordIds) {
        if (reviewWordIds.length >= MAX_REVIEW_WORDS) break;
        if (seen.has(wordId)) continue;
        seen.add(wordId);
        reviewWordIds.push(wordId);
      }
    }

    // Nouveaux d'abord (positions 1..N), révision ensuite (N+1..).
    const ordered = [...newWordIds, ...reviewWordIds];
    const lessonWords = ordered.map((wordId, i) => ({
      lesson_id: lessonId,
      word_id: wordId,
      position: i + 1,
      is_new: i < newWordIds.length,
      importance: 1,
    }));

    // Nettoyage idempotent : retire les anciennes associations devenues
    // obsolètes (ex. les 4 mots déplacés de « sirat-alladhina » vers
    // « wa-la-d-dallin »), puis insère la liste à jour. lesson_words n'est
    // référencée par aucune FK entrante → suppression/insertion sans risque.
    await client.from("lesson_words").delete().eq("lesson_id", lessonId);
    const { error: lwError } = await client
      .from("lesson_words")
      .insert(lessonWords);
    if (lwError) throw new Error(`mots de ${lesson.slug} : ${lwError.message}`);

    introducedByLesson.push({ slug: lesson.slug, wordIds: newWordIds });

    console.log(
      `✅ Leçon « ${lesson.title} » — ${newWordIds.length} nouveaux · ${reviewWordIds.length} révision.`,
    );
  }

  console.log("\nSeed terminé (idempotent).");
}

main().catch((err) => {
  console.error("Seed échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
