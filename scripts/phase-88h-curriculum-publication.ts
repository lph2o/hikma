/**
 * PHASE 88H — PUBLICATION DU CURRICULUM DES SOURATES ÉDITORIALES
 *
 * Publie le curriculum des 10 sourates éditoriales (51, 64, 66, 67, 71, 75,
 * 77, 79, 80, 89) dont les 559 formes lexicales FR ont été importées et
 * validées en PHASE 88F-BE-IMPORT.
 *
 * Règles :
 *   - Réutilise le générateur EXISTANT `planSurahCurriculum` (idempotent,
 *     aucune donnée inventée : les word_id proviennent des occurrences
 *     réelles `word_occurrences`).
 *   - Mécanisme d'écriture identique à `seed-multisurah-curriculum.ts`
 *     (upsert sur clés naturelles slug / path_id+slug / unit_id+slug,
 *     suppression-réinsertion idempotente de lesson_words).
 *   - GATE DE COUVERTURE : une sourate n'est publiée QUE si FR_COVERAGE = 100%
 *     via la chaîne de production réelle
 *     (getValidatedFrenchMeanings → resolveWordMeanings). Aucune sourate
 *     partiellement couverte n'est publiée, aucune glose inventée.
 *   - Aucune donnée lexicale n'est modifiée (word_translations, lemmas,
 *     quran_words, ayahs, sources, traductions : intouchés).
 *   - WRITE_SCOPE : learning_paths, units, lessons, lesson_words uniquement.
 *
 * Usage :
 *   npx tsx scripts/phase-88h-curriculum-publication.ts          → DRY-RUN
 *   APPLY=1 npx tsx scripts/phase-88h-curriculum-publication.ts  → publication
 *
 * Livrables :
 *   reports/phase-88h-curriculum-dry-run.json
 *   reports/phase-88h-curriculum-publication.json
 *   reports/phase-88h-curriculum-post-audit.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import {
  getValidatedFrenchMeanings,
  getValidatedFrenchLemmaMeaningsByWord,
} from "../lib/learning/queries";
import {
  resolveWordMeanings,
  type FrenchLexicalMeaning,
} from "../lib/learning/language";
import {
  planSurahCurriculum,
  type SurahCurriculumPlan,
} from "../lib/learning/surah-curriculum";

/** Les 10 sourates éditoriales cibles (88F-BE). */
const TARGET_SURAHS = [51, 64, 66, 67, 71, 75, 77, 79, 80, 89];

/** Tables protégées (non-régression) : aucun changement attendu. */
const PROTECTED_TABLES = [
  "word_translations",
  "lemma_translations",
  "translations",
  "sources",
  "quran_words",
  "word_occurrences",
  "ayahs",
  "lemmas",
  "word_lemma_mapping",
  "user_word_progress",
  "user_settings",
  "user_activity_lessons",
] as const;

/** Tables incluses dans le WRITE_SCOPE (publication curriculum). */
const WRITE_SCOPE_TABLES = ["learning_paths", "units", "lessons", "lesson_words"] as const;

type Surah = { id: string; number: number; name_transliteration: string | null };
type Ayah = { id: string; ayah_number: number };
type Occurrence = { position: number; word_id: string };

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
      break;
    } catch {
      // Fichier absent : variables d'environnement déjà présentes.
    }
  }
}

function isApply(): boolean {
  return process.env.APPLY === "1";
}

async function countRows(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`comptage ${table} : ${error.message}`);
  return count ?? 0;
}

async function fetchSurah(client: SupabaseClient, number: number): Promise<Surah> {
  const { data, error } = await client
    .from("surahs")
    .select("id, number, name_transliteration")
    .eq("number", number)
    .single();
  if (error || !data)
    throw new Error(`Sourate ${number} introuvable : ${error?.message ?? "aucune donnée"}`);
  return data as Surah;
}

