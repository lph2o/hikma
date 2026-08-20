// Planification PURE de l'import audio WBW Hugging Face (Phase 22D).
//
// Aucune écriture, aucune E/S : fonctions déterministes, testables.
// Le mapping est EXCLUSIVEMENT positionnel :
//
//   SURAH + AYAH + WORD_POSITION  →  word_occurrences  →  word_id
//
// Aucun fuzzy matching, aucun `normalized_text`, aucune déduction de lemma.
// La déduplication est par FORME (word_id) + STYLE : le dataset HF est
// par-OCCURRENCE, mais la table `word_audio` est par-FORME (UNIQUE(word_id,
// recitation_id)). On conserve UN fichier représentatif par (word_id, style).

import { occurrenceKey, parseWbwFilename, type WbwStyle } from "./wbw-filename";

/** Fichier WBW listé, déjà parsé. */
export type WbwFileEntry = {
  path: string;
  style: WbwStyle;
  surah: number;
  ayah: number;
  word: number;
};

/** Ligne `word_audio` planifiée (dédupliquée par word_id + style). */
export type PlannedWbwAudio = {
  word_id: string;
  style: WbwStyle;
  /** Chemin source HF représentatif (le premier, par ordre lexicographique). */
  source_path: string;
  /** Clé positionnelle `surah_ayah_word` d'origine (traçabilité). */
  occurrence_key: string;
};

export type OccurrenceIndex = Map<string, string>;

/**
 * Construit l'index déterministe `occurrenceKey(surah, ayah, position)` → word_id
 * à partir des tables Hikma (surahs → ayahs → word_occurrences).
 * Les ayahs dont la sourate est introuvable sont ignorées (ne devrait pas arriver).
 */
export function buildOccurrenceIndex(
  surahs: Array<{ id: string; number: number }>,
  ayahs: Array<{ id: string; surah_id: string; ayah_number: number }>,
  occurrences: Array<{ ayah_id: string; position: number; word_id: string }>,
): OccurrenceIndex {
  const surahIdToNumber = new Map(surahs.map((s) => [s.id, s.number]));
  const ayahInfo = new Map(
    ayahs.map((a) => [
      a.id,
      { surah: surahIdToNumber.get(a.surah_id) ?? -1, ayah: a.ayah_number },
    ]),
  );
  const index: OccurrenceIndex = new Map();
  for (const o of occurrences) {
    const info = ayahInfo.get(o.ayah_id);
    if (!info || info.surah <= 0 || info.ayah <= 0 || o.position <= 0) continue;
    index.set(occurrenceKey(info.surah, info.ayah, o.position), o.word_id);
  }
  return index;
}

export type WbwImportPlan = {
  /** Lignes à importer, dédupliquées par (word_id, style). */
  rows: PlannedWbwAudio[];
  /** Fichiers HF sans occurrence Hikma correspondante (jamais importés). */
  unmapped_files: string[];
  /** Fichiers invalides (nommage non conforme) — jamais importés. */
  invalid_files: string[];
  /** Clés positionnelles dupliquées au sein d'un même style. */
  duplicate_keys: string[];
  /** Nombre de fichiers occurrences bruts (avant dédup). */
  source_files: number;
};

/**
 * Planifie l'import à partir des fichiers listés et de l'index d'occurrences.
 * Déterministe : tri lexicographique des chemins pour choisir le représentant.
 */
export function planWbwImport(
  files: WbwFileEntry[],
  index: OccurrenceIndex,
): WbwImportPlan {
  const rowsByFormStyle = new Map<string, PlannedWbwAudio>();
  const unmapped: string[] = [];
  const seenKeys = new Set<string>();
  const duplicateKeys: string[] = [];

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const f of sorted) {
    const key = occurrenceKey(f.surah, f.ayah, f.word);
    const fullKey = `${f.style}|${key}`;
    if (seenKeys.has(fullKey)) {
      duplicateKeys.push(f.path);
      continue;
    }
    seenKeys.add(fullKey);

    const wordId = index.get(key);
    if (!wordId) {
      unmapped.push(f.path);
      continue;
    }

    const rowKey = `${wordId}|${f.style}`;
    const existing = rowsByFormStyle.get(rowKey);
    if (!existing) {
      rowsByFormStyle.set(rowKey, {
        word_id: wordId,
        style: f.style,
        source_path: f.path,
        occurrence_key: key,
      });
    }
    // Sinon : déjà un représentant pour cette (forme, style) → dédup silencieuse.
  }

  return {
    rows: [...rowsByFormStyle.values()].sort((a, b) =>
      `${a.style}|${a.word_id}`.localeCompare(`${b.style}|${b.word_id}`),
    ),
    unmapped_files: unmapped,
    invalid_files: [],
    duplicate_keys: duplicateKeys,
    source_files: files.length,
  };
}

/** URL de résolution brute HF pour un chemin (aucun appel réseau). */
export function huggingfaceResolveUrl(path: string): string {
  return `https://huggingface.co/datasets/zaibihassan/Quranic-Word-By-Word-Audio-Data/resolve/main/${path}`;
}

/** Parse une liste de chemins en entrées WBW (les invalides sont exclus). */
export function parseWbwFiles(paths: string[]): {
  entries: WbwFileEntry[];
  invalid: string[];
} {
  const entries: WbwFileEntry[] = [];
  const invalid: string[] = [];
  for (const path of paths) {
    const parsed = parseWbwFilename(path);
    if (!parsed) {
      invalid.push(path);
      continue;
    }
    entries.push({ path, ...parsed });
  }
  return { entries, invalid };
}
