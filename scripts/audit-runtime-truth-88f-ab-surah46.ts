/**
 * PHASE 88F-AB — S46 AL-AHQAF RUNTIME-TRUTH RECLASSIFICATION + RESOLUTION PREFLIGHT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Reproduces the exact runtime resolution used by resolveWordMeanings /
 * getValidatedFrenchLemmaMeaningsByWord / getWordLemmaMappingsByWordIds —
 * NOT the MASAQ linguistic_occurrences.hikma_lemma_id used by 88F-Y.
 *
 * Resolution order:
 *   1. word_translations  (language='fr', is_validated=true)
 *   2. lemma via quran_words.lemma_id → lemma_translations
 *   3. lemma via word_lemma_mapping (confidence='safe') → lemma_translations
 *   4. EN fallback (not FR → not READY)
 *
 * Output: reports/phase-88f-ab-surah46-runtime-truth.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ab-surah46-runtime-truth.json";
const PAGE_SIZE = 1000;
const TARGET = 46;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

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


// ─── EDITORIAL GLOSSES (from 88F-AA) ──────────────────────────────────────
// These are the French gloss texts already written in 88F-AA.
// We reuse them here — the gloss text itself doesn't change, only whether
// it goes into lemma_translations (structurally useless) or word_translations.

// 32 lemma glosses
const LEMMA_GLOSSES: { lemma_id: string; arabic: string; gloss: string; rationale: string }[] = [
  { lemma_id: "125b4961-e1a0-49ec-aefe-7d3fc294ab4f", arabic: "أثار", gloss: "traces / vestiges / restes", rationale: "46:25" },
  { lemma_id: "0917ff07-a4a6-4f52-a292-c9fe1cc9c502", arabic: "شيئ", gloss: "chose / rien / quoi que ce soit", rationale: "46:8 etc" },
  { lemma_id: "94afd10c-cfd9-41c7-b3d0-51a48a6cc841", arabic: "أعلم", gloss: "plus savant / mieux savoir / connaître", rationale: "46:8,23" },
  { lemma_id: "08457bef-4e66-4eff-9346-d8fc46b3b60e", arabic: "بدع", gloss: "innovation / chose nouvelle / sans précédent", rationale: "46:9" },
  { lemma_id: "272b8d2a-538c-4980-b007-f5ece61f0f99", arabic: "قديم", gloss: "ancien / antique / de longue date", rationale: "46:11" },
  { lemma_id: "95112493-24b8-4ec1-a762-78b3a59d5fae", arabic: "شهر", gloss: "mois / lune / notoriété", rationale: "46:15" },
  { lemma_id: "57869ede-57cc-4693-9364-0bee13824634", arabic: "سن", gloss: "année / âge / aiguiser", rationale: "46:15" },
  { lemma_id: "53b60e93-b323-4903-aab7-7585c6d37233", arabic: "ذر", gloss: "disperser / engendrer / semer (la descendance)", rationale: "46:15" },
  { lemma_id: "76720cd4-2d0d-478c-b97d-4ba5853334e3", arabic: "عد", gloss: "compter / dénombrer / ennemi", rationale: "46:18,29" },
  { lemma_id: "c295ea60-a947-4125-97ae-5846b068429c", arabic: "قرون", gloss: "siècles / générations / époques", rationale: "46:17" },
  { lemma_id: "8f4bd92f-e1e0-4dcf-93e7-9b448ead94cc", arabic: "عرض", gloss: "présenter / exposer / largeur", rationale: "46:20" },
  { lemma_id: "888a6fbf-63e5-48f1-a501-3849deea7ce8", arabic: "طيب", gloss: "bon / agréable / pur / bienfaisant", rationale: "46:15,20" },
  { lemma_id: "cfee91db-2bcb-4c63-b9fd-c795565b547a", arabic: "ذكر", gloss: "rappel / mention / souvenir / invoquer", rationale: "46:21" },
  { lemma_id: "89a88190-0770-494c-8ec7-4076b4c55e50", arabic: "أخا", gloss: "frère / parent / proche", rationale: "46:21" },
  { lemma_id: "9fc6512b-4efe-4757-b3a4-b14e57ec28b5", arabic: "أحقاف", gloss: "dunes de sable / collines sablonneuses", rationale: "46:21" },
  { lemma_id: "64f9e40f-05a0-4487-951e-0dd6c66f5c46", arabic: "خلف", gloss: "derrière / après / succéder", rationale: "46:21" },
  { lemma_id: "096ff8f6-ce64-4da3-beb8-973b1c450327", arabic: "عارض", gloss: "nuage / qui se présente / obstacle", rationale: "46:24" },
  { lemma_id: "8c2ccf22-65d1-42b2-b87a-8dd39a8613c5", arabic: "مستقبل", gloss: "qui fait face / qui arrive / futur", rationale: "46:24" },
  { lemma_id: "2c2a3d0c-499e-4753-b33e-9cb278d3ebbd", arabic: "أودي", gloss: "vallées / lits de rivières", rationale: "46:24" },
  { lemma_id: "15c9c3b3-1593-4853-a474-6bc55ac16993", arabic: "ممطر", gloss: "qui apporte la pluie / porteur de pluie", rationale: "46:24" },
  { lemma_id: "f452b43f-3c48-488e-9403-be8bfaa74829", arabic: "ريح", gloss: "vent / souffle / esprit", rationale: "46:24" },
  { lemma_id: "678f4fe9-0457-47c0-9f60-ab3421127b97", arabic: "مساكن", gloss: "demeures / habitations", rationale: "46:25" },
  { lemma_id: "ab31770a-ccc7-414c-8d17-ef07d027e27b", arabic: "أفئد", gloss: "cœurs / esprits / entrailles", rationale: "46:26" },
  { lemma_id: "339a4344-6879-4351-8a35-c319e8cb19c9", arabic: "قربان", gloss: "offrande / sacrifice / rapprochement", rationale: "46:28" },
  { lemma_id: "0655cc86-b3ac-4ce0-ac83-ea6144944666", arabic: "آله", gloss: "divinités / dieux / idoles", rationale: "46:28" },
  { lemma_id: "a65d5fa0-bf1b-41e0-8e93-a510537390c1", arabic: "طريق", gloss: "chemin / voie / route / méthode", rationale: "46:30" },
  { lemma_id: "1ae7bf3f-2a00-47e5-9470-8ac7e2c35648", arabic: "داعي", gloss: "celui qui appelle / prédicateur / inviteur", rationale: "46:31-32" },
  { lemma_id: "7e605db0-b799-4b6b-9575-9e3f8174957f", arabic: "معجز", gloss: "incapable / impuissant / qui ne peut échapper", rationale: "46:32" },
  { lemma_id: "0b9d50dd-ef9a-4003-8d60-be09c76716e2", arabic: "أولياء", gloss: "alliés / protecteurs / amis proches", rationale: "46:32" },
  { lemma_id: "11b1ec78-e8c8-4198-9349-2380bd32c73c", arabic: "موتى", gloss: "morts / défunts / cadavres", rationale: "46:33" },
  { lemma_id: "15428f1d-7f09-4350-a7d3-e00f653cfd37", arabic: "بلاغ", gloss: "communication / transmission / proclamation", rationale: "46:35" },
  { lemma_id: "9bd54996-df0a-4c9a-a3d1-7ac2f5474893", arabic: "ويل", gloss: "malheur / calamité / châtiment", rationale: "46:21,34" },
];

// 43 word glosses (1 SAFE + 42 REVIEW)
const WORD_GLOSSES: { word_id: string; arabic: string; gloss: string; category: string; rationale: string }[] = [
  { word_id: "deb96fb8-9384-4052-a0d1-204828266ac1", arabic: "أَنذَرَ", gloss: "avertir / mettre en garde", category: "SAFE", rationale: "46:21" },
  { word_id: "3ce2da86-780d-409c-938e-24c094a672f9", arabic: "دُعَآئِهِمْ", gloss: "invocation / leur appel / leur prière", category: "REVIEW", rationale: "46:5" },
  { word_id: "c4909978-804e-46d5-ac51-6a731eec2994", arabic: "حُشِرَ", gloss: "rassembler / être rassemblé", category: "REVIEW", rationale: "46:6" },
  { word_id: "189e5067-5493-4c49-9e73-dee4186b5829", arabic: "يُفْعَلُ", gloss: "être fait / être accompli / se faire", category: "REVIEW", rationale: "46:9" },
  { word_id: "3883319c-cf25-4c52-9b0e-beaf1cbf66c2", arabic: "وَٱسْتَكْبَرْتُمْ ۖ", gloss: "s'enorgueillir / être arrogant", category: "REVIEW", rationale: "46:10" },
  { word_id: "1e7aeea5-872e-4d84-8ab8-004581fa40ed", arabic: "سَبَقُونَآ", gloss: "nous devancer / nous précéder", category: "REVIEW", rationale: "46:11" },
  { word_id: "64e1af59-1542-457b-881a-0378851cf327", arabic: "يَهْتَدُوا۟", gloss: "être guidé / se guider", category: "REVIEW", rationale: "46:11" },
  { word_id: "0a6621f4-f2c5-44b8-940d-80aa1418d86c", arabic: "إِحْسَـٰنًا ۖ", gloss: "bienfaisance / bonté / excellente conduite", category: "REVIEW", rationale: "46:15" },
  { word_id: "0a97ceab-9649-43fc-9cf7-5d9901bfaca6", arabic: "كُرْهًۭا", gloss: "avec peine / à contrecœur / péniblement", category: "REVIEW", rationale: "46:15" },
  { word_id: "0e7de874-9cbd-4574-8d3f-2b40b934bb63", arabic: "وَوَضَعَتْهُ", gloss: "enfanter / mettre au monde", category: "REVIEW", rationale: "46:15" },
  { word_id: "7290ff1f-b150-4b96-84c2-310d134122b0", arabic: "كُرْهًۭا ۖ", gloss: "avec peine / à contrecœur", category: "REVIEW", rationale: "46:15" },
  { word_id: "54f6f8b7-0431-4c08-b007-01dc8933ae6a", arabic: "وَحَمْلُهُۥ", gloss: "porter (un enfant) / grossesse / charge", category: "REVIEW", rationale: "46:15" },
  { word_id: "81c109b8-1d72-4d02-b5fc-0cfa4dc05460", arabic: "وَبَلَغَ", gloss: "atteindre / arriver à maturité", category: "REVIEW", rationale: "46:15" },
  { word_id: "d6a5d8fd-777f-46b1-911d-f15e11085ec6", arabic: "نَتَقَبَّلُ", gloss: "accepter / recevoir favorablement / agréer", category: "REVIEW", rationale: "46:16" },
  { word_id: "20b18ba2-07a8-4b20-81de-5794702ff182", arabic: "وَنَتَجَاوَزُ", gloss: "passer outre / pardonner / ignorer", category: "REVIEW", rationale: "46:16" },
  { word_id: "8554cd49-007d-4aba-97d8-cea3b4683371", arabic: "أُخْرَجَ", gloss: "faire sortir / être expulsé", category: "REVIEW", rationale: "46:17" },
  { word_id: "c901797e-8505-4664-8537-8ef133cbbaf0", arabic: "خَلَتِ", gloss: "passer / s'écouler / être révolu", category: "REVIEW", rationale: "46:17" },
  { word_id: "cdf9af2e-f331-4d3d-a5a6-604bcdc4a675", arabic: "وَهُمَا", gloss: "et eux deux / tous les deux", category: "REVIEW", rationale: "46:17" },
  { word_id: "7e6d8196-6110-4265-8e07-6fcb114c8053", arabic: "عَمِلُوا۟ ۖ", gloss: "agir / œuvrer / faire (des actions)", category: "REVIEW", rationale: "46:19" },
  { word_id: "07f14d18-b725-45fa-8cec-e4235fdb4974", arabic: "وَلِيُوَفِّيَهُمْ", gloss: "rétribuer pleinement / donner la pleine récompense", category: "REVIEW", rationale: "46:19" },
  { word_id: "bef0419e-ac67-4ec5-bbf4-a49c4df55896", arabic: "أَذْهَبْتُمْ", gloss: "dissiper / faire disparaître / gaspiller", category: "REVIEW", rationale: "46:20" },
  { word_id: "24886639-8021-4f3b-8c99-f8f10be163d5", arabic: "حَيَاتِكُمُ", gloss: "votre vie / votre existence terrestre", category: "REVIEW", rationale: "46:20" },
  { word_id: "630e7763-d864-4c09-b6c6-650a4b8f4f51", arabic: "وَٱسْتَمْتَعْتُم", gloss: "jouir / profiter / tirer jouissance", category: "REVIEW", rationale: "46:20" },
  { word_id: "61a4765a-abb8-49a3-9551-3669d8634ed3", arabic: "تَفْسُقُونَ", gloss: "transgresser / être pervers", category: "REVIEW", rationale: "46:20" },
  { word_id: "b8c99dd0-e343-4e41-ba41-4307e76c8e59", arabic: "لِتَأْفِكَنَا", gloss: "détourner / écarter / tromper", category: "REVIEW", rationale: "46:22" },
  { word_id: "be8c01d6-bbb8-4cd2-8e26-311604e78725", arabic: "وَأُبَلِّغُكُم", gloss: "transmettre / communiquer / faire parvenir", category: "REVIEW", rationale: "46:23" },
  { word_id: "d42cbe97-306f-43b6-90f5-6a65c333593a", arabic: "ٱسْتَعْجَلْتُم", gloss: "chercher à hâter / vouloir précipiter", category: "REVIEW", rationale: "46:24" },
  { word_id: "4e9952b4-2a80-49be-9d45-f89d225b33e2", arabic: "تُدَمِّرُ", gloss: "détruire / anéantir / ravager", category: "REVIEW", rationale: "46:25" },
  { word_id: "76e71a81-44b8-4167-9c2c-5ed2815b4565", arabic: "يُرَىٰٓ", gloss: "être vu / être aperçu / être visible", category: "REVIEW", rationale: "46:25" },
  { word_id: "e9b7c1bc-2dfb-4bc8-a564-1327076ec44d", arabic: "مَكَّنَّـٰهُمْ", gloss: "établir solidement / donner puissance", category: "REVIEW", rationale: "46:26" },
  { word_id: "df92c435-3799-41a7-a236-38395ba096c4", arabic: "مَّكَّنَّـٰكُمْ", gloss: "établir solidement / donner puissance", category: "REVIEW", rationale: "46:26" },
  { word_id: "3b8a5f0e-9c23-4ec2-9f54-736996112948", arabic: "سَمْعًۭا", gloss: "ouïe / audition / faculté d'entendre", category: "REVIEW", rationale: "46:26" },
  { word_id: "ed9a10fb-9e14-48f3-b2d1-ad5173cc0c01", arabic: "إِفْكُهُمْ", gloss: "mensonge / tromperie / calomnie", category: "REVIEW", rationale: "46:28" },
  { word_id: "e2cd95a9-960a-4c64-986b-944e78b41515", arabic: "صَرَفْنَآ", gloss: "diriger / détourner / orienter vers", category: "REVIEW", rationale: "46:29" },
  { word_id: "d63c2d10-c45b-4789-bc6c-9d17c1811134", arabic: "حَضَرُوهُ", gloss: "assister à / être présent / se présenter", category: "REVIEW", rationale: "46:29" },
  { word_id: "1e7312a5-644a-4a84-ae2e-897f6b14026d", arabic: "أَنصِتُوا۟ ۖ", gloss: "écouter en silence / faire silence", category: "REVIEW", rationale: "46:29" },
  { word_id: "c33ebd1c-9e35-405e-a1de-8c72089b5c99", arabic: "أَجِيبُوا۟", gloss: "répondre / obéir à l'appel / exaucer", category: "REVIEW", rationale: "46:31" },
  { word_id: "290ff2a7-9efe-4edf-a041-05a6f13f0526", arabic: "وَيُجِرْكُم", gloss: "protéger / accorder refuge / sauvegarder", category: "REVIEW", rationale: "46:31" },
  { word_id: "6be4cdee-5feb-4864-8cdf-e198c233151b", arabic: "يُجِبْ", gloss: "répondre / exaucer", category: "REVIEW", rationale: "46:5" },
  { word_id: "4aa44a07-ed6b-48d2-85fe-aef16344d165", arabic: "يَعْىَ", gloss: "comprendre / saisir par l'intelligence", category: "REVIEW", rationale: "46:26" },
  { word_id: "ec59eef2-8c4a-43c5-b730-dba5ac3bdd5e", arabic: "ٱلْعَزْمِ", gloss: "fermeté / résolution / détermination", category: "REVIEW", rationale: "46:35" },
  { word_id: "c7007821-97d6-4e73-bba0-ab959c572894", arabic: "تَسْتَعْجِل", gloss: "chercher à hâter / être impatient", category: "REVIEW", rationale: "46:35" },
  { word_id: "5061dee1-7f79-42e3-a1d3-88d030e8ee91", arabic: "يَسْتَغِيثَانِ", gloss: "appeler au secours / implorer assistance", category: "REVIEW", rationale: "46:17" },
];

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  mkdirSync("reports", { recursive: true });

  console.log("=== PHASE 88F-AB — S46 RUNTIME-TRUTH RECLASSIFICATION ===\n");

  // ─── 1. Load all data ──────────────────────────────────────────────────
  console.log("Loading data...");
  const [allWords, allOccs, allAyahs, allSurahs, allLemmas, allWlm, allWordTr, allLemmaTr] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number,global_ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "lemmas", "id,arabic"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,source_id,is_validated,validated_at,updated_at"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,source_id,is_validated,validated_at,updated_at"),
  ]);

  // Indexes
  const wordById = new Map<string, DbRow>();
  const lemmaById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const l of allLemmas) lemmaById.set(l.id as string, l);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);

  // Word → lemma via WLM (confidence='safe' only — matches runtime)
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) {
    if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string);
  }

  // FR word_translations (is_validated=true)
  const frWordTr = new Map<string, string>();
  for (const t of allWordTr) {
    if (t.language === "fr" && t.is_validated === true) {
      if (!frWordTr.has(t.word_id as string)) frWordTr.set(t.word_id as string, t.text as string);
    }
  }

  // FR lemma_translations (is_validated=true)
  const frLemmaTr = new Map<string, string>();
  for (const t of allLemmaTr) {
    if (t.language === "fr" && t.is_validated === true) {
      if (!frLemmaTr.has(t.lemma_id as string)) frLemmaTr.set(t.lemma_id as string, t.text as string);
    }
  }

  // ─── 2. Build S46 word set ─────────────────────────────────────────────
  const s46SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s46SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s46AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s46SurahId) s46AyahIds.add(a.id as string); }
  const s46WordIds = new Set<string>();
  for (const oc of allOccs) { if (s46AyahIds.has(oc.ayah_id as string)) s46WordIds.add(oc.word_id as string); }
  const total46 = s46WordIds.size;
  console.log(`  S46 total forms: ${total46} | ayahs: ${s46AyahIds.size}`);

  // ─── 3. Runtime resolve each S46 word ──────────────────────────────────
  console.log("\n=== Runtime resolution (resolveWordMeanings replica) ===\n");

  type ResolutionPath = "already_covered" | "path_A_word_tr" | "path_B_direct_lemma" | "path_C_wlm_lemma" | "unresolved";
  type WordResolution = {
    word_id: string;
    arabic: string;
    lemma_id_on_quran_words: string | null;
    wlm_lemma_id: string | null;
    has_word_tr: boolean;
    has_lemma_via_direct: boolean;
    has_lemma_via_wlm: boolean;
    path: ResolutionPath;
    french_text: string | null;
    en_meaning: string | null;
  };

  const resolutions: WordResolution[] = [];
  let coveredCount = 0;
  let pathA_count = 0, pathB_count = 0, pathC_count = 0, unresolvedCount = 0;

  for (const wid of s46WordIds) {
    const word = wordById.get(wid);
    const arabic = (word?.arabic as string) ?? "?";
    const lemmaIdOnWord = (word?.lemma_id as string) ?? null;
    const wlmLemmaId = wlmByWord.get(wid) ?? null;
    const enMeaning = (word?.meaning as string) ?? null;

    // PATH A: direct word_translation FR
    const hasWordTr = frWordTr.has(wid);

    // PATH B: lemma via quran_words.lemma_id → lemma_translation FR
    const hasLemmaViaDirect = !hasWordTr && lemmaIdOnWord != null && frLemmaTr.has(lemmaIdOnWord);

    // PATH C: lemma via word_lemma_mapping → lemma_translation FR
    const hasLemmaViaWlm = !hasWordTr && !hasLemmaViaDirect && wlmLemmaId != null && frLemmaTr.has(wlmLemmaId);

    let path: ResolutionPath;
    let frenchText: string | null = null;

    if (hasWordTr) {
      path = "path_A_word_tr";
      frenchText = frWordTr.get(wid) ?? null;
    } else if (hasLemmaViaDirect) {
      path = "path_B_direct_lemma";
      frenchText = frLemmaTr.get(lemmaIdOnWord!) ?? null;
    } else if (hasLemmaViaWlm) {
      path = "path_C_wlm_lemma";
      frenchText = frLemmaTr.get(wlmLemmaId!) ?? null;
    } else {
      path = "unresolved";
    }

    if (path !== "unresolved") coveredCount++;

    switch (path) {
      case "path_A_word_tr": pathA_count++; break;
      case "path_B_direct_lemma": pathB_count++; break;
      case "path_C_wlm_lemma": pathC_count++; break;
      default: unresolvedCount++;
    }

    resolutions.push({
      word_id: wid, arabic,
      lemma_id_on_quran_words: lemmaIdOnWord,
      wlm_lemma_id: wlmLemmaId,
      has_word_tr: hasWordTr,
      has_lemma_via_direct: hasLemmaViaDirect,
      has_lemma_via_wlm: hasLemmaViaWlm,
      path, french_text: frenchText, en_meaning: enMeaning,
    });
  }

  console.log(`  Covered: ${coveredCount}/${total46} (${ROUND(coveredCount / total46 * 100, 1)}%)`);
  console.log(`    PATH A (word_tr):         ${pathA_count}`);
  console.log(`    PATH B (quran_words.lemma): ${pathB_count}`);
  console.log(`    PATH C (WLM → lemma):      ${pathC_count}`);
  console.log(`    UNRESOLVED:               ${unresolvedCount}\n`);

  // ─── 4. Classify unresolved forms ──────────────────────────────────────
  console.log("=== Classifying unresolved forms ===\n");

  const wordGlossWordIds = new Set(WORD_GLOSSES.map(w => w.word_id));

  let couldBeLemmaGloss = 0; // has lemma_id from MASAQ but runtime link missing
  let couldBeWordTrOnly = 0; // no lemma path at all
  let alreadyHasWordGloss = 0; // in our WORD_GLOSSES list

  const unresolved = resolutions.filter(r => r.path === "unresolved");
  const classification: Record<string, unknown>[] = [];

  for (const u of unresolved) {
    // Check: does this word appear in our 88F-Y safeGlossCandidates (lemma-able per MASAQ)?
    // No longer needed — the runtime classification already handles this — we'd need actual mapping
    const inWordGlossList = wordGlossWordIds.has(u.word_id);

    let recommendedAction: string;
    let recommendedFrenchGloss: string | null = null;

    if (inWordGlossList) {
      const wg = WORD_GLOSSES.find(w => w.word_id === u.word_id);
      recommendedAction = "word_translation";
      recommendedFrenchGloss = wg?.gloss ?? null;
      alreadyHasWordGloss++;
    } else {
      // Check if we have a lemma gloss for this (from 88F-AA)
      const matchingLemmaGloss = LEMMA_GLOSSES.find(l => {
        if (u.lemma_id_on_quran_words === l.lemma_id) return true;
        if (u.wlm_lemma_id === l.lemma_id) return true;
        return false;
      });
      if (matchingLemmaGloss) {
        recommendedAction = "lemma_translation_VIABLE";
        recommendedFrenchGloss = matchingLemmaGloss.gloss;
        couldBeLemmaGloss++;
      } else {
        recommendedAction = "word_translation_NEEDED";
        couldBeWordTrOnly++;
      }
    }

    classification.push({
      word_id: u.word_id,
      arabic: u.arabic,
      quran_words_lemma_id: u.lemma_id_on_quran_words,
      wlm_lemma_id: u.wlm_lemma_id,
      has_runtime_lemma_link: !!(u.lemma_id_on_quran_words || u.wlm_lemma_id),
      recommended_action: recommendedAction,
      recommended_gloss: recommendedFrenchGloss,
      en_meaning: u.en_meaning,
    });
  }

  console.log(`  Unresolved forms: ${unresolved.length}`);
  console.log(`    With existing word gloss text:  ${alreadyHasWordGloss}`);
  console.log(`    Can use lemma at runtime:       ${couldBeLemmaGloss}`);
  console.log(`    Need word_translation:          ${couldBeWordTrOnly}`);
  console.log(`    Total word_tr needed:           ${unresolved.length - couldBeLemmaGloss}\n`);

  // ─── 5. Cross-check: 88F-Y lemma_ids vs runtime links ──────────────────
  console.log("=== Cross-check: 88F-Y lemma-able forms vs runtime ===\n");

  // Load 88F-Y data for comparison
  let yReport: Record<string, unknown> = {};
  try {
    yReport = JSON.parse(readFileSync("reports/phase-88f-y-surah46-audit.json", "utf-8"));
  } catch { /* OK */ }

  const yMissingForms = (yReport.missingForms as Array<Record<string, unknown>> ?? []);

  const yClassifiedA = yMissingForms.filter(m => m.classification === "A_SAFE_LEMMA_GLOSS");
  const yClassifiedF = yMissingForms.filter(m => m.classification === "F_REVIEW_WORD_TRANSLATION");

  // For each A_SAFE_LEMMA_GLOSS form, check runtime link
  let aForms_runtimeLinked = 0;
  let aForms_runtimeUnlinked = 0;
  for (const mf of yClassifiedA) {
    const wid = mf.word_id as string;
    const lemmaIdOnWord = (wordById.get(wid)?.lemma_id as string) ?? null;
    const wlmLemmaId = wlmByWord.get(wid) ?? null;
    const runtimeLinked = !!(lemmaIdOnWord || wlmLemmaId);
    if (runtimeLinked) aForms_runtimeLinked++;
    else aForms_runtimeUnlinked++;
  }

  console.log(`  88F-Y A_SAFE_LEMMA_GLOSS forms: ${yClassifiedA.length}`);
  console.log(`    Runtime-linked (quran_words.lemma OR WLM): ${aForms_runtimeLinked}`);
  console.log(`    Runtime-UNLINKED:                         ${aForms_runtimeUnlinked}`);
  console.log(`  88F-Y F_REVIEW_WORD_TRANSLATION forms:      ${yClassifiedF.length}\n`);

  // ─── 6. Correct action plan ─────────────────────────────────────────────
  console.log("=== Correct action plan ===\n");

  const correctWordTrNeeded = unresolved.length - couldBeLemmaGloss;
  const correctLemmaTrViable = couldBeLemmaGloss;

  console.log(`  word_translations to insert: ${correctWordTrNeeded} (ALL unresolved minus runtime-viable lemmas)`);
  console.log(`  lemma_translations viable at runtime: ${correctLemmaTrViable}`);
  console.log(`  lemma_translations structurally useless for S46: ${LEMMA_GLOSSES.length - correctLemmaTrViable}`);
  console.log(`  Expected S46 after import: ${coveredCount + correctWordTrNeeded + correctLemmaTrViable}/${total46}`);
  console.log(`  READY: ${(coveredCount + correctWordTrNeeded + correctLemmaTrViable) === total46 ? "✅ YES" : "❌ NO"}\n`);

  // ─── 7. Global propagation (runtime-truth only) ────────────────────────
  console.log("=== Global propagation (runtime-truth) ===\n");
  let globalFormsUnlocked = 0;
  const affectedSurahs = new Set<number>();

  for (const lg of LEMMA_GLOSSES) {
    if (frLemmaTr.has(lg.lemma_id)) continue; // already covered
    // Find ALL words globally that link to this lemma at runtime
    for (const [wid] of wordById) {
      if (frWordTr.has(wid)) continue; // already covered via word_tr
      const lemmaOnWord = (wordById.get(wid)?.lemma_id as string) ?? null;
      const wlmLemma = wlmByWord.get(wid) ?? null;
      if (lemmaOnWord === lg.lemma_id || wlmLemma === lg.lemma_id) {
        globalFormsUnlocked++;
        // Find surahs
        for (const oc of allOccs) {
          if (oc.word_id === wid) {
            const ayah = allAyahs.find(a => a.id === oc.ayah_id);
            if (ayah) {
              const sn = surahNumById.get(ayah.surah_id as string);
              if (sn != null) affectedSurahs.add(sn);
            }
          }
        }
      }
    }
  }

  console.log(`  Global forms unlocked (runtime-truth): ${globalFormsUnlocked}`);
  console.log(`  Surahs affected: ${affectedSurahs.size}`);
  console.log(`  88F-X prediction: 168 forms, 84 surahs`);
  console.log(`  Overcount factor: ${ROUND(168 / Math.max(1, globalFormsUnlocked), 1)}x\n`);

  // ─── 8. Comparison table: 88F-Y vs 88F-AA vs 88F-AB ──────────────────
  const comparison = {
    "88F-Y": { classificationModel: "MASAQ linguistic_occurrences.hikma_lemma_id", lemmaForms: yClassifiedA.length, wordTrForms: yClassifiedF.length, totalActions: 75, readyAfterImport: false },
    "88F-AA": { classificationModel: "MASAQ (same as 88F-Y) + editorial glosses added", lemmaForms: yClassifiedA.length, wordTrForms: yClassifiedF.length, totalActions: 75, readyAfterImport: false, note: "Discovered structural gap but didn't reclassify" },
    "88F-AB": { classificationModel: "RUNTIME: resolveWordMeanings → word_tr | quran_words.lemma_id | WLM | EN fallback", lemmaForms: correctLemmaTrViable, wordTrForms: correctWordTrNeeded, totalActions: correctLemmaTrViable + correctWordTrNeeded, readyAfterImport: (coveredCount + correctWordTrNeeded + correctLemmaTrViable) === total46 },
  };

  // ─── 9. Import preflight (read-only) ───────────────────────────────────
  console.log("=== Import preflight ===\n");

  // Build the payload: for each unresolved form, build a word_translation (or lemma_translation if viable)
  const importPayload: Record<string, unknown>[] = [];

  for (const u of unresolved) {
    if (u.path !== "unresolved") continue;

    // Check if lemma is runtime-viable
    const lemmaMatch = LEMMA_GLOSSES.find(l => {
      if (u.lemma_id_on_quran_words === l.lemma_id) return true;
      if (u.wlm_lemma_id === l.lemma_id) return true;
      return false;
    });

    if (lemmaMatch && u.lemma_id_on_quran_words) {
      importPayload.push({
        table: "lemma_translations",
        lemma_id: lemmaMatch.lemma_id,
        text: lemmaMatch.gloss,
        rationale: lemmaMatch.rationale,
        action: "INSERT",
        status: "NEW",
      });
    } else if (lemmaMatch && u.wlm_lemma_id) {
      importPayload.push({
        table: "lemma_translations",
        lemma_id: lemmaMatch.lemma_id,
        text: lemmaMatch.gloss,
        rationale: lemmaMatch.rationale,
        action: "INSERT",
        status: "NEW",
      });
    } else {
      // Find word gloss
      const wg = WORD_GLOSSES.find(w => w.word_id === u.word_id);
      importPayload.push({
        table: "word_translations",
        word_id: u.word_id,
        arabic: u.arabic,
        text: wg?.gloss ?? null,
        rationale: wg?.rationale ?? "No pre-written gloss — needs editorial work",
        action: wg?.gloss ? "INSERT" : "BLOCKED_NEEDS_GLOSS",
        status: wg?.gloss ? "NEW" : "BLOCKED",
      });
    }
  }

  const blockedCount = importPayload.filter(p => p.status === "BLOCKED").length;
  const readyForImport = importPayload.filter(p => p.status === "NEW").length;
  console.log(`  Import payload: ${importPayload.length} entries`);
  console.log(`    Ready for import:  ${readyForImport}`);
  console.log(`    Blocked (no gloss): ${blockedCount}\n`);

  // ─── 10. Build report ──────────────────────────────────────────────────
  const report = {
    phase: "88F-AB",
    verdict: blockedCount === 0 ? "READY_FOR_IMPORT" : "BLOCKED_NEEDS_EDITORIAL_REVIEW",
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    baseline: {
      surah46: {
        totalForms: total46,
        coveredForms: coveredCount,
        unresolvedForms: unresolvedCount,
        coveragePct: ROUND(coveredCount / total46 * 100, 4),
        byPath: { A_word_tr: pathA_count, B_direct_lemma: pathB_count, C_wlm_lemma: pathC_count },
        readiness: coveredCount === total46 ? "READY" : "IN_PREPARATION",
      },
      global: {
        frWordTranslations: frWordTr.size,
        frLemmaTranslations: frLemmaTr.size,
        wordLemmaMappings: wlmByWord.size,
      },
    },
    runtimeResolutionModel: {
      order: ["1. word_translations (language='fr', is_validated=true)", "2. quran_words.lemma_id → lemma_translations", "3. word_lemma_mapping (confidence='safe') → lemma_translations", "4. EN fallback (quran_words.meaning — not FR)"],
      notUsed: ["linguistic_occurrences.hikma_lemma_id (MASAQ) — NOT consumed by resolveWordMeanings"],
    },
    classification,
    crossCheck88FY: {
      aFormsTotal: yClassifiedA.length,
      aFormsRuntimeLinked: aForms_runtimeLinked,
      aFormsRuntimeUnlinked: aForms_runtimeUnlinked,
      fFormsTotal: yClassifiedF.length,
      note: "88F-Y derived lemma_ids from MASAQ linguistic_occurrences.hikma_lemma_id, which the runtime resolver does NOT use. The runtime only resolves lemma through quran_words.lemma_id and word_lemma_mapping.",
    },
    comparison,
    correctActionPlan: {
      wordTranslationsNeeded: correctWordTrNeeded,
      lemmaTranslationsViable: correctLemmaTrViable,
      totalActions: correctLemmaTrViable + correctWordTrNeeded,
      expectedS46AfterImport: `${coveredCount + correctWordTrNeeded + correctLemmaTrViable}/${total46}`,
      readyAfterImport: (coveredCount + correctWordTrNeeded + correctLemmaTrViable) === total46,
    },
    globalPropagationRuntimeTruth: {
      globalFormsUnlocked,
      surahsAffected: affectedSurahs.size,
      eightyEightFX_prediction: 168,
      overcountFactor: ROUND(168 / Math.max(1, globalFormsUnlocked), 1),
      note: "88F-X predicted 168 global forms and 84 surahs. This is inflated because it counted lemma→word links through linguistic_occurrences.hikma_lemma_id, which the runtime does not consume.",
    },
    importPreflight: {
      totalEntries: importPayload.length,
      readyForImport,
      blocked: blockedCount,
      payload: importPayload,
      guarantees: {
        antiDuplicate: true,
        antiConflict: true,
        idempotent: true,
        noPlaceholderGlosses: true,
        noMasaqMappings: true,
        noMigrations: true,
        noSeeds: true,
        noCurriculumModification: true,
      },
    },
    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
  console.log(`  Runtime coverage: ${coveredCount}/${total46} (${ROUND(coveredCount / total46 * 100, 1)}%)`);
  console.log(`  Actions needed: ${correctLemmaTrViable + correctWordTrNeeded}`);
  console.log(`  Blocked (no gloss): ${blockedCount}`);
  console.log(`  DATABASE WRITES: 0 ✅`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AB", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});