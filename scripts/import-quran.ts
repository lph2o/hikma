// Script serveur d'import du Coran.
//
// Usage :
//   npm run quran:import                      # import complet
//   npm run quran:import -- --dry-run         # valide sans écrire
//   npm run quran:import -- --limit=2         # limite le nombre de sourates
//
// Nécessite SUPABASE_SERVICE_ROLE_KEY (côté serveur uniquement) pour écrire.

import { createClient } from "@supabase/supabase-js";
import { QuranComAdapter } from "../lib/quran/adapters/quran-com-adapter";
import { importQuran } from "../lib/quran/import/import-quran";
import { normalizeQuranData } from "../lib/quran/normalize";
import type { ImportStats, NormalizedQuranData } from "../lib/quran/types";
import { validateQuranData } from "../lib/quran/validation/validator";

const SOURCE = {
  name: "Quran.com API v4",
  type: "api",
  url: "https://api.qurancdn.com/api/qdc",
  version: "v4",
  license:
    "Texte uthmani : basé sur Tanzil (libre). Traductions : droits des traducteurs respectifs.",
  metadata: {
    chapters_language: "fr",
    translations: "fr(31), en(20), it(153)",
    words: true,
  },
} as const;

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

function parseArgs(argv: string[]): { dryRun: boolean; chapterLimit?: number } {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const chapterLimit = limitArg
    ? Number.parseInt(limitArg.split("=")[1], 10)
    : undefined;
  return { dryRun, chapterLimit };
}

function summarize(data: NormalizedQuranData, stats?: ImportStats): void {
  console.log("\n=== Résumé ===");
  console.log(`  surahs        : ${stats?.surahs ?? data.surahs.length}`);
  console.log(`  ayahs         : ${stats?.ayahs ?? data.ayahs.length}`);
  console.log(`  words         : ${stats?.words ?? data.words.length}`);
  console.log(`  occurrences   : ${stats?.occurrences ?? data.occurrences.length}`);
  console.log(`  translations  : ${stats?.translations ?? data.translations.length}`);
  console.log(`  recitations   : ${stats?.recitations ?? data.recitations.length}`);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const { dryRun, chapterLimit } = parseArgs(process.argv.slice(2));

  console.log("1/4 Récupération des données (Quran.com API v4)…");
  const adapter = new QuranComAdapter({ chapterLimit });
  const raw = await adapter.fetch();

  console.log("2/4 Normalisation…");
  const data = normalizeQuranData(raw);

  console.log("3/4 Validation…");
  const report = validateQuranData(data);
  summarize(data);

  if (!report.valid) {
    console.error("\nValidation KO — import annulé :");
    for (const issue of report.issues.filter((i) => i.severity === "error")) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }
  console.log("Validation OK.");

  if (dryRun) {
    console.log("\nDry-run : aucune écriture Supabase effectuée.");
    return;
  }

  console.log("4/4 Écriture Supabase…");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_URL) manquant.\n" +
        "Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local (côté serveur uniquement).",
    );
    process.exit(1);
  }

  const client = createClient(url, serviceRole, {
    auth: { persistSession: false },
  });

  const result = await importQuran(client, data, { ...SOURCE });
  summarize(data, result.stats);
  console.log(
    `\nImport terminé : ${result.inserted} insérés, ${result.updated} mis à jour, ${result.failed} échecs.`,
  );
}

main().catch((err) => {
  console.error("\nImport échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
