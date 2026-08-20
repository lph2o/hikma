// Notation machine du RAPPEL libre (Phase 23F-B / 24H-B) — fonctions PURES, sans I/O.
//
// La réponse libre de l'utilisateur est normalisée de façon CONTRÔLÉE puis
// comparée à la forme attendue. `gradeFreeResponse()` est la SOURCE UNIQUE de
// vérité : l'UI, le feedback, la progression, la maîtrise et la rétention
// consomment TOUS le même verdict, jamais un recalcul indépendant.
//
// Le verdict distingue trois issues :
//
//   CORRECT    — même intention de réponse : équivalence exacte, variante
//                d'écriture autorisée (arabe : dagger alef / wasla → alef ;
//                français : ordre de synonymes, accents), ou forme clavier
//                non vocalisée ;
//   INCORRECT  — ne correspond pas (mot/sens réellement différent) ;
//   AMBIGUOUS  — même forme non vocalisée, mais l'utilisateur a fourni une
//                vocalisation DIFFÉRENTE (homographe possible : عَبَدَ vs عَبْد).
//
// Règle de non-contamination : la comparaison se fait TOUJOURS contre la forme
// du mot ciblé (word_id), jamais contre un dictionnaire global. Une forme
// vocalisée différente n'est jamais acceptée comme CORRECT (AMBIGUOUS au mieux),
// ce qui protège عَبَدَ ≠ عَبْد et دِين ≠ دَيْن ; ضَالّ ≠ ظِلّ diffère déjà par
// sa consonne (ض vs ظ) et tombe en INCORRECT.
//
// Phase 24H-B : la normalisation arabe de grading est alignée sur la couche
// données `normalizeWordText` (dagger alef U+0670 et wasla U+0671 → alef U+0627)
// afin que مَـٰلِكِ et مَالِكِ soient reconnues comme la même forme, sans jamais
// fusionner مَالِكِ (mālik) et مَلِكِ (malik) — l'alef reste une lettre réelle.

import { normalizeWordText } from "@/lib/quran/normalize-text";

export type RecallGrade = "CORRECT" | "INCORRECT" | "AMBIGUOUS";

/** Langue d'une réponse libre. */
export type GradeLanguage = "fr" | "ar";

/** Résultat complet d'une notation libre (verdict + éléments normalisés). */
export type GradeResult = {
  verdict: RecallGrade;
  normalizedInput: string;
  normalizedExpected: string;
  /** Variante acceptée qui a correspondu (français). */
  matchedVariant?: string;
  /** Raison interne (diagnostic, jamais affichée telle quelle). */
  reason?: string;
};

/* ------------------------------------------------------------------ */
/* ARABE                                                               */
/* ------------------------------------------------------------------ */

/** Tatweel (allongement de présentation) — purement décoratif. */
const TATWEEL_RE = /\u0640/g;

/** Annotations coraniques (pauses, lettres suscrites, signes). */
const QURANIC_ANNOTATIONS_RE = /[\u0610-\u061A\u06D6-\u06ED]/g;

/** Wâsla (U+0671) → alef canonique (U+0627). */
const WASLA_RE = /\u0671/g;

/** Alif suscrit (dagger alef, U+0670) → alef canonique (U+0627). */
const DAGGER_ALEF_RE = /\u0670/g;

/**
 * Marques vocaliques (tashkīl) : voyelles, tanwīn, shadda, sukūn.
 * SANS drapeau `g` : utilisée uniquement par `hasTashkeel` via `test()`, dont
 * le résultat doit être DÉTERMINISTE (un regex `g` est étatique via lastIndex).
 */
const HARAKAT_RE = /[\u064B-\u0652\u0656-\u065E]/;

/**
 * Normalise la PRÉSENTATION d'un texte arabe (jamais le lexique) : NFC +
 * tatweel + annotations coraniques + espaces. Les voyelles et les lettres
 * (y compris hamza) sont CONSERVÉES.
 */
