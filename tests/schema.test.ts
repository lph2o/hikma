import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function sql(name: string): string {
  return readFileSync(join(MIGRATIONS_DIR, name), "utf8");
}

describe("contrat de schéma (migrations)", () => {
  it("RLS : les tables utilisateur restreignent l'accès à auth.uid()", () => {
    for (const file of ["0016_user_word_progress.sql", "0017_review_items.sql"]) {
      const s = sql(file);
      expect(s).toContain("enable row level security");
      expect(s).toContain("auth.uid() = user_id");
      // Sélectif : l'utilisateur ne lit que SES données.
      expect(s).toContain("for select");
    }
  });

  it("RLS : les tables pédagogiques publiques sont en lecture seule", () => {
    for (const file of [
      "0010_learning_paths.sql",
      "0011_units.sql",
      "0012_lessons.sql",
      "0013_lesson_words.sql",
      "0014_exercises.sql",
      "0015_exercise_options.sql",
    ]) {
      const s = sql(file);
      expect(s).toContain("for select");
      expect(s).toContain("using (true)");
      // Aucune politique d'écriture publique.
      expect(s).not.toContain("for insert");
      expect(s).not.toContain("for update");
    }
  });

  it("un mot peut appartenir à plusieurs leçons (pas d'unicité globale sur word_id)", () => {
    const s = sql("0013_lesson_words.sql");
    // L'unicité est (lesson_id, word_id) — un même word_id peut apparaître
    // dans plusieurs leçons.
    expect(s).toContain("unique (lesson_id, word_id)");
    expect(s).not.toMatch(/unique\s*\(\s*word_id\s*\)/);
  });

  it("les données utilisateur sont liées à auth.users (cascade)", () => {
    for (const file of ["0016_user_word_progress.sql", "0017_review_items.sql"]) {
      const s = sql(file);
      expect(s).toContain("references auth.users (id) on delete cascade");
    }
  });
});
