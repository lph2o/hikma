// Parsing déterministe du nommage WBW « SURAH_AYAH_WORD » (dataset Hugging Face
// zaibihassan/Quranic-Word-By-Word-Audio-Data).
//
// Phase 22D. Aucune écriture : fonctions pures, testables. Aucun fuzzy matching :
// le chemin doit correspondre EXACTEMENT à `{style}/{surah}/{surah}_{ayah}_{word}.opus`
// où chaque nombre est en 3 chiffres. Aucun rapprochement par normalized_text —
// la clé est la position.

export type WbwStyle = "muallim" | "mujawwad";

export type WbwFilename = {
  style: WbwStyle;
  surah: number;
  ayah: number;
  word: number;
};

const STYLES: readonly string[] = ["muallim", "mujawwad"];

/**
 * Parse un chemin de fichier WBW (ex. `muallim/001/001_001_001.opus`).
 * Retourne null si le nommage est invalide : style absent/non reconnu, dossier
 * sourate incohérent avec le nom, format non 3+3+3, plages hors limites.
 * Aucune tolérance approximative.
 */
export function parseWbwFilename(path: string): WbwFilename | null {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length < 3) return null;

  const style = segments[0].toLowerCase();
  if (!STYLES.includes(style)) return null;

  const surahDir = segments[segments.length - 2];
  const base = segments[segments.length - 1];
  if (!base.toLowerCase().endsWith(".opus")) return null;
  const stem = base.slice(0, -".opus".length);

  const match = /^(\d{3})_(\d{3})_(\d{3})$/.exec(stem);
  if (!match) return null;

  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  const word = Number(match[3]);
  if (surah < 1 || surah > 114 || ayah < 1 || word < 1) return null;

  // Cohérence dossier/chemin : le dossier doit être exactement la sourate du nom
  // (rejette les fichiers mal placés, ex. `muallim/000/001_001_001.opus`).
  if (surahDir !== match[1]) return null;

  return { style: style as WbwStyle, surah, ayah, word };
}

/**
 * Clé canonique d'une position de mot dans un verset :
 * `{surah}_{ayah}_{word}` en 3+3+3 chiffres (identique au nommage WBW).
 * Sert de clé de jointure DÉTERMINISTE avec Hikma (surah_number + ayah_number +
 * position), sans jamais passer par normalized_text ni lemma_id.
 */
export function occurrenceKey(surah: number, ayah: number, word: number): string {
  return (
    `${String(surah).padStart(3, "0")}_` +
    `${String(ayah).padStart(3, "0")}_` +
    `${String(word).padStart(3, "0")}`
  );
}