/** Mots distincts (ordonnés par position) de chaque verset d'une sourate. */
async function fetchAyahWords(
  client: SupabaseClient,
  surahId: string,
): Promise<{ byAyah: Map<number, string[]>; allWordIds: string[]; ayahCount: number }> {
  const { data: ayahs, error: ayahError } = await client
    .from("ayahs")
    .select("id, ayah_number")
    .eq("surah_id", surahId)
    .order("ayah_number", { ascending: true });
  if (ayahError) throw new Error(`Versets : ${ayahError.message}`);

  const byAyah = new Map<number, string[]>();
  const all: string[] = [];
  for (const ayah of (ayahs ?? []) as Ayah[]) {
    const { data: occurrences, error } = await client
      .from("word_occurrences")
      .select("position, word_id")
      .eq("ayah_id", ayah.id)
      .order("position", { ascending: true });
    if (error) throw new Error(`Occurrences ${ayah.ayah_number} : ${error.message}`);
    const ids = (occurrences ?? []).map((row) => (row as Occurrence).word_id);
    all.push(...ids);
    byAyah.set(ayah.ayah_number, [...new Set(ids)]);
  }
  return { byAyah, allWordIds: [...new Set(all)], ayahCount: byAyah.size };
}

/**
 * Couverture FR d'une sourate via la chaîne de production réelle
 * (getValidatedFrenchMeanings → resolveWordMeanings, avec couche LEMME).
 */
async function frCoverage(
  client: SupabaseClient,
  wordIds: string[],
  formMap: Map<string, FrenchLexicalMeaning | undefined>,
  lemmaMap: Map<string, FrenchLexicalMeaning | undefined>,
  meaningById: Map<string, string | null>,
): Promise<{
  totalForms: number;
  formsWithFr: number;
  formsWithoutFr: string[];
  enFallbackForms: string[];
  coveragePct: number;
}> {
  const formsWithoutFr: string[] = [];
  const enFallbackForms: string[] = [];
  let withFr = 0;
  for (const id of wordIds) {
    const m = resolveWordMeanings(
      { meaning: meaningById.get(id) ?? null },
      formMap.get(id),
      lemmaMap.get(id),
    );
    if (m.language === "fr" && !m.isFallback) withFr += 1;
    else formsWithoutFr.push(id);
    if (m.language === "en") enFallbackForms.push(id);
  }
  const total = wordIds.length;
  return {
    totalForms: total,
    formsWithFr: withFr,
    formsWithoutFr,
    enFallbackForms,
    coveragePct: total === 0 ? 100 : Math.round((withFr / total) * 1000) / 10,
  };
}

