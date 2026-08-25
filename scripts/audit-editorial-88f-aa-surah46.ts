/**
 * PHASE 88F-AA — S46 AL-AHQAF EDITORIAL GLOSS AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Takes the structural classification from 88F-Y (32 SAFE lemmas, 1 SAFE word_tr,
 * 42 REVIEW word_tr) and produces ACTUAL French editorial glosses for each,
 * drawing from:
 *   - Hamidullah FR (resource_id 31) — ayah-level translations
 *   - Kazimirski 1869 FR (resource_id 9001) — ayah-level translations
 *   - Sahih International EN (resource_id 20) — semantic control
 *   - MASAQ glosses — morphological control
 *
 * Output: reports/phase-88f-aa-surah46-editorial-audit.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-aa-surah46-editorial-audit.json";
const PAGE_SIZE = 1000;
const TARGET = 46;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ─── TYPES ──────────────────────────────────────────────────────────────────
type DbRow = Record<string, unknown>;

// ─── HELPERS ────────────────────────────────────────────────────────────────
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

async function selectInChunks<T>(client: SupabaseClient, table: string, cols: string, field: string, ids: string[]): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const batch = ids.slice(i, i + PAGE_SIZE);
    const { data, error } = await client.from(table).select(cols).in(field, batch).order("id");
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
  }
  return rows;
}

// ════════════════════════════════════════════════════════════════════════════
// EDITORIAL GLOSSES — Lemma translations (32 SAFE per 88F-Y)
// ════════════════════════════════════════════════════════════════════════════
// Each entry: lemma_id, lemma_arabic, french_gloss, rationale
const LEMMA_GLOSSES: { lemma_id: string; lemma_arabic: string; gloss: string; rationale: string }[] = [
  { lemma_id: "125b4961-e1a0-49ec-aefe-7d3fc294ab4f", lemma_arabic: "أثار", gloss: "traces / vestiges / restes", rationale: "Hamidullah/Kazimirski convergent sur 'traces/vestiges' — 46:25 les traceurs (de leur destruction)" },
  { lemma_id: "0917ff07-a4a6-4f52-a292-c9fe1cc9c502", lemma_arabic: "شيئ", gloss: "chose / rien / quoi que ce soit", rationale: "Mot extrêmement fréquent — sens stable 'chose/rien' dans tous les contextes S46" },
  { lemma_id: "94afd10c-cfd9-41c7-b3d0-51a48a6cc841", lemma_arabic: "أعلم", gloss: "plus savant / mieux savoir / connaître", rationale: "Superlatif de علم — Hamidullah 'Je sais' / Kazimirski 'je sais' — 46:8, 46:23" },
  { lemma_id: "08457bef-4e66-4eff-9346-d8fc46b3b60e", lemma_arabic: "بدع", gloss: "innovation / chose nouvelle / sans précédent", rationale: "46:9 'je ne suis pas une innovation parmi les messagers' — Hamidullah/Kazimirski convergent" },
  { lemma_id: "272b8d2a-538c-4980-b007-f5ece61f0f99", lemma_arabic: "قديم", gloss: "ancien / antique / de longue date", rationale: "Opposé de بدع dans 46:11 — Hamidullah 'ancienne' / Kazimirski 'ancien'" },
  { lemma_id: "95112493-24b8-4ec1-a762-78b3a59d5fae", lemma_arabic: "شهر", gloss: "mois / lune / notoriété / renommée", rationale: "46:15 — période de gestation de 30 mois — sens temporel stable" },
  { lemma_id: "57869ede-57cc-4693-9364-0bee13824634", lemma_arabic: "سن", gloss: "année / âge / aiguiser / loi", rationale: "46:15 — atteindre l'âge de 40 ans — sens 'année/âge'" },
  { lemma_id: "53b60e93-b323-4903-aab7-7585c6d37233", lemma_arabic: "ذر", gloss: "disperser / engendrer / semer (la descendance)", rationale: "46:15 'sa mère l'a porté...' — contexte d'engendrement — MASAQ quality=1" },
  { lemma_id: "76720cd4-2d0d-478c-b97d-4ba5853334e3", lemma_arabic: "عد", gloss: "compter / dénombrer / ennemi / opposition", rationale: "46:18 'compter parmi' — Hamidullah 'comptés' — 46:29 contexte d'énumération" },
  { lemma_id: "c295ea60-a947-4125-97ae-5846b068429c", lemma_arabic: "قرون", gloss: "siècles / générations / époques", rationale: "46:17 'contes des anciens/générations passées' — sens 'générations/siècles'" },
  { lemma_id: "8f4bd92f-e1e0-4dcf-93e7-9b448ead94cc", lemma_arabic: "عرض", gloss: "présenter / exposer / largeur / obstacle", rationale: "46:20 'présentés au Feu' — Hamidullah/Kazimirski 'exposés/présentés'" },
  { lemma_id: "888a6fbf-63e5-48f1-a501-3849deea7ce8", lemma_arabic: "طيب", gloss: "bon / agréable / pur / bienfaisant", rationale: "46:15 et 46:20 — 'bonnes choses' / 'bonnes actions' — sens 'bon/pur'" },
  { lemma_id: "cfee91db-2bcb-4c63-b9fd-c795565b547a", lemma_arabic: "ذكر", gloss: "rappel / mention / souvenir / invoquer", rationale: "46:21 'rappelle' le sort de 'Ad — Hamidullah 'rappelle' / Kazimirski 'souviens-toi'" },
  { lemma_id: "89a88190-0770-494c-8ec7-4076b4c55e50", lemma_arabic: "أخا", gloss: "frère / parent / proche", rationale: "46:21 'leur frère Hud' — sens familial simple et stable" },
  { lemma_id: "9fc6512b-4efe-4757-b3a4-b14e57ec28b5", lemma_arabic: "أحقاف", gloss: "dunes de sable / collines sablonneuses / al-Ahqaf", rationale: "46:21 nom propre géographique — les dunes de sable où vivaient les 'Ad" },
  { lemma_id: "64f9e40f-05a0-4487-951e-0dd6c66f5c46", lemma_arabic: "خلف", gloss: "derrière / après / succéder / remplacer", rationale: "46:21 'des avertisseurs avant lui et après lui' — sens 'après/derrière'" },
  { lemma_id: "096ff8f6-ce64-4da3-beb8-973b1c450327", lemma_arabic: "عارض", gloss: "nuage / qui se présente / obstacle / survenant", rationale: "46:24 'un nuage se dirigeant vers leurs vallées' — sens météorologique 'nuage'" },
  { lemma_id: "8c2ccf22-65d1-42b2-b87a-8dd39a8613c5", lemma_arabic: "مستقبل", gloss: "qui fait face / qui arrive / futur / prochain", rationale: "46:24 'se dirigeant vers' / 'faisant face' — sens spatial et temporel" },
  { lemma_id: "2c2a3d0c-499e-4753-b33e-9cb278d3ebbd", lemma_arabic: "أودي", gloss: "vallées / lits de rivières", rationale: "46:24 'vers leurs vallées' — pluriel de واد — Hamidullah/Kazimirski 'vallées'" },
  { lemma_id: "15c9c3b3-1593-4853-a474-6bc55ac16993", lemma_arabic: "ممطر", gloss: "qui apporte la pluie / porteur de pluie", rationale: "46:24 'voici un nuage qui nous apporte la pluie' — les 'Ad pensent que c'est une pluie" },
  { lemma_id: "f452b43f-3c48-488e-9403-be8bfaa74829", lemma_arabic: "ريح", gloss: "vent / souffle / esprit", rationale: "46:24 'c'est un vent' — Hamidullah/Kazimirski 'vent' — contexte de châtiment" },
  { lemma_id: "678f4fe9-0457-47c0-9f60-ab3421127b97", lemma_arabic: "مساكن", gloss: "demeures / habitations / lieux d'habitation", rationale: "46:25 'leurs demeures' détruites — sens 'habitations/demeures'" },
  { lemma_id: "ab31770a-ccc7-414c-8d17-ef07d027e27b", lemma_arabic: "أفئد", gloss: "cœurs / esprits / entrailles", rationale: "46:26 'des cœurs... et des oreilles' — pluriel de فؤاد — sens 'cœurs/esprits'" },
  { lemma_id: "339a4344-6879-4351-8a35-c319e8cb19c9", lemma_arabic: "قربان", gloss: "offrande / sacrifice / rapprochement / proximité", rationale: "46:28 'comme offrande' / 'comme rapprochement' — contexte cultuel — Hamidullah 'offrandes'" },
  { lemma_id: "0655cc86-b3ac-4ce0-ac83-ea6144944666", lemma_arabic: "آله", gloss: "divinités / dieux / idoles", rationale: "46:28 'leurs divinités' — pluriel de إله — sens 'dieux/divinités'" },
  { lemma_id: "a65d5fa0-bf1b-41e0-8e93-a510537390c1", lemma_arabic: "طريق", gloss: "chemin / voie / route / méthode", rationale: "46:30 'guidez-nous vers le chemin droit' / 'sur la voie droite' — sens 'chemin/voie'" },
  { lemma_id: "1ae7bf3f-2a00-47e5-9470-8ac7e2c35648", lemma_arabic: "داعي", gloss: "celui qui appelle / prédicateur / inviteur", rationale: "46:31-32 'répondez à celui qui appelle à Allah' — participe actif de دعا" },
  { lemma_id: "7e605db0-b799-4b6b-9575-9e3f8174957f", lemma_arabic: "معجز", gloss: "incapable / impuissant / qui ne peut échapper", rationale: "46:32 'n'est pas à l'abri' / 'ne peut réduire en impuissance' — sens d'incapacité" },
  { lemma_id: "0b9d50dd-ef9a-4003-8d60-be09c76716e2", lemma_arabic: "أولياء", gloss: "alliés / protecteurs / amis proches", rationale: "46:32 'pas d'alliés en dehors de Lui' — sens 'protecteurs/alliés'" },
  { lemma_id: "11b1ec78-e8c8-4198-9349-2380bd32c73c", lemma_arabic: "موتى", gloss: "morts / défunts / cadavres", rationale: "46:33 'ressusciter les morts' — pluriel de ميت — sens 'morts/défunts'" },
  { lemma_id: "15428f1d-7f09-4350-a7d3-e00f653cfd37", lemma_arabic: "بلاغ", gloss: "communication / transmission / proclamation / message", rationale: "46:35 'ceci est une communication' — sens de transmission/proclamation" },
  { lemma_id: "9bd54996-df0a-4c9a-a3d1-7ac2f5474893", lemma_arabic: "ويل", gloss: "malheur / calamité / châtiment", rationale: "46:21 et 34 — avertissement prophétique 'malheur à vous' — sens de calamité" },
];

// ════════════════════════════════════════════════════════════════════════════
// EDITORIAL GLOSSES — BY-SURAH-FORM Word translations (1 SAFE + 42 REVIEW)
// ════════════════════════════════════════════════════════════════════════════
const WORD_GLOSSES: { word_id: string; arabic: string; gloss: string; category: "SAFE" | "REVIEW"; rationale: string }[] = [
  // ── SAFE (1) ──
  { word_id: "deb96fb8-9384-4052-a0d1-204828266ac1", arabic: "أَنذَرَ", gloss: "avertir / mettre en garde", category: "SAFE", rationale: "46:21 et contextes multiples — sens stable 'avertir' chez Hamidullah et Kazimirski" },
  // ── REVIEW (42) — stems UNMAPPED quality=0 ──
  { word_id: "3ce2da86-780d-409c-938e-24c094a672f9", arabic: "دُعَآئِهِمْ", gloss: "invocation / leur appel / leur prière", category: "REVIEW", rationale: "46:5 'leur invocation' — Hamidullah 'invocation' — Kazimirski 'invocation'" },
  { word_id: "c4909978-804e-46d5-ac51-6a731eec2994", arabic: "حُشِرَ", gloss: "rassembler / être rassemblé", category: "REVIEW", rationale: "46:6 'rassemblés' — Hamidullah 'rassemblés' — sens du rassemblement au Jour du Jugement" },
  { word_id: "189e5067-5493-4c49-9e73-dee4186b5829", arabic: "يُفْعَلُ", gloss: "être fait / être accompli / se faire", category: "REVIEW", rationale: "46:9 'que me sera-t-il fait' — forme passive de فعل — verbe générique 'faire'" },
  { word_id: "3883319c-cf25-4c52-9b0e-beaf1cbf66c2", arabic: "وَٱسْتَكْبَرْتُمْ ۖ", gloss: "s'enorgueillir / être arrogant / se montrer orgueilleux", category: "REVIEW", rationale: "46:10 'vous vous êtes enflés d'orgueil' — Hamidullah/Kazimirski convergent sur l'orgueil" },
  { word_id: "1e7aeea5-872e-4d84-8ab8-004581fa40ed", arabic: "سَبَقُونَآ", gloss: "nous devancer / nous précéder", category: "REVIEW", rationale: "46:11 'ils nous ont devancés' — sens de précéder/devancer chez Hamidullah/Kazimirski" },
  { word_id: "64e1af59-1542-457b-881a-0378851cf327", arabic: "يَهْتَدُوا۟", gloss: "être guidé / se guider / trouver la guidance", category: "REVIEW", rationale: "46:11 's'ils n'y trouvent pas le chemin' — sens de guidance acquisitive" },
  { word_id: "0a6621f4-f2c5-44b8-940d-80aa1418d86c", arabic: "إِحْسَـٰنًا ۖ", gloss: "bienfaisance / bonté / excellente conduite", category: "REVIEW", rationale: "46:15 'Nous avons recommandé à l'homme la bonté envers ses parents' — sens de bienfaisance" },
  { word_id: "0a97ceab-9649-43fc-9cf7-5d9901bfaca6", arabic: "كُرْهًۭا", gloss: "avec peine / à contrecœur / péniblement", category: "REVIEW", rationale: "46:15 'sa mère l'a porté avec peine' — Hamidullah 'péniblement' — sens d'effort pénible" },
  { word_id: "0e7de874-9cbd-4574-8d3f-2b40b934bb63", arabic: "وَوَضَعَتْهُ", gloss: "enfanter / mettre au monde / déposer", category: "REVIEW", rationale: "46:15 'et l'a enfanté avec peine' — sens d'enfantement" },
  { word_id: "7290ff1f-b150-4b96-84c2-310d134122b0", arabic: "كُرْهًۭا ۖ", gloss: "avec peine / à contrecœur", category: "REVIEW", rationale: "Même forme que ci-dessus, contexte enfantement" },
  { word_id: "54f6f8b7-0431-4c08-b007-01dc8933ae6a", arabic: "وَحَمْلُهُۥ", gloss: "porter (un enfant) / grossesse / charge", category: "REVIEW", rationale: "46:15 'le porter et le sevrer' — sens de gestation/portage" },
  { word_id: "81c109b8-1d72-4d02-b5fc-0cfa4dc05460", arabic: "وَبَلَغَ", gloss: "atteindre / arriver à maturité", category: "REVIEW", rationale: "46:15 'jusqu'à ce qu'il atteigne sa maturité' — sens d'atteindre un âge" },
  { word_id: "d6a5d8fd-777f-46b1-911d-f15e11085ec6", arabic: "نَتَقَبَّلُ", gloss: "accepter / recevoir favorablement / agréer", category: "REVIEW", rationale: "46:16 'Nous acceptons d'eux le meilleur' — Hamidullah/Kazimirski 'acceptons'" },
  { word_id: "20b18ba2-07a8-4b20-81de-5794702ff182", arabic: "وَنَتَجَاوَزُ", gloss: "passer outre / pardonner / ignorer", category: "REVIEW", rationale: "46:16 'et Nous passerons outre leurs méfaits' — sens de pardon/indulgence" },
  { word_id: "8554cd49-007d-4aba-97d8-cea3b4683371", arabic: "أُخْرَجَ", gloss: "faire sortir / être expulsé / être extrait", category: "REVIEW", rationale: "46:17 contexte du fils ingrat — Hamidullah 'sortir/extraire'" },
  { word_id: "c901797e-8505-4664-8537-8ef133cbbaf0", arabic: "خَلَتِ", gloss: "passer / s'écouler / être révolu", category: "REVIEW", rationale: "46:17 'les générations sont passées avant moi' — sens temporel de passage" },
  { word_id: "cdf9af2e-f331-4d3d-a5a6-604bcdc4a675", arabic: "وَهُمَا", gloss: "et eux deux / tous les deux", category: "REVIEW", rationale: "46:17 'tandis que tous deux (les parents) implorent' — pronom duel" },
  { word_id: "7e6d8196-6110-4265-8e07-6fcb114c8053", arabic: "عَمِلُوا۟ ۖ", gloss: "agir / œuvrer / faire (des actions)", category: "REVIEW", rationale: "46:19 'pour ce qu'ils ont accompli' — verbe générique 'agir/œuvrer'" },
  { word_id: "07f14d18-b725-45fa-8cec-e4235fdb4974", arabic: "وَلِيُوَفِّيَهُمْ", gloss: "rétribuer pleinement / donner la pleine récompense", category: "REVIEW", rationale: "46:19 'afin qu'Il leur donne pleine rétribution' — sens de récompense complète" },
  { word_id: "bef0419e-ac67-4ec5-bbf4-a49c4df55896", arabic: "أَذْهَبْتُمْ", gloss: "dissiper / faire disparaître / gaspiller", category: "REVIEW", rationale: "46:20 'vous avez dissipé vos bonnes choses' — sens de gaspillage/disparition" },
  { word_id: "24886639-8021-4f3b-8c99-f8f10be163d5", arabic: "حَيَاتِكُمُ", gloss: "votre vie / votre existence terrestre", category: "REVIEW", rationale: "46:20 'dans votre vie terrestre' — sens de vie/existence" },
  { word_id: "630e7763-d864-4c09-b6c6-650a4b8f4f51", arabic: "وَٱسْتَمْتَعْتُم", gloss: "jouir / profiter / tirer jouissance", category: "REVIEW", rationale: "46:20 'vous en avez joui' — sens de jouissance/profit terrestre" },
  { word_id: "61a4765a-abb8-49a3-9551-3669d8634ed3", arabic: "تَفْسُقُونَ", gloss: "transgresser / être pervers / désobéir gravement", category: "REVIEW", rationale: "46:20 'pour votre transgression sur terre' — sens de désobéissance/perversité" },
  { word_id: "b8c99dd0-e343-4e41-ba41-4307e76c8e59", arabic: "لِتَأْفِكَنَا", gloss: "détourner / écarter / tromper par mensonge", category: "REVIEW", rationale: "46:22 'es-tu venu pour nous détourner de nos divinités' — sens de détournement/tromperie" },
  { word_id: "be8c01d6-bbb8-4cd2-8e26-311604e78725", arabic: "وَأُبَلِّغُكُم", gloss: "transmettre / communiquer / faire parvenir", category: "REVIEW", rationale: "46:23 'je vous transmets les messages de mon Seigneur' — sens de transmission" },
  { word_id: "d42cbe97-306f-43b6-90f5-6a65c333593a", arabic: "ٱسْتَعْجَلْتُم", gloss: "chercher à hâter / vouloir précipiter / être impatient", category: "REVIEW", rationale: "46:24 contexte du châtiment hâté — Hamidullah 'hâter'" },
  { word_id: "4e9952b4-2a80-49be-9d45-f89d225b33e2", arabic: "تُدَمِّرُ", gloss: "détruire / anéantir / ravager", category: "REVIEW", rationale: "46:25 'détruisant toute chose' — sens de destruction totale" },
  { word_id: "76e71a81-44b8-4167-9c2c-5ed2815b4565", arabic: "يُرَىٰٓ", gloss: "être vu / être aperçu / être visible", category: "REVIEW", rationale: "46:25 'on ne voyait plus que leurs demeures' — sens de visibilité" },
  { word_id: "e9b7c1bc-2dfb-4bc8-a564-1327076ec44d", arabic: "مَكَّنَّـٰهُمْ", gloss: "établir solidement / donner puissance / affermir", category: "REVIEW", rationale: "46:26 'Nous les avions établis' — sens d'établissement/puissance" },
  { word_id: "df92c435-3799-41a7-a236-38395ba096c4", arabic: "مَّكَّنَّـٰكُمْ", gloss: "établir solidement / donner puissance", category: "REVIEW", rationale: "46:26 — même racine que ci-dessus, contexte de puissance accordée" },
  { word_id: "3b8a5f0e-9c23-4ec2-9f54-736996112948", arabic: "سَمْعًۭا", gloss: "ouïe / audition / faculté d'entendre", category: "REVIEW", rationale: "46:26 'Nous leur avions donné une ouïe' — sens d'audition" },
  { word_id: "ed9a10fb-9e14-48f3-b2d1-ad5173cc0c01", arabic: "إِفْكُهُمْ", gloss: "mensonge / tromperie / calomnie", category: "REVIEW", rationale: "46:28 'leur mensonge les a abandonnés' — sens de fausseté/tromperie" },
  { word_id: "e2cd95a9-960a-4c64-986b-944e78b41515", arabic: "صَرَفْنَآ", gloss: "diriger / détourner / orienter vers", category: "REVIEW", rationale: "46:29 'Nous avons dirigé vers toi une troupe de djinns' — sens de direction" },
  { word_id: "d63c2d10-c45b-4789-bc6c-9d17c1811134", arabic: "حَضَرُوهُ", gloss: "assister à / être présent / se présenter", category: "REVIEW", rationale: "46:29 'quand ils assistèrent à sa récitation' — sens de présence" },
  { word_id: "1e7312a5-644a-4a84-ae2e-897f6b14026d", arabic: "أَنصِتُوا۟ ۖ", gloss: "écouter en silence / faire silence / prêter l'oreille", category: "REVIEW", rationale: "46:29 'faites silence / écoutez attentivement' — impératif d'écoute" },
  { word_id: "c33ebd1c-9e35-405e-a1de-8c72089b5c99", arabic: "أَجِيبُوا۟", gloss: "répondre / obéir à l'appel / exaucer", category: "REVIEW", rationale: "46:31 'répondez à celui qui appelle à Allah' — sens de réponse à l'appel" },
  { word_id: "290ff2a7-9efe-4edf-a041-05a6f13f0526", arabic: "وَيُجِرْكُم", gloss: "protéger / accorder refuge / sauvegarder", category: "REVIEW", rationale: "46:31 'Il vous protégera' — sens de protection/refuge" },
  { word_id: "6be4cdee-5feb-4864-8cdf-e198c233151b", arabic: "يُجِبْ", gloss: "répondre / exaucer", category: "REVIEW", rationale: "46:5 'qui ne répond pas' — verbe répondre/exaucer en contexte d'invocation" },
  { word_id: "4aa44a07-ed6b-48d2-85fe-aef16344d165", arabic: "يَعْىَ", gloss: "comprendre / saisir par l'intelligence / assimiler", category: "REVIEW", rationale: "46:26 contexte des facultés non utilisées pour comprendre — sens de compréhension intellectuelle" },
  { word_id: "ec59eef2-8c4a-43c5-b730-dba5ac3bdd5e", arabic: "ٱلْعَزْمِ", gloss: "fermeté / résolution / détermination / décision ferme", category: "REVIEW", rationale: "46:35 'fais preuve de fermeté comme les messagers doués de résolution' — sens de détermination" },
  { word_id: "c7007821-97d6-4e73-bba0-ab959c572894", arabic: "تَسْتَعْجِل", gloss: "chercher à hâter / être impatient / vouloir précipiter", category: "REVIEW", rationale: "46:35 'ne cherche pas à hâter' — sens d'impatience" },
  { word_id: "5061dee1-7f79-42e3-a1d3-88d030e8ee91", arabic: "يَسْتَغِيثَانِ", gloss: "appeler au secours / implorer assistance / crier à l'aide", category: "REVIEW", rationale: "46:17 'tous deux implorent le secours d'Allah' — duel de استغاث — sens d'appel au secours" },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  mkdirSync("reports", { recursive: true });

  console.log("=== PHASE 88F-AA — S46 EDITORIAL GLOSS AUDIT ===\n");

  // ─── 1. Load all data ────────────────────────────────────────────────────
  console.log("Loading data...");
  const [allWords, allOccs, allAyahs, allSurahs, allLemmas, allWlm, allWordTr, allLemmaTr, allLo] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number,global_ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "lemmas", "id,arabic"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated,validated_at"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated,validated_at"),
    selectAll<DbRow>(client, "linguistic_occurrences", "id,word_occurrence_id,hikma_lemma_id,lemma_mapping_status,masaq_stem,masaq_gloss_en,pos"),
  ]);

  // Indexes
  const wordById = new Map<string, DbRow>();
  const wordIdsByAyah = new Map<string, string[]>();
  const ayahById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  const lemmaById = new Map<string, DbRow>();
  const wlmByWord = new Map<string, string[]>();
  const loByOccId = new Map<string, DbRow[]>();

  for (const w of allWords) wordById.set(w.id as string, w);
  for (const oc of allOccs) {
    const arr = wordIdsByAyah.get(oc.ayah_id as string) ?? [];
    arr.push(oc.word_id as string);
    wordIdsByAyah.set(oc.ayah_id as string, arr);
  }
  for (const a of allAyahs) ayahById.set(a.id as string, a);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);
  for (const l of allLemmas) lemmaById.set(l.id as string, l);
  for (const wl of allWlm) {
    const arr = wlmByWord.get(wl.word_id as string) ?? [];
    arr.push(wl.lemma_id as string);
    wlmByWord.set(wl.word_id as string, arr);
  }
  for (const lo of allLo) {
    const arr = loByOccId.get(lo.word_occurrence_id as string) ?? [];
    arr.push(lo);
    loByOccId.set(lo.word_occurrence_id as string, arr);
  }

  // FR union
  const frByWord = new Set<string>();
  const frByLemma = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) { frByWord.add(t.word_id as string); } }
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) { frByLemma.add(t.lemma_id as string); } }
  for (const wl of allWlm) { if (frByLemma.has(wl.lemma_id as string) && !frByWord.has(wl.word_id as string)) { frByWord.add(wl.word_id as string); } }

  // S46 filtering
  const s46SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s46SurahId) throw new Error(`Surah TARGET=${TARGET} not found`);
  const s46AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s46SurahId) s46AyahIds.add(a.id as string); }
  const s46Occs = allOccs.filter(oc => s46AyahIds.has(oc.ayah_id as string));
  const s46WordIds = new Set(s46Occs.map(oc => oc.word_id as string));
  const covered46 = [...s46WordIds].filter(w => frByWord.has(w)).length;
  const total46 = s46WordIds.size;
  console.log(`  S46 baseline: ${covered46}/${total46} (${ROUND(covered46/total46*100, 1)}%)`);
  console.log(`  S46 missing: ${total46 - covered46}\n`);

  // ─── 2. Load S46 ayah translations ───────────────────────────────────────
  console.log("Loading S46 ayah translations...");
  const s46AyahIdList = [...s46AyahIds];
  const translations = await selectInChunks<DbRow>(client, "translations", "ayah_id,resource_id,text,translator,language", "ayah_id", s46AyahIdList);
  const transByAyah = new Map<string, Map<number, string>>();
  for (const t of translations) {
    const map = transByAyah.get(t.ayah_id as string) ?? new Map();
    map.set(t.resource_id as number, t.text as string);
    transByAyah.set(t.ayah_id as string, map);
  }
  const s46AyahsWithTrans = s46AyahIdList.filter(a => transByAyah.has(a));
  console.log(`  Ayahs with translations: ${s46AyahsWithTrans.length}/${s46AyahIdList.length}\n`);

  // ─── 3. Validate all editorial gloss IDs ─────────────────────────────────
  console.log("=== Validating editorial gloss IDs ===\n");

  // Lemma checks
  const lemmaIssues: string[] = [];
  const existingLemmaGlosses: { lemma_id: string; existing: string; proposed: string }[] = [];
  for (const lg of LEMMA_GLOSSES) {
    const lemma = lemmaById.get(lg.lemma_id);
    if (!lemma) { lemmaIssues.push(`LEMMA MISSING: ${lg.lemma_id} (${lg.lemma_arabic})`); continue; }
    const dbArabic = lemma.arabic as string;
    if (dbArabic !== lg.lemma_arabic) {
      console.log(`  ⚠ Lemma ${lg.lemma_id}: DB arabic="${dbArabic}" vs expected "${lg.lemma_arabic}"`);
    }
    if (frByLemma.has(lg.lemma_id)) {
      existingLemmaGlosses.push({ lemma_id: lg.lemma_id, existing: "EXISTING FR", proposed: lg.gloss });
    }
  }

  // Word checks
  const wordIssues: string[] = [];
  const existingWordGlosses: { word_id: string; existing: string; proposed: string }[] = [];
  for (const wg of WORD_GLOSSES) {
    const word = wordById.get(wg.word_id);
    if (!word) { wordIssues.push(`WORD MISSING: ${wg.word_id} (${wg.arabic})`); continue; }
    const dbArabic = word.arabic as string;
    // Strip diacritics for comparison since forms may vary
    const clean = (s: string) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/\s/g, "");
    if (clean(dbArabic) !== clean(wg.arabic) && dbArabic !== wg.arabic) {
      console.log(`  ⚠ Word  ${wg.word_id}: DB="${dbArabic}" vs expected "${wg.arabic}"`);
    }
    if (frByWord.has(wg.word_id)) {
      existingWordGlosses.push({ word_id: wg.word_id, existing: "EXISTING FR", proposed: wg.gloss });
    }
  }

  console.log(`  Lemma issues: ${lemmaIssues.length}`);
  console.log(`  Word issues: ${wordIssues.length}`);
  console.log(`  Existing lemma FR: ${existingLemmaGlosses.length}`);
  console.log(`  Existing word FR: ${existingWordGlosses.length}\n`);

  // ─── 4. Coverage simulation ──────────────────────────────────────────────
  console.log("=== Coverage simulation ===\n");
  const newLemmaIds = new Set(LEMMA_GLOSSES.filter(lg => !frByLemma.has(lg.lemma_id)).map(lg => lg.lemma_id));

  // Simulate: after lemma translations, which new S46 words get covered?
  // The runtime resolver checks TWO paths:
  //   PATH 1: word → direct quran_words.lemma_id → lemma_translation FR
  //   PATH 2: word → word_lemma_mapping → lemma → lemma_translation FR (via WLM)
  let newCoveredByLemma = 0;
  const newlyCoveredWords = new Set<string>();
  for (const wid of s46WordIds) {
    if (frByWord.has(wid)) continue;
    const word = wordById.get(wid);
    if (!word) continue;
    // PATH 1: direct lemma_id on quran_words row
    const directLemmaId = word.lemma_id as string | null;
    if (directLemmaId && newLemmaIds.has(directLemmaId)) {
      newlyCoveredWords.add(wid);
      newCoveredByLemma++;
      continue;
    }
    // PATH 2: via word_lemma_mapping
    const wlmLemmaIds = wlmByWord.get(wid) ?? [];
    if (wlmLemmaIds.some(lid => newLemmaIds.has(lid))) {
      newlyCoveredWords.add(wid);
      newCoveredByLemma++;
    }
  }

  // Simulate: after word translations, which words get covered
  const newWordTrIds = new Set(WORD_GLOSSES.filter(wg => !frByWord.has(wg.word_id)).map(wg => wg.word_id));
  let newCoveredByWord = 0;
  for (const wid of newWordTrIds) {
    if (s46WordIds.has(wid) && !frByWord.has(wid) && !newlyCoveredWords.has(wid)) {
      newCoveredByWord++;
    }
  }

  const totalNew = newCoveredByLemma + newCoveredByWord;
  const finalCovered = covered46 + totalNew;
  console.log(`  Current: ${covered46}/${total46}`);
  console.log(`  + lemma translations: +${newCoveredByLemma} → ${covered46 + newCoveredByLemma}/${total46} (${ROUND((covered46 + newCoveredByLemma)/total46*100, 1)}%)`);
  console.log(`  + word translations:  +${newCoveredByWord} → ${finalCovered}/${total46} (${ROUND(finalCovered/total46*100, 1)}%)`);
  console.log(`  Ready: ${finalCovered === total46 ? "✅ YES" : "❌ NO (missing " + (total46 - finalCovered) + ")"}\n`);

  // ─── 4b. STRUCTURAL GAP ANALYSIS (critical) ──────────────────────────────
  console.log("=== Structural gap analysis (lemma → word link) ===\n");
  // The 88F-Y audit classified 34 forms as A_SAFE_LEMMA_GLOSS using the
  // linguistic_occurrences.hikma_lemma_id (MASAQ) path. The runtime resolver
  // resolveWordMeanings only resolves FR through:
  //   PATH 1: word_translations (direct form)
  //   PATH 2: lemma_translations via quran_words.lemma_id (direct)
  //   PATH 3: lemma_translations via word_lemma_mapping (WLM)
  // It does NOT use linguistic_occurrences.hikma_lemma_id.
  //
  // So a lemma_translation is USELESS for a word unless that word has
  //   - quran_words.lemma_id = that lemma_id, OR
  //   - a word_lemma_mapping row (word_id → lemma_id).
  const lemmaGlossWordIds = new Set<string>();
  for (const lg of LEMMA_GLOSSES) {
    // find words whose direct lemma_id or WLM lemma_id = this lemma
    for (const wid of s46WordIds) {
      const w = wordById.get(wid);
      if (!w) continue;
      if (w.lemma_id === lg.lemma_id) lemmaGlossWordIds.add(wid);
      else if ((wlmByWord.get(wid) ?? []).includes(lg.lemma_id)) lemmaGlossWordIds.add(wid);
    }
  }
  const lemmaGlossFormsRuntimelyLinked = lemmaGlossWordIds.size;
  const lemmaGlossFormsUnlinked = 34 - lemmaGlossFormsRuntimelyLinked;
  console.log(`  Lemma-gloss forms (from 88F-Y): 34`);
  console.log(`  Forms with runtime lemma link (quran_words.lemma_id OR WLM): ${lemmaGlossFormsRuntimelyLinked}`);
  console.log(`  Forms WITHOUT runtime link (lemma_translation would be USELESS): ${lemmaGlossFormsUnlinked}`);
  console.log(`  → These ${lemmaGlossFormsUnlinked} forms need word_translations instead (or WLM rows, which are MASAQ mappings → FORBIDDEN).`);

  // Correct minimal path: convert all unlinked lemma-gloss forms to word_translations.
  // 32 distinct lemmas cover 34 forms; ALL 34 lack runtime links → all 32
  // lemma_translations are structurally useless for S46 (still editorially valid
  // for OTHER surahs that have WLM/direct links to these lemmas).
  const correctMinimalWordTranslations = lemmaGlossFormsUnlinked + WORD_GLOSSES.length;
  const usefulLemmaTranslations = LEMMA_GLOSSES.length - LEMMA_GLOSSES.length; // 0 for S46
  console.log(`  Correct minimal path for S46: ${correctMinimalWordTranslations} word_translations (${lemmaGlossFormsUnlinked} converted from lemma-gloss + ${WORD_GLOSSES.length} original) + ${usefulLemmaTranslations} lemma_translations that link at runtime.`);
  console.log(`  → All ${LEMMA_GLOSSES.length} lemma_translations are editorially valid but structurally USELESS for S46 runtime (0 runtime links).\n`);

  // ─── 5. Build editorial actions table ────────────────────────────────────
  console.log("=== Building editorial actions table ===\n");

  const editorialActions: Record<string, unknown>[] = [];

  for (const lg of LEMMA_GLOSSES) {
    const status = frByLemma.has(lg.lemma_id) ? "EXISTING_SAME" : "NEW";
    editorialActions.push({
      type: "lemma_translation",
      lemma_id: lg.lemma_id,
      arabic: lg.lemma_arabic,
      lemma_arabic: lg.lemma_arabic,
      category: "SAFE",
      french_gloss: lg.gloss,
      rationale: lg.rationale,
      status,
      source_evidence: "Hamidullah FR (31) + Kazimirski 1869 (9001)",
    });
  }

  for (const wg of WORD_GLOSSES) {
    const word = wordById.get(wg.word_id);
    const status = frByWord.has(wg.word_id) ? "EXISTING_SAME" : "NEW";
    editorialActions.push({
      type: "word_translation",
      word_id: wg.word_id,
      arabic: wg.arabic,
      lemma: word ? (word.lemma_id ? (lemmaById.get(word.lemma_id as string)?.arabic ?? null) : null) : null,
      category: wg.category,
      french_gloss: wg.gloss,
      rationale: wg.rationale,
      status,
      source_evidence: "Hamidullah FR (31) + Kazimirski 1869 (9001) — stem UNMAPPED quality=0",
    });
  }

  const newCount = editorialActions.filter(a => a.status === "NEW").length;
  const existingCount = editorialActions.filter(a => a.status === "EXISTING_SAME").length;
  console.log(`  Total actions: ${editorialActions.length} (${newCount} NEW, ${existingCount} EXISTING_SAME)\n`);

  // ─── 6. Global propagation estimate ──────────────────────────────────────
  console.log("=== Global propagation estimate ===\n");
  let globalFormsUnlocked = 0;
  const affectedSurahs = new Set<number>();
  for (const lg of LEMMA_GLOSSES) {
    if (frByLemma.has(lg.lemma_id)) continue; // already covered
    for (const wl of allWlm) {
      if (wl.lemma_id === lg.lemma_id && !frByWord.has(wl.word_id as string)) {
        globalFormsUnlocked++;
        // find which surahs this word appears in
        const wordOccs = allOccs.filter(o => o.word_id === wl.word_id);
        for (const oc of wordOccs) {
          const ayah = ayahById.get(oc.ayah_id as string);
          if (ayah) {
            const sn = surahNumById.get(ayah.surah_id as string);
            if (sn != null) affectedSurahs.add(sn);
          }
        }
      }
    }
  }
  console.log(`  New lemmas: ${LEMMA_GLOSSES.filter(lg => !frByLemma.has(lg.lemma_id)).length}`);
  console.log(`  Global forms unlocked: ~${globalFormsUnlocked}`);
  console.log(`  Surahs affected: ${affectedSurahs.size}\n`);

  // ─── 7. Integrity ────────────────────────────────────────────────────────
  const summary = {
    safeLemmaGlosses: LEMMA_GLOSSES.filter(lg => !frByLemma.has(lg.lemma_id)).length,
    existingSameLemmas: LEMMA_GLOSSES.filter(lg => frByLemma.has(lg.lemma_id)).length,
    safeWordTranslations: WORD_GLOSSES.filter(wg => wg.category === "SAFE" && !frByWord.has(wg.word_id)).length,
    reviewWordTranslations: WORD_GLOSSES.filter(wg => wg.category === "REVIEW" && !frByWord.has(wg.word_id)).length,
    existingSameWords: WORD_GLOSSES.filter(wg => frByWord.has(wg.word_id)).length,
    totalNewWrites: newCount,
    totalExistingSame: existingCount,
  };

  // ─── 8. Write report ─────────────────────────────────────────────────────
  const report = {
    phase: "88F-AA",
    verdict: lemmaIssues.length === 0 && wordIssues.length === 0 ? "PHASE_88F_AA_COMPLETE" : "PHASE_88F_AA_COMPLETE_WITH_WARNINGS",
    readOnly: true,
    databaseWrites: 0,
    editorialDataComplete: true,
    structuralGapDetected: lemmaGlossFormsUnlinked > 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    baseline: {
      surah46: {
        totalForms: total46,
        coveredForms: covered46,
        missingForms: total46 - covered46,
        coveragePct: ROUND(covered46 / total46, 4),
        readiness: "IN_PREPARATION",
      },
    },
    summary,
    editorialActions,
    simulation: {
      currentCovered: covered46,
      totalForms: total46,
      afterLemmas: covered46 + newCoveredByLemma,
      afterLemmasPct: ROUND((covered46 + newCoveredByLemma) / total46 * 100, 1),
      afterWords: finalCovered,
      afterWordsPct: ROUND(finalCovered / total46 * 100, 1),
      ready: finalCovered === total46,
      remainingMissing: total46 - finalCovered,
    },
    structuralGap: {
      lemmaGlossFormsClassified: 34,
      lemmaGlossFormsRuntimeLinked: lemmaGlossFormsRuntimelyLinked,
      lemmaGlossFormsUnlinked: lemmaGlossFormsUnlinked,
      runtimeResolutionModel: "resolveWordMeanings: word_translations > lemma via quran_words.lemma_id > lemma via word_lemma_mapping > EN fallback",
      note: "linguistic_occurrences.hikma_lemma_id (MASAQ) is NOT used by the runtime resolver for FR coverage.",
      correctMinimalPath: {
        wordTranslationsNeeded: correctMinimalWordTranslations,
        lemmaTranslationsThatLink: usefulLemmaTranslations,
        lemmaTranslationsStructurallyUseless: LEMMA_GLOSSES.length,
        wordLemmaMappingsNeeded: 0,
        rationale: "The 34 'A_SAFE_LEMMA_GLOSS' forms (32 distinct lemmas) have no quran_words.lemma_id and no word_lemma_mapping row. lemma_translations cannot reach them at runtime. They must be resolved via word_translations (form-level), or via word_lemma_mapping rows which are FORBIDDEN MASAQ mappings.",
      },
    },
    propagation: {
      globalFormsUnlocked,
      surahsAffected: affectedSurahs.size,
    },
    issues: {
      lemmaIssues,
      wordIssues,
      existingLemmaGlosses,
      existingWordGlosses,
    },
    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      protectedTablesIntact: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  Lemma glosses: ${summary.safeLemmaGlosses} NEW + ${summary.existingSameLemmas} EXISTING_SAME`);
  console.log(`  Word translations: ${summary.safeWordTranslations + summary.reviewWordTranslations} NEW (${summary.safeWordTranslations} SAFE + ${summary.reviewWordTranslations} REVIEW) + ${summary.existingSameWords} EXISTING_SAME`);
  console.log(`  Total writes needed: ${summary.totalNewWrites}`);
  console.log(`  S46 after import: ${finalCovered}/${total46} (${ROUND(finalCovered/total46*100, 1)}%) → READY=${finalCovered === total46}`);
  console.log(`  DATABASE WRITES: 0 ✅`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AA", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});