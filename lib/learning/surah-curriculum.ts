// Plan de curriculum multi-sourates (Phase 21B) — logique PURE, testable.
//
// Extrait du générateur `scripts/seed-multisurah-curriculum.ts` la partie
// déterministe qui transforme « sourate + mots par verset » en structure
// parcours / unité / leçons / mots. Aucune entrée/sortie, aucun accès base :
// le script reste responsable de lire les données Quran réelles et d'écrire le
// plan en base.
//
// Garanties :
//   - idempotent : mêmes entrées → mêmes sorties (aucun aléa, ordre stable) ;
//   - aucune donnée inventée : les word_id proviennent uniquement des
//     occurrences réelles passées en entrée ;
//   - jamais de doublon lexical : le plan référence des word_id, pas des textes ;
//   - jamais de hardcode Al-Fātiḥah : le slug est dérivé du numéro de sourate.

/** Révision maximale par leçon (plafond cumulatif, même règle qu'Al-Fātiḥah). */
export const MAX_REVIEW_WORDS = 4;

/**
 * Sourates qui possèdent un parcours ÉDITORIAL manuel (jamais régénéré).
 * Al-Fātiḥah (`quran-vocabulary`) est la référence verrouillée : le générateur
 * ne doit jamais la recréer ni la modifier.
 */
export const EDITORIAL_PATH_SURAH_NUMBERS: ReadonlySet<number> = new Set([1]);

/** Vrai si la sourate possède un parcours éditorial à préserver tel quel. */
export function isEditorialSurah(surahNumber: number): boolean {
  return EDITORIAL_PATH_SURAH_NUMBERS.has(surahNumber);
}

/** Sourate minimale requise pour planifier un parcours (id + numéro + nom). */
export type SurahPlanInput = {
  id: string;
  number: number;
  name_transliteration: string | null;
};

export type PlannedLessonWord = {
  word_id: string;
  position: number;
  is_new: boolean;
};

export type PlannedLesson = {
  slug: string;
  title: string;
  description: string;
  objective: string;
  difficulty: number;
  sort_order: number;
  words: PlannedLessonWord[];
};

export type SurahCurriculumPlan = {
  path: {
    slug: string;
    title: string;
    description: string;
    sort_order: number;
    surah_id: string;
  };
  unit: {
    slug: string;
    title: string;
    description: string;
    sort_order: number;
  };
  lessons: PlannedLesson[];
};

/**
 * Planifie le parcours d'une sourate à partir de ses mots réels par verset.
 *
 * `wordsByAyah` : Map(ayah_number → word_id[]), mots DÉDUPLIQUÉS et ordonnés
 * par position d'occurrence (le script fournit `[...new Set(...)]`).
 *
 * Structure : une leçon par verset (jamais un nombre figé — dépend du contenu
 * réel), progression CUMULATIVE plafonnée : chaque leçon introduit les mots
 * nouveaux du verset puis réintroduit au plus `maxReviewWords` mots déjà vus,
 * des plus récents d'abord. La difficulté est dérivée du numéro de verset.
 */
export function planSurahCurriculum(
  surah: SurahPlanInput,
  wordsByAyah: ReadonlyMap<number, readonly string[]>,
  maxReviewWords: number = MAX_REVIEW_WORDS,
): SurahCurriculumPlan {
  const name = surah.name_transliteration ?? `Sourate ${surah.number}`;
  const ayahNumbers = [...wordsByAyah.keys()].sort((a, b) => a - b);

  const path = {
    slug: `quran-surah-${surah.number}`,
    title: `Parcours · ${name}`,
    description: "Un parcours construit à partir des mots et versets coraniques importés.",
    sort_order: 100 + surah.number,
    surah_id: surah.id,
  };

  const unit = {
    slug: `surah-${surah.number}`,
    title: name,
    description: "Les mots de la sourate, verset après verset.",
    sort_order: 1,
  };

  // Mots NOUVEAUX introduits, leçon par leçon (pour la révision « plus récents
  // d'abord »), exactement comme le générateur historique.
  const introduced: string[] = [];
  const lessons: PlannedLesson[] = [];

  for (const ayahNumber of ayahNumbers) {
    const rawWords = wordsByAyah.get(ayahNumber) ?? [];
    const ayahWords = [...new Set(rawWords)];
    if (ayahWords.length === 0) continue;

    const newWords = ayahWords.filter((id) => !introduced.includes(id));
    const review = introduced
      .filter((id) => !newWords.includes(id))
      .slice(-Math.max(0, maxReviewWords))
      .reverse();
    const ordered = [...newWords, ...review];

    lessons.push({
      slug: `surah-${surah.number}-ayah-${ayahNumber}`,
      title: `Verset ${ayahNumber}`,
      description: `Les mots du verset ${ayahNumber}.`,
      objective: `Reconnaître et comprendre les mots du verset ${ayahNumber}.`,
      difficulty: Math.min(5, 1 + Math.floor(ayahNumber / 10)),
      sort_order: ayahNumber,
      words: ordered.map((wordId, index) => ({
        word_id: wordId,
        position: index + 1,
        is_new: index < newWords.length,
      })),
    });

    introduced.push(...newWords);
  }

  return { path, unit, lessons };
}
