import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const landing = readFileSync(join(process.cwd(), "components/app/landing.tsx"), "utf8");
const story = readFileSync(join(process.cwd(), "components/app/landing-product-story.tsx"), "utf8");

describe("landing Phase 7C — contrats de composition", () => {
  it("conserve la route réelle et les CTA premium", () => {
    expect(landing).toContain('href="/learn/basmala"');
    expect(landing).toContain("Commencer avec Al-Fatiha");
    expect(landing).toContain("Découvrir la méthode");
    expect(story).toContain("Commencer à comprendre");
  });

  it("conserve le fil rouge Quranic Arabic et sa composition secondaire", () => {
    expect(story).toContain("ٱلرَّحْمَـٰنِ");
    expect(story).toContain("ar-Raḥmān");
    expect(story).toContain("Le Tout Miséricordieux");
    expect(story).toContain("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  });

  it("ne duplique pas le wrapper HikmaExplanation dans la scène de feedback", () => {
    expect(story).not.toContain("<HikmaExplanation");
    expect(story.match(/explanationData=/g)).toHaveLength(1);
  });

  it("déclare les quatre actes narratifs hors hero et CTA final", () => {
    for (const id of ["product-proof", "one-word", "feedback", "how-it-works"]) {
      expect(story).toContain(`id=\"${id}\"`);
    }
  });

  it("préserve les cinq étapes et leur accent de progression", () => {
    expect(story).toContain("Les cinq étapes de la méthode Hikma");
    for (const stage of ["Voir le mot", "Comprendre son sens", "Se rappeler", "Produire", "Recevoir un retour"]) {
      expect(story).toContain(stage);
    }
    expect(story).toContain("border-hikma-gold/60");
  });

  it("applique une atmosphère dédiée sans changer la composition de la landing", () => {
    expect(landing).toContain('className="landing-shell');
    const globals = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(globals).toContain("--landing-atmosphere:");
    expect(globals).toContain("--landing-preview-shadow:");
    expect(globals).toContain(".landing-product-preview-card");
  });
});
