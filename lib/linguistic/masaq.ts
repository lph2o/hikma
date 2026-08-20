/**
 * Hikma — couche linguistique profonde (Phase 24F).
 *
 * Fonctions PURES d'alignement MASAQ ↔ Hikma. Aucune dépendance Supabase.
 * Le runtime pédagogique actuel (FORME → LEMME → EN fallback) n'utilise PAS
 * ce module : il est réservé à la couche linguistique isolée (import + v2).
 */

// ---- Diacritiques arabes / tatweel ----
const TATWEEL = "\u0640";
const HARAKAT = new Set(
  "\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0670\u0653\u0654"
);

/**
 * Normalisation orthographique (pour comparaison, pas pour stockage).
 *
 * Conservatrice : ne fusionne que les variantes démontrées comme bénignes
 * (même mot, autre convention d'écriture), jamais deux mots réellement
 * différents. Phase 27 : tatweel global, ى→ي (alif maqṣūra), marques
 * coraniques en exposant ۥ/ۢ/ۣ (iqlab / lettre muette).
 * Phase 43B (extension 12 sourates READY) : variantes documentées par
 * l'audit 43A — espaces + signes coraniques ۖ ۚ ۟ ۠ ۭ (U+06D6-06ED),
 * petit yeh ۦ → ي (MASAQ écrit ي plein), alif en poignard après alif
 * maqṣūra (ىٰ = madda-alif écrite sur ya) → ا.
 * Phase 65 (audit 64, sourate 87) : deux variantes documentées supplémentaires —
 *  - petit yeh ۦ CONTEXTUEL : après ه (+diacritiques) = marqueur du suffixe
 *    pronominal هِۦ → MASAQ OMET le ۦ (رَبِّهِۦ → رَبِّهِ) ; ailleurs = marqueur
 *    de voyelle -i → MASAQ écrit ي plein (إِۦلاف → إِيلاف). Règle A′ :
 *    935 paires corrigées / 0 régression (corpus complet, audit 64).
 *  - wāw silencieux + dagger-alif : وٰ (U+0648 U+0670) = alif long ā écrit sur
 *    wāw dans la tradition Uthmani → MASAQ écrit ا (حَيَوٰة → حَيَاة). Règle B2 :
 *    184 paires corrigées / 0 régression. Hors périmètre : أُولَٰئِكَ (و+ل+ٰ).
 */
export function normalizeOrthographic(s: string): string {
  let out = s.replace(/\s/g, ""); // espaces (signes coraniques isolés : كَلَّا ۖ)
  out = out.replace(/\u0640/g, ""); // tatweel — TOUTES les occurrences (fix)
  // A′ : petit yeh exposant ۦ contextuel — suffixe pronominal هِۦ omis par MASAQ,
  // voyelle -i ailleurs rendue par yā' plein (audit Phase 64, 935/0 régression).
  out = out.replace(/(\u0647[\u064b-\u0652\u0670\u0653\u0654]*)\u06e6/g, "$1");
  out = out.replace(/\u06e6/g, "\u064a");
  out = out.replace(/\u0671/g, "\u0627"); // wasla → alif
  // B2 : wāw silencieux + dagger-alif → alif plein (حَيَوٰة → حَيَاة), AVANT la
  // règle générique dagger-alif (audit Phase 64, 184/0 régression).
  out = out.replace(/\u0648\u0670/g, "\u0627");
  out = out.replace(/\u0649\u0670/g, "\u0627"); // ىٰ (alif madda écrite sur ya) → alif
  out = out.replace(/\u0670/g, "\u0627"); // dagger-alif → alif
  out = out.replace(/\u0622/g, "\u0627"); // ālif madda
  out = out.replace(/\u0623/g, "\u0627"); // alif hamza
  out = out.replace(/\u0625/g, "\u0627"); // alif hamza bas
  out = out.replace(/\u0624/g, "\u0648"); // wāw hamza
  out = out.replace(/\u0626/g, "\u064a"); // yā' hamza
  out = out.replace(/\u0649/g, "\u064a"); // alif maqṣūra → yā'
  out = out.replace(/[\u06d6-\u06e5\u06e7-\u06ed]/g, ""); // signes coraniques restants (ۖ ۚ ۟ ۠ ۢ ۣ ۥ ۭ …)
  out = out.replace(/\u0653/g, "");
  out = out.replace(/\u0654/g, "");
  return [...out].filter((ch) => !HARAKAT.has(ch)).join("");
}

