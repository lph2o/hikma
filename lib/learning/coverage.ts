// Métrique de couverture coranique (Phase 37A/37B).
//
// Définition validée (PHASE_37A_QURAN_COVERAGE_AUDIT.md) :
//   - unité : FORME (`quran_words`), jamais le lemme (الله ≠ لِلَّه, aucune fusion) ;
//   - « compris » : `user_word_progress.status ∈ {familiar, mastered}` (binaire) ;
//   - pondération : chaque forme comprise contribue de son nombre RÉEL
//     d'occurrences (`word_occurrences`) ;
//   - dénominateur : total des occurrences du corpus (depuis `word_occurrences`,
//     jamais hardcodé) ;
//   - résultat : entier 0..100 arrondi, présenté avec « ≈ » (estimation, pas
//     une mesure scientifique de compréhension).
//
// ⚠️ PRÉCISION SÉMANTIQUE (validée 37A) : ceci mesure une COUVERTURE LEXICALE
// pondérée par fréquence — la proportion des occurrences du texte correspondant
// à des formes comprises. Ce n'est PAS une mesure de compréhension syntaxique,
// phrastique, contextuelle ou sémantique.

/** Statuts de progression considérés comme « compris » pour la couverture. */
export const COMPREHENDED_STATUSES = ["familiar", "mastered"] as const;
export type ComprehendedStatus = (typeof COMPREHENDED_STATUSES)[number];

/**
 * Vrai si un statut de progression compte comme « compris ».
 * `new` (jamais vu) et `learning` (1er contact, corrects < 3) ne comptent PAS :
 * « vu ≠ compris ».
 */
export function isComprehendedStatus(status: string): boolean {
  return (COMPREHENDED_STATUSES as readonly string[]).includes(status);
}

/**
 * Somme des occurrences couvertes par des formes comprises (référence PURE de
 * la sélection effectuée côté base). Déterministe et indépendante de Supabase.
 *
 * - Seuls les statuts compris (`familiar` / `mastered`) sont sommés ;
 * - une forme comprise sans fréquence connue contribue 0 (défensif) ;
 * - `الله` et `لِلَّه` étant des `word_id` distincts, chacun ne contribue que
 *   de sa propre fréquence (aucune fusion morphologique).
 */
export function sumComprehendedOccurrences(
  statusByWordId: ReadonlyMap<string, string>,
  frequencyByWordId: ReadonlyMap<string, number>,
): number {
  let sum = 0;
  for (const [wordId, status] of statusByWordId) {
    if (!isComprehendedStatus(status)) continue;
    sum += frequencyByWordId.get(wordId) ?? 0;
  }
  return sum;
}

/**
 * Pourcentage de couverture (entier 0..100). Aucune division par zéro : un
 * corpus vide renvoie 0 (jamais NaN). Le résultat est borné et arrondi.
 */
export function computeCoveragePercent(
  coveredOccurrences: number,
  totalOccurrences: number,
): number {
  if (totalOccurrences <= 0) return 0;
  if (coveredOccurrences <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((coveredOccurrences / totalOccurrences) * 100)));
}
