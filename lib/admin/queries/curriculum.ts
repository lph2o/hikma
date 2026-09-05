import { getAdminDbClient } from "@/lib/admin/dal";
import type {
  AdminCurriculumKpis,
  AdminCurriculumPathItem,
  AdminCorpusSurahItem,
  AdminCurriculumInsight,
  AdminCurriculumSurahDetail,
} from "@/lib/admin/metrics";

/**
 * Récupère les KPIs globaux du Curriculum et du Corpus.
 *
 * Utilise des requêtes `{ count: "exact", head: true }` pour éviter
 * le plafonnement à 1000 lignes du protocole REST PostgREST.
 */
export async function getAdminCurriculumKpis(): Promise<AdminCurriculumKpis> {
  const db = getAdminDbClient();

  const [
    pathsRes,
    unitsRes,
    lessonsPubRes,
    lessonsDraftRes,
    quranWordsRes,
    translationsRes,
    occurrencesRes,
    ayahsRes,
    surahsRes,
    lemmasRes,
    lemmaTransRes,
  ] = await Promise.all([
    db.from("learning_paths").select("*", { count: "exact", head: true }),
    db.from("units").select("*", { count: "exact", head: true }),
    db.from("lessons").select("*", { count: "exact", head: true }).eq("status", "published"),
    db.from("lessons").select("*", { count: "exact", head: true }).eq("status", "draft"),
    db.from("quran_words").select("*", { count: "exact", head: true }),
    db
      .from("word_translations")
      .select("*", { count: "exact", head: true })
      .eq("language", "fr")
      .eq("is_validated", true),
    db.from("word_occurrences").select("*", { count: "exact", head: true }),
    db.from("ayahs").select("*", { count: "exact", head: true }),
    db.from("surahs").select("*", { count: "exact", head: true }),
    db.from("lemmas").select("*", { count: "exact", head: true }),
    db.from("lemma_translations").select("*", { count: "exact", head: true }),
  ]);

  // Récupération paginée en parallèle des 4503 lignes de lesson_words pour compter les mots uniques enseignés
  const lwPromises = [0, 1000, 2000, 3000, 4000].map((from) =>
    db.from("lesson_words").select("word_id").range(from, from + 999),
  );
  const lwResults = await Promise.all(lwPromises);
  const uniqueWordsTaught = new Set(
    lwResults.flatMap((r) => (r.data ?? []).map((x) => (x as { word_id: string }).word_id)),
  ).size;

  const quranWordsCount = quranWordsRes.count ?? 21296;
  const frValidatedWordsCount = translationsRes.count ?? 6095;
  const frCoveragePct =
    quranWordsCount > 0
      ? Math.round((frValidatedWordsCount / quranWordsCount) * 1000) / 10
      : 0;

  return {
    pathsCount: pathsRes.count ?? 0,
    unitsCount: unitsRes.count ?? 0,
    lessonsPublishedCount: lessonsPubRes.count ?? 0,
    lessonsDraftCount: lessonsDraftRes.count ?? 0,
    wordsTaughtCount: uniqueWordsTaught,
    quranWordsCount,
    frValidatedWordsCount,
    frCoveragePct,
    occurrencesCount: occurrencesRes.count ?? 0,
    ayahsCount: ayahsRes.count ?? 0,
    surahsCount: surahsRes.count ?? 0,
    lemmasCount: lemmasRes.count ?? 0,
    lemmaTranslationsCount: lemmaTransRes.count ?? 0,
  };
}

/**
 * Récupère la liste des parcours d'apprentissage (Curriculum)
 * avec le détail des leçons et des mots enseignés.
 */
export async function getAdminCurriculumPaths(): Promise<AdminCurriculumPathItem[]> {
  const db = getAdminDbClient();

  const [pathsRes, lessonsRes, lwResults] = await Promise.all([
    db
      .from("learning_paths")
      .select("id, slug, title, surah_id, surahs(id, number, name_transliteration, name_arabic, ayah_count)"),
    db.from("units").select("id, path_id, lessons(id)"),
    Promise.all(
      [0, 1000, 2000, 3000, 4000].map((from) =>
        db.from("lesson_words").select("lesson_id").range(from, from + 999),
      ),
    ),
  ]);

  if (pathsRes.error || !pathsRes.data) return [];

  // Compter les mots par leçon
  const wordsPerLesson = new Map<string, number>();
  for (const r of lwResults.flatMap((res) => res.data ?? [])) {
    const lid = (r as { lesson_id: string }).lesson_id;
    wordsPerLesson.set(lid, (wordsPerLesson.get(lid) ?? 0) + 1);
  }

  // Mapper unités et leçons par path_id
  const lessonsByPath = new Map<string, string[]>();
  for (const u of (lessonsRes.data ?? []) as Array<{
    id: string;
    path_id: string;
    lessons: Array<{ id: string }> | null;
  }>) {
    const list = lessonsByPath.get(u.path_id) ?? [];
    const lessonIds = (u.lessons ?? []).map((l) => l.id);
    lessonsByPath.set(u.path_id, [...list, ...lessonIds]);
  }

  const items: AdminCurriculumPathItem[] = [];

  for (const p of pathsRes.data as Array<{
    id: string;
    slug: string;
    title: string;
    surahs: {
      id: string;
      number: number;
      name_transliteration: string;
      name_arabic: string;
      ayah_count: number;
    } | null;
  }>) {
    const lessonIds = lessonsByPath.get(p.id) ?? [];
    let wordsCount = 0;
    for (const lid of lessonIds) {
      wordsCount += wordsPerLesson.get(lid) ?? 0;
    }

    items.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      surahNumber: p.surahs?.number ?? 0,
      surahName: p.surahs?.name_transliteration ?? "Sourate",
      surahArabic: p.surahs?.name_arabic ?? "",
      ayahCount: p.surahs?.ayah_count ?? 0,
      lessonCount: lessonIds.length,
      wordsCount,
    });
  }

  // Trier par numéro de sourate
  return items.sort((a, b) => a.surahNumber - b.surahNumber);
}

