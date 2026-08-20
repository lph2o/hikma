import type {
  GeneratedExercise,
  ExerciseValidationIssue,
  ExerciseValidationReport,
} from "../types";

/** Types d'exercices sans « bonne réponse » (auto-évaluation non notée). */
const SELF_ASSESSED_TYPES = new Set(["WORD_RECOGNITION", "PRONUNCIATION_GUIDED"]);

/** Types de rappel libre : réponse TEXTE saisie, sans options (notation machine). */
const FREE_TEXT_TYPES = new Set(["FORM_TO_MEANING", "MEANING_TO_FORM"]);

/**
 * Validation structurelle d'un exercice généré : question présente, options
 * cohérentes, une seule bonne réponse (sauf auto-évaluation), aucun doublon,
 * et les distracteurs ne reprennent pas la bonne réponse.
 */
export function validateGeneratedExercise(
  exercise: GeneratedExercise,
): ExerciseValidationReport {
  const issues: ExerciseValidationIssue[] = [];

  if (!exercise.prompt || exercise.prompt.trim() === "") {
    issues.push({ code: "PROMPT_EMPTY", message: "La question est vide." });
  }

  const isSelfAssessed = SELF_ASSESSED_TYPES.has(exercise.type);
  const isFreeText = FREE_TEXT_TYPES.has(exercise.type);

  if (isFreeText) {
    // Rappel libre : pas d'options, mais une réponse à révéler est exigée.
    const reveal = exercise.metadata.revealContent as string | undefined;
    if (!reveal || reveal === "") {
      issues.push({ code: "NO_REVEAL_CONTENT", message: "Rappel libre sans réponse à révéler." });
    }
    return { valid: issues.length === 0, issues };
  }

  // L'auto-évaluation non notée (WORD_RECOGNITION / PRONUNCIATION_GUIDED)
  // peut n'avoir aucune option : ce n'est pas un QCM.
  if (!isSelfAssessed && exercise.options.length === 0) {
    issues.push({ code: "NO_OPTIONS", message: "Aucune option de réponse." });
  }

  const correct = exercise.options.filter((o) => o.isCorrect);
  if (!isSelfAssessed && correct.length !== 1) {
    issues.push({
      code: "WRONG_CORRECT_COUNT",
      message: `Attendu exactement 1 bonne réponse, reçu ${correct.length}.`,
    });
  }

  const contents = exercise.options.map((o) => o.content);
  if (new Set(contents).size !== contents.length) {
    issues.push({
      code: "DUPLICATE_OPTIONS",
      message: "Deux options ont le même contenu.",
    });
  }

  if (exercise.options.some((o) => o.content === "")) {
    issues.push({ code: "EMPTY_OPTION", message: "Une option est vide." });
  }

  return { valid: issues.length === 0, issues };
}
