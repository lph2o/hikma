import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PEDAGOGICAL_LANGUAGE,
  resolveQuranWordMeaning,
  resolveWordMeaning,
} from "../lib/learning/language";
import { stripHtml } from "../lib/learning/queries";
import { buildWordBank } from "../lib/learning";
import type { QuranWord } from "../types/quran";
import type { LessonWordWithWord } from "../lib/learning";

const WORD: QuranWord = {
  id: "word-1",
  arabic: "ٱلرَّحْمَـٰنِ",
  transliteration: "l-raḥmāni",
  meaning: "the Most Merciful",
  root: null,
  lemma_id: null,
  source_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("langue pédagogique (Hikma → français par défaut)", () => {
  it("le français est la langue pédagogique par défaut", () => {
    expect(PEDAGOGICAL_LANGUAGE).toBe("fr");
  });

  it("un sens français disponible est choisi sans repli (leçon française)", () => {
    const meaning = resolveWordMeaning({
      en: "the Most Merciful",
      fr: "Le Tout Miséricordieux",
    });
    expect(meaning).toEqual({
      text: "Le Tout Miséricordieux",
      language: "fr",
      isFallback: false,
    });
  });

  it("un sens anglais n'est JAMAIS présenté comme français (repli explicite)", () => {
    const meaning = resolveWordMeaning({ en: "the Most Merciful" });
    expect(meaning).toEqual({
      text: "the Most Merciful",
      language: "en",
      isFallback: true,
    });
  });

  it("le repli utilise la meilleure donnée existante quelle que soit sa langue", () => {
    expect(resolveWordMeaning({ it: "il Compassionevole" })).toEqual({
      text: "il Compassionevole",
      language: "it",
      isFallback: true,
    });
  });

  it("en langue pédagogique anglaise, l'anglais n'est pas un repli", () => {
    expect(resolveWordMeaning({ en: "the Most Merciful" }, "en")).toEqual({
      text: "the Most Merciful",
      language: "en",
      isFallback: false,
    });
  });

  it("aucune donnée → null, sans invention", () => {
    expect(resolveWordMeaning({})).toEqual({
      text: null,
      language: "fr",
      isFallback: true,
    });
  });
});

describe("buildWordBank (la couche applicative sélectionne la langue)", () => {
  const lw: LessonWordWithWord = {
    id: "lw-1",
    lesson_id: "lesson-1",
    word_id: WORD.id,
    position: 1,
    is_new: true,
    importance: 1,
    created_at: "2026-01-01T00:00:00Z",
    word: WORD,
  };

  it("renseigne la langue réelle du sens (repli en → marqué)", () => {
    const [entry] = buildWordBank([lw]);
    expect(entry.meaning).toBe(WORD.meaning);
    expect(entry.meaningLanguage).toBe("en");
    expect(entry.meaningFallback).toBe(true);
  });

  it("resolveQuranWordMeaning suit la même règle de repli", () => {
    const m = resolveQuranWordMeaning(WORD);
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
    expect(m.text).toBe(WORD.meaning);
  });
});

describe("stripHtml (traductions Hamidullah avec notes de bas de page)", () => {
  it("retire le balisage HTML sans altérer le texte", () => {
    const raw =
      "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux. <sup foot_note=\"211620\">1</sup>";
    expect(stripHtml(raw)).toBe(
      "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux. 1",
    );
  });

  it("conserve un texte sans balisage tel quel", () => {
    expect(stripHtml("La louange appartient à Allah.")).toBe(
      "La louange appartient à Allah.",
    );
  });
});

describe("aucune traduction française n'est codée en dur dans les composants d'exercice", () => {
  const dir = join(process.cwd(), "components", "learn", "exercises");
  const files = ["index.tsx", "options-exercise.tsx"];

  it("les composants ne contiennent ni glossaire arabe ni sens mot-à-mot littéral", () => {
    for (const file of files) {
      const content = readFileSync(join(dir, file), "utf8");
      // Aucun texte arabe littéral : l'arabe vient exclusivement du moteur
      // (metadata.arabic / options), jamais d'une constante de composant.
      expect(content, file).not.toMatch(/[\u0600-\u06FF]{2,}/);
      // Aucune affectation directe de sens mot-à-mot.
      expect(content, file).not.toMatch(/meaning:\s*["']/);
    }
  });

  it("le français mot-à-mot ne vient que de la couche de langue, pas des composants", () => {
    const lang = readFileSync(join(process.cwd(), "lib", "learning", "language.ts"), "utf8");
    // Le point de sélection unique est le résolveur ; les composants n'en ont pas.
    expect(lang).toContain("PEDAGOGICAL_LANGUAGE");
  });
});
