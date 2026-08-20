import type { GeneratedExercise } from "@/lib/exercises";

/** Identité de présentation : aucune responsabilité de grading ou de progression. */
export function attachExerciseIdentities(
  lessonId: string,
  exercises: GeneratedExercise[],
): GeneratedExercise[] {
  const occurrences = new Map<string, number>();

  return exercises.map((exercise) => {
    const signature = `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`;
    const occurrence = occurrences.get(signature) ?? 0;
    occurrences.set(signature, occurrence + 1);
    return {
      ...exercise,
      id: `${lessonId}:${signature}:${occurrence}`,
    };
  });
}

/** Fallback stable pour les usages hors page de leçon (ex. review/tests). */
export function exerciseIdentity(exercise: GeneratedExercise): string {
  return (
    exercise.id ??
    `${exercise.type}:${exercise.metadata.targetWordId}:${exercise.prompt}`
  );
}