export type AlignmentStatus =
  | "EXACT"
  | "EXACT_ORTHOGRAPHIC"
  | "VARIANT_ORTHOGRAPHY_DOCUMENTED"
  | "AMBIGUOUS"
  | "MISSING"
  | "EXTRA";

/**
 * Classification d'alignement d'une paire (forme Hikma, forme MASAQ).
 * Deux niveaux : diacritiques retirés, puis normalisation orthographique.
 * Ne repose JAMAIS sur l'égalité de chaîne seule : la position est portée
 * par l'appelant (alignKey). Ici on ne classe que la correspondance de forme.
 */
export function classifyAlignment(
  hikmaForm: string,
  masaqForm: string
): AlignmentStatus {
  const strip = (s: string) =>
    [...(s ?? "")].filter((c) => !HARAKAT.has(c) && c !== TATWEEL).join("");
  const a = normalizeOrthographic(hikmaForm);
  const b = normalizeOrthographic(masaqForm);
  if (strip(hikmaForm) === strip(masaqForm)) return "EXACT";
  if (a === b) return "EXACT_ORTHOGRAPHIC";
  // variante documentée : alif élidé (ex. الرَّحْمَـن/الرَّحْمَن : MASAQ n'écrit
  // pas l'alif que Quran.com note en dagger-alif) — comparaison sans alif
  const noAlif = (s: string) => s.replace(/\u0627/g, "");
  if (noAlif(a) === noAlif(b) && noAlif(a) !== "") return "VARIANT_ORTHOGRAPHY_DOCUMENTED";
  // variante documentée : alif maqsura finale /aː/ écrite ىٰ (Hikma) ou ى
  // (MASAQ) — le rendu post-normalisation en ي masque la valeur d'alif.
  const finalAlif = (s: string) => normalizeOrthographic(s).replace(/\u064a/g, "\u0627");
  if (finalAlif(hikmaForm) === finalAlif(masaqForm) && finalAlif(hikmaForm) !== "")
    return "VARIANT_ORTHOGRAPHY_DOCUMENTED";
  // variante documentée : gémination écrite différemment (لِّ = ل+ل — shadda
  // d'assimilation parfois omise par MASAQ, ex. وَٱلَّيْلِ/وَاللَّيْلِ)
  const collapse = (s: string) => s.replace(/(.)\1+/g, "$1");
  if (collapse(a) === collapse(b) && collapse(a) !== "") return "VARIANT_ORTHOGRAPHY_DOCUMENTED";
  // variante documentée : hamza écrit comme signe (Hikma 0654/ء) vs lettre
  // (MASAQ أ/ئ/آ — ex. ءَامَنُوا/آمَنُوا, ٱلْأَفْـِٔدَةِ/الْأَفْئِدَةِ)
  const noHamza = (s: string) =>
    normalizeOrthographic(s.replace(/[\u0621\u0623\u0625\u0626]/g, ""));
  if (noHamza(hikmaForm) === noHamza(masaqForm) && noHamza(hikmaForm) !== "")
    return "VARIANT_ORTHOGRAPHY_DOCUMENTED";
  return "AMBIGUOUS";
}

/**
 * Clé d'alignement OBLIGATOIRE : (surah, ayah, position).
 * Jamais d'égalité de chaîne seule.
 */
