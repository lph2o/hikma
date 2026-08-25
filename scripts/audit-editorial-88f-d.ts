/**
 * PHASE 88F-D — TOP 100 LEMMA EDITORIAL AUDIT
 *
 * STRICT READ-ONLY — 0 DB write, 0 migration, 0 seed, 0 import.
 * Aucune modification du code métier, aucune modification des traductions.
 *
 * Objectif : audit éditorial des 100 premiers candidats de la priority list
 * générée par PHASE 88F-C (reports/phase-88f-c-post-import-audit.json →
 * batch2.top100) pour décider quelles gloses FR peuvent être ajoutées de
 * manière sûre au niveau lemme (lemma_translations) — décision DOCUMENTÉE,
 * aucune écriture dans cette phase.
 *
 * Livrable : reports/phase-88f-d-editorial-audit.json
 *   1. Baseline recalculé depuis la DB (jamais recopié depuis un rapport)
 *   2. Couverture FR par UNION(word_id) + occurrences FR + lemmes
 *   3. Readiness des 114 sourates (règle classifySurahReadiness : READY
 *      ssi 100 % des formes résolues en FR ; sourate 1 = REFERENCE)
 *   4. Couverture MASAQ réelle (COUNT DISTINCT sourate via linguistic_occurrences)
 *   5. Pour chaque candidat : evidence complète (MASAQ EN, Hikma WT, lemma
 *      translations existantes, Hamidullah FR, Kazimirski FR, POS, stems)
 *   6. Glose proposée + classification SAFE / REVIEW_REQUIRED / DO_NOT_IMPORT
 *   7. Gains réels dédupliqués par word_id (formes, occurrences, sourates)
 *   8. Simulations TOP 10/20/30/50/100 par UNION réelle des word_id
 *   9. Contrôles d'intégrité + invariants (0 écriture)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const OUTPUT = "reports/phase-88f-d-editorial-audit.json";
const INPUT_C = "reports/phase-88f-c-post-import-audit.json";
const ROUND = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";

type Proposal = {
  gloss: string;
  classification: "SAFE" | "REVIEW_REQUIRED" | "DO_NOT_IMPORT";
  confidence: number;
  rationale: string;
  /** tokens EN attendus dans les gloses MASAQ (alignement d'évidence). */
  tokens: string[];
};

/**
 * LEXIQUE ÉDITORIAL — proposition de glose FR au niveau lemme.
 *
 * Sources mobilisées (aucune source nouvelle, aucune écriture) :
 *  - gloses Hikma connues (HIKMA_GLOSS_EVIDENCE de PHASE 88F-C) ;
 *  - KNOWN_GLOSSES de PHASE 88F-A (validation éditoriale antérieure) ;
 *  - sens lexicaux attestés par Hamidullah FR et Kazimirski FR (verse) ;
 *  - evidence MASAQ EN de chaque occurrence (masaq_gloss_en).
 *
 * Règle éditoriale (PHASE 88F-D §4) : la glose représente le sens lexical /
 * pédagogique du lemme, pas un sens contextuel unique. En cas de polysémie
 * importante, la glose proposée reste robuste, ou le lemme est classé
 * REVIEW_REQUIRED.
 */
