// Séquenceur pédagogique (Phase 23F) — logique PURE, sans I/O.
//
// Principe cumulatif (Phase 23B) : on progresse par RONDES de compétence
// (reconnaissance → rappel → production → audio → contexte → lemme), chaque
// ronde couvrant tous les mots de la leçon dans l'ordre, et on SAUTE les
// compétences déjà maîtrisées. Résultat : un mot revu régulièrement pendant que
// de nouveaux mots sont introduits — la progression est cumulative.
//
// Phase 23F-B : les compétences contexte / lemme rejoignent les rondes ; la
// RÉTENTION devient une porte de ré-activation : une compétence de rappel
// « maîtrisée » (niveau 100) est néanmoins ré-activée tant que la connaissance
// n'a pas survécu un délai suffisant (rétention < 75, soit < 3 jours).

import type { ExerciseType, GeneratedExercise } from "@/lib/exercises";
import type { WordBankEntry, MasteryLevel } from "./types";
import { SKILL_ORDER, type Skill } from "./skills";
import type { SkillProgressState } from "./skill-progress";

/** Une étape du parcours : quel mot, avec quel type d'exercice. */
export type SequencedStep = {
  wordId: string;
  exerciseType: ExerciseType;
  skill: Skill;
};

export type SkillProgressByWord = Map<string, Map<Skill, SkillProgressState>>;

/** Niveau de maîtrise d'une compétence pour un mot (0 si aucune donnée). */
export function skillLevel(
  progress: SkillProgressByWord,
  wordId: string,
  skill: Skill,
): MasteryLevel {
  return progress.get(wordId)?.get(skill)?.mastery ?? 0;
}

/**
 * Seuil de rétention en dessous duquel une compétence de rappel « maîtrisée »
 * est ré-activée (la connaissance n'a pas encore survécu 3 jours).
 */
export const RETENTION_REACTIVATION_THRESHOLD = 75;

/** Compétences de RAPPEL concernées par la porte de rétention. */
const RECALL_GATED_SKILLS: readonly Skill[] = ["form_to_meaning", "meaning_to_form"];

/**
 * Vrai si une compétence doit être pratiquée pour un mot :
 *   - niveau < 100 (jamais maîtrisée), OU
 *   - compétence de rappel dont la rétention < seuil (ré-activation espacée).
 */
function needsPractice(
  progress: SkillProgressByWord,
  wordId: string,
  skill: Skill,
): boolean {
  if (skillLevel(progress, wordId, skill) < 100) return true;
  if (RECALL_GATED_SKILLS.includes(skill)) {
    return (
      skillLevel(progress, wordId, "retention") < RETENTION_REACTIVATION_THRESHOLD
    );
  }
  return false;
}

/**
 * Type d'exercice par défaut pour une compétence (le générateur principal).
 * `retention` n'a pas de type : c'est une mesure DÉRIVÉE (porte de ré-activation),
 * pas un exercice autonome. Les générateurs contexte/lemme renvoient null quand
 * leurs données réelles sont absentes (DATA_UNAVAILABLE → pas d'exercice vide).
 */
export function defaultSkillToType(skill: Skill): ExerciseType | null {
  switch (skill) {
    case "meaning_recognition":
      return "WORD_TO_TRANSLATION";
    case "form_recognition":
      return "TRANSLATION_TO_WORD";
    case "form_to_meaning":
      return "FORM_TO_MEANING";
    case "meaning_to_form":
      return "MEANING_TO_FORM";
    case "audio_recognition":
      return "AUDIO_TO_WORD";
    case "context_recognition":
      return "CONTEXT_RECOGNITION";
    case "lemma_relation":
      return "LEMMA_RELATION";
    case "retention":
      return null;
  }
}

/**
 * Construit la séquence cumulative d'une leçon : ronde par ronde de
 * compétence (ordre pédagogique), chaque ronde couvrant les mots dans l'ordre
 * de la leçon, en sautant les compétences déjà maîtrisées (avec ré-activation
 * par rétention pour le rappel) et les compétences sans type d'exercice
 * exploitable.
 *
 * @param words mots de la leçon, ordonnés (position).
 * @param progress maîtrise par compétence de chaque mot (vide = débutant).
 * @param typeForSkill résolution compétence → type (par défaut defaultSkillToType).
 */
