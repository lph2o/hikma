// Normalisation technique d'une forme arabe → normalized_text.
//
// Phase 10 (Voie B) — normalized_text est une donnée DÉRIVÉE, purement
// technique. Elle sert à la recherche, la comparaison et le regroupement de
// formes. Elle ne constitue PAS une analyse linguistique : elle ne permet
// jamais, à elle seule, de déduire un lemme, une racine, une catégorie
// grammaticale, une traduction ou une identité lexicale définitive.
//
// Contrat :
//   - déterministe et IDEMPOTENTE : normalize(normalize(x)) === normalize(x) ;
//   - NON destructive : quran_words.arabic n'est jamais modifié, seule une
//     valeur dérivée est produite ;
//   - indépendante des traductions, du contexte, des gloses françaises et de
//     toute source morphologique.
//
// Trois niveaux à ne jamais confondre :
//   1. TEXTE ORIGINAL  : quran_words.arabic (jamais modifié) ;
//   2. NORMALISATION   : normalized_text (recherche / comparaison / regroupement) ;
//   3. ANALYSE MORPHO. : lemme / racine (source linguistique fiable, Phase 11+).

/**
 * Diacritiques phonétiques/grammaticaux (tashkīl) retirés :
 *   U+064B–U+0652 : fathatan, dammatan, kasratan, fatha, damma, kasra,
 *                   shadda, sukun ;
 *   U+0656–U+065E : voyelles auxiliaires rares.
 * Sont EXCLUS (donc conservés) : U+0653 madda, U+0654/U+0655 hamza sus/souscrite,
 * U+065F hamza ondulée. La hamza n'est pas normalisée ici : NFC la compose en
 * formes précomposées آ أ إ ؤ ئ qui restent distinctes.
 */
const HARAKAT = /[\u064B-\u0652\u0656-\u065E]/g;

/** Tatweel (kashida, U+0640) : allongement purement graphique, retiré. */
const TATWEEL = /\u0640/g;

/**
 * Annotations coraniques retirées :
 *   U+0610–U+061A : signes auxiliaires (petits) ;
 *   U+06D6–U+06ED : marques de pause (ۖ ۗ ۘ ۙ ۚ ۛ), lettres suscrites
 *                   (ۥ ۦ ۢ ۭ, etc.) et signes de récitation.
 */
const QURANIC_ANNOTATIONS = /[\u0610-\u061A\u06D6-\u06ED]/g;

/** Wâsla (U+0671) : alef élidé — ramené à l'alef canonique (U+0627). */
const WASLA = /\u0671/g;

/**
 * Alif suscrit (dagger alef, U+0670) : voyelle longue ā écrite en petit —
 * ramenée à l'alef canonique (U+0627), et NON supprimée. Ce choix regroupe les
 * orthographes رَحْمَـٰن (alif suscrit) et رَحْمَان (alef plein) tout en
 * préservant la distinction خَلَـٰق (ā) ≠ خَلَق (pas de ā).
 */
const DAGGER_ALEF = /\u0670/g;

/**
 * Normalise une forme arabe en représentation technique stable.
 *
 * Pipeline (ordre maîtrisé, chaque transformation documentée) :
 *   1. NFC (canonique, composée) — pas NFD (décompose la hamza), pas NFKC/NFKD
 *      (décompositions de compatibilité non maîtrisées) ;
 *   2. retrait du tashkīl (voyelles, tanwīn, shadda, sukūn) ;
 *   3. retrait du tatweel ;
 *   4. retrait des annotations coraniques (pauses, lettres suscrites, signes) ;
 *   5. wâsla → alef ; alif suscrit → alef (variantes d'alef uniquement) ;
 *   6. repli des espaces résiduels (artefacts des marques de pause retirées)
 *      puis trim — aucun espace légitime n'est supprimé, seuls les runs sont
 *      réduits à un espace unique.
 *
 * La hamza (ء أ إ ؤ ئ آ) est CONSERVÉE telle quelle : son unification est une
 * décision linguistique, hors du périmètre de la normalisation technique.
 */
export function normalizeWordText(input: string): string {
  return input
    .normalize("NFC")
    .replace(HARAKAT, "")
    .replace(TATWEEL, "")
    .replace(QURANIC_ANNOTATIONS, "")
    .replace(WASLA, "\u0627")
    .replace(DAGGER_ALEF, "\u0627")
    .replace(/\s+/g, " ")
    .trim();
}
