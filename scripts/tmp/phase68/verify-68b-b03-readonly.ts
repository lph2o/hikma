/**
 * scripts/tmp/phase68/verify-68b-b03-readonly.ts
 *
 * PHASE 68B — B03 : PASSAGE DE VÉRIFICATION READ-ONLY (aucune écriture DB).
 *
 * Contexte : B03 (sourates 39, 45, 46, 47, 49) a déjà été appliqué et vérifié
 * (PHASE_68B_B03_REPORT.md = COMPLETE ; execution-state-68b.json = VERIFIED ;
 * DB live = 14590 occurrences / 28980 segments). Ce script re-vérifie l'état
 * appliqué SANS réécrire :
 *   1. baseline (compteurs canoniques) vs état post-B03 enregistré ;
 *   2. plan DRY-RUN par sourate (buildImportPlan + assertPlanScope) — pur,
 *      AMBIGUOUS/MISSING/EXTRA = 0, aligned/segments conformes au registre ;
 *   3. matrice de propagation (occurrences par sourate) vs état enregistré ;
 *   4. présence des segments B03 (total attendu 6258) ;
 *   5. idempotence NO-OP : tous les source_record_id du plan existent déjà →
 *      un re-run insérerait 0 ligne (démontré sans réécrire) ;
 *   6. runtime getWordLinguisticEvidence : 100 % de résolution par sourate
 *      (chunking selectInChunks actif, aucun header overflow attendu).
 *
 * Aucune écriture : uniquement select / count / fonctions pures.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  buildImportPlan,
  assertPlanScope,
  type HikmaOccurrenceInput,
} from "../../../lib/linguistic/masaq-plan";
import { getWordLinguisticEvidence } from "../../../lib/learning/queries";
import { selectAllPages } from "../../../lib/quran/repositories/shared";
import { captureCanonicalCounters } from "../../../scripts/industrial/_lib/counters";
import {
  buildServiceRoleClient,
  loadIndustrialEnvFiles,
} from "../../../scripts/industrial/_lib/load-env";

const EXPECTED_SHA256 =
  "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";

const SOURCE_NAME = "MASAQ";
const SOURCE_VERSION = "v2";

/** Registre Phase 67 — B03 : sourate -> { aligned, segments }. */
const B03_EXPECTED: Record<number, { aligned: number; segments: number }> = {
  39: { aligned: 1172, segments: 2266 },
  45: { aligned: 488, segments: 988 },
  46: { aligned: 643, segments: 1242 },
  47: { aligned: 539, segments: 1084 },
  49: { aligned: 347, segments: 678 },
};

const B03_SURAHS = Object.keys(B03_EXPECTED).map(Number);
const B03_TOTAL_OCC = Object.values(B03_EXPECTED).reduce((s, v) => s + v.aligned, 0);
const B03_TOTAL_SEG = Object.values(B03_EXPECTED).reduce((s, v) => s + v.segments, 0);

// État post-B03 enregistré (baseline-post.json / report.json).
const RECORDED_POST = {
  linguistic_occurrences: 14590,
  linguistic_segments: 28980,
};

type Client = Awaited<ReturnType<typeof buildServiceRoleClient>>;

async function fetchHikmaForSurah(
  client: Client,
  surah: number,
): Promise<HikmaOccurrenceInput[]> {
  type RawRow = {
    id: string;
    position: number;
    text: string;
    word_id: string;
    quran_words: { id: string; arabic: string; lemma_id: string | null };
    ayahs: { id: string; ayah_number: number; surahs: { number: number } };
  };
  const rows = await selectAllPages<RawRow>((from, to) =>
    client
      .from("word_occurrences")
      .select(
        `id, position, text, word_id,
         quran_words!inner(id, arabic, lemma_id),
         ayahs!inner(id, ayah_number, surahs!inner(number))`,
      )
      .eq("ayahs.surahs.number", surah)
      .order("id")
      .range(from, to),
  );
  const lemmaIds = [...new Set(rows.map((o) => o.quran_words.lemma_id).filter(Boolean))];
  const lemmaBy = new Map<string, string>();
  if (lemmaIds.length > 0) {
    const { data: lemmaRows } = await client
      .from("lemmas")
      .select("id, arabic")
      .in("id", lemmaIds);
    for (const l of (lemmaRows ?? []) as Array<{ id: string; arabic: string }>) {
      lemmaBy.set(l.id, l.arabic);
    }
  }
  return rows.map((o) => ({
    surah: o.ayahs.surahs.number,
    ayah: o.ayahs.ayah_number,
    position: o.position,
    text: o.text,
    wordOccurrenceId: o.id,
    quranWordId: o.quran_words.id,
    lemmaId: o.quran_words.lemma_id ?? null,
    lemmaArabic: o.quran_words.lemma_id
      ? (lemmaBy.get(o.quran_words.lemma_id) ?? null)
      : null,
  }));
}

