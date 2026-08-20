import { describe, expect, it } from "vitest";
import {
  classifyLessonSubmitError,
  runLessonSubmission,
} from "@/lib/learning/lesson-submit";
import type { WordAttempts } from "@/lib/learning/session";

const w = (wordId: string, attempts: boolean[]): WordAttempts => ({ wordId, attempts });
const results: WordAttempts[] = [
  w("w1", [true]),
  w("w2", [true]),
  w("w3", [false]),
  w("w4", [true]),
];

describe("runLessonSubmission — contrat success / partial / failed", () => {
  it("1. succès complet → success, activitySaved true, un persist par mot", async () => {
    const calls: string[] = [];
    const res = await runLessonSubmission(
      results,
      async (id) => {
        calls.push(id);
      },
      async () => {},
    );
    expect(res.status).toBe("success");
    expect(res.ok).toBe(true);
    expect(res.savedWordIds).toEqual(["w1", "w2", "w3", "w4"]);
    expect(res.pendingWordIds).toEqual([]);
    expect(res.activitySaved).toBe(true);
    expect(res.error).toBeUndefined();
    expect(calls).toEqual(["w1", "w2", "w3", "w4"]);
  });

  it("2. erreur avant première sauvegarde → failed, rien de sauvegardé", async () => {
    const res = await runLessonSubmission(
      results,
      async () => {
        throw new Error("fetch failed");
      },
      async () => {},
    );
    expect(res.status).toBe("failed");
    expect(res.ok).toBe(false);
    expect(res.savedWordIds).toEqual([]);
    expect(res.pendingWordIds).toEqual(["w1", "w2", "w3", "w4"]);
    expect(res.errorCode).toBe("RETRYABLE");
    expect(res.retryable).toBe(true);
  });

  it("3. erreur après quelques mots → partial, pending = mots restants", async () => {
    let n = 0;
    const res = await runLessonSubmission(
      results,
      async () => {
        n += 1;
        if (n === 3) throw new Error("request timeout");
      },
      async () => {},
    );
    expect(res.status).toBe("partial");
    expect(res.ok).toBe(true); // partiel ≠ perte totale
    expect(res.savedWordIds).toEqual(["w1", "w2"]);
    expect(res.pendingWordIds).toEqual(["w3", "w4"]);
    expect(res.error).toMatch(/en partie/);
  });

  it("4. erreur statistique uniquement → success, activitySaved false, pas d'erreur", async () => {
    const res = await runLessonSubmission(
      results,
      async () => {},
      async () => {
        throw new Error("duplicate key value violates unique constraint");
      },
    );
    expect(res.status).toBe("success");
    expect(res.ok).toBe(true);
    expect(res.activitySaved).toBe(false);
    expect(res.error).toBeUndefined();
  });

  it("9. retry après succès partiel → ne re-persiste que les mots restants", async () => {
    let n = 0;
    const first = await runLessonSubmission(
      results,
      async () => {
        n += 1;
        if (n === 3) throw new Error("network error");
      },
      async () => {},
    );
    expect(first.status).toBe("partial");
    expect(first.pendingWordIds).toEqual(["w3", "w4"]);

    const pendingResults = first.pendingWordIds.map((id) => w(id, [true]));
    const retryCalls: string[] = [];
    const retry = await runLessonSubmission(
      pendingResults,
      async (id) => {
        retryCalls.push(id);
      },
      async () => {},
    );
    expect(retry.status).toBe("success");
    expect(retryCalls).toEqual(["w3", "w4"]);
  });

  it("7/13. double soumission → un persist par mot à chaque passe, pas de doublon interne", async () => {
    const calls: string[] = [];
    const persist = async (id: string) => {
      calls.push(id);
    };
    const r1 = await runLessonSubmission(results, persist, async () => {});
    const r2 = await runLessonSubmission(results, persist, async () => {});
    expect(r1.status).toBe("success");
    expect(r2.status).toBe("success");
    expect(calls).toEqual(["w1", "w2", "w3", "w4", "w1", "w2", "w3", "w4"]);
    expect(new Set(r1.savedWordIds).size).toBe(4);
  });

  it("8. recomplétion d'une leçon déjà terminée → success sans erreur", async () => {
    const persist = async () => {}; // upsert idempotent (état existant)
    const r1 = await runLessonSubmission(results, persist, async () => {});
    const r2 = await runLessonSubmission(results, persist, async () => {});
    expect(r1.status).toBe("success");
    expect(r2.status).toBe("success");
  });

  it("10. session reprise → les mots sans tentatives sont ignorés", async () => {
    const calls: string[] = [];
    const res = await runLessonSubmission(
      [w("w1", []), w("w2", [true])],
      async (id) => {
        calls.push(id);
      },
      async () => {},
    );
    expect(calls).toEqual(["w2"]);
    expect(res.savedWordIds).toEqual(["w2"]);
  });

  it("12. activité déjà existante (idempotente) → success", async () => {
    const res = await runLessonSubmission(
      results,
      async () => {},
      async () => {}, // upsert ignoreDuplicates → no-op sans erreur
    );
    expect(res.status).toBe("success");
    expect(res.activitySaved).toBe(true);
  });
});

describe("classifyLessonSubmitError — classification minimale", () => {
  it("5. timeout → RETRYABLE", () => {
    expect(classifyLessonSubmitError("request timeout")).toEqual({
      code: "RETRYABLE",
      retryable: true,
    });
  });

  it("6. erreur réseau → RETRYABLE", () => {
    expect(classifyLessonSubmitError("fetch failed")).toEqual({
      code: "RETRYABLE",
      retryable: true,
    });
  });

  it("RLS / session expirée → AUTH (non retryable)", () => {
    expect(
      classifyLessonSubmitError("new row violates row-level security policy"),
    ).toEqual({ code: "AUTH", retryable: false });
  });

  it("contrainte unique/FK → VALIDATION (non retryable)", () => {
    expect(
      classifyLessonSubmitError("duplicate key value violates unique constraint"),
    ).toEqual({ code: "VALIDATION", retryable: false });
  });

  it("erreur inconnue → UNKNOWN", () => {
    expect(classifyLessonSubmitError("something unexpected")).toEqual({
      code: "UNKNOWN",
      retryable: false,
    });
  });
});
