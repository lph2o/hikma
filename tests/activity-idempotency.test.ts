import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACTIVITY_LESSON_CONFLICT,
  ACTIVITY_WORD_CONFLICT,
} from "../lib/learning/activity";

describe("idempotence des journaux d'activité (24H-ACTIVITY-IDEMPOTENCY)", () => {
  it("les clés de conflit correspondent EXACTEMENT aux contraintes UNIQUE", () => {
    expect(ACTIVITY_LESSON_CONFLICT).toBe("user_id,activity_date,lesson_id");
    expect(ACTIVITY_WORD_CONFLICT).toBe("user_id,activity_date,word_id");
  });

  it("les contraintes UNIQUE de la migration 0018 sont préservées", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase", "migrations", "0018_user_settings_and_activity.sql"),
      "utf8",
    );
    expect(sql).toContain("user_activity_lessons_user_date_lesson_key");
    expect(sql).toContain("unique (user_id, activity_date, lesson_id)");
    expect(sql).toContain("user_activity_words_user_date_word_key");
    expect(sql).toContain("unique (user_id, activity_date, word_id)");
  });

  it("les clés de conflit ne sont jamais vides (jamais de retour à un insert nu)", () => {
    // Contrat documenté : tout écriture d'activité passe par
    // .upsert(..., { onConflict, ignoreDuplicates: true }) avec ces clés.
    // La couverture DB est exercée par `npm run verify:persistence`.
    expect(ACTIVITY_LESSON_CONFLICT.split(",")).toHaveLength(3);
    expect(ACTIVITY_WORD_CONFLICT.split(",")).toHaveLength(3);
  });
});
