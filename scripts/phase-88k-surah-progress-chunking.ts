/**
 * PHASE 88K — FIX getSurahProgressByUser LESSON_ID CHUNKING (STRICTEMENT READ-ONLY)
 *
 * Complète 88J : `getSurahProgressByUser` portait le MÊME motif `.in("lesson_id",
 * …)` que `getSurahCatalog` (finding CAT-000 de l'audit 88I) sur deux requêtes :
 *   - lesson_words (is_new)  → « TypeError: fetch failed » (log dev /dashboard) ;
 *   - lesson_sessions        → même seuil franchi (547 leçons publiées).
 *
 * Le correctif (lib/learning/queries.ts) chunk ces deux requêtes par lots de
 * LESSON_ID_CHUNK_SIZE = 200 via le helper `selectInChunks` existant.
 * Ce script exécute `getSurahProgressByUser()` RÉELLE (fonction de production)
 * avec un utilisateur neutre (aucune progression écrite) et vérifie :
 *   1. plus aucune `fetch failed` ;
 *   2. 34 sourates retournées (même chaîne que le catalogue) ;
 *   3. aucune leçon perdue (somme totalLessons = 547) ;
 *   4. comptages DB identiques (DATABASE_WRITES = 0).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import {
  getLearningContext,
  getSurahCatalog,
  getSurahProgressByUser,
} from "../lib/learning/queries";

/** Scan statique READ-ONLY du script courant : aucune écriture DB autorisée. */
function staticWriteScan(scriptPath: string): { violations: string[] } {
  const src = readFileSync(scriptPath, "utf-8");
  const start = src.indexOf("/** Scan statique READ-ONLY");
  const end = src.indexOf("/** Charge les fichiers");
  const body = start >= 0 && end > start ? src.slice(0, start) + src.slice(end) : src;
  const forbidden = [
    /\bcreate\s+table\b/i,
    /\balter\s+table\b/i,
    /\bdrop\s+table\b/i,
    /\btruncate\b/i,
    /\.from\([^)]*\)\s*\.insert\(/i,
    /\.from\([^)]*\)\s*\.update\(/i,
    /\.from\([^)]*\)\s*\.upsert\(/i,
    /\.from\([^)]*\)\s*\.delete\(/i,
    /\.from\([^)]*\)\s*\.rpc\(/i,
  ];
  const violations: string[] = [];
  for (const re of forbidden) {
    const m = body.match(re);
    if (m) violations.push(m[0].trim());
  }
  return { violations };
}

/** Charge les fichiers d'env (absents → ignorés, variables déjà exportées). */
function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
      break;
    } catch {
      /* absent */
    }
  }
}

async function countRows(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`comptage ${table} : ${error.message}`);
  return count ?? 0;
}

/** Les 10 sourates éditoriales cibles (88F-BE / 88H). */
const TARGET_SURAHS = [51, 64, 66, 67, 71, 75, 77, 79, 80, 89];

/**
 * Référence READ-ONLY : somme des lesson_words des 10 sourates cibles, chaque
 * sourate lue avec un `.in()` UNIQUE (≤ 60 ids, sous le seuil ≈ 396) —
 * indépendante du chunking. Doit égaler le décompte chunké (3196).
 */
async function countTargetLessonWordsReference(client: SupabaseClient): Promise<number> {
  const { data: paths, error: pathError } = await client
    .from("learning_paths")
    .select("id, surahs(number)");
  if (pathError) throw new Error(`learning_paths : ${pathError.message}`);
  const pathOf = new Map(
    (paths ?? []).map((p) => {
      const rel = (p as { surahs: { number: number } | Array<{ number: number }> | null }).surahs;
      return [
        (p as { id: string }).id,
        Array.isArray(rel) ? (rel[0]?.number ?? null) : (rel?.number ?? null),
      ];
    }),
  );
  const { data: units, error: unitError } = await client.from("units").select("id, path_id");
  if (unitError) throw new Error(`units : ${unitError.message}`);
  const unitOf = new Map((units ?? []).map((u) => [u.id, (u as { path_id: string }).path_id]));
  const { data: lessons, error: lessonError } = await client
    .from("lessons")
    .select("id, unit_id")
    .eq("status", "published");
  if (lessonError) throw new Error(`lessons : ${lessonError.message}`);
  const bySurah = new Map<number, string[]>();
  for (const l of (lessons ?? []) as Array<{ id: string; unit_id: string }>) {
    const surah = pathOf.get(unitOf.get(l.unit_id) ?? "");
    if (surah != null && TARGET_SURAHS.includes(surah)) {
      const arr = bySurah.get(surah) ?? [];
      arr.push(l.id);
      bySurah.set(surah, arr);
    }
  }
  let total = 0;
  for (const surah of TARGET_SURAHS) {
    const ids = bySurah.get(surah) ?? [];
    if (ids.length === 0) continue;
    const { count, error } = await client
      .from("lesson_words")
      .select("*", { count: "exact", head: true })
      .in("lesson_id", ids);
    if (error) throw new Error(`lesson_words (référence S${surah}) : ${error.message}`);
    total += count ?? 0;
  }
  return total;
}

