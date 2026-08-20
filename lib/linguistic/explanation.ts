/**
 * Hikma — normalisation PÉDAGOGIQUE des données linguistiques MASAQ (Phase 24I).
 *
 * Séparation en trois couches (Phase 24H) :
 *   1. DONNÉES BRUTES      : `linguistic_occurrences` / `linguistic_segments`
 *                            (type `LinguisticEvidence`, lu read-only).
 *   2. NORMALISATION       : ce module — fonctions PURES transformant les
 *                            tags techniques en concepts pédagogiques français.
 *   3. PRÉSENTATION        : `HikmaExplanation` n'affiche QUE des textes
 *                            pédagogiques (jamais les tags MASAQ bruts).
 *
 * RÈGLE ABSOLUE : AVAILABLE ≠ INFERABLE.
 *   - donnée absente      → le bloc correspondant est OMIS (jamais inventé) ;
 *   - donnée ambiguë      → le bloc est OMIS (AMBIGUOUS_DATA, jamais affirmé) ;
 *   - donnée non vérifiée → le bloc est OMIS (UNVERIFIED_DATA).
 *
 * MASAQ est UNIQUEMENT une couche d'EXPLICATION : aucun impact sur le grading,
 * le SRS, la maîtrise, la progression, le curriculum, la résolution lexicale,
 * le word bank ni la génération des exercices.
 *
 * Anti-répétition : la fonction sélectionne au maximum 2 blocs pertinents
 * (PERTINENCE > QUANTITÉ), selon la chaîne de priorité :
 *   décomposition > morphologie > identité (POS) > syntaxe.
 */

import { type SegmentKind } from "./masaq";

// ---------------------------------------------------------------------------
// 1. DONNÉES BRUTES (lues depuis linguistic_occurrences / linguistic_segments)
// ---------------------------------------------------------------------------

export interface LinguisticEvidenceSegment {
  segmentNo: number;
  text: string;
  morphType: string;
  morphTag: string;
  kind: SegmentKind;
}

export interface LinguisticEvidence {
  surah: number;
  ayah: number;
  position: number;
  masaqWord: string;
  stem: string | null;
  glossEn: string | null;
  /** Morph_Tag agrégé (tags morphosyntaxiques MASAQ). */
  pos: string[];
  /** Case_Mood agrégé. */
  caseMood: string[];
  /** Syntactic_Role agrégé. */
  syntax: string[];
  segments: LinguisticEvidenceSegment[];
  /** Documentaire uniquement — ne crée JAMAIS de mapping. */
  lemmaMappingStatus: string | null;
}

// ---------------------------------------------------------------------------
// 2. NORMALISATION PÉDAGOGIQUE (sortie)
// ---------------------------------------------------------------------------

export interface PedagogicalSegment {
  text: string;
  /** Libellé pédagogique français (ex. « article défini »). */
  label: string;
  /** true pour un clitique attaché (jamais présenté comme un mot autonome). */
  isClitic: boolean;
}

export type LinguisticBlock =
  | { type: "decomposition"; segments: PedagogicalSegment[]; note: string | null }
  | { type: "identity"; category: string }
  | { type: "morphology"; caseText: string }
  | { type: "syntax"; roleText: string };

export type LinguisticExplanation = {
  availability: "partial" | "unavailable";
  /** Blocs sélectionnés (≤ 2), dans l'ordre d'affichage. */
  blocks: LinguisticBlock[];
};

export const NO_DECOMPOSITION = "NO_DECOMPOSITION";

// ---------------------------------------------------------------------------
// Tables de correspondance INTERNES (documentées, déterministes — jamais de
// traduction arbitraire d'un tag).
// ---------------------------------------------------------------------------

/** Textes de surface « vides » MASAQ = artefacts (jamais affichés, jamais une vraie segmentation). */
const NON_DISPLAYABLE_SEGMENT_TEXTS = new Set(["(null)", "None", "null", "none", ""]);

/**
 * Un segment n'est affichable QUE s'il porte une forme visible et signifiante.
 * Les marqueurs i3rab vides de MASAQ (`Other_i3rab` / `Morph_Tag="None"`) et les
 * désinences sans forme visible (`(null)`) sont exclus (AVAILABLE ≠ INFERABLE).
 */
export function isDisplayableSegment(seg: LinguisticEvidenceSegment): boolean {
  if (seg.morphType === "Other_i3rab") return false;
  if (seg.morphTag === "None") return false;
  const text = (seg.text ?? "").trim();
  return !NON_DISPLAYABLE_SEGMENT_TEXTS.has(text);
}

