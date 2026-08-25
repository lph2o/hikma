import { createClient } from "@supabase/supabase-js";
(async () => {
  for (const f of [".env.local", ".env"]) {
    try { (process as any).loadEnvFile?.(f); } catch {}
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient(url, key, { auth: { persistSession: false } });
  const src = await client.from("sources").select("id").eq("name", "Hikma — lexique éditorial");
  const hikmaId = (src.data ?? [])[0]?.id;
  const lemmaIds = ["71d35060-c548-416b-ae25-d682e1c5575d","f986b797-62f3-4b70-b733-419f0170f5b8","1818b16c-a6f7-4c5a-b449-cf7df139839e","911bcc5c-6fc9-4668-a357-bc9b130af1f0","8afcda77-f864-4c33-8a28-ed3613a1f153","e35fe1cb-bcec-430c-b20c-29c011e2f733","223d7988-3efa-4bbf-897a-65c68523a0c6"];
  const lt = await client.from("lemma_translations").select("id, lemma_id").in("lemma_id", lemmaIds).eq("source_id", hikmaId).order("created_at");
  const wordIds = ["74e57f70-00f1-4cfd-987c-d87f0d7e66c8","01547cbe-310e-4182-957b-a10e6c9d221b"];
  const wt = await client.from("word_translations").select("id, word_id").in("word_id", wordIds).eq("source_id", hikmaId).order("created_at");
  console.log(JSON.stringify({ lemmaTranslations: lt.data, wordTranslations: wt.data }, null, 2));
})();
