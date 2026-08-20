import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertPlanScope,
  buildImportPlan,
  parseMasaqCsv,
  type HikmaOccurrenceInput,
} from "../lib/linguistic/masaq-plan";

// Fixtures RÉELLES (extrait sourate 1 du CSV MASAQ v2 — checksum vérifié — et
// les 29 occurrences Hikma correspondantes). Aucune donnée coranique inventée.
const here = dirname(fileURLToPath(import.meta.url));
const csvText = readFileSync(join(here, "fixtures", "masaq-fatihah.csv"), "utf8");
const hikmaFixture = JSON.parse(
  readFileSync(join(here, "fixtures", "masaq-fatihah-hikma.json"), "utf8"),
) as HikmaOccurrenceInput[];

const plan = buildImportPlan(hikmaFixture, csvText, { surah: 1 });

describe("masaq-plan — import Al-Fātiḥah (29/29, sourate 1 uniquement)", () => {
  it("aligne 29/29 occurrences Hikma ↔ MASAQ", () => {
    expect(plan.stats.hikmaOccurrences).toBe(29);
    expect(plan.stats.masaqWords).toBe(29);
    expect(plan.stats.aligned).toBe(29);
    expect(plan.occurrences).toHaveLength(29);
  });

  it("reproduit la classification 24F (13 EXACT / 14 ORTHO / 2 variantes)", () => {
    expect(plan.stats.exact).toBe(13);
    expect(plan.stats.exactOrthographic).toBe(14);
    expect(plan.stats.variantOrthographyDocumented).toBe(2);
  });

  it("0 MISSING / 0 EXTRA / 0 AMBIGUOUS", () => {
    expect(plan.stats.missing).toEqual([]);
    expect(plan.stats.extra).toEqual([]);
    expect(plan.stats.ambiguous).toBe(0);
  });

  it("périmètre strict : sourate 1 uniquement (min = max = 1)", () => {
    expect(plan.stats.minSurah).toBe(1);
    expect(plan.stats.maxSurah).toBe(1);
    expect(plan.occurrences.every((o) => o.surah === 1)).toBe(true);
  });

  it("source_record_id présent et unique pour chaque occurrence (idempotence)", () => {
    const ids = plan.occurrences.map((o) => o.source_record_id);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(29);
  });

  it("aucune racine, aucun schème (MASAQ n'en fournit pas)", () => {
    expect(plan.stats.roots).toBe(0);
    expect(plan.stats.schemes).toBe(0);
  });
});

describe("masaq-plan — segmentation / POS / morphologie / syntaxe", () => {
  it("segmente les clitiques sans créer de mots lexicaux", () => {
    expect(plan.stats.segmentCount).toBeGreaterThan(29);
    const kinds = new Set(
      plan.occurrences.flatMap((o) => o.segments.map((s) => s.segment_kind)),
    );
    expect(kinds).toEqual(
      expect.objectContaining(
        new Set([
          "STEM",
          "ARTICLE",
          "PARTICLE",
          "INFLECTIONAL_SUFFIX",
          "PRONOMINAL_SUFFIX",
          "OTHER",
        ]),
      ),
    );
  });

  it("chaque segment porte segment_no / morph_type / morph_tag", () => {
    for (const o of plan.occurrences) {
      for (const s of o.segments) {
        expect(s.segment_no).toBeGreaterThan(0);
        expect(["Prefix", "Stem", "Suffix"]).toContain(s.morph_type);
        expect(s.morph_tag.length).toBeGreaterThan(0);
      }
    }
  });

  it("POS : 22 tags distincts sur les 29 occurrences", () => {
    expect(plan.stats.distinctPosTags).toBe(22);
    expect(plan.occurrences.every((o) => o.masaq_pos.length > 0)).toBe(true);
  });

  it("morphologie (case_mood) et syntaxe couvertes", () => {
    const withCaseMood = plan.occurrences.filter((o) => o.masaq_case_mood.length > 0).length;
    const withSyntax = plan.occurrences.filter((o) => o.masaq_syntax.length > 0).length;
    expect(withCaseMood).toBe(29);
    expect(withSyntax).toBe(29);
  });

  it("gloss EN conservée comme évidence source (jamais glose FR)", () => {
    expect(plan.occurrences.every((o) => o.masaq_gloss_en.length > 0)).toBe(true);
  });
});