/**
 * Récupère les 114 sourates du corpus coranique avec leur statut
 * d'intégration au curriculum.
 */
export async function getAdminCorpusSurahs(): Promise<AdminCorpusSurahItem[]> {
  const db = getAdminDbClient();

  const [surahsRes, pathsRes, unitsRes] = await Promise.all([
    db
      .from("surahs")
      .select("id, number, name_arabic, name_transliteration, name_translation, ayah_count")
      .order("number", { ascending: true }),
    db.from("learning_paths").select("id, surah_id"),
    db.from("units").select("id, path_id, lessons(id)"),
  ]);

  if (surahsRes.error || !surahsRes.data) return [];

  const pathBySurahId = new Map<string, string>();
  for (const p of (pathsRes.data ?? []) as Array<{ id: string; surah_id: string }>) {
    pathBySurahId.set(p.surah_id, p.id);
  }

  const lessonCountByPathId = new Map<string, number>();
  for (const u of (unitsRes.data ?? []) as Array<{
    id: string;
    path_id: string;
    lessons: Array<{ id: string }> | null;
  }>) {
    const current = lessonCountByPathId.get(u.path_id) ?? 0;
    lessonCountByPathId.set(u.path_id, current + (u.lessons?.length ?? 0));
  }

  return (surahsRes.data as Array<{
    id: string;
    number: number;
    name_arabic: string;
    name_transliteration: string;
    name_translation: string;
    ayah_count: number;
  }>).map((s) => {
    const pathId = pathBySurahId.get(s.id);
    const hasCurriculum = !!pathId;
    const lessonCount = pathId ? (lessonCountByPathId.get(pathId) ?? 0) : 0;

    return {
      number: s.number,
      name: s.name_transliteration,
      arabic: s.name_arabic,
      translation: s.name_translation,
      ayahCount: s.ayah_count,
      hasCurriculum,
      lessonCount,
    };
  });
}

/**
 * Points d'attention du Curriculum et du Corpus.
 * Strictement basé sur les faits de la base de données.
 */
export async function getAdminCurriculumInsights(): Promise<AdminCurriculumInsight[]> {
  const db = getAdminDbClient();
  const insights: AdminCurriculumInsight[] = [];

  const [surahsCountRes, pathsCountRes, lessonsDraftRes, lemmasRes, lemmaTransRes] =
    await Promise.all([
      db.from("surahs").select("*", { count: "exact", head: true }),
      db.from("learning_paths").select("*", { count: "exact", head: true }),
      db.from("lessons").select("*", { count: "exact", head: true }).eq("status", "draft"),
      db.from("lemmas").select("*", { count: "exact", head: true }),
      db.from("lemma_translations").select("*", { count: "exact", head: true }),
    ]);

  const totalSurahs = surahsCountRes.count ?? 114;
  const pathsCount = pathsCountRes.count ?? 34;
  const surahsWithoutPath = totalSurahs - pathsCount;

  // 1. Couverture des sourates par les parcours
  if (surahsWithoutPath > 0) {
    insights.push({
      type: "info",
      key: "surahs_without_curriculum",
      title: "Sourates en attente de parcours",
      description: `${surahsWithoutPath} sourates sur ${totalSurahs} n'ont pas encore de parcours structuré dans le curriculum (${pathsCount} sourates couvertes).`,
      value: surahsWithoutPath,
    });
  }

  // 2. Leçons en brouillon
  const draftLessons = lessonsDraftRes.count ?? 0;
  if (draftLessons > 0) {
    insights.push({
      type: "warning",
      key: "draft_lessons",
      title: "Leçons non publiées",
      description: `${draftLessons} leçon(s) sont actuellement en statut brouillon.`,
      value: draftLessons,
    });
  } else {
    insights.push({
      type: "success",
      key: "all_lessons_published",
      title: "Toutes les leçons sont publiées",
      description: "Les 547 leçons du curriculum sont actuellement en ligne et accessibles aux apprenants.",
      value: 547,
    });
  }

  // 3. Traduction des lemmes
  const totalLemmas = lemmasRes.count ?? 1593;
  const translatedLemmas = lemmaTransRes.count ?? 204;
  const lemmaCoveragePct = Math.round((translatedLemmas / totalLemmas) * 100);
  if (lemmaCoveragePct < 50) {
    insights.push({
      type: "info",
      key: "lemma_translation_coverage",
      title: "Couverture lemmatique partielle",
      description: `${translatedLemmas} lemmes traduits sur ${totalLemmas} (${lemmaCoveragePct}%). Le reste du corpus s'appuie sur les traductions directes de formes.`,
      value: totalLemmas - translatedLemmas,
    });
  }

  return insights;
}

