// Hikma — LOT 2 SPEED VOCAB : sonde READ-ONLY pour le fixture gelé.
// Sélection déterministe = candidats (glose FORME fr validée) id ASC,
// tri par occurrences DESC, tie-break id ASC → 5 premiers.
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

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env requis");
  const client: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  // 1. Candidats : glose FORME fr validée (même jointure que listWordCandidates).
  const { data: cand, error } = await client
    .from("quran_words")
    .select("id, arabic, transliteration, wts:word_translations!inner(id, text)")
    .eq("wts.language", "fr")
    .eq("wts.is_validated", true)
    .order("id", { ascending: true })
    .range(0, 199);
  if (error) throw new Error(`candidates: ${error.message}`);

  type Row = {
    id: string;
    arabic: string;
    transliteration: string | null;
    wts: Array<{ id: string; text?: string }> | { id: string; text?: string };
  };

  // 2. Occurrences exactes par COUNT head:true (même mécanique que le service).
  const scored: { id: string; arabic: string; transliteration: string | null; meaning: string; wtId: string; occ: number }[] = [];
  for (const r of (cand ?? []) as Row[]) {
    const wt = Array.isArray(r.wts) ? r.wts[0] : r.wts;
    if (!wt?.id) continue;
    const { count, error: e2 } = await client
      .from("word_occurrences")
      .select("id", { count: "exact", head: true })
      .eq("word_id", r.id);
    if (e2) throw new Error(`occ: ${e2.message}`);
    scored.push({
      id: r.id,
      arabic: r.arabic,
      transliteration: r.transliteration,
      meaning: wt.text ?? "",
      wtId: wt.id,
      occ: count ?? 0,
    });
  }

  // 3. Tri déterministe : occurrences DESC, tie-break id ASC → top 5.
  scored.sort((a, b) => (b.occ !== a.occ ? b.occ - a.occ : a.id < b.id ? -1 : 1));
  const top = scored.slice(0, 5);
  console.log("SPEED_VOCAB_TOP5_START");
  for (const w of top) {
    console.log(JSON.stringify(w));
  }
  console.log("SPEED_VOCAB_TOP5_END");
}

main().catch((e) => {
  console.error("PROBE_ERROR", e instanceof Error ? e.message : e);
  process.exit(1);
});
