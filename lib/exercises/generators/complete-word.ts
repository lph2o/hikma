import type { GeneratedExercise, GeneratedOption, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  selectDistractors,
} from "./shared";

/**
 * COMPLETE_WORD — compléter le sens (traduction anglaise) d'un mot arabe.
 * Le dernier « token » du sens est masqué ; l'utilisateur le complète.
 * Ne touche jamais au texte arabe (aucune ligature/diacritique cassée).
 */
export function completeWord(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty } = ctx;
  if (target.meaning == null || target.meaning === "") return null;

  const correctValue = completionValue(target.meaning);
  const distractors = selectDistractors(
    target,
    bank,
    "meaning",
    DEFAULT_OPTION_COUNT - 1,
  )
    .map((d) => d.meaning)
    .filter((m): m is string => m != null && m !== "")
    .map(completionValue)
    .filter((v) => v !== correctValue);

  const options: GeneratedOption[] = [
    ...distractors.slice(0, DEFAULT_OPTION_COUNT - 1).map((content, i) => ({
      position: i + 1,
      content,
      isCorrect: false,
      wordId: null,
      confidence: "UNKNOWN" as const,
    })),
    {
      position: DEFAULT_OPTION_COUNT,
      content: correctValue,
      isCorrect: true,
      wordId: target.wordId,
    },
  ];

  const prefix = meaningPrefix(target.meaning);

  return {
    type: "COMPLETE_WORD",
    prompt: `Complète le sens : ${prefix} ___`,
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
    },
  };
}

/** Partie du sens à compléter (dernier token si plusieurs, sinon le sens entier). */
function completionValue(meaning: string): string {
  const tokens = meaning.trim().split(/\s+/);
  return tokens.length > 1 ? tokens[tokens.length - 1] : meaning.trim();
}

/** Préfixe affiché avant le blanc (vide si le sens est un seul token). */
function meaningPrefix(meaning: string): string {
  const tokens = meaning.trim().split(/\s+/);
  return tokens.length > 1 ? tokens.slice(0, -1).join(" ") : "";
}
