import type { SupabaseClient } from "@supabase/supabase-js";
import { chunk } from "@/lib/quran/repositories/shared";
import type {
  Lesson,
  LessonWord,
  LearningPath,
  ReviewItem,
  Unit,
  UserWordProgress,
} from "@/types/learning";
import type { QuranWord } from "@/types/quran";
import type { ReviewItemWithWord, ReviewState } from "@/lib/review";
import type {
  LinguisticEvidence,
  LinguisticEvidenceSegment,
} from "@/lib/linguistic/explanation";
import { orderCurriculum } from "./curriculum";
import type { Curriculum } from "./curriculum";
import type {
  LessonWordWithWord,
  LessonProgressStatus,
  MasteryLevel,
  WordContextData,
  WordLemmaData,
} from "./types";
import {
  computeLessonStatuses,
  type LessonSessionState,
  type SkillAttempt,
  type WordAttempts,
} from "./session";
import { computeSurahProgress, type SurahProgress } from "./surah-progress";
import {
  resolveWordMeanings,
  type FrenchLexicalMeaning,
} from "./language";
import { SKILLS, type Skill } from "./skills";
import type { SkillProgressState } from "./skill-progress";
import { computeCoveragePercent, computeCoverageBySurah, computeAyahCoverages, COMPREHENDED_STATUSES, type SurahCoverage, type AyahCoverage } from "./coverage";

/**
 * Taille maximale d'un filtre `.in()` (identifiants par requête).
 *
 * Phase 51/52 : une URL GET trop longue (`.in()` pleine-catalogue ≈ 16 Ko pour
 * 411 word_ids) dépasse le plafond du client HTTP/1.1 de Node (undici) et
 * déclenche « Header overflow » / « fetch failed ». Seuil mesuré en Phase 51 :
 * 395 IDs OK / 397 IDs FAIL. 250 IDs (≈ 10 Ko) laisse une marge de sécurité
 * ~1,6× sous le seuil, et 411 IDs → 2 requêtes (aucun N+1 par mot).
 * Volontairement conservateur : la robustesse future prime sur l'utilisation
 * maximale de la limite.
 */
export const IN_FILTER_CHUNK_SIZE = 250;

/**
 * Taille maximale d'un filtre `.in("lesson_id", …)` (Phase 88J).
 *
 * Phase 52 a fixé `IN_FILTER_CHUNK_SIZE = 250` pour les `.in()` sur `word_id`,
 * mais la publication 88H (356 nouvelles leçons → 547 leçons publiées au
 * total) a franchi le seuil mesuré en 88I (≈ 396 ids / ≈ 14,7 Ko d'URL) sur la
 * requête `lesson_words` de `getSurahCatalog` → `TypeError: fetch failed`
 * (finding CAT-000). 200 laisse une marge ~1,8× sous le seuil, conformément à
 * la recommandation de l'audit 88I.
 */
export const LESSON_ID_CHUNK_SIZE = 200;

/**
 * Exécute une requête `.in()` par lots d'identifiants (en parallèle) puis
 * concatène les lignes. Déterministe, sans effet de bord :
 * - tableau vide → aucun appel ;
 * - identifiants dédupliqués (un id n'apparaît que dans un seul lot) ;
 * - la première erreur rencontrée est propagée avec `label`.
 * Le nombre de requêtes est proportionnel au nombre de lots, jamais au nombre
 * d'identifiants (aucun N+1).
 * `chunkSize` par défaut : `IN_FILTER_CHUNK_SIZE` (word_id, Phase 52).
 * `getSurahCatalog` passe `LESSON_ID_CHUNK_SIZE` pour lesson_id (Phase 88J).
 */
async function selectInChunks<T>(
  ids: readonly string[],
  label: string,
  run: (batch: string[]) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  chunkSize: number = IN_FILTER_CHUNK_SIZE,
): Promise<T[]> {
  const batches = chunk([...new Set(ids)], chunkSize);
  const results = await Promise.all(batches.map(run));
  const rows: T[] = [];
  for (const { data, error } of results) {
    if (error) throw new Error(`${label} : ${error.message}`);
    rows.push(...(data ?? []));
  }
  return rows;
}

/** Précision des requêtes utilisateur : filtres RLS auth.uid() côté base. */

export type CurriculumQuery = {
  pathId?: string;
  surahId?: string;
  surahNumber?: number;
};

/** Construit un arbre curriculum à partir d'un parcours déjà sélectionné. */
async function loadCurriculum(
  client: SupabaseClient,
  path: LearningPath,
): Promise<Curriculum> {
  const { data: units, error: unitError } = await client
    .from("units")
    .select("*")
    .eq("path_id", path.id)
    .order("sort_order", { ascending: true });
  if (unitError) throw new Error(`units : ${unitError.message}`);

  const unitIds = (units ?? []).map((u) => (u as Unit).id);
  const { data: lessons, error: lessonError } = await client
    .from("lessons")
    .select("*")
    .eq("status", "published")
    .in("unit_id", unitIds.length > 0 ? unitIds : ["00000000-0000-0000-0000-000000000000"])
    .order("sort_order", { ascending: true });
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);

  const lessonRows = (lessons ?? []) as Lesson[];
  const unitsWithLessons = (units ?? []).map((u) => {
    const unit = u as Unit;
    return { ...unit, lessons: lessonRows.filter((l) => l.unit_id === unit.id) };
  });
  return orderCurriculum({ path, units: unitsWithLessons });
}

/** Liste tous les parcours publiés sans imposer un parcours obligatoire. */
export async function listLearningPaths(
  client: SupabaseClient,
): Promise<LearningPath[]> {
  const { data, error } = await client
    .from("learning_paths")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`learning_paths : ${error.message}`);
  return (data ?? []) as LearningPath[];
}

/** Lit un curriculum ciblé ; sans filtre, conserve le défaut legacy. */
export async function getCurriculum(
  client: SupabaseClient,
  query: CurriculumQuery = {},
): Promise<Curriculum | null> {
  let request = client.from("learning_paths").select("*").order("sort_order", { ascending: true });
  if (query.pathId) request = request.eq("id", query.pathId);
  if (query.surahId) request = request.eq("surah_id", query.surahId);
  if (query.surahNumber != null) {
    const { data: surahs, error: surahError } = await client
      .from("surahs")
      .select("id")
      .eq("number", query.surahNumber)
      .limit(1);
    if (surahError) throw new Error(`surahs : ${surahError.message}`);
    const surahId = (surahs?.[0] as { id: string } | undefined)?.id;
    if (!surahId) return null;
    request = request.eq("surah_id", surahId);
  }
  if (!query.pathId && !query.surahId && query.surahNumber == null) {
    // Compatibilité explicite avec les écrans historiques : le dashboard
    // reste ancré sur le parcours éditorial Al-Fatihah, tandis que le
    // catalogue/listLearningPaths expose tous les parcours disponibles.
    request = request.eq("slug", "quran-vocabulary");
  }
  const { data: paths, error: pathError } = await request.limit(1);
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  const path = (paths?.[0] ?? null) as LearningPath | null;
  if (!path) return null;
  return loadCurriculum(client, path);
}

export async function getLearningPathBySurah(
  client: SupabaseClient,
  surahNumber: number,
): Promise<Curriculum | null> {
  return getCurriculum(client, { surahNumber });
}

/** Élément du catalogue des sourates (route `/surahs`, Phase 30). */
export type SurahCatalogItem = {
  surahNumber: number;
  nameArabic: string;
  nameTransliteration: string;
  slug: string;
  pathTitle: string;
  lessonCount: number;
  formCount: number;
  effectiveFrCount: number;
  effectiveFrPct: number;
  state: "REFERENCE" | "READY" | "IN_PREPARATION";
  firstLessonSlug: string | null;
  firstLessonTitle: string | null;
};

/**
 * Classification pure de la readiness d'une sourate (Phase 30).
 *
 * Le critère est UNIQUEMENT la couverture lexicale française (glose FR validée).
 * MASAQ n'entre jamais ici : une sourate sans MASAQ est READY si 100 % de ses
 * formes résolvent en français. Al-Fātiḥah reste REFERENCE, quel que soit l'état
 * des autres couches.
 */
export function classifySurahReadiness(
  surahNumber: number,
  effectiveFrPct: number,
): SurahCatalogItem["state"] {
  if (surahNumber === 1) return "REFERENCE";
  if (effectiveFrPct === 100) return "READY";
  return "IN_PREPARATION";
}

/**
 * Catalogue des sourates exposables (Phase 30).
 *
 * La disponibilité est pilotée par la QUALITÉ LEXICALE FRANÇAISE (glose FR
 * validée), jamais par MASAQ : MASAQ est un enrichissement linguistique
 * optionnel et ne conditionne jamais l'accès à une sourate. `state` :
 *   REFERENCE      → Al-Fātiḥah (référence verrouillée) ;
 *   READY          → 100 % des formes du parcours résolvent en FR validé ;
 *   IN_PREPARATION → couverture FR incomplète (fallback EN restant).
 */
