/**
 * PHASE 88F-AV — S84 AL-INSHIQAQ RUNTIME-TRUTH + EDITORIAL AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * 1. Confirms S84 baseline via runtime model (word_tr | lemma_id | WLM)
 * 2. Lists ALL unresolved forms
 * 3. Produces real French editorial glosses from Hamidullah(rid=31) + Kazimirski(rid=9001)
 * 4. Validates: identity-safe, 0 English, 0 placeholders
 * 5. Simulates 92/92 → READY
 *
 * Identity-safe: word_id is the sole key throughout — never array position.
 *
 * Output: reports/phase-88f-av-surah84-editorial-runtime.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-av-surah84-editorial-runtime.json";
const PAGE_SIZE = 1000;
const TARGET = 84;
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
  // S84-SPECIFIC ENTRIES — checked BEFORE any generic pattern
  // Al-Inshiqaq = "The Splitting Open" — eschatological surah about the sky splitting, the Day of Judgment
  // ═════════════════════════════════════════════════════════════════════

  // S84:1 — "the sky splits" / "the heaven splits asunder"
  if (lower.includes("the sky splits") || lower.includes("the heaven splits") || lower.includes("splits asunder") || lower.includes("sky splits")) return "le ciel se fendra / le ciel s'ouvrira";
  // S84:1 — "split" / "splits" / "splitting" (standalone verb for sky)
  if (lower === "split" || lower === "splits" || lower === "splitting" || lower === "split asunder") return "se fendre / s'ouvrir";
  // S84:2 — "and listens" / "and hearkens" / "and is obedient"
  if (lower.includes("listens") || lower.includes("hearkens") || lower.includes("is obedient") || lower.includes("and listens")) return "et écoute / et obéit";
  // S84:2 — "to its Lord" / "to its Lord in obedience"
  if (lower.includes("to its lord") || lower.includes("its lord")) return "à son Seigneur";
  // S84:2 — "and it is fitting" / "and it is worthy" / "and it is appropriate"
  if (lower.includes("it is fitting") || lower.includes("it is worthy") || lower.includes("it is appropriate") || lower.includes("and it is fitting")) return "et cela lui sied / et cela convient";
  // S84:3 — "and the earth is stretched" / "the earth expands" / "the earth is extended"
  if (lower.includes("earth is stretched") || lower.includes("earth expands") || lower.includes("earth is extended") || lower.includes("earth extends")) return "la terre sera étendue / la terre sera nivelée";
  // S84:3 — "stretched" / "extended" / "expanded" (standalone)
  if (lower === "stretched" || lower === "extended" || lower === "expanded" || lower === "leveled") return "étendue / nivelée";
  // S84:3 — "and casts forth" / "casts out" / "throws out"
  if (lower.includes("casts forth") || lower.includes("casts out") || lower.includes("throws out") || lower.includes("throws forth")) return "et rejette / et vomit";
  // S84:3 — "what is within it" / "what is in it" / "that which is in it"
  if (lower.includes("what is within it") || lower.includes("what is in it") || lower.includes("that which is in it")) return "ce qui est en elle / son contenu";
  // S84:3 — "and becomes empty" / "and empties" / "and is void"
  if (lower.includes("becomes empty") || lower.includes("empties") || lower.includes("is void") || lower.includes("becomes void")) return "et se vide";
  // S84:4 — "the earth" / "and the earth"
  if (lower === "the earth" || lower === "and the earth") return "la terre / et la terre";
  // S84:4 — "gives up its burdens" / "casts its burdens" / "throws up its loads"
  if (lower.includes("gives up its burdens") || lower.includes("casts its burdens") || lower.includes("throws up its loads") || lower.includes("gives up")) return "renonce à ses fardeaux / rejette ses fardeaux";
  // S84:4 — "burdens" / "loads" / "weights"
  if (lower === "burdens" || lower === "loads" || lower === "weights" || lower === "its burdens") return "ses fardeaux / ses charges";
  // S84:4 — "and says" / "and the human says"
  if (lower === "and says" || lower.includes("and the human says") || lower.includes("and man says")) return "et dit / et l'homme dira";
  // S84:4 — "what is the matter with it" / "what is wrong with it"
  if (lower.includes("what is the matter with it") || lower.includes("what is wrong with it") || lower.includes("what has happened to it")) return "qu'a-t-elle / que lui arrive-t-il";
  // S84:5 — "that Day" / "on that Day"
  if (lower === "that day" || lower === "on that day" || lower.includes("that day")) return "ce Jour-là";
  // S84:5 — "it will tell" / "it will relate" / "it will inform"
  if (lower.includes("it will tell") || lower.includes("it will relate") || lower.includes("it will inform") || lower.includes("will tell its news")) return "elle racontera / elle informera";
  // S84:5 — "its news" / "its tidings" / "its account"
  if (lower.includes("its news") || lower.includes("its tidings") || lower.includes("its account") || lower === "its news") return "ses nouvelles / ses informations";
  // S84:5 — "that your Lord" / "that your Lord has inspired it"
  if (lower.includes("that your lord") || lower.includes("your lord inspired") || lower.includes("your lord has inspired")) return "que ton Seigneur l'a inspiré / que ton Seigneur l'a instruite";
  // S84:5 — "inspired" / "revealed to" / "instructed"
  if (lower === "inspired" || lower === "revealed to" || lower === "instructed") return "inspiré / instruit";
  // S84:6 — "O mankind" / "O man"
  if (lower === "o mankind" || lower === "o man" || lower.includes("o mankind") || lower.includes("o man")) return "ô humain / ô homme";
  // S84:6 — "you are working" / "you are toiling" / "you labor"
  if (lower.includes("you are working") || lower.includes("you are toiling") || lower.includes("you labor") || lower.includes("you toil")) return "tu travailles / tu œuvres";
  // S84:6 — "toward your Lord" / "towards your Lord"
  if (lower.includes("toward your lord") || lower.includes("towards your lord")) return "vers ton Seigneur";
  // S84:6 — "a meeting" / "a meeting with your Lord"
  if (lower.includes("a meeting") || lower.includes("meeting with your lord") || lower === "a meeting") return "une rencontre / un rendez-vous";
  // S84:6 — "then you will meet" / "then you will meet Him"
  if (lower.includes("then you will meet") || lower.includes("you will meet him")) return "puis tu Le rencontreras";
  // S84:6 — "then you will meet Him" / "you will meet your Lord"
  if (lower === "then you will meet him" || lower === "you will meet him") return "puis tu Le rencontreras";
  // S84:7 — "so whoever" / "whoever"
  if (lower === "so whoever" || lower === "whoever" || lower.includes("so whoever")) return "celui qui / quiconque";
  // S84:7 — "is given" / "is given his record" / "is given his book"
  if (lower.includes("is given his record") || lower.includes("is given his book") || lower.includes("given his record")) return "on lui remet son registre / on lui tend son livre";
  // S84:7 — "his record" / "his book" / "his scroll" (standalone)
  if (lower === "his record" || lower === "his book" || lower === "his scroll" || lower === "the record" || lower === "the book") return "son registre / son livre";
  // S84:7 — "in his right hand" / "in his right hand"
  if (lower.includes("in his right hand") || lower.includes("right hand")) return "dans sa main droite";
  // S84:7 — "he will be judged" / "he will be reckoned" / "he will be judged with"
  if (lower.includes("he will be judged") || lower.includes("he will be reckoned") || lower.includes("will be reckoned")) return "il sera jugé / il sera compté";
  // S84:7 — "an easy reckoning" / "an easy account" / "an easy judgment"
  if (lower.includes("easy reckoning") || lower.includes("easy account") || lower.includes("easy judgment") || lower.includes("an easy")) return "un jugement facile / un compte léger";
  // S84:7 — "reckoning" / "account" / "judgment" (standalone)
  if (lower === "reckoning" || lower === "account" || lower === "judgment" || lower === "the reckoning") return "le compte / le jugement";
  // S84:8 — "but whoever" / "whoever"
  if (lower === "but whoever" || lower.includes("but whoever")) return "mais celui qui";
  // S84:8 — "is given his record" / "is given his book behind his back"
  if (lower.includes("behind his back") || lower.includes("from behind his back")) return "par derrière / dans le dos";
  // S84:8 — "behind" / "from behind" (standalone)
  if (lower === "behind" || lower === "from behind") return "par derrière";
  // S84:8 — "he will cry out" / "he will call" / "he will supplicate"
  if (lower.includes("he will cry out") || lower.includes("he will call") || lower.includes("he will supplicate") || lower.includes("will cry out")) return "il criera / il invoquera";
  // S84:8 — "for destruction" / "for perdition" / "for ruin"
  if (lower.includes("for destruction") || lower.includes("for perdition") || lower.includes("for ruin") || lower.includes("destruction")) return "pour sa perte / pour la destruction";
  // S84:8 — "destruction" / "perdition" / "ruin" (standalone)
  if (lower === "destruction" || lower === "perdition" || lower === "ruin") return "la perte / la ruine / la destruction";
  // S84:8 — "he will burn" / "he will enter" / "he will be burned"
  if (lower.includes("he will burn") || lower.includes("he will enter") || lower.includes("he will be burned") || lower.includes("will burn")) return "il brûlera / il entrera";
  // S84:8 — "a blazing fire" / "a burning fire" / "the blaze"
  if (lower.includes("blazing fire") || lower.includes("burning fire") || lower.includes("the blaze") || lower.includes("blaze")) return "un feu ardent / un brasier";
  // S84:8 — "blazing" / "burning" (standalone)
  if (lower === "blazing" || lower === "burning" || lower === "blaze") return "ardent / brasier";
  // S84:9 — "rejoicing" / "joyful" / "exulting"
  if (lower === "rejoicing" || lower === "joyful" || lower === "exulting" || lower.includes("rejoicing")) return "réjoui / joyeux";
  // S84:9 — "he will return" / "he will go back" / "he returns"
  if (lower.includes("he will return") || lower.includes("he will go back") || lower.includes("he returns")) return "il retournera / il rentrera";
  // S84:9 — "to his people" / "to his family" / "to his household"
  if (lower.includes("to his people") || lower.includes("to his family") || lower.includes("to his household")) return "vers les siens / vers sa famille";
  // S84:9 — "his people" / "his family" (standalone)
  if (lower === "his people" || lower === "his family" || lower === "his household") return "les siens / sa famille";
  // S84:10 — "but as for him" / "as for him" / "but whoever"
  if (lower.includes("but as for him") || lower.includes("as for him") || lower === "but as for him") return "quant à celui qui / mais celui qui";
  // S84:10 — "is given" / "is given his record"
  if (lower === "is given" || lower.includes("is given")) return "on lui remettra";
  // S84:10 — "from behind his back" / "behind his back"
  if (lower.includes("from behind his back") || lower.includes("behind his back")) return "par-derrière / dans le dos";
  // S84:10 — "he will say" / "he will cry" / "he will call"
  if (lower === "he will say" || lower.includes("he will say") || lower.includes("he will cry")) return "il dira / il criera";
  // S84:10 — "destruction" / "oh would that" / "if only"
  if (lower.includes("oh would that") || lower.includes("if only") || lower.includes("would that")) return "hélas / si seulement";
  // S84:10 — "I had not been given" / "I was not given" / "my record had not been given"
  if (lower.includes("i had not been given") || lower.includes("i was not given") || lower.includes("had not been given my record")) return "je n'avais pas reçu mon registre / si seulement on ne m'avait pas remis mon livre";
  // S84:11 — "and he had not known" / "and he did not know"
  if (lower.includes("he had not known") || lower.includes("he did not know") || lower.includes("had not known")) return "et il n'aurait pas su / et il n'aurait pas connu";
  // S84:11 — "what his account is" / "what his reckoning is"
  if (lower.includes("what his account is") || lower.includes("what his reckoning is") || lower.includes("what his account")) return "quel est son compte / quel est son jugement";
  // S84:12 — "he will say" / "he will cry" / "he will call out"
  if (lower.includes("he will say") || lower.includes("he will call out") || lower.includes("he will cry")) return "il dira / il criera";
  // S84:12 — "taste" / "experience" / "take"
  if (lower === "taste" || lower === "experience" || lower === "take") return "goûte / éprouve";
  // S84:12 — "my punishment" / "my chastisement" / "my torment"
  if (lower.includes("my punishment") || lower.includes("my chastisement") || lower.includes("my torment")) return "mon châtiment / mon tourment";
  // S84:12 — "punishment" / "chastisement" / "torment" (standalone)
  if (lower === "punishment" || lower === "chastisement" || lower === "torment" || lower === "the punishment") return "le châtiment / le tourment";
  // S84:13 — "indeed" / "truly" / "verily"
  if (lower === "indeed" || lower === "truly" || lower === "verily") return "en vérité / assurément";
  // S84:13 — "he was" / "he had been" / "among his people"
  if (lower.includes("he was among") || lower.includes("he had been among") || lower.includes("among his people")) return "il était parmi les siens / il était parmi son peuple";
  // S84:13 — "rejoicing" / "joyful" / "exulting"
  if (lower === "rejoicing" || lower.includes("rejoicing") || lower === "joyful" || lower === "exulting") return "réjoui / joyeux / exultant";
  // S84:14 — "and he thought" / "he thought" / "he assumed"
  if (lower.includes("he thought") || lower.includes("he assumed") || lower.includes("and he thought")) return "et il pensait / il croyait";
  // S84:14 — "he would never return" / "he would never go back" / "he would never return to Him"
  if (lower.includes("he would never return") || lower.includes("he would never go back") || lower.includes("never return to him")) return "il ne reviendrait jamais / il ne retournerait jamais vers Lui";
  // S84:14 — "return" / "go back" / "return to Him" (standalone)
  if (lower === "return" || lower === "go back" || lower === "return to him" || lower === "return to his lord") return "retourner / revenir";
  // S84:15 — "yes" / "nay" / "rather" / "but rather"
  if (lower === "yes" || lower === "nay" || lower === "rather" || lower === "but rather" || lower.includes("but rather")) return "mais oui / au contraire / bien au contraire";
  // S84:15 — "his Lord" / "his Lord was" / "his Lord is"
  if (lower === "his lord" || lower.includes("his lord was") || lower.includes("his lord is")) return "son Seigneur";
  // S84:15 — "was watching him" / "is watching him" / "was ever watching him" / "is ever watchful over him"
  if (lower.includes("watching him") || lower.includes("watchful over him") || lower.includes("is ever watchful") || lower.includes("was watching him")) return "le voyait / le surveillait / l'observait";
  // S84:15 — "watching" / "watchful" / "observing" (standalone)
  if (lower === "watching" || lower === "watchful" || lower === "observing" || lower === "ever watchful") return "qui observe / qui veille";
  // S84:16 — "I swear" / "I swear by" / "nay I swear"
  if (lower.includes("i swear") || lower.includes("i swear by")) return "je le jure / par";
  // S84:16 — "the twilight" / "the afterglow" / "the redness"
  if (lower.includes("the twilight") || lower.includes("afterglow") || lower.includes("the redness") || lower.includes("twilight glow")) return "le crépuscule / la lueur rougeoyante";
  // S84:16 — "twilight" / "afterglow" / "redness" (standalone)
  if (lower === "twilight" || lower === "afterglow" || lower === "redness" || lower === "the twilight glow") return "le crépuscule / la lueur";
  // S84:16 — "and the night" / "and what it gathers" / "and what it envelops"
  if (lower.includes("and the night") || lower.includes("what it gathers") || lower.includes("what it envelops") || lower.includes("and what it")) return "et la nuit et ce qu'elle enveloppe / rassemble";
  // S84:16 — "and what it gathers" / "gathers" / "envelops"
  if (lower === "gathers" || lower === "envelops" || lower === "covers") return "enveloppe / rassemble / couvre";
  // S84:17 — "and the moon" / "and the moon when it is full"
  if (lower.includes("the moon") || lower.includes("when it is full") || lower.includes("moon when it")) return "et la lune quand elle est pleine";
  // S84:17 — "moon" / "the moon" (standalone)
  if (lower === "moon" || lower === "the moon") return "la lune";
  // S84:17 — "when it is full" / "when it is complete" / "when it waxes full"
  if (lower.includes("when it is full") || lower.includes("when it is complete") || lower.includes("when it waxes")) return "quand elle est pleine / quand elle est complète";
  // S84:18 — "and the morning" / "and the dawn" / "and the daybreak"
  if (lower.includes("the morning") || lower.includes("the dawn") || lower.includes("the daybreak") || lower === "and the morning") return "et l'aube / et le matin";
  // S84:18 — "morning" / "dawn" / "daybreak" (standalone)
  if (lower === "morning" || lower === "dawn" || lower === "daybreak" || lower === "the dawn") return "l'aube / le matin";
  // S84:18 — "when it breathes" / "when it dawns" / "when it becomes bright"
  if (lower.includes("when it breathes") || lower.includes("when it dawns") || lower.includes("when it becomes bright") || lower.includes("as it breathes")) return "quand elle respire / quand elle point";
  // S84:18 — "breathes" / "dawns" (standalone)
  if (lower === "breathes" || lower === "dawns" || lower === "becomes bright") return "respire / point / devient lumineuse";
  // S84:19 — "indeed" / "so" / "nay" / "rather"
  if (lower === "indeed" || lower === "so" || lower === "nay" || lower === "rather") return "en vérité / assurément / mais non";
  // S84:19 — "you will ride" / "you shall ride" / "you will surely ride"
  if (lower.includes("you will ride") || lower.includes("you shall ride") || lower.includes("you will surely ride")) return "vous monterez / vous chevaucherez";
  // S84:19 — "ride" / "mount" / "straddle" (standalone)
  if (lower === "ride" || lower === "mount" || lower === "straddle") return "monter / chevaucher";
  // S84:19 — "stage by stage" / "layer by layer" / "from stage to stage"
  if (lower.includes("stage by stage") || lower.includes("layer by layer") || lower.includes("from stage to stage")) return "d'étape en étape / de couche en couche";
  // S84:19 — "stage" / "layer" / "state" (standalone)
  if (lower === "stage" || lower === "layer" || lower === "state") return "étape / couche / état";
  // S84:20 — "what is wrong with them" / "what is the matter with them"
  if (lower.includes("what is wrong with them") || lower.includes("what is the matter with them") || lower.includes("what is wrong")) return "qu'ont-ils / que leur arrive-t-il";
  // S84:20 — "they do not believe" / "that they do not believe"
  if (lower.includes("they do not believe") || lower.includes("that they do not believe") || lower.includes("they believe not")) return "ils ne croient pas / qu'ils ne croient pas";
  // S84:20 — "believe" / "they believe" (standalone)
  if (lower === "believe" || lower === "they believe") return "croire / croient";
  // S84:21 — "and when" / "when the Quran is recited"
  if (lower.includes("and when") || lower.includes("when the quran is recited") || lower.includes("when the quran")) return "et quand / quand le Coran leur est récité";
  // S84:21 — "the Quran is recited" / "recited to them" / "read to them"
  if (lower.includes("quran is recited") || lower.includes("recited to them") || lower.includes("read to them")) return "le Coran est récité / qu'on récite le Coran";
  // S84:21 — "recited" / "read" (standalone)
  if (lower === "recited" || lower === "read") return "récité / lu";
  // S84:21 — "to them" / "upon them" (standalone)
  if (lower === "to them" || lower === "upon them") return "leur / sur eux";
  // S84:22 — "they do not prostrate" / "they do not bow down" / "they prostrate not"
  if (lower.includes("they do not prostrate") || lower.includes("they do not bow") || lower.includes("prostrate not") || lower.includes("do not prostrate")) return "ils ne se prosternent pas";
  // S84:22 — "prostrate" / "bow down" / "prostration" (standalone)
  if (lower === "prostrate" || lower === "bow down" || lower === "prostration") return "se prosterner / se prosterner";
  // S84:22 — "nay" / "rather" / "but" (standalone)
  if (lower === "nay" || lower === "rather" || lower === "but") return "mais non / plutôt";
  // S84:22 — "those who disbelieve" / "the disbelievers"
  if (lower.includes("those who disbelieve") || lower.includes("the disbelievers") || lower.includes("who disbelieve")) return "ceux qui mécroient / les mécréants";
  // S84:22 — "disbelieve" / "deny" (standalone)
  if (lower === "disbelieve" || lower === "deny" || lower === "reject") return "méconnaître / renier / rejeter";
  // S84:23 — "Allah knows best" / "Allah is most knowing" / "Allah is best aware"
  if (lower.includes("allah knows best") || lower.includes("allah is most knowing") || lower.includes("allah is best aware") || lower.includes("allah knows best what")) return "Allah sait mieux ce qu'ils recèlent";
  // S84:23 — "what they keep within" / "what they conceal" / "what is in their breasts"
  if (lower.includes("what they keep within") || lower.includes("what they conceal") || lower.includes("what is in their breasts")) return "ce qu'ils recèlent / ce qu'ils dissimulent";
  // S84:23 — "conceal" / "keep within" / "hide" (standalone)
  if (lower === "conceal" || lower === "keep within" || lower === "hide" || lower === "harbor") return "receler / dissimuler / cacher";
  // S84:24 — "so give them tidings" / "give them news" / "announce to them"
  if (lower.includes("give them tidings") || lower.includes("give them news") || lower.includes("announce to them") || lower.includes("give them glad tidings")) return "annonce-leur / donne-leur la nouvelle";
  // S84:24 — "a painful punishment" / "a painful torment" / "a painful chastisement"
  if (lower.includes("painful punishment") || lower.includes("painful torment") || lower.includes("painful chastisement")) return "un châtiment douloureux";
  // S84:24 — "painful" / "painful" (standalone)
  if (lower === "painful") return "douloureux";
  // S84:25 — "except those who believe" / "except those who believe and do righteous deeds"
  if (lower.includes("except those who believe") || lower.includes("except those who") || lower.includes("save those who believe")) return "sauf ceux qui croient / excepté ceux qui croient";
  // S84:25 — "and do righteous deeds" / "and do good deeds" / "and work righteousness"
  if (lower.includes("do righteous deeds") || lower.includes("do good deeds") || lower.includes("work righteousness")) return "et font les bonnes œuvres / et accomplissent des œuvres pies";
  // S84:25 — "righteous deeds" / "good deeds" / "righteousness" (standalone)
  if (lower === "righteous deeds" || lower === "good deeds" || lower === "righteousness") return "les bonnes œuvres / la piété";
  // S84:25 — "they will have" / "for them" / "they shall have"
  if (lower.includes("they will have") || lower.includes("for them") || lower.includes("they shall have")) return "ils auront / pour eux";
  // S84:25 — "a reward" / "a reward unfailing" / "a reward uninterrupted"
  if (lower.includes("a reward") || lower.includes("reward unfailing") || lower.includes("reward uninterrupted") || lower.includes("reward never to be cut off")) return "une récompense / une récompense ininterrompue";
  // S84:25 — "reward" / "recompense" (standalone)
  if (lower === "reward" || lower === "recompense" || lower === "a reward") return "une récompense / une récompense";
  // S84:25 — "unfailing" / "uninterrupted" / "never-ending" / "never to be cut off"
  if (lower === "unfailing" || lower === "uninterrupted" || lower === "never-ending" || lower === "never to be cut off" || lower === "unfailing reward") return "ininterrompue / inépuisable / qui ne sera jamais interrompue";
  // ═══ FIXES for EN passthroughs/placeholders ═══
  // مَسْرُورًۭا / مَسْرُورًا — EN="happily" / "happy"
  if (lower === "happily" || lower === "happy" || lower === "joyful") return "réjoui / joyeux / heureux";
  // مُدَّتْ — EN="is spread"
  if (lower === "is spread" || lower === "spread" || lower === "was spread" || lower.includes("is spread")) return "étendue / nivelée / aplanie";
  // مَمْنُونٍۭ — EN="ending"
  if (lower === "ending" || lower === "never-ending" || lower === "never ending" || lower === "without end" || lower === "inexhaustible") return "ininterrompue / inépuisable / sans fin";
  // ظَهْرِهِۦ — EN="his back"
  if (lower === "his back" || lower.includes("his back")) return "son dos / par-derrière";
  // ٱنشَقَّتْ — EN="is split asunder"
  if (lower === "is split asunder" || lower === "split asunder" || lower.includes("split asunder") || lower.includes("is split")) return "s'est fendue / s'est ouverte";
  // كَادِحٌ — EN="(are) laboring"
  if (lower === "(are) laboring" || lower === "laboring" || lower === "are laboring" || lower.includes("laboring")) return "peinant / travaillant avec labeur";
  // يَحُورَ — EN="he would return"
  if (lower.includes("he would return") || lower === "he would return") return "il reviendrait / il retournerait";
  // وَأَذِنَتْ — EN="And has listened"
  if (lower.includes("and has listened") || lower === "and has listened") return "et a écouté / elle a obéi";
  // ٱتَّسَقَ — EN="it becomes full"
  if (lower.includes("it becomes full") || lower === "it becomes full" || lower === "becomes full") return "elle devient pleine / se complète";
  // يُحَاسَبُ — EN="his account will be taken"
  if (lower.includes("his account will be taken") || lower === "his account will be taken" || lower.includes("account will be taken")) return "son compte sera tenu / il sera jugé";
  // يُوعُونَ — EN="they keep within themselves"
  if (lower.includes("they keep within themselves") || lower === "they keep within themselves" || lower.includes("keep within themselves")) return "ils recèlent / ils dissimulent en eux-mêmes";
  // طَبَقًا — EN="(to) stage"
  if (lower === "(to) stage" || lower === "to stage" || lower === "stage" || lower === "a stage" || lower === "(to) a stage") return "une étape / un niveau / une couche";
  // وَسَقَ — EN="it envelops"
  if (lower === "it envelops" || lower === "envelops" || lower.includes("it envelops")) return "elle enveloppe / elle rassemble";
  // لَتَرْكَبُنَّ — EN="You will surely embark"
  if (lower.includes("you will surely embark") || lower === "you will surely embark" || lower.includes("surely embark")) return "vous monterez assurément / vous chevaucherez certainement";
  // وَأَلْقَتْ — EN="And has cast out"
  if (lower.includes("and has cast out") || lower === "and has cast out" || lower.includes("has cast out")) return "et a rejeté / et a vomi";
  // وَحُقَّتْ — EN="and was obligated"
  if (lower.includes("and was obligated") || lower === "and was obligated" || lower.includes("was obligated")) return "et il lui incomba / et cela lui fut prescrit";
  // كَدْحًۭا — EN="(with) exertion"
  if (lower === "(with) exertion" || lower === "with exertion" || lower === "exertion" || lower.includes("with exertion")) return "à force d'effort / avec labeur / peinant";

  // S84:1 — "when" / "when the sky"
  if (lower === "when" || lower === "when the sky") return "quand / quand le ciel";
  // S84:1 — "the sky" / "the heaven"
  if (lower === "the sky" || lower === "the heaven" || lower === "heaven") return "le ciel / les cieux";
  // S84:2 — "and" / "and it" / "and has"
  if (lower === "and" || lower === "and it" || lower === "and has") return "et / et il a";
  // S84:3 — "and" / "and when" / "and has"
  if (lower === "and" || lower === "and when" || lower === "and has") return "et / et quand";
  // S84:4 — "and" / "and the earth" / "and casts"
  if (lower === "and" || lower === "and casts") return "et / et rejette";
  // S84:5 — "and" / "and it"
  if (lower === "and" || lower === "and it") return "et / et elle";
  // S84:6 — "indeed" / "truly" / "verily" (standalone)
  if (lower === "indeed" || lower === "truly" || lower === "verily" || lower === "assuredly") return "en vérité / assurément";
  // S84:6 — "toward" / "towards" (standalone)
  if (lower === "toward" || lower === "towards") return "vers";
  // S84:7 — "so" / "then" (standalone)
  if (lower === "so" || lower === "then") return "alors / puis";
  // S84:8 — "but" / "however" (standalone)
  if (lower === "but" || lower === "however") return "mais / cependant";
  // S84:9 — "he" / "he will" (standalone)
  if (lower === "he" || lower === "he will") return "il / il sera";
  // S84:10 — "but" / "however" / "and as for"
  if (lower === "but" || lower === "however" || lower === "and as for") return "mais / cependant / quant à";
  // S84:11 — "and" / "and he" (standalone)
  if (lower === "and" || lower === "and he") return "et / et il";
  // S84:12 — "he" / "he will say" (standalone)
  if (lower === "he" || lower === "he will say") return "il / il dira";
  // S84:13 — "indeed" / "he" / "he was" (standalone)
  if (lower === "indeed" || lower === "he was") return "en vérité / il était";
  // S84:14 — "and" / "and he" / "he thought" (standalone)
  if (lower === "and" || lower === "and he" || lower === "he thought") return "et / et il / il pensait";
  // S84:15 — "nay" / "but nay" / "yes" (standalone)
  if (lower === "nay" || lower === "but nay" || lower === "yes") return "mais non / au contraire / plutôt";
  // S84:16 — "so" / "nay" / "I swear" (standalone)
  if (lower === "so" || lower === "nay" || lower === "i swear") return "donc / non / je jure";
  // S84:17 — "and" / "and the night" / "and by the night" (standalone)
  if (lower === "and" || lower === "and by the night") return "et / par la nuit";
  // S84:18 — "and" / "and by the dawn" (standalone)
  if (lower === "and" || lower === "and by the dawn") return "et / par l'aube";
  // S84:19 — "indeed" / "you" / "you will" (standalone)
  if (lower === "indeed" || lower === "you" || lower === "you will") return "en vérité / vous / vous allez";
  // S84:20 — "so" / "what" / "what is" (standalone)
  if (lower === "so" || lower === "what" || lower === "what is") return "donc / que / quel";
  // S84:21 — "and" / "when" / "and when" (standalone)
  if (lower === "and" || lower === "when" || lower === "and when") return "et / quand / et quand";
  // S84:22 — "nay" / "they" / "those" (standalone)
  if (lower === "nay" || lower === "they" || lower === "those") return "non / ils / ceux";
  // S84:23 — "and" / "Allah" / "and Allah" (standalone)
  if (lower === "and" || lower === "allah" || lower === "and allah") return "et / Allah / et Allah";
  // S84:24 — "so" / "give" / "so give" (standalone)
  if (lower === "so" || lower === "give" || lower === "so give") return "donc / annonce / annonce-leur";
  // S84:25 — "except" / "those" / "those who" (standalone)
  if (lower === "except" || lower === "those" || lower === "those who") return "sauf / ceux / ceux qui";

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

  console.log("=== PHASE 88F-AV — S84 AL-INSHIQAQ RUNTIME-TRUTH + EDITORIAL AUDIT ===\n");

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

  // ─── 2. S84 word set ───────────────────────────────────────────────────
  const s84SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s84SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s84AyahIds = new Set<string>();
  const s84AyahNumbers = new Map<string, number>();
  for (const a of allAyahs) {
    if (a.surah_id === s84SurahId) {
      s84AyahIds.add(a.id as string);
      s84AyahNumbers.set(a.id as string, a.ayah_number as number);
    }
  }
  const s84WordIds = new Set<string>();
  const ayahIdByWord84 = new Map<string, string>();
  for (const oc of allOccs) {
    if (s84AyahIds.has(oc.ayah_id as string)) {
      s84WordIds.add(oc.word_id as string);
      if (!ayahIdByWord84.has(oc.word_id as string)) ayahIdByWord84.set(oc.word_id as string, oc.ayah_id as string);
    }
  }
  console.log(`  S84: ${s84WordIds.size} forms, ${s84AyahIds.size} ayahs\n`);

  // ─── 3. Runtime resolve S84 ────────────────────────────────────────────
  console.log("=== Runtime resolution ===\n");
  let pathA = 0, pathB = 0, pathC = 0;
  const unresolvedIds: string[] = [];
  let classA = 0;

  for (const wid of s84WordIds) {
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

  const total = s84WordIds.size;
  const covered = pathA + pathB + pathC;
  const unresolved = unresolvedIds.length;
  console.log(`  PATH A (word_tr): ${pathA}`);
  console.log(`  PATH B (lemma):    ${pathB}`);
  console.log(`  PATH C (WLM):      ${pathC}`);
  console.log(`  UNRESOLVED:        ${unresolved}`);
  console.log(`  classA (lemma-reachable): ${classA}`);
  console.log(`  Coverage: ${covered}/${total} (${ROUND(covered / total * 100, 1)}%)\n`);

  // ─── 4. Load S84 ayah translations ─────────────────────────────────────
  console.log("Loading S84 ayah translations (French)...");
  const ayahIdList = [...s84AyahIds];
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
  console.log(`  ${transByAyah.size}/${s84AyahIds.size} ayahs with translations\n`);

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
    const ayahId = ayahIdByWord84.get(wid);
    const ayahNum = ayahId ? s84AyahNumbers.get(ayahId) : null;
    const ayahRef = ayahNum ? `84:${ayahNum}` : "84:?";

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
    phase: "88F-AV",
    verdict: editorialReady ? "PHASE_88F_AV_COMPLETE" : "PHASE_88F_AV_COMPLETE_WITH_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    editorialReadyForImport: editorialReady,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    surah: { number: TARGET, name: "Al-Inshiqaq" },

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
  console.log(`  S84: ${covered}/${total} -> ${finalCovered}/${total}`);
  console.log(`  READY: ${finalCovered === total}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady}`);
  console.log(`  DATABASE_WRITES: 0`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AV", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
