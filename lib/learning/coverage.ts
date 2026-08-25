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

// ---------------------------------------------------------------------------
// Couverture par sourate (Phase 83B)
// ---------------------------------------------------------------------------

/** Couverture lexicale d'une sourate (dérivée, jamais persistée). */
export type SurahCoverage = {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  /** Nombre d'ayahs contenant au moins un mot compris. */
  coveredAyahs: number;
  /** Pourcentage entier 0..100 (arrondi). */
  coveragePercent: number;
};

// ---------------------------------------------------------------------------
// Couverture par ayah (Phase 84B)
// ---------------------------------------------------------------------------

/** Une occurrence dans un ayah, avec son statut utilisateur. */
export type AyahCoverageOccurrence = {
  occurrenceId: string;
  wordId: string;
  position: number;
  text: string;
  /** Statut dans user_word_progress, ou null si jamais vu. */
  status: "new" | "learning" | "familiar" | "mastered" | null;
  /** Niveau de maîtrise 0..1, ou null. */
  mastery: number | null;
  /** Vrai si le mot est « compris » (familiar | mastered). */
  isComprehended: boolean;
};

/** Couverture lexicale d'un ayah (dérivée, jamais persistée). */
export type AyahCoverage = {
  ayahId: string;
  ayahNumber: number;
  globalAyahNumber: number;
  textUthmani: string;
  translationFr: string | null;

  totalOccurrences: number;
  coveredOccurrences: number;
  coveragePercent: number;

  occurrences: AyahCoverageOccurrence[];
};

/**
 * Agrège des lignes brutes (occurrences + statuts) en AyahCoverage[] triés
 * par numéro de verset. Pure, sans I/O, testable isolément.
 */
export function computeAyahCoverages(
  rows: Array<{
    occurrenceId: string;
    ayahId: string;
    wordId: string;
    position: number;
    text: string;
    ayahNumber: number;
    globalAyahNumber: number;
    textUthmani: string;
    status: string | null;
    mastery: number | null;
    translationFr: string | null;
  }>,
): AyahCoverage[] {
  // Groupe par ayah.
  const byAyah = new Map<
    string,
    {
      ayahNumber: number;
      globalAyahNumber: number;
      textUthmani: string;
      translationFr: string | null;
      occs: Array<{
        occurrenceId: string;
        wordId: string;
        position: number;
        text: string;
        status: string | null;
        mastery: number | null;
      }>;
    }
  >();

  for (const r of rows) {
    let group = byAyah.get(r.ayahId);
    if (!group) {
      group = {
        ayahNumber: r.ayahNumber,
        globalAyahNumber: r.globalAyahNumber,
        textUthmani: r.textUthmani,
        translationFr: r.translationFr,
        occs: [],
      };
      byAyah.set(r.ayahId, group);
    }
    group.occs.push({
      occurrenceId: r.occurrenceId,
      wordId: r.wordId,
      position: r.position,
      text: r.text,
      status: r.status,
      mastery: r.mastery,
    });
  }

  const result: AyahCoverage[] = [];
  for (const [ayahId, group] of byAyah) {
    // Trie les occurrences par position.
    group.occs.sort((a, b) => a.position - b.position);

    const occurrences: AyahCoverageOccurrence[] = group.occs.map((o) => ({
      occurrenceId: o.occurrenceId,
      wordId: o.wordId,
      position: o.position,
      text: o.text,
      status: (o.status === "new" || o.status === "learning" || o.status === "familiar" || o.status === "mastered")
        ? o.status
        : null,
      mastery: o.mastery,
      isComprehended: isComprehendedStatus(o.status ?? ""),
    }));

    const totalOccurrences = occurrences.length;
    const coveredOccurrences = occurrences.filter((o) => o.isComprehended).length;

    result.push({
      ayahId,
      ayahNumber: group.ayahNumber,
      globalAyahNumber: group.globalAyahNumber,
      textUthmani: group.textUthmani,
      translationFr: group.translationFr,
      totalOccurrences,
      coveredOccurrences,
      coveragePercent: computeCoveragePercent(coveredOccurrences, totalOccurrences),
      occurrences,
    });
  }

  // Trie par numéro de verset.
  result.sort((a, b) => a.ayahNumber - b.ayahNumber);
  return result;
}

/**
 * Calcule la couverture par sourate à partir de données brutes déjà agrégées.
 * Pure, sans I/O, testable isolément.
 */
export function computeCoverageBySurah(
  rows: Array<{
    surah_number: number;
    name_translation: string | null;
    ayah_count: number;
    covered_ayahs: number;
  }>,
): SurahCoverage[] {
  return rows
    .map((r) => ({
      surahNumber: r.surah_number,
      surahName: r.name_translation ?? `Sourate ${r.surah_number}`,
      totalAyahs: r.ayah_count,
      coveredAyahs: r.covered_ayahs,
      coveragePercent: computeCoveragePercent(r.covered_ayahs, r.ayah_count),
    }))
    .filter((s) => s.coveredAyahs > 0)
    .sort((a, b) => a.surahNumber - b.surahNumber);
}
