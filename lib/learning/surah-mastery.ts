import { SKILLS, type Skill } from "./skills";
import type { MasteryLevel } from "./types";

export type SurahProgressStatus =
  | "NON_EVALUATED"
  | "STUDIED"
  | "IN_PROGRESS"
  | "DUE"
  | "MASTERED";

export type SurahWordProgress = {
  wordId: string;
  status: "new" | "learning" | "familiar" | "mastered";
  mastery: number;
  nextReviewAt?: string | null;
};

export type SurahSkillMastery = {
  [K in Skill]: MasteryLevel | null;
};

export type SurahMastery = {
  surahNumber: number;
  status: SurahProgressStatus;
  overall: MasteryLevel | null;
  skills: SurahSkillMastery;
  studiedWords: number;
  totalWords: number;
};

function average(values: number[]): MasteryLevel | null {
  if (values.length === 0) return null;
  const value = Math.round(values.reduce((sum, item) => sum + item, 0) / values.length);
  return Math.min(100, Math.max(0, Math.round(value / 25) * 25)) as MasteryLevel;
}

/**
 * Agrégation en lecture seule de la maîtrise d'une sourate.
 * Les compétences sont celles déjà persistées dans user_word_skill_progress.
 */
export function aggregateSurahMastery(
  surahNumber: number,
  wordIds: readonly string[],
  progress: ReadonlyMap<string, SurahWordProgress>,
  skillsByWord: ReadonlyMap<string, ReadonlyMap<Skill, MasteryLevel>> = new Map(),
  now: Date = new Date(),
): SurahMastery {
  const rows = wordIds.map((id) => progress.get(id)).filter((row): row is SurahWordProgress => row != null);
  const studiedRows = rows.filter((row) => row.status !== "new");
  const due = studiedRows.some(
    (row) => row.nextReviewAt != null && new Date(row.nextReviewAt).getTime() <= now.getTime(),
  );
  const allMastered = wordIds.length > 0 && wordIds.every((id) => progress.get(id)?.status === "mastered");
  const status: SurahProgressStatus =
    studiedRows.length === 0
      ? "NON_EVALUATED"
      : allMastered
        ? "MASTERED"
        : due
          ? "DUE"
          : studiedRows.length < wordIds.length
            ? "IN_PROGRESS"
            : "STUDIED";

  const skills = {} as SurahSkillMastery;
  for (const skill of SKILLS) {
    const values = [...skillsByWord.values()]
      .map((bySkill) => bySkill.get(skill))
      .filter((value): value is MasteryLevel => value != null);
    skills[skill] = average(values);
  }
  const overall = average(
    [...skillsByWord.values()].flatMap((bySkill) => [...bySkill.values()]),
  );

  return {
    surahNumber,
    status,
    overall,
    skills,
    studiedWords: studiedRows.length,
    totalWords: wordIds.length,
  };
}
