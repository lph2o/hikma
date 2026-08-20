import type { SupabaseClient } from "@supabase/supabase-js";
import { BodyMedium, Caption, H1, H2 } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/server";
import type { QuranImport } from "@/types/quran";

export const dynamic = "force-dynamic";

const TABLES = [
  { key: "surahs", label: "Sourates" },
  { key: "ayahs", label: "Versets" },
  { key: "quran_words", label: "Mots distincts" },
  { key: "word_occurrences", label: "Occurrences" },
  { key: "translations", label: "Traductions" },
  { key: "recitations", label: "Récitants" },
] as const;

type TableKey = (typeof TABLES)[number]["key"];

async function countTable(
  client: SupabaseClient,
  table: TableKey,
): Promise<number | null> {
  try {
    const { count, error } = await client
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function latestImport(
  client: SupabaseClient,
): Promise<QuranImport | null> {
  try {
    const { data, error } = await client
      .from("imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as QuranImport | null) ?? null;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const client = await createClient();
  const counts = await Promise.all(
    TABLES.map(async (t) => ({ ...t, count: await countTable(client, t.key) })),
  );
  const lastImport = await latestImport(client);

  const initialized = counts.some((c) => (c.count ?? 0) > 0);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <H1>Admin — données coraniques</H1>
        <BodyMedium className="text-muted-foreground">
          État de la base de données coranique (lecture seule).
        </BodyMedium>
      </header>

      {!initialized ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <BodyMedium>
            Base non initialisée. Applique les migrations puis lance{" "}
            <code className="font-mono">npm run quran:import</code>.
          </BodyMedium>
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <H2>Compteurs</H2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {counts.map(({ key, label, count }) => (
            <div
              key={key}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4"
            >
              <Caption>{label}</Caption>
              <BodyMedium className="text-h3 font-semibold">
                {count == null ? "—" : count.toLocaleString("fr-FR")}
              </BodyMedium>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <H2>Dernier import</H2>
        <div className="rounded-2xl border border-border bg-card p-6">
          {lastImport ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
              <Caption>Statut</Caption>
              <BodyMedium>{lastImport.status}</BodyMedium>
              <Caption>Démarré</Caption>
              <BodyMedium>
                {lastImport.started_at
                  ? new Date(lastImport.started_at).toLocaleString("fr-FR")
                  : "—"}
              </BodyMedium>
              <Caption>Insérés</Caption>
              <BodyMedium>{lastImport.records_imported}</BodyMedium>
              <Caption>Mis à jour</Caption>
              <BodyMedium>{lastImport.records_updated}</BodyMedium>
              <Caption>Échecs</Caption>
              <BodyMedium>{lastImport.records_failed}</BodyMedium>
            </dl>
          ) : (
            <BodyMedium className="text-muted-foreground">
              Aucun import enregistré.
            </BodyMedium>
          )}
        </div>
      </section>
    </main>
  );
}
