import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveWordMeanings } from "../lib/learning/language";
import type { FrenchLexicalMeaning } from "../lib/learning/language";
import { buildWordBank } from "../lib/learning/lesson";
import type { LessonWordWithWord } from "../lib/learning/types";
import type { QuranWord } from "../types/quran";

const WORD: QuranWord = {
  id: "word-1",
  arabic: "يَوْم",
  transliteration: "yawm",
  meaning: "day",
  root: null,
  lemma_id: "lemma-yawm",
  source_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

const formFr = (text: string): FrenchLexicalMeaning => ({
  text,
  source: { name: "Hikma — lexique éditorial" },
  validated: true,
  validatedAt: "2026-01-01T00:00:00Z",
});

const lemmaFr = (text: string): FrenchLexicalMeaning => ({
  text,
  source: { name: "Kazimirski — Dictionnaire arabe-français (1860)" },
  validated: true,
  validatedAt: "2026-01-02T00:00:00Z",
});

describe("resolveWordMeanings — précédence forme > lemme > EN (Phase 17C)", () => {
  it("A. glose FORME validée disponible → utilisée", () => {
    const m = resolveWordMeanings(WORD, formFr("jour (forme)"), lemmaFr("jour (lemme)"));
    expect(m.text).toBe("jour (forme)");
    expect(m.language).toBe("fr");
    expect(m.isFallback).toBe(false);
    expect(m.isValidated).toBe(true);
    expect(m.translationSource).toContain("Hikma");
  });

  it("B. aucune FORME → glose LEMME validée utilisée", () => {
    const m = resolveWordMeanings(WORD, undefined, lemmaFr("jour (lemme)"));
    expect(m.text).toBe("jour (lemme)");
    expect(m.language).toBe("fr");
    expect(m.isFallback).toBe(false);
    expect(m.isValidated).toBe(true);
    expect(m.translationSource).toContain("Kazimirski");
  });

  it("C. FORME + LEMME → FORME prioritaire", () => {
    const m = resolveWordMeanings(WORD, formFr("forme"), lemmaFr("lemme"));
    expect(m.text).toBe("forme");
    expect(m.translationSource).toContain("Hikma");
  });

  it("D. LEMME PENDING (validated=false) → ignorée, fallback EN", () => {
    const pending: FrenchLexicalMeaning = {
      text: "jour",
      source: { name: "Kazimirski — Dictionnaire arabe-français (1860)" },
      validated: false,
      validatedAt: null,
    };
    const m = resolveWordMeanings(WORD, undefined, pending);
    expect(m.text).toBe("day");
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
    expect(m.isValidated).toBeUndefined();
  });

  it("E. aucune traduction FR → fallback EN existant conservé", () => {
    const m = resolveWordMeanings(WORD, undefined, undefined);
    expect(m.text).toBe("day");
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
  });

  it("F. mot sans lemme → le resolver ne dépend pas de lemma_id (comportement existant)", () => {
    const noLemma: QuranWord = { ...WORD, lemma_id: null };
    const m = resolveWordMeanings(noLemma, undefined, undefined);
    expect(m.text).toBe("day");
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
  });

  it("G. deux formes d'un même lemme reçoivent la même glose de lemme", () => {
    const form2: QuranWord = { ...WORD, id: "word-2", arabic: "يَوْمٍ" };
    const lemma = lemmaFr("jour");
    const m1 = resolveWordMeanings(WORD, undefined, lemma);
    const m2 = resolveWordMeanings(form2, undefined, lemma);
    expect(m1.text).toBe("jour");
    expect(m2.text).toBe("jour");
  });
});

describe("buildWordBank — intégration LEMME (Phase 20B, fix P1)", () => {
  const lessonWord = (word: QuranWord): LessonWordWithWord => ({
    id: `lw-${word.id}`,
    lesson_id: "lesson-1",
    word_id: word.id,
    position: 0,
    is_new: false,
    importance: 1,
    created_at: "2026-01-01T00:00:00Z",
    word,
  });

  it("A. forme sans word_translation mais avec lemma_translation validée → glose FR de lemme", () => {
    const word: QuranWord = { ...WORD, arabic: "يَوْمَ" };
    const lemmaMap = new Map([[word.id, lemmaFr("jour")]]);
    const bank = buildWordBank([lessonWord(word)], new Map(), lemmaMap);
    expect(bank[0].meaning).toBe("jour");
    expect(bank[0].meaningLanguage).toBe("fr");
    expect(bank[0].meaningFallback).toBe(false);
    expect(bank[0].isValidated).toBe(true);
  });

  it("B. trois formes du même lemme (يَوْمَ/يَوْمُ/يَوْمِ) → même glose 'jour'", () => {
    const forms = ["يَوْمَ", "يَوْمُ", "يَوْمِ"].map((f, i) => ({
      ...WORD,
      id: `word-${i}`,
      arabic: f,
    }));
    const lemmaMap = new Map(forms.map((w) => [w.id, lemmaFr("jour")]));
    const bank = buildWordBank(
      forms.map((w) => lessonWord(w)),
      new Map(),
      lemmaMap,
    );
    for (const entry of bank) {
      expect(entry.meaning).toBe("jour");
      expect(entry.meaningLanguage).toBe("fr");
      expect(entry.meaningFallback).toBe(false);
    }
  });

  it("C. FORME prioritaire sur LEMME (بِسْمِ → 'au nom de', pas la glose générique)", () => {
    const word: QuranWord = { ...WORD, id: "word-bismi", arabic: "بِسْمِ" };
    const formMap = new Map([[word.id, formFr("au nom de")]]);
    const lemmaMap = new Map([[WORD.lemma_id!, lemmaFr("nom / nommer")]]);
    const bank = buildWordBank([lessonWord(word)], formMap, lemmaMap);
    expect(bank[0].meaning).toBe("au nom de");
    expect(bank[0].translationSource).toContain("Hikma");
  });

  it("D. ni FORME ni LEMME → fallback EN existant conservé", () => {
    const word: QuranWord = { ...WORD, lemma_id: null, meaning: "the day" };
    const bank = buildWordBank([lessonWord(word)], new Map(), new Map());
    expect(bank[0].meaning).toBe("the day");
    expect(bank[0].meaningLanguage).toBe("en");
    expect(bank[0].meaningFallback).toBe(true);
  });

  it("E. mot grammatical (لَا) → glose fonctionnelle de lemme", () => {
    const word: QuranWord = { ...WORD, id: "word-la", arabic: "لَا", lemma_id: "lemma-la" };
    const lemmaMap = new Map([[word.id, lemmaFr("non / ne…pas")]]);
    const bank = buildWordBank([lessonWord(word)], new Map(), lemmaMap);
    expect(bank[0].meaning).toBe("non / ne…pas");
    expect(bank[0].meaningLanguage).toBe("fr");
  });

  it("F. le contrat du word bank est conservé (wordId, arabic, transliteration, ordre)", () => {
    const words = ["يَوْمَ", "رَسُولُ", "قَوْمٌ"].map((f, i) => ({
      ...WORD,
      id: `word-${i}`,
      arabic: f,
      transliteration: `t-${i}`,
    }));
    const wordsWithLemma = words.map((w, i) => ({
      ...w,
      lemma_id: i === 0 ? WORD.lemma_id : "lemma-2",
    }));
    const lemmaMap = new Map(wordsWithLemma.map((w) => [w.id, lemmaFr("jour")]));
    const bank = buildWordBank(
      wordsWithLemma.map((w) => lessonWord(w)),
      new Map(),
      lemmaMap,
    );
    expect(bank).toHaveLength(3);
    expect(bank.map((b) => b.arabic)).toEqual(["يَوْمَ", "رَسُولُ", "قَوْمٌ"]);
    expect(bank[0].wordId).toBe(wordsWithLemma[0].id);
    expect(bank[0].transliteration).toBe("t-0");
  });
});

describe("migration 0021 (lemma_translations) — contrat du schéma", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "0021_lemma_translations.sql"),
    "utf8",
  );

  it("table créée avec les colonnes attendues", () => {
    expect(sql).toContain("create table if not exists public.lemma_translations");
    for (const col of [
      "lemma_id uuid not null references public.lemmas (id) on delete cascade",
      "language text not null check (language in ('fr', 'en'))",
      "text text not null check (btrim(text) <> '')",
      "source_id uuid not null references public.sources (id)",
      "is_validated boolean not null default false",
      "validated_at timestamptz",
      "editorial_notes text",
      "created_at timestamptz not null default now()",
      "updated_at timestamptz not null default now()",
    ]) {
      expect(sql).toContain(col);
    }
  });

  it("UNIQUE (lemma_id, language, source_id) — doublon impossible", () => {
    expect(sql).toMatch(
      /unique\s*\(\s*lemma_id\s*,\s*language\s*,\s*source_id\s*\)/,
    );
  });

  it("invariant validation : proposé ⇔ validated_at NULL, validé ⇔ horodaté", () => {
    expect(sql).toContain("(is_validated = false and validated_at is null)");
    expect(sql).toContain("(is_validated = true and validated_at is not null)");
  });

  it("indexes : (lemma_id, language), (is_validated), (source_id)", () => {
    expect(sql).toContain("lemma_translations_lemma_lang_idx");
    expect(sql).toContain("lemma_translations_validated_idx");
    expect(sql).toContain("lemma_translations_source_idx");
  });

  it("RLS activée + lecture publique seule (aucune écriture applicative)", () => {
    expect(sql).toContain("alter table public.lemma_translations enable row level security");
    expect(sql).toContain('create policy "lemma_translations_read"');
    expect(sql).toContain("for select");
    expect(sql).not.toMatch(/for insert/);
    expect(sql).not.toMatch(/for update/);
    expect(sql).not.toMatch(/for delete/);
  });
});
