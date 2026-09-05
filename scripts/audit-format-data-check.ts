// Hikma — AUDIT READ-ONLY : DATA_CHECK des 8 nouveaux formats vidéo.
// SELECT uniquement — aucune écriture, aucune migration.
// Tables sondées : quran_words (root/lemma), word_lemma_mapping, lemmas,
// lemma_translations (fr validées), word_translations (fr validées),
// word_occurrences, ayahs, word_audio, word_explanations.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
    } catch {
      /* absent — OK */
    }
  }
}

async function count(client: SupabaseClient, table: string, filter = ""): Promise<number> {
  let q = client.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.filter(...(filter.split("::") as [string, string, string]));
  const { count: c, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return c ?? 0;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env requis : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, key, { auth: { persistSession: false } });

  const lines: string[] = [];
  const push = (label: string, value: string | number) => lines.push(`${label} = ${value}`);

  // 1. Base lexicale
  push("quran_words", await count(client, "quran_words"));
  push("quran_words.root NOT NULL", await count(client, "quran_words", "root::not.is::null"));
  push("quran_words.lemma_id NOT NULL", await count(client, "quran_words", "lemma_id::not.is::null"));
  push("lemmas", await count(client, "lemmas"));
  push("word_lemma_mapping (total)", await count(client, "word_lemma_mapping"));
  push("word_lemma_mapping (safe)", await count(client, "word_lemma_mapping", "confidence::eq::safe"));
  push("word_translations (fr)", await count(client, "word_translations", "language::eq::fr"));
  push("word_translations (fr validées)", await count(client, "word_translations", "language::eq::fr") ? await countValidated(client) : 0);
  push("lemma_translations", await count(client, "lemma_translations"));
  push("word_occurrences", await count(client, "word_occurrences"));
  push("ayahs", await count(client, "ayahs"));
  push("word_audio", await count(client, "word_audio"));
  push("ayah_audio", await count(client, "ayah_audio"));
  push("word_explanations", await count(client, "word_explanations").catch(() => -1));

  async function countValidated(c: SupabaseClient): Promise<number> {
    const { count: n } = await c
      .from("word_translations")
      .select("*", { count: "exact", head: true })
      .eq("language", "fr")
      .eq("is_validated", true);
    return n ?? 0;
  }

  // 2. Racines exploitables : root renseigné + nb de mots distincts par racine
  const { data: rootRows, error: rootErr } = await client
    .from("quran_words")
    .select("root")
    .not("root", "is", null)
    .limit(50000);
  if (rootErr) throw new Error(`root: ${rootErr.message}`);
  const byRoot = new Map<string, number>();
  for (const r of rootRows ?? []) {
    const k = (r as { root: string }).root;
    byRoot.set(k, (byRoot.get(k) ?? 0) + 1);
  }
  const multiWordRoots = [...byRoot.entries()].filter(([, n]) => n >= 3);
  push("racines distinctes (root renseigné)", byRoot.size);
  push("racines avec >=3 mots (déários dérivés)", multiWordRoots.length);
  const topRoots = multiWordRoots.sort((a, b) => b[1] - a[1]).slice(0, 10);
  lines.push("top racines : " + topRoots.map(([r, n]) => `${r}(${n})`).join(" · "));

  // 3. Exemple concret : une racine multi-mots avec gloses FR validées ?
  if (topRoots.length > 0) {
    const sampleRoot = topRoots[0]![0];
    const { data: sampleWords } = await client
      .from("quran_words")
      .select("id, arabic, transliteration, root")
      .eq("root", sampleRoot)
      .limit(10);
    lines.push(`\nEXEMPLE racine « ${sampleRoot} » :`);
    for (const w of (sampleWords ?? []) as { id: string; arabic: string; transliteration: string | null }[]) {
      const { count: wt } = await client
        .from("word_translations")
        .select("*", { count: "exact", head: true })
        .eq("word_id", w.id)
        .eq("language", "fr")
        .eq("is_validated", true);
      const { count: occ } = await client
        .from("word_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("word_id", w.id);
      lines.push(
        `  ${w.arabic} (${w.transliteration ?? "?"}) · gloses FR validées=${wt ?? 0} · occurrences=${occ ?? 0}`,
      );
    }
  }

  console.log("DATA_CHECK_START");
  for (const l of lines) console.log(l);
  console.log("DATA_CHECK_END");
}

main().catch((e) => {
  console.error("PROBE_ERROR", e instanceof Error ? e.message : e);
  process.exit(1);
});
