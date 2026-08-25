/**
 * scripts/tmp/phase68/ground-truth-68b.ts
 *
 * PHASE 68B — GROUND TRUTH READ-ONLY (ÉTAPE 0 du protocole B04).
 *
 * Capte l'état RÉEL de la DB live (source de vérité absolue) sans aucune
 * écriture :
 *   1. baseline canonique des 20 tables ;
 *   2. checksum SHA-256 de tmp/MASAQ.csv ;
 *   3. compteurs MASAQ par sourate (matrice de propagation) ;
 *   4. vérification que B01/B02/B03 sont présents et cohérents ;
 *   5. vérification que B04 (sourates 50-54) n'est PAS appliqué.
 *
 * Usage :
 *   npx tsx scripts/tmp/phase68/ground-truth-68b.ts [--surahs=50,51,52,53,54]
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { captureCanonicalCounters } from "../../../scripts/industrial/_lib/counters";
import {
  buildServiceRoleClient,
  loadIndustrialEnvFiles,
} from "../../../scripts/industrial/_lib/load-env";
import { selectAllPages } from "../../../lib/quran/repositories/shared";

const EXPECTED_SHA256 =
  "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";

const SOURCE_NAME = "MASAQ";
const SOURCE_VERSION = "v2";

// États attendus (registre Phase 67 / batches B01-B03 vérifiés).
const EXPECTED_PRESENT: Record<number, number> = {
  8: 1233, 9: 2498, 13: 853, 22: 1274, 28: 1430, // B01
  29: 976, 31: 546, 32: 372, 34: 883, 36: 725, // B02
  39: 1172, 45: 488, 46: 643, 47: 539, 49: 347, // B03
};

type Client = Awaited<ReturnType<typeof buildServiceRoleClient>>;

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

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const surahs = (process.argv.find((a) => a.startsWith("--surahs="))?.split("=")[1] ?? "50,51,52,53,54")
    .split(",")
    .map(Number);

  const csvBuffer = readFileSync("tmp/MASAQ.csv");
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  const checksumOk = sha256 === EXPECTED_SHA256;

  const client = await buildServiceRoleClient();
  const counters = await captureCanonicalCounters(client);

  const { data: srcRows } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .eq("version", SOURCE_VERSION)
    .limit(1);
  const sourceId = (srcRows as Array<{ id: string }> | null)?.[0]?.id ?? null;

  const counts = await masaqCountsBySurah(client, sourceId);

  // Vérifications B01/B02/B03.
  const presentViolations: string[] = [];
  for (const [surah, expected] of Object.entries(EXPECTED_PRESENT)) {
    const actual = counts[Number(surah)] ?? 0;
    if (actual !== expected) {
      presentViolations.push(`surah ${surah}: DB=${actual} attendu=${expected}`);
    }
  }

  // B04 : sourates cibles doivent être ABSENTES (0 occurrence).
  const b04Present: Record<number, number> = {};
  for (const s of surahs) b04Present[s] = counts[s] ?? 0;
  const b04AlreadyApplied = surahs.some((s) => (counts[s] ?? 0) > 0);
  const b04SurahStates: Record<number, { occurrences: number; segments: number }> = {};
  if (sourceId) {
    for (const s of surahs) {
      const occIds = await selectAllPages<{ id: string }>((from, to) =>
        client
          .from("linguistic_occurrences")
          .select("id")
          .eq("source_id", sourceId)
          .eq("surah_number", s)
          .order("id")
          .range(from, to),
      );
      let segments = 0;
      const ids = occIds.map((o) => o.id);
      for (let i = 0; i < ids.length; i += 250) {
        const { count, error } = await client
          .from("linguistic_segments")
          .select("id", { count: "exact", head: true })
          .in("linguistic_occurrence_id", ids.slice(i, i + 250));
        if (error) throw new Error(`linguistic_segments : ${error.message}`);
        segments += count ?? 0;
      }
      b04SurahStates[s] = { occurrences: occIds.length, segments };
    }
  }

  const result = {
    phase: "PHASE_68B_GROUND_TRUTH_READONLY",
    captured_at: new Date().toISOString(),
    mode: "READ_ONLY",
    checksum: { ok: checksumOk, sha256: checksumOk ? EXPECTED_SHA256.slice(0, 16) + "…" : sha256 },
    source_id: sourceId,
    baseline: counters,
    per_surah_counts: counts,
    b01_b02_b03_present: {
      violations: presentViolations,
      ok: presentViolations.length === 0,
    },
    b04: {
      surahs,
      occurrences_by_surah: b04Present,
      already_applied: b04AlreadyApplied,
      per_surah_detail: b04SurahStates,
    },
    verdict:
      checksumOk && presentViolations.length === 0 && !b04AlreadyApplied
        ? "GROUND_TRUTH_OK_B04_PENDING"
        : "GROUND_TRUTH_DIVERGENCE",
  };

  const dir = join("tmp/phase68", "ground-truth");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "ground-truth-68b.json"), JSON.stringify(result, null, 2) + "\n", "utf8");

  console.log(`[ground-truth-68b] checksum=${checksumOk ? "OK" : "FAIL"}`);
  console.log(`[ground-truth-68b] linguistic_occurrences=${counters.linguistic_occurrences} linguistic_segments=${counters.linguistic_segments}`);
  console.log(`[ground-truth-68b] B01/B02/B03 present=${presentViolations.length === 0 ? "OK" : "VIOLATIONS " + JSON.stringify(presentViolations)}`);
  console.log(`[ground-truth-68b] B04 already_applied=${b04AlreadyApplied}`);
  for (const s of surahs) {
    console.log(`[ground-truth-68b]   surah ${s}: occ=${b04SurahStates[s].occurrences} seg=${b04SurahStates[s].segments}`);
  }
  console.log(`[ground-truth-68b] VERDICT=${result.verdict}`);
}

main().catch((err) => {
  console.error("ground-truth-68b failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
