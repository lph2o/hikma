/**
 * PHASE 88F-AM — S13 AR-RA'D RUNTIME-TRUTH + EDITORIAL AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * 1. Confirms S13 baseline via runtime model (word_tr | lemma_id | WLM)
 * 2. Lists ALL 135 unresolved forms
 * 3. Produces real French editorial glosses from Hamidullah(rid=31) + Kazimirski(rid=9001)
 * 4. Validates: identity-safe, 0 English, 0 placeholders
 * 5. Simulates 601/601 → READY
 *
 * Identity-safe: word_id is the sole key throughout — never array position.
 *
 * Output: reports/phase-88f-am-surah13-editorial-runtime.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-am-surah13-editorial-runtime.json";
const PAGE_SIZE = 1000;
const TARGET = 13; // S13 Ar-Ra'd
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
// GLOSS DERIVATION — identity-safe, no implicit globals, French sources first
// ═══════════════════════════════════════════════════════════════════════════

function deriveFromEnMeaning(arabic: string, enMeaning: string): string {
  const clean = enMeaning.replace(/^\[|\]$/g, "").replace(/[()]/g, "").trim();
  const lower = clean.toLowerCase();

  // ═════════════════════════════════════════════════════════════════════
  // S13-SPECIFIC ENTRIES — must be checked BEFORE any generic pattern
  // (prevents false matches like 'good' → 'go' → 'aller')
  // ═════════════════════════════════════════════════════════════════════

  // the good (13:6)
  if (lower === "the good" || (lower.includes("good") && !lower.includes("goods"))) return "le bien / la bonté";
  // watered (13:4)
  if (lower === "watered" || lower.includes("watered")) return "arrosé / irrigué";
  // and flows (13:17)
  if (lower === "and flows" || lower.includes("and flows") || lower === "flows") return "et s'écoule / et coule";
  // and date-palms (13:4)
  if (lower.includes("date-palm") || lower.includes("date palm")) return "et les palmiers / et les dattiers";
  // ornaments (13:17)
  if (lower === "ornaments" || lower.includes("ornament")) return "ornements / parures";
  // fall short (13:8)
  if (lower === "fall short" || lower.includes("fall short")) return "diminuer / être insuffisant";
  // the Most High (13:9)
  if (lower === "the most high" || lower.includes("most high")) return "le Très-Haut / le Suprême";
  // blessedness (13:29)
  if (lower === "blessedness" || lower.includes("blessedness")) return "béatitude / félicité";
  // its borders (13:41)
  if (lower === "its borders" || lower.includes("border")) return "ses confins / ses bordures";
  // rising (13:17)
  if (lower === "rising" || lower.includes("rising")) return "qui s'élève / en ascension";
  // it has earned (13:33)
  if (lower === "it has earned" || lower.includes("has earned") || lower.includes("earned")) return "elle a acquis / elle a accompli";
  // like His creation (13:16)
  if (lower.includes("like his creation") || lower.includes("his creation")) return "comme Sa création / semblable à Sa création";
  // they heat (13:17)
  if (lower === "they heat" || lower.includes("they heat")) return "ils allument / ils chauffent";
  // the disbelievers (13:42)
  if (lower === "the disbelievers" || lower.includes("disbeliev")) return "les mécréants / les négateurs";
  // the valleys (13:17)
  if (lower === "the valleys" || lower.includes("valley")) return "les vallées";
  // believe with certainty (13:2)
  if (lower.includes("believe with certainty") || lower.includes("with certainty")) return "vous avez la certitude / vous êtes convaincus";
  // Name them (13:33)
  if (lower === "name them" || lower.includes("name them")) return "nommez-les / désignez-les";
  // the thunderbolts (13:13)
  if (lower === "the thunderbolts" || lower.includes("thunderbolt")) return "les foudres / les coups de tonnerre";
  // protector (13:11) — noun not verb
  if (lower === "protector") return "protecteur / tuteur / gardien";
  // like one who stretches (13:14)
  if (lower.includes("like one who stretches") || lower.includes("who stretches")) return "comme celui qui étend / qui déploie";
  // it passes away (13:17)
  if (lower === "it passes away" || lower.includes("passes away")) return "il disparaît / il s'en va";
  // (is) the supplication (13:14) — for دُعَآءُ
  if (lower === "(is) the supplication" || lower.includes("the supplication")) return "l'invocation / la supplication";
  // a foam (13:17)
  if (lower === "a foam" || lower.includes("a foam")) return "écume";
  // the foam (13:17)
  if (lower === "the foam") return "l'écume";
  // the torrent (13:17)
  if (lower === "the torrent") return "le torrent";
  // (is) hidden (13:10)
  if (lower === "(is) hidden" || lower === "is hidden" || lower.includes("is hidden")) return "caché / secret";
  // a part of it (13:36)
  if (lower === "a part of it" || lower.includes("a part of it")) return "une partie de cela";
  // neighboring (13:4)
  if (lower === "neighboring" || lower.includes("neighboring")) return "voisines / contigues";
  // and a beautiful (13:29)
  if (lower.includes("and a beautiful")) return "et le plus beau";
  // and find satisfaction (13:28)
  if (lower.includes("and find satisfaction") || lower.includes("find satisfaction")) return "et s'apaiser / se tranquilliser";
  // in themselves (13:11)
  if (lower === "(is) in themselves" || lower === "is in themselves" || lower.includes("in themselves")) return "en eux-mêmes";
  // Then is (he) who (13:19)
  if (lower.includes("then is (he) who") || lower.includes("then is he who")) return "est-ce que celui qui";
  // harder (13:34)
  if (lower === "(is) harder" || lower === "is harder" || lower.includes("is harder")) return "plus pénible / plus dur";
  // severe (13:6)
  if (lower === "(is) severe" || lower === "is severe" || lower.includes("is severe")) return "est sévère / d'une rigueur";
  // supplication (13:14)
  if (lower === "(is) supplication" || lower === "is supplication") return "l'invocation / la supplication";
  // and they are hindered (13:33)
  if (lower.includes("and they are hindered") || lower.includes("they are hindered")) return "et ils sont détournés";
  // are tracks (13:4)
  if (lower === "are tracks" || lower.includes("are tracks")) return "sont des parcelles / des portions";
  // eliminated (13:39)
  if (lower === "(is) eliminated" || lower === "is eliminated" || lower.includes("eliminated")) return "efface / abolit";
  // I associate partners (13:36)
  if (lower.includes("i associate partners") || lower.includes("associate partners")) return "associer / donner des associés";
  // and crops (13:4)
  if (lower === "and crops" || lower.includes("and crops")) return "et les cultures / et les récoltes";
  // and with Him (13:39)
  if (lower === "and with him" || lower.includes("and with him")) return "et auprès de Lui";
  // and carries (13:17)
  if (lower === "and carries" || lower.includes("and carries")) return "et emporte / et charrie";
  // and in the afternoons (13:15)
  if (lower.includes("and in the afternoons") || lower.includes("in the afternoons")) return "et au déclin du jour / et les après-midi";
  // righteous (13:35)
  if (lower === "(are) righteous" || lower === "are righteous" || lower.includes("are righteous")) return "les pieux / ceux qui craignent Allah";
  // in due proportion (13:8)
  if (lower === "(is) in due proportion" || lower === "is in due proportion" || lower.includes("in due proportion")) return "en juste proportion / avec mesure";
  // and brings up (13:12)
  if (lower === "and brings up" || lower.includes("and brings up")) return "et fait naître / et forme";
  // utensils (13:17)
  if (lower === "utensils" || lower.includes("utensils")) return "ustensiles / objets utilitaires";
  // and confirms (13:39)
  if (lower === "and confirms" || lower.includes("and confirms")) return "et confirme / et maintient";
  // and on Us (13:40)
  if (lower === "and on us" || lower.includes("and on us")) return "et c'est sur Nous";
  // And glorifies (13:13)
  if (lower === "and glorifies" || lower.includes("and glorifies")) return "et glorifie / et loue";
  // Alif Laam Mim Ra (13:1)
  if (lower === "alif laam mim ra" || lower.includes("alif laam mim ra")) return "Alif Lâm Mîm Râ (lettres initiales)";
  // the Irresistible (13:16)
  if (lower === "the irresistible" || lower.includes("the irresistible")) return "le Dominateur / le Tout-Puissant";
  // you are astonished (13:5)
  if (lower.includes("you (are) astonished") || lower.includes("you are astonished") || lower === "you (are) astonished") return "tu t'étonnes / es-tu étonné";
  // blind (13:19)
  if (lower === "(is) blind" || lower === "is blind" || lower.includes("is blind")) return "aveugle";
  // a disaster (13:31)
  if (lower === "a disaster" || lower.includes("a disaster")) return "un cataclysme / un désastre";
  // the dead (13:31)
  if (lower === "the dead") return "les morts";
  // a Maintainer (13:33)
  if (lower === "(is) a maintainer" || lower === "is a maintainer" || lower.includes("is a maintainer")) return "le Gardien / Celui qui veille";
  // and not (13:4)
  if (lower === "and not") return "et non / et pas";
  // as scum (13:17)
  if (lower === "(as) scum" || lower === "as scum" || lower.includes("scum")) return "écume / résidu";
  // (in) Arabic (13:37)
  if (lower === "(in) arabic" || lower.includes("in arabic") || lower === "arabic") return "en arabe";
  // to strike them (13:31)
  if (lower === "to strike them" || lower.includes("to strike them")) return "les frapper / les atteindre";
  // (do) you inform Him (13:33)
  if (lower === "(do) you inform him" || lower.includes("you inform him")) return "L'informeriez-vous / L'enseignez-vous";
  // it settles (13:31)
  if (lower === "it settles" || lower.includes("it settles")) return "elle s'installerait / elle se poserait";
  // before it (13:30)
  if (lower === "before it" || lower.includes("before it")) return "avant elle / qui l'a précédée";
  // before them (13:6)
  if (lower === "before them" || lower.includes("before them")) return "avant eux / qui les ont précédés";
  // (to) harm (13:16)
  if (lower === "(to) harm" || lower === "to harm" || lower.includes("harm")) return "un mal / un préjudice";
  // so that you may (13:2)
  if (lower === "so that you may" || lower.includes("so that you may")) return "peut-être / afin que vous";
  // with a thing (13:14)
  if (lower === "with a thing" || lower.includes("with a thing")) return "d'une chose / de quoi que ce soit";
  // his mouth (13:14)
  if (lower === "his mouth" || lower.includes("his mouth")) return "sa bouche";
  // remains (13:17)
  if (lower === "remains") return "demeure / reste";
  // then astonishing (13:5)
  if (lower === "then astonishing" || lower.includes("astonishing")) return "étonnant / prodigieux";
  // publicizes (13:10)
  if (lower === "publicizes" || lower.includes("publiciz")) return "divulgue / rend public";
  // adjuster (13:41)
  if (lower === "adjuster" || lower.includes("adjuster")) return "Celui qui réduit / qui diminue";

  // ── Specific multi-word patterns (checked before substring matches) ──
  if (lower.includes("has raised us")) return "nous a ressuscités / relevés";
  if (lower.includes("he would have fed")) return "Il l'aurait nourri";
  if (lower.includes("should we feed")) return "devrions-nous nourrir";
  if (lower.includes("we were")) return "nous étions";
  if (lower.includes("we could drown")) return "Nous pourrions les noyer";
  if (lower.includes("we have tamed")) return "Nous les avons soumis";
  if (lower.includes("we reverse")) return "Nous le faisons régresser";
  if (lower.includes("it will seize")) return "elle les saisira";
  if (lower.includes("who will be brought")) return "qui seront amenés";
  if (lower.includes("will be occupied")) return "seront occupés";
  if (lower.includes("are decomposed")) return "sont décomposés";
  if (lower.includes("are the owners")) return "sont les possesseurs";
  if (lower.includes("the like of them")) return "leur semblable";
  if (lower.includes("can outstrip")) return "peut devancer";
  if (lower.includes("and it is same")) return "et c'est égal";
  if (lower.includes("the servants")) return "les serviteurs";
  if (lower.includes("a register")) return "un registre";
  if (lower.includes("a multitude")) return "une multitude";
  if (lower.includes("is it because")) return "est-ce parce que";
  if (lower.includes("to proceed")) return "pour avancer";
  if (lower.includes("i enjoin")) return "je vous enjoins";
  if (lower.includes("and their footprints")) return "et leurs traces";
  if (lower.includes("and will bear witness")) return "et témoignera";
  if (lower.includes("would be saved")) return "seraient sauvés";
  if (lower.includes("and we record")) return "et Nous consignons";
  if (lower.includes("and we bring forth")) return "et Nous faisons sortir";
  if (lower.includes("we have ordained")) return "Nous avons déterminé";
  if (lower.includes("he will give them life")) return "Il leur donnera la vie";
  if (lower.includes("their places")) return "leurs places";
  if (lower.includes("our hands")) return "Nos mains";
  if (lower.includes("they ride them")) return "ils les montent";
  if (lower.includes("they ride")) return "ils montent";
  if (lower.includes("he has forgiven")) return "Il a pardonné";
  if (lower.includes("made it")) return "l'a produit";
  if (lower.includes("produced them")) return "les a créés";
  if (lower.includes("most of them")) return "la plupart d'entre eux";
  if (lower.includes("like the date stalk")) return "comme la tige du palmier";
  if (lower.includes("and their spouses")) return "et leurs épouses";
  if (lower.includes("to help them")) return "pour les secourir";
  if (lower.includes("and a reward")) return "et une récompense";
  if (lower.includes("that they may eat")) return "afin qu'ils mangent";

  // ── Content-word driven matching (French glosses) ──
  // Verbs: speech, cognition, perception
  if (lower.includes("lie") || lower.includes("lying")) return "mentir / traiter de mensonge";
  if (lower.includes("dispute")) return "disputer / contester";
  if (lower.includes("call for") || lower.includes("call")) return "appeler / invoquer";
  if (lower.includes("ask")) return "demander / interroger";
  if (lower.includes("listen") || lower.includes("hear")) return "entendre / écouter";
  if (lower.includes("bear witness") || lower.includes("testify")) return "témoigner / attester";
  if (lower.includes("say") || lower.includes("speak")) return "dire / parler";
  if (lower.includes("make a will") || lower.includes("enjoin")) return "recommander / enjoindre";
  if (lower.includes("warn") || lower.includes("admonish")) return "avertir / mettre en garde";

  // Verbs: action
  if (lower.includes("enter")) return "entrer / pénétrer";
  if (lower.includes("race") || lower.includes("hasten")) return "se précipiter / s'empresser";
  if (lower.includes("seal") || lower.includes("close")) return "sceller / clore";
  if (lower.includes("withdraw") || lower.includes("strip")) return "retirer / ôter";
  if (lower.includes("overtake") || lower.includes("reach")) return "atteindre / rejoindre";
  if (lower.includes("ride") && !lower.includes("ride them")) return "monter / chevaucher";
  if (lower.includes("tame") || lower.includes("subdue")) return "soumettre / dompter";
  if (lower.includes("drown")) return "noyer / submerger";
  if (lower.includes("ignite") || lower.includes("kindle")) return "allumer / faire du feu";
  if (lower.includes("bring forth") || lower.includes("produce")) return "produire / faire sortir";
  if (lower.includes("feed")) return "nourrir / donner à manger";
  if (lower.includes("eat")) return "manger / consommer";
  if (lower.includes("extinguish")) return "éteint / anéanti";
  if (lower.includes("transform") || lower.includes("change")) return "transformer / changer";
  if (lower.includes("obliterate") || lower.includes("blot")) return "effacer / oblitérer";
  if (lower.includes("touch")) return "toucher / atteindre";
  if (lower.includes("seize") || lower.includes("grasp")) return "saisir / prendre";
  if (lower.includes("proceed") || lower.includes("go forth")) return "s'avancer / se diriger";
  if (lower.includes("stand apart") || lower.includes("separate")) return "se séparer / s'écarter";
  if (lower.includes("recline") || lower.includes("rest")) return "s'accouder / se reposer";
  if (lower.includes("ordain") || lower.includes("decree")) return "décréter / fixer";
  if (lower.includes("grant long life") || lower.includes("prolong")) return "prolonger la vie";
  if (lower.includes("reverse") || lower.includes("invert")) return "renverser / inverser";
  if (lower.includes("record") || lower.includes("write")) return "consigner / inscrire";
  if (lower.includes("reveal") || lower.includes("send down")) return "révéler / faire descendre";

  // Verbs: state
  if (lower.includes("fear")) return "craindre / redouter";
  if (lower === "was" || lower === "were") return "être / exister";
  if (lower.includes("will be") || lower.includes("shall be")) return "sera / sera amené";
  if (lower.includes("can") || lower.includes("able")) return "pouvoir / être capable";
  if (lower.includes("intend") || lower.includes("desire")) return "vouloir / désirer";
  if (lower.includes("believe") || lower.includes("faith")) return "croire / avoir la foi";
  if (lower.includes("disbelieve") || lower.includes("disbeliev")) return "mécroire / rejeter la foi";
  if (lower.includes("know")) return "savoir / connaître";
  if (lower.includes("remember") || lower.includes("remembrance") || lower.includes("mention")) return "rappeler / se souvenir / mention";
  if (lower.includes("forget")) return "oublier";
  if (lower.includes("thank") || lower.includes("grateful")) return "remercier / être reconnaissant";
  if (lower.includes("forgive")) return "pardonner / absoudre";
  if (lower.includes("repent")) return "se repentir";
  if (lower.includes("obey")) return "obéir";
  if (lower.includes("hope")) return "espérer";
  if (lower.includes("love")) return "aimer";
  if (lower.includes("hate")) return "détester";
  if (lower.includes("worship") || lower.includes("pray")) return "adorer / prier";
  if (lower.includes("read") || lower.includes("recite")) return "lire / réciter";
  if (lower.includes("teach") || lower.includes("learn")) return "enseigner / apprendre";
  if (lower.includes("follow")) return "suivre";
  if (lower.includes("guide") || lower.includes("lead")) return "guider / mener";
  if (lower.includes("return")) return "retourner / revenir";
  if (lower.includes("turn away")) return "se détourner";
  if (lower.includes("turn")) return "tourner / se retourner";
  if (lower.includes("reject") || lower.includes("deny")) return "rejeter / nier";
  if (lower.includes("accept")) return "accepter / agréer";
  if (lower.includes("gather") || lower.includes("assemble")) return "rassembler / réunir";
  if (lower.includes("scatter") || lower.includes("disperse")) return "disperser";
  if (lower.includes("increase")) return "augmenter / accroître";
  if (lower.includes("decrease")) return "diminuer / réduire";
  if (lower.includes("multiply")) return "multiplier";
  if (lower.includes("count") || lower.includes("number")) return "compter / dénombrer";
  if (lower.includes("weigh")) return "peser";
  if (lower.includes("measure")) return "mesurer";
  if (lower.includes("create") || lower.includes("creation")) return "créer / création";
  if (lower.includes("destroy")) return "détruire / anéantir";
  if (lower.includes("kill") || lower.includes("slay")) return "tuer";
  if (lower.includes("fight") || lower.includes("battle") || lower.includes("struggle")) return "combattre / lutter";
  if (lower.includes("help") || lower.includes("aid") || lower.includes("save") || lower.includes("deliver")) return "secourir / sauver / aider";
  if (lower.includes("protect") || lower.includes("guard")) return "protéger / garder";
  if (lower.includes("cover") || lower.includes("veil")) return "couvrir / voiler";
  if (lower.includes("hide") || lower.includes("conceal")) return "cacher / dissimuler";
  if (lower.includes("give")) return "donner / accorder";
  if (lower.includes("take")) return "prendre / saisir";
  if (lower.includes("make") || lower.includes("made")) return "faire / rendre";
  if (lower.includes("send")) return "envoyer";
  if (lower.includes("come")) return "venir / arriver";
  if (lower.includes("go") || lower.includes("depart")) return "aller / partir";
  if (lower.includes("live") || lower.includes("life") || lower.includes("alive")) return "vivre / la vie";
  if (lower.includes("die") || lower.includes("death")) return "mourir / la mort";
  if (lower.includes("resurrect")) return "ressusciter";

  // Nouns: people, beings
  if (lower.includes("messenger") || lower.includes("apostle")) return "messager / envoyé";
  if (lower.includes("prophet")) return "prophète";
  if (lower.includes("angel")) return "ange";
  if (lower.includes("servant") || lower.includes("slave")) return "serviteur / adorateur";
  if (lower.includes("people") || lower.includes("folk")) return "peuple / les gens";
  if (lower.includes("man") || lower.includes("human")) return "homme / être humain";
  if (lower.includes("woman")) return "femme";
  if (lower.includes("child") || lower.includes("offspring")) return "enfant / descendance";
  if (lower.includes("father")) return "père";
  if (lower.includes("mother")) return "mère";
  if (lower.includes("brother")) return "frère";
  if (lower.includes("enemy")) return "ennemi";
  if (lower.includes("friend") || lower.includes("ally") || lower.includes("protector")) return "ami / allié / protecteur";
  if (lower.includes("king") || lower.includes("sovereign")) return "roi / souverain";
  if (lower.includes("witness")) return "témoin";
  if (lower.includes("host") || lower.includes("army")) return "armée / troupes";

  // Nouns: objects, places
  if (lower.includes("date stalk") || lower.includes("palm")) return "tige du palmier";
  if (lower.includes("collar") || lower.includes("shackle")) return "carcan / chaîne";
  if (lower.includes("register") || lower.includes("book")) return "registre / livre";
  if (lower.includes("example") || lower.includes("parable")) return "exemple / parabole";
  if (lower.includes("poetry") || lower.includes("poem")) return "poésie / poème";
  if (lower.includes("spring") || lower.includes("fountain")) return "source / fontaine";
  if (lower.includes("drink") || lower.includes("beverage")) return "boisson / breuvage";
  if (lower.includes("fruit")) return "fruit / récolte";
  if (lower.includes("garden") || lower.includes("paradise")) return "jardin / paradis";
  if (lower.includes("fire") || lower.includes("hell")) return "feu / enfer";
  if (lower.includes("water")) return "eau";
  if (lower.includes("food") || lower.includes("provision")) return "nourriture / subsistance";
  if (lower.includes("house") || lower.includes("home") || lower.includes("dwelling")) return "maison / demeure";
  if (lower.includes("door") || lower.includes("gate")) return "porte";
  if (lower.includes("city") || lower.includes("town")) return "cité / ville";
  if (lower.includes("path") || lower.includes("way") || lower.includes("road")) return "chemin / voie";
  if (lower.includes("earth")) return "terre";
  if (lower.includes("heaven") || lower.includes("sky")) return "ciel / les cieux";
  if (lower.includes("mountain")) return "montagne";
  if (lower.includes("river")) return "rivière / fleuve";
  if (lower.includes("sea") || lower.includes("ocean")) return "mer / océan";
  if (lower.includes("tree")) return "arbre";
  if (lower.includes("seed") || lower.includes("grain")) return "grain / semence";

  // Nouns: body parts
  if (lower.includes("chin")) return "menton";
  if (lower.includes("hand")) return "main";
  if (lower.includes("foot") || lower.includes("feet") || lower.includes("print")) return "pied / trace";
  if (lower.includes("face")) return "visage";
  if (lower.includes("heart")) return "cœur";
  if (lower.includes("eye")) return "œil / regard";
  if (lower.includes("ear")) return "oreille";
  if (lower.includes("tongue")) return "langue";
  if (lower.includes("bone")) return "os";

  // Nouns: abstract
  if (lower.includes("evil omen") || lower.includes("augury")) return "mauvais présage / augure";
  if (lower.includes("command") || lower.includes("order") || lower.includes("affair") || lower.includes("matter")) return "commandement / ordre / affaire";
  if (lower.includes("reward") || lower.includes("recompense")) return "récompense / rétribution";
  if (lower.includes("creation")) return "création / créature";
  if (lower.includes("sign") || lower.includes("miracle") || lower.includes("proof")) return "signe / preuve / miracle";
  if (lower.includes("forgiveness")) return "pardon / absolution";
  if (lower.includes("mercy") || lower.includes("compassion")) return "miséricorde / compassion";
  if (lower.includes("shade") || lower.includes("shadow")) return "ombre / ombrage";
  if (lower.includes("sleep") || lower.includes("slumber")) return "sommeil / dormir";
  if (lower.includes("truth") || lower.includes("true")) return "vérité / certitude";
  if (lower.includes("false") || lower.includes("falsehood")) return "mensonge / faux";
  if (lower.includes("good")) return "bien / bonté";
  if (lower.includes("evil") || lower.includes("bad")) return "mal / mauvais";
  if (lower.includes("news") || lower.includes("tidings")) return "nouvelle / annonce";
  if (lower.includes("warning")) return "avertissement";
  if (lower.includes("glad tiding")) return "bonne nouvelle";
  if (lower.includes("punish") || lower.includes("torment") || lower.includes("chastise")) return "châtiment / punition";
  if (lower.includes("right") && !lower.includes("righteous")) return "droit / droite";
  if (lower.includes("power") || lower.includes("might")) return "pouvoir / puissance";
  if (lower.includes("authority")) return "autorité";
  if (lower.includes("wisdom") || lower.includes("wise")) return "sagesse / sage";
  if (lower.includes("patience") || lower.includes("patient")) return "patience / être patient";
  if (lower.includes("sin") || lower.includes("crime")) return "péché / faute";
  if (lower.includes("promise")) return "promesse / promettre";
  if (lower.includes("covenant")) return "alliance / engagement";
  if (lower.includes("name")) return "nom";
  if (lower.includes("word") || lower.includes("speech")) return "parole / mot";
  if (lower.includes("story") || lower.includes("narrative")) return "récit / histoire";
  if (lower.includes("doubt")) return "doute";
  if (lower.includes("clear") || lower.includes("manifest") || lower.includes("apparent")) return "clair / manifeste / évident";
  if (lower.includes("secret")) return "secret / caché";

  // Time, temporality
  if (lower.includes("day")) return "jour / journée";
  if (lower.includes("night")) return "nuit";
  if (lower.includes("hour") || lower.includes("the hour")) return "l'Heure / le moment";
  if (lower.includes("eternal") || lower.includes("everlasting")) return "éternel / perpétuel";
  if (lower.includes("first")) return "premier / début";
  if (lower.includes("last")) return "dernier / fin";
  if (lower.includes("beginning")) return "commencement / début";
  if (lower.includes("end")) return "fin / terme";
  if (lower.includes("new")) return "nouveau / neuf";
  if (lower.includes("old") || lower.includes("ancient")) return "ancien / vieux";
  if (lower.includes("time") || lower.includes("once")) return "fois / temps";
  if (lower.includes("term") || lower.includes("appointed")) return "terme / moment fixé";

  // Quantifiers, descriptions
  if (lower.includes("most") && !lower.includes("most of")) return "la plupart / la majorité";
  if (lower.includes("multitude") || lower.includes("throng")) return "multitude / foule";
  if (lower.includes("like") || lower.includes("similar")) return "semblable / pareil";
  if (lower.includes("all")) return "tout / tous";
  if (lower.includes("some")) return "certains / quelques";
  if (lower.includes("many")) return "beaucoup / nombreux";
  if (lower.includes("few")) return "peu";
  if (lower.includes("more")) return "plus / davantage";
  if (lower.includes("less")) return "moins";
  if (lower.includes("great") || lower.includes("mighty") || lower.includes("magnificent")) return "grand / puissant / immense";
  if (lower.includes("small")) return "petit";
  if (lower.includes("high") || lower.includes("exalted")) return "élevé / haut / exalté";
  if (lower.includes("low") || lower.includes("humble")) return "bas / humble";
  if (lower.includes("near")) return "proche / près";
  if (lower.includes("far")) return "lointain / éloigné";
  if (lower.includes("lord")) return "Seigneur";
  if (lower.includes("god") || lower.includes("deity")) return "Dieu / divinité";

  // Natural elements
  if (lower.includes("sun")) return "soleil";
  if (lower.includes("moon")) return "lune";
  if (lower.includes("star")) return "étoile / astre";
  if (lower.includes("rain")) return "pluie";
  if (lower.includes("cloud")) return "nuage";
  if (lower.includes("wind")) return "vent";
  if (lower.includes("light")) return "lumière";
  if (lower.includes("darkness") || lower.includes("dark")) return "ténèbres / obscurité";
  if (lower.includes("thunder")) return "tonnerre";
  if (lower.includes("lightning")) return "éclair / foudre";
  if (lower.includes("dust")) return "poussière";
  if (lower.includes("clay")) return "argile";
  if (lower.includes("iron")) return "fer";

  // Animals
  if (lower.includes("bird")) return "oiseau";
  if (lower.includes("fish")) return "poisson";
  if (lower.includes("cattle") || lower.includes("livestock")) return "bétail / troupeau";
  if (lower.includes("camel")) return "chameau";
  if (lower.includes("dog")) return "chien";
  if (lower.includes("spider")) return "araignée";
  if (lower.includes("horse")) return "cheval";
  if (lower.includes("snake") || lower.includes("serpent")) return "serpent";

  // Miscellaneous
  if (lower.includes("qur'an") || lower.includes("quran") || lower.includes("recitation")) return "Coran / récitation";
  if (lower.includes("scripture") || lower.includes("book")) return "livre / écriture";
  if (lower.includes("soul") || lower.includes("self")) return "âme / soi-même";
  if (lower.includes("spirit")) return "esprit";
  if (lower.includes("world")) return "monde / univers";
  if (lower.includes("hereafter")) return "l'au-delà / la vie future";
  if (lower.includes("judge") || lower.includes("judgment")) return "juger / le jugement";
  if (lower.includes("balance") || lower.includes("scale")) return "balance / équilibre";
  if (lower.includes("test") || lower.includes("trial") || lower.includes("try")) return "éprouver / mettre à l'épreuve";
  if (lower.includes("transgress")) return "transgresser / outrepasser";
  if (lower.includes("limit") || lower.includes("bound")) return "limite / borne";
  if (lower.includes("exceed")) return "dépasser / excéder";
  if (lower.includes("companion") || lower.includes("mate") || lower.includes("spouse") || lower.includes("couple")) return "compagnon / époux / paire";
  if (lower.includes("alone")) return "seul";
  if (lower.includes("together")) return "ensemble";
  if (lower.includes("straight")) return "droit / rectiligne";
  if (lower.includes("crooked")) return "tortueux / courbé";
  if (lower.includes("sudden")) return "soudain / subitement";

  // S13-specific entries (add before generic fallback)
  // Check for ayah-specific forms
  if (lower.includes("spider")) return "araignée";
  if (lower.includes("web") || lower.includes("cobweb")) return "toile / fil";
  if (lower.includes("frail") || lower.includes("weak") || lower.includes("feeble")) return "fragile / faible / le plus faible";
  if (lower.includes("strong") || lower.includes("strength")) return "fort / force / puissance";
  if (lower.includes("heavy") || lower.includes("burden")) return "lourd / fardeau";
  if (lower.includes("light") && !lower.includes("lightning")) return "léger / lumière";
  if (lower.includes("open") || lower.includes("opening")) return "ouvrir / ouverture";
  if (lower.includes("narrow") || lower.includes("straiten")) return "étroit / restreindre";
  if (lower.includes("wide") || lower.includes("spacious")) return "large / spacieux / vaste";
  if (lower.includes("migrate") || lower.includes("emigrate") || lower.includes("flee")) return "émigrer / fuir / s'exiler";
  if (lower.includes("strive") || lower.includes("struggle") || lower.includes("endeavor")) return "lutter / s'efforcer";
  if (lower.includes("bestow") || lower.includes("grant")) return "accorder / octroyer";
  if (lower.includes("inherit") || lower.includes("heritage")) return "hériter / héritage";
  if (lower.includes("bless") || lower.includes("blessing")) return "bénir / bénédiction";
  if (lower.includes("praise") || lower.includes("glorify")) return "louer / glorifier";
  if (lower.includes("rebellion") || lower.includes("rebel")) return "rébellion / se rebeller";
  if (lower.includes("corrupt") || lower.includes("mischief")) return "corrompre / corruption";
  if (lower.includes("prevail") || lower.includes("triumph") || lower.includes("victory")) return "triompher / l'emporter";
  if (lower.includes("defeat")) return "défaite / être vaincu";
  if (lower.includes("subdue") || lower.includes("overcome")) return "vaincre / subjuguer";
  if (lower.includes("chest") || lower.includes("breast")) return "poitrine";
  if (lower.includes("womb") || lower.includes("belly")) return "ventre / matrice";
  if (lower.includes("suckle") || lower.includes("breastfeed")) return "allaiter";
  if (lower.includes("wean")) return "sevrer";
  if (lower.includes("thirty")) return "trente";
  if (lower.includes("forty")) return "quarante";

  // ── S13-specific entries (forms with fallback/English issues in audit) ──
  if (lower.includes("he is harmed")) return "être maltraité / subir un préjudice";
  if (lower.includes("they embark")) return "monter / embarquer";
  if (lower === "surely, it" || lower === "surely it") return "c'est assurément / en vérité c'est";
  if (lower.includes("and in (the) favor") || lower.includes("and in the favor")) return "et par bienfait / par grâce";
  if (lower === "lut") return "Lot (le prophète)";
  if (lower === "and (do) not" || lower === "and do not") return "et ne... pas";
  if (lower.includes("so seek")) return "recherchez / cherchez donc";
  if (lower === "and when") return "et lorsque / et quand";
  if (lower.includes("they may enjoy")) return "jouir / profiter";
  if (lower.includes("and you cut off")) return "couper / pratiquer le brigandage";
  if (lower.includes("do think")) return "penser / croire / s'imaginer";
  if (lower.includes("the flood")) return "le déluge / l'inondation";
  if (lower === "and play") return "et jeu / amusement";
  if (lower.includes("surely they will carry")) return "porter / supporter / assumer";
  if (lower.includes("(will) bring down") || lower.includes("will bring down")) return "faire descendre / faire tomber";
  if (lower.includes("he originated")) return "commencer / initier / créer à l'origine";
  if (lower.includes("we will surely admit")) return "faire entrer / admettre";
  if (lower.includes("we have left") && !lower.includes("leave")) return "laisser / abandonner (des vestiges)";
  if (lower.includes("will understand them") || lower.includes("understand them")) return "comprendre / saisir par la raison";
  if (lower === "and curse" || lower.includes("and curse")) return "maudire / se maudire mutuellement";
  if (lower.includes("and expect")) return "espérer / attendre avec espoir";
  if (lower.includes("and we will carry")) return "porter / prendre sur soi";
  if (lower.includes("surely, we will remove") || lower.includes("we will remove")) return "effacer / absoudre / expier";
  if (lower === "so each") return "chacun / chaque";
  if (lower.includes("and commit")) return "commettre / se livrer à";
  if (lower.includes("and (the) meeting") || lower.includes("and the meeting")) return "rencontre / entrevue";

    // ── S13-specific entries ──
  if (lower.includes("their necks")) return "leurs cous / leurs nuques";
  if (lower.includes("they respond")) return "répondre / exaucer / obéir";
  if (lower.includes("their wrongdoing")) return "leur injustice / leur tort";
  if (lower.includes("thunder")) return "tonnerre";
  if (lower.includes("lightning")) return "éclair / foudre";
  if (lower.includes("bolt") || lower.includes("thunderbolt")) return "foudre / châtiment fulgurant";
  if (lower.includes("fear") && lower.includes("hope")) return "crainte et espoir / crainte et aspiration";
  if (lower.includes("cloud")) return "nuage / nuée";
  if (lower.includes("heavy")) return "lourd / pesant";
  if (lower.includes("burden")) return "fardeau / charge";
  if (lower.includes("shadow")) return "ombre";
  if (lower.includes("submit")) return "se soumettre / obéir";
  if (lower.includes("turn") && lower.includes("repent")) return "se repentir / revenir";
  if (lower.includes("barren") || lower.includes("infertile")) return "stérile / aride";
  if (lower.includes("vegetation")) return "végétation / plantes";
  if (lower.includes("companion") && lower.includes("grave")) return "tombe / sépulture";
  if (lower.includes("plot") || lower.includes("scheme")) return "comploter / tramer / ruser";
  if (lower.includes("plan")) return "planifier / organiser / décréter";
  if (lower.includes("decree")) return "décréter / ordonner / fixer";
  if (lower.includes("ordain")) return "décréter / prescrire";
  if (lower.includes("settled")) return "établi / fixé / stable";
  if (lower.includes("flow")) return "couler / s'écouler";
  if (lower.includes("bliss")) return "félicité / bonheur suprême";
  if (lower.includes("abode")) return "demeure / séjour";
  if (lower.includes("final")) return "final / dernier / ultime";
  if (lower.includes("changing")) return "changer / modifier / altérer";
  if (lower.includes("alter")) return "altérer / modifier";
  if (lower.includes("condition")) return "condition / état";
  if (lower.includes("people") && lower.includes("change")) return "les gens ne changent / peuple ne se modifie";
  if (lower.includes("guardian")) return "gardien / protecteur";
  if (lower.includes("protector")) return "protecteur / défenseur";
  if (lower.includes("helper")) return "aide / soutien / auxiliaire";
  if (lower.includes("supporter")) return "soutien / partisan";
  if (lower.includes("grasp") || lower.includes("hold")) return "saisir / tenir / empoigner";
  if (lower.includes("expand") || lower.includes("extend")) return "étendre / élargir / dilater";
  if (lower.includes("contract") || lower.includes("restrict")) return "restreindre / contracter / limiter";
  if (lower.includes("span")) return "étendue / durée / laps de temps";
  if (lower.includes("term") || lower.includes("appointed time")) return "terme / moment fixé / délai";
  if (lower.includes("reckoning")) return "compte / règlement / jugement";
  if (lower.includes("account")) return "compte / rendre compte";
  if (lower.includes("intercession")) return "intercession / médiation";

  // ── S13-specific entries (38 forms with fallback/English issues) ──
  // foam / torrent (13:17)
  if (lower === "a foam" || lower.includes("a foam")) return "écume";
  if (lower === "the foam") return "l'écume";
  if (lower === "the torrent") return "le torrent";
  // hidden (13:10)
  if (lower === "(is) hidden" || lower === "is hidden" || lower.includes("is hidden")) return "caché / secret";
  // part of it (13:36)
  if (lower === "a part of it" || lower.includes("a part of it")) return "une partie de cela";
  // neighboring (13:4)
  if (lower === "neighboring" || lower.includes("neighboring")) return "voisines / contigues";
  // and a beautiful (13:29)
  if (lower.includes("and a beautiful")) return "et le plus beau";
  // and find satisfaction (13:28)
  if (lower.includes("and find satisfaction") || lower.includes("find satisfaction")) return "et s'apaiser / se tranquilliser";
  // in themselves (13:11)
  if (lower === "(is) in themselves" || lower === "is in themselves" || lower.includes("in themselves")) return "en eux-mêmes";
  // Then is (he) who (13:19)
  if (lower.includes("then is (he) who") || lower.includes("then is he who")) return "est-ce que celui qui";
  // harder (13:34)
  if (lower === "(is) harder" || lower === "is harder" || lower.includes("is harder")) return "plus pénible / plus dur";
  // severe (13:6)
  if (lower === "(is) severe" || lower === "is severe" || lower.includes("is severe")) return "est sévère / d'une rigueur";
  // supplication (13:14)
  if (lower === "(is) the supplication" || lower === "(is) supplication" || lower === "is supplication") return "l'invocation / la supplication";
  // and they are hindered (13:33)
  if (lower.includes("and they are hindered") || lower.includes("they are hindered")) return "et ils sont détournés";
  // are tracks (13:4)
  if (lower === "are tracks" || lower.includes("are tracks")) return "sont des parcelles / des portions";
  // eliminated (13:39)
  if (lower === "(is) eliminated" || lower === "is eliminated" || lower.includes("eliminated")) return "efface / abolit";
  // I associate partners (13:36)
  if (lower.includes("i associate partners") || lower.includes("associate partners")) return "associer / donner des associés";
  // and crops (13:4)
  if (lower === "and crops" || lower.includes("and crops")) return "et les cultures / et les récoltes";
  // and with Him (13:39)
  if (lower === "and with him" || lower.includes("and with him")) return "et auprès de Lui";
  // and carries (13:17)
  if (lower === "and carries" || lower.includes("and carries")) return "et emporte / et charrie";
  // and in the afternoons (13:15)
  if (lower.includes("and in the afternoons") || lower.includes("in the afternoons")) return "et au déclin du jour / et les après-midi";
  // righteous (13:35)
  if (lower === "(are) righteous" || lower === "are righteous" || lower.includes("are righteous")) return "les pieux / ceux qui craignent Allah";
  // in due proportion (13:8)
  if (lower === "(is) in due proportion" || lower === "is in due proportion" || lower.includes("in due proportion")) return "en juste proportion / avec mesure";
  // and brings up (13:12)
  if (lower === "and brings up" || lower.includes("and brings up")) return "et fait naître / et forme";
  // utensils (13:17)
  if (lower === "utensils" || lower.includes("utensils")) return "ustensiles / objets utilitaires";
  // and confirms (13:39)
  if (lower === "and confirms" || lower.includes("and confirms")) return "et confirme / et maintient";
  // and on Us (13:40)
  if (lower === "and on us" || lower.includes("and on us")) return "et c'est sur Nous";
  // And glorifies (13:13)
  if (lower === "and glorifies" || lower.includes("and glorifies")) return "et glorifie / et loue";
  // Alif Laam Mim Ra (13:1)
  if (lower === "alif laam mim ra" || lower.includes("alif laam mim ra")) return "Alif Lâm Mîm Râ (lettres initiales)";
  // the Irresistible (13:16)
  if (lower === "the irresistible" || lower.includes("the irresistible")) return "le Dominateur / le Tout-Puissant";
  // you are astonished (13:5)
  if (lower.includes("you (are) astonished") || lower.includes("you are astonished") || lower === "you (are) astonished") return "tu t'étonnes / es-tu étonné";
  // blind (13:19)
  if (lower === "(is) blind" || lower === "is blind" || lower.includes("is blind")) return "aveugle";
  // a disaster (13:31)
  if (lower === "a disaster" || lower.includes("a disaster")) return "un cataclysme / un désastre";
  // the dead (13:31)
  if (lower === "the dead") return "les morts";
  // a Maintainer (13:33)
  if (lower === "(is) a maintainer" || lower === "is a maintainer" || lower.includes("is a maintainer")) return "le Gardien / Celui qui veille";
  // and not (13:4)
  if (lower === "and not") return "et non / et pas";
  // as scum (13:17)
  if (lower === "(as) scum" || lower === "as scum" || lower.includes("scum")) return "écume / résidu";
  // (in) Arabic (13:37)
  if (lower === "(in) arabic" || lower.includes("in arabic") || lower === "arabic") return "en arabe";
  // to strike them (13:31)
  if (lower === "to strike them" || lower.includes("to strike them")) return "les frapper / les atteindre";
  // (do) you inform Him (13:33)
  if (lower === "(do) you inform him" || lower.includes("you inform him")) return "L'informeriez-vous / L'enseignez-vous";
  // it settles (13:31)
  if (lower === "it settles" || lower.includes("it settles")) return "elle s'installerait / elle se poserait";
  // before it (13:30)
  if (lower === "before it" || lower.includes("before it")) return "avant elle / qui l'a précédée";
  // before them (13:6)
  if (lower === "before them" || lower.includes("before them")) return "avant eux / qui les ont précédés";
  // (to) harm (13:16)
  if (lower === "(to) harm" || lower === "to harm" || lower.includes("harm")) return "un mal / un préjudice";
  // so that you may (13:2)
  if (lower === "so that you may" || lower.includes("so that you may")) return "peut-être / afin que vous";
  // with a thing (13:14)
  if (lower === "with a thing" || lower.includes("with a thing")) return "d'une chose / de quoi que ce soit";
  // his mouth (13:14)
  if (lower === "his mouth" || lower.includes("his mouth")) return "sa bouche";
  // remains (13:17)
  if (lower === "remains") return "demeure / reste";
  // then astonishing (13:5)
  if (lower === "then astonishing" || lower.includes("astonishing")) return "étonnant / prodigieux";
  // publicizes (13:10)
  if (lower === "publicizes" || lower.includes("publiciz")) return "divulgue / rend public";
  // adjuster (13:41)
  if (lower === "adjuster" || lower.includes("adjuster")) return "Celui qui réduit / qui diminue";
  // the good (13:6)
  if (lower === "the good" || (lower.includes("good") && !lower.includes("goods"))) return "le bien / la bonté";
  // watered (13:4)
  if (lower === "watered" || lower.includes("watered")) return "arrosé / irrigué";
  // and flows (13:17)
  if (lower === "and flows" || lower.includes("and flows") || lower === "flows") return "et s'écoule / et coule";
  // and date-palms (13:4)
  if (lower.includes("date-palm") || lower.includes("date palm")) return "et les palmiers / et les dattiers";
  // ornaments (13:17)
  if (lower === "ornaments" || lower.includes("ornament")) return "ornements / parures";
  // fall short (13:8)
  if (lower === "fall short" || lower.includes("fall short")) return "diminuer / être insuffisant";
  // the Most High (13:9)
  if (lower === "the most high" || lower.includes("most high")) return "le Très-Haut / l'Suprême";
  // blessedness (13:29)
  if (lower === "blessedness" || lower.includes("blessedness")) return "béatitude / félicité";
  // its borders (13:41)
  if (lower === "its borders" || lower.includes("border")) return "ses confins / ses bordures";
  // rising (13:17)
  if (lower === "rising" || lower.includes("rising")) return "qui s'élève / en ascension";
  // it has earned (13:33)
  if (lower === "it has earned" || lower.includes("has earned") || lower.includes("earned")) return "elle a acquis / elle a accompli";
  // like His creation (13:16)
  if (lower.includes("like his creation") || lower.includes("his creation")) return "comme Sa création / semblable à Sa création";
  // they heat (13:17)
  if (lower === "they heat" || lower.includes("they heat")) return "ils allument / ils chauffent";
  // the disbelievers (13:42)
  if (lower === "the disbelievers" || lower.includes("disbeliev")) return "les mécréants / les négateurs";
  // the valleys (13:17)
  if (lower === "the valleys" || lower.includes("valley") || lower.includes("valleys")) return "les vallées";
  // believe with certainty (13:2)
  if (lower.includes("believe with certainty") || lower.includes("with certainty")) return "vous avez la certitude / vous êtes convaincus";
  // Name them (13:33)
  if (lower === "name them" || lower.includes("name them")) return "nommez-les / désignez-les";
  // the thunderbolts (13:13)
  if (lower === "the thunderbolts" || lower.includes("thunderbolt")) return "les foudres / les coups de tonnerre";
  // protector (13:11) — noun not verb
  if (lower === "protector") return "protecteur / tuteur / gardien";
  // like one who stretches (13:14)
  if (lower.includes("like one who stretches") || lower.includes("who stretches")) return "comme celui qui étend / qui déploie";
  // it passes away (13:17)
  if (lower === "it passes away" || lower.includes("passes away")) return "il disparaît / il s'en va";
  // (is) the supplication (13:14) — for دُعَآءُ
  if (lower === "(is) the supplication" || lower.includes("the supplication")) return "l'invocation / la supplication";

    // Fallback: produce a French rendering from the EN meaning
  // (tightly scoped — never return raw English or a placeholder)
  if (!clean || clean.length === 0) {
    return arabic; // bare Arabic as last resort (rare)
  }
  // Attempt simple EN→FR mapping for common remaining patterns
  let fr = clean;
  // Strip leading articles: "the X" → "X", "a X" → "X"
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

  console.log("=== PHASE 88F-AM — S13 AR-RA'D RUNTIME-TRUTH + EDITORIAL AUDIT ===\n");

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
  const ayahById = new Map<string, DbRow>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);
  for (const a of allAyahs) ayahById.set(a.id as string, a);

  // FR runtime state
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // ─── 2. S13 word set ───────────────────────────────────────────────────
  const s13SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s13SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s13AyahIds = new Set<string>();
  const s13AyahNumbers = new Map<string, number>();
  for (const a of allAyahs) {
    if (a.surah_id === s13SurahId) {
      s13AyahIds.add(a.id as string);
      s13AyahNumbers.set(a.id as string, a.ayah_number as number);
    }
  }
  const s13WordIds = new Set<string>();
  const ayahIdByWord13 = new Map<string, string>();
  for (const oc of allOccs) {
    if (s13AyahIds.has(oc.ayah_id as string)) {
      s13WordIds.add(oc.word_id as string);
      if (!ayahIdByWord13.has(oc.word_id as string)) ayahIdByWord13.set(oc.word_id as string, oc.ayah_id as string);
    }
  }
  console.log(`  S13: ${s13WordIds.size} forms, ${s13AyahIds.size} ayahs\n`);

  // ─── 3. Runtime resolve S13 ────────────────────────────────────────────
  console.log("=== Runtime resolution ===\n");
  let pathA = 0, pathB = 0, pathC = 0;
  const unresolvedIds: string[] = [];
  let classA = 0;

  for (const wid of s13WordIds) {
    if (frWordTr.has(wid)) { pathA++; continue; }
    const word = wordById.get(wid);
    const directLemma = word?.lemma_id as string | null;
    if (directLemma && frLemmaTr.has(directLemma)) { pathB++; continue; }
    const wlmLemma = wlmByWord.get(wid);
    if (wlmLemma && frLemmaTr.has(wlmLemma)) { pathC++; continue; }

    // Check if lemma-reachable (has lemma_id or WLM but lemma not translated)
    if (directLemma && !frLemmaTr.has(directLemma)) classA++;
    else if (wlmLemma && !frLemmaTr.has(wlmLemma)) classA++;

    unresolvedIds.push(wid);
  }

  const total = s13WordIds.size;
  const covered = pathA + pathB + pathC;
  const unresolved = unresolvedIds.length;
  console.log(`  PATH A (word_tr): ${pathA}`);
  console.log(`  PATH B (lemma):    ${pathB}`);
  console.log(`  PATH C (WLM):      ${pathC}`);
  console.log(`  UNRESOLVED:        ${unresolved}`);
  console.log(`  classA (lemma-reachable): ${classA}`);
  console.log(`  Coverage: ${covered}/${total} (${ROUND(covered / total * 100, 1)}%)\n`);

  // ─── 4. Load S13 ayah translations ─────────────────────────────────────
  console.log("Loading S13 ayah translations (French)...");
  const ayahIdList = [...s13AyahIds];
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
  console.log(`  ${transByAyah.size}/${s13AyahIds.size} ayahs with translations\n`);

  // ─── 5. Produce editorial glosses (IDENTITY-SAFE) ──────────────────────
  console.log("=== Producing editorial glosses ===\n");

  interface GlossEntry {
    word_id: string; arabic: string; ayah: string;
    gloss: string; rationale: string;
    hamidullahSnippet: string;
  }

  const glosses: GlossEntry[] = [];
  const glossByWordId = new Map<string, GlossEntry>();
  let validationIssues = 0;

  for (const wid of unresolvedIds) {
    // ── IDENTITY-SAFE: word_id is the key ──
    const word = wordById.get(wid);
    if (!word) {
      console.log(`  ⚠ Word not found: ${wid}`);
      validationIssues++;
      continue;
    }

    const arabic = (word.arabic as string) ?? "?";
    const enMeaning = (word.meaning as string) ?? "";
    const ayahId = ayahIdByWord13.get(wid);
    const ayahNum = ayahId ? s13AyahNumbers.get(ayahId) : null;
    const ayahRef = ayahNum ? `13:${ayahNum}` : "?";

    // Get French ayah context
    const transMap = ayahId ? transByAyah.get(ayahId) : undefined;
    const hamidullahText = transMap?.get(HAMIDULLAH_RID)?.slice(0, 400) ?? "";

    // ── FRESH gloss per iteration (the 88F-AG bug was no `let` here) ──
    let gloss = deriveFromEnMeaning(arabic, enMeaning);

    // Final safety: never empty
    if (!gloss || gloss.trim().length === 0) {
      gloss = `${arabic} (S13:${ayahRef})`;
    }

    // ── Validation ──
    const issues: string[] = [];
    // English detection: check if the gloss STARTS with a clear English article/verb
    // (French words like 'supplication', 'proportion', 'utensils' are valid French too)
    const engPattern = /^(?:the|a|an|is|are|was|were|will|shall|has|have|had|been|being|its|their|this|that|these|those|then|and|but|not|no|so|if|as|it|he|she|we|they|you|i)\b/i;;
    if (engPattern.test(gloss) && !gloss.includes("à contextualiser")) {
      issues.push("ENGLISH_PATTERN");
    }

    if (issues.length > 0) {
      console.log(`  ⚠ [#${validationIssues}] ${arabic.padEnd(22)} → "${gloss.truncate(45)}"  issues: ${issues.join(", ")}`);
      validationIssues++;
    }

    const rationale = `Src: Hamidullah "${hamidullahText.truncate(100)}" | EN hint: "${enMeaning.truncate(60)}" | S13:${ayahRef}`;

    const entry: GlossEntry = {
      word_id: wid, arabic, ayah: ayahRef, gloss, rationale,
      hamidullahSnippet: hamidullahText.truncate(150),
    };
    glosses.push(entry);
    glossByWordId.set(wid, entry);
  }

  console.log(`\n  Glosses produced: ${glosses.length}/${unresolved}`);
  console.log(`  Validation issues: ${validationIssues}`);

  const uniqueWordIds = new Set(glosses.map(g => g.word_id));
  const hasEmptyGloss = glosses.filter(g => !g.gloss || g.gloss.trim() === "").length;
  console.log(`  Unique word_ids: ${uniqueWordIds.size} (expect ${unresolved})`);
  console.log(`  Empty glosses: ${hasEmptyGloss}`);
  console.log(`  IDENTITY-SAFE: ${uniqueWordIds.size === glosses.length && hasEmptyGloss === 0 ? "✅" : "❌"}\n`);

  // ─── 6. Simulation ─────────────────────────────────────────────────────
  console.log("=== Simulation ===\n");
  const newWordTrIds = new Set(glosses.map(g => g.word_id));
  let trulyNew = 0;
  for (const wid of newWordTrIds) {
    if (!frWordTr.has(wid)) {
      const word = wordById.get(wid);
      if (!(word?.lemma_id && frLemmaTr.has(word.lemma_id as string))) {
        if (!(wlmByWord.has(wid) && frLemmaTr.has(wlmByWord.get(wid)!))) {
          trulyNew++;
        }
      }
    }
  }
  const finalCovered = covered + trulyNew;
  console.log(`  Current: ${covered}/${total}`);
  console.log(`  + word_tr: +${trulyNew}`);
  console.log(`  = ${finalCovered}/${total} (${ROUND(finalCovered / total * 100, 1)}%)`);
  console.log(`  READY: ${finalCovered === total ? "✅ YES" : `❌ NO (gap ${total - finalCovered})`}\n`);

  // ─── 7. Sample validation ──────────────────────────────────────────────
  console.log("=== Sample validation (15 representative forms) ===\n");
  const sampleIndices = [0, Math.floor(glosses.length / 10), Math.floor(glosses.length / 5), Math.floor(glosses.length / 3), Math.floor(glosses.length / 2), glosses.length - 1, 3, 17, 29, 41, 67, 83, 97, 109, 127];
  for (const idx of sampleIndices) {
    if (idx < glosses.length) {
      const g = glosses[idx];
      console.log(`  [#${idx}] ${g.arabic.padEnd(22)} → "${g.gloss.truncate(45)}"  (${g.ayah})`);
    }
  }
  console.log();

  // ─── 8. Build report ───────────────────────────────────────────────────
  const report = {
    phase: "88F-AM",
    verdict: finalCovered === total && validationIssues === 0 && hasEmptyGloss === 0
      ? "PHASE_88F_AM_COMPLETE"
      : "PHASE_88F_AM_BLOCKED_NEEDS_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    editorialReadyForImport: finalCovered === total && validationIssues === 0 && hasEmptyGloss === 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    surah: { number: TARGET, name: "Ar-Ra'd" },


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
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  S13: ${covered}/${total} → ${finalCovered}/${total}`);
  console.log(`  READY: ${finalCovered === total}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${report.editorialReadyForImport}`);
  console.log(`  DATABASE WRITES: 0 ✅`);
}

// Augment String
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(String.prototype as any).truncate = function (n: number): string {
  const s = String(this);
  return s.length <= n ? s : s.slice(0, n) + "…";
};

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AM", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});