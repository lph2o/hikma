import type { WordBankEntry, WordContextData, WordLemmaData } from "@/lib/learning";
import { GENERATORS } from "./generators";
import { gradeFreeResponse } from "./grading";
import type { GradeLanguage, GradeResult } from "./grading";
import type {
  AnswerResult,
  ExerciseAnswer,
  ExerciseType,
  GeneratedExercise,
  GeneratedOption,
  GeneratorContext,
} from "./types";

/**
 * Génère un exercice d'un type donné pour un mot cible.
 * Retourne null si le type n'est pas exploitable avec les données fournies
 * (ex. audio absent, sens manquant, contexte/lemme indisponible).
 */
export function generateExercise(
  type: ExerciseType,
  ctx: GeneratorContext,
): GeneratedExercise | null {
  const generator = GENERATORS[type];
  return generator ? generator(ctx) : null;
}

/**
 * Génère la séquence d'exercices d'une leçon : pour chaque mot, chaque type.
 * Les exercices non exploitables (null) sont ignorés. `audioByWord`,
 * `contextByWord`, `lemmaByWord` fournissent les données réelles optionnelles
 * par mot (URL audio signée, contexte du verset, relation forme → lemme).
 */
export function generateLessonExercises(
  words: WordBankEntry[],
  types: ExerciseType[],
  difficulty = 1,
  audioByWord: Map<string, string> = new Map(),
  contextByWord: Map<string, WordContextData> = new Map(),
  lemmaByWord: Map<string, WordLemmaData> = new Map(),
): GeneratedExercise[] {
  const out: GeneratedExercise[] = [];
  for (const target of words) {
    for (const type of types) {
      const exercise = generateExercise(type, {
        target,
        bank: words,
        difficulty,
        audioUrl: audioByWord.get(target.wordId) ?? null,
        context: contextByWord.get(target.wordId) ?? null,
        lemma: lemmaByWord.get(target.wordId) ?? null,
      });
      if (exercise) out.push(exercise);
    }
  }
  return out;
}

/** Types de rappel libre (notation machine, tri-state CORRECT/INCORRECT/AMBIGUOUS). */
const RECALL_TYPES: ReadonlySet<ExerciseType> = new Set([
  "FORM_TO_MEANING",
  "MEANING_TO_FORM",
]);

/**
 * Valide une réponse. Pour l'auto-évaluation (WORD_RECOGNITION), toute réponse
 * est acceptée et non notée. Pour le rappel libre (FORM_TO_MEANING /
 * MEANING_TO_FORM), la réponse texte est notée par le moteur avec une issue
 * tri-state ; AMBIGUOUS n'est jamais transformé en INCORRECT (neutralité).
 */
export function validateAnswer(
  exercise: GeneratedExercise,
  answer: ExerciseAnswer,
): AnswerResult {
  const correctOption = exercise.options.find((o) => o.isCorrect) ?? null;

  if (
    exercise.type === "WORD_RECOGNITION" ||
    exercise.type === "PRONUNCIATION_GUIDED"
  ) {
    // Auto-évaluation non notée : pas de verdict objectif (Q1 ne juge pas la
    // prononciation). Toute « réponse » vaut acceptation, jamais un score.
    return { correct: true, correctOption: null, explanation: null };
  }

  if (exercise.type === "FORM_TO_MEANING") {
    const accepted = (exercise.metadata.acceptedAnswers as string[] | undefined) ?? [];
    const expected = (exercise.metadata.meaning as string | undefined) ?? "";
    const grade = gradeFreeResponse({
      language: "fr",
      userInput: answer.content ?? "",
      expectedAnswer: expected,
      variants: accepted,
    });
    return recallResult(grade, exercise, "fr");
  }

  if (exercise.type === "MEANING_TO_FORM") {
    const expected =
      (exercise.metadata.expectedArabic as string | undefined) ??
      exercise.metadata.arabic ??
      "";
    const grade = gradeFreeResponse({
      language: "ar",
      userInput: answer.content ?? "",
      expectedAnswer: expected,
    });
    return recallResult(grade, exercise, "ar");
  }

  const chosen = resolveChosenOption(exercise, answer);
  const correct = chosen?.isCorrect === true;

  // PHONETIC_DISCRIMINATION : rappel doux de la caractéristique ciblée —
  // renforcement sur bonne réponse, explication courte sur erreur. Même chemin
  // binaire que les autres QCM (aucun re-calcul de score).
  const trait =
    exercise.type === "PHONETIC_DISCRIMINATION"
      ? (exercise.metadata.phoneticTrait as { explanation?: string } | null | undefined)
      : null;
  const traitNote = trait?.explanation ?? "";

  const explanation = correct
    ? traitNote || null
    : `La bonne réponse était « ${correctOption?.content ?? "—"} ».${traitNote ? ` ${traitNote}` : ""}`;

  return { correct, correctOption, explanation };
}

