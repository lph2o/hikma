// Hikma — résolution des EXPLICATIONS PÉDAGOGIQUES DE SENS (Phase 44B).
//
// Fonctions PURES (aucune I/O) : la couche DB est lue en amont
// (`getValidatedWordExplanations` / `getValidatedWordExplanationContexts`) et
// cette résolution applique UNIQUEMENT la règle éditoriale :
//   contexte couvert (surah:ayah)  → override contextuel ;
//   sinon                          → explication générique ;
//   sinon                          → null (absence légitime, jamais fabriquée).
//
// Aucune inférence, aucun impact sur le resolver de traduction (FORME > LEMME >
// EN), le SRS, la mastery, le coverage, le curriculum ni les exercices.

import type { WordSenseExplanation } from "./queries";

export type WordContextRef = {
  surahNumber: number;
  ayahNumber: number;
};

/**
 * Résout l'explication de sens d'une forme pour un contexte donné.
 *
 * @param generic explication générique validée (null/undefined = aucune).
 * @param contexts overrides contextuels validés, indexés "surah:ayah".
 * @param context contexte réel de l'occurrence (null/absent = générique).
 * @returns texte à afficher, ou null si aucune explication n'existe.
 */
export function resolveSenseExplanation(
  generic: WordSenseExplanation | null | undefined,
  contexts: ReadonlyMap<string, string> | null | undefined,
  context: WordContextRef | null | undefined,
): string | null {
  if (!generic) return null;
  if (context && contexts) {
    const contextual = contexts.get(`${context.surahNumber}:${context.ayahNumber}`);
    if (contextual) return contextual;
  }
  return generic.text;
}