const EDITORIAL: Record<string, Proposal> = {
  // ═══════ TOP 10 ═══════
  أمر: {
    gloss: "affaire / ordre / commandement",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "polysémie majeure (affaire, ordre, commandement) — 44 gloses MASAQ distinctes ; glose robuste possible mais trois sens co-dominants à valider (précédent 88F-A : non-safe)",
    tokens: ["matter", "command", "order", "affair"],
  },
  بين: {
    gloss: "entre / rendre clair, manifester",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "double classe : préposition/adverbe (entre) et verbe bayyana (rendre clair) — validation éditoriale requise (précédent 88F-A : non-safe)",
    tokens: ["between", "make", "clear"],
  },
  ذكر: {
    gloss: "rappel / évocation / mention",
    classification: "REVIEW_REQUIRED",
    confidence: 0.55,
    rationale: "glose Hikma connue mais trois sens coraniques (rappel, évocation, mention) — validation éditoriale requise (précédent 88F-A : non-safe)",
    tokens: ["rememb", "remind", "mention"],
  },
  قبل: {
    gloss: "avant / accepter",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "adverbe de temps (avant) vs verbe qabila (accepter) : deux sens majeurs — validation requise (précédent 88F-A : non-safe)",
    tokens: ["before", "accept", "receive"],
  },
  ملك: {
    gloss: "roi / royaume / posséder",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "et (roi, royaume) et verbe (posséder) : trois usages coraniques importants (précédent 88F-A : non-safe)",
    tokens: ["king", "dominion", "possess"],
  },
  قدر: {
    gloss: "mesure / destin / restreindre",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "polysémie (mesure, destin, capacité, restreindre) confirmée par 26 gloses MASAQ distinctes — glose FR difficile à stabiliser",
    tokens: ["measure", "decree", "restrict", "ordain"],
  },
  ظلم: {
    gloss: "injustice / être injuste",
    classification: "REVIEW_REQUIRED",
    confidence: 0.55,
    rationale: "champ injustice stable mais emploi rare 'ténèbres' (zulumat) signalé dans la glose Hikma — validation (précédent 88F-A : non-safe)",
    tokens: ["wrong", "oppress", "darkness"],
  },
  نصر: {
    gloss: "secours / victoire",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "sens lexical unique (vaincre / secourir) confirmé par Hamidullah ; toutes les formes appartiennent au même champ sémantique",
    tokens: ["help", "victory", "succor"],
  },
  ذر: {
    gloss: "laisser / abandonner",
    classification: "DO_NOT_IMPORT",
    confidence: 0.3,
    rationale: "mapping suspect : la glose MASAQ dominante est '(of)-an-atom' (ذرّة) alors que le lemme ذر est un verbe (laisser) — lemme non fiable tel quel",
    tokens: ["leave", "abandon", "atom"],
  },
  صدق: {
    gloss: "vérité / sincérité",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "champ vérité/sincérité stable mais dérivé صدقة (aumône/charity) mieux représenté que le sens racine dans MASAQ — deux sens majeurs à départager",
    tokens: ["truth", "true", "sincere", "charity"],
  },
  // ═══════ 11–30 ═══════
  صالح: {
    gloss: "vertueux / de bonnes œuvres",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "adjectif stable (righteous-deeds 41 % MASAQ) ; aucune ambiguïté éditoriale majeure",
    tokens: ["right", "good", "reform", "righteous"],
  },
  أكل: {
    gloss: "manger",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "verbe univoque (eat) — toutes les formes (verbales ou nominales) relèvent du même champ",
    tokens: ["eat"],
  },
  نعم: {
    gloss: "bienfait / faveur",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "champ bénédiction stable (favor, blessing) dans toutes les formes ; une seule famille lexicale",
    tokens: ["favor", "grace", "bless", "bounty"],
  },
  بصر: {
    gloss: "voir / vue (perception)",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "champ perception visuelle stable (see, sight, vision) — sans ambiguïté",
    tokens: ["see", "sight", "vision", "eye"],
  },
  قلوب: {
    gloss: "cœurs",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "substantif pluriel stable (their-hearts 65 % MASAQ) ; l'un des champs les plus stables du batch",
    tokens: ["heart"],
  },
  قرآن: {
    gloss: "coran",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "nom propre stable (the-quran 43 % MASAQ) — glose pédagogique évidente",
    tokens: ["quran", "recit"],
  },
  نزل: {
    gloss: "faire descendre / révéler",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "champ 'descendre / révéler' stable dans toutes les occurrences (descend, send-down)",
    tokens: ["descend", "send", "reveal"],
  },
  جزي: {
    gloss: "rétribuer",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "2 stems MASAQ distincts et coexistence de formes nominales/verbales — la glose couvre l'essentiel mais une validation est requise",
    tokens: ["reward", "recompense", "requite"],
  },
  عباد: {
    gloss: "serviteurs (d'Allah)",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "pluriel stable (his-slaves 31 % MASAQ) ; usage coranique quasi technique",
    tokens: ["slave", "servant", "worship"],
  },
  بشر: {
    gloss: "être humain / annoncer (une bonne nouvelle)",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "homonymie بشر (mortel) vs بشّر (annoncer) — deux sens majeurs équilibrés dans les formes",
    tokens: ["human", "mortal", "glad", "news", "tid"],
  },
  رسل: {
    gloss: "messagers / envoyés",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "pluriel stable (messengers) — confirmé par Hamidullah et Kazimirski",
    tokens: ["messenger", "apostle", "sent"],
  },
  حب: {
    gloss: "aimer / amour",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "champ affectif unique (love, loves) — formes verbale/nominale de la même famille",
    tokens: ["love"],
  },
  تبع: {
    gloss: "suivre",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "verbe univoque (follow) dans toutes les formes — sans ambiguïté",
    tokens: ["follow"],
  },
  أكثر: {
    gloss: "la plupart / plus nombreux",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "comparatif/élatif stable (most-of-them 52 % MASAQ)",
    tokens: ["most", "many", "more"],
  },
  نذر: {
    gloss: "avertir / avertissement / vœu",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "deux champs : نذير (avertissement) et نذر vœu — emplois équilibrés, validation requise",
    tokens: ["warn", "warning", "vow"],
  },
  عدو: {
    gloss: "ennemi",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "substantif stable (enemy) — toutes les formes de la même famille",
    tokens: ["enemy"],
  },
  حسب: {
    gloss: "estimer / compter",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "double emploi (penser/estimer ; compter, suffire) — deux sens majeurs documentés",
    tokens: ["think", "reckon", "count", "suffi"],
  },
  نهار: {
    gloss: "jour / journée",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "substantif stable (the-day 52 % MASAQ) — antonyme de ليل, univoque",
    tokens: ["day"],
  },
  غير: {
    gloss: "autre que / sans / changer",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "غَيْر (autre que, sans) vs غَيَّرَ (changer) — deux emplois majeurs (other/without vs change), glose robuste difficile à stabiliser",
    tokens: ["other", "without", "change"],
  },
  ليل: {
    gloss: "nuit",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "substantif stable (the-night 43 % MASAQ) — vocabulaire élémentaire univoque",
    tokens: ["night"],
  },
  // ═══════ 31–50 ═══════
  حكم: {
    gloss: "juger / jugement",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "verbe (juger) et nominal (jugement, sagesse) — la forme حكمة (sagesse) atteste un sens dérivé ; validation",
    tokens: ["judge", "rule", "wisdom"],
  },
  أعلم: {
    gloss: "plus savant / omniscient",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "أَعْلَم (most-knowing) vs أَعَلم (faire savoir) — deux sens sur deux formes, validation requise",
    tokens: ["know"],
  },
  يد: {
    gloss: "main",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "substantif univoque (hand) ; les constructions يدَي/ (mains) restent du même champ",
    tokens: ["hand"],
  },
  سماو: {
    gloss: "cieux",
    classification: "SAFE",
    confidence: 0.75,
    rationale: "substantif stable (the-heavens 71 % MASAQ) — le plus élevé du batch",
    tokens: ["heaven", "sky"],
  },
  أنهار: {
    gloss: "rivières",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "pluriel stable (the-rivers 71 % MASAQ) — sans ambiguïté",
    tokens: ["river"],
  },
  عد: {
    gloss: "compter / nombrer",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "verbe (compter) et nominal (nombre, promesse عِدَة) — deux familles au sein des formes",
    tokens: ["count", "number", "reckon"],
  },
  شرك: {
    gloss: "associer (à Dieu)",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "terminologie coranique technique stable (associer des divinités à Dieu) — toutes les formes du même champ",
    tokens: ["associate", "partner"],
  },
  بن: {
    gloss: "fils / enfants (de)",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "construct form réduite (بَنُو) — lemn stable dans la famille, à valider avec ابن pour éviter le chevauchement éditorial",
    tokens: ["son", "child", "children"],
  },
  أصحاب: {
    gloss: "compagnons (du feu, du jardin…)",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "substantif pluriel stable (companions 29 % MASAQ) — usage coranique récurrent",
    tokens: ["companion"],
  },
  نفق: {
    gloss: "dépenser (en aumône / dans la voie d'Allah)",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "verbe univoque (spend 35 % MASAQ) — champ 'dépense pieuse' stable",
    tokens: ["spend"],
  },
  خلف: {
    gloss: "derrière / après",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "adverbe/particule (derrière) vs verbe خلف (succéder, remplacer) — deux familles",
    tokens: ["behind", "after", "succeed"],
  },
  أيدي: {
    gloss: "mains",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "pluriel de يد (leurs mains) — formes suffixées pronominales du même substantif",
    tokens: ["hand"],
  },
  أجل: {
    gloss: "terme / délai",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "substantif stable (terme fixé) mais coexistence du verbe aǧǧala (accorder un délai) — validation",
    tokens: ["term", "delay", "end"],
  },
  ظالم: {
    gloss: "injuste / oppresseur",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "participe actif stable (wrongdoers 47 % MASAQ) — même famille que ظلم",
    tokens: ["wrongdoer", "oppressor", "unjust"],
  },
  أذن: {
    gloss: "oreille / permettre",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "nom (oreille) et verbe — homonymie documentée (10 gloses distinctes)",
    tokens: ["ear", "permit", "allow"],
  },
  أزواج: {
    gloss: "épouses / couples",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "substantif stable (spouses, mates) — utilisation coranique générale",
    tokens: ["spouse", "mate", "wife"],
  },
  قرى: {
    gloss: "cités / villages",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "2 stems MASAQ distincts (قرى / قرية) — pluriel à valider avant import",
    tokens: ["town", "village", "city"],
  },
  طائف: {
    gloss: "un groupe / une partie",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "طائفة (groupe) vs طائف (celui qui fait le tour) — deux dérivés du même racine, validation",
    tokens: ["group", "party"],
  },
  واحد: {
    gloss: "un / unique",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "numéral/adjectif stable (single 39 % MASAQ) — univoque",
    tokens: ["one", "single"],
  },
  // ═══════ 51–70 ═══════
  غني: {
    gloss: "suffisant / se passer de",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "gloses MASAQ à champ large (will-avail, enrich, rich) — jeu de sens (suffire, enrichir, être riche) à départager",
    tokens: ["avail", "enrich", "rich", "suffi"],
  },
  كثير: {
    gloss: "beaucoup / nombreux",
    classification: "SAFE",
    confidence: 0.75,
    rationale: "adjectif stable (much/many 43 % : le plus élevé du groupe) — un seul champ",
    tokens: ["much", "many"],
  },
  نور: {
    gloss: "lumière",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "substantif stable (light) — un seul champ sémantique",
    tokens: ["light"],
  },
  مرسل: {
    gloss: "envoyé / messager",
    classification: "REVIEW_REQUIRED",
    confidence: 0.55,
    rationale: "participe passif (envoyé) vs forme active مُرْسِل (celui qui envoie) — les deux apparaissent, validation",
    tokens: ["messenger", "sent", "send"],
  },
  شديد: {
    gloss: "dur / violent / intense",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "adjectif stable (severe) — aucun second sens majeur",
    tokens: ["severe", "intense", "strong"],
  },
  إله: {
    gloss: "dieu / divinité",
    classification: "SAFE",
    confidence: 0.75,
    rationale: "substantif stable (god 48 % MASAQ) — divine sans ambiguïté",
    tokens: ["god", "deity"],
  },
  جمع: {
    gloss: "rassembler / réunir",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "verbe (rassembler) vs substantif collectif — deux strates attestées, validation",
    tokens: ["gather", "collec", "assembl"],
  },
  حرم: {
    gloss: "interdire / rendre sacré",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "verbe h رم (interdire) vs substantif حرام (sacrere lié) — deux champs, glose robuste difficile",
    tokens: ["forbid", "unlawful", "sacred", "prohibit"],
  },
  ساع: {
    gloss: "l'Heure (du Jugement)",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "édit stable (the-hour 44 % MASAQ) — emploi coranique dominé par l'Heure dernière",
    tokens: ["hour"],
  },
  متاع: {
    gloss: "jouissance / bien éphémère",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "substantif stable (enjoyment, provision) — champ 'possession passagère'",
    tokens: ["provision", "enjoy", "benefit", "goods"],
  },
  جهنم: {
    gloss: "la Géhenne / l'Enfer",
    classification: "SAFE",
    confidence: 0.8,
    rationale: "nom propre stable (hell 38 % MASAQ) — glose pédagogique évidente",
    tokens: ["hell", "gehenna"],
  },
  وجه: {
    gloss: "visage",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "substantif stable (face) — un seul champ",
    tokens: ["face"],
  },
  أبصار: {
    gloss: "yeux / regards (vue)",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "pluriel de بصر (yeux/vues) — champ sensoriel stable",
    tokens: ["eye", "sight"],
  },
  عاد: {
    gloss: "le peuple de 'Ad / revenir",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "nom propre de peuple (38 % MASAQ) + verbe عاد (revenir) : homonymie — cas particulier (nom propre)",
    tokens: ["aad", "return"],
  },
  بيت: {
    gloss: "maison",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "substantif stable (house) — univoque",
    tokens: ["house"],
  },
  عين: {
    gloss: "œil / source (d'eau)",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "deux sens majeurs (œil, source) — polysémie non tranchée à l'échelle du lemme",
    tokens: ["eye", "spring"],
  },
  أيد: {
    gloss: "mains / affermir",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "أيْدٍ (mains) vs أيّد (affermir) — homonymie au sein des formes",
    tokens: ["hand", "strengthen", "support"],
  },
  نعيم: {
    gloss: "délices / bonheur (du Paradis)",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "substantif stable (delight) — champ unique",
    tokens: ["delight", "bliss", "enjoy"],
  },
  مدين: {
    gloss: "Madyan (cité)",
    classification: "REVIEW_REQUIRED",
    confidence: 0.35,
    rationale: "nom propre de cité (Midyane) — cas particulier prévu par la règle éditoriale",
    tokens: ["madyan", "midian"],
  },
  // ═══════ 71–100 ═══════
  حميم: {
    gloss: "(eau) brûlante / intime",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "حميم (eau bouillante) vs حميم (proche parent) — deux sens majeurs documentés",
    tokens: ["scalding", "boiling", "intimate"],
  },
  قطع: {
    gloss: "couper / rompre",
    classification: "SAFE",
    confidence: 0.5,
    rationale: "champ stable (cut, sever) — toutes les formes du même champ",
    tokens: ["cut", "sever", "break", "cut-off"],
  },
  مجرم: {
    gloss: "criminel / coupable",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "participe actif stable (criminals 42 % MASAQ)",
    tokens: ["criminal", "guilty"],
  },
  امرأ: {
    gloss: "femme / épouse (être humain)",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "le lemme couvre امرأة (femme/épouse) ET امرؤ (un homme) — l'évidence Hikma WT « l'épouse / une femme / un homme » atteste l'ambiguité de genre — validation requise",
    tokens: ["wife", "woman", "female"],
  },
  ذهب: {
    gloss: "s'en aller / or",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "verbe (s'en aller) et substantif (or) — homonymie classique",
    tokens: ["go", "depart", "gold"],
  },
  آتي: {
    gloss: "venir / apporter",
    classification: "REVIEW_REQUIRED",
    confidence: 0.5,
    rationale: "champ 'venir/apporter' (we-gave 28 %, 2 stems MASAQ) — verbs مضا etc. ; validation",
    tokens: ["come", "bring", "give"],
  },
  قيام: {
    gloss: "résurrection",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "emploi coranique dominé par 'jour de la résurrection' (79 % MASAQ) — stable",
    tokens: ["resurrection"],
  },
  ملائك: {
    gloss: "anges",
    classification: "SAFE",
    confidence: 0.75,
    rationale: "pluriel stable (the-angels 56 % MASAQ) — univoque",
    tokens: ["angel"],
  },
  قليل: {
    gloss: "peu",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "adjectif stable (a-little 32 % MASAQ) — univoque",
    tokens: ["little", "few"],
  },
  تذكر: {
    gloss: "se rappeler / méditer",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "formes V du verbe ذكر (remember 22 % MASAQ) — champ évocation stable",
    tokens: ["rememb", "recal", "ponder"],
  },
  جحيم: {
    gloss: "la Géhenne (feu ardent)",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "nom propre stable (the-hellfire 27 %) — glose évidente",
    tokens: ["hellfire", "hell"],
  },
  سجد: {
    gloss: "se prosterner",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "verbe univoque (prostrate) — champ cultuel stable",
    tokens: ["prostrat", "bow"],
  },
  زين: {
    gloss: "parer / ornement",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "زين (ornement) vs زيَّن (embellir, rendre trompeur) — deux faces du champ, validation",
    tokens: ["adorn", "ornament", "beaut"],
  },
  محسن: {
    gloss: "bienfaisant",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "participe actif (good-doers 42 % MASAQ) — champ du bien stable",
    tokens: ["good-doer", "beneficent", "good"],
  },
  قلب: {
    gloss: "cœur / bouleverser",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "substantif (cœur) et verbe قلب (bouleverser, retourner) — polisémique",
    tokens: ["heart", "overturn", "invert"],
  },
  ألف: {
    gloss: "mille",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "numéral (mille) majoritaire mais forme ألّف (unir, fidèle) attestée — validation",
    tokens: ["thousand"],
  },
  أموال: {
    gloss: "biens / richesses",
    classification: "SAFE",
    confidence: 0.65,
    rationale: "pluriel stable (wealth) — champ matériel univoque",
    tokens: ["wealth", "possession", "proper"],
  },
  كتب: {
    gloss: "écrire / prescrire / livres",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "verbe (prescrire, écrire) et substantif (livres) — plusieurs sens majeurs",
    tokens: ["write", "prescrib", "book", "decreed"],
  },
  أحسن: {
    gloss: "faire le bien / meilleur",
    classification: "REVIEW_REQUIRED",
    confidence: 0.45,
    rationale: "أحسن (mieux) vs أحسنَ (bien agir) — deux usages, validation",
    tokens: ["best", "better", "good"],
  },
  ذنوب: {
    gloss: "péché/ péchés",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "pluriel stable (sins) — champ religieux univoque",
    tokens: ["sin"],
  },
  كلم: {
    gloss: "parole(s) / parler",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "كلم (parole/mot) vs كلمَ (parler à) — nominal et verbal entremêlés ; validation",
    tokens: ["word", "speak", "speech"],
  },
  سواء: {
    gloss: "égal / même",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "adjectif stable (equal) — usages figés (سويه) et comparatifs du même champ",
    tokens: ["equal", "same"],
  },
  كبير: {
    gloss: "grand",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "adjectif stable (great 33 % MASAQ) — univoque",
    tokens: ["great", "big"],
  },
  كفار: {
    gloss: "mécréant / négateur",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "intensif stable (disbelievers 46 % MASAQ) — champ Religion",
    tokens: ["disbeliever", "unbeliever", "infidel"],
  },
  ثلاث: {
    gloss: "trois",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "numéral cardinal stable (three 43 %) — univoque",
    tokens: ["three"],
  },
  سيئ: {
    gloss: "mal / mauvaise action",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "adjectif/substantif du mal (the-evil) — champ stable, formes féminines (سيئة) du même champ",
    tokens: ["evil", "bad", "ill"],
  },
  مشرك: {
    gloss: "polythéiste / associateur",
    classification: "SAFE",
    confidence: 0.7,
    rationale: "participe actif (polytheists 56 % MASAQ) — champ technique stable",
    tokens: ["polytheist", "associator"],
  },
  أيمان: {
    gloss: "serments / mains",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "أيمان (serments) vs أيمان (droites/mains) — homonymie complexe, validation stricte",
    tokens: ["oath", "hand", "right"],
  },
  معروف: {
    gloss: "convenable / (bien) connu, droit",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "participe stable (ma'ruf : le bien reconnu) — wt Hikma « de façon convenable / avec le convenable » ; usage coranique répété",
    tokens: ["know", "right", "kind"],
  },
  صاحب: {
    gloss: "compagnon / associé",
    classification: "SAFE",
    confidence: 0.55,
    rationale: "participe stable (companion, associate) — champ relationnel ; confirmé par wt Hikma « à son compagnon / à son associé »",
    tokens: ["companion", "associate"],
  },
  ابن: {
    gloss: "fils",
    classification: "SAFE",
    confidence: 0.6,
    rationale: "substantif stable (son 30 % MASAQ) — voir بن (REVIEW) pour éviter le double import",
    tokens: ["son"],
  },
  عرض: {
    gloss: "exposer / biens de ce monde",
    classification: "REVIEW_REQUIRED",
    confidence: 0.4,
    rationale: "verbe (exposer, survenir) vs substantif (biens passagers) — deux emplois majeurs",
    tokens: ["show", "offer", "commod", "goods"],
  },
};