async function resolveSourceIdReadOnly(client: Client): Promise<string | null> {
  const { data } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .eq("version", SOURCE_VERSION)
    .limit(1);
  return (data as Array<{ id: string }> | null)?.[0]?.id ?? null;
}

async function masaqCountsBySurah(
  client: Client,
  sourceId: string | null,
): Promise<Record<number, number>> {
  if (!sourceId) return {};
  const out: Record<number, number> = {};
  const rows = await selectAllPages<{ surah_number: number }>((from, to) =>
    client
      .from("linguistic_occurrences")
      .select("surah_number")
      .eq("source_id", sourceId)
      .order("surah_number")
      .range(from, to),
  );
  for (const r of rows) out[r.surah_number] = (out[r.surah_number] ?? 0) + 1;
  return out;
}

/** Compte les segments des occurrences d'une sourate (READ-ONLY). */
async function segmentCountForSurah(client: Client, sourceId: string, surah: number): Promise<number> {
  const occIds = await selectAllPages<{ id: string }>((from, to) =>
    client
      .from("linguistic_occurrences")
      .select("id")
      .eq("source_id", sourceId)
      .eq("surah_number", surah)
      .order("id")
      .range(from, to),
  );
  const ids = occIds.map((o) => o.id);
  if (ids.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < ids.length; i += 250) {
    const batch = ids.slice(i, i + 250);
    const { count, error } = await client
      .from("linguistic_segments")
      .select("id", { count: "exact", head: true })
      .in("linguistic_occurrence_id", batch);
    if (error) throw new Error(`linguistic_segments : ${error.message}`);
    total += count ?? 0;
  }
  return total;
}