export async function getSurahCatalog(
  client: SupabaseClient,
): Promise<SurahCatalogItem[]> {
  // 1. Parcours ancrés sur une sourate (jamais les éventuels parcours legacy).
  const { data: pathRows, error: pathError } = await client
    .from("learning_paths")
    .select("id, slug, title, sort_order, surahs(id, number, name_arabic, name_transliteration)")
    .not("surah_id", "is", null)
    .order("sort_order", { ascending: true });
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  // La relation `surahs` est une to-one, mais sans types générés supabase-js la
  // type comme un tableau : on normalise défensivement (objet ↔ tableau à 1 élément).
  type SurahRel = {
    id: string;
    number: number;
    name_arabic: string;
    name_transliteration: string;
  };
  const paths = (pathRows ?? []) as unknown as Array<{
    id: string;
    slug: string;
    title: string;
    sort_order: number;
    surahs: SurahRel | SurahRel[] | null;
  }>;
  if (paths.length === 0) return [];

  // 2. Unités (ordonnées) et leçons publiées (ordonnées) de tous les parcours.
  const pathIds = paths.map((p) => p.id);
  const { data: unitRows, error: unitError } = await client
    .from("units")
    .select("id, path_id")
    .in("path_id", pathIds)
    .order("sort_order", { ascending: true });
  if (unitError) throw new Error(`units : ${unitError.message}`);
  const units = (unitRows ?? []) as Array<{ id: string; path_id: string }>;
  const unitIds = units.map((u) => u.id);
  const unitOrder = new Map(units.map((u, i) => [u.id, i]));

  const { data: lessonRows, error: lessonError } = await client
    .from("lessons")
    .select("id, unit_id, slug, title, sort_order")
    .eq("status", "published")
    .in("unit_id", unitIds)
    .order("sort_order", { ascending: true });
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);
  const lessons = (lessonRows ?? []) as Array<{
    id: string;
    unit_id: string;
    slug: string;
    title: string;
    sort_order: number;
  }>;
  const lessonIds = lessons.map((l) => l.id);

  // 3. Mots distincts de chaque parcours (forms réellement enseignées).
  //    Phase 88J : requête chunkée par lesson_id (LESSON_ID_CHUNK_SIZE = 200).
  //    Phase 52 n'avait sécurisé que les `.in()` sur `word_id` ; depuis la
  //    publication 88H, les 547 leçons publiées dépassent le seuil `.in()`
  //    (≈ 396 ids / ≈ 14,7 Ko) et la requête levait « TypeError: fetch
  //    failed » (finding CAT-000 de l'audit 88I). Résultat strictement
  //    équivalent à la requête unique : fusion déterministe, aucun doublon,
  //    aucun mot perdu (chaque lesson_id n'appartient qu'à un lot, l'ordre
  //    `position` de chaque leçon est donc préservé).
  const lwRows = await selectInChunks<{ lesson_id: string; word_id: string }>(
    lessonIds,
    "lesson_words",
    (batch) =>
      client
        .from("lesson_words")
        .select("lesson_id, word_id")
        .in("lesson_id", batch)
        .order("position", { ascending: true }),
    LESSON_ID_CHUNK_SIZE,
  );
  const wordIdsByLesson = new Map<string, string[]>();
  for (const row of lwRows) {
    const arr = wordIdsByLesson.get(row.lesson_id) ?? [];
    if (!arr.includes(row.word_id)) arr.push(row.word_id);
    wordIdsByLesson.set(row.lesson_id, arr);
  }

  // 4. Résolution FR réelle (FORME → LEMME → fallback EN) en une seule passe.
  const allWordIds = [...new Set(lwRows.map((r) => r.word_id))];
  const [formMap, lemmaMap] = await Promise.all([
    getValidatedFrenchMeanings(client, allWordIds),
    getValidatedFrenchLemmaMeaningsByWord(client, allWordIds),
  ]);
  const meaningRows = await selectInChunks<{ id: string; meaning: string | null }>(
    allWordIds,
    "quran_words",
    (batch) => client.from("quran_words").select("id, meaning").in("id", batch),
  );
  const meaningById = new Map(meaningRows.map((w) => [w.id, w.meaning]));

  // 5. Construit la matrice par parcours.
  const catalog: SurahCatalogItem[] = [];
  for (const path of paths) {
    const surah = Array.isArray(path.surahs) ? (path.surahs[0] ?? null) : path.surahs;
    const pathUnitIds = units.filter((u) => u.path_id === path.id).map((u) => u.id);
    const orderedLessons = lessons
      .filter((l) => pathUnitIds.includes(l.unit_id))
      .sort(
        (a, b) =>
          (unitOrder.get(a.unit_id) ?? 0) - (unitOrder.get(b.unit_id) ?? 0) ||
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          a.slug.localeCompare(b.slug),
      );
    const wordIds = [
      ...new Set(orderedLessons.flatMap((l) => wordIdsByLesson.get(l.id) ?? [])),
    ];
    let effectiveFrCount = 0;
    for (const id of wordIds) {
      const resolved = resolveWordMeanings(
        { meaning: meaningById.get(id) ?? null },
        formMap.get(id),
        lemmaMap.get(id),
      );
      if (resolved.language === "fr") effectiveFrCount += 1;
    }
    const formCount = wordIds.length;
    const effectiveFrPct = formCount > 0 ? Math.round((effectiveFrCount / formCount) * 100) : 100;
    const firstLesson = orderedLessons[0] ?? null;
    const state = classifySurahReadiness(surah?.number ?? 0, effectiveFrPct);

    catalog.push({
      surahNumber: surah?.number ?? 0,
      nameArabic: surah?.name_arabic ?? "",
      nameTransliteration: surah?.name_transliteration ?? "",
      slug: path.slug,
      pathTitle: path.title,
      lessonCount: orderedLessons.length,
      formCount,
      effectiveFrCount,
      effectiveFrPct,
      state,
      firstLessonSlug: firstLesson?.slug ?? null,
      firstLessonTitle: firstLesson?.title ?? null,
    });
  }

  return catalog;
}

/**
 * Progression réelle d'un utilisateur par sourate (Phase 34B) — lecture seule.
 *
 * Réutilise la même chaîne relationnelle que `getSurahCatalog`
 * (learning_paths → units → lessons → lesson_words) mais pour la PROGRESSION :
 *
 *  1. structure (parcours + unités + leçons publiées) — 3 requêtes batch ;
 *  2. mots `is_new = true` par leçon (`lesson_words`) — 1 requête batch ;
 *  3. `user_word_progress` de l'utilisateur — 1 requête batch (getUserWordProgress) ;
 *  4. sessions actives (`lesson_sessions.status = 'in_progress'`) — 1 requête batch.
 *
 * Aucun N+1 : le regroupement par sourate se fait EN MÉMOIRE, puis chaque
 * sourate est passée à la fonction pure `computeSurahProgress`. Aucune donnée
 * n'est écrite, aucun moteur pédagogique n'est modifié.
 */
export async function getSurahProgressByUser(
  client: SupabaseClient,
  userId: string,
): Promise<SurahProgress[]> {
  // 1. Parcours rattachés à une sourate (jamais les parcours legacy).
  const { data: pathRows, error: pathError } = await client
    .from("learning_paths")
    .select("id, slug, surahs(id, number)")
    .not("surah_id", "is", null)
    .order("sort_order", { ascending: true });
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  type SurahRel = { id: string; number: number };
  const paths = (pathRows ?? []) as unknown as Array<{
    id: string;
    slug: string;
    surahs: SurahRel | SurahRel[] | null;
  }>;
  if (paths.length === 0) return [];

  const pathIds = paths.map((p) => p.id);

  // 2. Unités (ordonnées).
  const { data: unitRows, error: unitError } = await client
    .from("units")
    .select("id, path_id")
    .in("path_id", pathIds)
    .order("sort_order", { ascending: true });
  if (unitError) throw new Error(`units : ${unitError.message}`);
  const units = (unitRows ?? []) as Array<{ id: string; path_id: string }>;
  const unitIds = units.map((u) => u.id);
  const unitOrder = new Map(units.map((u, i) => [u.id, i]));
  if (unitIds.length === 0) return [];

  // 3. Leçons publiées (ordonnées).
  const { data: lessonRows, error: lessonError } = await client
    .from("lessons")
    .select("id, unit_id, slug, sort_order")
    .eq("status", "published")
    .in("unit_id", unitIds)
    .order("sort_order", { ascending: true });
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);
  const lessons = (lessonRows ?? []) as Array<{
    id: string;
    unit_id: string;
    slug: string;
    sort_order: number;
  }>;
  const lessonIds = lessons.map((l) => l.id);

  // 4. Mots `is_new` par leçon — seul critère de complétion (même règle que
  // `getLessonWordMap` utilisé par le dashboard). Phase 88K : requête chunkée
  // par lesson_id (LESSON_ID_CHUNK_SIZE = 200) — même régression que 88J
  // (547 leçons publiées > seuil `.in()` ≈ 396 ids).
  const lessonWordIds = new Map<string, string[]>();
  if (lessonIds.length > 0) {
    const lwRows = await selectInChunks<{ lesson_id: string; word_id: string }>(
      lessonIds,
      "lesson_words",
      (batch) =>
        client
          .from("lesson_words")
          .select("lesson_id, word_id")
          .eq("is_new", true)
          .in("lesson_id", batch)
          .order("position", { ascending: true }),
      LESSON_ID_CHUNK_SIZE,
    );
    for (const row of lwRows) {
      const arr = lessonWordIds.get(row.lesson_id) ?? [];
      arr.push(row.word_id);
      lessonWordIds.set(row.lesson_id, arr);
    }
  }

  // 5. Progression de l'utilisateur sur tous les mots `is_new` (batch).
  const allNewWordIds = [...new Set([...lessonWordIds.values()].flat())];
  const progressByWord =
    allNewWordIds.length > 0
      ? await getUserWordProgress(client, userId, allNewWordIds)
      : new Map<string, UserWordProgress>();

  // 6. Sessions actives sur les leçons du catalogue (batch). Phase 88K :
  // requête chunkée par lesson_id (même seuil `.in()` que lesson_words).
  const activeLessonIds = new Set<string>();
  if (lessonIds.length > 0) {
    const sessionRows = await selectInChunks<{ lesson_id: string }>(
      lessonIds,
      "lesson_sessions",
      (batch) =>
        client
          .from("lesson_sessions")
          .select("lesson_id")
          .eq("user_id", userId)
          .eq("status", "in_progress")
          .in("lesson_id", batch),
      LESSON_ID_CHUNK_SIZE,
    );
    for (const row of sessionRows) {
      activeLessonIds.add(row.lesson_id);
    }
  }

  // 7. Regroupement en mémoire + calcul pur par sourate.
  const out: SurahProgress[] = [];
  for (const path of paths) {
    const surah = Array.isArray(path.surahs) ? (path.surahs[0] ?? null) : path.surahs;
    const surahNumber = surah?.number ?? 0;
    const pathUnitIds = units.filter((u) => u.path_id === path.id).map((u) => u.id);
    const orderedLessons = lessons
      .filter((l) => pathUnitIds.includes(l.unit_id))
      .sort(
        (a, b) =>
          (unitOrder.get(a.unit_id) ?? 0) - (unitOrder.get(b.unit_id) ?? 0) ||
          (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
          a.slug.localeCompare(b.slug),
      );
    out.push(
      computeSurahProgress(
        {
          surahNumber,
          lessons: orderedLessons.map((l) => ({
            lessonId: l.id,
            slug: l.slug,
            wordIds: lessonWordIds.get(l.id) ?? [],
          })),
        },
        progressByWord,
        activeLessonIds,
      ),
    );
  }

  return out;
}

/** Lit une leçon par slug, avec ses mots coraniques associés (ordonnés). */
export async function getLessonWithWords(
  client: SupabaseClient,
  slug: string,
): Promise<{ lesson: Lesson; words: LessonWordWithWord[]; surahNumber: number | null } | null> {
  const { data: lessonRows, error: lessonError } = await client
    .from("lessons")
    .select("*")
    .eq("slug", slug)
    .limit(1);
  if (lessonError) throw new Error(`lesson ${slug} : ${lessonError.message}`);
  const lesson = (lessonRows?.[0] ?? null) as Lesson | null;
  if (!lesson) return null;

  // Le rattachement à la sourate est explicite via lesson → unit → path.
  // Aucun fallback silencieux vers Al-Fatihah n'est autorisé.
  let surahNumber: number | null = null;
  const { data: unitRows, error: unitError } = await client
    .from("units")
    .select("path_id")
    .eq("id", lesson.unit_id)
    .limit(1);
  if (unitError) throw new Error(`unit ${lesson.unit_id} : ${unitError.message}`);
  const pathId = (unitRows?.[0] as { path_id: string } | undefined)?.path_id;
  if (pathId) {
    const { data: pathRows, error: pathError } = await client
      .from("learning_paths")
      .select("surah_id")
      .eq("id", pathId)
      .limit(1);
    if (pathError) throw new Error(`learning_path ${pathId} : ${pathError.message}`);
    const surahId = (pathRows?.[0] as { surah_id: string | null } | undefined)?.surah_id;
    if (surahId) {
      const { data: surahRows, error: surahError } = await client
        .from("surahs")
        .select("number")
        .eq("id", surahId)
        .limit(1);
      if (surahError) throw new Error(`surah ${surahId} : ${surahError.message}`);
      surahNumber = (surahRows?.[0] as { number: number } | undefined)?.number ?? null;
    }
  }

  const { data: lwRows, error: lwError } = await client
    .from("lesson_words")
    .select("*")
    .eq("lesson_id", lesson.id)
    .order("position", { ascending: true });
  if (lwError) throw new Error(`lesson_words : ${lwError.message}`);

  const lessonWords = (lwRows ?? []) as LessonWord[];
  const wordIds = [...new Set(lessonWords.map((lw) => lw.word_id))];

  const wordById = new Map<string, QuranWord>();
  if (wordIds.length > 0) {
    const { data: wordRows, error: wordError } = await client
      .from("quran_words")
      .select("*")
      .in("id", wordIds);
    if (wordError) throw new Error(`quran_words : ${wordError.message}`);
    for (const w of (wordRows ?? []) as QuranWord[]) wordById.set(w.id, w);
  }

  // Les mots dont la fiche coranique est introuvable sont écartés (jamais de
  // données inventées à la place).
  const words = lessonWords
    .map((lw) => ({ ...lw, word: wordById.get(lw.word_id) as QuranWord }))
    .filter((lw) => lw.word != null);

  return { lesson, words, surahNumber };
}