/** Libellé d'un segment selon son type morphologique et son tag. */
export function segmentLabel(morphType: string, morphTag: string, kind: SegmentKind): string {
  if (kind === "STEM") {
    if (morphTag === "PREP") return "préposition";
    if (morphTag === "NEG_PART") return "particule de négation";
    if (morphTag === "JUSSIVE_PART") return "particule du jussif (لَمْ)";
    if (morphTag === "ANNUL_PART" || morphTag === "INF_ANNUL_PART")
      return "particule d'insistance (إنّ)";
    if (morphTag === "PRON") return "pronom";
    if (morphTag === "REL_PRON") return "pronom relatif";
    if (morphTag === "NOUN_NUM") return "nom (numéral)";
    if (morphTag === "ADJ_COMP") return "adjectif (comparatif)";
    if (morphTag === "ADJ_INTENS") return "adjectif (intensif)";
    if (morphTag === "ADV") return "adverbe";
    if (morphTag === "IV_PASS" || morphTag === "PV_PASS") return "verbe passif";
    return "noyau (mot de base)";
  }
  if (kind === "ARTICLE") return "article défini";
  if (kind === "PARTICLE") {
    if (morphTag === "PREP") return "préposition";
    if (morphTag === "CONJ") return "conjonction";
    if (morphTag === "IMPERF_PREF") return "préfixe de l'inaccompli";
    if (morphTag === "CV_PREF") return "préfixe de l'impératif";
    if (morphTag === "NEG_PART") return "particule de négation";
    return "particule";
  }
  if (kind === "PRONOMINAL_SUFFIX") {
    if (morphTag === "POSS_PRON") return "suffixe possessif";
    if (morphTag === "SUBJ_PRON") return "suffixe sujet";
    if (morphTag === "OBJ_PRON") return "suffixe complément";
    return "suffixe pronominal";
  }
  if (kind === "INFLECTIONAL_SUFFIX") {
    if (morphTag === "NSUFF_FEM_PL") return "marque du féminin pluriel";
    if (morphTag === "NSUFF_FEM_SG") return "marque du féminin singulier";
    if (morphTag === "CASE_INDEF_(ACC_GEN)") return "désinence indéfinie (accusatif/génitif)";
    return "marque du pluriel / désinence";
  }
  if (kind === "OTHER") return "suffixe";
  return "segment";
}

/** Catégorie grammaticale du NOYAU (stem), en français pédagogique. */
export function categoryFromStemTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  if (tag === "GERUND") return "un nom verbal (maṣdar)";
  if (tag === "NOUN_PROP") return "un nom propre (nom divin)";
  if (tag === "NOUN_ACTIVE_PART") return "un nom (participe actif)";
  if (tag === "NOUN_PASSIVE_PART") return "un nom (participe passif)";
  if (tag === "NOUN_NUM") return "un nom (numéral)";
  if (/^NOUN_/.test(tag)) return "un nom";
  if (tag === "ADJ_COMP") return "un adjectif (comparatif)";
  if (tag === "ADJ_INTENS") return "un adjectif (intensif)";
  if (tag === "ADV") return "un adverbe";
  if (tag === "PV") return "un verbe à l'accompli";
  if (tag === "IV") return "un verbe à l'inaccompli";
  if (tag === "CV") return "un verbe à l'impératif";
  if (tag === "IV_PASS") return "un verbe passif (inaccompli)";
  if (tag === "PV_PASS") return "un verbe passif (accompli)";
  if (tag === "REL_PRON") return "un pronom relatif";
  if (tag === "PRON") return "un pronom";
  // PREP / NEG_PART / JUSSIVE_PART / ANNUL_PART : particules déjà couvertes par
  // le libellé de décomposition → pas de bloc identité séparé (anti-redondance).
  return null;
}

/** Cas (Case_Mood) du NOYAU : on retire INVARIABLE (propre aux particules). */
export function caseFromCaseMood(caseMood: string[]): string | null {
  if (caseMood.length === 0) return null;
  const real = caseMood.filter((c) => c !== "INVARIABLE");
  if (real.length === 1) return real[0]!;
  if (real.length === 0 && caseMood.every((c) => c === "INVARIABLE")) return "INVARIABLE";
  // Plusieurs cas non-invariables → AMBIGUOUS_DATA (jamais affirmé).
  return null;
}

/**
 * Formulation pédagogique d'un cas OU d'un mode (le champ MASAQ `Case_Mood`
 * agrège les deux). JUSSIVE est un MODE verbal (après لَمْ), jamais un cas.
 */
export function caseText(caseValue: string): string | null {
  switch (caseValue) {
    case "NOMINATIVE":
      return "au nominatif (fonction sujet)";
    case "ACCUSATIVE":
      return "à l'accusatif (complément)";
    case "GENITIVE":
      return "au génitif (complément du nom ou après préposition)";
    case "JUSSIVE":
      return "au jussif (mode verbal, après لَمْ)";
    case "INVARIABLE":
      return "invariable";
    default:
      return null;
  }
}

// Rôles « fonctionnels » (particules / verbes) qui ne décrivent pas la fonction
// d'un NOM : filtrés du bloc syntaxe (jamais affichés comme « rôle du mot »).
const FUNCTIONAL_ROLES = new Set([
  "PREP",
  "CONJ",
  "CV",
  "IV",
  "NON_INFLECT",
  "ANNUL_PART",
  "PART_JUSSIVE",
  "JUSSIVE_PART",
  "IV_COP",
  "IV_PASS",
  "PV_PASS",
]);

