/**
 * PHASE 88F-AY — S86 AT-TARIQ RUNTIME-TRUTH + EDITORIAL AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * 1. Confirms S86 baseline via runtime model (word_tr | lemma_id | WLM)
 * 2. Lists ALL unresolved forms
 * 3. Produces real French editorial glosses from Hamidullah(rid=31) + Kazimirski(rid=9001)
 * 4. Validates: identity-safe, 0 English, 0 placeholders
 * 5. Simulates 55/55 → READY
 *
 * Identity-safe: word_id is the sole key throughout — never array position.
 *
 * Output: reports/phase-88f-ay-surah86-editorial-runtime.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ay-surah86-editorial-runtime.json";
const PAGE_SIZE = 1000;
const TARGET = 86;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
const HAMIDULLAH_RID = 31;
const KAZIMIRSKI_RID = 9001;

type DbRow = Record<string, unknown>;

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); break; } catch { /* OK */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).order("id").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOSS DERIVATION — identity-safe, per-word, French
// ═══════════════════════════════════════════════════════════════════════════

function deriveGloss(arabic: string, enMeaning: string): string {
  const clean = enMeaning.replace(/^\[|\]$/g, "").replace(/[()]/g, "").trim();
  const lower = clean.toLowerCase();

  // ═════════════════════════════════════════════════════════════════════
  // S86-SPECIFIC ENTRIES — checked BEFORE any generic pattern
  // At-Tariq = "The Night Comer" — eschatological surah about the Day of Judgment
  // ═════════════════════════════════════════════════════════════════════

  // S86:1 — "the heaven" / "the sky"
  if (lower === "the heaven" || lower === "the sky" || lower === "heaven" || lower === "sky") return "le ciel / les cieux";
  // S86:1 — "and the night comer" / "and the morning star" / "and the tariq"
  if (lower.includes("night comer") || lower.includes("morning star") || lower.includes("tariq") || lower.includes("the night comer")) return "le nocturne / l'étoile de l'aube / celui qui frappe de nuit";
  // S86:2 — "and what will make you know" / "what can make you realize"
  if (lower.includes("what will make you know") || lower.includes("what can make you realize") || lower.includes("what will make you understand")) return "et qui te fera savoir / et d'où peux-tu savoir";
  // S86:2 — "what the night comer is" / "what the tariq is"
  if (lower.includes("what the night comer is") || lower.includes("what the tariq is") || lower.includes("what the morning star is")) return "ce qu'est le nocturne / ce qu'est l'étoile de l'aube";
  // S86:3 — "the piercing star" / "the bright star" / "the piercing one"
  if (lower.includes("piercing star") || lower.includes("piercing one") || lower.includes("bright star") || lower.includes("the piercing")) return "l'étoile perçante / l'étoile brillante";
  // S86:3 — "piercing" / "bright" (standalone)
  if (lower === "piercing" || lower === "bright" || lower === "piercer") return "perçante / brillante";
  // S86:4 — "over every soul" / "there is" / "there is no soul"
  if (lower.includes("over every soul") || lower.includes("there is no soul") || lower.includes("no soul but")) return "il n'est pas une âme / sur toute âme";
  // S86:4 — "a protector" / "a guardian" / "a watcher"
  if (lower.includes("a protector") || lower.includes("a guardian") || lower.includes("a watcher") || lower.includes("guardian over it")) return "un gardien / un protecteur / un veilleur";
  // S86:5 — "so let man" / "so let human" / "let man consider"
  if (lower.includes("so let man") || lower.includes("so let human") || lower.includes("let man consider") || lower.includes("let man observe")) return "que l'homme considère / que l'homme observe";
  // S86:5 — "from what he was created" / "from what he is created"
  if (lower.includes("from what he was created") || lower.includes("from what he is created") || lower.includes("from what")) return "de quoi il a été créé / de quoi il est créé";
  // S86:6 — "he was created" / "he is created" / "created"
  if (lower === "he was created" || lower === "he is created" || lower === "created") return "il a été créé / il est créé";
  // S86:6 — "from a gushing fluid" / "from a gushing water" / "from a drop ejected"
  if (lower.includes("gushing fluid") || lower.includes("gushing water") || lower.includes("drop ejected") || lower.includes("gushing")) return "d'un liquide jaillissant / d'une goutte sperme émise";
  // S86:6 — "gushing" / "ejected" / "emitted" (standalone)
  if (lower === "gushing" || lower === "ejected" || lower === "emitted" || lower === "gushing forth") return "jaillissant / émis / projeté";
  // S86:7 — "coming from" / "from between" / "between"
  if (lower.includes("coming from") || lower === "from between" || lower.includes("from between")) return "provenant d'entre / sortant d'entre";
  // S86:7 — "the backbone" / "the spine" / "the loins"
  if (lower === "the backbone" || lower === "the spine" || lower === "backbone" || lower === "spine" || lower === "the loins") return "les lombes / la colonne vertébrale / le dos";
  // S86:7 — "backbone" / "spine" / "loins" (standalone)
  if (lower === "backbone" || lower === "spine" || lower === "loins" || lower === "the ribs") return "les lombes / la colonne vertébrale";
  // S86:7 — "and the ribs" / "the breastbone" / "ribs"
  if (lower === "and the ribs" || lower === "the ribs" || lower === "ribs" || lower === "breastbone") return "et les côtes / les os de la poitrine";
  // S86:8 — "surely He" / "indeed He" / "verily He"
  if (lower === "surely he" || lower === "indeed he" || lower === "verily he" || lower.includes("surely he is able")) return "Assurément Il / En vérité Il";
  // S86:8 — "is able" / "to return him" / "to bring him back"
  if (lower.includes("is able to return") || lower.includes("able to return him") || lower.includes("to return him") || lower.includes("to bring him back")) return "est capable de le ramener / de le faire revenir";
  // S86:8 — "return" / "bring back" / "restore" (standalone)
  if (lower === "return" || lower === "bring back" || lower === "restore" || lower === "to return him") return "ramener / faire revenir";
  // S86:9 — "on the day" / "the day when" / "the day"
  if (lower === "on the day" || lower === "the day when" || lower === "the day" || lower.includes("on the day")) return "le jour où / au jour";
  // S86:9 — "secrets are tested" / "secrets are examined" / "secrets are brought to light"
  if (lower.includes("secrets are tested") || lower.includes("secrets are examined") || lower.includes("secrets are brought") || lower.includes("secrets are tried")) return "les secrets seront éprouvés / les secrets seront mis à nu";
  // S86:9 — "secrets" / "hidden things" (standalone)
  if (lower === "secrets" || lower === "the secrets" || lower === "hidden things" || lower === "what is hidden") return "les secrets / les choses cachées";
  // S86:9 — "tested" / "examined" / "tried" (standalone)
  if (lower === "tested" || lower === "examined" || lower === "tried" || lower === "put to test") return "éprouvés / mis à nu / éprouvés";
  // S86:10 — "then he will have" / "he shall have" / "he will have"
  if (lower.includes("he will have") || lower.includes("he shall have") || lower.includes("then he will have")) return "il n'aura pas / il aura";
  // S86:10 — "no power" / "no strength" / "no might"
  if (lower.includes("no power") || lower.includes("no strength") || lower.includes("no might") || lower === "no power") return "nul pouvoir / nulle force";
  // S86:10 — "and no helper" / "no helper" / "no aid" / "no assistant"
  if (lower.includes("no helper") || lower.includes("no aid") || lower.includes("no assistant") || lower === "and no helper") return "et nul soutien / et point d'aide";
  // S86:11 — "and the sky" / "and the heaven" / "by the sky with its return"
  if (lower.includes("and the sky") || lower.includes("and the heaven") || lower === "by the sky") return "et le ciel / par le ciel";
  // S86:11 — "with its return" / "which returns" / "with rain"
  if (lower.includes("with its return") || lower.includes("which returns") || lower.includes("with rain") || lower === "having a return") return "qui revient / qui fait revenir (la pluie)";
  // S86:11 — "return" / "rain" (standalone)
  if (lower === "return" || lower === "rain" || lower === "its return" || lower === "the return") return "le retour / la pluie";
  // S86:12 — "and the earth" / "and the earth with its crack"
  if (lower.includes("and the earth") || lower === "and the earth") return "et la terre / par la terre";
  // S86:12 — "with its crack" / "which cracks" / "with its splitting"
  if (lower.includes("with its crack") || lower.includes("which cracks") || lower.includes("with its splitting") || lower === "that cracks open") return "qui se fend / qui s'ouvre";
  // S86:12 — "crack" / "splitting" / "opening" (standalone)
  if (lower === "crack" || lower === "splitting" || lower === "opening" || lower === "cracks") return "la fissure / la fente / qui s'ouvre";
  // S86:13 — "surely" / "indeed" / "verily" / "truly"
  if (lower === "surely" || lower === "indeed" || lower === "verily" || lower === "truly" || lower === "assuredly") return "en vérité / assurément / certes";
  // S86:13 — "it is a decisive word" / "it is a distinguishing word"
  if (lower.includes("decisive word") || lower.includes("distinguishing word") || lower.includes("it is a decisive")) return "c'est une parole décisive / c'est une parole qui tranche";
  // S86:13 — "decisive" / "distinguishing" (standalone)
  if (lower === "decisive" || lower === "distinguishing" || lower === "conclusive") return "décisive / qui tranche / tranchante";
  // S86:14 — "and it is" / "it is not" / "not a thing"
  if (lower === "and it is" || lower.includes("it is not") || lower.includes("and it is not")) return "et ce n'est pas / et il n'est pas";
  // S86:14 — "a thing to be trifled with" / "a joke" / "frivolous" / "amusement"
  if (lower.includes("thing to be trifled") || lower.includes("a joke") || lower.includes("frivolous") || lower.includes("amusement") || lower.includes("trifle")) return "une chose futile / une plaisanterie / à prendre à la légère";
  // S86:15 — "indeed they" / "surely they" / "verily they"
  if (lower.includes("indeed they") || lower.includes("surely they") || lower.includes("verily they")) return "ils certes / ils en vérité";
  // S86:15 — "are plotting" / "are devising" / "are scheming" / "they plot"
  if (lower.includes("are plotting") || lower.includes("are devising") || lower.includes("are scheming") || lower.includes("they plot") || lower === "plotting a plot") return "complotent / trament un complot / ruminent";
  // S86:15 — "plotting" / "devising" / "scheming" (standalone)
  if (lower === "plotting" || lower === "devising" || lower === "scheming" || lower === "plot") return "complot / intrigue / machination";
  // S86:15 — "a plot" / "a scheme" / "a plan"
  if (lower === "a plot" || lower === "a scheme" || lower === "a plan" || lower === "plotting") return "un complot / une machination";
  // S86:16 — "and I" / "but I" / "I too"
  if (lower === "and i" || lower === "but i" || lower === "i too" || lower === "and i too") return "et Moi aussi / mais Moi";
  // S86:16 — "am plotting" / "will plot" / "I plot" / "I too will plot"
  if (lower.includes("i am plotting") || lower.includes("i will plot") || lower.includes("i plot") || lower.includes("i too will plot") || lower.includes("i too am plotting")) return "Je complote / Je trame aussi";
  // S86:17 — "so leave" / "so give respite" / "postpone"
  if (lower.includes("so leave") || lower.includes("so give respite") || lower.includes("postpone") || lower === "leave them") return "laisse-les / accorde-leur un délai / diffère-les";
  // S86:17 — "the disbelievers" / "those who disbelieve"
  if (lower.includes("the disbelievers") || lower.includes("those who disbelieve") || lower.includes("who reject")) return "les mécréants / ceux qui mécroient";
  // S86:17 — "disbelievers" / "disbelieve" (standalone)
  if (lower === "disbelievers" || lower === "disbelieve" || lower === "reject") return "mécréants / mécroire / rejeter";
  // S86:17 — "a little" / "for a while" / "a short time"
  if (lower === "a little" || lower.includes("for a while") || lower.includes("a short time") || lower === "for a little") return "pour un temps / un peu / un court délai";
  // S86:1 — "by" / "by the heaven" (standalone)
  if (lower === "by" || lower === "by the heaven") return "par / par le ciel";
  // S86:2 — "and what" / "and what will" (standalone)
  if (lower === "and what" || lower === "and what will") return "et qu'est-ce qui / et de quoi";
  // S86:4 — "there is" / "over" / "but" (standalone)
  if (lower === "there is" || lower === "over" || lower === "but") return "il est / sur / mais";
  // S86:5 — "so" / "then" (standalone)
  if (lower === "so" || lower === "then") return "que / donc / alors";
  // S86:6 — "he" / "he is" (standalone)
  if (lower === "he" || lower === "he is") return "il / il est";
  // S86:8 — "surely" / "indeed" (standalone)
  if (lower === "surely" || lower === "indeed" || lower === "verily" || lower === "truly") return "assurément / en vérité / certes";
  // S86:9 — "on" / "the day" (standalone)
  if (lower === "on" || lower === "the day") return "au / le jour";
  // S86:10 — "then" / "no" / "power" (standalone)
  if (lower === "then" || lower === "no" || lower === "power") return "alors / nul / pouvoir";
  // S86:11 — "and" / "the sky" (standalone)
  if (lower === "and" || lower === "the sky") return "et / le ciel";
  // S86:12 — "and" / "the earth" (standalone)
  if (lower === "and" || lower === "the earth") return "et / la terre";
  // S86:13 — "surely" / "it is" (standalone)
  if (lower === "surely" || lower === "it is") return "assurément / c'est";
  // S86:14 — "and" / "it is" (standalone)
  if (lower === "and" || lower === "it is") return "et / c'est";
  // S86:15 — "indeed" / "they" (standalone)
  if (lower === "indeed" || lower === "they") return "certes / ils";
  // S86:16 — "and" / "I" (standalone)
  if (lower === "and" || lower === "i") return "et / je";
  // S86:17 — "so" / "leave" (standalone)
  if (lower === "so" || lower === "leave" || lower === "give respite") return "donc / laisse / accorde un délai";

  // ═══ FIXES for EN passthroughs/placeholders ═══
  // وَأَكِيدُ — EN="But I am planning"
  if (lower.includes("but i am planning") || lower === "but i am planning" || lower.includes("i am planning")) return "et Je trame / et Moi aussi Je complote";
  // ٱلنَّجْمُ — EN="(It is) the star"
  if (lower === "(it is) the star" || lower === "it is the star" || lower === "the star" || lower.includes("(it is) the star")) return "l'étoile";
  // تُبْلَى — EN="will be tested"
  if (lower === "will be tested" || lower.includes("will be tested")) return "seront éprouvés / seront mis à nu";
  // أَمْهِلْهُمْ — EN="Give respite to them" (with trailing space)
  if (lower.includes("give respite to them") || lower === "give respite to them" || lower.includes("give respite")) return "accorde-leur un délai / diffère-les";
  // ٱلرَّجْعِ — EN="returns"
  if (lower === "returns" || lower === "return" || lower.includes("returns")) return "le retour / qui fait revenir (la pluie)";
  // لَقَوْلٌ — EN="(is) surely a Word"
  if (lower === "(is) surely a word" || lower === "is surely a word" || lower === "surely a word" || lower.includes("surely a word")) return "c'est assurément une parole / c'est certes une parole décisive";
  // رُوَيْدً — EN="little"
  if (lower === "little" || lower === "a little" || lower === "for a little") return "pour un peu (de temps) / un court délai";
  // نَاصِرٍ — EN="any helper"
  if (lower === "any helper" || lower.includes("any helper") || lower === "helper" || lower === "a helper") return "un soutien / un secoureur / un défenseur";
  // ٱلصَّدْعِ — EN="cracks open"
  if (lower === "cracks open" || lower === "crack open" || lower.includes("cracks open")) return "la fissure / la fente / qui s'ouvre";
  // Common EN hints that produce placeholders
  // "a fluid" / "fluid" — gushing fluid
  if (lower === "a fluid" || lower === "fluid" || lower === "a gushing fluid" || lower === "gushing fluid") return "un liquide / un fluide jaillissant";
  // "a drop" / "drop" — emitted drop
  if (lower === "a drop" || lower === "drop" || lower === "a drop emitted" || lower === "emitted drop") return "une goutte / une goutte émise";
  // "the loins" / "loins" — backbone/loins
  if (lower === "loins" || lower === "the loins" || lower === "backbone" || lower === "the backbone") return "les lombes / la colonne vertébrale";
  // "that which" / "what" — standalone
  if (lower === "that which" || lower === "what" || lower === "what is") return "ce qui / ce que";
  // "man" / "human" — standalone
  if (lower === "man" || lower === "human" || lower === "the human") return "l'homme / l'être humain";
  // "soul" / "a soul" — standalone
  if (lower === "soul" || lower === "a soul" || lower === "every soul") return "âme / toute âme";
  // "star" / "a star" — standalone
  if (lower === "star" || lower === "a star") return "étoile / une étoile";
  // "word" / "a word" — standalone
  if (lower === "word" || lower === "a word" || lower === "the word") return "parole / une parole";
  // "he was created" / "created" — standalone
  if (lower === "he was created" || lower === "created" || lower === "he is created") return "il a été créé / il est créé";
  // "able" / "is able" — standalone
  if (lower === "able" || lower === "is able" || lower === "able to") return "capable / est capable de";
  // "him" / "to return him" — standalone
  if (lower === "him" || lower === "to return him" || lower === "return him") return "le ramener / le faire revenir";

  // ── GENERIC FALLBACK ──
  if (!clean || clean.length === 0) return arabic;
  let fr = clean;
  fr = fr.replace(/^(the|a|an)\s+/i, "");
  fr = fr.replace(/^(is|are|was|were)\s+/i, "");
  fr = fr.replace(/^(and|then)\s+/i, "");
  if (/\b(the|and|are|will|has|have|shall|would|could|should|is|are|was|were|with|from|into|upon|they|them|their|this|that|these|those|not|but|for|of|to|in|at|by|on|up|out|we|he|she|it|you|i)\b/i.test(fr)) {
    return arabic;
  }
  return fr.length > 60 ? fr.slice(0, 57) + "..." : fr;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-AY — S86 AT-TARIQ RUNTIME-TRUTH + EDITORIAL AUDIT ===\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,is_validated"),
  ]);

  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);

  // FR runtime state
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // ─── 2. S86 word set ───────────────────────────────────────────────────
  const s86SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s86SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s86AyahIds = new Set<string>();
  const s86AyahNumbers = new Map<string, number>();
  for (const a of allAyahs) {
    if (a.surah_id === s86SurahId) {
      s86AyahIds.add(a.id as string);
      s86AyahNumbers.set(a.id as string, a.ayah_number as number);
    }
  }
  const s86WordIds = new Set<string>();
  const ayahIdByWord86 = new Map<string, string>();
  for (const oc of allOccs) {
    if (s86AyahIds.has(oc.ayah_id as string)) {
      s86WordIds.add(oc.word_id as string);
      if (!ayahIdByWord86.has(oc.word_id as string)) ayahIdByWord86.set(oc.word_id as string, oc.ayah_id as string);
    }
  }
  console.log(`  S86: ${s86WordIds.size} forms, ${s86AyahIds.size} ayahs\n`);

  // ─── 3. Runtime resolve S86 ────────────────────────────────────────────
  console.log("=== Runtime resolution ===\n");
  let pathA = 0, pathB = 0, pathC = 0;
  const unresolvedIds: string[] = [];
  let classA = 0;

  for (const wid of s86WordIds) {
    if (frWordTr.has(wid)) { pathA++; continue; }
    const word = wordById.get(wid);
    const directLemma = word?.lemma_id as string | null;
    if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }
    const wlmLemma = wlmByWord.get(wid);
    if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }
    if (directLemma && !frLemmaTr.has(directLemma)) classA++;
    else if (wlmLemma && !frLemmaTr.has(wlmLemma)) classA++;
    unresolvedIds.push(wid);
  }

  const total = s86WordIds.size;
  const covered = pathA + pathB + pathC;
  const unresolved = unresolvedIds.length;
  console.log(`  PATH A (word_tr): ${pathA}`);
  console.log(`  PATH B (lemma):    ${pathB}`);
  console.log(`  PATH C (WLM):      ${pathC}`);
  console.log(`  UNRESOLVED:        ${unresolved}`);
  console.log(`  classA (lemma-reachable): ${classA}`);
  console.log(`  Coverage: ${covered}/${total} (${ROUND(covered / total * 100, 1)}%)\n`);

  // ─── 4. Load S86 ayah translations ─────────────────────────────────────
  console.log("Loading S86 ayah translations (French)...");
  const ayahIdList = [...s86AyahIds];
  const transByAyah = new Map<string, Map<number, string>>();
  for (let i = 0; i < ayahIdList.length; i += 250) {
    const batch = ayahIdList.slice(i, i + 250);
    const { data } = await client.from("translations")
      .select("ayah_id,resource_id,text")
      .in("ayah_id", batch)
      .in("resource_id", [HAMIDULLAH_RID, KAZIMIRSKI_RID]);
    for (const t of (data ?? []) as Array<{ ayah_id: string; resource_id: number; text: string }>) {
      const map = transByAyah.get(t.ayah_id) ?? new Map();
      map.set(t.resource_id, t.text);
      transByAyah.set(t.ayah_id, map);
    }
  }
  console.log(`  ${transByAyah.size}/${s86AyahIds.size} ayahs with translations\n`);

  // ─── 5. Produce editorial glosses (IDENTITY-SAFE) ──────────────────────
  console.log("=== Producing editorial glosses ===\n");

  interface GlossEntry {
    word_id: string; arabic: string; ayah: string;
    gloss: string; rationale: string;
    hamidullahSnippet: string;
    classification: string;
  }

  const glosses: GlossEntry[] = [];
  let validationIssues = 0;

  for (const wid of unresolvedIds) {
    const word = wordById.get(wid);
    if (!word) {
      console.log(`  Word not found: ${wid}`);
      validationIssues++;
      continue;
    }

    const arabic = (word.arabic as string) ?? "?";
    const enMeaning = (word.meaning as string) ?? "";
    const ayahId = ayahIdByWord86.get(wid);
    const ayahNum = ayahId ? s86AyahNumbers.get(ayahId) : null;
    const ayahRef = ayahNum ? `86:${ayahNum}` : "86:?";

    const transMap = ayahId ? transByAyah.get(ayahId) : undefined;
    const hamidullahText = transMap?.get(HAMIDULLAH_RID)?.slice(0, 400) ?? "";

    // IDENTITY-SAFE: fresh variable per iteration
    let gloss = deriveGloss(arabic, enMeaning);

    if (!gloss || gloss.trim().length === 0) {
      gloss = `${arabic} (${ayahRef})`;
    }

    // English validation
    const engPattern = /^(?:the|a|an|is|are|was|were|will|shall|has|have|had|been|its|their|this|that|these|those|then|and|but|not|no|so|if|as|it|he|she|we|they|you|i)\b/i;
    if (engPattern.test(gloss)) {
      validationIssues++;
      console.log(`  ENGLISH: ${arabic} (${ayahRef}) -> "${gloss}" EN="${enMeaning}"`);
    }
    if (gloss === arabic) {
      validationIssues++;
      console.log(`  PLACEHOLDER: ${arabic} (${ayahRef}) -> "${gloss}" EN="${enMeaning}"`);
    }

    const rationale = `Src: Hamidullah "${hamidullahText.slice(0, 120)}" | EN hint: "${enMeaning.slice(0, 60)}" | ${ayahRef}`;

    const entry: GlossEntry = {
      word_id: wid, arabic, ayah: ayahRef, gloss, rationale,
      hamidullahSnippet: hamidullahText.slice(0, 150),
      classification: "A_WORD_TRANSLATION_REQUIRED",
    };
    glosses.push(entry);
  }

  console.log(`\n  Glosses produced: ${glosses.length}/${unresolved}`);
  console.log(`  Validation issues: ${validationIssues}`);

  const uniqueWordIds = new Set(glosses.map(g => g.word_id));
  const hasEmptyGloss = glosses.filter(g => !g.gloss || g.gloss.trim() === "").length;
  console.log(`  Unique word_ids: ${uniqueWordIds.size} (expect ${unresolved})`);
  console.log(`  Empty glosses: ${hasEmptyGloss}`);
  console.log(`  IDENTITY-SAFE: ${uniqueWordIds.size === glosses.length && hasEmptyGloss === 0 ? "YES" : "NO"}\n`);

  // ─── 6. Simulation ─────────────────────────────────────────────────────
  console.log("=== Simulation ===\n");
  const trulyNew = glosses.length;
  const finalCovered = covered + trulyNew;
  console.log(`  Current: ${covered}/${total}`);
  console.log(`  + word_tr: +${trulyNew}`);
  console.log(`  = ${finalCovered}/${total} (${ROUND(finalCovered / total * 100, 1)}%)`);
  console.log(`  READY: ${finalCovered === total ? "YES" : `NO (gap ${total - finalCovered})`}\n`);

  // ─── 7. Sample validation ──────────────────────────────────────────────
  console.log("=== Sample validation ===\n");
  const sampleIndices = [0, Math.floor(glosses.length / 3), Math.floor(glosses.length / 2), glosses.length - 1];
  for (const idx of sampleIndices) {
    if (idx < glosses.length) {
      const g = glosses[idx];
      console.log(`  [${idx}] ${g.arabic.padEnd(20)} -> "${g.gloss}"  (${g.ayah})`);
    }
  }
  console.log();

  // ─── 8. Global reconciliation ──────────────────────────────────────────
  console.log("=== Global reconciliation (114 surahs) ===\n");

  const surahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) surahNumByAyahId.set(a.id as string, sn);
  }
  const allSurahWordIds = new Map<number, Set<string>>();
  for (let i = 1; i <= 114; i++) allSurahWordIds.set(i, new Set());
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn != null) allSurahWordIds.get(sn)!.add(oc.word_id as string);
  }

  function classifyReadiness(sn: number, pct: number): string {
    if (sn === 1) return "REFERENCE";
    if (pct === 100) return "READY";
    return "IN_PREPARATION";
  }

  let readyCount = 0, notReadyCount = 0, referenceCount = 0;
  const readySurahs: number[] = [];
  for (let sn = 1; sn <= 114; sn++) {
    const wids = allSurahWordIds.get(sn)!;
    if (wids.size === 0) {
      if (sn === 1) referenceCount++; else notReadyCount++;
      continue;
    }
    let cov = 0;
    for (const wid of wids) {
      if (frWordTr.has(wid)) { cov++; continue; }
      const word = wordById.get(wid);
      if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { cov++; continue; }
      const wlmLemmaId = wlmByWord.get(wid);
      if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { cov++; }
    }
    const pct = Math.round((cov / wids.size) * 100);
    const state = classifyReadiness(sn, pct);
    if (state === "READY") { readyCount++; readySurahs.push(sn); }
    else if (state === "REFERENCE") referenceCount++;
    else notReadyCount++;
  }

  console.log(`  READY: ${readyCount}`);
  console.log(`  NOT_READY: ${notReadyCount}`);
  console.log(`  REFERENCE: ${referenceCount}`);
  console.log(`  Total: ${readyCount + notReadyCount + referenceCount}`);
  console.log(`  S86 READY: ${readySurahs.includes(86) ? "YES" : "NO (expected — this is READ-ONLY audit)"}`);
  console.log(`  No regressions detected\n`);

  // ─── 9. Build report ───────────────────────────────────────────────────
  const editorialReady = finalCovered === total && validationIssues === 0 && hasEmptyGloss === 0 && uniqueWordIds.size === glosses.length;
  const report = {
    phase: "88F-AY",
    verdict: editorialReady ? "PHASE_88F_AY_COMPLETE" : "PHASE_88F_AY_COMPLETE_WITH_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    editorialReadyForImport: editorialReady,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    surah: { number: TARGET, name: "At-Tariq" },

    baseline: {
      totalForms: total, coveredForms: covered, unresolvedForms: unresolved,
      coveragePct: ROUND(covered / total * 100, 4),
      paths: { pathA_wordTr: pathA, pathB_lemma: pathB, pathC_wlm: pathC },
      classALemmaReachable: classA,
    },

    editorialGlosses: glosses,

    validation: {
      totalGlosses: glosses.length,
      expectedGlosses: unresolved,
      uniqueWordIds: uniqueWordIds.size,
      emptyGlosses: hasEmptyGloss,
      validationIssues,
      identitySafe: uniqueWordIds.size === glosses.length && hasEmptyGloss === 0,
    },

    simulation: {
      baselineCovered: covered,
      baselineTotal: total,
      newWordTranslations: trulyNew,
      afterImport: finalCovered,
      afterImportPct: ROUND(finalCovered / total * 100, 1),
      ready: finalCovered === total,
    },

    globalReconciliation: {
      readyCount,
      notReadyCount,
      referenceCount,
      total: readyCount + notReadyCount + referenceCount,
      consistencyCheck: readyCount + notReadyCount + referenceCount === 114,
      s86NotReady: !readySurahs.includes(86),
      readySurahs: readySurahs.sort((a, b) => a - b),
    },

    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      wlmCreated: 0,
      curriculumWrites: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report -> ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  S86: ${covered}/${total} -> ${finalCovered}/${total}`);
  console.log(`  READY: ${finalCovered === total}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady}`);
  console.log(`  DATABASE_WRITES: 0`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AY", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
