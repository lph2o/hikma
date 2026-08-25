/**
 * scripts/tmp/phase68/import-68b.ts
 *
 * PHASE 68B — IMPORT INDUSTRIEL MASAQ (54 sourates IMPORT_DIRECT).
 *
 * Réutilise STRICTEMENT le moteur MASAQ canonique :
 *   - `buildImportPlan` / `assertPlanScope`  (lib/linguistic/masaq-plan.ts)
 *   - `classifyAlignment` / `normalizeOrthographic` (lib/linguistic/masaq.ts,
 *     transitivement via buildImportPlan — JAMAIS modifié ici)
 *   - `getWordLinguisticEvidence`            (lib/learning/queries.ts, runtime)
 *   - `captureCanonicalCounters` / `diffCounters` / `diffIsContained`
 *                                            (scripts/industrial/_lib/counters.ts)
 *
 * Le glue DB (fetch occurrences Hikma, resolve source, applyImport idempotent)
 * est fidèle à scripts/import-masaq-multi-surah.ts (Phase 27), qui reste le
 * mécanisme de référence. Ici on n'ajoute QUE le protocole 9-STEP Phase 68B :
 * baseline-pre / dry-run / scope / confirm / apply / verify / propagation /
 * idempotence / non-regression, par batch de ≤ 5 sourates, avec reprise.
 *
 * Usage :
 *   npx tsx scripts/tmp/phase68/import-68b.ts                      → DRY-RUN global (54 sourates)
 *   npx tsx scripts/tmp/phase68/import-68b.ts --batch=B01          → DRY-RUN d'un batch
 *   APPLY=1 npx tsx scripts/tmp/phase68/import-68b.ts              → APPLY (batches en attente)
 *   APPLY=1 npx tsx scripts/tmp/phase68/import-68b.ts --batch=B01  → APPLY d'un seul batch
 *
 * Ne modifie QUE : linguistic_occurrences + linguistic_segments
 * (et `sources` uniquement si la source MASAQ v2 n'existe pas encore — ce qui
 * ne doit pas arriver : elle existe déjà depuis Phase 27).
 */

import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  assertPlanScope,
  buildImportPlan,
  type HikmaOccurrenceInput,
} from "../../../lib/linguistic/masaq-plan";
import { applyMasaqPlan } from "../../../lib/linguistic/masaq-apply";
import { getWordLinguisticEvidence } from "../../../lib/learning/queries";
import { selectAllPages } from "../../../lib/quran/repositories/shared";
import {
  captureCanonicalCounters,
  diffCounters,
  diffIsContained,
} from "../../../scripts/industrial/_lib/counters";
import {
  buildServiceRoleClient,
  loadIndustrialEnvFiles,
  parseIndustrialFlags,
} from "../../../scripts/industrial/_lib/load-env";

// ============================================================
// CONSTANTES CANONIQUES (identiques à scripts/import-masaq-multi-surah.ts)
// ============================================================
const EXPECTED_SHA256 =
  "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";

const SOURCE_ROW = {
  name: "MASAQ",
  type: "linguistic",
  version: "v2",
  url: "https://doi.org/10.17632/9yvrzxktmr.2",
  license: "CC BY 3.0 (page) / CC BY 4.0 (DataCite)",
  metadata: {
    doi: "10.17632/9yvrzxktmr.2",
    attribution:
      "MASAQ — Majdi Sawalha, University of Jordan (2024), Mendeley Data, DOI 10.17632/9yvrzxktmr.2",
    checksum_sha256: EXPECTED_SHA256,
    file: "tmp/MASAQ.csv",
  },
};

const OWNED_TABLES = new Set([
  "sources",
  "linguistic_occurrences",
  "linguistic_segments",
] as const);

const MASAQ_BATCHES_PATH = "tmp/phase67/masaq-batches.json";
const STATE_PATH = "tmp/phase68/execution-state-68b.json";
const OUT_DIR = "tmp/phase68";
const BATCH_SIZE = 5;

type Client = Awaited<ReturnType<typeof buildServiceRoleClient>>;

interface DirectSurah {
  surah: number;
  aligned: number;
  segments: number;
}