export function alignKey(surah: number, ayah: number, position: number): string {
  return `${surah}:${ayah}:${position}`;
}

/** Classification des segments MASAQ (Morph_Type + Morph_Tag). */
export type SegmentKind =
  | "PARTICLE"
  | "ARTICLE"
  | "STEM"
  | "INFLECTIONAL_SUFFIX"
  | "PRONOMINAL_SUFFIX"
  | "OTHER";

export function classifySegment(morphType: string, morphTag: string): SegmentKind {
  if (morphType === "Stem") return "STEM";
  if (morphType === "Prefix") {
    if (morphTag === "DET") return "ARTICLE";
    if (["PREP", "CONJ", "NEG_PART", "IMPERF_PREF", "CV_PREF"].includes(morphTag))
      return "PARTICLE";
    return "OTHER";
  }
  if (morphType === "Suffix") {
    if (
      morphTag.startsWith("OBJ_PRON") ||
      morphTag.startsWith("PRON") ||
      morphTag.startsWith("POSS_PRON") ||
      morphTag === "SUBJ_PRON"
    )
      return "PRONOMINAL_SUFFIX";
    // CASE_DEF_* et CASE_INDEF_* (désinences flexionnelles).
    if (morphTag.startsWith("NSUFF") || morphTag.startsWith("CASE_"))
      return "INFLECTIONAL_SUFFIX";
    return "OTHER";
  }
  return "OTHER";
}

export type Align = AlignmentStatus; // alias rétro-compatible

export type LemmaMappingStatus =
  | "EXACT"
  | "PARTIAL"
  | "NORMALIZATION_DIFFERENCE"
  | "LEXICAL_LEVEL_DIFFERENCE"
  | "UNMAPPED"
  | "AMBIGUOUS";

function stripArticle(s: string): string {
  return s.replace(/^[\u0627\u0644]+/, "");
}

/**
 * Classification de la correspondance lemme Hikma (forme-surface) vs stem
 * MASAQ (lexical nu). Fidèle au tableau documenté Phase 24E (sur Al-Fātiḥah) :
 * y compris les cas « الله → له » (stem MASAQ sans alif d'attache) et
 * « الرَّحْمَـن → رحمن » (niveau lexical : nom propre avec article vs stem nu).
 * Ne crée JAMAIS de mapping — documente seulement.
 */
export function classifyLemmaMatch(
  hikmaLemma: string | null | undefined,
  masaqStem: string | null | undefined
): LemmaMappingStatus {
  if (!hikmaLemma) return "UNMAPPED";
  if (!masaqStem) return "UNMAPPED";
  const a = normalizeOrthographic(hikmaLemma);
  const b = normalizeOrthographic(masaqStem);
  if (a === b) return "EXACT";
  // الله / لله → له (MASAQ écrit le stem du nom divin sans alif d'attache)
  if (b === "\u0644\u0647" && (a === "\u0627\u0644\u0644\u0647" || a === "\u0644\u0644\u0647")) {
    return "NORMALIZATION_DIFFERENCE";
  }
  // alif élisé : بِسْم vs اسم (préfixe بِ inclus côté Hikma)
  if (a.startsWith("\u0628") && b.startsWith("\u0627")) return "NORMALIZATION_DIFFERENCE";
  const sa = stripArticle(a);
  if (sa === b || (b.startsWith(sa) && sa !== "") || (sa.startsWith(b) && b !== ""))
    return "PARTIAL"; // article/préfixe de surface retiré
  if (a.startsWith("\u0627\u0644") || b.startsWith("\u0627\u0644"))
    return "LEXICAL_LEVEL_DIFFERENCE";
  return "NORMALIZATION_DIFFERENCE";
}

/** Clé d'idempotence : source + enregistrement source (jamais chaîne arabe). */
export function idempotencyKey(sourceId: string, sourceRecordId: string): string {
  return `${sourceId}::${sourceRecordId}`;
}