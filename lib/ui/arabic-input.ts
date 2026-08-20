// Aide à la SAISIE ARABE (Phase 24H-B) — fonctions PURES, sans React/DOM.
//
// Le clavier arabe virtuel (components/ui/arabic-keyboard.tsx) et l'input de
// rappel libre (RecallExercise) consomment ces primitives : insertion à la
// position du curseur et suppression arrière, testables sans navigateur.
// Aucune logique pédagogique ici — uniquement la manipulation de la chaîne.

/**
 * Lettres du clavier arabe virtuel Hikma (couche principale).
 * Ensemble minimal nécessaire aux réponses du curriculum (Al-Fatiha), sans
 * surcharger : 36 lettres, diacritiques sur une couche secondaire.
 */
export const ARABIC_KEYBOARD_LETTERS: readonly string[][] = [
  ["ا", "أ", "إ", "آ", "ء", "ؤ", "ئ"],
  ["ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز"],
  ["س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق"],
  ["ك", "ل", "م", "ن", "ه", "ة", "ى", "ي", "و"],
];

/** Diacritiques / marques utiles (couche secondaire, non affichée par défaut). */
export const ARABIC_KEYBOARD_DIACRITICS: readonly string[] = [
  "\u064E", // fatha
  "\u064F", // damma
  "\u0650", // kasra
  "\u0652", // sukun
  "\u0651", // shadda
  "\u064B", // fathatan
  "\u064C", // dammatan
  "\u064D", // kasratan
  "\u0670", // alif suscrit (dagger alef)
  "\u0671", // wasla
];

/** Largeur d'une lettre arabe en code units UTF-16 (BMP : toujours 1). */
function unitLength(text: string): number {
  return text.length;
}

/**
 * Insère `insert` dans `value` entre `start` et `end` (sélection éventuelle).
 * Retourne la nouvelle valeur et la position du curseur après insertion.
 */
export function insertTextAtCursor(
  value: string,
  start: number,
  end: number,
  insert: string,
): { value: string; caret: number } {
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));
  const next = value.slice(0, s) + insert + value.slice(e);
  return { value: next, caret: s + unitLength(insert) };
}

/**
 * Supprime en arrière (Backspace) : une sélection est d'abord supprimée en
 * bloc ; sinon un seul code unit est retiré avant le curseur.
 */
export function backspaceAtCursor(
  value: string,
  start: number,
  end: number,
): { value: string; caret: number } {
  const s = Math.max(0, Math.min(start, value.length));
  const e = Math.max(s, Math.min(end, value.length));

  if (e > s) {
    return { value: value.slice(0, s) + value.slice(e), caret: s };
  }
  if (s === 0) return { value, caret: 0 };
  return { value: value.slice(0, s - 1) + value.slice(s), caret: s - 1 };
}