interface PlannedSurah {
  surah: number;
  expectedOccurrences: number;
  expectedSegments: number;
  stats: {
    hikmaOccurrences: number;
    aligned: number;
    exact: number;
    exactOrthographic: number;
    variantOrthographyDocumented: number;
    ambiguous: number;
    missing: number;
    extra: number;
    segmentCount: number;
  };
  uniqueWordIds: number;
  wordIds: string[];
  plan: ReturnType<typeof buildImportPlan>;
}

type BatchStatus = "DRY_RUN" | "APPLYING" | "VERIFIED" | "BLOCKED";

interface BatchState {
  batch: string;
  status: BatchStatus;
  surahs: number[];
  expected_occurrences: number;
  inserted_occurrences: number;
  expected_segments: number;
  inserted_segments: number;
  ambiguous: number;
  missing: number;
  extra: number;
  idempotent: boolean;
  tests: string;
}

interface ExecutionState {
  phase: string;
  mode: string;
  started_at: string;
  updated_at: string;
  current_batch: string | null;
  batches: BatchState[];
}

// ============================================================
// HELPERS FS / LOG
// ============================================================
function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeJSON(path: string, payload: unknown): void {
  writeFileSync(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const LOG_PATH = join(OUT_DIR, "import-68b.log");
function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_PATH, line + "\n", "utf8");
}

// ============================================================
// CHARGEMENT DU REGISTRE PHASE 67 (54 sourates IMPORT_DIRECT)
// ============================================================
function loadImportDirectSurahs(): DirectSurah[] {
  const raw = readJSON<{
    batches: Array<{
      bucket: string;
      surahs: Array<{
        surah: number;
        aligned: number;
        segments: number;
      }>;
    }>;
  }>(MASAQ_BATCHES_PATH);
  const bucket = raw.batches.find((b) => b.bucket === "IMPORT_DIRECT");
  if (!bucket) throw new Error("IMPORT_DIRECT bucket absent de masaq-batches.json");
  return bucket.surahs.map((s) => ({
    surah: Number(s.surah),
    aligned: Number(s.aligned),
    segments: Number(s.segments),
  }));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function batchIdFor(index: number): string {
  return `68b_masaq_B${String(index + 1).padStart(2, "0")}`;
}

// ============================================================
// GLUE DB CANONIQUE (fidèle à import-masaq-multi-surah.ts)
// ============================================================
async function fetchHikmaForSurah(
  client: Client,
  surah: number,
): Promise<HikmaOccurrenceInput[]> {
  // Pagination obligatoire : PostgREST plafonne à 1000 lignes par défaut.
  // Les sourates IMPORT_DIRECT > 1000 occurrences (8, 9, 22, 28, 39) seraient
  // sinon tronquées → faux « EXTRA » dans buildImportPlan. La jointure et les
  // champs restent IDENTIQUES au script canonique Phase 27 (qui n'a jamais
  // traité de sourate > 26 occurrences). Ordre stable par `id` (clé unique).
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
    .eq("name", SOURCE_ROW.name)
    .eq("version", SOURCE_ROW.version)
    .limit(1);
  return (data as Array<{ id: string }> | null)?.[0]?.id ?? null;
}

async function resolveSource(
  client: Client,
): Promise<{ id: string; created: boolean }> {
  const { data } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_ROW.name)
    .eq("version", SOURCE_ROW.version)
    .limit(1);
  const existing = (data as Array<{ id: string }> | null)?.[0];
  if (existing) return { id: existing.id, created: false };

  const { data: ins, error } = await client
    .from("sources")
    .insert({ ...SOURCE_ROW, retrieved_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: again } = await client
        .from("sources")
        .select("id")
        .eq("name", SOURCE_ROW.name)
        .eq("version", SOURCE_ROW.version)
        .limit(1);
      const race = (again as Array<{ id: string }> | null)?.[0];
      if (race) return { id: race.id, created: false };
    }
    throw new Error(`sources : ${error.message}`);
  }
  return { id: (ins as { id: string }).id, created: true };
}

/**
 * Applique le plan MASAQ via le glue canonique idempotent + auto-réparant
 * (lib/linguistic/masaq-apply.ts). Délégation pure : aucune logique locale.
 */
async function applyImport(
  client: Client,
  sourceId: string,
  plan: ReturnType<typeof buildImportPlan>,
): Promise<{
  inserted: number;
  duplicates: number;
  errors: number;
  segmentsInserted: number;
}> {
  return applyMasaqPlan(client, sourceId, plan);
}