/**
 * Mots NOUVEAUX de chaque leçon (Map lesson_id → word_id[]), pour le calcul de
 * statut. Seuls les mots `is_new = true` définissent la complétion d'une
 * leçon : les mots de RÉVISION (is_new = false, réintroduits depuis des
 * leçons précédentes) sont du renforcement, pas un critère de complétion.
 */
export async function getLessonWordMap(
  client: SupabaseClient,
  lessonIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  for (const id of lessonIds) map.set(id, []);
  if (lessonIds.length === 0) return map;

  const { data, error } = await client
    .from("lesson_words")
    .select("lesson_id, word_id")
    .eq("is_new", true)
    .in("lesson_id", lessonIds)
    .order("position", { ascending: true });
  if (error) throw new Error(`lesson_words : ${error.message}`);
  for (const row of (data ?? []) as Array<{ lesson_id: string; word_id: string }>) {
    map.get(row.lesson_id)?.push(row.word_id);
  }
  return map;
}

/** Progression des mots de l'utilisateur (Map word_id → ligne). */
export async function getUserWordProgress(
  client: SupabaseClient,
  userId: string,
  wordIds: string[],
): Promise<Map<string, UserWordProgress>> {
  const map = new Map<string, UserWordProgress>();
  if (wordIds.length === 0) return map;

  const rows = await selectInChunks<UserWordProgress>(
    wordIds,
    "user_word_progress",
    (batch) => client.from("user_word_progress").select("*").eq("user_id", userId).in("word_id", batch),
  );
  for (const row of rows) map.set(row.word_id, row);
  return map;
}

/** Lignes review_items de l'utilisateur (Map word_id → ligne). */
export async function getUserReviewItems(
  client: SupabaseClient,
  userId: string,
  wordIds: string[],
): Promise<Map<string, ReviewItem>> {
  const map = new Map<string, ReviewItem>();
  if (wordIds.length === 0) return map;

  const { data, error } = await client
    .from("review_items")
    .select("*")
    .eq("user_id", userId)
    .in("word_id", wordIds);
  if (error) throw new Error(`review_items : ${error.message}`);
  for (const row of (data ?? []) as ReviewItem[]) map.set(row.word_id, row);
  return map;
}

/** Nombre d'enregistrements audio réels disponibles pour des mots donnés. */
export async function getWordAudioCount(
  client: SupabaseClient,
  wordIds: string[],
): Promise<number> {
  if (wordIds.length === 0) return 0;
  const { count, error } = await client
    .from("word_audio")
    .select("*", { count: "exact", head: true })
    .in("word_id", wordIds);
  if (error) throw new Error(`word_audio : ${error.message}`);
  return count ?? 0;
}

const WORD_AUDIO_BUCKET = "word-audio";
const WORD_AUDIO_URL_TTL = 60 * 60; // 1 h (durée d'une session de leçon).
const WORD_AUDIO_PATH_PATTERN = /^muallim\/[0-9a-f-]{36}\.opus$/;

/**
 * État de résolution audio d'une leçon : URLs signées + compteurs permettant à
 * l'UI de distinguer « aucun audio enregistré » (NO_AUDIO_REGISTERED) d'un
 * échec technique de signature (AUDIO_SIGNING_ERROR / AUDIO_ACCESS_DENIED /
 * AUDIO_INVALID_PATH). Les échecs techniques sont journalisés côté serveur
 * (console.error) sans exposer d'information sensible au client.
 */
export type WordAudioState = {
  /** URL signée (TTL 1 h) par word_id dont la signature a réussi. */
  urls: Map<string, string>;
  /** Nombre de mots disposant d'une ligne word_audio (audio enregistré). */
  registered: number;
  /** Nombre de mots dont la signature a réussi. */
  signed: number;
};

/**
 * URL audio signées (Storage) des mots demandés, une par forme (récitation
 * Muallim). `word_audio.audio_url` est un chemin Storage (`muallim/{word_id}.opus`) ;
 * on signe chaque chemin en batch (aucun N+1 sur la table, signatures groupées).
 *
 * - Un mot sans ligne word_audio est simplement absent (jamais d'URL inventée).
 * - Un chemin invalide ou un échec de signature est JOURNALISÉ côté serveur
 *   (erreur observable), jamais transformé silencieusement en « pas d'audio ».
 */
export async function getWordAudioState(
  client: SupabaseClient,
  wordIds: string[],
): Promise<WordAudioState> {
  const urls = new Map<string, string>();
  if (wordIds.length === 0) return { urls, registered: 0, signed: 0 };

  const { data, error } = await client
    .from("word_audio")
    .select("word_id, audio_url")
    .in("word_id", wordIds);
  if (error) throw new Error(`word_audio : ${error.message}`);

  const rows = (data ?? []) as Array<{ word_id: string; audio_url: string }>;

  await Promise.all(
    rows.map(async (row) => {
      const path = typeof row.audio_url === "string" ? row.audio_url : "";
      if (!WORD_AUDIO_PATH_PATTERN.test(path)) {
        console.error(
          `[word_audio] AUDIO_INVALID_PATH word_id=${row.word_id} (attendu muallim/{uuid}.opus)`,
        );
        return;
      }
      try {
        const { data: signed, error: signError } = await client.storage
          .from(WORD_AUDIO_BUCKET)
          .createSignedUrl(path, WORD_AUDIO_URL_TTL);
        if (signError) {
          // « Object not found » masque indifféremment objet absent et accès
          // refusé (RLS) : on journalise sans trancher arbitrairement.
          console.error(
            `[word_audio] AUDIO_SIGNING_ERROR word_id=${row.word_id} message=${signError.message}`,
          );
          return;
        }
        if (!signed?.signedUrl) {
          console.error(
            `[word_audio] AUDIO_SIGNING_ERROR word_id=${row.word_id} (URL signée vide)`,
          );
          return;
        }
        urls.set(row.word_id, signed.signedUrl);
      } catch (err) {
        console.error(
          `[word_audio] AUDIO_SIGNING_ERROR word_id=${row.word_id} exception=${
            err instanceof Error ? err.message : "inconnue"
          }`,
        );
      }
    }),
  );

  return { urls, registered: rows.length, signed: urls.size };
}

/**
 * Rétrocompat : URLs signées uniquement (utilisé par les scripts d'audit).
 */