export function normalizeArabicPresentation(input: string): string {
  return input
    .normalize("NFC")
    .replace(TATWEEL_RE, "")
    .replace(QURANIC_ANNOTATIONS_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalise une forme arabe pour le GRADING : mêmes variantes d'alef que la
 * couche données (wâsla et alif suscrit → alef) mais CONSERVE les voyelles.
 * Cela permet de reconnaître مَـٰلِكِ == مَالِكِ (mêmes voyelles, alef écrit
 * différemment) tout en distinguant مَالِكِ ≠ مَلِكِ (alef = lettre réelle).
 */
export function normalizeArabicGrading(input: string): string {
  return normalizeArabicPresentation(input)
    .replace(WASLA_RE, "\u0627")
    .replace(DAGGER_ALEF_RE, "\u0627");
}

/**
 * Forme « clavier » non vocalisée (bare form) : délègue à la normalisation
 * canonique de la couche données, qui retire le tashkīl et ramène les variantes
 * d'alef (wâsla / alif suscrit) à l'alef — cohérent, jamais destructif.
 */
export function stripTashkeel(input: string): string {
  return normalizeWordText(input);
}

/** Vrai si le texte porte au moins une marque vocalique explicite (tashkīl). */
export function hasTashkeel(input: string): boolean {
  return HARAKAT_RE.test(input);
}

/** Note une réponse arabe libre contre la forme attendue (word_id ciblé). */
export function gradeArabicResponse(input: string, expectedArabic: string): GradeResult {
  const user = normalizeArabicGrading(input);
  const expected = normalizeArabicGrading(expectedArabic);

  // 1. Équivalence exacte OU simple variante d'alef (dagger/wasla → alef) :
  //    même voyelles, même squelette consonantique → CORRECT.
  if (user === expected) {
    return {
      verdict: "CORRECT",
      normalizedInput: user,
      normalizedExpected: expected,
      reason: "exact_or_alef_variant",
    };
  }

  // 2. Même forme non vocalisée :
  //    - sans diacritiques saisies (clavier) → CORRECT ;
  //    - avec une vocalisation différente → AMBIGUOUS (homographe possible) ;
  const userBare = stripTashkeel(input);
  const expectedBare = stripTashkeel(expectedArabic);
  if (userBare === expectedBare) {
    return hasTashkeel(input)
      ? {
          verdict: "AMBIGUOUS",
          normalizedInput: user,
          normalizedExpected: expected,
          reason: "same_bare_different_vocalization",
        }
      : {
          verdict: "CORRECT",
          normalizedInput: user,
          normalizedExpected: expected,
          reason: "keyboard_unvocalized",
        };
  }

  // 3. Lexème réellement différent (consonne ou alef plein vs absent).
  return {
    verdict: "INCORRECT",
    normalizedInput: user,
    normalizedExpected: expected,
    reason: "different_lexeme",
  };
}

/** Wrapper compatible (verdict seul) de la notation arabe. */
export function gradeArabicInput(input: string, expectedArabic: string): RecallGrade {
  return gradeArabicResponse(input, expectedArabic).verdict;
}

/* ------------------------------------------------------------------ */
/* FRANÇAIS                                                            */
/* ------------------------------------------------------------------ */

/**
 * Séparateurs de synonymes reconnus dans une glose validée. Une glose de type
 * synonym_list (« souverain / maître ») est un ENSEMBLE ordonnable ; les unités
 * elles-mêmes (termes ou phrases) conservent leur structure interne.
 */
const FR_SYNONYM_SEPARATOR_RE = /[/·|]/;

/**
 * Normalise une réponse française : casse, accents, apostrophes, guillemets,
 * ponctuation terminale, espaces — puis canonise les séparateurs de synonymes
 * (`/`, `·`, `|`, `,`) vers `/`. Les phrases conservent leurs espaces internes
 * (jamais découpées en mots).
 */
export function normalizeFrench(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u00AB\u00BB\u201C\u201D]/g, '"')
    .replace(/[.!?;:()]/g, "")
    .replace(/[·|,]/g, "/")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

/** Découpe une glose normalisée en unités sémantiques (sur les synonymes). */
function frenchUnits(normalized: string): string[] {
  return normalized
    .split(FR_SYNONYM_SEPARATOR_RE)
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

/**
 * Égalité d'ENSEMBLE d'unités sémantiques (ordre indépendant, doublons
 * ignorés). Les unités sont comparées exactement : « roi » n'est jamais
 * accepté pour « souverain / maître », et l'ordre interne d'une phrase
 * (« nous adorons » vs « adorons nous ») reste significatif.
 */
function sameUnitSet(a: string[], b: string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size !== setB.size) return false;
  for (const unit of setA) if (!setB.has(unit)) return false;
  return true;
}

/**
 * Note une réponse française libre contre la liste des formulations acceptées
 * (glose validée + variantes éditoriales explicites). Pas de fuzzy matching :
 * seuls les synonymes présents dans les variantes validées sont acceptés. Le
 * français n'a pas d'homographe : pas d'issue AMBIGUOUS (réservée à l'arabe).
 */
export function gradeFrenchResponse(
  input: string,
  accepted: readonly string[],
): GradeResult {
  const user = normalizeFrench(input);
  if (user === "") {
    return {
      verdict: "INCORRECT",
      normalizedInput: user,
      normalizedExpected: "",
      reason: "empty_input",
    };
  }

  const userUnits = frenchUnits(user);
  for (const variant of accepted) {
    const normalized = normalizeFrench(variant);
    if (normalized === "") continue;
    if (sameUnitSet(userUnits, frenchUnits(normalized))) {
      return {
        verdict: "CORRECT",
        normalizedInput: user,
        normalizedExpected: normalized,
        matchedVariant: variant,
        reason: "semantic_match",
      };
    }
  }

  return {
    verdict: "INCORRECT",
    normalizedInput: user,
    normalizedExpected: accepted.map(normalizeFrench).filter(Boolean).join(" | "),
    reason: "no_match",
  };
}

/** Wrapper compatible (verdict seul) de la notation française. */
export function gradeFrenchInput(input: string, accepted: readonly string[]): RecallGrade {
  return gradeFrenchResponse(input, accepted).verdict;
}

/* ------------------------------------------------------------------ */
/* SOURCE UNIQUE DE VÉRITÉ                                             */
/* ------------------------------------------------------------------ */

/**
 * Note une réponse libre dans une langue donnée. Utilisée par `validateAnswer`
 * (le moteur) puis consommée par le feedback, la progression, la maîtrise et la
 * rétention — aucun appelant ne recalcule le verdict.
 */
export function gradeFreeResponse(opts: {
  language: GradeLanguage;
  userInput: string;
  expectedAnswer: string;
  /** Formulations françaises acceptées (FORM_TO_MEANING). */
  variants?: readonly string[];
}): GradeResult {
  if (opts.language === "ar") {
    return gradeArabicResponse(opts.userInput, opts.expectedAnswer);
  }
  const accepted =
    opts.variants && opts.variants.length > 0
      ? opts.variants
      : [opts.expectedAnswer];
  return gradeFrenchResponse(opts.userInput, accepted);
}