/** Compte des occurrences MASAQ par sourate (READ-ONLY) — matrice de propagation. */
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
  for (const r of rows) {
    out[r.surah_number] = (out[r.surah_number] ?? 0) + 1;
  }
  return out;
}

// ============================================================
// BUILD PLAN POUR UNE SOURATE (dry-run) — retombe en erreur explicite
// ============================================================
function buildPlanForSurah(
  hikma: HikmaOccurrenceInput[],
  csvText: string,
  direct: DirectSurah,
): PlannedSurah {
  const plan = buildImportPlan(hikma, csvText, { surah: direct.surah });
  // assertPlanScope lève une erreur si MISSING/EXTRA/AMBIGUOUS/scope violé.
  const stats = assertPlanScope(plan, direct.surah);

  if (stats.aligned !== direct.aligned) {
    throw new Error(
      `divergence Phase 67 : ${stats.aligned} alignées (attendu ${direct.aligned})`,
    );
  }
  if (stats.segmentCount !== direct.segments) {
    throw new Error(
      `divergence Phase 67 : ${stats.segmentCount} segments (attendu ${direct.segments})`,
    );
  }

  const wordIds = [...new Set(hikma.map((h) => h.quranWordId).filter((w): w is string => !!w))];
  return {
    surah: direct.surah,
    expectedOccurrences: direct.aligned,
    expectedSegments: direct.segments,
    stats: {
      hikmaOccurrences: stats.hikmaOccurrences,
      aligned: stats.aligned,
      exact: stats.exact,
      exactOrthographic: stats.exactOrthographic,
      variantOrthographyDocumented: stats.variantOrthographyDocumented,
      ambiguous: stats.ambiguous,
      missing: stats.missing.length,
      extra: stats.extra.length,
      segmentCount: stats.segmentCount,
    },
    uniqueWordIds: wordIds.length,
    wordIds,
    plan,
  };
}

// ============================================================
// ÉTAT D'EXÉCUTION (reprise)
// ============================================================
function loadState(): ExecutionState {
  if (existsSync(STATE_PATH)) return readJSON<ExecutionState>(STATE_PATH);
  return {
    phase: "PHASE_68B_IMPORT_DIRECT_EXECUTION_STATE",
    mode: "DRY_RUN",
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    current_batch: null,
    batches: [],
  };
}

function saveState(state: ExecutionState): void {
  state.updated_at = new Date().toISOString();
  writeJSON(STATE_PATH, state);
}

function stateBatch(state: ExecutionState, id: string): BatchState | undefined {
  return state.batches.find((b) => b.batch === id);
}

// ============================================================
// GÉNÉRATION RAPPORT MARKDOWN PAR BATCH
// ============================================================
function writeBatchMarkdown(
  batchId: string,
  payload: Record<string, unknown>,
): void {
  const dir = join(OUT_DIR, batchId);
  ensureDir(dir);
  const lines: string[] = [];
  lines.push(`# ${batchId} — MASAQ IMPORT (Phase 68B)`);
  lines.push("");
  for (const section of Object.keys(payload)) {
    lines.push(`## ${section}`);
    lines.push("");
    const value = payload[section];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      lines.push(`${String(value)}`);
    } else {
      lines.push("```json");
      lines.push(JSON.stringify(value, null, 2));
      lines.push("```");
    }
    lines.push("");
  }
  writeFileSync(join(dir, "PHASE_68B_BATCH_MASAQ_IMPORT.md"), lines.join("\n"), "utf8");
}

