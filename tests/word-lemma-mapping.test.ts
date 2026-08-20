import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyPilotMappings,
  skeleton,
  type LemmaRow,
  type WordRow,
} from "../lib/quran/lemma-mapping";

const LEMMAS: LemmaRow[] = [
  { id: "L-allah", arabic: "الله" },
  { id: "L-rabb", arabic: "رب" },
  { id: "L-lillah", arabic: "لله" },
  { id: "L-rahman", arabic: "الرحمان" },
  { id: "L-hamd", arabic: "الحمد" },
];

const w = (
  id: string,
  arabic: string,
  meaning: string | null,
  lemma_id: string | null = null,
): WordRow => ({ id, arabic, meaning, lemma_id });

describe("migration 0022 (word_lemma_mapping) — contrat du schéma", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "0022_word_lemma_mapping.sql"),
    "utf8",
  );

  it("table créée avec les colonnes attendues", () => {
    expect(sql).toContain("create table if not exists public.word_lemma_mapping");
    for (const col of [
      "id uuid primary key default gen_random_uuid()",
      "word_id uuid not null references public.quran_words (id) on delete cascade",
      "lemma_id uuid not null references public.lemmas (id) on delete cascade",
      "source_id uuid not null references public.sources (id)",
      "mapping_method text not null",
      "confidence text not null",
      "evidence text",
      "editorial_notes text",
      "created_at timestamptz not null default now()",
      "updated_at timestamptz not null default now()",
    ]) {
      expect(sql).toContain(col);
    }
  });

  it("UNIQUE(word_id) — un mot n'a qu'un seul lemme mappé", () => {
    expect(sql).toMatch(/constraint word_lemma_mapping_word_key\s+unique\s*\(\s*word_id\s*\)/);
  });

  it("check constraints sur mapping_method et confidence", () => {
    expect(sql).toContain("mapping_method in ('exact_surface', 'editorial')");
    expect(sql).toContain("confidence in ('safe', 'review_required', 'rejected')");
  });

  it("indexes sur lemma_id, source_id, confidence", () => {
    expect(sql).toContain("word_lemma_mapping_lemma_id_idx");
    expect(sql).toContain("word_lemma_mapping_source_idx");
    expect(sql).toContain("word_lemma_mapping_confidence_idx");
  });

  it("RLS : lecture publique seule, aucune écriture applicative", () => {
    expect(sql).toContain("alter table public.word_lemma_mapping enable row level security");
    expect(sql).toContain('create policy "word_lemma_mapping_read"');
    expect(sql).toContain("for select");
    expect(sql).not.toMatch(/for insert/);
    expect(sql).not.toMatch(/for update/);
    expect(sql).not.toMatch(/for delete/);
  });
});

describe("skeleton() — normalisation technique (jamais preuve unique)", () => {
  it("retire les harakāt (même squelette pour مِنْ et مَنْ)", () => {
    const min = "\u0645\u0650\u0646"; // م + kasra + ن
    const man = "\u0645\u064E\u0646"; // م + fatha + ن
    expect(skeleton(min)).toBe("من");
    expect(skeleton(man)).toBe("من");
  });

  it("alif maqsura ى → ya ي (même suffixe pronominal)", () => {
    const ya = "\u064A"; // ي
    const maqsura = "\u0649"; // ى
    expect(skeleton(`رب${maqsura}`)).toBe(skeleton(`رب${ya}`));
  });

  it("آ (alef+madda précomposé) → alef", () => {
    expect(skeleton("\u0631\u0628\u0646\u0622")).toBe("ربنا");
  });
});

describe("classifyPilotMappings — pilote SAFE / REVIEW_REQUIRED / REJECTED", () => {
  const words: WordRow[] = [
    // الله : proclitique SAFE · vocatif REVIEW · faux positif REJECTED
    w("w-and-allah", "والله", "And Allah"),
    w("w-o-allah", "اللهم", "O Allah"),
    w("w-lahab", "اللهب", "Abu Lahab"),
    // رَبّ : pronominal SAFE · usure REJECTED · tanwīn REVIEW
    w("w-rabbika", "ربك", "your Lord"),
    w("w-riba", "ربا", "usury"),
    w("w-rabban", "ربا", "a Lord"),
    // لِلَّه : proclitique و SAFE
    w("w-lillah", "ولله", "And for Allah"),
    // forme déjà mappée natif → ignorée
    w("w-native", "ربك", "your Lord", "L-native"),
  ];

  const { safe, reviewRequired, rejected } = classifyPilotMappings(words, LEMMAS, new Map());

  it("الله + proclitique و → SAFE", () => {
    const c = safe.find((x) => x.wordId === "w-and-allah");
    expect(c).toBeDefined();
    expect(c!.proposedLemmaId).toBe("L-allah");
    expect(c!.category).toBe("SAFE");
    expect(c!.confidence).toBe("safe");
  });

  it("ٱللَّهُمَّ (vocatif) → REVIEW_REQUIRED, jamais SAFE", () => {
    const c = reviewRequired.find((x) => x.wordId === "w-o-allah");
    expect(c).toBeDefined();
    expect(c!.category).toBe("REVIEW_REQUIRED");
    expect(safe.find((x) => x.wordId === "w-o-allah")).toBeUndefined();
  });

  it("ل-ه-ب (Abu Lahab) → REJECTED", () => {
    const c = rejected.find((x) => x.wordId === "w-lahab");
    expect(c).toBeDefined();
    expect(c!.category).toBe("REJECTED");
  });

  it("رَبّ + suffixe pronominal -كَ → SAFE", () => {
    const c = safe.find((x) => x.wordId === "w-rabbika");
    expect(c).toBeDefined();
    expect(c!.proposedLemmaId).toBe("L-rabb");
  });

  it("رِبَا « usure » → REJECTED (pas de « Lord »)", () => {
    const c = rejected.find((x) => x.wordId === "w-riba");
    expect(c).toBeDefined();
  });

  it("رَبًّا « a Lord » (tanwīn, normalise en « ربا ») → REVIEW_REQUIRED, pas REJECTED", () => {
    const c = reviewRequired.find((x) => x.wordId === "w-rabban");
    expect(c).toBeDefined();
    expect(rejected.find((x) => x.wordId === "w-rabban")).toBeUndefined();
  });

  it("وَلِلَّهِ → SAFE (lemme لِلَّه)", () => {
    const c = safe.find((x) => x.wordId === "w-lillah");
    expect(c).toBeDefined();
    expect(c!.proposedLemmaId).toBe("L-lillah");
  });

  it("une forme déjà rattachée à un lemme natif est ignorée (jamais re-mappée)", () => {
    expect(safe.find((x) => x.wordId === "w-native")).toBeUndefined();
    expect(reviewRequired.find((x) => x.wordId === "w-native")).toBeUndefined();
    expect(rejected.find((x) => x.wordId === "w-native")).toBeUndefined();
  });

  it("aucun REVIEW_REQUIRED ni REJECTED dans le set SAFE", () => {
    const safeIds = new Set(safe.map((x) => x.wordId));
    expect(reviewRequired.some((x) => safeIds.has(x.wordId))).toBe(false);
    expect(rejected.some((x) => safeIds.has(x.wordId))).toBe(false);
  });

  it("wordId unique dans le set SAFE (UNIQUE(word_id) respectée)", () => {
    const ids = safe.map((x) => x.wordId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