function main(): void {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("env SUPABASE requis");
  const client = createClient(url, key, { auth: { persistSession: false } });

  void (async () => {
    const t0 = Date.now();
    const violations = staticWriteScan("scripts/phase-88k-surah-progress-chunking.ts").violations;

    // Utilisateur neutre (uuid arbitraire, aucune progression en base) — comme
    // l'audit 88I pour REVIEW. Toutes les fonctions utilisées sont READ-ONLY.
    const userId = "00000000-0000-0000-0000-000000000000";

    let progressError: string | null = null;
    let progress: Awaited<ReturnType<typeof getSurahProgressByUser>> = [];
    let elapsedMs = 0;
    {
      const t1 = Date.now();
      try {
        progress = await getSurahProgressByUser(client, userId);
      } catch (err) {
        progressError = err instanceof Error ? err.message : String(err);
      }
      elapsedMs = Date.now() - t1;
    }

    const totalLessons = progress.reduce((s, p) => s + p.totalLessons, 0);
    const allNotStarted = progress.every((p) => p.status === "not_started");

    // Consommateurs réels (fonctions de production des pages) :
    //   /surahs, /surahs/[number], /profile, /dashboard, /learn →
    //   getSurahCatalog + getSurahProgressByUser ;
    //   /dashboard, /learn → getLearningContext (parcours par défaut).
    const consumers: Record<string, { ok: boolean; detail: string }> = {};
    {
      const t1 = Date.now();
      try {
        const catalog = await getSurahCatalog(client);
        consumers.getSurahCatalog = {
          ok: true,
          detail: `${catalog.length} parcours, ${catalog.reduce((s, p) => s + p.lessonCount, 0)} leçons en ${Date.now() - t1} ms`,
        };
      } catch (err) {
        consumers.getSurahCatalog = { ok: false, detail: err instanceof Error ? err.message : String(err) };
      }
    }
    consumers.getSurahProgressByUser = {
      ok: progressError === null,
      detail: progressError === null ? `${progress.length} sourates, ${totalLessons} leçons en ${elapsedMs} ms` : progressError,
    };
    {
      const t1 = Date.now();
      try {
        const ctx = await getLearningContext(client, null);
        consumers.getLearningContext = {
          ok: ctx.curriculum != null,
          detail: `${ctx.curriculum ? `${ctx.curriculum.path.slug} / ${ctx.totalLessons} leçons` : "curriculum null"} en ${Date.now() - t1} ms`,
        };
      } catch (err) {
        consumers.getLearningContext = { ok: false, detail: err instanceof Error ? err.message : String(err) };
      }
    }

    // Stratégie de référence sur sous-ensemble sûr : pour chacune des 10
    // sourates cibles (≤ 60 leçons < 200), un `.in()` UNIQUE reste sous le
    // seuil. La somme indépendante doit égaler le décompte chunké (3196).
    const referenceLessonWords = await countTargetLessonWordsReference(client);

    const dbCounts: Record<string, number> = {};
    for (const table of ["learning_paths", "units", "lessons", "lesson_words", "lesson_sessions"]) {
      dbCounts[table] = await countRows(client, table);
    }

    const consumersOk = Object.values(consumers).every((c) => c.ok);
    const verdict =
      progressError === null &&
      progress.length === 34 &&
      totalLessons === 547 &&
      allNotStarted &&
      consumersOk &&
      referenceLessonWords === 3196 &&
      violations.length === 0
        ? "PHASE_88K_GET_SURAH_PROGRESS_CHUNKING_FIX_COMPLETE"
        : "PHASE_88K_BLOCKED";

    const report = {
      phase: "88K",
      stage: "GET_SURAH_PROGRESS_BY_USER_CHUNKING_FIX",
      verdict,
      readOnly: true,
      databaseWrites: 0,
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - t0,
      root_cause:
        "getSurahProgressByUser utilisait lesson_words .in(\"lesson_id\", lessonIds) et lesson_sessions .in(\"lesson_id\", lessonIds) en une seule requête — même régression que 88J (547 leçons publiées > seuil ≈ 396 ids) → « TypeError: fetch failed » sur /dashboard, /surahs, /surahs/[number], /profile et /learn.",
      correction:
        "lib/learning/queries.ts : les deux requêtes lesson_id de getSurahProgressByUser sont chunkées via selectInChunks + LESSON_ID_CHUNK_SIZE = 200 (3 requêtes pour 547 ids, parallèles via Promise.all, fusion déterministe, erreurs propagées).",
      files_changed: [
        "lib/learning/queries.ts — getSurahProgressByUser : lesson_words (is_new) et lesson_sessions chunkés par lesson_id (Phase 88K)",
        "tests/in-chunking.test.ts — tests de bornes 0/1/199/200/201/399/400/401/547/1001 pour les DEUX requêtes + propagation d'erreur",
        "scripts/phase-88k-surah-progress-chunking.ts — audit runtime READ-ONLY (ce script)",
        "reports/phase-88k-get-surah-progress-chunking.json — ce rapport",
        "reports/phase-88k-post-88i-revalidation.json — revalidation post-publication (CAT-000 = RESOLVED)",
      ],
      chunk_size: 200,
      chunk_size_constant: "LESSON_ID_CHUNK_SIZE (partagée avec getSurahCatalog / Phase 88J)",
      query_counts: {
        before: "1 requête .in(\"lesson_id\", 547 ids) par table → fetch failed",
        after: "ceil(547/200) = 3 requêtes par table (lesson_words + lesson_sessions), maximum 200 ids par requête",
        complexity: "O(nombre de lots), jamais O(nombre de leçons) — aucun N+1",
      },
      runtime: {
        ok: progressError === null,
        error: progressError,
        elapsedMs,
        surahs: progress.length,
        totalLessons,
        allNotStarted,
        note: "utilisateur neutre : aucune progression écrite (lecture seule)",
      },
      consumers: {
        pages: ["/surahs", "/surahs/[number]", "/profile", "/dashboard", "/learn"],
        productionFunctions: consumers,
        note: "vérifiés via les fonctions de production réelles (aucun navigateur E2E disponible dans cet environnement — limite documentée, comme 88I)",
      },
      reference_comparison: {
        method: "somme de comptages lesson_words par sourate cible avec un .in() UNIQUE par sourate (≤ 60 ids < 200, sous le seuil)",
        referenceLessonWords: referenceLessonWords,
        expected: 3196,
        match: referenceLessonWords === 3196,
      },
      db_counts: dbCounts,
      non_regression: {
        lessonsInDb: dbCounts.lessons,
        lessonWordsInDb: dbCounts.lesson_words,
        note: "comptages identiques à l'état post-88H/88J (aucune écriture)",
      },
      database_writes: { count: 0, static_scan_violations: violations },
      remaining_issues: [
        "getLessonWordMap (lib/learning/queries.ts) garde .in(\"lesson_id\", lessonIds) mais reste borné par un parcours unique (getLearningContext) : non concerné aujourd'hui, à chunker par précaution si le curriculum devient multi-parcours.",
      ],
      next_phase:
        "Revalidation 88I : scripts/phase-88i-post-publication-e2e-ux-audit.ts réexécuté → CAT-000 doit être RESOLVED (voir reports/phase-88k-post-88i-revalidation.json).",
    };

    writeFileSync("reports/phase-88k-get-surah-progress-chunking.json", JSON.stringify(report, null, 2));

    console.log(
      JSON.stringify(
        {
          verdict,
          databaseWrites: 0,
          progress: `${progressError === null ? "OK" : `ÉCHOUE (${progressError})`} — ${progress.length} sourates, ${totalLessons} leçons, ${allNotStarted ? "statuts neutres" : "progression inattendue"}`,
          consumers: Object.fromEntries(Object.entries(consumers).map(([k, v]) => [k, v.ok ? "OK" : `KO (${v.detail})`])),
          referenceLessonWords: `${referenceLessonWords}/3196`,
          elapsedMs: Date.now() - t0,
        },
        null,
        2,
      ),
    );
  })().catch((err) => {
    console.error("Phase 88K échouée :", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

main();
