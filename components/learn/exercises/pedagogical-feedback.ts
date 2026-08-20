import type { AnswerResult, ExerciseType, GeneratedExercise } from "@/lib/exercises";
import type { HikmaExplanationData } from "@/components/ui/hikma-explanation";
import { buildLinguisticExplanation } from "@/lib/linguistic/explanation";

export type FeedbackMoment = "ordinary" | "difficult_success" | "milestone";

/**
 * Issue pédagogique d'une réponse, dérivée du verdict de grading SANS le modifier.
 * Le grading reste l'autorité (CORRECT / INCORRECT / AMBIGUOUS) ; ce type ne fait
 * que catégoriser l'affichage du feedback. PARTIAL n'existe pas encore dans le
 * grading → FUTURE_WORK (documenté, jamais inventé).
 */
export type AnswerOutcome = "correct" | "incorrect" | "ambiguous";

export function feedbackMoment(
  exercise: GeneratedExercise,
  options: { isMilestone?: boolean } = {},
): FeedbackMoment {
  if (options.isMilestone) return "milestone";
  return exercise.difficulty >= 3 ? "difficult_success" : "ordinary";
}

function hasArabicData(exercise: GeneratedExercise): boolean {
  return typeof exercise.metadata.arabic === "string" && exercise.metadata.arabic.length > 0;
}