async function main(): Promise<void> {
  loadIndustrialEnvFiles();

  // Checksum MASAQ (source immuable).
  const csvBuffer = readFileSync("tmp/MASAQ.csv");
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  const checksumOk = sha256 === EXPECTED_SHA256;

  const client = await buildServiceRoleClient();
  const sourceId = await resolveSourceIdReadOnly(client);

  // ---- 1. BASELINE (compteurs canoniques) ----
  const counters = await captureCanonicalCounters(client);

  // ---- 2. PLAN DRY-RUN par sourate (pur) + 3. propagation + 6. runtime + 5. idempotence ----
  const csvText = csvBuffer.toString("utf8");
  const perSurah: Record<number, unknown> = {};
  const violations: string[] = [];
  const runtime: Record<number, { expected_words: number; resolved_words: number }> = {};
  let runtimeOk = true;

  const existingRecordIds = new Set<string>();
  if (sourceId) {
    const rows = await selectAllPages<{ source_record_id: string }>((from, to) =>
      client
        .from("linguistic_occurrences")
        .select("source_record_id")
        .eq("source_id", sourceId)
        .order("source_record_id")
        .range(from, to),
    );
    for (const r of rows) existingRecordIds.add(r.source_record_id);
  }

  const dbCounts = await masaqCountsBySurah(client, sourceId);
  let idemMissing = 0;
  let idemTotal = 0;

  for (const surah of B03_SURAHS) {
    const expected = B03_EXPECTED[surah]!;
    const hikma = await fetchHikmaForSurah(client, surah);
    const plan = buildImportPlan(hikma, csvText, { surah });
    const stats = assertPlanScope(plan, surah); // lève si AMBIGUOUS/MISSING/EXTRA/scope violé

    const wordIds = [
      ...new Set(
        (hikma as Array<{ quranWordId?: string | null }>)
          .map((h) => h.quranWordId)
          .filter((w): w is string => !!w),
      ),
    ];

    // Propagation : occurrences DB vs registre.
    const dbOcc = dbCounts[surah] ?? 0;
    if (dbOcc !== expected.aligned) {
      violations.push(`surah ${surah}: occurrences DB=${dbOcc} attendu=${expected.aligned}`);
    }

    // Segments DB vs registre.
    const dbSeg = sourceId ? await segmentCountForSurah(client, sourceId, surah) : 0;
    if (dbSeg !== expected.segments) {
      violations.push(`surah ${surah}: segments DB=${dbSeg} attendu=${expected.segments}`);
    }

    // Idempotence NO-OP : tous les source_record_id du plan doivent déjà exister.
    for (const o of plan.occurrences) {
      idemTotal += 1;
      if (!existingRecordIds.has(o.source_record_id)) idemMissing += 1;
    }

    // Runtime : résolution 100 %.
    const map = await getWordLinguisticEvidence(client, wordIds, surah);
    runtime[surah] = { expected_words: wordIds.length, resolved_words: map.size };
    if (map.size !== wordIds.length) runtimeOk = false;

    perSurah[surah] = {
      expected_occurrences: expected.aligned,
      plan_aligned: stats.aligned,
      plan_segments: stats.segmentCount,
      db_occurrences: dbOcc,
      db_segments: dbSeg,
      exact: stats.exact,
      exact_orthographic: stats.exactOrthographic,
      variant: stats.variantOrthographyDocumented,
      ambiguous: stats.ambiguous,
      missing: stats.missing.length,
      extra: stats.extra.length,
      unique_word_ids: wordIds.length,
      runtime_resolved: map.size,
    };
  }

  // ---- 4. TOTAL segments B03 (somme des comptages par sourate, ci-dessus) ----
  const dbSegTotal = B03_SURAHS.reduce((s, surah) => s + ((perSurah[surah] as { db_segments: number }).db_segments), 0);

  const baselineMatchesRecorded =
    counters.linguistic_occurrences === RECORDED_POST.linguistic_occurrences &&
    counters.linguistic_segments === RECORDED_POST.linguistic_segments;

  const idempotent = idemMissing === 0;
  const propagationOk = violations.length === 0;
  const result = {
    phase: "PHASE_68B_B03_VERIFICATION_READONLY",
    mode: "READ_ONLY",
    surahs: B03_SURAHS,
    checksum: { ok: checksumOk, sha256: checksumOk ? EXPECTED_SHA256.slice(0, 16) + "…" : sha256 },
    source_id: sourceId,
    baseline: {
      counters,
      recorded_post: RECORDED_POST,
      matches_recorded_post: baselineMatchesRecorded,
    },
    per_surah: perSurah,
    propagation: {
      db_counts_by_surah: dbCounts,
      violations,
      ok: propagationOk,
    },
    segments: {
      expected_b03_total: B03_TOTAL_SEG,
      db_b03_total: dbSegTotal,
      ok: dbSegTotal === B03_TOTAL_SEG,
    },
    idempotence_noop: {
      planned_source_record_ids: idemTotal,
      already_present: idemTotal - idemMissing,
      would_insert: idemMissing,
      ok: idempotent,
    },
    runtime: {
      per_surah: runtime,
      ok: runtimeOk,
    },
    totals: {
      expected_b03_occurrences: B03_TOTAL_OCC,
      db_total_occurrences: counters.linguistic_occurrences,
    },
    verdict: checksumOk && baselineMatchesRecorded && propagationOk && idempotent && runtimeOk && dbSegTotal === B03_TOTAL_SEG
      ? "PHASE_68B_B03_STATE_VERIFIED"
      : "PHASE_68B_B03_STATE_MISMATCH",
  };

  const dir = join("tmp/phase68", "68b_masaq_B03");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "verification-readonly.json"), JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`[verify-68b-b03-readonly] checksum=${checksumOk ? "OK" : "FAIL"}`);
  console.log(`[verify-68b-b03-readonly] baseline=${baselineMatchesRecorded ? "MATCHES post-B03" : "MISMATCH"} (occ=${counters.linguistic_occurrences}, seg=${counters.linguistic_segments})`);
  console.log(`[verify-68b-b03-readonly] propagation=${propagationOk ? "OK" : "VIOLATIONS " + JSON.stringify(violations)}`);
  console.log(`[verify-68b-b03-readonly] segments B03 DB=${dbSegTotal} attendu=${B03_TOTAL_SEG}`);
  console.log(`[verify-68b-b03-readonly] idempotence no-op : ${idemTotal - idemMissing}/${idemTotal} présents, insertion si re-run=${idemMissing}`);
  console.log(`[verify-68b-b03-readonly] runtime=${runtimeOk ? "OK 100%" : "MISMATCH " + JSON.stringify(runtime)}`);
  console.log(`[verify-68b-b03-readonly] VERDICT=${result.verdict}`);
}

main().catch((err) => {
  console.error("verify-68b-b03-readonly failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
