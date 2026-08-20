import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PEDAGOGICAL_LANGUAGE,
  resolveWordMeanings,
  type FrenchLexicalMeaning,
} from "../lib/learning/language";
import { buildWordBank } from "../lib/learning";
import type { QuranWord } from "../types/quran";
import type { LessonWordWithWord } from "../lib/learning";

// ---------------------------------------------------------------------------
// Phase 7 (Voie B) — lexique français Hikma : résolution FR → EN fallback.
// Une traduction française ne devient PÉDAGOGIQUEMENT ACTIVE que si elle est
// explicitement VALIDÉE (is_validated=true). Le FR proposé est invisible.
// ---------------------------------------------------------------------------

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

const HIKMA_SOURCE = { name: "Hikma — lexique éditorial" };

function validatedFr(text: string, updatedAt = "2026-01-02T00:00:00Z"): FrenchLexicalMeaning {
  return {
    text,
    source: HIKMA_SOURCE,
    validated: true,
    validatedAt: updatedAt,
  };
}

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

describe("résolution FR validé → traduction pédagogique principale", () => {
  it("FR validé → FR sélectionné", () => {
    const m = resolveWordMeanings(WORD, validatedFr("le Tout Miséricordieux"));
    expect(m.text).toBe("le Tout Miséricordieux");
  });

  it("FR validé → language=fr", () => {
    const m = resolveWordMeanings(WORD, validatedFr("le Tout Miséricordieux"));
    expect(m.language).toBe("fr");
  });

  it("FR validé → isFallback=false", () => {
    const m = resolveWordMeanings(WORD, validatedFr("le Tout Miséricordieux"));
    expect(m.isFallback).toBe(false);
  });

  it("FR validé → source correcte", () => {
    const m = resolveWordMeanings(WORD, validatedFr("le Tout Miséricordieux"));
    expect(m.translationSource).toBe("Hikma — lexique éditorial");
  });

  it("FR validé → isValidated=true", () => {
    const m = resolveWordMeanings(WORD, validatedFr("le Tout Miséricordieux"));
    expect(m.isValidated).toBe(true);
  });
});

describe("résolution FR proposé → ignoré (fallback EN)", () => {
  it("FR proposé (validated=false) → ignoré", () => {
    const proposed: FrenchLexicalMeaning = {
      text: "le Tout Miséricordieux",
      source: HIKMA_SOURCE,
      validated: false,
      validatedAt: null,
    };
    const m = resolveWordMeanings(WORD, proposed);
    expect(m.text).toBe(WORD.meaning);
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
    expect(m.isValidated).toBeFalsy();
  });
});

describe("résolution FR absent → fallback EN", () => {
  it("FR absent → fallback EN (isFallback=true)", () => {
    const m = resolveWordMeanings(WORD, undefined);
    expect(m.text).toBe(WORD.meaning);
    expect(m.language).toBe("en");
    expect(m.isFallback).toBe(true);
  });

  it("aucun FR ni EN → text=null, sans invention", () => {
    const noMeaning: QuranWord = { ...WORD, meaning: null };
    const m = resolveWordMeanings(noMeaning, undefined);
    expect(m.text).toBeNull();
  });
});

describe("résolution multi-sources (règle purement technique)", () => {
  it("la plus récente (updated_at) est retenue par le requêteur — le résolveur reçoit une seule entrée", () => {
    // La sélection « plus récente » est faite par getValidatedFrenchMeanings
    // (ORDER BY updated_at DESC, première ligne par mot). Ici on vérifie que
    // le résolveur utilise l'entrée fournie sans ambiguïté.
    const m = resolveWordMeanings(WORD, validatedFr("le Plus Récent"));
    expect(m.text).toBe("le Plus Récent");
    // Documenté : la plus récente n'est PAS éditorialement la meilleure.
    expect(m.translationSource).toBe("Hikma — lexique éditorial");
  });
});

