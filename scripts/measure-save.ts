import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const client = createClient(url, key);

async function measure() {
  console.log("=== MESURE DES REQUÊTES UNITAIRES DB ===");

  // 1. SELECT user_word_progress pour 1 mot vs 5 mots
  const t0 = performance.now();
  await client.from("user_word_progress").select("*").eq("user_id", "00000000-0000-0000-0000-000000000000").in("word_id", ["1"]);
  const t1 = performance.now();
  console.log(`1x SELECT user_word_progress: ${(t1 - t0).toFixed(1)}ms`);

  const t2 = performance.now();
  for (let i = 0; i < 5; i++) {
    await client.from("user_word_progress").select("*").eq("user_id", "00000000-0000-0000-0000-000000000000").in("word_id", [String(i)]);
  }
  const t3 = performance.now();
  console.log(`5x SELECT séquentiels: ${(t3 - t2).toFixed(1)}ms (moyenne: ${((t3 - t2) / 5).toFixed(1)}ms/req)`);

  const t4 = performance.now();
  await Promise.all([
    client.from("user_word_progress").select("*").eq("user_id", "00000000-0000-0000-0000-000000000000").in("word_id", ["0", "1", "2", "3", "4"]),
    client.from("review_items").select("*").eq("user_id", "00000000-0000-0000-0000-000000000000").in("word_id", ["0", "1", "2", "3", "4"]),
  ]);
  const t5 = performance.now();
  console.log(`1x BATCH SELECT (5 mots en parallèle pour les 2 tables): ${(t5 - t4).toFixed(1)}ms`);

  // 2. Mesure lesson_words
  const t6 = performance.now();
  await client.from("lesson_words").select("word_id").limit(5);
  const t7 = performance.now();
  console.log(`1x SELECT lesson_words: ${(t7 - t6).toFixed(1)}ms`);
}

measure().catch(console.error);