function textData(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function phoneticData(exercise: GeneratedExercise): HikmaExplanationData | null {
  const trait = exercise.metadata.phoneticTrait as { explanation?: string } | undefined;
  const hints = exercise.metadata.phoneticHints as string[] | undefined;
  const marks = exercise.metadata.phoneticMarks as Array<{ explanation?: string }> | undefined;
  const markHints = marks?.map((mark) => mark.explanation).filter((hint): hint is string => Boolean(hint)) ?? [];
  const allHints = [...new Set([...(hints ?? []), ...markHints])];
  if (!trait?.explanation && allHints.length === 0) return null;

  return {
    availability: "verified",
    kind: "phonetic",
    shortText: trait?.explanation ?? "Cette aide est dérivée des signes réellement présents dans la forme arabe.",
    phoneticHints: trait?.explanation ? allHints.filter((hint) => hint !== trait.explanation) : allHints,
    arabic: exercise.metadata.arabic,
    transliteration: exercise.metadata.transliteration,
    audioUrl: textData(exercise.metadata.audioUrl),
  };
}

export function pedagogicalExplanation(
  exercise: GeneratedExercise,
): HikmaExplanationData | null {
  const phonetic = phoneticData(exercise);
  if (phonetic && (exercise.type === "PRONUNCIATION_GUIDED" || exercise.type === "PHONETIC_DISCRIMINATION")) {
    return phonetic;
  }

  // Couche linguistique MASAQ (Phase 24I) — normalisation PÉDAGOGIQUE pure.
  // AVAILABLE ≠ INFERABLE : `buildLinguisticExplanation` ne fabrique jamais
  // de bloc à partir d'une donnée absente ou ambiguë.
  const linguistic = buildLinguisticExplanation(exercise.metadata.linguisticEvidence);

  if (exercise.type === "LEMMA_RELATION" && exercise.metadata.lemma) {
    const context = exercise.metadata.context && typeof exercise.metadata.context === "object"
      ? exercise.metadata.context as HikmaExplanationData["context"]
      : null;
    return {
      availability: "partial",
      kind: "lemma",
      meaning: textData(exercise.metadata.meaning),
      senseExplanation: textData(exercise.metadata.senseExplanation),
      context,
      shortText: "Les formes présentées appartiennent à une même famille lexicale vérifiée.",
      detailText: "Cette indication décrit uniquement la relation entre les formes disponibles ; elle ne donne pas d’analyse morphologique détaillée.",
      arabic: exercise.metadata.arabic,
      transliteration: exercise.metadata.transliteration,
      lemmaMeaning: textData(exercise.metadata.lemmaMeaning),
      lemmaRelation: "Cette forme est reliée à d’autres formes enregistrées dans la même famille.",
      audioUrl: textData(exercise.metadata.audioUrl),
      linguistic,
      ...(exercise.metadata.meaningValidated === true ? { availability: "verified" as const } : {}),
    };
  }

  const meaning = textData(exercise.metadata.meaning);
  const lemmaMeaning = textData(exercise.metadata.lemmaMeaning);
  const lemmaRelation = exercise.metadata.lemma && typeof exercise.metadata.lemma === "object"
    ? "Cette forme est reliée à d’autres formes enregistrées dans la même famille."
    : null;
  const context = exercise.metadata.context && typeof exercise.metadata.context === "object"
    ? exercise.metadata.context as HikmaExplanationData["context"]
    : null;
  const audioUrl = textData(exercise.metadata.audioUrl);
  const hasContext = Boolean(context?.arabic || context?.french);
  // Couche « explication de sens » (Phase 44B) — déjà résolue côté serveur
  // (générique ou override contextuel). Passive : jamais fabriquée, jamais
  // requise, jamais utilisée par le grading ou le SRS.
  const senseExplanation = textData(exercise.metadata.senseExplanation);

  if (meaning || senseExplanation || lemmaMeaning || lemmaRelation || hasContext || audioUrl || exercise.metadata.revealContent || exercise.metadata.expectedArabic || linguistic?.blocks.length) {
    return {
      availability: exercise.metadata.meaningValidated === true ? "verified" : (meaning || lemmaMeaning || lemmaRelation || hasContext || audioUrl || linguistic?.blocks.length ? "partial" : "unavailable"),
      kind: hasContext ? "context" : lemmaMeaning ? "lemma" : audioUrl ? "audio" : "meaning",
      meaning,
      senseExplanation,
      lemmaMeaning,
      lemmaRelation,
      context,
      audioUrl,
      linguistic,
      detailText: "Les repères affichés proviennent uniquement des données disponibles pour ce mot.",
      arabic: hasArabicData(exercise) ? exercise.metadata.arabic : null,
      transliteration: exercise.metadata.transliteration,
    };
  }

  return null;
}

export function islamicFeedbackCopy(
  moment: FeedbackMoment,
): { title: string; message: string } {
  if (moment === "milestone") {
    return { title: "Mā shā’ Allāh", message: "Tu viens de franchir une étape importante." };
  }
  if (moment === "difficult_success") {
    return { title: "Mā shā’ Allāh", message: "Tu as retrouvé cette réponse avec attention." };
  }
  return { title: "Très bien", message: "Réponse juste." };
}

export function feedbackStatus(
  result: AnswerResult,
): "correct" | "incorrect" | "ambiguous" {
  if (result.status === "AMBIGUOUS") return "ambiguous";
  return result.correct ? "correct" : "incorrect";
}

/**
 * Rappel pédagogique COURT (1 ligne), indépendant du résultat et du grading.
 * Anti-répétition : varie selon l'issue et les données réellement disponibles
 * (aucun système complexe de mémoire utilisateur — on utilise ce qui existe).
 * Jamais d'arabe brut inséré au milieu du français (évite les problèmes bidi).
 */
export function shortFeedbackCopy(
  exercise: GeneratedExercise,
  outcome: AnswerOutcome,
): string | null {
  const meaning = textData(exercise.metadata.meaning);
  const hasDecomposition =
    (exercise.metadata.linguisticEvidence?.segments?.length ?? 0) >= 2;
  const hasContext =
    exercise.metadata.context != null &&
    typeof exercise.metadata.context === "object";

  if (outcome === "correct") {
    if (hasDecomposition) {
      return "Bien vu. Regarde aussi comment ce mot est construit pour mieux le retenir.";
    }
    if (hasContext && meaning) {
      return `Bien vu — le sens « ${meaning} » s'éclaire par le contexte du verset.`;
    }
    return meaning ? `Bien vu : « ${meaning} ».` : null;
  }

  if (outcome === "incorrect") {
    if (hasDecomposition) {
      return "Observe la construction de ce mot : elle t'aidera à mémoriser son sens.";
    }
    // La « Réponse attendue » affiche déjà le sens : pas de doublon.
    return null;
  }

  // ambiguous : distinguer les formulations acceptées, jamais transformer en erreur.
  return meaning
    ? `Plusieurs formulations sont acceptées pour ce mot — dont « ${meaning} ».`
    : null;
}

/**
 * Pertinence de l'approfondissement — INDÉPENDANTE du résultat (une réponse
 * correcte a droit à « Comprendre ce mot »). Exclut uniquement les types
 * d'auto-évaluation qui ne produisent pas de verdict objectif.
 */
export function isExplanationRelevant(
  explanationData: HikmaExplanationData | null,
  type: ExerciseType,
): boolean {
  if (!explanationData) return false;
  if (type === "WORD_RECOGNITION" || type === "PRONUNCIATION_GUIDED") return false;
  return true;
}