/**
 * Construit le résultat d'un rappel libre. `correctOption` est un artefact de
 * présentation (la réponse révélée) afin que l'UI puisse l'afficher sans logique
 * métier ; il ne correspond pas à une option du générateur (aucune option).
 *
 * Le verdict (CORRECT / INCORRECT / AMBIGUOUS) provient EXCLUSIVEMENT de
 * `gradeFreeResponse` — jamais recalculé ici. Un correct obtenu par variante
 * française (ordre de synonymes / accents) porte une note douce, jamais une erreur.
 */
function recallResult(
  grade: GradeResult,
  exercise: GeneratedExercise,
  language: GradeLanguage,
): AnswerResult {
  const reveal =
    (exercise.metadata.revealContent as string | undefined) ??
    exercise.metadata.arabic ??
    exercise.metadata.meaning ??
    "";
  const revealOption: GeneratedOption = {
    position: 1,
    content: reveal,
    isCorrect: true,
    wordId: exercise.metadata.targetWordId,
  };

  if (grade.verdict === "CORRECT") {
    // Correct obtenu par variante française (ordre de synonymes / accents) :
    // même sens, on le dit gentiment — jamais une erreur, jamais une pénalité.
    const synonymMatch =
      language === "fr" && grade.normalizedInput !== grade.normalizedExpected;
    return {
      correct: true,
      status: grade.verdict,
      correctOption: revealOption,
      explanation: synonymMatch ? "Ta réponse exprime le même sens." : null,
    };
  }
  if (grade.verdict === "AMBIGUOUS") {
    return {
      correct: false,
      status: grade.verdict,
      correctOption: revealOption,
      explanation:
        "Ta réponse est proche, mais elle peut avoir plusieurs interprétations — vérifie la vocalisation exacte.",
    };
  }
  return {
    correct: false,
    status: grade.verdict,
    correctOption: revealOption,
    explanation: `La bonne réponse était « ${reveal} ».`,
  };
}

/** Score binaire (0 ou 1). L'auto-évaluation et AMBIGUOUS valent 0. */
export function scoreAnswer(
  exercise: GeneratedExercise,
  answer: ExerciseAnswer,
): number {
  if (
    exercise.type === "WORD_RECOGNITION" ||
    exercise.type === "PRONUNCIATION_GUIDED"
  ) {
    return 0;
  }
  const result = validateAnswer(exercise, answer);
  // AMBIGUOUS n'est ni un succès ni un échec compté → 0 (neutralité).
  return result.correct ? 1 : 0;
}

function resolveChosenOption(
  exercise: GeneratedExercise,
  answer: ExerciseAnswer,
): GeneratedExercise["options"][number] | null {
  if (answer.optionIndex != null) {
    return exercise.options[answer.optionIndex] ?? null;
  }
  if (answer.content != null) {
    return (
      exercise.options.find((o) => o.content === answer.content) ?? null
    );
  }
  return null;
}

export { RECALL_TYPES };