describe("buildWordBank (Phase 7 : FR validé sinon EN fallback)", () => {
  it("avec FR validé → meaning FR, non fallback, validé", () => {
    const bank = buildWordBank([lw], new Map([[WORD.id, validatedFr("le Tout Miséricordieux")]]));
    const [entry] = bank;
    expect(entry.meaning).toBe("le Tout Miséricordieux");
    expect(entry.meaningLanguage).toBe("fr");
    expect(entry.meaningFallback).toBe(false);
    expect(entry.translationSource).toBe("Hikma — lexique éditorial");
    expect(entry.isValidated).toBe(true);
  });

  it("sans FR validé → fallback EN (comportement Phase 5 préservé)", () => {
    const [entry] = buildWordBank([lw]);
    expect(entry.meaning).toBe(WORD.meaning);
    expect(entry.meaningLanguage).toBe("en");
    expect(entry.meaningFallback).toBe(true);
    expect(entry.isValidated).toBe(false);
  });

  it("avec FR proposé (absent de la Map) → fallback EN", () => {
    const bank = buildWordBank([lw], new Map());
    const [entry] = bank;
    expect(entry.meaning).toBe(WORD.meaning);
    expect(entry.meaningFallback).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Données : migration 0019 (SQL réel) — contraintes, invariant, pas de backfill.
// ---------------------------------------------------------------------------

describe("migration 0019 (word_translations) — contrat du schéma", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "0019_word_translations.sql"),
    "utf8",
  );

  it("table créée avec les colonnes attendues", () => {
    expect(sql).toContain("create table if not exists public.word_translations");
    for (const col of [
      "id uuid primary key default gen_random_uuid()",
      "word_id uuid not null references public.quran_words (id) on delete cascade",
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

  it("UNIQUE (word_id, language, source_id) — doublon impossible", () => {
    expect(sql).toMatch(
      /unique\s*\(\s*word_id\s*,\s*language\s*,\s*source_id\s*\)/,
    );
  });

  it("invariant validation : proposé ⇔ validated_at NULL, validé ⇔ horodaté", () => {
    expect(sql).toContain("(is_validated = false and validated_at is null)");
    expect(sql).toContain("(is_validated = true and validated_at is not null)");
  });

  it("source_id obligatoire, sans ON DELETE SET NULL (provenance conservée)", () => {
    expect(sql).toContain("source_id uuid not null references public.sources (id)");
    expect(sql).not.toContain("on delete set null");
  });

  it("index : (word_id, language), (is_validated), (source_id)", () => {
    expect(sql).toContain("word_translations_word_lang_idx");
    expect(sql).toContain("word_translations_validated_idx");
    expect(sql).toContain("word_translations_source_idx");
  });

  it("RLS activée + unique policy SELECT public (aucune écriture applicative)", () => {
    expect(sql).toContain("alter table public.word_translations enable row level security");
    expect(sql).toContain('create policy "word_translations_read"');
    expect(sql).toContain("for select");
    // Aucune policy INSERT / UPDATE / DELETE.
    expect(sql).not.toMatch(/for insert/);
    expect(sql).not.toMatch(/for update/);
    expect(sql).not.toMatch(/for delete/);
  });

  it("source « Hikma — lexique éditorial » insérée (idempotente)", () => {
    expect(sql).toContain("Hikma — lexique éditorial");
    expect(sql).toContain("on conflict (name, version) do nothing");
  });
});

describe("pas de backfill EN (l'anglais reste dans quran_words.meaning)", () => {
  it("le seed n'insère que des lignes fr", () => {
    const seed = readFileSync(
      join(process.cwd(), "scripts", "seed-word-translations.ts"),
      "utf8",
    );
    expect(seed).toContain('language: "fr"');
    expect(seed).not.toContain('language: "en"');
  });

  it("le seed n'insère aucune ligne validée", () => {
    const seed = readFileSync(
      join(process.cwd(), "scripts", "seed-word-translations.ts"),
      "utf8",
    );
    expect(seed).toContain("is_validated: false");
    expect(seed).toContain("validated_at: null");
  });
});

describe("couverture des 8 mots du curriculum (propositions Hikma)", () => {
  it("8 propositions distinctes, toutes en proposition (jamais validées d'office)", () => {
    const seed = readFileSync(
      join(process.cwd(), "scripts", "seed-word-translations.ts"),
      "utf8",
    );
    // 8 entrées dans PROPOSALS : une proposition = une ligne « fr: ... ».
    const frProposals = (seed.match(/fr: "/g) ?? []).length;
    expect(frProposals).toBe(8);
    // Aucun is_validated: true dans le seed.
    expect(seed).not.toContain("is_validated: true");
  });

  it("le seed exige exactement 8 mots distincts du curriculum", () => {
    const seed = readFileSync(
      join(process.cwd(), "scripts", "seed-word-translations.ts"),
      "utf8",
    );
    expect(seed).toContain("Attendu ${PROPOSALS.length} mots distincts");
  });
});

describe("langue pédagogique inchangée (Phase 5)", () => {
  it("le français reste la langue pédagogique par défaut", () => {
    expect(PEDAGOGICAL_LANGUAGE).toBe("fr");
  });
});