/* ———————————————————————————————————————————————————————————————————————
 * Utils
 * ——————————————————————————————————————————————————————————————————————— */

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* ok */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

/* ———————————————————————————————————————————————————————————————————————
 * Audit principal (READ-ONLY)
 * ——————————————————————————————————————————————————————————————————————— */

type CandidateRow = {
  lemmaId: string;
  arabic: string;
  rank: number;
  forms: number;
  occurrences: number;
  surahs: number;
  uncoveredForms: number;
  uncoveredOccurrences: number;
  uncoveredSurahs: number;
  impactedSurahs: number[];
  priorityScore: number | null;
  editorialConfidence: number;
  masaqMappingQuality: number | null;
  masaqExactRatio: number | null;
  priorClassification: string;
  proposal: {
    gloss: string;
    classification: "SAFE" | "REVIEW_REQUIRED" | "DO_NOT_IMPORT";
    confidence: number;
    rationale: string;
  };
  classification: "SAFE" | "REVIEW_REQUIRED" | "DO_NOT_IMPORT";
  confidence: number;
  evidenceAlignment: boolean;
  overriddenByEvidence: boolean;
  newForms: number;
  newOccurrences: number;
  sourceEvidence: {
    hikmaGlossEvidence: string | null;
    existingLemmaTranslations: Array<{ language: string; text: string; validated: boolean }>;
    hikmaWordTranslations: string[];
    masaqTopGlosses: { gloss: string; count: number }[];
    masaqDistinctGlosses: number;
    masaqStems: string[];
    masaqPos: string[];
    hamidullahSamples: string[];
    kazimirskiSamples: string[];
  };
};

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const t0 = Date.now();

  console.log("=== PHASE 88F-D — TOP 100 LEMMA EDITORIAL AUDIT (READ-ONLY) ===");

  // ─── Priority list PHASE 88F-C (source exclusive du batch) ───────────────
  let cReport: { batch2: { top100: Array<Record<string, unknown>> } };
  try {
    cReport = JSON.parse(readFileSync(INPUT_C, "utf-8"));
  } catch {
    console.error(`${INPUT_C} introuvable — exécuter PHASE 88F-C d'abord.`);
    process.exit(1);
  }
  const top100 = cReport.batch2.top100.slice(0, 100);
  console.log(`  priority list 88F-C : ${top100.length} candidats`);

  // ─── Sources ───────────────────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id, name").in("name", [HIKMA_SOURCE]);
  const hikmaId = (srcRows ?? []).find(s => s.name === HIKMA_SOURCE)?.id ?? "";
  if (!hikmaId) throw new Error(`Source ${HIKMA_SOURCE} introuvable.`);

  // ─── Chargement des tables de référence ────────────────────────────────────
  console.log("→ Chargement…");
  const surahRows = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const occRows = await selectAll<{ id: string; word_id: string; ayah_id: string }>(client, "word_occurrences", "id, word_id, ayah_id");
  const lemmaRows = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  const wlmRows = await selectAll<{ id: string; word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "id, word_id, lemma_id");
  const wtRows = await selectAll<{ id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null }>(client, "word_translations", "id, word_id, text, language, is_validated, source_id");
  const ltRows = await selectAll<{ id: string; lemma_id: string; language: string; text: string; is_validated: boolean; source_id: string | null }>(client, "lemma_translations", "id, lemma_id, language, text, is_validated, source_id");
  const loRows = await selectAll<{ id: string; word_occurrence_id: string; hikma_lemma_id: string | null; lemma_mapping_status: string; masaq_gloss_en: string | null; masaq_stem: string | null; pos: string[] }>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos");
  // Traductions de verset FR (Hamidullah + Kazimirski) — évidence contextuelle.
  const trRows = await selectAll<{ ayah_id: string; translator: string; text: string }>(client, "translations", "ayah_id, translator, text");
  console.log(`  corpus: surahs=${surahRows.length} ayahs=${ayahRows.length} words=${wordRows.length} occs=${occRows.length} lemmas=${lemmaRows.length} wlm=${wlmRows.length} wt=${wtRows.length} lt=${ltRows.length} lo=${loRows.length} tr=${trRows.length}`);

  // ─── Résolution mot → lemme ────────────────────────────────────────────────
  const finalLemma = new Map<string, string>();
  for (const w of wordRows) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlmRows) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  for (const l of loRows) {
    if (!l.hikma_lemma_id) continue;
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, l.hikma_lemma_id);
  }

  // ─── Couverture FR validée (source Hikma) et UNION ─────────────────────────
  const wtFr = new Map<string, string>();
  for (const r of wtRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of ltRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) ltFr.set(r.lemma_id, r.text);

  const A = new Set(wtFr.keys());
  const B = new Set<string>();
  for (const [wid, lid] of finalLemma) if (ltFr.has(lid)) B.add(wid);
  const union = new Set<string>(A);
  for (const wid of B) union.add(wid);
  const inter = [...A].filter(w => B.has(w)).length;

  const occCountByWord = new Map<string, number>();
  for (const o of occRows) occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);

  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const surahIdByNumber = new Map(surahRows.map(s => [s.number, s.id]));

  // ─── Agrégats par lemme ────────────────────────────────────────────────────
  const lemmaForms = new Map<string, Set<string>>();
  const lemmaSurahSet = new Map<string, Set<number>>();
  for (const [wid, lid] of finalLemma) {
    let set = lemmaForms.get(lid);
    if (!set) { set = new Set(); lemmaForms.set(lid, set); }
    set.add(wid);
  }
  for (const o of occRows) {
    const lid = finalLemma.get(o.word_id);
    if (!lid) continue;
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn === undefined) continue;
    let set = lemmaSurahSet.get(lid);
    if (!set) { set = new Set(); lemmaSurahSet.set(lid, set); }
    set.add(sn);
  }

  // Agrégats MASAQ par lemme (via hikma_lemma_id documenté dans linguistic_occurrences)
  const loGlossByLemma = new Map<string, Map<string, number>>();
  const loStatusByLemma = new Map<string, Map<string, number>>();
  const loStemsByLemma = new Map<string, Set<string>>();
  const loPosByLemma = new Map<string, Set<string>>();
  const loOccPerLemma = new Map<string, number>();
  for (const l of loRows) {
    if (!l.hikma_lemma_id) continue;
    const lid = l.hikma_lemma_id;
    loOccPerLemma.set(lid, (loOccPerLemma.get(lid) ?? 0) + 1);
    if (l.masaq_gloss_en) {
      let m = loGlossByLemma.get(lid);
      if (!m) { m = new Map(); loGlossByLemma.set(lid, m); }
      m.set(l.masaq_gloss_en, (m.get(l.masaq_gloss_en) ?? 0) + 1);
    }
    let st = loStatusByLemma.get(lid);
    if (!st) { st = new Map(); loStatusByLemma.set(lid, st); }
    st.set(l.lemma_mapping_status, (st.get(l.lemma_mapping_status) ?? 0) + 1);
    if (l.masaq_stem) {
      let s = loStemsByLemma.get(lid);
      if (!s) { s = new Set(); loStemsByLemma.set(lid, s); }
      s.add(l.masaq_stem);
    }
    for (const p of l.pos) {
      let ps = loPosByLemma.get(lid);
      if (!ps) { ps = new Set(); loPosByLemma.set(lid, ps); }
      ps.add(p);
    }
  }

  // Hikma word translations par lemme (toutes les formes, texte unique validé FR)
  const hikmaWtByLemma = new Map<string, Set<string>>();
  for (const r of wtRows) {
    if (r.language !== "fr" || !r.is_validated || r.source_id !== hikmaId) continue;
    const lid = finalLemma.get(r.word_id);
    if (!lid) continue;
    let set = hikmaWtByLemma.get(lid);
    if (!set) { set = new Set(); hikmaWtByLemma.set(lid, set); }
    set.add(r.text);
  }

  // Traductions de versets FR (contextes)
  const hamByAyah = new Map<string, string>();
  const kazByAyah = new Map<string, string>();
  for (const t of trRows) {
    if (t.translator === HAMIDULLAH_TR) hamByAyah.set(t.ayah_id, t.text);
    else if (t.translator === KAZIMIRSKI_TR) kazByAyah.set(t.ayah_id, t.text);
  }

  // ─── Baseline : sourates + MASAQ ───────────────────────────────────────────
  const surahForms = new Map<number, Set<string>>();
  const surahOccs = new Map<number, number>();
  for (const o of occRows) {
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn === undefined) continue;
    let set = surahForms.get(sn);
    if (!set) { set = new Set(); surahForms.set(sn, set); }
    set.add(o.word_id);
    surahOccs.set(sn, (surahOccs.get(sn) ?? 0) + 1);
  }

  const surahCoverage: Array<{
    number: number; name: string; totalForms: number; coveredForms: number; uncoveredForms: number;
    coveragePct: number; totalOccs: number; coveredOccs: number; uncoveredOccs: number; state: string;
  }> = [];
  for (const [sn, forms] of surahForms) {
    let covered = 0;
    for (const wid of forms) if (union.has(wid)) covered++;
    let coveredOccs = 0;
    const sid = surahIdByNumber.get(sn);
    for (const o of occRows) {
      if (union.has(o.word_id) && ayahToSurah.get(o.ayah_id) === sid) coveredOccs++;
    }
    // Règle classifySurahReadiness (lib/learning/queries.ts) : READY ssi 100 % ;
    // sourate 1 = REFERENCE (référence verrouillée).
    const state = sn === 1 ? "REFERENCE" : (covered / forms.size >= 1 ? "READY" : "IN_PREPARATION");
    surahCoverage.push({
      number: sn,
      name: surahRows.find(s => s.number === sn)?.name_transliteration ?? `Surah ${sn}`,
      totalForms: forms.size,
      coveredForms: covered,
      uncoveredForms: forms.size - covered,
      coveragePct: ROUND(covered / forms.size, 4),
      totalOccs: surahOccs.get(sn) ?? 0,
      coveredOccs,
      uncoveredOccs: (surahOccs.get(sn) ?? 0) - coveredOccs,
      state,
    });
  }
  surahCoverage.sort((a, b) => a.number - b.number);
  const readyCount = surahCoverage.filter(s => s.state === "READY").length;
  const inPrepCount = surahCoverage.filter(s => s.state === "IN_PREPARATION").length;

  // Couverture MASAQ réelle : COUNT DISTINCT sourate via linguistic_occurrences.
  const masaqSurahNumbers = new Set<number>();
  for (const l of loRows) {
    const wid = occToWord.get(l.word_occurrence_id);
    if (!wid) continue;
    for (const o of occRows) {
      if (o.word_id !== wid) continue;
      const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
      if (sn !== undefined) masaqSurahNumbers.add(sn);
    }
  }
  const masaqSurahCount = masaqSurahNumbers.size;
  const masaqMissingSurahs = surahCoverage
    .filter(s => !masaqSurahNumbers.has(s.number))
    .map(s => s.number);

  // ─── Traitement des 100 candidats ──────────────────────────────────────────
  console.log("→ Analyse éditoriale des 100 candidats…");
  const candidates: CandidateRow[] = [];
  for (let i = 0; i < top100.length; i++) {
    const c0 = top100[i];
    const lid = String(c0.lemmaId);
    const arabic = String(c0.arabic);
    const formIds = [...(lemmaForms.get(lid) ?? [])];
    const uncoveredSet = new Set(formIds.filter(wid => !union.has(wid)));
    const uncovered = [...uncoveredSet];
    const uncoveredOccs = uncovered.reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0);
    const uncoveredSurahSet = new Set<number>();
    const sampleAyahs: string[] = [];
    for (const o of occRows) {
      if (!uncoveredSet.has(o.word_id)) continue;
      const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
      if (sn !== undefined) uncoveredSurahSet.add(sn);
      if (sampleAyahs.length < 6) sampleAyahs.push(o.ayah_id);
    }

    const glossMap = loGlossByLemma.get(lid);
    const topGlosses = glossMap ? [...glossMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([gloss, count]) => ({ gloss, count })) : [];
    const statusMap = loStatusByLemma.get(lid);
    const exact = statusMap?.get("EXACT") ?? 0;
    const loTotal = loOccPerLemma.get(lid) ?? 0;
    const exactRatio = loTotal > 0 ? ROUND(exact / loTotal, 3) : null;

    const stemSet = loStemsByLemma.get(lid);
    const posSet = loPosByLemma.get(lid);

    const wtTexts = hikmaWtByLemma.get(lid);
    const ltRowsFor = ltRows.filter(r => r.lemma_id === lid);

    // Contextes Hamidullah / Kazimirski (versets des formes à couvrir)
    const hamSamples: string[] = [];
    const kazSamples: string[] = [];
    for (const aid of sampleAyahs) {
      if (hamSamples.length < 3) {
        const t = hamByAyah.get(aid);
        if (t) hamSamples.push(t.slice(0, 120));
      }
      if (kazSamples.length < 3) {
        const t = kazByAyah.get(aid);
        if (t) kazSamples.push(t.slice(0, 120));
      }
      if (hamSamples.length >= 3 && kazSamples.length >= 3) break;
    }

    const proposal = EDITORIAL[arabic];
    if (!proposal) {
      console.error(`  ⚠ Aucune proposition éditoriale pour ${arabic} (${lid})`);
      process.exit(1);
    }

    // Alignement d'évidence : la glose doit retrouver un écho dans les gloses MASAQ.
    const normGlosses = topGlosses.map(g => g.gloss.toLowerCase().replace(/[()\-]/g, " ").replace(/\s+/g, " ").trim());
    const joined = normGlosses.join(" ");
    const evidenceAlignment = proposal.tokens.length > 0 && proposal.tokens.some(tok => joined.includes(tok));

    let classification = proposal.classification;
    let overridden = false;
    if (classification === "SAFE" && !evidenceAlignment && topGlosses.length > 0) {
      classification = "REVIEW_REQUIRED";
      overridden = true;
    }

    const candidate: CandidateRow = {
      lemmaId: lid,
      arabic,
      rank: i + 1,
      forms: formIds.length,
      occurrences: formIds.reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      surahs: lemmaSurahSet.get(lid)?.size ?? 0,
      uncoveredForms: uncovered.length,
      uncoveredOccurrences: uncoveredOccs,
      uncoveredSurahs: uncoveredSurahSet.size,
      impactedSurahs: [...uncoveredSurahSet].sort((a, b) => a - b),
      priorityScore: typeof c0.priorityScore === "number" ? c0.priorityScore : null,
      editorialConfidence: typeof c0.editorialConfidence === "number" ? c0.editorialConfidence : 0.6,
      masaqMappingQuality: typeof c0.masaqMappingQuality === "number" ? c0.masaqMappingQuality : null,
      masaqExactRatio: exactRatio,
      priorClassification: String(c0.classification ?? ""),
      proposal: {
        gloss: proposal.gloss,
        classification: proposal.classification,
        confidence: proposal.confidence,
        rationale: proposal.rationale,
      },
      classification,
      confidence: proposal.confidence,
      evidenceAlignment,
      overriddenByEvidence: overridden,
      newForms: uncovered.length,
      newOccurrences: uncoveredOccs,
      sourceEvidence: {
        hikmaGlossEvidence: typeof c0.hikmaGlossEvidence === "string" ? c0.hikmaGlossEvidence : null,
        masaqTopGlosses: topGlosses,
        masaqDistinctGlosses: glossMap?.size ?? 0,
        masaqStems: stemSet ? [...stemSet] : [],
        masaqPos: posSet ? [...posSet].slice(0, 12) : [],
        hikmaWordTranslations: wtTexts ? [...wtTexts].slice(0, 8) : [],
        existingLemmaTranslations: ltRowsFor.map(r => ({ language: r.language, text: r.text.slice(0, 60), validated: r.is_validated })),
        hamidullahSamples: hamSamples,
        kazimirskiSamples: kazSamples,
      },
    };
    candidates.push(candidate);
  }

  const safeCands = candidates.filter(c => c.classification === "SAFE");
  const reviewCands = candidates.filter(c => c.classification === "REVIEW_REQUIRED");
  const dontCands = candidates.filter(c => c.classification === "DO_NOT_IMPORT");
  console.log(`  SAFE=${safeCands.length} REVIEW_REQUIRED=${reviewCands.length} DO_NOT_IMPORT=${dontCands.length}`);

  // ─── Simulations TOP 10/20/30/50/100 (UNION réelle des word_id, SAFE uniquement) ──
  const simResults: Array<Record<string, unknown>> = [];
  for (const [label, count] of [["TOP_10", 10], ["TOP_20", 20], ["TOP_30", 30], ["TOP_50", 50], ["TOP_100", 100]] as const) {
    const slice = candidates.slice(0, count);
    const safeInSlice = slice.filter(c => c.classification === "SAFE");
    const newFormSet = new Set<string>();
    for (const c of safeInSlice) {
      for (const wid of lemmaForms.get(c.lemmaId) ?? []) {
        if (!union.has(wid)) newFormSet.add(wid);
      }
    }
    const newOcc = [...newFormSet].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0);
    const simUnion = new Set(union);
    for (const wid of newFormSet) simUnion.add(wid);

    const newReady: number[] = [];
    let improved = 0;
    for (const [sn, forms] of surahForms) {
      if (sn === 1) continue;
      let covBefore = 0, covAfter = 0;
      for (const wid of forms) {
        if (union.has(wid)) covBefore++;
        if (simUnion.has(wid)) covAfter++;
      }
      if (covBefore < forms.size && covAfter === forms.size) newReady.push(sn);
      if (covAfter > covBefore) improved++;
    }
    simResults.push({
      scenario: label,
      candidatesInSlice: slice.length,
      safeInSlice: safeInSlice.length,
      newForms: newFormSet.size,
      newOccurrences: newOcc,
      unionFrAfter: simUnion.size,
      formsWithoutFrAfter: wordRows.length - simUnion.size,
      coveragePctAfter: ROUND(simUnion.size / wordRows.length, 3),
      improvedSurahs: improved,
      newReadySurahs: newReady,
      newReadyCount: newReady.length,
    });
  }

  // ─── Contrôles d'intégrité ──────────────────────────────────────────────────
  const lemmaIds = new Set(lemmaRows.map(l => l.id));
  let orphanRefs = 0;
  for (const w of wordRows) if (w.lemma_id && !lemmaIds.has(w.lemma_id)) orphanRefs++;
  for (const m of wlmRows) if (!lemmaIds.has(m.lemma_id)) orphanRefs++;
  for (const l of loRows) if (l.hikma_lemma_id && !lemmaIds.has(l.hikma_lemma_id)) orphanRefs++;

  const wlmKeyCount = new Map<string, number>();
  for (const m of wlmRows) {
    const k = `${m.word_id}|${m.lemma_id}`;
    wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1);
  }
  const dupWlm = [...wlmKeyCount.entries()].filter(([, v]) => v > 1).length;

  const ltKeyCount = new Map<string, number>();
  for (const r of ltRows) {
    const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`;
    ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1);
  }
  const dupLt = [...ltKeyCount.entries()].filter(([, v]) => v > 1).length;

  const wlmByWord = new Map<string, string>();
  for (const m of wlmRows) wlmByWord.set(m.word_id, m.lemma_id);
  let contradictory = 0;
  for (const w of wordRows) {
    const direct = w.lemma_id;
    const viaWlm = wlmByWord.get(w.id);
    if (direct && viaWlm && direct !== viaWlm) contradictory++;
  }

  // ─── Base de référence (recalculée) ──────────────────────────────────────────
  const baseline = {
    quranWords: wordRows.length,
    wordOccurrences: occRows.length,
    lemmas: lemmaRows.length,
    lemmasActive: new Set(finalLemma.values()).size,
    wordLemmaMapping: wlmRows.length,
    wordTranslationsHikmaFrValidated: wtFr.size,
    lemmaTranslationsHikmaFrValidated: ltFr.size,
    linguisticOccurrences: loRows.length,
    ayahs: ayahRows.length,
    surahs: surahRows.length,
    frCoverage: {
      byWordTranslation: A.size,
      byLemmaTranslation: B.size,
      intersection: inter,
      union: union.size,
      unionPct: ROUND(union.size / wordRows.length, 4),
      withoutFr: wordRows.length - union.size,
    },
    frOccurrences: {
      total: occRows.length,
      covered: [...union].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      withoutFr: occRows.length - [...union].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
    },
    ready: {
      READY: readyCount,
      IN_PREPARATION: inPrepCount,
      REFERENCE: 1,
      total: surahCoverage.length,
      rule: "classifySurahReadiness : READY ssi 100 % des formes résolues en FR (sourate 1 = REFERENCE)",
    },
    masaq: {
      distinctSurahsInLinguisticOccurrences: masaqSurahCount,
      surahsMissingMasaq: masaqMissingSurahs.length,
      surahsMissingMasaqNums: masaqMissingSurahs,
      note: "compté directement depuis linguistic_occurrences (via word_occurrence → ayah → surah)",
    },
  };

  // ─── Rapport ────────────────────────────────────────────────────────────────
  const report = {
    phase: "88F-D",
    mode: "READ_ONLY_EDITORIAL_AUDIT",
    timestamp: new Date().toISOString(),
    verdict: "PHASE_88F_D_COMPLETE",
    writes: { database: 0, lexical: 0, translation: 0, curriculum: 0, masaq: 0, migrations: 0, seeds: 0 },
    baseline,
    source: {
      report88fC: INPUT_C,
      candidatesTaken: top100.length,
      rankOrder: "ordre de priorityScore décroissant de PHASE 88F-C, non reconstruit",
    },
    principles: {
      glossLevel: "lemme — sens lexical/pédagogique, pas sens contextual unique (règle 88F-D §4)",
      dedup: "gains dédupliqués par word_id (UNION réelle), jamais additionnés par lemme",
      sources: ["Hikma KNOWN_GLOSSES / HIKMA_GLOSS_EVIDENCE (88F-C)", "lemma_translations existantes", "word_translations Hikma existantes", "Hamidullah FR (verse)", "Kazimirski — Le Koran (verse)", "MASAQ gloss EN (linguistic_occurrences)", "POS / stems MASAQ"],
    },
    candidates,
    simulations: simResults,
    integrityChecks: {
      orphanLemmaReferences: orphanRefs,
      duplicateWordLemmaMapping: dupWlm,
      duplicateLemmaTranslations: dupLt,
      contradictoryDirectWlm: contradictory,
      existingTranslationsUntouched: {
        wordTranslationsValidatedFr: wtFr.size,
        lemmaTranslationsValidatedFr: ltFr.size,
        note: "0 écriture effectuée par cette phase (aucun appel d'insert/update/delete)",
      },
      dbWrites: 0,
    },
    invariants: {
      databaseWrites: 0,
      lexicalWrites: 0,
      translationWrites: 0,
      curriculumWrites: 0,
      masaqWrites: 0,
      migrations: 0,
      seeds: 0,
      totalSurahs: surahRows.length,
    },
    nextPhase: safeCands.length > 0
      ? "PHASE 88F-E — SAFE LEMMA GLOSS IMPORT : importer les gloses FR des candidats SAFE identifiés (n écritures lemma_translations, source Hikma), puis re-audit 88F-C/88F-D"
      : "aucun candidat SAFE — aucune phase d'import ne peut être proposée",
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);
  console.log(`Durée totale : ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // ─── Résumé terminal ────────────────────────────────────────────────────────
  console.log("\n=== PHASE 88F-D — AUDIT TERMINÉ (0 écriture DB) ===");
  console.log("PHASE_88F_D_COMPLETE");
  console.log(`\nSAFE = ${safeCands.length} (${safeCands.reduce((s, c) => s + c.newForms, 0)} formes · ${safeCands.reduce((s, c) => s + c.newOccurrences, 0)} occurrences)`);
  console.log(`REVIEW_REQUIRED = ${reviewCands.length}`);
  console.log(`DO_NOT_IMPORT = ${dontCands.length}`);
  console.log("\n─── TOP 30 ───");
  console.log("Rank  Lemma    Gloss FR                                 Forms  NewF  NewO  Class  Conf");
  for (const c of candidates.slice(0, 30)) {
    const cls = c.classification === "SAFE" ? "SAFE" : c.classification === "REVIEW_REQUIRED" ? "REV" : "NO_IMPORT";
    console.log(
      `${String(c.rank).padEnd(5)} ${c.arabic.padEnd(8)} ${c.proposal.gloss.padEnd(40)} ${String(c.forms).padEnd(6)} ${String(c.newForms).padEnd(5)} ${String(c.newOccurrences).padEnd(5)} ${cls.padEnd(9)} ${c.proposal.confidence.toFixed(2)}`
    );
  }
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
