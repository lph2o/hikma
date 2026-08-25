/**
 * READ-ONLY — capture les compteurs canoniques + la matrice MASAQ par sourate
 * (pour confirmer l'état B01 avant/après stabilisation).
 */
import { captureCanonicalCounters } from "../../../scripts/industrial/_lib/counters";
import { buildServiceRoleClient, loadIndustrialEnvFiles } from "../../../scripts/industrial/_lib/load-env";

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const client = await buildServiceRoleClient();

  const counters = await captureCanonicalCounters(client);
  console.log("COUNTERS:", JSON.stringify(counters));

  // Matrice MASAQ par sourate (paginée).
  const sourceId = (
    await client.from("sources").select("id").eq("name", "MASAQ").eq("version", "v2").limit(1)
  ).data?.[0]?.id as string | undefined;
  const bySurah: Record<number, number> = {};
  if (sourceId) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client
        .from("linguistic_occurrences")
        .select("surah_number")
        .eq("source_id", sourceId)
        .order("surah_number")
        .range(from, from + 999);
      if (error) throw error;
      const page = (data ?? []) as Array<{ surah_number: number }>;
      for (const r of page) bySurah[r.surah_number] = (bySurah[r.surah_number] ?? 0) + 1;
      if (page.length < 1000) break;
    }
  }
  console.log("MASAQ_BY_SURAH:", JSON.stringify(bySurah));

  const totalOcc = Object.values(bySurah).reduce((a, b) => a + b, 0);
  console.log("TOTAL_MASAQ_OCCURRENCES:", totalOcc);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
