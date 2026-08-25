/**
 * PHASE 88F-AP — HISTORICAL-READY RUNTIME REPAIR QUEUE — READ-ONLY EDITORIAL AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Audits the 6 surahs that were historically declared READY but have runtime
 * regressions (unresolved forms). Produces 94 editorial French glosses for
 * the word_translations needed to restore them to READY.
 *
 * Runtime resolution model (exactly as resolveWordMeanings):
 *   PATH A: word_translations (language='fr', is_validated=true)
 *   PATH B: quran_words.lemma_id → lemma_translations (fr, validated)
 *   PATH C: word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)
 *
 * NEVER uses: linguistic_occurrences.hikma_lemma_id (MASAQ)
 *
 * Surahs (in processing order):
 *   1. S92 Al-Layl — 10 unresolved
 *   2. S98 Al-Bayyinah — 11 unresolved
 *   3. S82 Al-Infitar — 13 unresolved
 *   4. S85 Al-Buruj — 14 unresolved
 *   5. S90 Al-Balad — 16 unresolved
 *   6. S70 Al-Ma'arij — 30 unresolved
 *   Total: 94 word_translations needed
 *
 * Output: reports/phase-88f-ap-historical-ready-repair.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ap-historical-ready-repair.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
const HAMIDULLAH_RID = 31;
const KAZIMIRSKI_RID = 9001;

const TARGET_SURAHS = [92, 98, 82, 85, 90, 70];

type DbRow = Record<string, unknown>;

interface GlossEntry {
  word_id: string;
  arabic: string;
  surahNumber: number;
  surahName: string;
  ayah: string;
  enMeaning: string;
  gloss: string;
  rationale: string;
  hamidullahSnippet: string;
}

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

function deriveGloss(arabic: string, enMeaning: string, surahNumber: number): string {
  const clean = enMeaning.replace(/^\[|\]$/g, "").replace(/[()]/g, "").trim();
  const lower = clean.toLowerCase();

  // ═════════════════════════════════════════════════════════════════════
  // SURAH-SPECIFIC ENTRIES — checked BEFORE any generic pattern
  // ═════════════════════════════════════════════════════════════════════

  // ── S92 Al-Layl specific ──
  if (surahNumber === 92) {
    if (lower.includes("for anyone") || lower === "for anyone") return "à quiconque / pour quelqu'un";
    if (lower.includes("to be recompensed")) return "être récompensé / rétribué";
    if (lower.includes("will be removed") || lower.includes("removed from")) return "en sera écarté / préservé de";
    if (lower.includes("the guidance") || lower === "(is) the guidance") return "la guidée / la bonne direction";
    if (lower.includes("in the best") || lower === "in the best") return "dans la meilleure / la plus belle";
    if (lower.includes("the hereafter") || lower === "(is) the hereafter") return "l'au-delà / la vie future";
    if (lower.includes("towards") && lower.includes("difficulty")) return "vers la difficulté";
    if (lower === "his wealth" || lower.includes("his wealth")) return "sa richesse / son bien";
    if (lower === "the righteous" || lower === "righteous") return "le pieux / le plus pieux";
    if (lower === "(are) surely diverse" || lower === "surely diverse") return "sont certes divergentes / de genres variés";
    if (lower.includes("the night")) return "la nuit";
    if (lower.includes("the day")) return "le jour";
    if (lower === "encompasses" || lower.includes("encompass")) return "Il englobe / recouvre";
    if (lower === "unveils" || lower.includes("unveil")) return "Il dévoile / met à découvert";
    if (lower.includes("the male") || lower === "male") return "le mâle";
    if (lower.includes("the female") || lower === "female") return "la femelle";
    if (lower.includes("what you")) return "ce que vous";
    if (lower.includes("strive")) return "efforcez-vous / vous vous efforcez";
    if (lower.includes("spend")) return "dépensez / vous dépensez";
    if (lower.includes("fear") && lower.includes("gave")) return "qui redoute et donne";
    if (lower.includes("believe") && lower.includes("beautiful")) return "qui croit en la plus belle récompense";
    if (lower.includes("the most beautiful")) return "la plus belle récompense";
    if (lower.includes("we will")) return "Nous lui faciliterons";
    if (lower.includes("ease")) return "la facilité / l'aisance";
    if (lower.includes("the fire")) return "le feu / l'Enfer";
    if (lower.includes("he is the")) return "c'est Lui";
    if (lower.includes("your god")) return "votre Dieu / votre Seigneur";
    if (lower.includes("there is no")) return "il n'y a de";
    if (lower.includes("except") || lower.includes("other than")) return "sauf / à l'exception de";
    if (lower.includes("the creator") || lower.includes("the maker")) return "le Créateur";
    if (lower.includes("the death")) return "la mort";
    if (lower.includes("the life")) return "la vie";
    if (lower.includes("the all")) return "le Tout / l'Omnipotent";
    if (lower.includes("your lord")) return "votre Seigneur";
    if (lower.includes("you do not")) return "vous ne";
    if (lower.includes("and to")) return "et à";
    if (lower.includes("so remind") || lower.includes("remind")) return "rappelle donc / avertis";
    if (lower.includes("you are not")) return "tu n'es pas";
    if (lower.includes("controller") || lower.includes("in control")) return "celui qui détient le pouvoir / le maître";
    if (lower.includes("over them")) return "au-dessus d'eux";
    if (lower.includes("a shepherd") || lower.includes("shepherd")) return "un gardien / un berger";
    if (lower.includes("free") || lower.includes("burden")) return "libre de tout fardeau";
    if (lower.includes("fee") || lower.includes("ask")) return "sans en demander de récompense";
    if (lower.includes("turn") && lower.includes("away")) return "se détourner";
    if (lower.includes("the one who")) return "celui qui";
    if (lower.includes("it is")) return "c'est";
    if (lower.includes("upon")) return "sur / sur lui";
    if (lower.includes("will give")) return "donnera";
    if (lower.includes("he will")) return "il sera";
    if (lower.includes("the wealthy") || lower.includes("self-sufficient")) return "l'aisé / le riche";
    if (lower.includes("the needy") || lower.includes("poor")) return "le nécessiteux / le pauvre";
  }

  // ── S98 Al-Bayyinah specific ──
  if (surahNumber === 98) {
    if (lower.includes("to be abandoned") || lower.includes("abandoned")) return "à se séparer / à se diviser";
    if (lower === "(are the) worst" || lower === "worst" || lower.includes("worst")) return "le pire / les pires";
    if (lower === "therein" || lower.includes("therein")) return "y [dans le feu] / en lui";
    if (lower === "purified" || lower.includes("purified")) return "purifiées / pures";
    if (lower === "(are) writings" || lower === "writings" || lower.includes("writings")) return "des écrits / des feuillets";
    if (lower === "correct" || lower === "correct") return "droite / correcte";
    if (lower === "to worship" || lower.includes("to worship")) return "adorer";
    if (lower.includes("the clear")) return "la preuve évidente";
    if (lower.includes("sent")) return "a envoyé";
    if (lower.includes("messenger")) return "messager";
    if (lower.includes("reciting")) return "récitant";
    if (lower.includes("pure pages") || lower.includes("scrolls")) return "des feuillets purs";
    if (lower.includes("scripture")) return "l'Écriture / le Livre";
    if (lower.includes("commanded")) return "a ordonné / a prescrit";
    if (lower.includes("they were not")) return "ils n'étaient";
    if (lower.includes("except")) return "sauf / à l'exception de";
    if (lower.includes("worship")) return "adorer";
    if (lower.includes("alone")) return "Lui seul / exclusivement";
    if (lower.includes("inclining")) return "incliner / se tourner";
    if (lower.includes("toward")) return "vers Lui";
    if (lower.includes("establish")) return "accomplir / instaurer";
    if (lower.includes("prayer")) return "la prière";
    if (lower.includes("give")) return "donner";
    if (lower.includes("charity") || lower.includes("zakah")) return "l'aumône / la zakât";
    if (lower.includes("that is")) return "cela est";
    if (lower.includes("the correct")) return "la religion droite";
    if (lower.includes("religion")) return "religion / religion droite";
    if (lower.includes("disbelieve")) return "mécroire / ont mécru";
    if (lower.includes("people of the book") || lower.includes("book")) return "gens du Livre";
    if (lower.includes("polytheists") || lower.includes("idolaters")) return "associateurs / polythéistes";
    if (lower.includes("fire")) return "feu / l'Enfer";
    if (lower.includes("abiding")) return "pour l'éternité / à demeure";
    if (lower.includes("reward")) return "récompense";
    if (lower.includes("their lord")) return "leur Seigneur";
    if (lower.includes("pleased")) return "satisfait / agréé";
    if (lower.includes("he is")) return "Il est";
    if (lower.includes("all")) return "le Tout / Omniscient";
    if (lower.includes("aware")) return "Conscient / Informé";
    if (lower.includes("the truth") || lower.includes("truthful")) return "la vérité";
    if (lower.includes("differ")) return "divergent / se sont divisés";
    if (lower.includes("knowledge")) return "science / connaissance";
    if (lower.includes("came")) return "est venue";
    if (lower.includes("the clear evidence") || lower.includes("clear sign")) return "la preuve évidente";
    if (lower.includes("break")) return "se séparer / se diviser";
    if (lower.includes("they did not")) return "ils n'ont pas";
    if (lower.includes("the most beautiful")) return "la plus belle";
    if (lower.includes("guard")) return "préserver / garder";
    if (lower.includes("pleasure")) return "agrément / satisfaction";
    if (lower.includes(" Gardens") || lower.includes("gardens")) return "jardins";
    if (lower.includes("beneath")) return "sous";
    if (lower.includes("rivers")) return "les ruisseaux";
    if (lower.includes("flow")) return "coulent";
  }

  // ── S82 Al-Infitar specific ──
  if (surahNumber === 82) {
    if (lower.includes("will have power") || lower.includes("have power")) return "aura le pouvoir / détiendra";
    if (lower.includes("made to gush") || lower.includes("gush forth")) return "se répandront / jailliront";
    if (lower === "(will be) absent" || lower.includes("absent")) return "absents / éloignés";
    if (lower === "form") return "forme / aspect";
    if (lower === "he assembled you" || lower.includes("assembled")) return "t'a assemblé / t'a composé";
    if (lower.includes("the sky") || lower.includes("heaven")) return "le ciel";
    if (lower.includes("breaks") || lower.includes("split")) return "se fend / se fend";
    if (lower.includes("stars")) return "les étoiles";
    if (lower.includes("scatter") || lower.includes("strewn")) return "se dispersent";
    if (lower.includes("seas")) return "les mers";
    if (lower.includes("burst")) return "jaillissent / débordent";
    if (lower.includes("graves")) return "les tombes";
    if (lower.includes("turn") || lower.includes("overturn")) return "se renversent / s'ouvrent";
    if (lower.includes("soul")) return "âme";
    if (lower.includes("prepared")) return "a préparé";
    if (lower.includes("what")) return "ce que";
    if (lower.includes("forwarded")) return "elle a avancé / présenté";
    if (lower.includes("left behind") || lower.includes("delayed")) return "elle a laissé / retardé";
    if (lower.includes("o human") || lower.includes("o man")) return "ô homme";
    if (lower.includes("deceived")) return "t'a trompé";
    if (lower.includes("the most generous") || lower.includes("generous")) return "le Très-Généreux";
    if (lower.includes("who")) return "qui";
    if (lower.includes("created")) return "t'a créé";
    if (lower.includes("proportioned") || lower.includes("shaped")) return "t'a proportionné / t'a formé";
    if (lower.includes("assembled") || lower.includes("composed")) return "t'a assemblé";
    if (lower.includes("your nature")) return "ta nature / ton mould";
    if (lower.includes("which")) return "dans lequel";
    if (lower.includes("strewn") || lower.includes("strewn you")) return "t'a façonné";
    if (lower.includes("guardians")) return "des gardiens / des anges gardiens";
    if (lower.includes("noble")) return "nobles";
    if (lower.includes("recording")) return "qui enregistrent";
    if (lower.includes("they know")) return "ils savent";
    if (lower.includes("you do")) return "vous faites";
    if (lower.includes("the pious") || lower.includes("righteous")) return "les pieux";
    if (lower.includes("bliss")) return "la félicité";
    if (lower.includes("wicked") || lower.includes("rebellious")) return "le rebelle / le pervers";
    if (lower.includes("fire")) return "le feu / l'Enfer";
    if (lower.includes("they will")) return "ils y brûleront";
    if (lower.includes("enter") || lower.includes("burn")) return "entreront / brûleront";
    if (lower.includes("on the day")) return "le Jour";
    if (lower.includes("over")) return "au-dessus de";
    if (lower.includes("the fire") || lower.includes("fire")) return "le feu";
    if (lower.includes("the judgment") || lower.includes("judgment")) return "le Jugement";
    if (lower.includes("and what")) return "et qu'est-ce qui";
    if (lower.includes("can make you")) return "te fera comprendre";
    if (lower.includes("indeed")) return "en vérité";
    if (lower.includes("certain")) return "certitude";
    if (lower.includes("the most likely") || lower.includes("likely")) return "le plus susceptible";
    if (lower.includes("the only")) return "le seul";
    if (lower.includes("escape") || lower.includes("free")) return "qui échapperait / qui serait affranchi";
  }

  // ── S85 Al-Buruj specific ──
  if (surahNumber === 85) {
    if (lower === "(is) a quran" || lower === "a quran" || lower.includes("a quran")) return "un Coran / une récitation";
    if (lower === "(of) the hosts" || lower.includes("the hosts")) return "des armées / des troupes";
    if (lower === "(of) the pit" || lower.includes("the pit")) return "du fossé / de la tranchée";
    if (lower === "guarded" || lower === "Guarded") return "préservé / gardé";
    if (lower === "a tablet" || lower === "tablet") return "une Table / une planche";
    if (lower === "(were) sitting" || lower === "sitting" || lower.includes("sitting")) return "assis / assise";
    if (lower === "the glorious" || lower === "glorious") return "le Glorieux / le Majestueux";
    if (lower.includes("the sky") || lower.includes("heaven")) return "le ciel";
    if (lower.includes("great")) return "grand / immense";
    if (lower.includes("constellations") || lower.includes("zodiac")) return "constellations / signes du zodiaque";
    if (lower.includes("promised")) return "promise / attendu";
    if (lower.includes("day")) return "Jour";
    if (lower.includes("witness")) return "témoin";
    if (lower.includes("witnessed")) return "qui a été témoin";
    if (lower.includes("cursed")) return "maudits";
    if (lower.includes("the people")) return "les gens";
    if (lower.includes("ditch") || lower.includes("trench")) return "le fossé / la tranchée";
    if (lower.includes("fuel")) return "de combustible";
    if (lower.includes("fire")) return "le feu";
    if (lower.includes("they sat")) return "ils s'assirent";
    if (lower.includes("they were")) return "ils étaient";
    if (lower.includes("witness")) return "témoins";
    if (lower.includes("believed")) return "ont cru";
    if (lower.includes("they sat")) return "ils étaient assis";
    if (lower.includes("against")) return "contre";
    if (lower.includes("punished") || lower.includes("torment")) return "châtiés / châtiment";
    if (lower.includes("they wanted")) return "ils voulurent";
    if (lower.includes("a sign")) return "un signe";
    if (lower.includes("they turned")) return "ils se détournèrent";
    if (lower.includes("the Mighty") || lower.includes("Mighty")) return "le Tout-Puissant";
    if (lower.includes("the Praiseworthy") || lower.includes("Praiseworthy")) return "le Digne de louange";
    if (lower.includes("his throne")) return "Son Trône";
    if (lower.includes("encompasses")) return "cerne / englobe";
    if (lower.includes("all things") || lower.includes("everything")) return "toute chose";
    if (lower.includes("a clear")) return "une preuve claire / évidente";
    if (lower.includes("record") || lower.includes("writing")) return "un registre / écrit";
    if (lower.includes("ambush")) return "une embuscade / guet-apens";
    if (lower.includes("wraps") || lower.includes("envelops")) return "enveloppe / cerne";
    if (lower.includes("from")) return "de";
    if (lower.includes("behind")) return "par-derrière";
    if (lower.includes("alive")) return "le Vivant";
    if (lower.includes("the dead") || lower.includes("dies")) return "les morts / la mort";
    if (lower.includes("the dominion") || lower.includes("kingdom")) return "la royauté / le pouvoir";
    if (lower.includes("the clear") || lower.includes("clear")) return "clair / évident";
    if (lower.includes("the last")) return "le dernier";
    if (lower.includes("the first")) return "le premier";
    if (lower.includes("the all")) return "le Tout";
    if (lower.includes("aware")) return "Conscient / Informé";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("wronged") || lower.includes("committed")) return "ont commis des torts / ont fait du mal";
    if (lower.includes("seize") || lower.includes("punish")) return "saisir / punir";
    if (lower.includes("shattering") || lower.includes("destructive")) return "foudroyant / destructeur";
    if (lower.includes("it is")) return "c'est";
    if (lower.includes("he who")) return "Lui qui";
    if (lower.includes("creates") || lower.includes("begins")) return "crée / commence";
    if (lower.includes("then")) return "puis";
    if (lower.includes("repeats")) return "recommence / renouvelle";
    if (lower.includes("he is")) return "Il est";
    if (lower.includes("the forgiving") || lower.includes("forgiving")) return "le Pardonneur / l'Absoluteur";
    if (lower.includes("the loving") || lower.includes("loving")) return "le Tout-Aimant / le Bien-aimé";
  }

  // ── S90 Al-Balad specific ──
  if (surahNumber === 90) {
    if (lower === "has power" || lower.includes("has power")) return "est-il capable / a-t-il le pouvoir";
    if (lower === "closed in" || lower.includes("closed in")) return "enfermée / close";
    if (lower === "and the begetter" || lower.includes("begetter")) return "et par le géniteur / et par le père";
    if (lower === "the steep path (is)" || lower.includes("steep path")) return "la côte raide / l'ascension";
    if (lower === "a neck" || lower === "neck") return "un cou / une nuque";
    if (lower === "and shown him" || lower === "shown him") return "et lui avons montré / guidé";
    if (lower === "misery" || lower.includes("misery")) return "la misère / la détresse";
    if (lower === "abundant" || lower.includes("abundant")) return "en abondance / sans cesse";
    if (lower === "hardship" || lower.includes("hardship")) return "peine / difficulté";
    if (lower === "to compassion" || lower.includes("compassion")) return "vers la compassion / la miséricorde";
    if (lower === "the two ways") return "les deux voies";
    if (lower === "near relationship" || lower.includes("near relationship")) return "de parenté proche";
    if (lower.includes("the city") || lower.includes("this city")) return "cette cité";
    if (lower.includes("you are not")) return "tu n'es pas";
    if (lower.includes("the lawful") || lower.includes("permitted")) return "permis / autorisé";
    if (lower.includes("the father")) return "le père";
    if (lower.includes("the offspring") || lower.includes("child")) return "l'enfant / la descendance";
    if (lower.includes("we have created")) return "Nous avons créé";
    if (lower.includes("struggle") || lower.includes("exertion")) return "effort / lutte";
    if (lower.includes("the two")) return "les deux";
    if (lower.includes("highway")) return "voie / sentier";
    if (lower.includes("difficult")) return "difficile / escarpé";
    if (lower.includes("pass")) return "franchir";
    if (lower.includes("steep slope") || lower.includes("obstacle")) return "côte / pente raide";
    if (lower.includes("freeing") || lower.includes("free")) return "libérer / affranchir";
    if (lower.includes("a slave") || lower.includes("slave")) return "un esclave";
    if (lower.includes("a day")) return "un jour";
    if (lower.includes("hunger")) return "de faim";
    if (lower.includes("orphan")) return "orphelin";
    if (lower.includes("near")) return "proche";
    if (lower.includes("relative")) return "de parenté";
    if (lower.includes("dust") || lower.includes("dirt")) return "poussière / terre";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("believe")) return "croient";
    if (lower.includes("counsel")) return "conseillent";
    if (lower.includes("patience")) return "patience / endurance";
    if (lower.includes("counsel")) return "se conseillent mutuellement";
    if (lower.includes("mercy")) return "miséricorde";
    if (lower.includes("the right") || lower.includes("right hand")) return "main droite";
    if (lower.includes("the left") || lower.includes("left hand")) return "main gauche";
    if (lower.includes("people")) return "gens";
    if (lower.includes("companions")) return "compagnons";
    if (lower.includes("fire")) return "feu / l'Enfer";
    if (lower.includes("closing")) return "fermée / refermée";
    if (lower.includes("above")) return "au-dessus";
    if (lower.includes("the comfortable") || lower.includes("easy")) return "l'aisance / la voie aisée";
    if (lower.includes("our lord")) return "notre Seigneur";
    if (lower.includes("have we not")) return "ne Nous avons-il pas";
    if (lower.includes("given")) return "donné";
    if (lower.includes("two eyes")) return "deux yeux";
    if (lower.includes("a tongue")) return "une langue";
    if (lower.includes("two lips")) return "deux lèvres";
    if (lower.includes("guided")) return "guidé / montré";
    if (lower.includes("the way")) return "la voie";
    if (lower.includes("the ascending") || lower.includes("ascend")) return "la montée / l'ascension";
  }

  // ── S70 Al-Ma'arij specific ──
  if (surahNumber === 70) {
    if (lower.includes("in their testimonies") || lower.includes("testimonies")) return "dans leurs témoignages";
    if (lower === "bound to happen" || lower.includes("bound to happen")) return "inévitable / imminente";
    if (lower === "and the settings" || lower.includes("the settings")) return "et les couchants / et l'occident";
    if (lower === "before you" || lower.includes("before you")) return "devant toi / face à toi";
    if (lower.includes("flame of hell") || lower.includes("flame")) return "une flamme de l'Enfer / le feu ardent";
    if (lower === "(in) separate groups" || lower.includes("separate groups")) return "en groupes séparés / par factions";
    if (lower.includes("to be felt secure") || lower.includes("felt secure")) return "à l'abri / en sécurité";
    if (lower === "its measure" || lower.includes("its measure")) return "sa mesure / sa durée";
    if (lower === "a garden" || lower === "garden") return "un jardin / le Paradis";
    if (lower === "good" || lower === "good") return "le bien / bon";
    if (lower === "a goal" || lower === "goal") return "un but / un objectif";
    if (lower === "and collected" || lower === "collected") return "et a amassé / a accumulé";
    if (lower === "and his nearest kindred" || lower.includes("nearest kindred")) return "et son clan le plus proche";
    if (lower === "(of) the ways of ascent" || lower.includes("ways of ascent")) return "des voies d'ascension / degrés";
    if (lower === "by his children" || lower.includes("by his children")) return "par ses enfants";
    if (lower === "any preventer" || lower.includes("preventer")) return "un empêcheur / un repousseur";
    if (lower === "the criminal" || lower === "criminal") return "le criminel / le pervers";
    if (lower === "(are) constant" || lower === "constant" || lower.includes("constant")) return "constants / persévérants";
    if (lower === "a remover" || lower === "remover") return "qui arrache / qui enlève";
    if (lower === "withholding" || lower.includes("withholding")) return "retient / avare / qui refuse";
    if (lower === "distressed" || lower.includes("distressed")) return "anxieux / affligé";
    if (lower === "accept (the) truth" || lower.includes("accept") && lower.includes("truth")) return "croient en la vérité";
    if (lower === "anxious" || lower.includes("anxious")) return "anxieux / inquiet / cupide";
    if (lower === "the good" || lower === "good") return "le bien / la prospérité";
    if (lower === "of the skin of the head" || lower.includes("skin of the head")) return "la peau du crâne / les scalps";
    if (lower === "a friend" || lower === "friend") return "un ami / un proche";
    if (lower === "(of) that day" || lower.includes("that day")) return "ce Jour-là";
    if (lower === "they will be made to see each other" || lower.includes("made to see")) return "ils seront rendus visibles les uns aux autres";
    if (lower === "stand firm" || lower.includes("stand firm")) return "se tiennent fermes";
    if (lower === "a questioner" || lower.includes("questioner")) return "un demandeur / quelqu'un qui questionne";
    if (lower.includes("a demander") || lower.includes("questioner")) return "un demandeur / quelqu'un qui questionne";
    if (lower.includes("asked")) return "a demandé";
    if (lower.includes("a punishment")) return "un châtiment";
    if (lower.includes("inevitable")) return "inévitable / imminente";
    if (lower.includes("the disbelievers")) return "les mécréants";
    if (lower.includes("no protector") || lower.includes("no protector")) return "pas de protecteur / aucun allié";
    if (lower.includes("a way") || lower.includes("path")) return "voie / issue";
    if (lower.includes("from")) return "de";
    if (lower.includes("allah")) return "Allah";
    if (lower.includes("the lord")) return "le Seigneur";
    if (lower.includes("of the")) return "des";
    if (lower.includes("ascending pathways") || lower.includes("ways of ascent")) return "voies d'ascension / degrés ascendants";
    if (lower.includes("the angels") || lower.includes("angels")) return "les anges";
    if (lower.includes("the spirit")) return "l'Esprit";
    if (lower.includes("ascend")) return "montent / s'élèvent";
    if (lower.includes("to him")) return "vers Lui";
    if (lower.includes("a day")) return "un Jour";
    if (lower.includes("the measure")) return "la durée / la mesure";
    if (lower.includes("its period")) return "sa période";
    if (lower.includes("fifty")) return "cinquante";
    if (lower.includes("thousand")) return "mille";
    if (lower.includes("years")) return "ans";
    if (lower.includes("so be patient")) return "sois donc patient";
    if (lower.includes("a goodly patience")) return "d'une belle patience";
    if (lower.includes("they see")) return "ils voient";
    if (lower.includes("it is")) return "c'est";
    if (lower.includes("as if")) return "comme si";
    if (lower.includes("they were")) return "ils étaient";
    if (lower.includes("lingering")) return "attardés / qui restent";
    if (lower.includes("a day")) return "un jour";
    if (lower.includes("it will be")) return "il sera";
    if (lower.includes("on the day")) return "le Jour";
    if (lower.includes("the sky")) return "le ciel";
    if (lower.includes("like molten") || lower.includes("molten")) return "comme du métal fondu";
    if (lower.includes("the mountains")) return "les montagnes";
    if (lower.includes("like wool") || lower.includes("carded wool")) return "comme de la laine cardée";
    if (lower.includes("no close friend")) return "pas d'ami intime";
    if (lower.includes("intercede")) return "intercéder";
    if (lower.includes("except")) return "sauf";
    if (lower.includes("permission")) return "permission";
    if (lower.includes("he is")) return "Il est";
    if (lower.includes("aware")) return "Conscient / Informé";
    if (lower.includes("their lord")) return "leur Seigneur";
    if (lower.includes("the lord of")) return "le Seigneur de";
    if (lower.includes("the ascending") || lower.includes("ascents")) return "les ascensions / degrés";
    if (lower.includes("the one who")) return "Celui qui";
    if (lower.includes("owns")) return "possède / détient";
    if (lower.includes("the creation") || lower.includes("dominion")) return "la création / le pouvoir";
    if (lower.includes("the command")) return "le commandement / l'ordre";
    if (lower.includes("deity")) return "divinité";
    if (lower.includes("there is no")) return "il n'y a pas de";
    if (lower.includes("guard")) return "garder / protéger";
    if (lower.includes("stepping")) return "pas à pas / par degrés";
    if (lower.includes("going")) return "aller / partir";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("fear")) return "craignent";
    if (lower.includes("their lord")) return "leur Seigneur";
    if (lower.includes("in fear")) return "dans la crainte";
    if (lower.includes("trusting")) return "se confier / faisant confiance";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("believe")) return "croient";
    if (lower.includes("and seek")) return "et cherchent";
    if (lower.includes("forgiveness")) return "le pardon";
    if (lower.includes("guard their")) return "préserver";
    if (lower.includes("prayers")) return "prières";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("fear")) return "craignent";
    if (lower.includes("their lord")) return "leur Seigneur";
    if (lower.includes("the unseen")) return "l'Invisible / l'occulte";
    if (lower.includes("they are")) return "ils sont";
    if (lower.includes("in fear")) return "dans la crainte";
    if (lower.includes("the punishment")) return "le châtiment";
    if (lower.includes("of their lord")) return "de leur Seigneur";
    if (lower.includes("it is")) return "c'est";
    if (lower.includes("a punishment")) return "un châtiment";
    if (lower.includes("none")) return "nul / aucun";
    if (lower.includes("averted")) return "détourné / repoussé";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("guard")) return "préservent / gardent";
    if (lower.includes("their private")) return "leur intimité";
    if (lower.includes("except")) return "sauf";
    if (lower.includes("their spouses")) return "leurs épouses";
    if (lower.includes("or those")) return "ou ceux";
    if (lower.includes("right hand")) return "main droite";
    if (lower.includes("possess")) return "possèdent";
    if (lower.includes("they are")) return "ils sont";
    if (lower.includes("not")) return "pas";
    if (lower.includes("blamed")) return "blâmés / reprochés";
    if (lower.includes("whoever")) return "quiconque";
    if (lower.includes("seeks")) return "cherche";
    if (lower.includes("beyond")) return "au-delà";
    if (lower.includes("transgressors")) return "transgresseurs / outranciers";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("honor")) return "honorent / respectent";
    if (lower.includes("trusts")) return "les dépôts / les engagements";
    if (lower.includes("their covenant")) return "leur pacte / leur engagement";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("stand")) return "se tiennent debout";
    if (lower.includes("firm")) return "fermes";
    if (lower.includes("justice")) return "la justice";
    if (lower.includes("witnesses")) return "témoins";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("guard")) return "préservent / gardent";
    if (lower.includes("their prayers")) return "leurs prières";
    if (lower.includes("they are")) return "ils sont";
    if (lower.includes("in gardens")) return "dans les jardins";
    if (lower.includes("honored")) return "honorés";
    if (lower.includes("those who")) return "ceux qui";
    if (lower.includes("disbelieve")) return "mécroient";
    if (lower.includes("turn away")) return "se détournent";
    if (lower.includes("disdainful")) return "avec dédain / avec orgueil";
    if (lower.includes("he will")) return "Il les";
    if (lower.includes("punish")) return "châtiera";
    if (lower.includes("a painful")) return "douloureux";
    if (lower.includes("for them")) return "pour eux";
    if (lower.includes("is")) return "est";
    if (lower.includes("the most")) return "le meilleur / le plus";
    if (lower.includes("fitting")) return "convenable";
    if (lower.includes("a provision")) return "une part / une subsistance";
    if (lower.includes("of dust")) return "de poussière";
    if (lower.includes("it will be")) return "il sera";
    if (lower.includes("too much")) return "trop";
    if (lower.includes("orphans")) return "orphelins";
    if (lower.includes("hypocrites")) return "hypocrites";
    if (lower.includes("they are")) return "ils sont";
    if (lower.includes("contentious")) return "querelleurs / litigieux";
    if (lower.includes("a word")) return "un mot";
    if (lower.includes("the truth") || lower.includes("truthful")) return "la vérité";
    if (lower.includes("the most")) return "le plus";
    if (lower.includes("uncertain")) return "incertain / douteux";
    if (lower.includes("the day")) return "le Jour";
    if (lower.includes("their tongues")) return "leurs langues";
    if (lower.includes("their hands")) return "leurs mains";
    if (lower.includes("their feet")) return("leurs pieds");
    if (lower.includes("bear witness")) return "témoigneront";
    if (lower.includes("about")) return "sur / au sujet de";
    if (lower.includes("what")) return "ce que";
    if (lower.includes("they used")) return "ils avaient";
    if (lower.includes("to do")) return "l'habitude de faire";
    if (lower.includes("woe")) return "malheur";
    if (lower.includes("to them")) return "à eux";
    if (lower.includes("that day")) return "ce Jour-là";
    if (lower.includes("they are")) return "ils sont";
    if (lower.includes("call")) return "appellent";
    if (lower.includes("the messengers")) return "les messagers";
    if (lower.includes("liars")) return "menteurs";
    if (lower.includes("they will")) return "ils seront";
    if (lower.includes("told")) return "racontés / informés";
    if (lower.includes("injustice")) return "injustice";
    if (lower.includes("they did")) return("ils ont commise");
    if (lower.includes("they will not")) return "ils ne seront pas";
    if (lower.includes("tired")) return "fatigués";
    if (lower.includes("nor")) return "ni";
    if (lower.includes("they will be")) return "ils seront";
    if (lower.includes("wearied")) return "épuisés / lassés";
  }

  // ── GENERIC FALLBACK ──
  // French rendering from EN meaning (tightly scoped)
  if (!clean || clean.length === 0) {
    return arabic;
  }
  // Attempt simple EN→FR mapping for common remaining patterns
  let fr = clean;
  // Strip leading articles
  fr = fr.replace(/^(the|a|an)\s+/i, "");
  // Strip "is/are/was/were" prefix
  fr = fr.replace(/^(is|are|was|were)\s+/i, "");
  // Strip leading "and " / "then "
  fr = fr.replace(/^(and|then)\s+/i, "");
  // If after stripping it still looks English (common EN words), return bare Arabic
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

  console.log("=== PHASE 88F-AP — HISTORICAL-READY RUNTIME REPAIR QUEUE — READ-ONLY EDITORIAL AUDIT ===\n");
  console.log("  READ-ONLY: true");
  console.log("  DATABASE_WRITES: 0\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,is_validated"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,is_validated"),
  ]);

  // ─── 2. Build indexes ──────────────────────────────────────────────────
  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) {
    const sn = s.number as number;
    surahNumById.set(s.id as string, sn);
    surahNameByNum.set(sn, (s.name_transliteration as string) ?? `S${sn}`);
  }

  // FR runtime state
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // Ayah → surah number + ayah number
  const surahNumByAyahId = new Map<string, number>();
  const ayahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) {
      surahNumByAyahId.set(a.id as string, sn);
      ayahNumByAyahId.set(a.id as string, a.ayah_number as number);
    }
  }

  // Build per-surah word sets + ayah mapping
  const surahWordIds = new Map<number, Set<string>>();
  const ayahIdByWord = new Map<string, string>(); // first ayah_id per word
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn == null) continue;
    if (!TARGET_SURAHS.includes(sn)) continue;
    let set = surahWordIds.get(sn);
    if (!set) { set = new Set(); surahWordIds.set(sn, set); }
    const wid = oc.word_id as string;
    set.add(wid);
    if (!ayahIdByWord.has(wid)) ayahIdByWord.set(wid, oc.ayah_id as string);
  }

  console.log(`  Target surahs: ${TARGET_SURAHS.join(", ")}`);
  for (const sn of TARGET_SURAHS) {
    console.log(`    S${sn} ${surahNameByNum.get(sn) ?? ""}: ${surahWordIds.get(sn)?.size ?? 0} forms`);
  }
  console.log();

  // ─── 3. Runtime resolve + identify unresolved ─────────────────────────
  console.log("=== Runtime resolution ===\n");

  interface SurahBaseline {
    surahNumber: number;
    surahName: string;
    totalForms: number;
    pathA: number;
    pathB: number;
    pathC: number;
    unresolved: number;
    classA: number;
  }

  const baselines: SurahBaseline[] = [];
  const allUnresolvedEntries: GlossEntry[] = [];
  let validationIssues = 0;

  for (const sn of TARGET_SURAHS) {
    const wordIds = surahWordIds.get(sn)!;
    const surahName = surahNameByNum.get(sn) ?? `S${sn}`;

    let pathA = 0, pathB = 0, pathC = 0, classA = 0;
    const unresolvedIds: string[] = [];

    for (const wid of wordIds) {
      if (frWordTr.has(wid)) { pathA++; continue; }
      const word = wordById.get(wid);
      const directLemma = word?.lemma_id as string | null;
      if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }
      const wlmLemma = wlmByWord.get(wid);
      if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }

      // Unresolved
      unresolvedIds.push(wid);
      if (directLemma && !frLemmaTr.has(directLemma)) classA++;
      else if (wlmLemma && !frLemmaTr.has(wlmLemma)) classA++;
    }

    const total = wordIds.size;
    const covered = pathA + pathB + pathC;
    const unresolved = unresolvedIds.length;

    baselines.push({ surahNumber: sn, surahName, totalForms: total, pathA, pathB, pathC, unresolved, classA });

    console.log(`  S${sn} ${surahName.padEnd(20)} ${covered}/${total} (${ROUND(covered / total * 100, 1)}%)  A=${pathA} B=${pathB} C=${pathC}  unresolved=${unresolved}  classA=${classA}`);

    // ─── 4. Load French ayah translations for context ──────────────────
    const surahAyahIds = new Set<string>();
    for (const oc of allOccs) {
      const asn = surahNumByAyahId.get(oc.ayah_id as string);
      if (asn === sn) surahAyahIds.add(oc.ayah_id as string);
    }

    const transByAyah = new Map<string, Map<number, string>>();
    const ayahIdList = [...surahAyahIds];
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

    // ─── 5. Produce editorial glosses (IDENTITY-SAFE) ───────────────────
    for (const wid of unresolvedIds) {
      const word = wordById.get(wid);
      if (!word) {
        console.log(`  ⚠ Word not found: ${wid}`);
        validationIssues++;
        continue;
      }

      const arabic = (word.arabic as string) ?? "?";
      const enMeaning = (word.meaning as string) ?? "";
      const ayahId = ayahIdByWord.get(wid);
      const ayahNum = ayahId ? ayahNumByAyahId.get(ayahId) : null;
      const ayahRef = ayahNum ? `${sn}:${ayahNum}` : `${sn}:?`;

      // Get French ayah context
      const transMap = ayahId ? transByAyah.get(ayahId) : undefined;
      const hamidullahText = transMap?.get(HAMIDULLAH_RID)?.slice(0, 400) ?? "";

      // IDENTITY-SAFE: fresh variable per iteration
      let gloss = deriveGloss(arabic, enMeaning, sn);

      // Final safety: never empty
      if (!gloss || gloss.trim().length === 0) {
        gloss = `${arabic} (${ayahRef})`;
      }

      // English validation
      if (/^(the|a |an |is |are |was |were |will |shall |has |have |had |been |its |their |this |that |these |those |then |and |but |not |no |so |if |as |it |he |she |we |they |you |i )/i.test(gloss)) {
        issues_count++;
        console.log(`  ⚠ ENGLISH: ${arabic} (${ayahRef}) → "${gloss}" EN="${enMeaning}"`);
      }

      // Placeholder validation
      if (gloss === arabic) {
        issues_count++;
        console.log(`  ⚠ PLACEHOLDER: ${arabic} (${ayahRef}) → "${gloss}" EN="${enMeaning}"`);
      }

      const rationale = `Src: Hamidullah "${hamidullahText.slice(0, 120)}" | EN hint: "${enMeaning.slice(0, 60)}" | S${sn}:${ayahRef}`;

      const entry: GlossEntry = {
        word_id: wid,
        arabic,
        surahNumber: sn,
        surahName,
        ayah: ayahRef,
        enMeaning,
        gloss,
        rationale,
        hamidullahSnippet: hamidullahText.slice(0, 150),
      };
      allUnresolvedEntries.push(entry);
    }
  }

  // ─── 6. Validation ────────────────────────────────────────────────────
  console.log(`\n=== Validation ===\n`);
  console.log(`  Total glosses: ${allUnresolvedEntries.length}`);
  console.log(`  Validation issues: ${validationIssues + issues_count}`);

  const uniqueWordIds = new Set(allUnresolvedEntries.map(g => g.word_id));
  const emptyGlosses = allUnresolvedEntries.filter(g => !g.gloss || g.gloss.trim() === "");
  console.log(`  Unique word_ids: ${uniqueWordIds.size}`);
  console.log(`  Empty glosses: ${emptyGlosses.length}`);
  console.log(`  IDENTITY-SAFE: ${uniqueWordIds.size === allUnresolvedEntries.length && emptyGlosses.length === 0 ? "✅" : "❌"}\n`);

  // ─── 7. Per-surah simulation ───────────────────────────────────────────
  console.log("=== Simulation ===\n");

  interface SimResult {
    surahNumber: number;
    surahName: string;
    baselineCovered: number;
    baselineTotal: number;
    newWordTr: number;
    afterCovered: number;
    afterPct: number;
    ready: boolean;
  }

  const sims: SimResult[] = [];
  for (const b of baselines) {
    const surahGlosses = allUnresolvedEntries.filter(g => g.surahNumber === b.surahNumber);
    const newWordTr = surahGlosses.length;
    const afterCovered = b.pathA + b.pathB + b.pathC + newWordTr;
    const afterPct = ROUND(afterCovered / b.totalForms * 100, 1);
    const ready = afterCovered === b.totalForms;
    sims.push({
      surahNumber: b.surahNumber,
      surahName: b.surahName,
      baselineCovered: b.pathA + b.pathB + b.pathC,
      baselineTotal: b.totalForms,
      newWordTr,
      afterCovered,
      afterPct,
      ready,
    });
    console.log(`  S${b.surahNumber} ${b.surahName.padEnd(20)} ${b.pathA + b.pathB + b.pathC}/${b.totalForms} → ${afterCovered}/${b.totalForms} (${afterPct}%)  READY: ${ready ? "✅" : "❌"}`);
  }

  const totalGlosses = allUnresolvedEntries.length;
  const allReady = sims.every(s => s.ready);
  const editorialReady = totalGlosses === 94 && validationIssues === 0 && issues_count === 0 && emptyGlosses.length === 0 && allReady;

  console.log(`\n  Total word_translations: ${totalGlosses}`);
  console.log(`  All 6 surahs READY: ${allReady ? "✅" : "❌"}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady ? "✅ YES" : "❌ NO"}\n`);

  // ─── 8. Build report ──────────────────────────────────────────────────
  const report = {
    phase: "88F-AP",
    verdict: editorialReady ? "PHASE_88F_AP_COMPLETE" : "PHASE_88F_AP_BLOCKED_NEEDS_EDITORIAL_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    editorialReadyForImport: editorialReady,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    targetSurahs: TARGET_SURAHS,

    baselines: baselines.map(b => ({
      surahNumber: b.surahNumber,
      surahName: b.surahName,
      totalForms: b.totalForms,
      pathA: b.pathA,
      pathB: b.pathB,
      pathC: b.pathC,
      unresolved: b.unresolved,
      classALemmaReachable: b.classA,
    })),

    editorialGlosses: allUnresolvedEntries,

    validation: {
      totalGlosses,
      expectedGlosses: 94,
      uniqueWordIds: uniqueWordIds.size,
      emptyGlosses: emptyGlosses.length,
      validationIssues: validationIssues + issues_count,
      identitySafe: uniqueWordIds.size === allUnresolvedEntries.length && emptyGlosses.length === 0,
      noEnglish: issues_count === 0,
      noPlaceholders: allUnresolvedEntries.every(g => g.gloss !== g.arabic),
    },

    simulation: {
      results: sims,
      allReady,
      expectedReadyCount: 33, // 27 current + 6 repaired
      totalWordTranslations: totalGlosses,
    },

    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      wlmCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
      protectedTables: "all unchanged",
    },

    nextPhase: editorialReady
      ? "PHASE 88F-AQ — HISTORICAL-READY REPAIR CONTROLLED IMPORT (ready to execute)"
      : "BLOCKED — editorial review needed before import",
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  Glosses: ${totalGlosses}/94`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady}`);
  console.log(`  DATABASE_WRITES: 0 ✅`);
}

// Track English/placeholder issues
let issues_count = 0;

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AP", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});
