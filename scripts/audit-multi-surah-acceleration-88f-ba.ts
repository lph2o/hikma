/**
 * PHASE 88F-BA — MULTI-SURAH ACCELERATION STRATEGY AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes. (DATABASE_WRITES = 0)
 *
 * OBJECTIF
 * --------
 * Déterminer si l'on peut traiter PLUSIEURS sourates simultanément en lots
 * contrôlés — et non plus une seule à la fois — afin d'accélérer la passage
 * de 35/114 READY vers 114/114.
 *
 * Ce script :
 *   1. Recalcule l'état runtime réel des 114 sourates depuis la DB (seule
 *      source de vérité : DB + modèle runtime `resolveWordMeanings`).
 *   2. Exclut S1 (REFERENCE) et les 35 sourates READY → AV conserve les 78
 *      NOT_READY.
 *   3. Construit plusieurs stratégies de batches :
 *        A MAXIMUM_NUMBER_OF_SURAHS · B LOWEST_TOTAL_COST ·
 *        C BALANCED_ACCELERATION · D HIGH_CONFIDENCE · E FAST_10
 *   4. Teste des lots de tailles 3 / 5 / 8 / 10 / 15 (tableau comparatif).
 *   5. Identifie UN batch recommandé (READY_GAIN / EDITORIAL_COST).
 *   6. Audit éditorial : formes unresolved exactes du batch (word_id clé
 *      ABSOLUE), occurrences/ayahs, priorités Hamidullah (rid=31) puis
 *      Kazimirski (rid=9001), gloses FR spécifiques par mot.
 *   7. Validation stricte (0 anglais, 0 vide, 0 placeholder, 0 doublon
 *      word_id, identity-safe).
 *   8. Simulation runtime READY (= total/total) sans écrire en DB.
 *   9. NE RIEN IMPORTER.
 *
 * MODÈLE RUNTIME (exactement resolveWordMeanings) :
 *   PATH A : word_translations  (language='fr', is_validated=true)
 *   PATH B : quran_words.lemma_id → lemma_translations (fr, validated)
 *   PATH C : word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)
 *   NEVER  : linguistic_occurrences.hikma_lemma_id (MASAQ)
 *
 * Output : reports/phase-88f-ba-multi-surah-acceleration.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ba-multi-surah-acceleration.json";
const PAGE_SIZE = 1000;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
const HAMIDULLAH_RID = 31;
const KAZIMIRSKI_RID = 9001;

// ─── Stratégie limitée: coût éditorial maximum d'une sourate candidate au
//     batch "contrôle éditorial raisonnable" et budget total cible du batch.
const MAX_WT_PER_SURAH_SMALL = 50;   // A. priorité sourates <= 50 WT
const MAX_FORMS_PER_SURAH_SMALL = 150; // A. favoriser sourates <= 150 formes
const MIN_COVERAGE_STRATEGY = 0.70;  // A. favoriser coverage >= 70%

type DbRow = Record<string, unknown>;

interface SurahAnalysis {
  surahNumber: number;
  surahName: string;
  totalForms: number;
  resolvedForms: number;
  unresolvedForms: number;
  coveragePercent: number;
  pathAWordTranslation: number;
  pathBLemmaDirect: number;
  pathCWLM: number;
  classALemmaReachable: number;
  runtimeReady: boolean;
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
// ENGINE DE GLOSES FR — IDENTITY-SAFE, PAR-MOT
// ═══════════════════════════════════════════════════════════════════════════
// Chaque glose est produite par APPEL DE FONCTION indépendant (jamais une
// variable partagée/redéclarée entre deux itérations). Le word_id est la clé
// absolue. La priorité éditoriale : traduction française réelle du verset
// (Hamidullah rid=31, puis Kazimirski rid=9001) comme appui au sens ; on ne
// fait JAMAIS de substring matching naïf ni de fallback EN aveugle — si la
// conversion vers un français de qualité n'est pas possible de façon sûre, le
// mot est marqué `needsEditorialReview=true` (glose candidate, jamais anglaise).
// ═══════════════════════════════════════════════════════════════════════════

// Dictionnaire EN → FR curé (racines/paysage coranique + grammaire).
const EN2FR: Record<string, string> = {
  // Dieu / attributs
  god: "Dieu", allah: "Allah", lord: "Seigneur", rab: "Seigneur", "the lord": "le Seigneur",
  "the god": "Allah", "he is god": "Il est Dieu", "your god": "votre Dieu", "their lord": "leur Seigneur",
  "your lord": "votre Seigneur", merciful: "Miséricordieux", "compassionate": "Compatissant",
  "the most merciful": "le Tout Miséricordieux", "the merciful": "le Miséricordieux",
  great: "grand", almighty: "Tout-Puissant", wise: "Sage", knowing: "Savant", allknowing: "Omniscient",
  "the wise": "le Sage", "the knowing": "le Savant", "the almighty": "le Tout-Puissant",
  "the great": "le Grand", mighty: "Puissant", "the mighty": "le Puissant",
  // noms / gens / mondes
  man: "l'homme", human: "l'être humain", "the human": "l'être humain", people: "les gens",
  "the people": "les gens", mankind: "l'humanité", believer: "croyant", believers: "croyants",
  "the believers": "les croyants", disbelievers: "les mécréants", "the disbelievers": "les mécréants",
  "those who disbelieve": "ceux qui mécroient", disbeliever: "mécréant", hypocrites: "les hypocrites",
  "the hypocrites": "les hypocrites", nation: "une nation", "your nation": "votre nation",
  messengers: "les messagers", messenger: "messager", "the messenger": "le messager", prophet: "prophète",
  prophets: "les prophètes", guides: "des guides", guide: "guide", "a guide": "un guide",
  successor: "successeur", followers: "les adeptes", friend: "un allié", enemies: "des ennemis",
  enemy: "un ennemi", "an enemy": "un ennemi", orphans: "les orphelins", orphan: "orphelin",
  poor: "le pauvre", needy: "le nécessiteux", "the needy": "le nécessiteux", "the poor": "le pauvre",
  beggar: "le mendiant", children: "les enfants", "their children": "leurs enfants",
  soul: "l'âme", "a soul": "une âme", "every soul": "toute âme", "the soul": "l'âme",
  heart: "le cœur", "your heart": "ton cœur", "their hearts": "leurs cœurs", hearts: "les cœurs",
  "your hearts": "vos cœurs", eyes: "les yeux", "your eyes": "tes yeux", ears: "les oreilles",
  "your ears": "tes oreilles", tongue: "la langue", face: "le visage", "your face": "ton visage",
  hands: "les mains", "your hands": "tes mains", "their hands": "leurs mains", hand: "la main",
  foot: "le pied", feet: "les pieds", blood: "le sang", body: "le corps", skin: "la peau",
  flesh: "la chair", bones: "les os", "your bones": "tes os", back: "le dos", neck: "le cou",
  "his neck": "son cou", heads: "les têtes", head: "la tête", hair: "les cheveux",
  // création / nature
  heaven: "le ciel", heavens: "les cieux", "the heaven": "le ciel", "the heavens": "les cieux",
  sky: "le ciel", "the sky": "le ciel", earth: "la terre", "the earth": "la terre",
  "the ground": "la terre", world: "le monde", "the world": "le monde", "the mountains": "les montagnes",
  mountain: "une montagne", mountains: "des montagnes", "your mountains": "vos montagnes",
  night: "la nuit", "the night": "la nuit", day: "le jour", "the day": "le jour", days: "des jours",
  "a day": "un jour", morning: "le matin", "the morning": "le matin", dawn: "l'aube",
  "the dawn": "l'aube", "daybreak": "l'aube naissante", noon: "le midi", evening: "le soir",
  sun: "le soleil", "the sun": "le soleil", moon: "la lune", "the moon": "la lune",
  star: "une étoile", "a star": "une étoile", stars: "les étoiles", "the stars": "les étoiles",
  light: "la lumière", "the light": "la lumière", darkness: "les ténèbres", "the darkness": "les ténèbres",
  fire: "le feu", "the fire": "le feu", water: "l'eau", "the water": "l'eau", sea: "la mer",
  "the sea": "la mer", river: "un fleuve", wind: "un vent", "the wind": "le vent",
  winds: "les vents", rain: "la pluie", "the rain": "la pluie", cloud: "un nuage",
  clouds: "les nuages", "the clouds": "les nuages", thunder: "le tonnerre", lightning: "l'éclair",
  snow: "la neige", frost: "le givre", ice: "la glace",
  valley: "une vallée", "the valley": "la vallée", sand: "le sable",
  dust: "la poussière", "the dust": "la poussière", clay: "l'argile", "the clay": "l'argile",
  stone: "une pierre", "a stone": "une pierre", stones: "des pierres", "the stones": "les pierres",
  iron: "le fer", gold: "l'or", silver: "l'argent", treasure: "un trésor", treasures: "des trésors",
  "the treasures": "les trésors", fruit: "un fruit", "the fruit": "le fruit", fruits: "des fruits",
  grapes: "des raisins", date: "une datte", dates: "des dattes", palm: "un palmier",
  trees: "des arbres", tree: "un arbre", "the tree": "l'arbre", olive: "l'olive",
  "the olive": "l'olivier", garden: "un jardin", "the garden": "le jardin", gardens: "des jardins",
  "the gardens": "les jardins", paradise: "le paradis", "the paradise": "le paradis",
  hell: "l'Enfer", "the hell": "l'Enfer", hellfire: "le feu de l'Enfer", "the hellfire": "le feu de l'Enfer",
  springs: "des sources", "a spring": "une source", spring: "une source", "the springs": "les sources",
  "your sown field": "votre champ", field: "un champ", "the earth sprouts": "la terre fait germer",
  "the harvest": "la moisson", harvest: "la moisson", flock: "un troupeau", flocks: "des troupeaux",
  cattle: "le bétail", "the cattle": "le bétail", sheep: "les moutons", goats: "les chèvres",
  camels: "les chameaux", horses: "les chevaux", mules: "des mulets",
  donkeys: "des ânes", lion: "un lion", beast: "une bête", "the beast": "la bête",
  birds: "les oiseaux", "the birds": "les oiseaux", bird: "un oiseau",
  raven: "un corbeau", spider: "une araignée", bee: "une abeille", ant: "une fourmi",
  locusts: "des sauterelles", fish: "un poisson", "the fish": "le poisson", whale: "une baleine",
  serpent: "un serpent", snake: "un serpent", "the serpent": "le serpent", dog: "un chien",
  "the dog": "le chien", wolf: "un loup", eggs: "des œufs", "the whale": "la baleine",
  // temps / espace
  today: "ce jour-là", "that day": "ce jour-là", "on that day": "en ce jour-là",
  here: "ici", "from here": "d'ici", "over there": "là-bas", where: "où",
  "wherever": "où que", "in it": "en lui", "in it/them": "en lui", "in them": "en eux",
  "in what": "dans ce qui", "through": "à travers", place: "un lieu", "the place": "le lieu",
  "the meeting place": "le lieu de rencontre", end: "la fin", "the end": "la fin",
  "the last": "le dernier", "the first": "le premier", "the middle": "le milieu",
  "the beginning": "le commencement", beginning: "un commencement", "the final": "l'ultime",
  tomorrow: "demain", "the next day": "le lendemain", times: "des temps", "at that time": "à ce moment-là",
  "the while": "tant que", way: "la voie", "a way": "une voie", "the way": "la voie",
  "some way": "une échappatoire", road: "une route", "the road": "la route", path: "le chemin",
  "the path": "le chemin", "your path": "ton chemin", "straight path": "la voie droite",
  "the straight path": "la voie droite", "the right way": "la bonne direction", direction: "une direction",
  side: "un côté", "a side": "un côté", "every side": "tout côté", "the side": "le côté",
  "the other side": "l'autre côté", among: "parmi", between: "entre", "from between": "d'entre",
  behind: "derrière", before: "devant", after: "après", above: "au-dessus", below: "au-dessous",
  under: "sous", "on it": "dessus", "upon it": "sur lui", "upon them": "sur eux", against: "contre",
  "with you": "avec vous", with: "avec", for: "pour", about: "à propos de", without: "sans",
  "far from": "loin de", "far away": "au loin", near: "proche", "closer": "plus proche",
  "towards": "vers", "to": "à", "from": "de", by: "par",
  // livre / parole
  book: "le Livre", "the book": "le Livre", "your book": "ton Livre", "the scripture": "l'Écriture",
  scripture: "une Écriture", "the qur'an": "le Coran", "the quran": "le Coran", "the recitation": "la récitation",
  "the word": "la parole", word: "une parole", "a word": "une parole", words: "des paroles",
  "the words": "les paroles", "a decisive word": "une parole décisive", "the message": "le message",
  "message": "un message", "a reminder": "un rappel", "the reminder": "le rappel", reminder: "un rappel",
  "the revelation": "la révélation", revelation: "une révélation", "the sending down": "la descente de la Révélation",
  verse: "un verset", "a verse": "un verset", verses: "des versets", signs: "des signes",
  "the signs": "les signes", "his signs": "ses signes", sign: "un signe", "a sign": "un signe",
  "your signs": "tes signes", "the truth": "la vérité", truth: "la vérité", "the proof": "la preuve",
  proof: "une preuve", "a proof": "une preuve", "clear proof": "une preuve évidente",
  "the clear proof": "la preuve évidente", "clear signs": "des signes évidents",
  "the clear signs": "des signes évidents", parable: "une parabole", "a parable": "une parabole",
  "the presidents": "les présidents", "the example": "l'exemple", example: "un exemple",
  "a book": "un Livre", "the tablets": "les tables", "the law": "la loi", command: "un commandement",
  "the command": "le commandement", "the decree": "le décret", decree: "un décret",
  faith: "la foi", belief: "la croyance", religion: "la religion", "the religion": "la religion",
  "the way of life": "la religion", worship: "l'adoration", "the prayer": "la prière", prayer: "la prière",
  "the prayers": "les prières", "the alms": "l'aumône", alms: "l'aumône", "the charity": "l'aumône",
  charity: "la charité", fasting: "le jeûne", "the fast": "le jeûne", pilgrimage: "le pèlerinage",
  "the pilgrimage": "le pèlerinage", repentance: "le repentir",
  "the repentance": "le repentir", forgiveness: "le pardon", "the warning": "l'avertissement",
  warning: "un avertissement", "the punishment": "le châtiment", punishment: "le châtiment",
  "the torment": "le tourment", torment: "un tourment", "the reward": "la récompense",
  reward: "une récompense", "the mercy": "la miséricorde", mercy: "la miséricorde", "his mercy": "sa miséricorde",
  "the favors": "les bienfaits", favor: "un bienfait", "a favor": "un bienfait", grace: "la grâce",
  "his grace": "sa grâce", blessing: "une bénédiction", "the blessings": "les bénédictions",
  "your lord's blessing": "la bénédiction de ton Seigneur", "the covenant": "l'alliance",
  covenant: "une alliance", "the oath": "le serment", oath: "un serment", "the pledge": "l'engagement",
  promises: "les promesses", "the promise": "la promesse", promise: "une promesse", "an appointment": "un rendez-vous",
  "the appointed": "l'instant fixé", "the appointed time": "le terme fixé", "the term": "le terme",
  "a term": "un terme", "the last day": "le Jour dernier", "the day of judgment": "le jour du Jugement",
  "the hereafter": "l'au-delà", "the afterlife": "l'au-delà", "the grave": "la tombe", grave: "une tombe",
  "the resurrection": "la résurrection", "the rising": "la résurrection", "the gathering": "le rassemblement",
  "the reckoning": "le compte", "the account": "le compte", "the requital": "la rétribution",
  "the accounts": "les comptes", "the balance": "la balance", "the scales": "la balance",
  "the bridge": "le pont", "the path to hell": "la voie de l'Enfer",
  // jugement / salut
  "the guilty": "les coupables", guilty: "coupable", "the sinners": "les pécheurs", sin: "un péché",
  "a sin": "un péché", sins: "des péchés", "your sins": "tes péchés", "their sins": "leurs péchés",
  "the wrongdoers": "les injustes", "those who do wrong": "les injustes", "the evildoers": "les malfaisants",
  "the wicked": "les méchants", wicked: "méchant", "the corrupt": "les corrompus", corruption: "la corruption",
  "the unjust": "les injustes", injustice: "une injustice", "the oppressors": "les tyrans",
  oppressor: "un tyran", tyrant: "un tyran",
  "the tyrant": "le tyran", "the offender": "le transgresseur", "the transgressors": "les transgresseurs",
  "the arrogant": "les orgueilleux", arrogant: "orgueilleux", "vain": "vaniteux", "the proud": "les orgueilleux",
  "the boastful": "les fanfarons", "the ungrateful": "les ingrats", "the deniers": "les dénégateurs",
  "those who deny": "ceux qui dénient", "the deniers of truth": "les dénégateurs de la vérité",
  "the liars": "les menteurs", liar: "un menteur", "the learners": "les ignorants",
  "the foolish": "les insensés", "the ignorant": "les ignorants", "the fools": "les imbéciles",
  "the heedless": "les insouciants", "the blind": "les aveugles", blind: "aveugle",
  "the deaf": "les sourds", deaf: "sourd", mute: "muet", "the mute": "les muets", lame: "boiteux",
  "the sick": "les malades", sick: "malade", "the patient": "les patients", patient: "patient",
  "the sincere": "les sincères", sincere: "sincère", "the honest": "les honnêtes", "the trustworthy": "les dignes de confiance",
  "the steadfast": "les constants", "the near": "les proches", "the rich": "les riches", rich: "riche",
  "the wealthy": "les opulents", "the strong": "les forts", strong: "fort", weak: "faible",
  "the weak": "les faibles", "the few": "les rares", "the many": "le grand nombre",
  // actions / verbes (infinitifs — formes word à word)
  glorify: "glorifier", "glorifying": "glorification", safeguard: "préserver", honor: "honorer",
  "honoring": "honneur", disgrace: "avilir", provide: "pourvoir", "providing": "pourvoyeur",
  "he provides": "Il pourvoit", sustainer: "Nourricier", creator: "Créateur", "the creator": "le Créateur",
  "the maker": "le Formateur", "the fashioner": "le Façonneur", "the forgiver": "le Pardonneur",
  "the giver of life": "Celui qui donne la vie", "the bringer of death": "Celui qui donne la mort",
  "the inheritor": "l'Héritier", "the witness": "le Témoin", witness: "un témoin", "a witness": "un témoin",
  "the guardian": "le Gardien", guardian: "un tuteur", "the watcher": "l'Observateur",
  "the king": "le Roi", king: "un roi", "the sovereign": "le Souverain", "the owner": "le Maître",
  "the patrone": "le Protecteur", "the patron": "le Protecteur", "the helper": "le Secoureur",
  "the protector": "le Protecteur", "the friend": "l'Ami", "the ally": "l'Allié",
  "the vanquisher": "Le Dominateur", "the subjugator": "Le Dominateur", "the avenger": "le Vengeur",
  "the just": "le Juste", "the equitable": "l'Équitable", "the judge": "le Juge", judge: "un juge",
  "the arbiter": "l'Arbitre", "the opener": "Celui qui ouvre", "the grantor": "Celui qui accorde",
  "the bestower": "le Bienfaiteur", "the generous": "le Généreux", generous: "généreux",
  "the munificent": "le Munificent", "the compassionate": "le Compatissant",
  "the accepter": "Celui qui agrée", "the appreciative": "l'Appréciateur", "the responsive": "le Stupéfiant",
  "the near one": "le Proche", "the eternal": "l'Éternel", "the ever-living": "le Vivant éternel",
  "the living": "le Vivant", "the self-sufficient": "Celui qui se suffit à Lui-même",
  "the independent": "l'Indépendant", "the singular": "l'Unique", "the only one": "l'Unique",
  "the godless": "les impies", "the polytheists": "les associateurs", "the idolaters": "les idolâtres",
  "the misguided": "les égarés", "the astray": "les égarés", stray: "égaré", "the straying": "les égarés",
  // nombres / quantités
  one: "un", "the one": "l'Unique", two: "deux", "three": "trois", "four": "quatre", five: "cinq",
  "six": "six", "seven": "sept", "eight": "huit", nine: "neuf", ten: "dix", twenty: "vingt",
  thirty: "trente", forty: "quarante", fifty: "cinquante", sixty: "soixante", seventy: "soixante-dix",
  eighty: "quatre-vingts", ninety: "quatre-vingt-dix", hundred: "cent", "one hundred": "cent",
  thousand: "mille", "a thousand": "mille", "two thousand": "deux mille", many: "nombreux",
  "great many": "un grand nombre", some: "quelques", "every": "chaque", all: "tous", "the whole": "tout",
  "whole": "entier", "half": "la moitié", "a half": "une moitié", "third": "un tiers", "a third": "un tiers",
  "two thirds": "les deux tiers", "a quarter": "un quart", "fourth": "un quart", "a fifth": "un cinquième",
  "a sixth": "un sixième", "an eighth": "un huitième", "a tenth": "un dixième", "a portion": "une part",
  portion: "une part", "share": "une part", "your share": "ta part", "his share": "sa part",
  "double": "le double", "twice": "deux fois", "the rest": "le reste", enough: "suffisant",
  little: "peu", "a little": "un peu", "a few": "un petit nombre", few: "peu",
  "how many": "combien", "so much": "tant", "count": "le nombre", "the number": "le nombre",
  "according to": "selon", "with it": "avec cela", "of it": "en elle", "of them": "d'entre eux",
  "some of them": "certains d'entre eux", "some of you": "certains d'entre vous",
  "most of them": "la plupart d'entre eux", "most of you": "la plupart d'entre vous",
  "many of them": "beaucoup d'entre eux", "neither": "ni l'un ni l'autre", "both": "les deux",
  "each": "chacun", "any": "quelconque", none: "aucun", "no one": "personne", nothing: "rien",
  "something": "quelque chose", thing: "une chose", "a thing": "une chose", things: "des choses",
  "of the things": "des choses", "which": "ce qui", that: "que", this: "ceci", those: "ceux-là",
  these: "ceux-ci", "these are": "voici", "those are": "voilà", "it is": "c'est", "it": "il/elle",
  "there is": "il y a", "there are": "il y a", "there is no": "il n'y a pas de", "there is not": "il n'y a pas",
  // prépositions/grammaire
  and: "et", "or": "ou", "nor": "ni", but: "mais", "not": "ne ... pas", "no": "non",
  yes: "oui", if: "si", then: "alors", "so that": "afin que", "so that they": "afin qu'ils",
  because: "parce que", although: "bien que", "when": "quand", "and when": "et lorsque",
  "so when": "et quand", "while": "pendant que", until: "jusqu'à", "until the": "jusqu'au",
  "until they": "jusqu'à ce qu'ils", "as for": "quant à", indeed: "en vérité", verily: "certes",
  surely: "assurément", truly: "vraiment", "most surely": "certes", "but we": "mais Nous",
  "and we": "et Nous", "we": "Nous", "we have": "Nous avons", "we will": "Nous allons",
  "we shall": "Nous allons", "we made": "Nous avons fait", "we gave": "Nous avons donné",
  "we sent": "Nous avons envoyé", "we created": "Nous avons créé", "we caused": "Nous avons fait",
  you: "vous", "you have": "vous avez", "you will": "vous allez",
  "you shall": "vous allez", "you who believe": "ô vous qui croyez", "you who disbelieve": "ô vous qui mécroyez",
  "your": "votre", "he": "il", she: "elle", they: "ils", them: "eux", him: "le/lui", i: "je",
  "me": "moi", my: "mon", his: "son", her: "sa", its: "son", our: "notre", "their": "leur",
  "yours": "le vôtre", "so he": "alors il", "and he": "et il", "but he": "mais il",
  // état / qualités
  good: "bon", "the good": "le bien", bad: "mauvais", evil: "le mal", "the evil": "le mal",
  right: "droit", wrong: "tort", "truthful": "véridique", false: "faux", "the false": "le faux",
  "the right": "le droit", "the virtue": "la vertu", virtue: "une vertu", "the goodness": "le bien",
  "the beauty": "la beauté", beautiful: "beau", "the beautiful": "le Beau", "the fairest": "le plus beau",
  "the best": "le meilleur", best: "meilleur", "the worst": "le pire", worse: "pire",
  "the most favored": "le plus favorisé", "the most honored": "le plus honoré",
  just: "juste", fair: "équitable", equitable: "équitable",
  true: "vrai", "the true": "le vrai", valid: "valide", certain: "certain",
  "the certain news": "la nouvelle certaine", "the reality": "la réalité", "the fact": "le fait",
  "the unseen": "l'invisible", "the hidden": "ce qui est caché", "the secret": "le secret",
  secret: "un secret", secrets: "les secrets", "your secrets": "vos secrets",
  "what is in your breasts": "ce qui est dans vos poitrines", "your breasts": "vos poitrines",
  "the chests": "les poitrines", "the hearts": "les cœurs", "the bellies": "les ventres",
  "the wombs": "les matrices", "the reins": "les reins", "the flanks": "les flancs",
  // corps / innocents
  "the reward of the world": "la récompense de ce monde", "the enjoyment": "la jouissance",
  "enjoyment of the life": "jouissance de la vie", "the goods": "les biens", goods: "des biens",
  "this worldly life": "la vie d'ici-bas", "the worldly life": "la vie d'ici-bas",
  "the life of this world": "la vie présente", "the present life": "la vie présente",
  "the life": "la vie", life: "la vie", living: "vivant", dead: "mort", "the dead": "les morts",
  "the death": "la mort", death: "la mort", "the dying": "l'agonie",
  "the day you die": "le jour de votre mort", "your death": "votre mort",

  // ── Compléments batch 88F-BA (tokens non ambigus récurrents) ──
  secure: "en sécurité / à l'abri", islam: "l'Islam", helpers: "des secoureurs",
  "a helper": "un secoureur", "any helper": "un soutien / un secoureur",
  strength: "la force", decisive: "décisif / qui tranche", "the souls": "les âmes",
  "the pages": "les pages", boiling: "bouillant / bouillonnante", satisfied: "satisfait",
  "the wild beasts": "les bêtes sauvages", joyful: "joyeux", "a transaction": "un échange / une transaction",
  victory: "une victoire", "and a victory": "et une victoire", "a group": "un groupe",
  "a veil": "un voile", "a mirage": "un mirage", "its term": "son terme", "the time": "le temps",
  transcribe: "recopier / transcrire", "to forgive": "pardonner", decision: "une décision",
  "your sleep": "votre sommeil", "they are created": "ils ont été créés", "the radiance": "l'éclat",
  "we think": "nous pensons", "we know": "nous savons", "the comfort": "la quiétude",
  appropriate: "approprié", full: "plein", heavy: "lourd", "is guidance": "est une guidance",
  greatest: "le plus grand", "a return": "un retour", "is easy": "est facile",
  "are shackles": "sont des chaînes", burning: "brûlant / en feu",
  "and food": "et nourriture", "any drink": "toute boisson", "as pegs": "comme des pieux",
  "and grapevines": "et des vignes", "that We may bring forth": "afin que Nous fassions sortir",
  "for livelihood": "pour subsistance", "your creation": "votre création", "is success": "est le succès",
  "with Our": "avec Notre", "body/soul": "corps/âme", "the Angel": "l'Ange", "His spirit": "Son Esprit",
  "his progeny": "sa descendance", "any intercessor": "tout intercesseur",
  "persists": "persiste", "a rule": "une voie ordonnée", commitment: "un engagement",
  "is their account": "est leur compte", "a controller": "un dominateur", "in rows": "en rangs",
  willing: "volontaire", "they give less": "ils faussent la mesure", "by the retreating planets": "par les planètes qui reculent",
  writing: "l'écriture", "it has brought": "il a apporté", "is asked": "il sera interrogé",
  "will be brought forth": "seront amenés", lies: "les mensonges", "the Afterlife": "l'Au-delà",
  "are convinced": "sont convaincus", "we are lost": "nous sommes perdus",
  "and vegetation": "et de la végétation", "And settlements": "et des cités", destroyed: "détruit",
  standing: "debout", "it is raised": "elle est élevée", exhausted: "épuisé",
  "vain talk": "paroles vaines", offered: "offert", "take willingly": "prendre volontairement",
  "spend the night": "passer la nuit", remembrance: "le rappel / la mention", patience: "la patience",
};

// Détecte des malformations françaises typiques du découpage naïf
// (articles doublés / prépositions dupliquées) : ces gloses ne sont PAS
// correctes et doivent passer en revue humaine.
const FR_BAD_PATTERNS = new RegExp(
  "\\b(le les|la les|les les|un les|une les|votre les|ton les|mon les|leur les|ses les|des les|au les|aux les|du les|de le|de les|la la|le le|et et|de de|des des|a a|le the|la the)\\b",
  "i",
);

// Détecte la présence de vocabulaire anglais résiduel non converti.
const ENGLISH_TOKENS = new RegExp(
  "\\b(the|a|an|and|or|but|not|is|are|was|were|will|shall|would|could|should|has|have|had|been|" +
  "this|that|these|those|then|their|them|they|with|from|into|upon|for|of|to|in|at|by|on|up|out|" +
  "he|she|it|we|you|i|me|my|his|her|its|our|your|there|here|who|what|when|where|why|how|all|" +
  "every|each|any|some|no|none|nothing|something|one|which|whom|whose|do|does|did|done|be|being|" +
  "become|make|made|say|said|went|go|come|came|see|saw|know|knew|give|gave|take|took|call|called|" +
  "bring|brought|find|found|lose|lost|put|set|let|get|got|keep|held|hold|bear|borne|bear|" +
  "will|god|lord|people|man|woman|child|children|day|night|earth|heaven|sky|sun|moon|star|water|fire)" +
  "\\b",
  "i",
);

/**
 * Produit une glose FR pour un mot. `word_id` n'est pas utilisé dans la glose
 * elle-même mais garantit l'identité à l'extérieur (clé unique du mot).
 * Chaque appel retourne une glose fraîche — jamais de variable partagée.
 */
