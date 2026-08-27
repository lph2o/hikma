// Sélection de la langue pédagogique (Phase 5 — correction langue).
//
// Hikma cible le FRANÇAIS comme langue pédagogique par défaut.
//
// Constat (audit Phase 5) : les sens mot-à-mot stockés dans
// `quran_words.meaning` proviennent de Quran.com (word-by-word ANGLAS) —
// il n'existe PAS encore de sens mot-à-mot français dans les données
// (documenté, jamais inventé). Les traductions françaises réelles (Hamidullah)
// n'existent qu'au niveau du VERSET, dans la table `translations`.
//
// Ce module est le POINT UNIQUE de sélection de la langue : ni l'Exercise
// Engine, ni les composants UI ne choisissent la langue. Quand des données
// mot-à-mot françaises seront importées (Phase dédiée aux données lexicales),
// la couche repository fournira `{ fr, en }` et le résolveur basculera
// automatiquement.
//
// ⚠️ DISTINCTION SÉMANTIQUE À PRÉSERVER (validée Phase 5) :
//
// La traduction française (Hamidullah) disponible dans `translations` est une
// traduction de VERSET. Elle est exposée comme CONTEXTE / SENS DU VERSET
// (type `LessonAyahContext`, requête `getLessonAyahContext`), jamais comme une
// donnée lexicale française du token arabe étudié. Exemple : « Le Tout
// Miséricordieux » extrait du verset 1:3 traduit le VERSET, pas le mot
// `الرَّحْمَٰنُ` pris isolément — les deux peuvent coïncider, mais ce sont
// deux notions distinctes.
//
// En conséquence :
// - `resolveWordMeaning`/`resolveQuranWordMeaning` NE RETOURNENT QUE des sens
//   mot-à-mot réellement stockés (actuellement l'anglais Quran.com, marqué
//   `isFallback` puisque la langue pédagogique est `fr`) ;
// - le français n'entre dans l'UI que par le canal verset (contexte) ;
// - NE PAS faire remonter le texte du verset comme `meaning` d'un mot :
//   l'import d'un véritable lexique français mot-à-mot est une phase ultérieure
//   dédiée aux données lexicales.

import type { QuranWord } from "@/types/quran";

/** Langue pédagogique par défaut de Hikma. */
export const PEDAGOGICAL_LANGUAGE = "fr" as const;

/** Source de la traduction Hikma (provenance, lue depuis `sources`). */
export type TranslationSource = {
  name: string | null;
};

/** Sens d'un mot pour la langue pédagogique. */
export type WordMeaning = {
  /** Texte du sens (null si aucune donnée exploitable). */
  text: string | null;
  /** Langue réelle du texte retourné ("fr", "en", …). */
  language: string;
  /**
   * true si la langue pédagogique est indisponible dans les données et que le
   * texte est un repli documenté — le texte n'est alors JAMAIS présenté comme
   * étant dans la langue pédagogique.
   */
  isFallback: boolean;
  /** Provenance de la traduction (ex. « Hikma — lexique éditorial »), si connue. */
  translationSource?: string | null;
  /** true si la traduction retenue est une traduction Hikma validée. */
  isValidated?: boolean;
};

/**
 * Traduction lexicale française validée d'un mot (sortie de getValidatedFrenchMeanings).
 *
 * TASK A1 (Phase A — Content Studio API) : champ ADDITIF et OPTIONNEL
 * `sourceRowId` — l'id de la ligne RÉELLEMENT retenue (`word_translations.id`
 * ou `lemma_translations.id`). Aucun filtre, ordre, précédence ou comportement
 * de résolution n'est modifié : seuls les `.select()` resolver ont été étendus.
 * Les fixtures historiques sans ce champ restent compatibles (champ omis).
 */
export type FrenchLexicalMeaning = {
  text: string;
  source: TranslationSource | null;
  validated: boolean;
  validatedAt: string | null;
  /** id de la ligne DB gagnante (TASK A1). Absent dans les fixtures legacy. */
  sourceRowId?: string;
};

/**
 * Résout le sens d'un mot pour une langue cible à partir des sens réellement
 * disponibles (`available[lang]`). Règles :
 * 1. sens dans la langue demandée → choisi, sans repli ;
 * 2. sinon → meilleure donnée existante (première langue non vide), repli marqué ;
 * 3. aucune donnée → null.
 * Aucune traduction n'est inventée ici.
 */
export function resolveWordMeaning(
  available: Record<string, string | null | undefined>,
  language: string = PEDAGOGICAL_LANGUAGE,
): WordMeaning {
  const requested = available[language];
  if (requested != null && requested !== "") {
    return { text: requested, language, isFallback: false };
  }
  for (const [lang, text] of Object.entries(available)) {
    if (text != null && text !== "") {
      return { text, language: lang, isFallback: true };
    }
  }
  return { text: null, language, isFallback: true };
}

/** Résout le sens d'un mot coranique pour la langue pédagogique (données actuelles). */
export function resolveQuranWordMeaning(
  word: Pick<QuranWord, "meaning">,
): WordMeaning {
  // Les données actuelles ne portent qu'un sens mot-à-mot (anglais, source
  // Quran.com) : transmis via `en` ; le résolveur gérera `fr` dès l'import.
  return resolveWordMeaning({ en: word.meaning });
}

/**
 * Résout le sens d'un mot pour la langue pédagogique en combinant le lexique
 * Hikma (français VALIDÉ) et la gloss anglaise existante (`quran_words.meaning`).
 *
 * Règles (Phase 7, Voie B) :
 *   CAS 1 — FR validé disponible  → traduction principale (fr, isFallback=false,
 *                                   translationSource, isValidated=true) ;
 *   CAS 2 — FR absent             → fallback EN explicite (isFallback=true) ;
 *   CAS 3 — FR proposé uniquement → IGNORÉ (jamais passé dans `available.fr`),
 *                                   fallback EN ;
 *   CAS 4 — aucun FR ni EN        → text = null.
 *
 * Le français PROPOSÉ n'entre jamais dans ce résolveur : il est filtré en
 * amont (getValidatedFrenchMeanings ne retourne que is_validated=true).
 *
 * ⚠️ Règle technique de résolution multi-sources : si plusieurs traductions
 * FR validées existent, la plus récente (updated_at DESC) est retenue. Cette
 * règle est purement technique — elle ne signifie PAS que la plus récente est
 * éditorialement la meilleure.
 */
export function resolveWordMeanings(
  word: Pick<QuranWord, "meaning">,
  french: FrenchLexicalMeaning | undefined,
  lemmaFrench?: FrenchLexicalMeaning | undefined,
): WordMeaning {
  // Le FR proposé (non validé) est invisible ici : `french` / `lemmaFrench` ne
  // sont renseignés que si la requête a retourné une ligne is_validated=true.
  //
  // Précédence (Phase 17C, Option B) :
  //   glose FORME  (word_translations)  → prioritaire ;
  //   sinon glose LEMME (lemma_translations) ;
  //   sinon fallback EN existant (quran_words.meaning).
  const chosen =
    french?.validated && french.text
      ? french
      : lemmaFrench?.validated && lemmaFrench.text
        ? lemmaFrench
        : undefined;

  const available: Record<string, string | null | undefined> = { en: word.meaning };
  if (chosen) {
    available.fr = chosen.text;
  }
  const resolved = resolveWordMeaning(available);
  if (chosen && resolved.language === "fr") {
    return {
      ...resolved,
      translationSource: chosen.source?.name ?? null,
      isValidated: true,
    };
  }
  return resolved;
}