/** Rôle syntaxique du NOYAU (on retire les rôles de particules/verbes). */
export function roleFromSyntax(syntax: string[]): string | null {
  const lexical = syntax.filter((s) => !FUNCTIONAL_ROLES.has(s));
  if (lexical.length !== 1) return null; // 0 ou plusieurs → absent/ambigu.
  const role = lexical[0]!;
  const map: Record<string, string> = {
    SUBJ: "sujet",
    SUBJ_COP_PART: "sujet",
    SUBJ_COP_V: "sujet",
    OBJ: "complément d'objet",
    PREP_OBJ: "complément de préposition",
    ADJ: "qualificatif (épithète)",
    APPOS: "apposition",
    GEN_CONS: "complément du nom (annexion)",
    AGNT: "agent",
    CONJ_N: "coordonné",
    PRED: "prédicat",
    PART_COP_PRED: "prédicat",
    V_COP_PRED: "prédicat",
    EXPLET: "pronom de renforcement",
    ADV_TIME: "complément de temps",
  };
  return map[role] ?? null;
}

interface CandidateBlocks {
  decomposition: LinguisticBlock | null;
  identity: LinguisticBlock | null;
  morphology: LinguisticBlock | null;
  syntax: LinguisticBlock | null;
}

function buildCandidates(evidence: LinguisticEvidence): CandidateBlocks {
  const segments = evidence.segments ?? [];
  const stemSeg = segments.find((s) => s.morphType === "Stem") ?? null;
  const stemTag = stemSeg?.morphTag ?? null;

  // Décomposition : segments réellement affichables (jamais « (null) », « None »
  // ou marqueurs i3rab vides), avec au moins un noyau + un clitique réel.
  const visible = segments.filter(isDisplayableSegment);
  const hasClitic = visible.some((s) => s.kind !== "STEM");
  const hasStem = visible.some((s) => s.kind === "STEM");
  const decomposition: LinguisticBlock | null =
    visible.length >= 2 && hasClitic && hasStem
      ? {
          type: "decomposition",
          segments: visible.map((s) => ({
            text: s.text,
            label: segmentLabel(s.morphType, s.morphTag, s.kind),
            isClitic: s.kind !== "STEM",
          })),
          note: "Ces éléments sont attachés : ce ne sont pas des mots séparés.",
        }
      : null;

  const identity: LinguisticBlock | null = (() => {
    const category = categoryFromStemTag(stemTag);
    return category ? { type: "identity", category } : null;
  })();

  const morphology: LinguisticBlock | null = (() => {
    const value = caseFromCaseMood(evidence.caseMood ?? []);
    const text = value ? caseText(value) : null;
    return text ? { type: "morphology", caseText: text } : null;
  })();

  const syntax: LinguisticBlock | null = (() => {
    const role = roleFromSyntax(evidence.syntax ?? []);
    return role ? { type: "syntax", roleText: role } : null;
  })();

  return { decomposition, identity, morphology, syntax };
}

/**
 * Priorité de sélection (anti-répétition, PERTINENCE > QUANTITÉ) :
 * la décomposition (clitiques) d'abord, sinon la catégorie (identité), sinon
 * la forme (morphologie), sinon la fonction (syntaxe). Pour un mot simple, la
 * catégorie est plus utile que le cas (cf. exemple 24I/24H : « c'est un nom,
 * au génitif »).
 */
const PRIMARY_ORDER: Array<keyof CandidateBlocks> = [
  "decomposition",
  "identity",
  "morphology",
  "syntax",
];

/** Bloc de soutien préféré pour chaque bloc primaire (complémentarité). */
const SUPPORT_PREFERENCE: Record<keyof CandidateBlocks, Array<keyof CandidateBlocks>> = {
  decomposition: ["identity", "morphology", "syntax"],
  identity: ["morphology", "syntax"],
  morphology: ["syntax"],
  syntax: ["identity", "morphology"],
};

/**
 * Construit l'explication linguistique pédagogique à partir des données brutes.
 * Sélectionne le bloc primaire (chaîne de priorité) puis, au plus, UN bloc de
 * soutien complémentaire. Retourne `null` quand aucune donnée n'est exploitable
 * (l'appelant conserve alors l'explication classique).
 */
export function buildLinguisticExplanation(
  evidence: LinguisticEvidence | null | undefined,
): LinguisticExplanation | null {
  if (!evidence) return null;
  const candidates = buildCandidates(evidence);

  const primaryKey = PRIMARY_ORDER.find((k) => candidates[k] != null);
  if (!primaryKey) return null;

  const blocks: LinguisticBlock[] = [candidates[primaryKey]!];
  const supportKey = SUPPORT_PREFERENCE[primaryKey].find((k) => candidates[k] != null);
  if (supportKey) blocks.push(candidates[supportKey]!);

  return { availability: "partial", blocks };
}