describe("masaq-plan — correspondance lemme Hikma ↔ stem MASAQ (documentée)", () => {
  it("reproduit la répartition 24F (2/4/3/2/18, 0 mapping créé)", () => {
    const counts: Record<string, number> = {};
    for (const o of plan.occurrences) {
      counts[o.lemma_mapping_status] = (counts[o.lemma_mapping_status] ?? 0) + 1;
    }
    expect(counts).toEqual({
      EXACT: 2,
      PARTIAL: 4,
      NORMALIZATION_DIFFERENCE: 3,
      LEXICAL_LEVEL_DIFFERENCE: 2,
      UNMAPPED: 18,
    });
  });
});

describe("masaq-plan — isolation & déterminisme", () => {
  it("ne mute jamais les occurrences Hikma en entrée", () => {
    const snapshot = JSON.stringify(hikmaFixture);
    buildImportPlan(hikmaFixture, csvText, { surah: 1 });
    expect(JSON.stringify(hikmaFixture)).toBe(snapshot);
  });

  it("déterminisme : deux exécutions produisent un plan identique", () => {
    const a = buildImportPlan(hikmaFixture, csvText, { surah: 1 });
    const b = buildImportPlan(hikmaFixture, csvText, { surah: 1 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("ne produit aucune instruction de modification de quran_words / gloses / lemmes", () => {
    // Le plan est additif : il ne référence que des données linguistiques
    // externes (occurrences MASAQ + segments). Aucun champ ne cible
    // quran_words / word_translations / lemma_translations / lemmas.
    for (const o of plan.occurrences) {
      const keys = Object.keys(o);
      expect(keys).not.toContain("quran_words");
      expect(keys).not.toContain("word_translations");
      expect(keys).not.toContain("lemma_translations");
      expect(keys).not.toContain("lemma_arabic_override");
      expect(keys).not.toContain("root");
      expect(keys).not.toContain("scheme");
    }
  });

  it("propage les ids Hikma (word_occurrence / quran_word / lemma) pour l'insert", () => {
    const withIds = hikmaFixture.map((h, i) => ({
      ...h,
      wordOccurrenceId: `occ-${i}`,
      quranWordId: `qw-${i}`,
      lemmaId: i < 3 ? `lm-${i}` : null,
    }));
    const p = buildImportPlan(withIds, csvText, { surah: 1 });
    expect(p.occurrences.every((o) => o.wordOccurrenceId?.startsWith("occ-"))).toBe(true);
    expect(p.occurrences.every((o) => o.quranWordId?.startsWith("qw-"))).toBe(true);
    expect(p.occurrences.filter((o) => o.lemmaId?.startsWith("lm-"))).toHaveLength(3);
  });
});

describe("masaq-plan — filtrage des segments vides MASAQ (Phase 27)", () => {
  // Fixture synthétique 108:2:2 لِرَبِّكَ : 3 segments réels + 2 marqueurs
  // Other_i3rab/None (artefacts MASAQ sans forme réelle).
  const header =
    "ID,Sura_No,Verse_No,Word_No,Segment_No,Word,Without_Diacritics,Segmented_Word," +
    "Morph_Tag,Morph_Type,Punctuation_Mark,Invariable_Declinable,Syntactic_Role," +
    "Possessive_Construct,Case_Mood,Case_Mood_Marker,Phrase,Phrasal_Function,Gloss";
  const rows = [
    ["1", "108", "2", "2", "1", "لِرَبِّكَ", "لربك", "ل", "PREP", "Prefix", "", "", "", "", "INVARIABLE", "", "", "", "your Lord"],
    ["2", "108", "2", "2", "2", "لِرَبِّكَ", "لربك", "رب", "NOUN_CONCRETE", "Stem", "", "", "PREP_OBJ", "", "GENITIVE", "", "", "", "your Lord"],
    ["3", "108", "2", "2", "3", "لِرَبِّكَ", "لربك", "ك", "POSS_PRON", "Suffix", "", "", "GEN_CONS", "", "GENITIVE", "", "", "", "your Lord"],
    ["4", "108", "2", "2", "4", "لِرَبِّكَ", "لربك", "None", "None", "Other_i3rab", "", "", "", "", "NOMINATIVE", "", "", "", "your Lord"],
    ["5", "108", "2", "2", "5", "لِرَبِّكَ", "لربك", "None", "None", "Other_i3rab", "", "", "", "", "INVARIABLE", "", "", "", "your Lord"],
  ];
  const csv = [header, ...rows.map((r) => r.join(","))].join("\n");
  const hikma: HikmaOccurrenceInput[] = [
    { surah: 108, ayah: 2, position: 2, text: "لِرَبِّكَ" },
  ];

  it("exclut les marqueurs Other_i3rab/None de la segmentation", () => {
    const p = buildImportPlan(hikma, csv, { surah: 108 });
    expect(p.occurrences[0]?.segments).toHaveLength(3);
    expect(p.occurrences[0]?.segments.map((s) => s.morph_type)).toEqual([
      "Prefix",
      "Stem",
      "Suffix",
    ]);
    expect(p.occurrences[0]?.segments.map((s) => s.segment_kind)).toEqual([
      "PARTICLE",
      "STEM",
      "PRONOMINAL_SUFFIX",
    ]);
  });

  it("les artefacts None ne polluent ni POS ni cas/mode", () => {
    const p = buildImportPlan(hikma, csv, { surah: 108 });
    expect(p.occurrences[0]?.masaq_pos).toEqual(["PREP", "NOUN_CONCRETE", "POSS_PRON"]);
    expect(p.occurrences[0]?.masaq_pos).not.toContain("None");
    // NOMINATIVE (issu du marqueur None) est exclu ; INVARIABLE provient du
    // préfixe ل réel.
    expect(p.occurrences[0]?.masaq_case_mood).toEqual(["INVARIABLE", "GENITIVE"]);
    expect(p.occurrences[0]?.masaq_case_mood).not.toContain("NOMINATIVE");
  });

  it("le nombre de segments du plan exclut les artefacts", () => {
    const p = buildImportPlan(hikma, csv, { surah: 108 });
    expect(p.stats.segmentCount).toBe(3);
  });
});

describe("masaq-plan — garde-fou de périmètre", () => {
  it("accepte un plan propre (29/29, sourate 1)", () => {
    expect(() => assertPlanScope(plan, 1)).not.toThrow();
    expect(assertPlanScope(plan, 1).aligned).toBe(29);
  });

  it("refuse une violation de sourate", () => {
    const bad = buildImportPlan(
      [...hikmaFixture, { surah: 2, ayah: 1, position: 1, text: "ذَٰلِكَ" }],
      csvText,
      { surah: 1 },
    );
    // Le plan construit reste borné à la sourate filtrée, mais l'occurrence
    // parasite se traduit par un MISSING côté Hikma (aucune ligne MASAQ).
    expect(bad.stats.missing.length).toBeGreaterThan(0);
    expect(() => assertPlanScope(bad, 1)).toThrow(/MISSING/);
  });

  it("parse le CSV MASAQ en lignes segment (Sura_No/Verse_No/Word_No)", () => {
    const rows = parseMasaqCsv(csvText);
    expect(rows.length).toBe(56);
    expect(rows.every((r) => r.Sura_No === "1")).toBe(true);
  });
});