export async function getWordAudioUrls(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, string>> {
  return (await getWordAudioState(client, wordIds)).urls;
}

/**
 * Maîtrise par compétence d'un utilisateur sur des mots (lecture batch).
 * Retourne Map(word_id → Map(skill → état)). Les compétences sans ligne sont
 * absentes (niveau 0 implicite).
 */
export async function getUserSkillProgress(
  client: SupabaseClient,
  userId: string,
  wordIds: string[],
): Promise<Map<string, Map<Skill, SkillProgressState>>> {
  const map = new Map<string, Map<Skill, SkillProgressState>>();
  if (wordIds.length === 0) return map;

  const { data, error } = await client
    .from("user_word_skill_progress")
    .select(
      "word_id, skill, correct_count, incorrect_count, mastery, current_streak, last_correct_at, last_incorrect_at, last_attempt_at",
    )
    .eq("user_id", userId)
    .in("word_id", wordIds);
  if (error) throw new Error(`user_word_skill_progress : ${error.message}`);

  for (const row of (data ?? []) as Array<{
    word_id: string;
    skill: string;
    correct_count: number;
    incorrect_count: number;
    mastery: number;
    current_streak: number;
    last_correct_at: string | null;
    last_incorrect_at: string | null;
    last_attempt_at: string | null;
  }>) {
    if (!(SKILLS as readonly string[]).includes(row.skill)) continue;
    const skill = row.skill as Skill;
    if (!map.has(row.word_id)) map.set(row.word_id, new Map());
    map.get(row.word_id)!.set(skill, {
      skill,
      correctCount: row.correct_count,
      incorrectCount: row.incorrect_count,
      currentStreak: row.current_streak,
      lastCorrectAt: row.last_correct_at,
      lastIncorrectAt: row.last_incorrect_at,
      mastery: row.mastery as SkillProgressState["mastery"],
      lastAttemptAt: row.last_attempt_at,
    });
  }
  return map;
}

/**
 * Traductions lexicales françaises VALIDÉES des mots demandés.
 *
 * Phase 7 (Voie B) : lit `word_translations` (langue `fr`, is_validated=true)
 * en batch (`IN(wordIds)`), joint la provenance (`sources`) — aucun N+1.
 *
 * ⚠️ Règle multi-sources : si plusieurs traductions FR validées existent pour
 * un même mot, la PLUS RÉCENTE (updated_at DESC) est retenue. C'est une règle
 * purement technique de résolution — elle ne signifie PAS que la plus récente
 * est éditorialement la meilleure.
 *
 * Les lignes PROPOSÉES (is_validated=false) sont invisibles ici : un FR
 * proposé n'est jamais utilisé comme traduction pédagogique principale.
 */
export async function getValidatedFrenchMeanings(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, FrenchLexicalMeaning>> {
  const map = new Map<string, FrenchLexicalMeaning>();
  if (wordIds.length === 0) return map;

  const rows = await selectInChunks<{
    word_id: string;
    text: string;
    validated_at: string | null;
    sources: { name: string | null } | Array<{ name: string | null }> | null;
  }>(wordIds, "word_translations", (batch) =>
    client
      .from("word_translations")
      .select("word_id, text, validated_at, sources(name)")
      .eq("language", "fr")
      .eq("is_validated", true)
      .in("word_id", batch)
      .order("updated_at", { ascending: false }),
  );

  for (const row of rows) {
    // Première ligne validée par mot = la plus récente (ORDER BY updated_at DESC).
    if (map.has(row.word_id)) continue;
    const source = Array.isArray(row.sources)
      ? row.sources[0] ?? null
      : row.sources;
    map.set(row.word_id, {
      text: row.text,
      source: source ? { name: source.name } : null,
      validated: true,
      validatedAt: row.validated_at,
    });
  }
  return map;
}

/**
 * Traductions lexicales françaises VALIDÉES AU NIVEAU DU LEMME
 * (`lemma_translations` — Phase 17C, Option B). Miroir de
 * `getValidatedFrenchMeanings` à la granularité LEMME : même règle
 * multi-sources (la plus récente, updated_at DESC) et même filtrage
 * (is_validated = true uniquement).
 */
export async function getValidatedFrenchLemmaMeanings(
  client: SupabaseClient,
  lemmaIds: string[],
): Promise<Map<string, FrenchLexicalMeaning>> {
  const map = new Map<string, FrenchLexicalMeaning>();
  if (lemmaIds.length === 0) return map;

  const { data, error } = await client
    .from("lemma_translations")
    .select("lemma_id, text, validated_at, sources(name)")
    .eq("language", "fr")
    .eq("is_validated", true)
    .in("lemma_id", lemmaIds)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`lemma_translations : ${error.message}`);

  for (const row of (data ?? []) as Array<{
    lemma_id: string;
    text: string;
    validated_at: string | null;
    sources: { name: string | null } | Array<{ name: string | null }> | null;
  }>) {
    if (map.has(row.lemma_id)) continue;
    const source = Array.isArray(row.sources)
      ? row.sources[0] ?? null
      : row.sources;
    map.set(row.lemma_id, {
      text: row.text,
      source: source ? { name: source.name } : null,
      validated: true,
      validatedAt: row.validated_at,
    });
  }
  return map;
}

/**
 * Mappings FORME → LEMME de la surcouche additive `word_lemma_mapping`
 * (Phase 21B-C, Option B), pour des `word_id` donnés. Ne retourne QUE les
 * mappings `confidence = 'safe'` (REVIEW_REQUIRED / REJECTED ne sont jamais
 * importés et sont donc ignorés). UNIQUE(word_id) garantit un seul lemme par
 * mot. Requête batch unique (`.in()`), aucun N+1.
 */
export async function getWordLemmaMappingsByWordIds(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (wordIds.length === 0) return map;

  const rows = await selectInChunks<{ word_id: string; lemma_id: string }>(
    wordIds,
    "word_lemma_mapping",
    (batch) => client.from("word_lemma_mapping").select("word_id, lemma_id").eq("confidence", "safe").in("word_id", batch),
  );

  for (const row of rows) {
    map.set(row.word_id, row.lemma_id);
  }
  return map;
}

/**
 * Contexte du verset RÉEL où chaque mot apparaît (pour CONTEXT_RECOGNITION).
 * Restreint à une sourate (Al-Fatiha par défaut) : pour chaque mot, le premier
 * verset (ordre canonique) où la forme apparaît, avec le texte arabe du verset
 * et sa traduction française réelle (Hamidullah). Aucun texte n'est inventé.
 */
export async function getWordAyahContexts(
  client: SupabaseClient,
  wordIds: string[],
  surahNumber: number | null,
): Promise<Map<string, WordContextData>> {
  const map = new Map<string, WordContextData>();
  if (wordIds.length === 0) return map;
  if (surahNumber == null) return map;

  const { data: surahRows, error: surahError } = await client
    .from("surahs")
    .select("id")
    .eq("number", surahNumber)
    .limit(1);
  if (surahError) throw new Error(`surahs : ${surahError.message}`);
  const surahId = (surahRows?.[0] as { id: string } | undefined)?.id;
  if (!surahId) return map;

  const { data: occRows, error: occError } = await client
    .from("word_occurrences")
    .select("word_id, ayahs!inner(id, ayah_number, text_uthmani)")
    .in("word_id", wordIds)
    .eq("ayahs.surah_id", surahId);
  if (occError) throw new Error(`word_occurrences : ${occError.message}`);

  // Premier verset (ordre canonique) où chaque mot apparaît.
  const bestByWord = new Map<
    string,
    { ayahId: string; ayahNumber: number; arabic: string }
  >();
  const rows = (occRows ?? []) as unknown as Array<{
    word_id: string;
    ayahs:
      | { id: string; ayah_number: number; text_uthmani: string }
      | Array<{ id: string; ayah_number: number; text_uthmani: string }>;
  }>;
  for (const row of rows) {
    const ayah = Array.isArray(row.ayahs) ? row.ayahs[0] : row.ayahs;
    if (!ayah) continue;
    const current = bestByWord.get(row.word_id);
    if (!current || ayah.ayah_number < current.ayahNumber) {
      bestByWord.set(row.word_id, {
        ayahId: ayah.id,
        ayahNumber: ayah.ayah_number,
        arabic: ayah.text_uthmani,
      });
    }
  }

  const ayahIds = [...new Set([...bestByWord.values()].map((b) => b.ayahId))];
  const frenchByAyah = new Map<string, string>();
  if (ayahIds.length > 0) {
    const { data: frRows, error: frError } = await client
      .from("translations")
      .select("ayah_id, text")
      .eq("language", "fr")
      .in("ayah_id", ayahIds);
    if (frError) throw new Error(`translations : ${frError.message}`);
    for (const t of (frRows ?? []) as Array<{ ayah_id: string; text: string }>) {
      frenchByAyah.set(t.ayah_id, stripHtml(t.text));
    }
  }

  for (const [wordId, b] of bestByWord) {
    map.set(wordId, {
      surahNumber,
      ayahNumber: b.ayahNumber,
      arabic: b.arabic,
      french: frenchByAyah.get(b.ayahId) ?? null,
    });
  }
  return map;
}

/**
 * Relations FORME → LEMME réelles (pour LEMMA_RELATION). Pour chaque mot, le
 * lemme effectif (`quran_words.lemma_id` DIRECT prioritaire, sinon surcouche
 * `word_lemma_mapping` safe) et les AUTRES formes partageant ce même lemme.
 * Si un mot n'a pas de lemme fiable ou aucun « frère », il est ABSENT de la map
 * (l'exercice ne sera pas généré — on ne fabrique jamais de relation par texte).
 */
export async function getWordLemmaRelations(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, WordLemmaData>> {
  const map = new Map<string, WordLemmaData>();
  if (wordIds.length === 0) return map;

  const [{ data: wordRows, error }, mappingByWord] = await Promise.all([
    client.from("quran_words").select("id, lemma_id").in("id", wordIds),
    getWordLemmaMappingsByWordIds(client, wordIds),
  ]);
  if (error) throw new Error(`quran_words : ${error.message}`);

  const effectiveByWord = new Map<string, string>();
  for (const w of (wordRows ?? []) as Array<{ id: string; lemma_id: string | null }>) {
    const lemma = w.lemma_id ?? mappingByWord.get(w.id);
    if (lemma) effectiveByWord.set(w.id, lemma);
  }

  const lemmaIds = [...new Set(effectiveByWord.values())];
  if (lemmaIds.length === 0) return map;

  // Toutes les formes (directes + mappées) partageant chaque lemme.
  const [{ data: directRows, error: directError }, { data: mappedRows, error: mappedError }] =
    await Promise.all([
      client.from("quran_words").select("id, lemma_id").in("lemma_id", lemmaIds),
      client
        .from("word_lemma_mapping")
        .select("word_id, lemma_id")
        .eq("confidence", "safe")
        .in("lemma_id", lemmaIds),
    ]);
  if (directError) throw new Error(`quran_words : ${directError.message}`);
  if (mappedError) throw new Error(`word_lemma_mapping : ${mappedError.message}`);

  const wordToLemma = new Map<string, string>();
  for (const w of (directRows ?? []) as Array<{ id: string; lemma_id: string | null }>) {
    if (w.lemma_id) wordToLemma.set(w.id, w.lemma_id);
  }
  for (const m of (mappedRows ?? []) as Array<{ word_id: string; lemma_id: string }>) {
    if (!wordToLemma.has(m.word_id)) wordToLemma.set(m.word_id, m.lemma_id);
  }

  const allWordIds = [...new Set(wordToLemma.keys())];
  const { data: arabicRows, error: arabicError } = await client
    .from("quran_words")
    .select("id, arabic")
    .in("id", allWordIds);
  if (arabicError) throw new Error(`quran_words : ${arabicError.message}`);
  const arabicById = new Map<string, string>();
  for (const w of (arabicRows ?? []) as Array<{ id: string; arabic: string }>) {
    arabicById.set(w.id, w.arabic);
  }

  for (const wordId of wordIds) {
    const lemmaId = effectiveByWord.get(wordId);
    if (!lemmaId) continue;
    const siblings: Array<{ wordId: string; arabic: string }> = [];
    for (const [otherId, otherLemma] of wordToLemma) {
      if (otherId === wordId || otherLemma !== lemmaId) continue;
      const arabic = arabicById.get(otherId);
      if (arabic) siblings.push({ wordId: otherId, arabic });
    }
    if (siblings.length > 0) map.set(wordId, { lemmaId, siblings });
  }
  return map;
}

/**
 * Évidence linguistique MASAQ PAR MOT (Phase 24I) — lecture seule de la couche
 * `linguistic_occurrences` + `linguistic_segments`, limitée à une sourate
 * (Al-Fātiḥah). Pour chaque mot, la PREMIÈRE occurrence (ordre canonique) est
 * retenue (même politique que `getWordAyahContexts`).
 *
 * MASAQ est UNIQUEMENT une couche d'EXPLICATION : aucun effet sur le grading,
 * le SRS, la maîtrise, le word bank ni la génération des exercices.
 */
export async function getWordLinguisticEvidence(
  client: SupabaseClient,
  wordIds: string[],
  surahNumber: number | null,
): Promise<Map<string, LinguisticEvidence>> {
  const map = new Map<string, LinguisticEvidence>();
  if (wordIds.length === 0 || surahNumber == null) return map;

  type LingRow = {
    id: string;
    surah_number: number;
    ayah_number: number;
    position: number;
    masaq_word: string;
    masaq_stem: string | null;
    masaq_gloss_en: string | null;
    pos: string[] | null;
    case_mood: string[] | null;
    syntactic_roles: string[] | null;
    lemma_mapping_status: string | null;
    word_occurrences:
      | { word_id: string }
      | Array<{ word_id: string }>
      | null;
  };

  // Phase 68B — chunking des deux `.in()` (IN_FILTER_CHUNK_SIZE = 250).
  // Une sourate entière produit >1000 occurrences (ex. 9 → 2498), et le filtre
  // `.in("linguistic_occurrence_id", …)` dépassant ~395-397 UUIDs déclenchait
  // « fetch failed » (Header overflow HTTP/1.1 — cf. constante
  // IN_FILTER_CHUNK_SIZE). Sémantique métier inchangée : chaque word_id
  // n'appartient qu'à un seul lot, donc la politique « première occurrence par
  // mot » (ordre ayah_number, position) est préservée ; les segments d'une
  // occurrence restent dans le même lot (ordre segment_no préservé).
  const lingRows = await selectInChunks<LingRow>(
    [...new Set(wordIds)],
    "linguistic_occurrences",
    (batch) =>
      client
        .from("linguistic_occurrences")
        .select(
          "id, surah_number, ayah_number, position, masaq_word, masaq_stem, masaq_gloss_en, pos, case_mood, syntactic_roles, lemma_mapping_status, word_occurrences!inner(word_id)",
        )
        .eq("surah_number", surahNumber)
        .in("word_occurrences.word_id", batch)
        .order("ayah_number")
        .order("position"),
  );
  if (lingRows.length === 0) return map;

  const lingIds = lingRows.map((r) => r.id);
  const segRows = await selectInChunks<{
    linguistic_occurrence_id: string;
    segment_no: number;
    segment_text: string;
    morph_type: string;
    morph_tag: string;
    segment_kind: LinguisticEvidenceSegment["kind"];
  }>(
    lingIds,
    "linguistic_segments",
    (batch) =>
      client
        .from("linguistic_segments")
        .select("linguistic_occurrence_id, segment_no, segment_text, morph_type, morph_tag, segment_kind")
        .in("linguistic_occurrence_id", batch)
        .order("segment_no"),
  );

  const segsByOcc = new Map<string, LinguisticEvidenceSegment[]>();
  for (const s of segRows) {
    const arr = segsByOcc.get(s.linguistic_occurrence_id) ?? [];
    arr.push({
      segmentNo: s.segment_no,
      text: s.segment_text,
      morphType: s.morph_type,
      morphTag: s.morph_tag,
      kind: s.segment_kind,
    });
    segsByOcc.set(s.linguistic_occurrence_id, arr);
  }

  const seen = new Set<string>();
  for (const r of lingRows) {
    const wo = Array.isArray(r.word_occurrences)
      ? r.word_occurrences[0]
      : r.word_occurrences;
    const wordId = wo?.word_id;
    if (!wordId || seen.has(wordId)) continue;
    seen.add(wordId);
    map.set(wordId, {
      surah: r.surah_number,
      ayah: r.ayah_number,
      position: r.position,
      masaqWord: r.masaq_word,
      stem: r.masaq_stem,
      glossEn: r.masaq_gloss_en,
      pos: r.pos ?? [],
      caseMood: r.case_mood ?? [],
      syntax: r.syntactic_roles ?? [],
      segments: segsByOcc.get(r.id) ?? [],
      lemmaMappingStatus: r.lemma_mapping_status,
    });
  }
  return map;
}

/**
 * Glosses FR de LEMME résolues PAR MOT (`word_id`), avec la précédence
 * (Phase 21B-D) :
 *
 *   1. `quran_words.lemma_id` DIRECT (donnée native) → prioritaire ;
 *   2. `word_lemma_mapping.lemma_id` (surcouche additive) → complément.
 *
 * Utilisée comme repli derrière les glosses FORME de `word_translations`
 * (précédence globale forme > lemme direct > lemme via mapping > EN).
 *
 * Aucun matching par `normalized_text`, aucun fuzzy matching : seul le
 * `word_id` exact est utilisé. Les deux sources sont lues en batch (aucun N+1) ;
 * les `lemma_id` candidats sont regroupés avant un unique `.in()` sur
 * `lemma_translations`. Un mapping n'écrase JAMAIS un `lemma_id` direct valide.
 */
export async function getValidatedFrenchLemmaMeaningsByWord(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, FrenchLexicalMeaning>> {
  const map = new Map<string, FrenchLexicalMeaning>();
  if (wordIds.length === 0) return map;

  // Lecture batch (chunkée) des deux sources de lemme (directe + surcouche mapping).
  const [rows, mappingByWord] = await Promise.all([
    selectInChunks<{ id: string; lemma_id: string | null }>(
      wordIds,
      "quran_words",
      (batch) => client.from("quran_words").select("id, lemma_id").in("id", batch),
    ),
    getWordLemmaMappingsByWordIds(client, wordIds),
  ]);

  // Regroupe TOUS les lemma_id candidats (directs + mappés) en une seule requête.
  const lemmaIds = [
    ...new Set(
      rows.flatMap((w) =>
        [w.lemma_id, mappingByWord.get(w.id) ?? null].filter(
          (x): x is string => x != null,
        ),
      ),
    ),
  ];
  const lemmaMap = await getValidatedFrenchLemmaMeanings(client, lemmaIds);

  for (const w of rows) {
    // 1. LEMME DIRECT (quran_words.lemma_id) — prioritaire, jamais écrasé.
    if (w.lemma_id) {
      const direct = lemmaMap.get(w.lemma_id);
      if (direct) {
        map.set(w.id, direct);
        continue;
      }
    }
    // 2. LEMME VIA word_lemma_mapping — complément (jamais un remplacement).
    const mappedLemmaId = mappingByWord.get(w.id);
    if (mappedLemmaId) {
      const mapped = lemmaMap.get(mappedLemmaId);
      if (mapped) map.set(w.id, mapped);
    }
  }
  return map;
}

/**
 * Explications pédagogiques de sens VALIDÉES (Phase 44B) — par FORME.
 *
 * Couche « EXPLICATION DE SENS » (word_explanations, migration 0031) : courte
 * formulation pédagogique française, distincte de la glose (word_translations),
 * des notes éditoriales et de la couche MASAQ. Miroir de
 * `getValidatedFrenchMeanings` à la granularité FORME : batch, is_validated=true
 * uniquement, provenance jointe. Aucun impact sur le resolver de traduction,
 * le SRS, la mastery, le coverage, le curriculum ni les exercices : cette
 * couche est STRICTEMENT passive (affichage « après l'effort » uniquement).
 *
 * ⚠️ Une forme peut légitimement n'avoir AUCUNE explication : absence ≠ erreur
 * (la glose + le contexte existants suffisent). Le Map ne contient alors aucune
 * entrée pour ce word_id.
 */
export type WordSenseExplanation = {
  text: string;
  source: string | null;
  validatedAt: string | null;
};

export async function getValidatedWordExplanations(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, WordSenseExplanation>> {
  const map = new Map<string, WordSenseExplanation>();
  if (wordIds.length === 0) return map;

  const { data, error } = await client
    .from("word_explanations")
    .select("word_id, text, validated_at, sources(name)")
    .eq("language", "fr")
    .eq("is_validated", true)
    .in("word_id", wordIds)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`word_explanations : ${error.message}`);

  for (const row of (data ?? []) as Array<{
    word_id: string;
    text: string;
    validated_at: string | null;
    sources: { name: string | null } | Array<{ name: string | null }> | null;
  }>) {
    if (map.has(row.word_id)) continue;
    const source = Array.isArray(row.sources)
      ? row.sources[0] ?? null
      : row.sources;
    map.set(row.word_id, {
      text: row.text,
      source: source ? source.name : null,
      validatedAt: row.validated_at,
    });
  }
  return map;
}

/**
 * Overrides contextuels d'explication VALIDÉS (Phase 44B) — par (word_id → ayah).
 *
 * `word_explanation_contexts` précise le sens pour un verset donné (idiome,
 * polysémie) ; le contexte ne contredit JAMAIS l'explication générique. Retourne
 * Map(word_id → Map("surah:ayah" → texte)), batch is_validated=true uniquement.
 */
export async function getValidatedWordExplanationContexts(
  client: SupabaseClient,
  wordIds: string[],
): Promise<Map<string, Map<string, string>>> {
  const map = new Map<string, Map<string, string>>();
  if (wordIds.length === 0) return map;

  // 1. Explications génériques validées de ces mots → id.
  const { data: explRows, error: explError } = await client
    .from("word_explanations")
    .select("id, word_id")
    .eq("language", "fr")
    .eq("is_validated", true)
    .in("word_id", wordIds);
  if (explError) throw new Error(`word_explanations : ${explError.message}`);
  const rows = (explRows ?? []) as Array<{ id: string; word_id: string }>;
  if (rows.length === 0) return map;

  // 2. Contextes validés de ces explications (batch) + ayah jointe.
  const explIds = rows.map((r) => r.id);
  const { data: ctxRows, error: ctxError } = await client
    .from("word_explanation_contexts")
    .select("word_explanation_id, text, ayahs!inner(ayah_number, surahs!inner(number))")
    .eq("is_validated", true)
    .in("word_explanation_id", explIds);
  if (ctxError) throw new Error(`word_explanation_contexts : ${ctxError.message}`);

  const wordIdByExpl = new Map(rows.map((r) => [r.id, r.word_id]));
  for (const row of (ctxRows ?? []) as Array<{
    word_explanation_id: string;
    text: string;
    ayahs: Array<{ ayah_number: number; surahs: Array<{ number: number }> }>;
  }>) {
    const wordId = wordIdByExpl.get(row.word_explanation_id);
    if (!wordId) continue;
    const ayah = row.ayahs[0];
    const surah = ayah?.surahs[0];
    if (!ayah || !surah) continue;
    const key = `${surah.number}:${ayah.ayah_number}`;
    if (!map.has(wordId)) map.set(wordId, new Map());
    map.get(wordId)!.set(key, row.text);
  }
  return map;
}

/**
 * Retire le balisage HTML présent dans certaines traductions (ex. notes de bas
 * de page Hamidullah : `<sup foot_note="…">1</sup>`). Le texte est conservé
 * tel quel — seul le formatage est enlevé, aucune donnée n'est inventée.
 */
export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Contexte d'un verset étudié dans une leçon (arabe + traduction FR réelle).
 *
 * ⚠️ CONTEXTE / SENS DU VERSET — PAS UNE DONNÉE LEXICALE DU MOT (validée Phase 5).
 * `french` provient de la table `translations` (Hamidullah, niveau verset) et
 * doit être présenté comme contexte du verset étudié. Il ne doit JAMAIS être
 * confondu avec la gloss mot-à-mot d'un token (`quran_words.meaning`, résolue
 * par `lib/learning/language.ts`) : le lexique français mot-à-mot n'existe pas
 * encore dans les données et fera l'objet d'une phase dédiée.
 */
export type LessonAyahContext = {
  surahNumber: number;
  surahName: string | null;
  ayahNumber: number;
  /** Texte arabe du verset (text_uthmani, jamais modifié). */
  arabic: string;
  /** Traduction française réelle (Hamidullah) du VERSET — null si absente. */
  french: string | null;
  /** Numéro global de l'ayah (1–6236), pour le CDN audio. Null si absent. */
  globalAyahNumber: number | null;
};

/**
 * Versets « cœur » d'une leçon : ceux où les mots de la leçon co-occurrent le
 * plus (leçon → occurrences → versets). La traduction FRANÇAISE réelle
 * (table translations, Hamidullah) est jointe quand elle existe.
 */
export async function getLessonAyahContext(
  client: SupabaseClient,
  wordIds: string[],
  limit = 3,
  surahNumber: number | null = null,
): Promise<LessonAyahContext[]> {
  if (wordIds.length === 0) return [];

  let occurrencesQuery = client
    .from("word_occurrences")
    .select("ayah_id, word_id, ayahs!inner(surah_id)")
    .in("word_id", wordIds);
  if (surahNumber != null) {
    const { data: surahRows, error: surahError } = await client
      .from("surahs")
      .select("id")
      .eq("number", surahNumber)
      .limit(1);
    if (surahError) throw new Error(`surahs : ${surahError.message}`);
    const surahId = (surahRows?.[0] as { id: string } | undefined)?.id;
    if (!surahId) return [];
    occurrencesQuery = occurrencesQuery.eq("ayahs.surah_id", surahId);
  }
  const { data: occRows, error: occError } = await occurrencesQuery;
  if (occError) throw new Error(`word_occurrences : ${occError.message}`);

  // Comptage distinct des mots de la leçon par verset (co-occurrence).
  const countByAyah = new Map<string, number>();
  const seen = new Set<string>();
  for (const occ of (occRows ?? []) as Array<{ ayah_id: string; word_id: string }>) {
    const key = `${occ.ayah_id}:${occ.word_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    countByAyah.set(occ.ayah_id, (countByAyah.get(occ.ayah_id) ?? 0) + 1);
  }
  const max = Math.max(0, ...countByAyah.values());
  // Les mots de la leçon doivent partager au moins 2 occurrences dans un même
  // verset pour que le « verset étudié » soit fiable (sinon aucun contexte).
  if (max < 2) return [];
  const candidateIds = [...countByAyah.entries()]
    .filter(([, n]) => n === max)
    .map(([id]) => id);
  if (candidateIds.length === 0) return [];

  const { data: ayahRows, error: ayahError } = await client
    .from("ayahs")
    .select("id, surah_id, ayah_number, global_ayah_number, text_uthmani")
    .in("id", candidateIds);
  if (ayahError) throw new Error(`ayahs : ${ayahError.message}`);

  const surahIds = [...new Set((ayahRows ?? []).map((a) => a.surah_id))];
  const surahById = new Map<string, { number: number; name_translation: string | null }>();
  if (surahIds.length > 0) {
    const { data: surahRows, error: surahError } = await client
      .from("surahs")
      .select("id, number, name_translation")
      .in("id", surahIds);
    if (surahError) throw new Error(`surahs : ${surahError.message}`);
    for (const s of (surahRows ?? []) as Array<{
      id: string;
      number: number;
      name_translation: string | null;
    }>) {
      surahById.set(s.id, { number: s.number, name_translation: s.name_translation });
    }
  }

  const frenchByAyah = new Map<string, string>();
  const { data: frRows, error: frError } = await client
    .from("translations")
    .select("ayah_id, text")
    .eq("language", "fr")
    .in("ayah_id", candidateIds);
  if (frError) throw new Error(`translations : ${frError.message}`);
  for (const t of (frRows ?? []) as Array<{ ayah_id: string; text: string }>) {
    frenchByAyah.set(t.ayah_id, stripHtml(t.text));
  }

  const rows = (ayahRows ?? []).map((a) => {
    const surah = surahById.get(a.surah_id);
    return {
      count: countByAyah.get(a.id) ?? 0,
      surahNumber: surah?.number ?? 0,
      surahName: surah?.name_translation ?? null,
      ayahNumber: a.ayah_number,
      arabic: a.text_uthmani,
      french: frenchByAyah.get(a.id) ?? null,
      globalAyahNumber: a.global_ayah_number ?? null,
    };
  });

  // Ordre canonique (sourate, verset) puis déduplication des traductions
  // identiques (ex. la basmala répétée en tête de 113 sourates) : on garde le
  // premier verset de chaque traduction distincte, au maximum `limit`.
  rows.sort(
    (x, y) => x.surahNumber - y.surahNumber || x.ayahNumber - y.ayahNumber,
  );

  const out: LessonAyahContext[] = [];
  const seenTexts = new Set<string>();
  for (const r of rows) {
    if (out.length >= limit) break;
    const key = r.french ?? `${r.surahNumber}:${r.ayahNumber}`;
    if (seenTexts.has(key)) continue;
    seenTexts.add(key);
    out.push({
      surahNumber: r.surahNumber,
      surahName: r.surahName,
      ayahNumber: r.ayahNumber,
      arabic: r.arabic,
      french: r.french,
      globalAyahNumber: r.globalAyahNumber,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// F1 — Fiche mot (dictionnaire coranique)
// ---------------------------------------------------------------------------

/** Une occurrence d'un mot dans un verset, avec son contexte réel. */
export type WordOccurrenceWithContext = {
  surahNumber: number;
  surahName: string | null;
  ayahNumber: number;
  /** Texte arabe du verset (text_uthmani, jamais modifié). */
  arabic: string;
  /** Traduction française réelle (Hamidullah) — null si absente. */
  french: string | null;
  /** Texte de l'occurrence dans le verset. */
  occurrenceText: string;
  position: number;
};

/** Fiche complète d'un mot pour F1. */
export type WordDetail = {
  word: QuranWord;
  /** Sens résolu pour la langue pédagogique (fr par défaut, fallback étiqueté). */
  meaning: { text: string | null; language: string; isFallback: boolean };
  /** Provenance de la traduction retenue (ex. « Hikma — lexique éditorial »). */
  translationSource: string | null;
  /** true si la traduction retenue est une traduction Hikma validée. */
  isValidated: boolean;
  /** Leçons où ce mot apparaît (données réelles, triées par parcours). */
  lessons: Array<{ lessonId: string; title: string; slug: string; unitTitle: string }>;
  /** Nombre total d'occurrences réelles dans le Coran. */
  totalOccurrences: number;
  /** Première page d'occurrences (pagination « Afficher plus »). */
  occurrences: WordOccurrenceWithContext[];
};

/** Charge la fiche d'un mot (404 côté page si null). */
export async function getWordDetail(
  client: SupabaseClient,
  wordId: string,
  pageSize = 8,
): Promise<WordDetail | null> {
  const { data: wordRows, error: wordError } = await client
    .from("quran_words")
    .select("*")
    .eq("id", wordId)
    .limit(1);
  if (wordError) throw new Error(`quran_words : ${wordError.message}`);
  const word = (wordRows?.[0] ?? null) as QuranWord | null;
  if (!word) return null;

  // Lexique français Hikma VALIDÉ — forme puis lemme (Phase 17C) — fallback EN sinon.
  const [frenchByWord, lemmaFrenchByWord, { count: totalOccurrences }, occurrencePage, lessons] =
    await Promise.all([
      getValidatedFrenchMeanings(client, [wordId]),
      getValidatedFrenchLemmaMeaningsByWord(client, [wordId]),
      client
        .from("word_occurrences")
        .select("id", { count: "exact", head: true })
        .eq("word_id", wordId),
      getWordOccurrencesPage(client, wordId, 0, pageSize),
      getWordLinkedLessons(client, wordId),
    ]);

  const meaning = resolveWordMeanings(
    word,
    frenchByWord.get(wordId),
    lemmaFrenchByWord.get(wordId),
  );

  return {
    word,
    meaning,
    translationSource: meaning.translationSource ?? null,
    isValidated: meaning.isValidated ?? false,
    totalOccurrences: totalOccurrences ?? 0,
    occurrences: occurrencePage,
    lessons,
  };
}

/** Leçons liées à un mot (lesson_words → lessons → units), ordre parcours. */
async function getWordLinkedLessons(
  client: SupabaseClient,
  wordId: string,
): Promise<WordDetail["lessons"]> {
  const { data: lwRows, error: lwError } = await client
    .from("lesson_words")
    .select("lesson_id, lessons!inner(id, title, slug, unit_id, units!inner(title))")
    .eq("word_id", wordId);
  if (lwError) throw new Error(`lesson_words : ${lwError.message}`);

  const out: WordDetail["lessons"] = [];
  for (const row of (lwRows ?? []) as Array<{
    lesson_id: string;
    lessons:
      | {
          id: string;
          title: string;
          slug: string;
          unit_id: string;
          units: { title: string } | Array<{ title: string }> | null;
        }
      | Array<{
          id: string;
          title: string;
          slug: string;
          unit_id: string;
          units: { title: string } | Array<{ title: string }> | null;
        }>
      | null;
  }>) {
    const lessons = Array.isArray(row.lessons) ? row.lessons : row.lessons ? [row.lessons] : [];
    for (const lesson of lessons) {
      const units = Array.isArray(lesson.units) ? lesson.units : lesson.units ? [lesson.units] : [];
      out.push({
        lessonId: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        unitTitle: units[0]?.title ?? "",
      });
    }
  }
  return out;
}

/** Page d'occurrences d'un mot (avec contexte verset + traduction FR réelle). */
export async function getWordOccurrencesPage(
  client: SupabaseClient,
  wordId: string,
  offset: number,
  limit: number,
): Promise<WordOccurrenceWithContext[]> {
  const { data: occRows, error: occError } = await client
    .from("word_occurrences")
    .select("ayah_id, position, text")
    .eq("word_id", wordId)
    .order("position", { ascending: true })
    .range(offset, offset + limit - 1);
  if (occError) throw new Error(`word_occurrences : ${occError.message}`);

  const occurrences = (occRows ?? []) as Array<{
    ayah_id: string;
    position: number;
    text: string;
  }>;
  if (occurrences.length === 0) return [];

  const ayahIds = [...new Set(occurrences.map((o) => o.ayah_id))];

  const [{ data: ayahRows, error: ayahError }, { data: frRows, error: frError }] =
    await Promise.all([
      client.from("ayahs").select("id, surah_id, ayah_number, text_uthmani").in("id", ayahIds),
      client
        .from("translations")
        .select("ayah_id, text")
        .eq("language", "fr")
        .in("ayah_id", ayahIds),
    ]);
  if (ayahError) throw new Error(`ayahs : ${ayahError.message}`);
  if (frError) throw new Error(`translations : ${frError.message}`);

  const surahIds = [...new Set((ayahRows ?? []).map((a) => a.surah_id))];
  const surahById = new Map<string, { number: number; name: string | null }>();
  if (surahIds.length > 0) {
    const { data: surahRows, error: surahError } = await client
      .from("surahs")
      .select("id, number, name_translation")
      .in("id", surahIds);
    if (surahError) throw new Error(`surahs : ${surahError.message}`);
    for (const s of (surahRows ?? []) as Array<{
      id: string;
      number: number;
      name_translation: string | null;
    }>) {
      surahById.set(s.id, { number: s.number, name: s.name_translation });
    }
  }

  const ayahById = new Map(
    (ayahRows ?? []).map((a) => [
      a.id,
      {
        surah_id: a.surah_id,
        ayah_number: a.ayah_number,
        text_uthmani: a.text_uthmani,
      },
    ]),
  );
  const frenchByAyah = new Map<string, string>();
  for (const t of (frRows ?? []) as Array<{ ayah_id: string; text: string }>) {
    frenchByAyah.set(t.ayah_id, stripHtml(t.text));
  }

  // Ordre canonique (sourate, verset, position dans le verset).
  return occurrences
    .map((o) => {
      const ayah = ayahById.get(o.ayah_id);
      if (!ayah) return null;
      const surah = surahById.get(ayah.surah_id);
      return {
        surahNumber: surah?.number ?? 0,
        surahName: surah?.name ?? null,
        ayahNumber: ayah.ayah_number,
        arabic: ayah.text_uthmani,
        french: frenchByAyah.get(o.ayah_id) ?? null,
        occurrenceText: o.text,
        position: o.position,
      };
    })
    .filter((o): o is WordOccurrenceWithContext => o != null)
    .sort((a, b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber);
}

/** Nombre de mots à réviser (échéance atteinte) pour l'utilisateur. */
export async function getReviewDueCount(
  client: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<number> {
  const { count, error } = await client
    .from("review_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_at", now.toISOString());
  if (error) throw new Error(`review_items : ${error.message}`);
  return count ?? 0;
}

/** Vue d'ensemble de la révision pour l'UI /review (lecture seule, aucun calcul SRS). */
export type ReviewOverview = {
  /** Mots dus (review_items.next_review_at <= now). */
  dueCount: number;
  /** Mots déjà étudiés (au moins une ligne user_word_progress). */
  studiedCount: number;
  /** Prochaine échéance future (min next_review_at > now), ou null. */
  nextReviewAt: string | null;
};

/**
 * Lit les 3 signaux de l'écran /review SANS confondre progression et SRS :
 * dueCount (SRS), studiedCount (progression réelle), nextReviewAt (prochaine
 * échéance future). Aucune écriture, aucun recalcul d'intervalle.
 */
export async function getReviewOverview(
  client: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<ReviewOverview> {
  const [dueCount, studied, next] = await Promise.all([
    getReviewDueCount(client, userId, now),
    client
      .from("user_word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", userId),
    client
      .from("review_items")
      .select("next_review_at")
      .eq("user_id", userId)
      .gt("next_review_at", now.toISOString())
      .order("next_review_at", { ascending: true })
      .limit(1),
  ]);
  if (studied.error) throw new Error(`user_word_progress : ${studied.error.message}`);
  if (next.error) throw new Error(`review_items : ${next.error.message}`);
  const nextRow = (next.data ?? [])[0] as { next_review_at: string } | undefined;
  return {
    dueCount,
    studiedCount: studied.count ?? 0,
    nextReviewAt: nextRow?.next_review_at ?? null,
  };
}

/** Contexte d'apprentissage (dashboard / parcours / unité) pour un utilisateur. */
export type LearningContext = {
  curriculum: Curriculum | null;
  /** Statut dérivé de chaque leçon (id → statut). */
  lessonStatuses: Map<string, LessonProgressStatus>;
  /** Mots de chaque leçon (lesson_id → word_id[]). */
  lessonWordMap: Map<string, string[]>;
  /** Progression réelle des mots du parcours (word_id → ligne). */
  progressByWord: Map<string, UserWordProgress>;
  reviewDueCount: number;
  totalLessons: number;
  lessonsCompleted: number;
  wordsSeen: number;
  wordsMastered: number;
  /** Maîtrise moyenne des mots rencontrés (0–100), null si aucun mot. */
  avgMastery: number | null;
  /** Prochaine leçon à faire, ou null si tout est terminé / pas de curriculum. */
  nextLesson: { lesson: Lesson; unit: Unit; status: LessonProgressStatus } | null;
  /** Session en cours (leçon commencée, non terminée), ou null. */
  activeSession: { lesson: Lesson; unit: Unit } | null;
};

/** Assemble le contexte pédagogique complet pour un utilisateur (ou anon). */
export async function getLearningContext(
  client: SupabaseClient,
  userId: string | null,
  query: CurriculumQuery = {},
): Promise<LearningContext> {
  const curriculum = await getCurriculum(client, query);
  if (!curriculum) {
    return {
      curriculum: null,
      lessonStatuses: new Map(),
      lessonWordMap: new Map(),
      progressByWord: new Map(),
      reviewDueCount: 0,
      totalLessons: 0,
      lessonsCompleted: 0,
      wordsSeen: 0,
      wordsMastered: 0,
      avgMastery: null,
      nextLesson: null,
      activeSession: null,
    };
  }

  const allLessons = curriculum.units.flatMap((u) => u.lessons);
  const lessonWordMap = await getLessonWordMap(
    client,
    allLessons.map((l) => l.id),
  );

  const orderedLessons = allLessons.map((l) => ({
    id: l.id,
    wordIds: lessonWordMap.get(l.id) ?? [],
  }));

  let progressByWord = new Map<string, UserWordProgress>();
  if (userId) {
    const wordIds = [...new Set(orderedLessons.flatMap((l) => l.wordIds))];
    progressByWord = await getUserWordProgress(client, userId, wordIds);
  }

  const lessonStatuses = computeLessonStatuses(orderedLessons, progressByWord);
  const reviewDueCount = userId ? await getReviewDueCount(client, userId) : 0;

  const wordsSeen = [...progressByWord.values()].filter((r) => r.status !== "new").length;
  const wordsMastered = [...progressByWord.values()].filter(
    (r) => r.status === "mastered",
  ).length;
  const masteryRows = [...progressByWord.values()].filter((r) => r.status !== "new");
  const avgMastery =
    masteryRows.length > 0
      ? Math.round(masteryRows.reduce((s, r) => s + r.mastery, 0) / masteryRows.length)
      : null;

  const lessonsCompleted = allLessons.filter(
    (l) => lessonStatuses.get(l.id) === "COMPLETED",
  ).length;

  let nextLesson: LearningContext["nextLesson"] = null;
  for (const unit of curriculum.units) {
    for (const lesson of unit.lessons) {
      const status = lessonStatuses.get(lesson.id);
      if (status === "IN_PROGRESS" || status === "AVAILABLE") {
        nextLesson = { lesson, unit, status };
        break;
      }
    }
    if (nextLesson) break;
  }

  // Session en cours (Phase 24E) : une leçon commencée mais non terminée doit
  // être reprise plutôt que « commencée », même si sa progression par mot n'est
  // pas encore écrite (écrite seulement à la fin de la leçon).
  let activeSession: LearningContext["activeSession"] = null;
  if (userId) {
    const session = await getActiveLessonSession(client, userId);
    if (session) {
      outer: for (const unit of curriculum.units) {
        for (const lesson of unit.lessons) {
          if (lesson.id === session.lesson_id) {
            activeSession = { lesson, unit };
            break outer;
          }
        }
      }
    }
  }

  return {
    curriculum,
    lessonStatuses,
    lessonWordMap,
    progressByWord,
    reviewDueCount,
    totalLessons: allLessons.length,
    lessonsCompleted,
    wordsSeen,
    wordsMastered,
    avgMastery,
    nextLesson,
    activeSession,
  };
}

/** Session de leçon la plus récente en cours (pour le CTA « Reprendre »). */
export async function getActiveLessonSession(
  client: SupabaseClient,
  userId: string,
): Promise<{ lesson_id: string } | null> {
  const { data, error } = await client
    .from("lesson_sessions")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("last_activity_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`lesson_sessions : ${error.message}`);
  return data ? (data as { lesson_id: string }) : null;
}

/**
 * Session active résolue vers sa SOURATE + leçon (Phase 35B).
 *
 * La session est cherchée GLOBALEMENT (`getActiveLessonSession`, la plus
 * récente toutes sourates confondues), puis sa leçon est résolue à travers la
 * chaîne `leçon → unit → path → sourate`. Ainsi une session active sur
 * Al-ʿAṣr est trouvée même si `preferred_surah_number = 1`. Aucun N+1 :
 * résolution d'une seule session (chaîne constante, non liée au catalogue).
 */
export async function getActiveLessonSessionResolved(
  client: SupabaseClient,
  userId: string,
): Promise<{ lessonSlug: string; surahNumber: number } | null> {
  const session = await getActiveLessonSession(client, userId);
  if (!session) return null;

  const { data: lessonRows, error: lessonError } = await client
    .from("lessons")
    .select("slug, unit_id")
    .eq("id", session.lesson_id)
    .limit(1);
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);
  const lesson = (lessonRows?.[0] ?? null) as
    | { slug: string; unit_id: string }
    | null;
  if (!lesson) return null;

  const { data: unitRows, error: unitError } = await client
    .from("units")
    .select("path_id")
    .eq("id", lesson.unit_id)
    .limit(1);
  if (unitError) throw new Error(`units : ${unitError.message}`);
  const pathId = (unitRows?.[0] as { path_id: string } | undefined)?.path_id;
  if (!pathId) return null;

  const { data: pathRows, error: pathError } = await client
    .from("learning_paths")
    .select("surah_id")
    .eq("id", pathId)
    .limit(1);
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  const surahId = (pathRows?.[0] as { surah_id: string | null } | undefined)
    ?.surah_id;
  if (!surahId) return null;

  const { data: surahRows, error: surahError } = await client
    .from("surahs")
    .select("number")
    .eq("id", surahId)
    .limit(1);
  if (surahError) throw new Error(`surahs : ${surahError.message}`);
  const surahNumber = (surahRows?.[0] as { number: number } | undefined)?.number;
  if (surahNumber == null) return null;

  return { lessonSlug: lesson.slug, surahNumber };
}

/** Statistiques GLOBALES de mots (toutes sourates), en une requête batch. */
export async function getGlobalWordStats(
  client: SupabaseClient,
  userId: string,
): Promise<{
  wordsSeen: number;
  wordsMastered: number;
  avgMastery: number | null;
}> {
  const { data, error } = await client
    .from("user_word_progress")
    .select("status, mastery")
    .eq("user_id", userId);
  if (error) throw new Error(`user_word_progress : ${error.message}`);

  const rows = (data ?? []) as Array<{ status: string; mastery: number }>;
  const seen = rows.filter((r) => r.status !== "new");
  const mastered = seen.filter((r) => r.status === "mastered");
  return {
    wordsSeen: seen.length,
    wordsMastered: mastered.length,
    avgMastery:
      seen.length > 0
        ? Math.round(seen.reduce((s, r) => s + r.mastery, 0) / seen.length)
        : null,
  };
}

/** Couverture coranique d'un utilisateur (Phase 37B, enrichie 83B) — lecture seule. */
export type QuranCoverage = {
  /** Pourcentage entier 0..100 (arrondi, à présenter avec « ≈ »). */
  coveragePercent: number;
  /** Occurrences couvertes (formes comprises), depuis `word_occurrences`. */
  coveredOccurrences: number;
  /** Total des occurrences du corpus, depuis `word_occurrences` (jamais hardcodé). */
  totalOccurrences: number;
  /** word_ids compris (familiar | mastered) — réutilisable par getCoverageBySurah. */
  comprehendedWordIds: string[];
};

/**
 * Couverture coranique d'un utilisateur (Phase 37B).
 *
 * - unité FORME (`quran_words`), pondérée par ses occurrences réelles ;
 * - « compris » = `user_word_progress.status ∈ {familiar, mastered}` ;
 * - dénominateur = total `word_occurrences` (lu, jamais hardcodé) ;
 * - 3 requêtes maximum (total ∥ progress → covered), aucune récupération de
 *   lignes, aucun N+1, aucune table d'agrégation ;
 * - `user_id` filtré explicitement ET RLS `auth.uid() = user_id` : aucun accès
 *   croisé possible.
 *
 * Retourne `null` si le calcul échoue (journalisé) : l'UI affiche alors un état
 * neutre, jamais un « 0 % » qui masquerait une erreur technique.
 */
export async function getQuranCoverage(
  client: SupabaseClient,
  userId: string,
): Promise<QuranCoverage | null> {
  try {
    const [total, progress] = await Promise.all([
      client
        .from("word_occurrences")
        .select("id", { count: "exact", head: true }),
      client
        .from("user_word_progress")
        .select("word_id")
        .eq("user_id", userId)
        .in("status", [...COMPREHENDED_STATUSES]),
    ]);
    if (total.error) throw new Error(`word_occurrences : ${total.error.message}`);
    if (progress.error) throw new Error(`user_word_progress : ${progress.error.message}`);

    const totalOccurrences = total.count ?? 0;
    const wordIds = [
      ...new Set(
        ((progress.data ?? []) as Array<{ word_id: string }>).map((r) => r.word_id),
      ),
    ];

    let coveredOccurrences = 0;
    if (wordIds.length > 0) {
      // Phase 89K (R-89J-01) : count EXACT par lots de 250 (mêmes primitives
      // que selectInChunks : chunk + Promise.all + propagation d'erreur).
      //
      // Pourquoi pas `selectInChunks` en lignes ici ? Le plafond REST de 1 000
      // lignes par GET tronque silencieusement : validé sur DB réelle, 250 mots
      // (1 376 occurrences) renvoyait exactement 1 000 lignes → métrique fausse
      // (baseline 89K : avant 1 376 vs après 1 000). `head:true` + count exact
      // par lot est le seul moyen de compter sans troncature.
      //
      // L'ensemble des mots compris croît sans borne (jusqu'au corpus ~21 296
      // formes) et l'ancienne requête unique `.in("word_id", wordIds)` dépassait
      // le seuil PostgREST (~396 ids) → « TypeError: fetch failed » sur le
      // dashboard (reproduit sur 500 word_ids réels). Résultat strictement
      // équivalent à la requête unique : déduplication identique (Set), erreurs
      // propagées (→ null via le try/catch, comme avant).
      const batches = chunk(wordIds, IN_FILTER_CHUNK_SIZE);
      const counts = await Promise.all(
        batches.map(async (batch) => {
          const { count, error } = await client
            .from("word_occurrences")
            .select("id", { count: "exact", head: true })
            .in("word_id", batch);
          if (error) throw new Error(`word_occurrences : ${error.message}`);
          return count ?? 0;
        }),
      );
      coveredOccurrences = counts.reduce((sum, c) => sum + c, 0);
    }

    return {
      coveragePercent: computeCoveragePercent(coveredOccurrences, totalOccurrences),
      coveredOccurrences,
      totalOccurrences,
      comprehendedWordIds: wordIds,
    };
  } catch (err) {
    console.error(
      `[coverage] getQuranCoverage userId=${userId} : ${
        err instanceof Error ? err.message : "inconnu"
      }`,
    );
    return null;
  }
}

/**
 * Couverture lexicale par sourate (Phase 83B).
 * 1 seule query batch — GROUP BY sourate, COUNT(DISTINCT ayah).
 * Retourne [] si comprehendedWordIds est vide.
 */
export async function getCoverageBySurah(
  client: SupabaseClient,
  comprehendedWordIds: string[],
): Promise<SurahCoverage[]> {
  if (comprehendedWordIds.length === 0) return [];

  // Phase 89C (R-003) : requête chunkée par word_id via `selectInChunks`
  // (IN_FILTER_CHUNK_SIZE = 250, helper validé Phase 52/88J/88K).
  // L'ensemble des mots compris d'un utilisateur croît sans borne (jusqu'au
  // corpus ~21 296 formes) et dépassait le seuil `.in()` (~396 ids / ~14,7 Ko)
  // → « TypeError: fetch failed » sur le dashboard (reproduit en baseline sur
  // 500 word_ids réels). Résultat strictement équivalent à la requête unique :
  // fusion déterministe, déduplication identique (Set), erreurs propagées,
  // ordre final garanti par computeCoverageBySurah (tri par surahNumber).
  const occRows = await selectInChunks<{ ayah_id: string; ayahs: Array<{ surah_id: string }> }>(
    comprehendedWordIds,
    "word_occurrences",
    (batch) =>
      client
        .from("word_occurrences")
        .select("ayahs!inner(surah_id), ayah_id")
        .in("word_id", batch),
  );

  // Comptage manuel : Map<surah_id, Set<ayah_id>>
  const surahAyahs = new Map<string, Set<string>>();
  // supabase-js : la relation !inner produit un tableau (to-one mal typé sans génération).
  for (const row of occRows as unknown as Array<{ ayah_id: string; ayahs: Array<{ surah_id: string }> }>) {
    const surahRel = Array.isArray(row.ayahs) ? row.ayahs[0] : row.ayahs;
    if (!surahRel) continue;
    const surahId = (surahRel as { surah_id: string }).surah_id;
    if (!surahAyahs.has(surahId)) surahAyahs.set(surahId, new Set());
    surahAyahs.get(surahId)!.add(row.ayah_id);
  }

  const surahIds = [...surahAyahs.keys()];
  if (surahIds.length === 0) return [];

  const { data: surahRows, error: surahError } = await client
    .from("surahs")
    .select("id, number, name_translation, ayah_count")
    .in("id", surahIds);
  if (surahError) throw new Error(`surahs : ${surahError.message}`);

  const rows = (surahRows ?? []).map((s) => ({
    surah_number: (s as { number: number }).number,
    name_translation: (s as { name_translation: string | null }).name_translation,
    ayah_count: (s as { ayah_count: number }).ayah_count,
    covered_ayahs: surahAyahs.get((s as { id: string }).id)?.size ?? 0,
  }));

  return computeCoverageBySurah(rows);
}

/**
 * Couverture lexicale de tous les ayahs d'une sourate (Phase 84B, corrigé 84C).
 *
 * Approche robuste en deux étapes pour éviter le filtrage embedded supabase-js
 * avec `!inner` (`.eq("ayahs.surah_id", ...)` non fiable) :
 * 1. Query `ayahs` → tous les ayah_id + métadonnées.
 * 2. Query `word_occurrences` en batch + `user_word_progress` + `translations`.
 *
 * 3 queries batch max (ayahs → occurrences + progress ∥ translations),
 * aucun N+1. Retourne les ayahs triés avec leurs occurrences et statuts.
 */
export async function getSurahAyahCoverage(
  client: SupabaseClient,
  userId: string,
  surahId: string,
): Promise<AyahCoverage[]> {
  // 1. Récupère d'abord tous les ayahs de la sourate (source de vérité).
  const { data: ayahRows, error: ayahError } = await client
    .from("ayahs")
    .select("id, ayah_number, global_ayah_number, text_uthmani")
    .eq("surah_id", surahId)
    .order("ayah_number", { ascending: true });
  if (ayahError) throw new Error(`ayahs : ${ayahError.message}`);

  type AyahRow = {
    id: string;
    ayah_number: number;
    global_ayah_number: number;
    text_uthmani: string;
  };
  const ayahs = (ayahRows ?? []) as AyahRow[];
  if (ayahs.length === 0) return [];

  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const ayahIds = ayahs.map((a) => a.id);

  // 2. Occurrences + progression + traductions.
  const { data: occRows, error: occError } = await client
    .from("word_occurrences")
    .select("id, ayah_id, word_id, position, text")
    .in("ayah_id", ayahIds)
    .order("ayah_id")
    .order("position", { ascending: true });
  if (occError) throw new Error(`word_occurrences : ${occError.message}`);

  type OccRow = {
    id: string;
    ayah_id: string;
    word_id: string;
    position: number;
    text: string;
  };
  const occurrences = (occRows ?? []) as unknown as OccRow[];

  const wordIds = [...new Set(occurrences.map((o) => o.word_id))];

  const [progressMap, { data: frRows, error: frError }] = await Promise.all([
    getUserWordProgress(client, userId, wordIds),
    client
      .from("translations")
      .select("ayah_id, text")
      .eq("language", "fr")
      .in("ayah_id", ayahIds),
  ]);
  if (frError) throw new Error(`translations : ${frError.message}`);

  const frenchByAyah = new Map<string, string>();
  for (const t of (frRows ?? []) as Array<{ ayah_id: string; text: string }>) {
    frenchByAyah.set(t.ayah_id, stripHtml(t.text));
  }

  // 3. Agrégation en mémoire avec les métadonnées d'ayah de l'étape 1.
  return computeAyahCoverages(
    occurrences.map((o) => {
      const ayah = ayahById.get(o.ayah_id);
      const progress = progressMap.get(o.word_id);
      return {
        occurrenceId: o.id,
        ayahId: o.ayah_id,
        wordId: o.word_id,
        position: o.position,
        text: o.text,
        ayahNumber: ayah?.ayah_number ?? 0,
        globalAyahNumber: ayah?.global_ayah_number ?? 0,
        textUthmani: ayah?.text_uthmani ?? "",
        status: progress?.status ?? null,
        mastery: progress?.mastery ?? null,
        translationFr: frenchByAyah.get(o.ayah_id) ?? null,
      };
    }),
  );
}

/** Résout le path_id d'une unité par son slug (toutes sourates confondues). */
export async function getPathIdByUnitSlug(
  client: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("units")
    .select("id, path_id")
    .eq("slug", slug)
    .order("sort_order", { ascending: true })
    .limit(1);
  if (error) throw new Error(`units : ${error.message}`);
  return (data?.[0] as { path_id: string } | undefined)?.path_id ?? null;
}

/** État de session d'une leçon (position + réponses en attente), ou null. */
export async function getLessonSession(
  client: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<LessonSessionState | null> {
  const { data, error } = await client
    .from("lesson_sessions")
    .select("status, current_exercise_index, results, skill_attempts")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw new Error(`lesson_sessions : ${error.message}`);
  if (!data || data.status !== "in_progress") return null;

  return {
    currentExerciseIndex: data.current_exercise_index as number,
    results: (data.results as WordAttempts[] | null) ?? [],
    skillAttempts: (data.skill_attempts as SkillAttempt[] | null) ?? [],
  };
}

/** Mots à réviser (échéance atteinte) enrichis de leur fiche coranique. */
export async function getDueReviewItems(
  client: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<ReviewItemWithWord[]> {
  const { data, error } = await client
    .from("review_items")
    .select("*")
    .eq("user_id", userId)
    .lte("next_review_at", now.toISOString())
    .order("next_review_at", { ascending: true });
  if (error) throw new Error(`review_items : ${error.message}`);

  const rows = (data ?? []) as ReviewItem[];
  const wordIds = [...new Set(rows.map((r) => r.word_id))];
  const wordById = new Map<string, QuranWord>();
  if (wordIds.length > 0) {
    const { data: wordRows, error: wordError } = await client
      .from("quran_words")
      .select("*")
      .in("id", wordIds);
    if (wordError) throw new Error(`quran_words : ${wordError.message}`);
    for (const w of (wordRows ?? []) as QuranWord[]) wordById.set(w.id, w);
  }

  // Lexique français Hikma VALIDÉ — forme puis lemme (Phase 17C) — fallback EN sinon.
  const frenchByWord = await getValidatedFrenchMeanings(client, wordIds);
  const lemmaFrenchByWord = await getValidatedFrenchLemmaMeaningsByWord(client, wordIds);

  const items: ReviewItemWithWord[] = [];
  for (const r of rows) {
    const word = wordById.get(r.word_id);
    if (!word) continue;
    const meaning = resolveWordMeanings(
      word,
      frenchByWord.get(r.word_id),
      lemmaFrenchByWord.get(r.word_id),
    );
    items.push({
      wordId: word.id,
      arabic: word.arabic,
      transliteration: word.transliteration,
      meaning: meaning.text,
      meaningLanguage: meaning.language,
      meaningFallback: meaning.isFallback,
      translationSource: meaning.translationSource ?? undefined,
      isValidated: meaning.isValidated ?? false,
      state: {
        status: r.status as ReviewState["status"],
        intervalDays: r.interval_days,
        lastReviewAt: r.last_review_at,
        nextReviewAt: r.next_review_at,
      },
    });
  }
  return items;
}

/** Convertit une ligne user_word_progress en ProgressState utilisable par les moteurs. */
export function progressStateFromRow(
  row: UserWordProgress | null,
  intervalDays: number,
): {
  status: UserWordProgress["status"];
  correctCount: number;
  incorrectCount: number;
  mastery: MasteryLevel;
  intervalDays: number;
} | null {
  if (!row) return null;
  return {
    status: row.status,
    correctCount: row.correct_count,
    incorrectCount: row.incorrect_count,
    mastery: row.mastery as MasteryLevel,
    intervalDays,
  };
}