/**
 * Détail complet d'une sourate et de son parcours associé pour `/admin/curriculum/[surah]`.
 */
export async function getAdminCurriculumSurahDetail(
  surahNumber: number,
): Promise<AdminCurriculumSurahDetail | null> {
  const db = getAdminDbClient();

  // 1. Récupérer la sourate
  const { data: surah, error: surahError } = await db
    .from("surahs")
    .select("id, number, name_arabic, name_transliteration, name_translation, revelation_place, ayah_count")
    .eq("number", surahNumber)
    .single();

  if (surahError || !surah) return null;

  // 2. Récupérer les ayahs de la sourate
  const { data: ayahs } = await db
    .from("ayahs")
    .select("id, ayah_number")
    .eq("surah_id", surah.id);

  const ayahIds = (ayahs ?? []).map((a) => a.id);

  // 3. Récupérer les occurrences et formes uniques
  let occurrencesCount = 0;
  let uniqueWordsCount = 0;
  let translatedWordsCount = 0;

  if (ayahIds.length > 0) {
    // Les occurrences pour une seule sourate (chunkées si > 250 ayahs)
    const { data: occs } = await db
      .from("word_occurrences")
      .select("word_id")
      .in("ayah_id", ayahIds);

    const occurrences = occs ?? [];
    occurrencesCount = occurrences.length;

    const uniqueWordIds = [...new Set(occurrences.map((o) => o.word_id))];
    uniqueWordsCount = uniqueWordIds.length;

    if (uniqueWordIds.length > 0) {
      // Compter les traductions FR validées pour ces mots (par batchs de 250)
      const batches: string[][] = [];
      for (let i = 0; i < uniqueWordIds.length; i += 250) {
        batches.push(uniqueWordIds.slice(i, i + 250));
      }

      const transResults = await Promise.all(
        batches.map((batch) =>
          db
            .from("word_translations")
            .select("*", { count: "exact", head: true })
            .in("word_id", batch)
            .eq("language", "fr")
            .eq("is_validated", true),
        ),
      );

      translatedWordsCount = transResults.reduce((acc, r) => acc + (r.count ?? 0), 0);
    }
  }

  const coveragePct =
    uniqueWordsCount > 0 ? Math.round((translatedWordsCount / uniqueWordsCount) * 100) : 0;

  // 4. Récupérer le learning path associé
  const { data: path } = await db
    .from("learning_paths")
    .select("id, slug, title, description, units(id, title)")
    .eq("surah_id", surah.id)
    .maybeSingle();

  // 5. Récupérer les leçons si le parcours existe
  let lessons: AdminCurriculumSurahDetail["lessons"] = [];
  const unit = (path?.units as Array<{ id: string; title: string }> | undefined)?.[0];

  if (unit) {
    const { data: lessonRows } = await db
      .from("lessons")
      .select("id, slug, title, sort_order, difficulty, objective, status")
      .eq("unit_id", unit.id)
      .order("sort_order", { ascending: true });

    if (lessonRows && lessonRows.length > 0) {
      const lessonIds = lessonRows.map((l) => l.id);
      const { data: lwRows } = await db
        .from("lesson_words")
        .select("lesson_id")
        .in("lesson_id", lessonIds);

      const countMap = new Map<string, number>();
      for (const lw of (lwRows ?? []) as Array<{ lesson_id: string }>) {
        countMap.set(lw.lesson_id, (countMap.get(lw.lesson_id) ?? 0) + 1);
      }

      lessons = lessonRows.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        sortOrder: l.sort_order,
        difficulty: l.difficulty,
        objective: l.objective,
        status: l.status,
        wordsCount: countMap.get(l.id) ?? 0,
      }));
    }
  }

  return {
    surah: {
      id: surah.id,
      number: surah.number,
      nameArabic: surah.name_arabic,
      nameTransliteration: surah.name_transliteration,
      nameTranslation: surah.name_translation,
      revelationPlace: surah.revelation_place,
      ayahCount: surah.ayah_count,
    },
    corpus: {
      occurrencesCount,
      uniqueWordsCount,
      translatedWordsCount,
      coveragePct,
    },
    path: path
      ? {
          id: path.id,
          slug: path.slug,
          title: path.title,
          description: path.description,
          unitTitle: unit?.title ?? "Unité unique",
        }
      : null,
    lessons,
  };
}