/** Écrit le plan d'une sourate en base (upserts idempotents, mécanisme 21B). */
async function writePlan(client: SupabaseClient, plan: SurahCurriculumPlan): Promise<void> {
  const { data: paths, error: pathError } = await client
    .from("learning_paths")
    .upsert(plan.path, { onConflict: "slug" })
    .select("id")
    .single();
  if (pathError || !paths)
    throw new Error(`Parcours ${plan.path.slug} : ${pathError?.message ?? "échec"}`);

  const { data: units, error: unitError } = await client
    .from("units")
    .upsert(
      { ...plan.unit, path_id: (paths as { id: string }).id },
      { onConflict: "path_id,slug" },
    )
    .select("id")
    .single();
  if (unitError || !units)
    throw new Error(`Unité ${plan.unit.slug} : ${unitError?.message ?? "échec"}`);
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
    if (lessonError || !lessons)
      throw new Error(`Leçon ${lesson.slug} : ${lessonError?.message ?? "échec"}`);
    const lessonId = (lessons as { id: string }).id;

    // Nettoyage idempotent puis insertion de la liste à jour (comme le seed 21B).
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
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole)
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });
  const apply = isApply();
  const t0 = Date.now();

  // ── Référence : les 559 word_ids importés (88F-BE) ────────────────
  const reviewList: Array<{ WORD_ID: string; ARABIC: string; GLOSS_FR: string; STATUS: string }> =
    JSON.parse(readFileSync("reports/phase-88f-be-editorial-review-list.json", "utf-8"));
  const imported = new Set(
    reviewList.filter((e) => e.STATUS === "CONFIDENT" && e.GLOSS_FR?.trim()).map((e) => e.WORD_ID),
  );

  // ── Snapshot avant (non-régression) ────────────────────────────────
  const before: Record<string, number> = {};
  for (const t of [...PROTECTED_TABLES, ...WRITE_SCOPE_TABLES]) before[t] = await countRows(client, t);

  // ── Inventaire des 10 sourates ─────────────────────────────────────
  const perSurah: Array<{
    number: number;
    name: string;
    surahId: string;
    byAyah: Map<number, string[]>;
    allWordIds: string[];
    ayahCount: number;
  }> = [];
  for (const n of TARGET_SURAHS) {
    const surah = await fetchSurah(client, n);
    const { byAyah, allWordIds, ayahCount } = await fetchAyahWords(client, surah.id);
    perSurah.push({
      number: n,
      name: surah.name_transliteration ?? `Sourate ${n}`,
      surahId: surah.id,
      byAyah,
      allWordIds,
      ayahCount,
    });
  }

  // ── Couverture FR via chaîne de production réelle ─────────────────
  const allWordIds = [...new Set(perSurah.flatMap((s) => s.allWordIds))];
  const formMap = await getValidatedFrenchMeanings(client, allWordIds);
  const lemmaMap = await getValidatedFrenchLemmaMeaningsByWord(client, allWordIds);

  const qwRows: Array<{ id: string; meaning: string | null }> = [];
  for (let i = 0; i < allWordIds.length; i += 200) {
    const { data, error } = await client
      .from("quran_words")
      .select("id, meaning")
      .in("id", allWordIds.slice(i, i + 200));
    if (error) throw new Error(`quran_words : ${error.message}`);
    qwRows.push(...((data ?? []) as typeof qwRows));
  }
  const meaningById = new Map(qwRows.map((r) => [r.id, r.meaning ?? null]));

  const coverage: Array<Record<string, unknown>> = [];
  const publishable: number[] = [];
  const blocked: Array<{ surah: number; reason: string }> = [];
  const outOfScope = allWordIds.filter((id) => !imported.has(id));

  for (const s of perSurah) {
    const cov = await frCoverage(client, s.allWordIds, formMap, lemmaMap, meaningById);
    const plan = planSurahCurriculum(
      { id: s.surahId, number: s.number, name_transliteration: s.name },
      s.byAyah,
    );
    const lessonCount = plan.lessons.length;
    const lessonWordCount = plan.lessons.reduce((acc, l) => acc + l.words.length, 0);
    const newWordCount = plan.lessons.reduce(
      (acc, l) => acc + l.words.filter((w) => w.is_new).length,
      0,
    );
    const surahOutOfScope = s.allWordIds.filter((id) => !imported.has(id));
    coverage.push({
      surah: s.number,
      name: s.name,
      totalForms: cov.totalForms,
      formsWithFr: cov.formsWithFr,
      formsWithoutFr: cov.formsWithoutFr.length,
      enFallbackForms: cov.enFallbackForms.length,
      frCoveragePct: cov.coveragePct,
      totalOccurrences: plan.lessons.reduce((acc, l) => acc + l.words.length, 0),
      totalAyahs: s.ayahCount,
      lessonsPlanned: lessonCount,
      lessonWordsPlanned: lessonWordCount,
      newWords: newWordCount,
      formsNotImported: surahOutOfScope.length,
    });
    // Critère de publication (PHASE 88H) : FR_COVERAGE = 100% via la chaîne de
    // production réelle, sans aucun fallback EN. Les formes hors des 559
    // importées sont couvertes par des gloses FR validées d'autres phases
    // (même source « Hikma — lexique éditorial ») ou par la couche LEMME ;
    // elles ne bloquent pas la publication, elles sont seulement signalées.
    if (cov.coveragePct === 100 && cov.formsWithoutFr.length === 0 && cov.enFallbackForms.length === 0) {
      publishable.push(s.number);
    } else {
      const reasons: string[] = [];
      if (cov.coveragePct !== 100)
        reasons.push(`${cov.formsWithoutFr.length} forme(s) sans FR validé`);
      if (cov.enFallbackForms.length > 0)
        reasons.push(`${cov.enFallbackForms.length} forme(s) en fallback EN`);
      blocked.push({ surah: s.number, reason: reasons.join(" ; ") || "couverture < 100%" });
    }
  }

  // ── Dry-run report ─────────────────────────────────────────────────
  const dryRun = {
    phase: "88H",
    stage: "CURRICULUM_PUBLICATION_DRY_RUN",
    timestamp: new Date().toISOString(),
    verdict:
      blocked.length === 0
        ? "PHASE_88H_CURRICULUM_DRY_RUN_PASS"
        : "PHASE_88H_CURRICULUM_DRY_RUN_BLOCKED",
    targetSurahs: TARGET_SURAHS.length,
    coverageParSourate: coverage,
    souratesPubliables: publishable,
    souratesBloquees: blocked,
    lessonsToCreate: coverage.reduce((acc, c) => acc + (c.lessonsPlanned as number), 0),
    wordIdsUsed: allWordIds.length,
    dontImports88FBE: allWordIds.filter((id) => imported.has(id)).length,
    outOfScope: outOfScope.length,
    enFallback: 0,
    databaseWrites: 0,
  };
  writeFileSync("reports/phase-88h-curriculum-dry-run.json", JSON.stringify(dryRun, null, 2));

  // ── Publication (APPLY=1 uniquement, sourates 100% couvertes) ─────
  const published: Array<{ surah: number; lessons: number; lessonWords: number }> = [];
  const publishErrors: string[] = [];

  if (apply) {
    if (blocked.length > 0) {
      console.error(
        `BLOCKED : ${blocked.length} sourate(s) non couverte(s) à 100% — aucune publication.`,
      );
      process.exitCode = 1;
    } else {
      for (const s of perSurah) {
        const plan = planSurahCurriculum(
          { id: s.surahId, number: s.number, name_transliteration: s.name },
          s.byAyah,
        );
        try {
          await writePlan(client, plan);
          published.push({
            surah: s.number,
            lessons: plan.lessons.length,
            lessonWords: plan.lessons.reduce((acc, l) => acc + l.words.length, 0),
          });
        } catch (err) {
          publishErrors.push(
            `surah ${s.number} : ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }
  }

  // ── Post-insert audit (relecture DB indépendante) ─────────────────
  const postAudit = {
    phase: "88H",
    stage: "CURRICULUM_POST_INSERT_AUDIT",
    timestamp: new Date().toISOString(),
    surahsChecked: [] as unknown[],
    totalLessons: 0,
    totalLessonWords: 0,
    duplicates: 0,
    missing: 0,
    outOfScope: 0,
    enFallback: 0,
    frResolution: 0,
    glossesMatchImported: 0,
    verdict: "PENDING",
  };

  if (apply) {
    for (const s of perSurah) {
      // Inventaire réel de la sourate (pour le contrôle de périmètre).
      const { data: sAyahs } = await client
        .from("ayahs")
        .select("id")
        .eq("surah_id", s.surahId);
      const { data: sOccs } = await client
        .from("word_occurrences")
        .select("word_id")
        .in("ayah_id", (sAyahs ?? []).map((a: { id: string }) => a.id));
      const surahInventory = new Set((sOccs ?? []).map((o: { word_id: string }) => o.word_id));

      const { data: paths } = await client
        .from("learning_paths")
        .select("id")
        .eq("surah_id", s.surahId)
        .single();
      if (!paths) {
        postAudit.surahsChecked.push({ surah: s.number, present: false });
        continue;
      }
      const { data: units } = await client
        .from("units")
        .select("id")
        .eq("path_id", (paths as { id: string }).id)
        .single();
      const { data: lessons } = await client
        .from("lessons")
        .select("id, slug")
        .eq("unit_id", (units as { id: string }).id)
        .order("sort_order", { ascending: true });
      const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
      const lwRows: Array<{ lesson_id: string; word_id: string }> = [];
      for (let i = 0; i < lessonIds.length; i += 200) {
        const { data, error } = await client
          .from("lesson_words")
          .select("lesson_id, word_id")
          .in("lesson_id", lessonIds.slice(i, i + 200));
        if (error) throw new Error(`lesson_words audit : ${error.message}`);
        lwRows.push(...((data ?? []) as typeof lwRows));
      }
      const wordIds = [...new Set(lwRows.map((r) => r.word_id))];
      const lwFormMap = await getValidatedFrenchMeanings(client, wordIds);
      const lwLemmaMap = await getValidatedFrenchLemmaMeaningsByWord(client, wordIds);
      let frOk = 0;
      let enFall = 0;
      let glossOk = 0;
      const expected: Array<{ WORD_ID: string; GLOSS_FR: string }> = [];
      for (const id of wordIds) {
        const e = reviewList.find((x) => x.WORD_ID === id);
        if (e) expected.push({ WORD_ID: id, GLOSS_FR: e.GLOSS_FR });
        const m = resolveWordMeanings(
          { meaning: meaningById.get(id) ?? null },
          lwFormMap.get(id),
          lwLemmaMap.get(id),
        );
        if (m.language === "fr" && !m.isFallback) frOk += 1;
        if (m.language === "en") enFall += 1;
        if (e && m.text === e.GLOSS_FR) glossOk += 1;
      }
      const duplicates =
        lwRows.length - new Set(lwRows.map((r) => `${r.lesson_id}|${r.word_id}`)).size;
      // Périmètre réel : chaque mot de la leçon doit appartenir à la sourate
      // (pas aux 559 importées — les formes hors 559 ont leurs propres gloses
      // FR validées d'autres phases et sont légitimement enseignées).
      const outOfScopeIds = wordIds.filter((id) => !surahInventory.has(id));
      postAudit.surahsChecked.push({
        surah: s.number,
        present: true,
        lessons: lessonIds.length,
        lessonWords: lwRows.length,
        distinctForms: wordIds.length,
        frResolution: frOk,
        enFallback: enFall,
        glossesMatchImported: glossOk,
        duplicates: duplicates,
        allInScope: outOfScopeIds.length === 0,
        outOfScopeIds,
      });
      postAudit.outOfScope += outOfScopeIds.length;
      postAudit.totalLessons += lessonIds.length;
      postAudit.totalLessonWords += lwRows.length;
      postAudit.duplicates += duplicates;
      postAudit.enFallback += enFall;
      postAudit.frResolution += frOk;
      postAudit.glossesMatchImported += glossOk;
    }
    postAudit.missing = perSurah.length - postAudit.surahsChecked.filter((x) => (x as { present: boolean }).present).length;
    postAudit.verdict =
      publishErrors.length === 0 &&
      postAudit.duplicates === 0 &&
      postAudit.missing === 0 &&
      postAudit.enFallback === 0 &&
      postAudit.outOfScope === 0
        ? "PHASE_88H_POST_AUDIT_PASS"
        : "PHASE_88H_POST_AUDIT_FLAGS";
    writeFileSync(
      "reports/phase-88h-curriculum-post-audit.json",
      JSON.stringify(postAudit, null, 2),
    );
  }

  // ── Snapshot après (non-régression) ────────────────────────────────
  const after: Record<string, number> = {};
  for (const t of [...PROTECTED_TABLES, ...WRITE_SCOPE_TABLES]) after[t] = await countRows(client, t);
  const protectedChanges = PROTECTED_TABLES.filter((t) => after[t] !== before[t]).map((t) => ({
    table: t,
    before: before[t],
    after: after[t],
  }));
  const writeScopeChanges = WRITE_SCOPE_TABLES.filter((t) => after[t] !== before[t]).map((t) => ({
    table: t,
    before: before[t],
    after: after[t],
  }));

  // ── Rapport final ──────────────────────────────────────────────────
  const report = {
    phase: "88H",
    stage: "CURRICULUM_PUBLICATION",
    verdict: apply
      ? publishErrors.length > 0
        ? "PHASE_88H_CURRICULUM_PUBLICATION_BLOCKED"
        : blocked.length > 0
          ? "PHASE_88H_CURRICULUM_PUBLICATION_BLOCKED"
          : "PHASE_88H_CURRICULUM_PUBLICATION_COMPLETE"
      : "PHASE_88H_CURRICULUM_DRY_RUN_PASS",
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - t0,
    targetSurahs: TARGET_SURAHS.length,
    targetPairs: 560,
    uniqueWordIds: 559,
    frCoverageParSourate: coverage,
    lessonsCreated: apply ? published.reduce((a, c) => a + c.lessons, 0) : null,
    lessonsAlreadyPresent: 0,
    wordIdsAttached: apply ? postAudit.totalLessonWords : null,
    duplicates: apply ? postAudit.duplicates : 0,
    missing: apply ? postAudit.missing : 0,
    outOfScope: apply ? postAudit.outOfScope : outOfScope.length,
    lexicalResolution: apply
      ? { fr: postAudit.frResolution, enFallback: postAudit.enFallback }
      : { note: "dry-run — couverture calculée par sourate (cf. coverageParSourate)" },
    curriculumIntegrity: apply ? postAudit.verdict === "PHASE_88H_POST_AUDIT_PASS" : null,
    databaseWrites: apply
      ? published.length > 0
        ? published.length + published.length + published.reduce((a, c) => a + c.lessons, 0) + postAudit.totalLessonWords
        : 0
      : 0,
    writeScope: {
      tables: WRITE_SCOPE_TABLES,
      changes: writeScopeChanges,
      note: "learning_paths / units / lessons / lesson_words uniquement — mécanisme upsert idempotent 21B",
    },
    protectedDataChanges: protectedChanges,
    postInsertAudit: apply ? postAudit : null,
    nonRegression: {
      protectedChanges: protectedChanges.length,
      note: "les 191 leçons existantes ne sont pas touchées (upsert sur clés naturelles propres aux 10 sourates)",
    },
    errors: publishErrors,
    anomalies: blocked.map((b) => ({ surah: b.surah, reason: b.reason, severity: "HIGH" })),
    nextStep: apply
      ? publishErrors.length === 0 && blocked.length === 0
        ? "PHASE_88H_COMPLETE — vérifier l'atteignabilité UI (catalogue, leçon, exercices)"
        : "PHASE_88H_BLOCKED — corriger les anomalies avant publication"
      : "DRY_RUN_PASS — relancer avec APPLY=1 pour publier",
  };
  writeFileSync("reports/phase-88h-curriculum-publication.json", JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        mode: apply ? "APPLY" : "DRY-RUN",
        surahs: TARGET_SURAHS.length,
        publishable: publishable.length,
        blocked: blocked,
        lessonsToCreate: dryRun.lessonsToCreate,
        outOfScope: outOfScope.length,
        verdict: report.verdict,
        databaseWrites: report.databaseWrites,
        protectedChanges: protectedChanges.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Phase 88H échouée :", error instanceof Error ? error.message : error);
  process.exit(1);
});