export function buildCumulativeSequence(
  words: WordBankEntry[],
  progress: SkillProgressByWord = new Map(),
  typeForSkill: (skill: Skill) => ExerciseType | null = defaultSkillToType,
): SequencedStep[] {
  const steps: SequencedStep[] = [];

  for (const skill of SKILL_ORDER) {
    const exerciseType = typeForSkill(skill);
    if (exerciseType == null) continue;
    for (const word of words) {
      if (!needsPractice(progress, word.wordId, skill)) continue;
      steps.push({ wordId: word.wordId, exerciseType, skill });
    }
  }

  return steps;
}

/**
 * Sélectionne LA prochaine activité (mot × compétence) la plus faible : le
 * premier mot (ordre de leçon) ayant une compétence non maîtrisée, dans
 * l'ordre pédagogique. Retourne null si tout est maîtrisé (leçon terminée).
 */
export function selectNextStep(
  words: WordBankEntry[],
  progress: SkillProgressByWord = new Map(),
  typeForSkill: (skill: Skill) => ExerciseType | null = defaultSkillToType,
): SequencedStep | null {
  for (const word of words) {
    for (const skill of SKILL_ORDER) {
      if (!needsPractice(progress, word.wordId, skill)) continue;
      const exerciseType = typeForSkill(skill);
      if (exerciseType == null) continue;
      return { wordId: word.wordId, exerciseType, skill };
    }
  }
  return null;
}

/** Vrai si la séquence est vide (toutes les compétences de tous les mots sont maîtrisées). */
export function isSequenceComplete(steps: SequencedStep[]): boolean {
  return steps.length === 0;
}

type ExercisePhase = "recognition" | "recall" | "listening" | "relation" | "other";

const INTERLEAVING_PHASE_ORDER: readonly ExercisePhase[] = [
  "recognition",
  "recall",
  "listening",
  "relation",
  "other",
];

/** Phase pédagogique large : elle protège les prérequis avant la variété locale. */
function exercisePhase(type: ExerciseType): ExercisePhase {
  if (
    [
      "WORD_TO_TRANSLATION",
      "TRANSLATION_TO_WORD",
      "REVERSE_TRANSLATION",
      "MULTIPLE_CHOICE",
      "COMPLETE_WORD",
      "WORD_RECOGNITION",
    ].includes(type)
  ) {
    return "recognition";
  }
  if (["FORM_TO_MEANING", "MEANING_TO_FORM"].includes(type)) {
    return "recall";
  }
  if (
    ["AUDIO_TO_WORD", "CONTEXT_RECOGNITION", "PHONETIC_DISCRIMINATION"].includes(type)
  ) {
    return "listening";
  }
  if (type === "LEMMA_RELATION") return "relation";
  return "other";
}

/**
 * Intercale les exercices compatibles sans modifier leur contenu.
 *
 * Les phases restent dans l'ordre pédagogique. Dans chaque phase, les files
 * par type sont consommées en alternance ; si une seule file reste disponible,
 * la répétition est conservée plutôt que de fabriquer une fausse variété.
 */
export function buildInterleavedSequence(
  exercises: readonly GeneratedExercise[],
): GeneratedExercise[] {
  const byPhase = new Map<ExercisePhase, GeneratedExercise[]>();
  for (const phase of INTERLEAVING_PHASE_ORDER) byPhase.set(phase, []);
  for (const exercise of exercises) {
    byPhase.get(exercisePhase(exercise.type))!.push(exercise);
  }

  return INTERLEAVING_PHASE_ORDER.flatMap((phase) =>
    interleavePhase(byPhase.get(phase) ?? []),
  );
}

function interleavePhase(exercises: GeneratedExercise[]): GeneratedExercise[] {
  if (exercises.length < 2) return [...exercises];

  const queues = new Map<ExerciseType, GeneratedExercise[]>();
  const typeOrder: ExerciseType[] = [];
  for (const exercise of exercises) {
    const queue = queues.get(exercise.type);
    if (queue) queue.push(exercise);
    else {
      queues.set(exercise.type, [exercise]);
      typeOrder.push(exercise.type);
    }
  }

  const result: GeneratedExercise[] = [];
  let lastType: ExerciseType | null = null;
  let lastWordId: string | null = null;

  while (result.length < exercises.length) {
    const available = typeOrder.filter((type) => (queues.get(type)?.length ?? 0) > 0);
    const differentType = available.filter((type) => type !== lastType);
    const differentWord = differentType.filter((type) => {
      const candidate = queues.get(type)?.[0];
      return candidate?.metadata.targetWordId !== lastWordId;
    });
    const chosenType = (differentWord[0] ?? differentType[0] ?? available[0])!;
    const candidate = queues.get(chosenType)!.shift()!;
    result.push(candidate);
    lastType = candidate.type;
    lastWordId = candidate.metadata.targetWordId;
  }

  return result;
}