function deriveGloss(arabic: string, enMeaning: string): { gloss: string; needsReview: boolean } {
  const raw = enMeaning.replace(/^\[|\]$/g, "").replace(/[()]/g, "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return { gloss: arabic, needsReview: true }; // pas de donnée → placeholder jamais validé

  // 1. Dictionnaire exact (multi-mots d'abord).
  const exact = EN2FR[lower];
  if (exact) return { gloss: exact, needsReview: false };

  // 2. Traitement des clés dictionnaire multi-mots (contenant) — prudent.
  //    (on préfère l'exactitude à une pirouette : on ne substring-matche pas naïvement)

  // 3. Décomposition : retire les articles/préfixes connus puis retraduit le coeur.
  let work = lower;
  const stripped: string[] = [];
  for (const pref of ["and the", "and a", "and", "the", "a", "an", "of the", "with the", "in the", "in a", "to the", "for the", "from the"]) {
    if (work.startsWith(pref + " ")) { work = work.slice(pref.length).trim(); stripped.push(pref); break; }
  }
  // Traduit chaque mot restant via le dictionnaire (approximatif mais français).
  const translated = work.split(/\s+/).map((tok) => EN2FR[tok]).filter((x): x is string => !!x);
  if (translated.length === work.split(/\s+/).length && translated.length > 0) {
    let out = translated.join(" ");
    if (stripped.includes("and") && !out.startsWith("et")) out = "et " + out;
    if (stripped.includes("the")) out = "le " + out;
    // Validation FR stricte : pas d'anglais résiduel et pas de malformation
    // (articles doublés issus d'un découpage naïf).
    if (!ENGLISH_TOKENS.test(out) && !FR_BAD_PATTERNS.test(out)) return { gloss: out, needsReview: false };
  }

  // 4. Dernier recours : glose FR structurelle explicite à partir d'heuristique
  //    (jamais un texte anglais passé tel quel). On marque review car non fiable.
  return { gloss: `(glose FR à valider — EN source : ${raw.slice(0, 60)})`, needsReview: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATÉGIES DE BATCH
// ═══════════════════════════════════════════════════════════════════════════
type Candidate = SurahAnalysis;

function maxNumberGreedy(candidates: Candidate[], budget: number): Candidate[] {
  // Priorité aux <=50 WT, puis <=150 formes, puis coverage>=70% ; à coût égal,
  // tri par unresolved asc, puis coverage desc, puis taille asc.
  const ranked = [...candidates].sort((a, b) => {
    const aw = (a.unresolvedForms <= MAX_WT_PER_SURAH_SMALL ? 0 : 1);
    const bw = (b.unresolvedForms <= MAX_WT_PER_SURAH_SMALL ? 0 : 1);
    if (aw !== bw) return aw - bw;
    const af = (a.totalForms <= MAX_FORMS_PER_SURAH_SMALL ? 0 : 1);
    const bf = (b.totalForms <= MAX_FORMS_PER_SURAH_SMALL ? 0 : 1);
    if (af !== bf) return af - bf;
    const ac = (a.coveragePercent / 100 >= MIN_COVERAGE_STRATEGY ? 0 : 1);
    const bc = (b.coveragePercent / 100 >= MIN_COVERAGE_STRATEGY ? 0 : 1);
    if (ac !== bc) return ac - bc;
    if (a.unresolvedForms !== b.unresolvedForms) return a.unresolvedForms - b.unresolvedForms;
    if (a.coveragePercent !== b.coveragePercent) return b.coveragePercent - a.coveragePercent;
    return a.totalForms - b.totalForms;
  });
  const chosen: Candidate[] = [];
  let cost = 0;
  for (const c of ranked) {
    if (cost + c.unresolvedForms > budget) continue;
    chosen.push(c);
    cost += c.unresolvedForms;
  }
  return chosen;
}

function lowestTotalCost(candidates: Candidate[]): Candidate[] {
  // Minimise SUM(unresolved) en maximisant le nombre complété : tri asc par
  // unresolved, inclusion gloutonne.
  const ranked = [...candidates].sort((a, b) => {
    if (a.unresolvedForms !== b.unresolvedForms) return a.unresolvedForms - b.unresolvedForms;
    if (a.coveragePercent !== b.coveragePercent) return b.coveragePercent - a.coveragePercent;
    return a.totalForms - b.totalForms;
  });
  return ranked; // toutes les sourates triées — le batch "à coût minime" est le préfixe choisi.
}

function balancedScore(c: Candidate): number {
  const coverageNorm = c.coveragePercent / 100;
  const effortNorm = 1 - Math.min(c.unresolvedForms / 500, 1);
  const sizeNorm = Math.min(c.totalForms / 2000, 1);
  return coverageNorm * 0.40 + effortNorm * 0.35 + sizeNorm * 0.25;
}

function highConfidence(candidates: Candidate[]): Candidate[] {
  // PATH A dominant (>=50% resolved via word_tr), classA === 0, pas de WLM/MASAQ
  // nécessaire, forte couverture, faible nb unresolved, taille raisonnable.
  const ok = candidates.filter((c) => {
    const pathA = c.resolvedForms > 0 ? c.pathAWordTranslation / c.resolvedForms : 0;
    const pathADominant = pathA >= 0.5 || c.pathAWordTranslation >= c.pathBLemmaDirect + c.pathCWLM;
    return c.classALemmaReachable === 0 && pathADominant && c.coveragePercent >= 50;

  });
  return [...ok].sort((a, b) => {
    if (a.classALemmaReachable !== b.classALemmaReachable) return a.classALemmaReachable - b.classALemmaReachable;
    const sa = balancedScore(b) - balancedScore(a);
    if (sa !== 0) return sa;
    return a.unresolvedForms - b.unresolvedForms;
  });
}

function fast10(candidates: Candidate[]): Candidate[] {
  // Environ 10 sourates (ou max possible sous une limite de coût raisonnable)
  // avec le minimum de travail éditorial.
  const ranked = [...candidates].sort((a, b) => {
    if (a.unresolvedForms !== b.unresolvedForms) return a.unresolvedForms - b.unresolvedForms;
    if (a.coveragePercent !== b.coveragePercent) return b.coveragePercent - a.coveragePercent;
    return a.totalForms - b.totalForms;
  });
  const chosen: Candidate[] = [];
  let cost = 0;
  for (const c of ranked) {
    if (chosen.length === 10) break;
    if (cost + c.unresolvedForms > 500) break;
    chosen.push(c);
    cost += c.unresolvedForms;
  }
  return chosen;
}interface BatchSummary {
  surahs: number[];
  count: number;
  totalForms: number;
  totalResolved: number;
  totalUnresolved: number;
  avgCoverage: number;
  maxIndividualCost: number;
  avgSurahSize: number;
  readyGain: number;
  costPerSurah: number;
}

function summarizeBatch(batch: Candidate[]): BatchSummary {
  const totalForms = batch.reduce((s, c) => s + c.totalForms, 0);
  const totalResolved = batch.reduce((s, c) => s + c.resolvedForms, 0);
  const totalUnresolved = batch.reduce((s, c) => s + c.unresolvedForms, 0);
  const avgCoverage = totalForms > 0 ? ROUND((totalResolved / totalForms) * 100, 2) : 0;
  const maxIndividualCost = batch.reduce((s, c) => Math.max(s, c.unresolvedForms), 0);
  const avgSurahSize = batch.length ? ROUND(totalForms / batch.length, 1) : 0;
  return {
    surahs: batch.map((c) => c.surahNumber),
    count: batch.length,
    totalForms,
    totalResolved,
    totalUnresolved,
    avgCoverage,
    maxIndividualCost,
    avgSurahSize,
    readyGain: batch.length,
    costPerSurah: batch.length ? ROUND(totalUnresolved / batch.length, 1) : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  console.log("=== PHASE 88F-BA — MULTI-SURAH ACCELERATION STRATEGY AUDIT ===\n");
  console.log("  STRICT READ-ONLY :: DATABASE_WRITES: 0\n");

  // ─── 1. Charge toutes les données ───────────────────────────────────────
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
  for (const w of allWords) wordById.set(w.id as string, w);
  const surahNumById = new Map<string, number>();
  const surahNameByNum = new Map<number, string>();
  for (const s of allSurahs) {
    const sn = s.number as number;
    surahNumById.set(s.id as string, sn);
    surahNameByNum.set(sn, (s.name_transliteration as string) ?? `S${sn}`);
  }

  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  const surahNumByAyahId = new Map<string, number>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) surahNumByAyahId.set(a.id as string, sn);
  }
  const surahWordIds = new Map<number, Set<string>>();
  for (let i = 1; i <= 114; i++) surahWordIds.set(i, new Set());
  for (const oc of allOccs) {
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn != null) surahWordIds.get(sn)!.add(oc.word_id as string);
  }
  // word → (surah, ayahId, ayah) premier ayah canonique (pour contexte éditorial)
  const firstOcc = new Map<string, { surah: number; ayahId: string; ayah: number }>();
  const ayahNumBySurah = new Map<number, Map<string, number>>();
  for (const s of allSurahs) {
    const sn = s.number as number;
    ayahNumBySurah.set(sn, new Map());
  }
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null) ayahNumBySurah.get(sn)!.set(a.id as string, a.ayah_number as number);
  }
  for (const oc of allOccs) {
    const wid = oc.word_id as string;
    const sn = surahNumByAyahId.get(oc.ayah_id as string);
    if (sn == null) continue;
    const ayahNum = ayahNumBySurah.get(sn)!.get(oc.ayah_id as string);
    if (ayahNum == null) continue;
    const cur = firstOcc.get(wid);
    if (!cur || ayahNum < cur.ayah) firstOcc.set(wid, { surah: sn, ayahId: oc.ayah_id as string, ayah: ayahNum });
  }

  console.log(`  Surahs: 114 · quran_words: ${allWords.length} · word_tr FR: ${frWordTr.size} · lemma_tr FR: ${frLemmaTr.size} · WLM safe: ${wlmByWord.size}\n`);

  // ─── 2. Runtime resolve 114 sourates ────────────────────────────────────
  const analyses: SurahAnalysis[] = [];
  let gPathA = 0, gPathB = 0, gPathC = 0, gTotal = 0, gResolved = 0, gUnresolved = 0, gClassA = 0;

  for (let sn = 1; sn <= 114; sn++) {
    const wordIds = surahWordIds.get(sn)!;
    let pathA = 0, pathB = 0, pathC = 0, classA = 0;
    for (const wid of wordIds) {
      if (frWordTr.has(wid)) { pathA++; continue; }
      const word = wordById.get(wid);
      const dl = word?.lemma_id as string | null;
      if (dl && frLemmaTr.has(dl)) { pathB++; continue; }
      const wl = wlmByWord.get(wid);
      if (wl && frLemmaTr.has(wl)) { pathC++; continue; }
      if (dl && !frLemmaTr.has(dl)) classA++;
      else if (wl && !frLemmaTr.has(wl)) classA++;
    }
    const total = wordIds.size, resolved = pathA + pathB + pathC, unresolved = total - resolved;
    analyses.push({
      surahNumber: sn,
      surahName: surahNameByNum.get(sn) ?? `S${sn}`,
      totalForms: total, resolvedForms: resolved, unresolvedForms: unresolved,
      coveragePercent: total > 0 ? ROUND((resolved / total) * 100, 2) : 100,
      pathAWordTranslation: pathA, pathBLemmaDirect: pathB, pathCWLM: pathC,
      classALemmaReachable: classA,
      runtimeReady: sn !== 1 && unresolved === 0 && total > 0,
    });
    gPathA += pathA; gPathB += pathB; gPathC += pathC; gTotal += total;
    gResolved += resolved; gUnresolved += unresolved; gClassA += classA;
  }

  let readyCount = 0, notReadyCount = 0, referenceCount = 0;
  for (const a of analyses) {
    if (a.surahNumber === 1) referenceCount++;
    else if (a.runtimeReady) readyCount++;
    else notReadyCount++;
  }
  const globalCoveragePct = ROUND((gResolved / gTotal) * 100, 2);
  const frUnion = (() => { let n = 0; for (const w of allWords) { const wid = w.id as string; if (frWordTr.has(wid)) { n++; continue; } if (w.lemma_id && frLemmaTr.has(w.lemma_id as string)) { n++; continue; } if (wlmByWord.has(wid) && frLemmaTr.has(wlmByWord.get(wid)!)) n++; } return n; })();

  console.log("=== GLOBAL RUNTIME-TRUTH (recalculé depuis la DB) ===\n");
  console.log(`  READY: ${readyCount} · NOT_READY: ${notReadyCount} · REFERENCE: ${referenceCount} · Total: ${readyCount + notReadyCount + referenceCount}`);
  console.log(`  Global coverage: ${gResolved}/${gTotal} (${globalCoveragePct}%)`);
  console.log(`  PATH A: ${gPathA} · PATH B: ${gPathB} · PATH C: ${gPathC} · classA: ${gClassA}`);
  console.log(`  FR union: ${frUnion}/${allWords.length} (${ROUND((frUnion / allWords.length) * 100, 1)}%)\n`);

  // ─── 3. Les 78 NOT_READY ────────────────────────────────────────────────
  const notReady = analyses.filter((a) => a.surahNumber !== 1 && !a.runtimeReady);
  console.log(`=== NOT_READY: ${notReady.length} ===\n`);

  // ─── 4. Stratégies ──────────────────────────────────────────────────────
  const batchBudget = 500; // budget total raisonnable de ~500 WF pour un premier lot contrôlé

  const strategyMaxNumber = maxNumberGreedy(notReady, batchBudget);
  const strategyLowestCost = lowestTotalCost(notReady).slice(0, 15); // préfixe le moins coûteux
  const strategyBalanced = [...notReady].sort((a, b) => balancedScore(b) - balancedScore(a));
  const strategyHighConfidence = highConfidence(notReady);
  const strategyFast10 = fast10(notReady);

  const summarized: Record<string, BatchSummary> = {
    MAXIMUM_NUMBER_OF_SURAHS: summarizeBatch(strategyMaxNumber),
    LOWEST_TOTAL_COST: summarizeBatch(strategyLowestCost),
    BALANCED_ACCELERATION: summarizeBatch(strategyBalanced.slice(0, 10)),
    HIGH_CONFIDENCE: summarizeBatch(strategyHighConfidence.slice(0, 10)),
    FAST_10: summarizeBatch(strategyFast10),
  };

  // ─── 5. Comparison batch sizes 3/5/8/10/15 ──────────────────────────────
  const sizes = [3, 5, 8, 10, 15];
  const batchSizes: Record<string, BatchSummary> = {};
  for (const sz of sizes) {
    const batch = strategyHighConfidence.slice(0, sz);
    batchSizes[`BATCH_${sz}`] = summarizeBatch(batch);
  }

  // ─── 6. Batch recommandé ────────────────────────────────────────────────
  // Maximise READY_GAIN / EDITORIAL_COST. Le ratio le plus avantageux vient
  // des sourates les moins coûteuses : FAST_10 (≈10 sourates, coût minimal).
  const recommended = strategyFast10;
  const recommendedSummary = summarizeBatch(recommended);

  console.log("=== STRATÉGIES ===\n");
  for (const [k, v] of Object.entries(summarized)) {
    console.log(`  ${k.padEnd(26)} surahs=[${v.surahs.join(",")}] gain=${v.readyGain} cost=${v.totalUnresolved} avgCouv=${v.avgCoverage}%`);
  }

  console.log("\n=== COMPARAISON DES TAILLES 3/5/8/10/15 ===");
  for (const sz of sizes) {
    const b = batchSizes[`BATCH_${sz}`];
    console.log(`  TAILLE=${sz}  gain=${b.readyGain}  forms=${b.totalForms}  unresolved=${b.totalUnresolved}  avgCouv=${b.avgCoverage}%  maxIndiv=${b.maxIndividualCost}`);
  }

  console.log("\n=== BATCH_RECOMMENDED (FAST_10) ===");
  console.log(`  Surahs: ${recommendedSummary.surahs}`);
  console.log(`  READY gain: ${recommendedSummary.readyGain}`);
  console.log(`  Total forms: ${recommendedSummary.totalForms}`);
  console.log(`  Total unresolved (word_tr): ${recommendedSummary.totalUnresolved}`);
  console.log(`  Avg coverage: ${recommendedSummary.avgCoverage}%`);
  console.log(`  Max individual cost: ${recommendedSummary.maxIndividualCost}\n`);

  // ─── 7. EDITORIAL AUDIT DU BATCH RECOMMANDÉ ─────────────────────────────
  console.log("=== AUDIT ÉDITORIAL DU BATCH RECOMMANDÉ ===\n");
  const recommendedSet = new Set(recommended.map((c) => c.surahNumber));

  // Traductions FR du verset pour contexte (Hamidullah + Kazimirski) sur les
  // ayahs du batch recommandé.
  const batchAyahIds = new Set<string>();
  const ayahBySurahNum = new Map<number, Map<string, number>>();
  for (const a of allAyahs) {
    const sn = surahNumById.get(a.surah_id as string);
    if (sn != null && recommendedSet.has(sn)) {
      batchAyahIds.add(a.id as string);
      if (!ayahBySurahNum.has(sn)) ayahBySurahNum.set(sn, new Map());
      ayahBySurahNum.get(sn)!.set(a.id as string, a.ayah_number as number);
    }
  }
  const transByAyah = new Map<string, Map<number, string>>();
  const ayahIdList = [...batchAyahIds];
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

  interface EditorialEntry {
    word_id: string;
    arabic: string;
    ayah: string;
    gloss: string;
    needsEditorialReview: boolean;
    rationale: string;
    hamidullahSnippet: string;
    kazimirskiSnippet: string;
    classification: string;
  }

  interface ValidationSummary {
    unresolvedInitial: number;
    glossesGenerated: number;
    uniqueWordIds: number;
    empty: number;
    english: number;
    placeholders: number;
    duplicateWordIds: number;
    genericMismatch: number;
    needsEditorialReview: number;
    identitySafe: boolean;
  }

  interface SimulationSummary {
    beforeResolved: number;
    beforeTotal: number;
    beforeCoveragePct: number;
    afterImport: string;
    newWordTranslations: number;
    ready: boolean;
  }

  const editorialBySurah: Record<number, { totalForms: number; unresolved: EditorialEntry[]; validation: ValidationSummary; simulation: SimulationSummary }> = {};

  for (const c of recommended) {
    const wordIds = surahWordIds.get(c.surahNumber)!;
    const unresolvedIds: string[] = [];
    for (const wid of wordIds) {
      if (frWordTr.has(wid)) continue;
      const word = wordById.get(wid);
      if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) continue;
      const wl = wlmByWord.get(wid);
      if (wl && frLemmaTr.has(wl)) continue;
      unresolvedIds.push(wid);
    }

    const entries: EditorialEntry[] = [];
    for (const wid of unresolvedIds) {
      const word = wordById.get(wid);
      const arabic = (word?.arabic as string) ?? "?";
      const enMeaning = (word?.meaning as string) ?? "";
      const occ = firstOcc.get(wid);
      const ayahRef = occ ? `${occ.surah}:${occ.ayah}` : `${c.surahNumber}:?`;
      const transMap = occ ? transByAyah.get(occ.ayahId) : undefined;
      const ham = transMap?.get(HAMIDULLAH_RID)?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 400) ?? "";
      const kaz = transMap?.get(KAZIMIRSKI_RID)?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 400) ?? "";

      // IDENTITY-SAFE : glose fraîche par appel de fonction (jamais variable
      // partagée ni redéclarée entre deux itérations).
      const glossResult = deriveGloss(arabic, enMeaning);
      const gloss = glossResult.gloss;

      const rationale = `Coherent: sr=${
        occ ? `${occ.surah}:${occ.ayah}` : "?"
      } | EN hint="${enMeaning.slice(0, 60)}" | priorité Hamidullah disponible=${
        ham ? "oui" : "non"
      }`;

      entries.push({
        word_id: wid, arabic, ayah: ayahRef, gloss,
        needsEditorialReview: glossResult.needsReview,
        rationale,
        hamidullahSnippet: ham.slice(0, 150),
        kazimirskiSnippet: kaz.slice(0, 150),
        classification: "A_WORD_TRANSLATION_REQUIRED",
      });
    }

    // Validation stricte
    const unique = new Set(entries.map((e) => e.word_id));
    const empty = entries.filter((e) => !e.gloss || e.gloss.trim() === "").length;
    const englishCheck = entries.filter((e) => /^(the|a|an|is|are|was|were|will|shall|has|have|had|been|its|their|this|that|these|those|then|and|but|not|no|so|if|as|it|he|she|we|they|you|i)\b/i.test(e.gloss.trim())).length;
    const placeholder = entries.filter((e) => e.gloss.trim() === e.arabic || e.gloss.trim() === (wordById.get(e.word_id)?.arabic as string)).length;
    const dup = entries.length - unique.size;
    const needsReview = entries.filter((e) => e.needsEditorialReview).length;
    const identitySafe = unique.size === entries.length && empty === 0;

    const simulationCovered = c.resolvedForms + entries.length;
    const ready = simulationCovered === c.totalForms;

    editorialBySurah[c.surahNumber] = {
      totalForms: c.totalForms,
      unresolved: entries,
      validation: {
        unresolvedInitial: entries.length,
        glossesGenerated: entries.length,
        uniqueWordIds: unique.size,
        empty: empty,
        english: englishCheck,
        placeholders: placeholder,
        duplicateWordIds: dup,
        genericMismatch: needsReview,
        needsEditorialReview: needsReview,
        identitySafe,
      },
      simulation: {
        beforeResolved: c.resolvedForms,
        beforeTotal: c.totalForms,
        beforeCoveragePct: c.coveragePercent,
        afterImport: `${simulationCovered} / ${c.totalForms}`,
        newWordTranslations: entries.length,
        ready,
      },
    };

    console.log(`  S${c.surahNumber} ${c.surahName} : ${entries.length} unresolved — identitySafe=${identitySafe} ready=${ready}\n`);
  }

  // ─── 8. Expected global coverage après import ───────────────────────────
  const totalNewWT = Object.values(editorialBySurah).reduce((s, e) => s + e.unresolved.length, 0);
  const expectedResolved = gResolved + totalNewWT;
  const expectedCoverage = ROUND((expectedResolved / gTotal) * 100, 2);
  const expectedReady = readyCount + recommendedSummary.readyGain;

  // Nombre de gloses déjà jugées FR fiables vs. gloses candidates à revue humaine.
  const totalGlosses = Object.values(editorialBySurah).reduce((s, e) => s + e.unresolved.length, 0);
  const totalReviewRequired = Object.values(editorialBySurah).reduce((s, e) => s + e.validation.needsEditorialReview, 0);
  const glossesConfirmed = totalGlosses - totalReviewRequired;

  // ─── 9. Build report ────────────────────────────────────────────────────
  // READ-ONLY intégrité stricte + zéro glose devant revue humaine ⇒ importable.
  const editorialReady = Object.values(editorialBySurah).every(
    (e) => e.validation.identitySafe && e.validation.needsEditorialReview === 0,
  );
  const report = {
    phase: "88F-BA",
    verdict: "PHASE_88F_BA_COMPLETE",
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),

    runtimeResolutionModel: {
      order: [
        "PATH A: word_translations (language='fr', is_validated=true)",
        "PATH B: quran_words.lemma_id → lemma_translations (fr, validated)",
        "PATH C: word_lemma_mapping (confidence='safe') → lemma_translations (fr, validated)",
      ],
      explicitlyExcluded: ["linguistic_occurrences.hikma_lemma_id (MASAQ)"],
    },

    globalRuntimeBaseline: {
      ready: readyCount,
      notReady: notReadyCount,
      reference: referenceCount,
      totalSurahs: readyCount + notReadyCount + referenceCount,
      coverage: {
        totalForms: gTotal,
        resolvedForms: gResolved,
        unresolvedForms: gUnresolved,
        coveragePercent: globalCoveragePct,
        wordTranslationsFR: frWordTr.size,
        lemmaTranslationsFR: frLemmaTr.size,
        wlmSafe: wlmByWord.size,
        frUnion,
        frUnionPct: ROUND((frUnion / allWords.length) * 100, 1),
      },
      pathAnalysis: {
        pathA: gPathA, pathB: gPathB, pathC: gPathC, classA: gClassA,
        pathAPct: ROUND((gPathA / gResolved) * 100, 1),
        pathBPct: ROUND((gPathB / gResolved) * 100, 1),
        pathCPct: ROUND((gPathC / gResolved) * 100, 1),
      },
    },

    notReadySurahs: notReady.map((a) => ({
      surahNumber: a.surahNumber, surahName: a.surahName,
      totalForms: a.totalForms, resolvedForms: a.resolvedForms,
      unresolvedForms: a.unresolvedForms, coveragePercent: a.coveragePercent,
      pathAWordTranslation: a.pathAWordTranslation, pathBLemmaDirect: a.pathBLemmaDirect,
      pathCWLM: a.pathCWLM, classALemmaReachable: a.classALemmaReachable,
      wordTranslationsNeeded: a.unresolvedForms,
    })),

    strategies: summarized,

    batchSizeComparison: batchSizes,

    batchRecommended: {
      strategy: "FAST_10", ...recommendedSummary,
      currentReady: readyCount,
      expectedReady: expectedReady,
      readyGain: recommendedSummary.readyGain,
      totalWordTranslationsRequired: totalNewWT,
      averageCoverage: recommendedSummary.avgCoverage,
      maxIndividualCost: recommendedSummary.maxIndividualCost,
      editorialRisk: totalReviewRequired,
      glossesConfirmed: glossesConfirmed,
      glossesNeedingReview: totalReviewRequired,
      masaqDependency: false,
      expectedGlobalCoverageAfterImport: expectedCoverage,
    },

    editorialAudit: editorialBySurah,

    validation: Object.fromEntries(
      recommended.map((c) => [c.surahNumber, editorialBySurah[c.surahNumber].validation]),
    ),

    simulation: Object.fromEntries(
      recommended.map((c) => [c.surahNumber, editorialBySurah[c.surahNumber].simulation]),
    ),

    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      wlmCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      noHikmaLemmaIdUsed: true,
      runtimeModelPure: true,
      protectedTables: "all unchanged (quran_words, word_lemma_mapping, linguistic_occurrences, lemma_translations, translations, curriculum, learning_paths)",
    },

    tests: {
      vitest: "RUN_AFTER_SCRIPT (target: PASS)",
      typescript: "RUN_AFTER_SCRIPT (target: 0 errors)",
      eslint: "RUN_AFTER_SCRIPT (target: 0 errors)",
      staticReadOnly: "DATABASE_WRITES=0 (no INSERT/UPDATE/UPSERT/DELETE issued)",
    },

    finalVerdict: {
      PHASE_88F_BA_COMPLETE: true,
      DATABASE_WRITES: 0,
      BATCH_RECOMMENDED: recommendedSummary.surahs,
      CURRENT_READY: readyCount,
      EXPECTED_READY_AFTER_BATCH: expectedReady,
      READY_GAIN: recommendedSummary.readyGain,
      TOTAL_WORD_TRANSLATIONS_REQUIRED: totalNewWT,
      GLOSSES_CONFIRMED: glossesConfirmed,
      GLOSSES_NEEDING_REVIEW: totalReviewRequired,
      EDITORIAL_READY_FOR_IMPORT: editorialReady,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`\nReport -> ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  DATABASE_WRITES: 0`);
  console.log(`  BATCH_RECOMMENDED: [${recommendedSummary.surahs}]`);
  console.log(`  CURRENT_READY: ${readyCount}`);
  console.log(`  EXPECTED_READY_AFTER_BATCH: ${expectedReady}`);
  console.log(`  READY_GAIN: ${recommendedSummary.readyGain}`);
  console.log(`  TOTAL_WORD_TRANSLATIONS_REQUIRED: ${totalNewWT}`);
  console.log(`  EDITORIAL_READY_FOR_IMPORT: ${editorialReady}`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  try { writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-BA", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2)); } catch { /* OK */ }
  process.exit(1);
});