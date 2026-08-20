import type { LearningPath, Lesson, Unit } from "@/types/learning";

/** Arbre curriculum : path → units → lessons. */
export type Curriculum = {
  path: LearningPath;
  units: (Unit & { lessons: Lesson[] })[];
};

export type CurriculumIssue = {
  code: string;
  message: string;
};

export type CurriculumReport = {
  valid: boolean;
  issues: CurriculumIssue[];
};

/** Vrai s'il existe un doublon dans un tableau de nombres. */
function hasDuplicate(values: number[]): boolean {
  return new Set(values).size !== values.length;
}

/**
 * Validation structurelle du curriculum : chaque unité appartient au parcours,
 * chaque leçon à son unité, les ordres sont uniques et croissants.
 * (Les mots des leçons sont validés séparément — ici on ne valide que l'arbre.)
 */
export function validateCurriculum(curriculum: Curriculum): CurriculumReport {
  const issues: CurriculumIssue[] = [];

  const unitOrders = curriculum.units.map((u) => u.sort_order);
  if (hasDuplicate(unitOrders)) {
    issues.push({
      code: "UNIT_ORDER_DUPLICATE",
      message: "Deux unités partagent le même sort_order dans le parcours.",
    });
  }

  for (const unit of curriculum.units) {
    if (unit.path_id !== curriculum.path.id) {
      issues.push({
        code: "UNIT_ORPHAN",
        message: `L'unité « ${unit.title} » n'appartient pas au parcours.`,
      });
    }
    const lessonOrders = unit.lessons.map((l) => l.sort_order);
    if (hasDuplicate(lessonOrders)) {
      issues.push({
        code: "LESSON_ORDER_DUPLICATE",
        message: `Deux leçons partagent le même sort_order dans « ${unit.title} ».`,
      });
    }
    for (const lesson of unit.lessons) {
      if (lesson.unit_id !== unit.id) {
        issues.push({
          code: "LESSON_ORPHAN",
          message: `La leçon « ${lesson.title} » n'appartient pas à l'unité.`,
        });
      }
      if (lesson.status !== "published") {
        issues.push({
          code: "LESSON_NOT_PUBLISHED",
          message: `La leçon « ${lesson.title} » n'est pas publiée.`,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Trie units et leçons par sort_order (retourne une copie ordonnée). */
export function orderCurriculum(curriculum: Curriculum): Curriculum {
  return {
    path: curriculum.path,
    units: [...curriculum.units]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((unit) => ({
        ...unit,
        lessons: [...unit.lessons].sort((a, b) => a.sort_order - b.sort_order),
      })),
  };
}
