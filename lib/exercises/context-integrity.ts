import type { AnswerLanguage, TranslationExposure } from "./types";

/** Normalisation prudente pour comparer une réponse connue au texte du verset. */
export function normalizeContextText(value: string): string {
  return value
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[«»“”"'’.,;:!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsKnownAnswer(context: string, answer: string): boolean {
  const normalizedContext = normalizeContextText(context);
  const normalizedAnswer = normalizeContextText(answer);
  if (!normalizedContext || !normalizedAnswer) return false;
  return ` ${normalizedContext} `.includes(` ${normalizedAnswer} `);
}

/**
 * Détection volontairement conservatrice : aucune paraphrase, synonymie ou
 * analyse linguistique n'est inventée. En cas de donnée insuffisante, on replie.
 */
export function detectTranslationExposure(
  translation: string | null | undefined,
  knownAnswers: readonly string[],
): TranslationExposure {
  if (!translation) return "SAFE_CONTEXT";
  const answers = knownAnswers.filter((answer) => normalizeContextText(answer));
  if (answers.length === 0) return "UNKNOWN";
  return answers.some((answer) => containsKnownAnswer(translation, answer))
    ? "REVEAL_RISK"
    : "SAFE_CONTEXT";
}

export function answerLanguageForMeaning(target: {
  meaning?: string | null;
  meaningLanguage?: string;
  meaningFallback?: boolean;
  isValidated?: boolean;
}): AnswerLanguage {
  if (!target.meaning) return "UNKNOWN";
  if (target.meaningLanguage === "fr" && target.isValidated === true && !target.meaningFallback) {
    return "FR_VERIFIED";
  }
  if (target.meaningLanguage === "en" && target.meaningFallback === true) {
    return "EN_VERIFIED";
  }
  // Compatibilité avec les fixtures historiques sans métadonnées de langue.
  // Le word bank de production renseigne toujours ces champs.
  if (target.meaningLanguage == null && target.meaningFallback == null && target.isValidated == null) {
    return "FR_VERIFIED";
  }
  return "UNKNOWN";
}
