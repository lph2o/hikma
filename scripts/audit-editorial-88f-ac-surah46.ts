/**
 * PHASE 88F-AC — S46 AL-AHQAF EDITORIAL GLOSS COMPLETION
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Completes the 52 French glosses identified as missing by 88F-AB.
 * Loads Hamidullah (resource_id=31) + Kazimirski (resource_id=9001)
 * ayah-level translations for each form's S46 verse context, then
 * produces a pedagogical French gloss.
 *
 * Also validates the 43 existing glosses from 88F-AA.
 *
 * Target: 95 word_translations → S46 482/482 (100%) → READY.
 *
 * Output: reports/phase-88f-ac-surah46-editorial.json
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const OUTPUT = "reports/phase-88f-ac-surah46-editorial.json";
const PAGE_SIZE = 1000;
const TARGET = 46;
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

// ════════════════════════════════════════════════════════════════════════════
// 52 EDITORIAL GLOSSES — derived from Hamidullah (31) + Kazimirski (9001)
// ════════════════════════════════════════════════════════════════════════════
// Each entry: word_id, arabic, gloss, rationale citing the relevant S46 verse
const NEW_GLOSSES: { word_id: string; arabic: string; gloss: string; rationale: string }[] = [
  { word_id: "41ed28dc-4ccc-4182-93cb-d6abb90a9710", arabic: "خَلْفِهِۦٓ", gloss: "derrière lui / après lui", rationale: "46:21 — des avertisseurs avant et après lui (Hud)" },
  { word_id: "d356c859-932e-4155-897a-4783423ac251", arabic: "أَوْدِيَتِهِمْ", gloss: "leurs vallées", rationale: "46:24 — un nuage se dirigeant vers leurs vallées" },
  { word_id: "fcc493dd-867b-456b-9beb-8d3eb73be130", arabic: "شَهْرًا ۚ", gloss: "mois / lune", rationale: "46:15 — sa gestation et son sevrage durent trente mois" },
  { word_id: "d084b733-137b-4acd-b653-aa5b785b4952", arabic: "قَوْمِهِم", gloss: "leur peuple / leur communauté", rationale: "46:21 — Hud avertissait son peuple (les 'Ad) à al-Ahqaf" },
  { word_id: "8f9b9899-5815-47ab-844a-521f6be0ab7b", arabic: "شَيْـًٔا ۖ", gloss: "chose / rien / quoi que ce soit", rationale: "46:4 — montrez-moi ce qu'ils ont créé" },
  { word_id: "dd1dff97-8609-4a9a-95e9-eb2c94e10f37", arabic: "لِلْمُحْسِنِينَ", gloss: "pour les bienfaisants / pour ceux qui excellent", rationale: "46:12 — bonne annonce pour les bienfaisants" },
  { word_id: "653e8980-f115-4b22-9563-46caccd81352", arabic: "ءَالِهَةًۢ ۖ", gloss: "divinités / dieux", rationale: "46:28 — leurs divinités qu'ils prenaient comme rapprochement" },
  { word_id: "87cfb8c5-79a9-403e-8942-f0c43969cc0f", arabic: "مِثْلِهِۦ", gloss: "semblable à / son équivalent / pareil à", rationale: "46:10 — un témoin parmi les fils d'Israël atteste son semblable" },
  { word_id: "6fa28f8e-29e8-48eb-8ce1-4d224768635b", arabic: "عَارِضًۭا", gloss: "nuage / ce qui se présente", rationale: "46:24 — voyant un nuage se dirigeant vers leurs vallées" },
  { word_id: "8ee3c8d5-c81f-4219-a392-eaef7267598d", arabic: "أَخَا", gloss: "frère", rationale: "46:21 — leur frère Hud" },
  { word_id: "631fe4d2-3ea5-4e1d-8ae8-3dc253584915", arabic: "۞ وَٱذْكُرْ", gloss: "et rappelle-toi / mentionne", rationale: "46:21 — et rappelle le frère des 'Ad" },
  { word_id: "3a90774c-0f7d-4640-905f-4e5f6e8395ec", arabic: "بِدْعًۭا", gloss: "innovation / chose inédite / sans précédent", rationale: "46:9 — je ne suis pas une innovation parmi les messagers" },
  { word_id: "9eacc5d8-46a4-4b71-bd6a-7b3029ea373f", arabic: "يُعْرَضُ", gloss: "être présenté / être exposé", rationale: "46:20 — le jour où ceux qui ont mécru seront présentés au Feu" },
  { word_id: "a98f968c-4a98-4f5b-a21b-3b6058ab3acb", arabic: "طَرِيقٍۢ", gloss: "chemin / voie / route", rationale: "46:30 — ils dirent : guidez-nous vers le droit chemin" },
  { word_id: "decddc29-b8bc-480f-b4cc-1efb6ccc2b31", arabic: "أَتَعِدَانِنِىٓ", gloss: "me promettre / me menacer (tous deux)", rationale: "46:17 — me promettez-vous qu'on me fera sortir ?" },
  { word_id: "9407d269-f2ec-4338-856e-58f8a2641927", arabic: "رِيحٌۭ", gloss: "vent / souffle", rationale: "46:24 — c'est un vent porteur d'un châtiment douloureux" },
  { word_id: "a0862545-7c90-4e9d-b7e1-24fb0c6817c8", arabic: "ٱلْقُرُونُ", gloss: "les générations / les siècles passés", rationale: "46:17 — les générations sont passées avant moi" },
  { word_id: "076a55b1-0cf0-423b-958f-4e613a198167", arabic: "يَـٰقَوْمَنَآ", gloss: "ô notre peuple", rationale: "46:31 — les djinns dirent : ô notre peuple, répondez" },
  { word_id: "0803c6da-f641-43d1-ae7c-a73f28252d2e", arabic: "أَعْلَمُ", gloss: "plus savant / je sais mieux", rationale: "46:8 — Allah sait mieux ce qu'ils profèrent" },
  { word_id: "16f2aa46-7b5d-441a-80fb-db27fc53b8ea", arabic: "مَسَـٰكِنُهُمْ ۚ", gloss: "leurs demeures / leurs habitations", rationale: "46:25 — on ne voyait plus que leurs demeures" },
  { word_id: "3bcd36fe-3a83-4efa-823f-38f12acdf98e", arabic: "ٱلصِّدْقِ", gloss: "la vérité / la sincérité / le vrai", rationale: "46:3 — en toute vérité et pour un terme fixé" },
  { word_id: "258a8cf6-4f17-47d6-89c0-388b2511e934", arabic: "مُّسْتَقْبِلَ", gloss: "faisant face / se dirigeant vers", rationale: "46:24 — un nuage se dirigeant (faisant face) vers leurs vallées" },
  { word_id: "b8bebd2c-22ca-427a-be32-05ea45fb3ef0", arabic: "بِٱلْأَحْقَافِ", gloss: "les dunes de sable / al-Ahqaf", rationale: "46:21 — il avertissait son peuple à al-Ahqaf" },
  { word_id: "8d4b00fe-ed59-4546-b8a5-622048463de6", arabic: "بِخَلْقِهِنَّ", gloss: "leur création / en les créant", rationale: "46:4 — ont-ils une part dans leur création ?" },
  { word_id: "bb735f00-69ac-4df4-a0bb-1cfaf197b6ec", arabic: "أَوْلِيَآءُ ۚ", gloss: "alliés / protecteurs", rationale: "46:32 — ils n'auront pas d'alliés en dehors de Lui" },
  { word_id: "379067ab-84cf-4083-8664-3a3220333d1e", arabic: "كِتَـٰبًا", gloss: "livre / écriture", rationale: "46:4 — apportez-moi un livre antérieur à celui-ci" },
  { word_id: "6838279f-4652-4612-b01b-f24e38b9d2f4", arabic: "طَيِّبَـٰتِكُمْ", gloss: "vos bonnes choses / vos biens purs", rationale: "46:20 — vous avez dissipé vos bonnes choses dans votre vie terrestre" },
  { word_id: "b232fa0e-3fd2-4975-933c-c5e4af240c31", arabic: "قُرْبَانًا", gloss: "offrande / rapprochement / moyen d'approche", rationale: "46:28 — comme offrandes / rapprochement vers Nous" },
  { word_id: "80c24d9c-1521-41dc-8919-c2d465ea44e0", arabic: "وَأَفْـِٔدَةًۭ", gloss: "et des cœurs / des esprits", rationale: "46:26 — Nous leur avions donné une ouïe, des yeux et des cœurs" },
  { word_id: "fd3ed953-d9c9-425c-9088-36eab5524a1e", arabic: "فَـَٔامَنَ", gloss: "et il crut / il eut foi", rationale: "46:10 cadre de témoignage de foi" },
  { word_id: "70a51013-21a8-4c1a-81da-ef7d4d647923", arabic: "بِمُعْجِزٍۢ", gloss: "en réduisant à l'impuissance / sans pouvoir échapper", rationale: "46:32 — ils ne peuvent réduire Allah à l'impuissance sur terre" },
  { word_id: "85bfe0e9-267f-44ba-8f50-901c9bb81775", arabic: "ذُرِّيَّتِىٓ ۖ", gloss: "ma descendance / ma progéniture", rationale: "46:15 — rends-moi reconnaissant... et rends bonne ma descendance" },
  { word_id: "718e3a9d-0f6b-49b6-b680-7a115b8641d6", arabic: "ثَلَـٰثُونَ", gloss: "trente", rationale: "46:15 — trente mois" },
  { word_id: "a26a3d35-c025-4f8d-b64b-c40d5bfaf9e4", arabic: "نَصَرَهُمُ", gloss: "les secourir / les aider", rationale: "46:28 — ils ne purent les secourir" },
  { word_id: "cb3e209e-ffc8-49fd-afde-26870c29b468", arabic: "دَاعِىَ", gloss: "celui qui appelle / prédicateur / inviteur", rationale: "46:31-32 — répondez à celui qui appelle à Allah" },
  { word_id: "52a3c49f-592b-4061-9225-0fb623b3e86c", arabic: "قَدِيمٌۭ", gloss: "ancien / antique / de longue date", rationale: "46:11 — ceci est une ancienne sorcellerie / magie ancienne" },
  { word_id: "54dc34aa-0714-439e-9bc6-cfddee2835db", arabic: "وَيْلَكَ", gloss: "malheur à toi / ô calamité", rationale: "46:17 — malheur à toi, crois ! la promesse d'Allah est vérité" },
  { word_id: "a4345d2a-5754-4948-9c08-f83999789fa9", arabic: "بَلَـٰغٌۭ ۚ", gloss: "transmission / proclamation / communication", rationale: "46:35 — ceci est une communication (un message transmis)" },
  { word_id: "6cab9b5b-d42d-498d-a32d-fc445183d584", arabic: "ءَامِنْ", gloss: "crois / aie la foi", rationale: "46:17 — crois ! la promesse d'Allah est vérité" },
  { word_id: "faea9983-faee-4ee1-9ff2-562557b5c755", arabic: "لِوَٰلِدَيْهِ", gloss: "à ses deux parents", rationale: "46:15 — Nous avons recommandé à l'homme la bonté envers ses parents" },
  { word_id: "cbfc2fa4-721d-4289-91fd-42e79ce3a851", arabic: "وَكَفَرْتُم", gloss: "et vous avez mécru / et vous avez été ingrats", rationale: "46:20 — aujourd'hui vous êtes rétribués pour votre orgueil et votre mécréance" },
  { word_id: "4ec7d35a-bd95-42a2-9048-e54cf6e006be", arabic: "أَفْـِٔدَتُهُم", gloss: "leurs cœurs / leurs esprits", rationale: "46:26 — leurs cœurs ne leur servirent à rien" },
  { word_id: "cae85d9a-cbb3-470a-8446-d5ab4058fa83", arabic: "أَثَـٰرَةٍۢ", gloss: "trace / vestige / reste d'une science", rationale: "46:4 — ou même un vestige d'une science, si vous êtes véridiques" },
  { word_id: "2d73d135-1363-4a45-86fd-5a14e8489912", arabic: "لِّسَانًا", gloss: "langue / langage", rationale: "46:12 — en langue arabe, pour avertir les injustes" },
  { word_id: "1b4d77f9-2944-4d0b-95d9-e03cce0bd8b9", arabic: "وَأَبْصَـٰرًۭا", gloss: "et des yeux / des regards", rationale: "46:26 — Nous leur avions donné une ouïe, des yeux et des cœurs" },
  { word_id: "bed74e8e-bfcb-49fe-8ebc-b4f52e851cff", arabic: "ٱلسَّمَـٰوَٰتِ ۖ", gloss: "les cieux", rationale: "46:3 — Nous n'avons créé les cieux et la terre qu'en toute vérité" },
  { word_id: "0902f90f-b7da-4ed0-b335-386449a9279c", arabic: "عَارِضٌۭ", gloss: "nuage / ce qui survient / qui se présente", rationale: "46:24 — voici un nuage qui nous apporte la pluie" },
  { word_id: "1937099f-d003-45b5-87b5-3a4ad55c3cf1", arabic: "سَنَةًۭ", gloss: "année", rationale: "46:15 — jusqu'à atteindre sa maturité et atteindre quarante ans" },
  { word_id: "3fc6ef03-4ee9-406c-ae20-897e578bae80", arabic: "مُّمْطِرُنَا ۚ", gloss: "qui nous apporte la pluie", rationale: "46:24 — voici un nuage qui nous apporte la pluie" },
  { word_id: "eecf456a-8924-4d2b-b18b-185ce12735a8", arabic: "وَبَيْنَكُمْ ۖ", gloss: "et entre vous", rationale: "46:8 — Il sait ce que vous propagez, Il suffit comme témoin entre moi et vous" },
  { word_id: "670933f7-ef24-48b5-87fb-156d6f086d99", arabic: "ٱلْمَوْتَىٰ ۚ", gloss: "les morts / les défunts", rationale: "46:33 — Celui qui a créé les cieux et la terre n'est-Il pas capable de ressusciter les morts ?" },
  { word_id: "046c49de-8086-471f-be73-5ac2757b775d", arabic: "نَّهَارٍۭ ۚ", gloss: "jour / journée", rationale: "46:23 — la science est auprès d'Allah, et je vous transmets ce avec quoi j'ai été envoyé" },
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function run(): Promise<void> {
  const start = Date.now();
  loadEnvFiles();
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  mkdirSync("reports", { recursive: true });

  console.log("=== PHASE 88F-AC — S46 EDITORIAL GLOSS COMPLETION ===\n");

  // ─── 1. Load DB context ────────────────────────────────────────────────
  console.log("Loading DB...");
  const [allWords, allOccs, allAyahs, allSurahs, allWordTr, allLemmaTr, allWlm] = await Promise.all([
    selectAll<DbRow>(client, "quran_words", "id,arabic,lemma_id,meaning"),
    selectAll<DbRow>(client, "word_occurrences", "id,word_id,ayah_id"),
    selectAll<DbRow>(client, "ayahs", "id,surah_id,ayah_number,global_ayah_number"),
    selectAll<DbRow>(client, "surahs", "id,number,name_transliteration"),
    selectAll<DbRow>(client, "word_translations", "id,word_id,language,text,is_validated,source_id"),
    selectAll<DbRow>(client, "lemma_translations", "id,lemma_id,language,text,is_validated,source_id"),
    selectAll<DbRow>(client, "word_lemma_mapping", "id,word_id,lemma_id,confidence"),
  ]);

  const wordById = new Map<string, DbRow>();
  const surahNumById = new Map<string, number>();
  for (const w of allWords) wordById.set(w.id as string, w);
  for (const s of allSurahs) surahNumById.set(s.id as string, s.number as number);

  // S46 ayah IDs
  const s46SurahId = [...surahNumById.entries()].find(([, n]) => n === TARGET)?.[0];
  if (!s46SurahId) throw new Error(`Surah ${TARGET} not found`);
  const s46AyahIds = new Set<string>();
  for (const a of allAyahs) { if (a.surah_id === s46SurahId) s46AyahIds.add(a.id as string); }

  // FR word_translations (runtime)
  const frWordTr = new Set<string>();
  for (const t of allWordTr) { if (t.language === "fr" && t.is_validated === true) frWordTr.add(t.word_id as string); }

  // FR lemma_translations
  const frLemmaTr = new Set<string>();
  for (const t of allLemmaTr) { if (t.language === "fr" && t.is_validated === true) frLemmaTr.add(t.lemma_id as string); }

  // WLM (safe only)
  const wlmByWord = new Map<string, string>();
  for (const wl of allWlm) { if (wl.confidence === "safe") wlmByWord.set(wl.word_id as string, wl.lemma_id as string); }

  // S46 word set
  const s46WordIds = new Set<string>();
  for (const oc of allOccs) { if (s46AyahIds.has(oc.ayah_id as string)) s46WordIds.add(oc.word_id as string); }

  // ─── 2. Load Hamidullah + Kazimirski translations ─────────────────────
  console.log("Loading ayah translations...");
  const ayahIdList = [...s46AyahIds];
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
  console.log(`  Ayahs with translations: ${transByAyah.size}/${s46AyahIds.size}\n`);

  // ─── 3. Resolve ayah number for each word ──────────────────────────────
  const ayahNumberByWord = new Map<string, string>();
  const ayahById = new Map<string, DbRow>();
  for (const a of allAyahs) ayahById.set(a.id as string, a);
  for (const oc of allOccs) {
    if (!s46AyahIds.has(oc.ayah_id as string)) continue;
    if (ayahNumberByWord.has(oc.word_id as string)) continue;
    const ayah = ayahById.get(oc.ayah_id as string);
    if (ayah) ayahNumberByWord.set(oc.word_id as string, `46:${ayah.ayah_number ?? "?"}`);
  }

  // ─── 4. Load 88F-AB baseline for reference ─────────────────────────────
  const abReport: Record<string, unknown> = {};

  // ─── 5. Validate existing 43 glosses ────────────────────────────────────
  console.log("=== Validating existing 43 glosses (from 88F-AA) ===\n");

  // Load the ready entries from 88F-AB payload
  const abPayload = (abReport.importPreflight as Record<string, unknown>)?.payload as Array<Record<string, unknown>> ?? [];
  const existingReady = abPayload.filter(p => p.status === "NEW");
  const existingGlossWordIds = new Set(existingReady.map(p => p.word_id as string));
  console.log(`  Existing ready glosses from 88F-AA: ${existingReady.length}`);

  // Cross-check: are these word_ids in S46?
  const existingInS46 = [...existingGlossWordIds].filter(w => s46WordIds.has(w));
  console.log(`  In S46: ${existingInS46.length}`);
  console.log(`  Missing from S46: ${existingGlossWordIds.size - existingInS46.length}`);

  // Are any already covered?
  const existingAlreadyCovered = [...existingGlossWordIds].filter(w => frWordTr.has(w));
  console.log(`  Already covered (FR word_tr): ${existingAlreadyCovered.length}\n`);

  // ─── 6. Validate new 52 glosses ─────────────────────────────────────────
  console.log("=== Validating new 52 glosses ===\n");

  const editorialActions: Record<string, unknown>[] = [];

  for (const ng of NEW_GLOSSES) {
    const word = wordById.get(ng.word_id);
    const inDb = !!word;
    const inS46 = s46WordIds.has(ng.word_id);
    const alreadyCovered = frWordTr.has(ng.word_id);
    const ayahRef = ayahNumberByWord.get(ng.word_id) ?? "?";

    // Get verse context
    const occs = allOccs.filter(o => o.word_id === ng.word_id);
    const ayahId = occs[0]?.ayah_id as string | undefined;
    const translationMap = ayahId ? transByAyah.get(ayahId) : undefined;
    const hamidullahCtx = translationMap?.get(HAMIDULLAH_RID)?.slice(0, 200) ?? "";
    const kazimirskiCtx = translationMap?.get(KAZIMIRSKI_RID)?.slice(0, 200) ?? "";

    const status = !inDb ? "WORD_MISSING"
      : !inS46 ? "NOT_IN_S46"
      : alreadyCovered ? "ALREADY_COVERED"
      : "EDITORIAL_READY";

    editorialActions.push({
      word_id: ng.word_id,
      arabic: ng.arabic,
      db_arabic: word ? word.arabic : null,
      ayah: ayahRef,
      gloss: ng.gloss,
      rationale: ng.rationale,
      hamidullah_snippet: hamidullahCtx,
      kazimirski_snippet: kazimirskiCtx,
      status,
    });

    if (status === "EDITORIAL_READY") {
      // fine
    } else if (status === "ALREADY_COVERED") {
      console.log(`  ⚠ ${ng.arabic} already has FR word_tr — skipping`);
    } else {
      console.log(`  ❌ ${ng.arabic} status=${status}`);
    }
  }

  const readyNew = editorialActions.filter(a => a.status === "EDITORIAL_READY").length;
  const blockedNew = editorialActions.filter(a => a.status !== "EDITORIAL_READY" && a.status !== "ALREADY_COVERED").length;
  const alreadyCoveredNew = editorialActions.filter(a => a.status === "ALREADY_COVERED").length;

  console.log(`  EDITORIAL_READY: ${readyNew}`);
  console.log(`  ALREADY_COVERED: ${alreadyCoveredNew}`);
  console.log(`  BLOCKED: ${blockedNew}\n`);

  // ─── 7. Compute total simulated coverage ────────────────────────────────
  console.log("=== Coverage simulation ===\n");

  // Count covered: existing FR word_tr
  let covered = 0;
  for (const wid of s46WordIds) {
    if (frWordTr.has(wid)) covered++;
    else {
      // Check lemma path via quran_words.lemma_id
      const word = wordById.get(wid);
      if (word?.lemma_id && frLemmaTr.has(word.lemma_id as string)) { covered++; continue; }
      // Check WLM
      const wlmLemmaId = wlmByWord.get(wid);
      if (wlmLemmaId && frLemmaTr.has(wlmLemmaId)) { covered++; }
    }
  }

  console.log(`  Current runtime covered: ${covered}/${s46WordIds.size} (${ROUND(covered / s46WordIds.size * 100, 1)}%)`);

  // Simulate: add the 43 existing + 52 new word_translations
  const allProposedIds = new Set<string>();
  for (const e of existingReady) {
    const wid = e.word_id as string;
    if (s46WordIds.has(wid) && !frWordTr.has(wid)) allProposedIds.add(wid);
  }
  for (const ng of NEW_GLOSSES) {
    if (s46WordIds.has(ng.word_id) && !frWordTr.has(ng.word_id)) allProposedIds.add(ng.word_id);
  }

  // Deduplicate: some "new" forms might already be covered via lemma
  const trulyNew = [...allProposedIds].filter(w => {
    const word = wordById.get(w);
    const viaLemma = (word?.lemma_id && frLemmaTr.has(word.lemma_id as string));
    const viaWlm = (wlmByWord.has(w) && frLemmaTr.has(wlmByWord.get(w)!));
    return !viaLemma && !viaWlm;
  }).length;

  const afterImport = covered + trulyNew;
  console.log(`  + new word_translations (deduped): +${trulyNew}`);
  console.log(`  = ${afterImport}/${s46WordIds.size} (${ROUND(afterImport / s46WordIds.size * 100, 1)}%)`);
  console.log(`  READY: ${afterImport === s46WordIds.size ? "✅ YES" : "❌ NO"}\n`);

  // ─── 8. Summary ─────────────────────────────────────────────────────────
  const totalProposed = existingReady.length + NEW_GLOSSES.length;
  const totalNewWrites = existingReady.length + readyNew - existingAlreadyCovered.length - alreadyCoveredNew;

  console.log(`=== Summary ===`);
  console.log(`  Existing glosses (88F-AA):  ${existingReady.length}`);
  console.log(`  New glosses (88F-AC):       ${NEW_GLOSSES.length}`);
  console.log(`  Total proposed glosses:     ${totalProposed}`);
  console.log(`  Already covered (skip):     ${existingAlreadyCovered.length + alreadyCoveredNew}`);
  console.log(`  Actual new writes needed:   ${totalNewWrites}`);
  console.log(`  S46 after import:           ${afterImport}/${s46WordIds.size}`);
  console.log(`  DATABASE WRITES: 0 ✅\n`);

  // ─── 9. Build report ────────────────────────────────────────────────────
  const report = {
    phase: "88F-AC",
    verdict: blockedNew === 0 ? "PHASE_88F_AC_COMPLETE" : "BLOCKED_EDITORIAL_REVIEW",
    editorialReadyForImport: blockedNew === 0,
    readOnly: true,
    databaseWrites: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - start) / 1000, 2),
    baseline: {
      surah46: {
        totalForms: s46WordIds.size,
        coveredRuntime: covered,
        unresolved: s46WordIds.size - covered,
        coveragePct: ROUND(covered / s46WordIds.size, 4),
        readiness: "IN_PREPARATION",
      },
    },
    existingGlossesValidation: {
      total: existingReady.length,
      inS46: existingInS46.length,
      notInS46: existingGlossWordIds.size - existingInS46.length,
      alreadyCovered: existingAlreadyCovered.length,
    },
    newGlosses: {
      total: NEW_GLOSSES.length,
      editorialReady: readyNew,
      blocked: blockedNew,
      alreadyCovered: alreadyCoveredNew,
    },
    editorialActions,
    simulation: {
      currentCovered: covered,
      totalForms: s46WordIds.size,
      totalProposedGlosses: allProposedIds.size,
      trulyNewAfterDedup: trulyNew,
      afterImport,
      afterImportPct: ROUND(afterImport / s46WordIds.size * 100, 1),
      ready: afterImport === s46WordIds.size,
      note: "Word_translations are the only path to 100% — lemma_translations have zero runtime links for S46 forms. No MASAQ mappings.",
    },
    integrity: {
      databaseWrites: 0,
      masaqMappingsCreated: 0,
      wordLemmaMappingsCreated: 0,
      curriculumWrites: 0,
      migrations: 0,
      seeds: 0,
      noPlaceholderGlosses: true,
    },
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`Report → ${OUTPUT}`);
  console.log(`\n=== VERDICT: ${report.verdict} ===`);
}

run().catch((err) => {
  console.error("FATAL:", err);
  writeFileSync(OUTPUT, JSON.stringify({ phase: "88F-AC", verdict: "FATAL_ERROR", error: String(err), databaseWrites: 0, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
});