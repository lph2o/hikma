import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("PHASE 97B — CardContent avec gap doit être flex (pas de no-op silencieux)", () => {
  const review = read("components/learn/review-player.tsx");
  const shell = read("components/learn/exercises/hikma-exercise-shell.tsx");
  const landing = read("components/app/landing-product-story.tsx");
  const exercise = read("components/ui/exercise.tsx");
  const explanation = read("components/ui/hikma-explanation.tsx");

  it("review : la carte contient la question, le feedback est à plat en dessous (hors carte, hairline)", () => {
    expect(review).toContain('<CardContent className="flex flex-col gap-5 p-6">');
    expect(review).toContain('data-slot="review-feedback"');
    // FeedbackPanel rendu en dehors de la Card (même grammaire que HikmaExerciseShell)
    expect(review.indexOf("<FeedbackPanel")).toBeGreaterThan(review.indexOf("data-slot=\"review-feedback\""));
  });

  it("feedback : ExerciseFeedback est rendu à plat et centré (colonne flex, items-center, text-center, plus de boîte)", () => {
    expect(exercise).toContain('"flex flex-col items-center gap-3 text-center animate-feedback-in"');
    expect(exercise).not.toContain("rounded-2xl border p-4");
    expect(exercise).not.toContain("border-success/40 bg-success/8");
    // En-tête (icône + titre) et message centrés — cohérence verticale
    expect(exercise).toContain('className="flex items-center justify-center gap-2"');
    // Ta réponse / Réponse attendue : blocs compacts centrés (w-fit), moitié-moitié sur sm+
    expect(exercise).toContain('<div className="grid w-fit gap-3 sm:grid-cols-2">');
    expect(exercise).not.toContain('<div className="grid w-full gap-2 sm:grid-cols-2">');
    // Trigger « Comprendre ce mot » : icône + texte + chevron groupés et centrés
    // (plus de chevron isolé à droite)
    expect(explanation).toContain('className="min-h-11 w-full justify-center rounded-xl px-3 text-info-text hover:bg-info/8"');
    // icône + texte + chevron regroupés dans un même span flex (plus de chevron séparé à droite)
    expect(explanation).toMatch(/className="inline-flex min-w-0 items-center gap-2"/);
    expect(explanation).toMatch(/ChevronDownIcon[^>]*\/>\s*<\/span>/);
  });

  it("exercice : la ligne de séparation « Ce que tu apprends » est espacée du contenu (flex flex-col + gap-6)", () => {
    expect(shell).toContain('<CardContent className="flex flex-col gap-6 p-6 sm:gap-8 sm:p-8">');
  });

  it("landing : les préviews feedback utilisent aussi flex flex-col", () => {
    // 2 occurrences corrigées (ErrorPreview + autre preview) : toutes en flex flex-col
    expect(landing).not.toContain('<CardContent className="gap-6 p-6 sm:p-8">');
    expect(landing).toContain('<CardContent className="flex flex-col gap-6 p-6 sm:p-8">');
  });
});
