import type { WordBankEntry } from "@/lib/learning";
import type { GeneratedOption } from "../types";

/** Nombre d'options par défaut (1 correcte + 3 distracteurs). */
export const DEFAULT_OPTION_COUNT = 4;

/**
 * Sélectionne `count` distracteurs déterministes parmi le bank (hors cible).
 * On privilégie les entrées dont le champ demandé (`field`) est renseigné et
 * distinct de la valeur cible. Déterministe : ordre du bank, aucun aléa.
 */
export function selectDistractors(
  target: WordBankEntry,
  bank: WordBankEntry[],
  field: "arabic" | "transliteration" | "meaning",
  count: number,
): WordBankEntry[] {
  const targetValue = target[field];
  const seen = new Set<string>([targetValue ?? ""]);
  const out: WordBankEntry[] = [];

  for (const entry of bank) {
    if (out.length >= count) break;
    if (entry.wordId === target.wordId) continue;
    const value = entry[field];
    if (value == null || value === "") continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(entry);
  }

  return out;
}

/**
 * Construit la liste d'options (1 correcte + distracteurs), ordonnée en
 * plaçant la bonne réponse à une position déterministe (stable pour les tests).
 */
export function buildOptions(
  correct: WordBankEntry,
  distractors: WordBankEntry[],
  field: "arabic" | "transliteration" | "meaning",
): GeneratedOption[] {
  const contents = distractors
    .map((d) => d[field])
    .filter((v): v is string => v != null && v !== "");

  // Position déterministe de la bonne réponse : fin de liste (stable).
  const options: GeneratedOption[] = [];
  contents.forEach((content, i) => {
    options.push({
      position: i + 1,
      content,
      isCorrect: false,
      wordId: null,
      confidence: "UNKNOWN",
    });
  });
  options.push({
    position: contents.length + 1,
    content: correct[field] ?? "",
    isCorrect: true,
    wordId: correct.wordId,
  });

  return options;
}

/** Associe chaque option à son mot (pour relier les réponses aux mots coraniques). */
export function withWordIds(
  options: GeneratedOption[],
  correct: WordBankEntry,
  distractors: WordBankEntry[],
  field: "arabic" | "transliteration" | "meaning",
): GeneratedOption[] {
  const valueToWordId = new Map<string, string>();
  valueToWordId.set(correct[field] ?? "", correct.wordId);
  for (const d of distractors) {
    const v = d[field];
    if (v != null) valueToWordId.set(v, d.wordId);
  }
  return options.map((o) => ({
    ...o,
    wordId: valueToWordId.get(o.content) ?? o.wordId,
  }));
}
