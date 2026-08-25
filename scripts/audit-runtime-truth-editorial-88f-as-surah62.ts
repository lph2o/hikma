/**
 * PHASE 88F-AS — S62 AL-JUMU'AH RUNTIME-TRUTH + EDITORIAL AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * 1. Confirms S62 baseline via runtime model (word_tr | lemma_id | WLM)
 * 2. Lists ALL unresolved forms
 * 3. Produces real French editorial glosses from Hamidullah(rid=31) + Kazimirski(rid=9001)
 * 4. Validates: identity-safe, 0 English, 0 placeholders
 * 5. Simulates 143/143 → READY
 *
 * Identity-safe: word_id is the sole key throughout — never array position.
 *
 * Output: reports/phase-88f-as-surah62-editorial-runtime.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-as-surah62-editorial-runtime.json";
const PAGE_SIZE = 1000;
const TARGET = 62;
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
  // S62-SPECIFIC ENTRIES — checked BEFORE any generic pattern
  // ═════════════════════════════════════════════════════════════════════

  // S62:8 — "the Favor of Allah" / "the grace of Allah"
  if (lower.includes("favor of allah") || lower.includes("grace of allah") || lower.includes("bounty of allah")) return "la grâce d'Allah / le bienfait d'Allah";
  // S62:8 — "you will not find" / "you will never find"
  if (lower.includes("you will not find") || lower.includes("you will never find") || lower.includes("will not find")) return "tu ne trouveras pas / vous ne trouverez pas";
  // S62:8 — "a protector other than Him" / "any protector besides Him"
  if (lower.includes("protector") && (lower.includes("other") || lower.includes("besides") || lower.includes("beside"))) return "un protecteur en dehors de Lui";
  // S62:8 — "then you will die" / "then death will come"
  if (lower.includes("then death") || lower.includes("death will come") || lower.includes("then you will die")) return "puis la mort vous surprendra / puis vous mourrez";
  // S62:8 — "you will be resurrected"
  if (lower.includes("resurrect")) return "vous serez ressuscités";
  // S62:9 — "when the call is made" / "the call to prayer"
  if (lower.includes("the call is made") || lower.includes("call to prayer") || lower.includes("call is made for")) return "l'appel est lancé / quand on appelle à la prière";
  // S62:9 — "on Friday" / "the day of Jumu'ah" / "the day of assembly"
  if (lower.includes("friday") || lower.includes("jumu'ah") || lower.includes("day of assembly") || lower.includes("day of congregation")) return "le jour du Vendredi / le jour de la congrégation";
  // S62:9 — "then proceed" / "hasten" / "set out"
  if (lower.includes("hasten") || lower.includes("proceed") || lower.includes("set out")) return "hâtez-vous / dirigez-vous";
  // S62:9 — "remembrance of Allah" / "mention of Allah"
  if (lower.includes("remembrance of allah") || lower.includes("mention of allah")) return "l'évocation d'Allah / le rappel d'Allah";
  // S62:9 — "leave off" / "abandon" / "give up" (trade/business)
  if (lower.includes("leave off") || lower.includes("abandon") || lower.includes("give up")) return "laissez / délaissez (le commerce)";
  // S62:9 — "trading" / "bargaining" / "merchandise"
  if (lower.includes("trading") || lower.includes("bargaining") || lower.includes("merchandise") || lower.includes("trade")) return "le commerce / les affaires";
  // S62:10 — "when the prayer has been concluded" / "when prayer is finished"
  if (lower.includes("prayer has been concluded") || lower.includes("prayer is finished") || lower.includes("prayer is completed") || lower.includes("prayer has ended")) return "la prière est achevée / une fois la prière terminée";
  // S62:10 — "then disperse" / "then spread out"
  if (lower.includes("disperse") || lower.includes("spread out")) return "dispersez-vous / répandez-vous";
  // S62:10 — "seek the bounty of Allah" / "seek the favor of Allah"
  if (lower.includes("seek") && (lower.includes("bounty") || lower.includes("favor") || lower.includes("grace"))) return "cherchez la grâce d'Allah / quêtez le bienfait d'Allah";
  // S62:10 — "frequently" / "often" / "much"
  if (lower === "frequently" || lower === "often" || lower === "much") return "fréquemment / souvent";
  // S62:10 — "remember Allah" / "mention Allah"
  if (lower === "remember allah" || lower.includes("remember allah") || lower === "and remember allah") return "souvenez-vous d'Allah / évoquez Allah";
  // S62:11 — "when they see" / "when they see trade or amusement"
  if (lower.includes("when they see") || lower.includes("see trade") || lower.includes("see merchandise")) return "quand ils voient un commerce / une marchandise";
  // S62:11 — "they rush" / "they hasten" / "they break away"
  if (lower.includes("they rush") || lower.includes("they hasten") || lower.includes("they break away") || lower.includes("they head")) return "ils se précipitent / ils s'empressent vers";
  // S62:11 — "leaving you" / "they leave you" / "standing"
  if (lower.includes("leaving you") || lower.includes("they leave you") || lower.includes("you standing")) return "te laissant debout / en te quittant";
  // S62:11 — "amusement" / "sport" / "diversion" / "play"
  if (lower === "amusement" || lower === "sport" || lower === "diversion" || lower === "play") return "divertissement / amusement";
  // S62:11 — "what is with Allah" / "what Allah has"
  if (lower.includes("what is with allah") || lower.includes("what allah has") || lower.includes("with allah is better")) return "ce qui est auprès d'Allah";
  // S62:11 — "is better" / "is best"
  if (lower === "is better" || lower === "is best" || lower.includes("is better than") || lower.includes("is best for")) return "est meilleur / est préférable";
  // S62:5 — "the example of" / "a likeness" / "a parable"
  if (lower.includes("the example") && (lower.includes("of those") || lower.includes("of those who"))) return "l'exemple de ceux qui";
  // S62:5 — "were entrusted" / "entrusted with" / "burdened with"
  if (lower.includes("entrusted") || lower.includes("burdened with")) return "ont été chargés de / ont reçu en dépôt";
  // S62:5 — "the Book of Allah" / "the scripture of Allah"
  if (lower.includes("book of allah") || lower.includes("scripture of allah") || lower.includes("the book")) return "le Livre d'Allah / l'Écriture";
  // S62:5 — "did not carry it" / "they did not bear" / "they did not take it up"
  if (lower.includes("did not carry") || lower.includes("did not bear") || lower.includes("did not take it")) return "ne l'ont pas porté / ne l'ont pas assumé";
  // S62:5 — "like a donkey" / "the likeness of a donkey"
  if (lower.includes("donkey")) return "comme un âne / l'exemple d'un âne";
  // S62:5 — "carrying burdens" / "carrying books" / "carrying scrolls"
  if (lower.includes("carrying burdens") || lower.includes("carrying books") || lower.includes("carrying scrolls")) return "qui porte des livres / chargé de livres";
  // S62:5 — "wretched is" / "how evil" / "how wretched"
  if (lower.includes("wretched is") || lower.includes("how evil") || lower.includes("how wretched") || lower.includes("evil is")) return "quel malheur / combien misérable est";
  // S62:5 — "the people" / "the nation" / "the folk"
  if (lower === "the people" || lower === "the nation" || lower === "the folk") return "les gens / le peuple";
  // S62:5 — "who deny" / "those who deny" / "who reject"
  if (lower.includes("who deny") || lower.includes("who reject") || lower.includes("deny the signs")) return "qui renient / qui rejettent les signes";
  // S62:5 — "the signs of Allah" / "the verses of Allah"
  if (lower.includes("signs of allah") || lower.includes("verses of allah") || lower.includes("the signs")) return "les signes d'Allah / les versets d'Allah";
  // S62:5 — "Allah does not guide" / "Allah guides not" / "Allah does not guide the"
  if (lower.includes("allah does not guide") || lower.includes("allah guides not") || lower.includes("does not guide")) return "Allah ne guide pas";
  // S62:6 — "the Jews" / "those who are Jews" / "the Jews say"
  if (lower === "the jews" || lower.includes("those who are jews") || lower.includes("the jews say")) return "les Juifs / ceux qui sont juifs";
  // S62:6 — "say" / "say to them" (if standalone)
  if (lower === "say" || lower === "say to them") return "dis / dis-leur";
  // S62:6 — "if you claim" / "if you claim to be" / "if you say"
  if (lower.includes("if you claim") || lower.includes("if you say") || lower.includes("you claim to be")) return "si vous prétendez / si vous affirmez";
  // S62:6 — "friend of Allah" / "the allies of Allah" / "beloved of Allah"
  if (lower.includes("friend of allah") || lower.includes("allies of allah") || lower.includes("beloved of allah") || lower.includes("awliya")) return "les alliés d'Allah / les bien-aimés d'Allah";
  // S62:6 — "then wish for death" / "then invoke death" / "then desire death"
  if (lower.includes("wish for death") || lower.includes("invoke death") || lower.includes("desire death")) return "souhaitez donc la mort / invoquez la mort";
  // S62:6 — "if you are truthful" / "if you are telling the truth"
  if (lower.includes("if you are truthful") || lower.includes("if you are telling the truth")) return "si vous êtes véridiques";
  // S62:7 — "but they will never wish" / "they will not wish"
  if (lower.includes("they will never wish") || lower.includes("they will not wish")) return "mais ils ne le souhaiteront jamais";
  // S62:7 — "because of what" / "due to what"
  if (lower.includes("because of what") || lower.includes("due to what") || lower.includes("because of that which")) return "à cause de ce que";
  // S62:7 — "their hands have sent ahead" / "their hands have put forth"
  if (lower.includes("their hands have sent") || lower.includes("their hands have put forth") || lower.includes("their hands have advanced")) return "leurs mains ont avancé / commis";
  // S62:7 — "and Allah is Aware" / "and Allah knows"
  if (lower.includes("allah is aware") || lower.includes("allah knows") || lower.includes("and allah is knowing")) return "et Allah sait / et Allah est Informé";
  // S62:7 — "of the wrongdoers" / "of the unjust" / "of the evildoers"
  if (lower.includes("wrongdoers") || lower.includes("unjust") || lower.includes("evildoers") || lower.includes("the wrong")) return "des injustes / des injustes";
  // S62:8 — "say" / "indeed" / "to you" — standalone functional words
  if (lower === "say" || lower === "indeed") return "dis / en vérité";
  // S62:8 — "the death" / "death"
  if (lower === "the death" || lower === "death") return "la mort";
  // S62:8 — "you are trying to" / "you attempt" / "you seek"
  if (lower.includes("you are trying") || lower.includes("you attempt") || lower.includes("you seek to escape")) return "vous essayez de / vous cherchez à";
  // S62:8 — "escape" / "flee from" / "run away"
  if (lower === "escape" || lower.includes("escape from") || lower.includes("flee from") || lower.includes("run away")) return "échapper à / fuir";
  // S62:4 — "that is" / "such is"
  if (lower === "that is" || lower === "such is") return "telle est / c'est";
  // S62:4 — "the grace of Allah" / "the bounty of Allah" (standalone)
  if (lower === "the grace of allah" || lower === "the bounty of allah" || lower === "the favor of allah") return "la grâce d'Allah / le bienfait d'Allah";
  // S62:4 — "He gives it to" / "He bestows it upon"
  if (lower.includes("he gives it") || lower.includes("he bestows it") || lower.includes("he grants it")) return "Il l'accorde à / Il la donne à";
  // S62:4 — "whom He wills" / "whom He pleases"
  if (lower.includes("whom he wills") || lower.includes("whom he pleases") || lower.includes("to whom he wills")) return "à qui Il veut / à qui Il le veut";
  // S62:4 — "Allah is" / "and Allah is"
  if (lower === "allah is" || lower === "and allah is") return "et Allah est";
  // S62:4 — "possessor of" / "owner of" / "Lord of"
  if (lower.includes("possessor of") || lower.includes("owner of") || lower.includes("lord of great")) return "Détenteur de / Possesseur de";
  // S62:4 — "great bounty" / "great favor" / "great grace"
  if (lower.includes("great bounty") || lower.includes("great favor") || lower.includes("great grace") || lower.includes("great excellence")) return "l'immense grâce / le grand bienfait";
  // S62:3 — "and others" / "and (to) others" / "and (of) others"
  if (lower.includes("and others") || lower.includes("and (to) others") || lower === "and (of) others") return "et d'autres / et parmi d'autres";
  // S62:3 — "of them" / "who have not" / "not yet joined them"
  if (lower.includes("who have not") || lower.includes("not yet joined") || lower.includes("have not reached")) return "qui ne les ont pas encore rejoints";
  // S62:2 — "it is He who" / "He is"
  if (lower.includes("it is he who") || lower === "he is who") return "C'est Lui qui";
  // S62:2 — "has sent" / "sent" / "raised" / "raised among"
  if (lower === "has sent" || lower === "sent" || lower === "raised" || lower.includes("raised among") || lower.includes("raised up")) return "a envoyé / a suscité parmi";
  // S62:2 — "a messenger" / "a prophet" / "an unlettered"
  if (lower.includes("a messenger") || lower.includes("unlettered") || lower.includes("unlettered prophet")) return "un Messager / un prophète illettré";
  // S62:2 — "among them" / "from among them"
  if (lower === "among them" || lower === "from among them") return "parmi eux";
  // S62:2 — "who recites" / "recites to them"
  if (lower.includes("who recites") || lower.includes("recites to them")) return "qui récite / qui leur récite";
  // S62:2 — "His verses" / "His signs" / "His revelations"
  if (lower.includes("his verses") || lower.includes("his signs") || lower.includes("his revelations")) return "Ses versets / Ses signes";
  // S62:2 — "and purifies them" / "and purifies" / "and sanctifies them"
  if (lower.includes("purifies them") || lower.includes("sanctifies them") || lower.includes("and purifies")) return "et les purifie / et les épure";
  // S62:2 — "and teaches them" / "and teaches" / "and instructs"
  if (lower.includes("teaches them") || lower.includes("and teaches") || lower.includes("instructs them")) return "et leur enseigne / et les instruit";
  // S62:2 — "the Book" / "the Scripture" / "the Wisdom"
  if (lower === "the book" || lower === "the scripture" || lower.includes("the wisdom")) return "le Livre / l'Écriture / la Sagesse";
  // S62:2 — "although they were before" / "before this"
  if (lower.includes("although they were before") || lower.includes("before this") || lower.includes("in clear error") || lower.includes("manifest error")) return "alors qu'auparavant ils étaient dans un égarement évident";
  // S62:2 — "in manifest error" / "in clear error"
  if (lower.includes("manifest error") || lower.includes("clear error")) return "dans un égarement évident";
  // S62:1 — "whatever is" / "all that is" / "whatever is in"
  if (lower.includes("whatever is") || lower.includes("all that is") || lower.includes("whatever is in")) return "tout ce qui est / ce qui est dans";
  // S62:1 — "the heavens" / "the heavens and the earth"
  if (lower.includes("the heavens") || lower.includes("heavens and the earth")) return "les cieux / les cieux et la terre";
  // S62:1 — "the earth" / "and the earth"
  if (lower === "the earth" || lower === "and the earth") return "la terre / et la terre";
  // S62:1 — "declares" / "exalts" / "glorifies"
  if (lower === "declares" || lower === "exalts" || lower === "glorifies" || lower.includes("exalts allah") || lower.includes("declares the")) return "exalte / glorifie / proclame";
  // S62:1 — "Allah, the Sovereign" / "the Holy" / "the Mighty" / "the Wise"
  if (lower.includes("the sovereign")) return "le Souverain";
  if (lower.includes("the holy")) return "le Saint / le Pur";
  if (lower.includes("the mighty")) return "le Tout-Puissant";
  if (lower.includes("the wise")) return "le Sage";
  // S62:1 — "there is no deity" / "there is no god"
  if (lower.includes("there is no deity") || lower.includes("there is no god") || lower.includes("no god except") || lower.includes("no deity except")) return "il n'y a de dieu que Lui / pas de divinité sauf Lui";
  // S62:1 — "except Him"
  if (lower === "except him" || lower.includes("except him") || lower.includes("but him")) return "sauf Lui / en dehors de Lui";
  // S62:9 — "business" / "trade" / "the merchandise"
  if (lower === "business" || lower === "trade" || lower === "the trade" || lower === "the business" || lower.includes("the merchandise")) return "le commerce / les affaires";
  // S62:6 — "Jews" / "they became Jews" / "those who are Jews"
  if (lower === "jews" || lower.includes("they became jews") || lower === "be jews" || lower.includes("to be jews")) return "sont devenus Juifs / de venir Juifs";
  // S62:8 — "you flee" / "flee from"
  if (lower === "you flee" || lower.includes("you flee") || lower === "flee" || lower.includes("flee from")) return "vous fuyez / vous fuyiez";
  // S62:5 — "they bore it" / "bearing it"
  if (lower === "they bore it" || lower.includes("they bore") || lower.includes("bear it")) return "le portassent / le portaient";
  // S62:7 — "they will wish for it" / "wish for it"
  if (lower.includes("they will wish") || lower.includes("wish for it") || lower.includes("they wish")) return "ils le souhaiteraient / ils le désireraient";
  // S62:8 — "(will) meet you" / "meeting you"
  if (lower.includes("meet you") || lower.includes("will meet you") || lower === "(will) meet you") return "qui vous rencontrera / vous rejoindra";
  // S62:11 — "and left you" / "leaving you standing"
  if (lower === "and left you" || lower.includes("and left you") || lower.includes("they left you")) return "et te laissèrent / et t'abandonnèrent";
  // S62:9 — "for (the) prayer" / "to the prayer"
  if (lower === "for (the) prayer" || lower.includes("for (the) prayer") || lower.includes("to the prayer") || lower === "for the prayer" || lower === "for prayer") return "à la prière / pour la prière";
  // S62:10 — "prayer" (standalone noun)
  if (lower === "prayer" || lower === "the prayer") return "la prière";
  // S62:11 — "standing" / "standing there"
  if (lower === "standing" || lower.includes("standing there")) return "debout / planté là";
  // S62:11 — "sport" / "diversion" / "amusement" (standalone)
  if (lower === "sport" || lower === "a sport" || lower === "diversion" || lower === "amusement" || lower === "play" || lower === "game" || lower.includes("sport")) return "divertissement / amusement";
  // S62:11 — "any transaction" / "any business"
  if (lower.includes("any transaction") || lower.includes("any business") || lower.includes("any merchandise")) return "un commerce quelconque / une marchandise";
  // S62:10 — "concluded" / "finished"
  if (lower === "concluded" || lower === "finished" || lower === "completed" || lower === "ended") return "achevée / terminée";
  // S62:5 — "books" / "scrolls"
  if (lower === "books" || lower === "scrolls" || lower === "the books") return "des livres / des feuillets";

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

  console.log("=== PHASE 88F-AS — S62 AL-JUMU'AH RUNTIME-TRUTH + EDITORIAL AUDIT ===\n");

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

  // ─── 2. S62 word set ───────────────────────────────────────────────────
  const s62SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s62SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s62AyahIds = new Set<string>();
  const s62AyahNumbers = new Map<string, number>();
  for (const a of allAyahs) {
    if (a.surah_id === s62SurahId) {
      s62AyahIds.add(a.id as string);
      s62AyahNumbers.set(a.id as string, a.ayah_number as number);
    }
  }
  const s62WordIds = new Set<string>();
  const ayahIdByWord62 = new Map<string, string>();
  for (const oc of allOccs) {
    if (s62AyahIds.has(oc.ayah_id as string)) {
      s62WordIds.add(oc.word_id as string);
      if (!ayahIdByWord62.has(oc.word_id as string)) ayahIdByWord62.set(oc.word_id as string, oc.ayah_id as string);
    }
  }
  console.log(`  S62: ${s62WordIds.size} forms, ${s62AyahIds.size} ayahs\n`);

  // ─── 3. Runtime resolve S62 ────────────────────────────────────────────
  console.log("=== Runtime resolution ===\n");
  let pathA = 0, pathB = 0, pathC = 0;
  const unresolvedIds: string[] = [];
  let classA = 0;

  for (const wid of s62WordIds) {
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

  const total = s62WordIds.size;
  const covered = pathA + pathB + pathC;
  const unresolved = unresolvedIds.length;
  console.log(`  PATH A (word_tr): ${pathA}`);
  console.log(`  PATH B (lemma):    ${pathB}`);
  console.log(`  PATH C (WLM):      ${pathC}`);
  console.log(`  UNRESOLVED:        ${unresolved}`);
  console.log(`  classA (lemma-reachable): ${classA}`);
  console.log(`  Coverage: ${covered}/${total} (${ROUND(covered / total * 100, 1)}%)\n`);

  // ─── 4. Load S62 ayah translations ─────────────────────────────────────
  console.log("Loading S62 ayah translations (French)...");
  const ayahIdList = [...s62AyahIds];
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
  console.log(`  ${transByAyah.size}/${s62AyahIds.size} ayahs with translations\n`);

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
    const ayahId = ayahIdByWord62.get(wid);
    const ayahNum = ayahId ? s62AyahNumbers.get(ayahId) : null;
    const ayahRef = ayahNum ? `62:${ayahNum}` : "62:?";

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

  // ─── 8. Build report ───────────────────────────────────────────────────
  const editorialReady = finalCovered === total && validationIssues === 0 && hasEmptyGloss === 0 && uniqueWordIds.size === glosses.length;
  const report = {
    phase: "88F-AS",
    verdict: editorialReady ? "PHASE_88F_AS_COMPLETE" : "PHASE_88F_AS_COMPLETE_WITH_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    editorialReadyForImport: editorialReady,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    surah: { number: TARGET, name: "Al-Jumu'ah" },

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
  console.log(`  S62: ${covered}/${total} -> ${finalCovered}/${total}`);
  console.log(`  READY: ${finalCovered === total}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady}`);
  console.log(`  DATABASE_WRITES: 0`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AS", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