// ============================================================
// MAIN
// ============================================================
async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const APPLY = flags.apply;
  const mode = APPLY ? "APPLY" : "DRY-RUN";

  const csvPath = "tmp/MASAQ.csv";
  const csvBuffer = readFileSync(csvPath);
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  if (sha256 !== EXPECTED_SHA256) {
    throw new Error(`STOP — checksum MASAQ invalide : ${sha256}`);
  }
  const csvText = csvBuffer.toString("utf8");

  const direct = loadImportDirectSurahs();
  const allBatches = chunk(direct, BATCH_SIZE).map((b, i) => ({
    id: batchIdFor(i),
    surahs: b,
  }));

  log(`=== PHASE 68B — IMPORT MASAQ (${mode}) — ${direct.length} sourates IMPORT_DIRECT ===`);

  const client = await buildServiceRoleClient();

  // Détermine le sous-ensemble de batches à traiter.
  const state = loadState();
  state.mode = mode;
  let targetBatches: typeof allBatches;
  if (flags.batchId) {
    const found = allBatches.find((b) => b.id === flags.batchId);
    if (!found) throw new Error(`batch inconnu : ${flags.batchId}`);
    targetBatches = [found];
  } else if (flags.surahs.length > 0) {
    // Sous-ensemble explicite de sourates → un batch ad-hoc (max 5 imposé).
    const wanted = direct.filter((d) => flags.surahs.includes(d.surah));
    targetBatches = chunk(wanted, BATCH_SIZE).map((b, i) => ({
      id: `68b_masaq_ADHOC_${String(i + 1).padStart(2, "0")}`,
      surahs: b,
    }));
  } else {
    targetBatches = allBatches;
  }

  let globalBlocked = false;

  for (const batch of targetBatches) {
    const batchId = batch.id;
    const dir = join(OUT_DIR, batchId);
    ensureDir(dir);
    state.current_batch = batchId;

    // Reprise : si déjà VERIFIED, on saute (sauf si APPLY forcé sur un batch explicite).
    const existing = stateBatch(state, batchId);
    if (existing && existing.status === "VERIFIED" && !flags.batchId) {
      log(`[${batchId}] déjà VERIFIED — skip (reprise).`);
      continue;
    }

    const expectedOcc = batch.surahs.reduce((s, d) => s + d.aligned, 0);
    const expectedSeg = batch.surahs.reduce((s, d) => s + d.segments, 0);

    const report: Record<string, unknown> = {
      batch: batchId,
      mode,
      surahs: batch.surahs.map((d) => d.surah),
      expected_occurrences: expectedOcc,
      expected_segments: expectedSeg,
    };

    log(`[${batchId}] début — sourates [${batch.surahs.map((d) => d.surah).join(",")}]`);

    // ---- 9-STEP.1 BASELINE ----
    const before = await captureCanonicalCounters(client);
    writeJSON(join(dir, "baseline-pre.json"), before);
    report["baseline_pre"] = before;

    // ---- 9-STEP.2/3 DRY-RUN + SCOPE ----
    const planned: PlannedSurah[] = [];
    const planErrors: Array<{ surah: number; error: string }> = [];
    for (const d of batch.surahs) {
      try {
        const hikma = await fetchHikmaForSurah(client, d.surah);
        const p = buildPlanForSurah(hikma, csvText, d);
        planned.push(p);
        log(
          `  [${batchId}] sourate ${d.surah} : alignées=${p.stats.aligned}/${d.aligned} ` +
            `EXACT=${p.stats.exact} ORTHO=${p.stats.exactOrthographic} VAR=${p.stats.variantOrthographyDocumented} ` +
            `AMBIG=${p.stats.ambiguous} MISSING=${p.stats.missing} EXTRA=${p.stats.extra} ` +
            `segments=${p.stats.segmentCount}/${d.segments} words=${p.uniqueWordIds}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        planErrors.push({ surah: d.surah, error: msg });
        log(`  [${batchId}] ✗ sourate ${d.surah} BLOQUÉE : ${msg}`);
      }
    }

    const planSummary = {
      surahs: planned.map((p) => ({
        surah: p.surah,
        expected_occurrences: p.expectedOccurrences,
        aligned: p.stats.aligned,
        expected_segments: p.expectedSegments,
        segments: p.stats.segmentCount,
        exact: p.stats.exact,
        exact_orthographic: p.stats.exactOrthographic,
        variant: p.stats.variantOrthographyDocumented,
        ambiguous: p.stats.ambiguous,
        missing: p.stats.missing,
        extra: p.stats.extra,
        unique_word_ids: p.uniqueWordIds,
      })),
      total_aligned: planned.reduce((s, p) => s + p.stats.aligned, 0),
      total_segments: planned.reduce((s, p) => s + p.stats.segmentCount, 0),
    };
    writeJSON(join(dir, "preimport-plan.json"), planSummary);
    report["dry_run"] = planSummary;

    if (planErrors.length > 0) {
      report["status"] = "BLOCKED";
      report["errors"] = planErrors;
      writeJSON(join(dir, "report.json"), report);
      writeBatchMarkdown(batchId, report);

      const st: BatchState = {
        batch: batchId,
        status: "BLOCKED",
        surahs: batch.surahs.map((d) => d.surah),
        expected_occurrences: expectedOcc,
        inserted_occurrences: 0,
        expected_segments: expectedSeg,
        inserted_segments: 0,
        ambiguous: 0,
        missing: 0,
        extra: 0,
        idempotent: false,
        tests: "N/A",
      };
      const idx = state.batches.findIndex((b) => b.batch === batchId);
      if (idx >= 0) state.batches[idx] = st;
      else state.batches.push(st);
      saveState(state);
      globalBlocked = true;
      log(`[${batchId}] STOP — ${planErrors.length} sourate(s) BLOQUÉE(S) au dry-run.`);
      continue;
    }

    // ---- 9-STEP.4 CONFIRM (human gate) ----
    report["scope"] = {
      owned_tables: [...OWNED_TABLES],
      surahs: batch.surahs.map((d) => d.surah),
      assertPlanScope: "PASS (0 violation)",
    };

    if (!APPLY) {
      report["status"] = "DRY_RUN_OK";
      report["confirm"] = "BATCH READY FOR APPLY — ATTENTE CONFIRMATION HUMAINE";
      writeJSON(join(dir, "report.json"), report);
      writeBatchMarkdown(batchId, report);
      const st: BatchState = {
        batch: batchId,
        status: "DRY_RUN",
        surahs: batch.surahs.map((d) => d.surah),
        expected_occurrences: expectedOcc,
        inserted_occurrences: 0,
        expected_segments: expectedSeg,
        inserted_segments: 0,
        ambiguous: 0,
        missing: 0,
        extra: 0,
        idempotent: true,
        tests: "PENDING",
      };
      const idx = state.batches.findIndex((b) => b.batch === batchId);
      if (idx >= 0) state.batches[idx] = st;
      else state.batches.push(st);
      saveState(state);
      log(`[${batchId}] DRY-RUN OK — BATCH READY FOR APPLY.`);
      continue;
    }

    // ---- 9-STEP.5 APPLY ----
    const stApplying: BatchState = {
      batch: batchId,
      status: "APPLYING",
      surahs: batch.surahs.map((d) => d.surah),
      expected_occurrences: expectedOcc,
      inserted_occurrences: 0,
      expected_segments: expectedSeg,
      inserted_segments: 0,
      ambiguous: 0,
      missing: 0,
      extra: 0,
      idempotent: false,
      tests: "PENDING",
    };
    const idxApply = state.batches.findIndex((b) => b.batch === batchId);
    if (idxApply >= 0) state.batches[idxApply] = stApplying;
    else state.batches.push(stApplying);
    saveState(state);

    // Snapshot propagation AVANT apply (matrice MASAQ par sourate).
    const sourceIdBefore = await resolveSourceIdReadOnly(client);
    const propBefore = await masaqCountsBySurah(client, sourceIdBefore);

    const source = await resolveSource(client);
    log(`  [${batchId}] source MASAQ : ${source.id} ${source.created ? "(créée)" : "(existante)"}`);

    let totalInserted = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    let totalSegments = 0;
    const perSurahApply: Record<number, unknown> = {};
    for (const p of planned) {
      const r = await applyImport(client, source.id, p.plan);
      perSurahApply[p.surah] = r;
      totalInserted += r.inserted;
      totalDuplicates += r.duplicates;
      totalErrors += r.errors;
      totalSegments += r.segmentsInserted;
      log(
        `  [${batchId}] sourate ${p.surah} : INSERTED=${r.inserted} DUP=${r.duplicates} ` +
          `ERR=${r.errors} SEGMENTS=${r.segmentsInserted}`,
      );
    }
    report["apply"] = {
      source_created: source.created,
      total: { inserted: totalInserted, duplicates: totalDuplicates, errors: totalErrors, segmentsInserted: totalSegments },
      per_surah: perSurahApply,
    };

    if (totalErrors > 0) {
      report["status"] = "APPLIED_FAILED";
      writeJSON(join(dir, "report.json"), report);
      writeBatchMarkdown(batchId, report);
      const st = state.batches.find((b) => b.batch === batchId)!;
      st.status = "BLOCKED";
      saveState(state);
      globalBlocked = true;
      log(`[${batchId}] STOP — ${totalErrors} erreurs à l'apply.`);
      continue;
    }

    // ---- 9-STEP.6 VERIFY (baseline-post + diff) ----
    const after = await captureCanonicalCounters(client);
    writeJSON(join(dir, "baseline-post.json"), after);
    const deltas = diffCounters(before, after);
    const contained = diffIsContained(deltas, OWNED_TABLES);
    writeJSON(join(dir, "diff.json"), { deltas, contained });

    report["post_check"] = {
      deltas,
      unexpected: contained.unexpected,
      expected: contained.expected,
      owned_only: contained.unexpected.length === 0,
    };

    if (contained.unexpected.length > 0) {
      report["status"] = "APPLIED_FAILED";
      writeJSON(join(dir, "report.json"), report);
      writeBatchMarkdown(batchId, report);
      const st = state.batches.find((b) => b.batch === batchId)!;
      st.status = "BLOCKED";
      saveState(state);
      globalBlocked = true;
      log(`[${batchId}] STOP — delta hors périmètre : ${JSON.stringify(contained.unexpected)}`);
      continue;
    }

    // ---- 9-STEP.6b COHÉRENCE DELTA (resume-safe) ----
    // Le delta de compteurs doit égaler ce que CETTE exécution a réellement
    // inséré (et non le total attendu du batch, qui peut déjà être partiellement
    // présent si on reprend après interruption).
    const occDelta = after.linguistic_occurrences - before.linguistic_occurrences;
    const segDelta = after.linguistic_segments - before.linguistic_segments;
    const sourcesDelta = after.sources - before.sources;
    const selfConsistent =
      occDelta === totalInserted &&
      segDelta === totalSegments &&
      (sourcesDelta === 0 || sourcesDelta === 1);
    report["post_check"] = {
      ...(report["post_check"] as object),
      occ_delta: occDelta,
      seg_delta: segDelta,
      sources_delta: sourcesDelta,
      self_consistent: selfConsistent,
    };
    writeJSON(join(dir, "report.json"), report);
    if (!selfConsistent) {
      log(
        `[${batchId}] STOP — delta incohérent : occ=${occDelta}/${totalInserted} ` +
          `seg=${segDelta}/${totalSegments} sources=${sourcesDelta}`,
      );
      globalBlocked = true;
      report["status"] = "APPLIED_FAILED";
      continue;
    }

    // ---- 9-STEP.7 PROPAGATION (état absolu final, autoritaire) ----
    // Vérifie l'état FINAL par sourate (pas seulement le delta) :
    //  - chaque sourate du batch doit atteindre exactement `aligned` (Phase 67) ;
    //  - toute autre sourate doit rester identique à son état d'avant ce batch.
    const propAfter = await masaqCountsBySurah(client, source.id);
    const propDeltas: Record<number, number> = {};
    const propKeys = new Set([...Object.keys(propBefore), ...Object.keys(propAfter)].map(Number));
    for (const s of propKeys) {
      const d = (propAfter[s] ?? 0) - (propBefore[s] ?? 0);
      if (d !== 0) propDeltas[s] = d;
    }
    const batchSurahSet = new Set(batch.surahs.map((d) => d.surah));
    const expectedBySurah = new Map(batch.surahs.map((d) => [d.surah, d.aligned]));
    const allSurahs = new Set([
      ...Object.keys(propBefore).map(Number),
      ...Object.keys(propAfter).map(Number),
      ...batch.surahs.map((d) => d.surah),
    ]);
    const propViolations: Array<{
      surah: number;
      before: number;
      after: number;
      expected: number;
    }> = [];
    for (const s of allSurahs) {
      const beforeV = propBefore[s] ?? 0;
      const afterV = propAfter[s] ?? 0;
      if (batchSurahSet.has(s)) {
        const exp = expectedBySurah.get(s) ?? 0;
        if (afterV !== exp) {
          propViolations.push({ surah: s, before: beforeV, after: afterV, expected: exp });
        }
      } else if (afterV !== beforeV) {
        propViolations.push({ surah: s, before: beforeV, after: afterV, expected: beforeV });
      }
    }
    writeJSON(join(dir, "propagation.json"), {
      before: propBefore,
      after: propAfter,
      deltas: propDeltas,
    });
    report["propagation"] = {
      deltas: propDeltas,
      violations: propViolations,
      ok: propViolations.length === 0,
    };
    if (propViolations.length > 0) {
      log(`[${batchId}] STOP — propagation inattendue : ${JSON.stringify(propViolations)}`);
      globalBlocked = true;
      report["status"] = "APPLIED_FAILED";
      continue;
    }

    // ---- 9-STEP.10 RUNTIME (getWordLinguisticEvidence) ----
    const runtime: Record<number, { expected_words: number; resolved_words: number }> = {};
    let runtimeOk = true;
    for (const p of planned) {
      // getWordLinguisticEvidence chunk désormais en interne (Phase 68B) :
      // plus besoin du workaround par occurrence-count.
      const map = await getWordLinguisticEvidence(client, p.wordIds, p.surah);
      runtime[p.surah] = { expected_words: p.uniqueWordIds, resolved_words: map.size };
      if (map.size !== p.uniqueWordIds) runtimeOk = false;
    }
    writeJSON(join(dir, "runtime.json"), runtime);
    report["runtime"] = { per_surah: runtime, ok: runtimeOk };
    if (!runtimeOk) {
      log(`[${batchId}] STOP — runtime mismatch : ${JSON.stringify(runtime)}`);
      globalBlocked = true;
      report["status"] = "APPLIED_FAILED";
      continue;
    }

    // ---- 9-STEP.8 IDEMPOTENCE ----
    let idempotent = true;
    let idemInserted = 0;
    let idemDuplicates = 0;
    for (const p of planned) {
      const r = await applyImport(client, source.id, p.plan);
      idemInserted += r.inserted;
      idemDuplicates += r.duplicates;
      if (r.inserted !== 0 || r.errors !== 0) idempotent = false;
    }
    writeJSON(join(dir, "idempotence.json"), { inserted: idemInserted, duplicates: idemDuplicates, idempotent });
    report["idempotence"] = { inserted: idemInserted, duplicates: idemDuplicates, idempotent };
    if (!idempotent) {
      log(`[${batchId}] STOP — idempotence violée (re-run a inséré ${idemInserted}).`);
      globalBlocked = true;
      report["status"] = "APPLIED_FAILED";
      continue;
    }

    // ---- 9-STEP.9 NON-REGRESSION ----
    // Pas de code modifié pendant l'import : tsc/eslint/vitest/build sont exécutés
    // une fois en fin de phase (voir verification). Documenté ici comme PASS-différé.
    report["non_regression"] = {
      note: "Aucune modification de code source pendant l'APPLY (DB-only). Suite complète exécutée en fin de phase.",
      status: "DEFERRED",
    };

    report["status"] = "VERIFIED";
    report["verdict"] = "BATCH_VERIFIED";
    writeJSON(join(dir, "report.json"), report);
    writeBatchMarkdown(batchId, report);

    const stDone: BatchState = {
      batch: batchId,
      status: "VERIFIED",
      surahs: batch.surahs.map((d) => d.surah),
      expected_occurrences: expectedOcc,
      inserted_occurrences: totalInserted,
      expected_segments: expectedSeg,
      inserted_segments: totalSegments,
      ambiguous: 0,
      missing: 0,
      extra: 0,
      idempotent,
      tests: "DEFERRED",
    };
    const idxDone = state.batches.findIndex((b) => b.batch === batchId);
    if (idxDone >= 0) state.batches[idxDone] = stDone;
    else state.batches.push(stDone);
    saveState(state);
    log(`[${batchId}] VERIFIED — inserted=${totalInserted} segments=${totalSegments}.`);
  }

  saveState(state);
  if (globalBlocked) {
    log("=== PHASE 68B — PARTIELLEMENT BLOQUÉ (voir execution-state-68b.json) ===");
    process.exitCode = 1;
  } else {
    log("=== PHASE 68B — batches traités (voir execution-state-68b.json) ===");
  }
}

main().catch((err) => {
  log(`Phase 68B échouée : ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
