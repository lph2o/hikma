import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildLinguisticExplanation,
  caseFromCaseMood,
  caseText,
  categoryFromStemTag,
  isDisplayableSegment,
  roleFromSyntax,
  segmentLabel,
  type LinguisticEvidence,
} from "../lib/linguistic/explanation";
import { HikmaExplanation } from "../components/ui/hikma-explanation";
import { FeedbackPanel } from "../components/learn/exercises/options-exercise";
import { pedagogicalExplanation } from "../components/learn/exercises/pedagogical-feedback";
import type { GeneratedExercise } from "../lib/exercises";

function evidence(overrides: Partial<LinguisticEvidence> = {}): LinguisticEvidence {
  return {
    surah: 1,
    ayah: 1,
    position: 1,
    masaqWord: "بِسْمِ",
    stem: "اسم",
    glossEn: "in-(the)-name",
    pos: ["PREP", "NOUN_ABSTRACT"],
    caseMood: ["INVARIABLE", "GENITIVE"],
    syntax: ["PREP", "PREP_OBJ"],
    segments: [
      { segmentNo: 1, text: "ب", morphType: "Prefix", morphTag: "PREP", kind: "PARTICLE" },
      { segmentNo: 2, text: "اسم", morphType: "Stem", morphTag: "NOUN_ABSTRACT", kind: "STEM" },
    ],
    lemmaMappingStatus: "NORMALIZATION_DIFFERENCE",
    ...overrides,
  };
}

function exercise(overrides: Partial<GeneratedExercise> = {}): GeneratedExercise {
  return {
    type: "FORM_TO_MEANING",
    prompt: "Que signifie « بِسْمِ » ?",
    difficulty: 1,
    options: [],
    metadata: {
      targetWordId: "word-1",
      arabic: "بِسْمِ",
      transliteration: "bismi",
      meaning: "au nom (de)",
      meaningValidated: true,
    },
    ...overrides,
  };
}

describe("buildLinguisticExplanation — AVAILABLE ≠ INFERABLE", () => {
  it("1. retourne null sans données linguistiques", () => {
    expect(buildLinguisticExplanation(null)).toBeNull();
    expect(buildLinguisticExplanation(undefined)).toBeNull();
  });

  it("2. produit une décomposition pour un mot segmenté", () => {
    const result = buildLinguisticExplanation(evidence());
    expect(result?.blocks[0]?.type).toBe("decomposition");
    if (result?.blocks[0]?.type === "decomposition") {
      expect(result.blocks[0].segments).toHaveLength(2);
      expect(result.blocks[0].segments[0]).toEqual({
        text: "ب",
        label: "préposition",
        isClitic: true,
      });
      expect(result.blocks[0].segments[1]).toEqual({
        text: "اسم",
        label: "noyau (mot de base)",
        isClitic: false,
      });
    }
  });

  it("3. identifie un préfixe (particule) sans en faire un mot autonome", () => {
    const result = buildLinguisticExplanation(evidence());
    const decomposition = result?.blocks.find((b) => b.type === "decomposition");
    if (decomposition?.type === "decomposition") {
      const clitic = decomposition.segments.find((s) => s.isClitic);
      expect(clitic?.label).toBe("préposition");
    }
    expect(result?.blocks[0]?.type).toBe("decomposition");
  });

  it("4. identifie un suffixe pronominal", () => {
    const result = buildLinguisticExplanation(
      evidence({
        masaqWord: "عَلَيْهِمْ",
        stem: "علي",
        pos: ["PREP", "PRON_3MP"],
        caseMood: ["INVARIABLE", "GENITIVE"],
        syntax: ["PREP", "PREP_OBJ"],
        segments: [
          { segmentNo: 1, text: "علي", morphType: "Stem", morphTag: "PREP", kind: "STEM" },
          { segmentNo: 2, text: "هم", morphType: "Suffix", morphTag: "PRON_3MP", kind: "PRONOMINAL_SUFFIX" },
        ],
      }),
    );
    const decomposition = result?.blocks.find((b) => b.type === "decomposition");
    if (decomposition?.type === "decomposition") {
      expect(decomposition.segments[1]).toEqual({
        text: "هم",
        label: "suffixe pronominal",
        isClitic: true,
      });
    }
  });

  it("5. produit l'identité (POS) pour un mot simple", () => {
    const result = buildLinguisticExplanation(
      evidence({
        masaqWord: "رَبِّ",
        stem: "رب",
        pos: ["NOUN_CONCRETE"],
        caseMood: ["GENITIVE"],
        syntax: ["ADJ"],
        segments: [{ segmentNo: 1, text: "رب", morphType: "Stem", morphTag: "NOUN_CONCRETE", kind: "STEM" }],
      }),
    );
    const identity = result?.blocks.find((b) => b.type === "identity");
    expect(identity).toMatchObject({ type: "identity", category: "un nom" });
  });

  it("6. produit la morphologie (cas)", () => {
    const result = buildLinguisticExplanation(
      evidence({
        masaqWord: "يَوْمِ",
        stem: "يوم",
        pos: ["NOUN_ABSTRACT"],
        caseMood: ["GENITIVE"],
        syntax: ["GEN_CONS"],
        segments: [{ segmentNo: 1, text: "يوم", morphType: "Stem", morphTag: "NOUN_ABSTRACT", kind: "STEM" }],
      }),
    );
    const morphology = result?.blocks.find((b) => b.type === "morphology");
    expect(morphology).toMatchObject({ type: "morphology", caseText: "au génitif (complément du nom ou après préposition)" });
  });

  it("7. produit la syntaxe (rôle) quand la morphologie est absente", () => {
    // Pas de cas disponible → la syntaxe devient le bloc de soutien de l'identité
    // (le génitif et le rôle « complément du nom » seraient redondants).
    const result = buildLinguisticExplanation(
      evidence({
        masaqWord: "يَوْمِ",
        stem: "يوم",
        pos: ["NOUN_ABSTRACT"],
        caseMood: [],
        syntax: ["GEN_CONS"],
        segments: [{ segmentNo: 1, text: "يوم", morphType: "Stem", morphTag: "NOUN_ABSTRACT", kind: "STEM" }],
      }),
    );
    const syntax = result?.blocks.find((b) => b.type === "syntax");
    expect(syntax).toMatchObject({ type: "syntax", roleText: "complément du nom (annexion)" });
  });

  it("8. combine plusieurs données mais plafonne à 2 blocs pertinents", () => {
    const result = buildLinguisticExplanation(
      evidence({
        masaqWord: "ٱلْحَمْدُ",
        stem: "حمد",
        pos: ["DET", "GERUND"],
        caseMood: ["NOMINATIVE"],
        syntax: ["SUBJ"],
        segments: [
          { segmentNo: 1, text: "ال", morphType: "Prefix", morphTag: "DET", kind: "ARTICLE" },
          { segmentNo: 2, text: "حمد", morphType: "Stem", morphTag: "GERUND", kind: "STEM" },
        ],
      }),
    );
    expect(result?.blocks).toHaveLength(2);
    expect(result?.blocks.map((b) => b.type)).toEqual(["decomposition", "identity"]);
  });

  it("9. données absentes → null (aucune fabrication)", () => {
    const empty = evidence({
      segments: [],
      caseMood: [],
      syntax: [],
      pos: [],
      stem: null,
    });
    expect(buildLinguisticExplanation(empty)).toBeNull();
  });

  it("10. cas ambigu (plusieurs cas) → morphologie omise", () => {
    const result = buildLinguisticExplanation(
      evidence({
        caseMood: ["NOMINATIVE", "GENITIVE"],
        syntax: ["SUBJ"],
      }),
    );
    expect(result?.blocks.find((b) => b.type === "morphology")).toBeUndefined();
  });

  it("11. mapping de lemme non vérifié → aucune affirmation de famille", () => {
    // La couche linguistique ne produit JAMAIS de bloc « lemme » à partir de
    // MASAQ : le mapping est documentaire, jamais converti en assertion.
    const result = buildLinguisticExplanation(
      evidence({ lemmaMappingStatus: "EXACT", caseMood: [], syntax: [] }),
    );
    expect(result?.blocks.find((b) => b.type === "identity")).toBeDefined();
    // Le type `LinguisticBlock` ne contient pas de variante « lemma » : le mapping
    // MASAQ est documentaire et n'est jamais converti en assertion de famille.
  });

  it("12. AVAILABLE ≠ INFERABLE : aucune donnée inventée depuis les tags", () => {
    const result = buildLinguisticExplanation(
      evidence({
        segments: [{ segmentNo: 1, text: "xyz", morphType: "Stem", morphTag: "UNKNOWN_TAG", kind: "STEM" }],
        caseMood: [],
        syntax: [],
        pos: ["UNKNOWN_TAG"],
      }),
    );
    // Le tag inconnu ne produit ni identité, ni morphologie, ni syntaxe.
    expect(result).toBeNull();
  });
});

describe("tables de correspondance déterministes", () => {
  it("segmentLabel : article, particule, suffixe, noyau", () => {
    expect(segmentLabel("Prefix", "DET", "ARTICLE")).toBe("article défini");
    expect(segmentLabel("Prefix", "CONJ", "PARTICLE")).toBe("conjonction");
    expect(segmentLabel("Prefix", "IMPERF_PREF", "PARTICLE")).toBe("préfixe de l'inaccompli");
    expect(segmentLabel("Stem", "IV", "STEM")).toBe("noyau (mot de base)");
    expect(segmentLabel("Suffix", "PRON_3MP", "PRONOMINAL_SUFFIX")).toBe("suffixe pronominal");
  });

  it("categoryFromStemTag : nom / verbe / pronom / particule", () => {
    expect(categoryFromStemTag("NOUN_CONCRETE")).toBe("un nom");
    expect(categoryFromStemTag("GERUND")).toBe("un nom verbal (maṣdar)");
    expect(categoryFromStemTag("PV")).toBe("un verbe à l'accompli");
    expect(categoryFromStemTag("IV")).toBe("un verbe à l'inaccompli");
    expect(categoryFromStemTag("PRON")).toBe("un pronom");
    expect(categoryFromStemTag("PREP")).toBeNull(); // couvert par la décomposition
    expect(categoryFromStemTag(null)).toBeNull();
  });

  it("caseFromCaseMood : retire INVARIABLE, refuse l'ambigu", () => {
    expect(caseFromCaseMood(["INVARIABLE", "GENITIVE"])).toBe("GENITIVE");
    expect(caseFromCaseMood(["INVARIABLE"])).toBe("INVARIABLE");
    expect(caseFromCaseMood(["NOMINATIVE", "GENITIVE"])).toBeNull();
    expect(caseFromCaseMood([])).toBeNull();
  });

  it("caseText : formulation pédagogique, jamais un tag brut", () => {
    expect(caseText("GENITIVE")).toContain("génitif");
    expect(caseText("NOMINATIVE")).toContain("nominatif");
    expect(caseText("UNKNOWN")).toBeNull();
  });

  it("caseText : JUSSIVE est un MODE, pas un cas", () => {
    expect(caseText("JUSSIVE")).toContain("jussif");
    expect(caseText("JUSSIVE")).toContain("mode");
    expect(caseText("JUSSIVE")).not.toContain("cas");
  });

  it("categoryFromStemTag : nouveaux tags (numéral, comparatif, intensif, passif, adverbe)", () => {
    expect(categoryFromStemTag("NOUN_NUM")).toBe("un nom (numéral)");
    expect(categoryFromStemTag("ADJ_COMP")).toBe("un adjectif (comparatif)");
    expect(categoryFromStemTag("ADJ_INTENS")).toBe("un adjectif (intensif)");
    expect(categoryFromStemTag("IV_PASS")).toBe("un verbe passif (inaccompli)");
    expect(categoryFromStemTag("PV_PASS")).toBe("un verbe passif (accompli)");
    expect(categoryFromStemTag("ADV")).toBe("un adverbe");
    // particules : couvertes par la décomposition, pas de bloc identité.
    expect(categoryFromStemTag("ANNUL_PART")).toBeNull();
    expect(categoryFromStemTag("JUSSIVE_PART")).toBeNull();
  });

  it("roleFromSyntax : prédicat / copule / explétif / complément de temps", () => {
    expect(roleFromSyntax(["PRED"])).toBe("prédicat");
    expect(roleFromSyntax(["PART_COP_PRED"])).toBe("prédicat");
    expect(roleFromSyntax(["V_COP_PRED"])).toBe("prédicat");
    expect(roleFromSyntax(["SUBJ_COP_PART"])).toBe("sujet");
    expect(roleFromSyntax(["SUBJ_COP_V"])).toBe("sujet");
    expect(roleFromSyntax(["EXPLET"])).toBe("pronom de renforcement");
    expect(roleFromSyntax(["ADV_TIME"])).toBe("complément de temps");
    // rôles de particules/verbes filtrés : pas de bloc syntaxe.
    expect(roleFromSyntax(["ANNUL_PART"])).toBeNull();
    expect(roleFromSyntax(["IV_COP"])).toBeNull();
    expect(roleFromSyntax(["IV_PASS"])).toBeNull();
  });

  it("segmentLabel : suffixes possessif/sujet + féminin + désinence indéfinie", () => {
    expect(segmentLabel("Suffix", "POSS_PRON", "PRONOMINAL_SUFFIX")).toBe("suffixe possessif");
    expect(segmentLabel("Suffix", "SUBJ_PRON", "PRONOMINAL_SUFFIX")).toBe("suffixe sujet");
    expect(segmentLabel("Suffix", "NSUFF_FEM_PL", "INFLECTIONAL_SUFFIX")).toBe("marque du féminin pluriel");
    expect(segmentLabel("Suffix", "NSUFF_FEM_SG", "INFLECTIONAL_SUFFIX")).toBe("marque du féminin singulier");
    expect(segmentLabel("Suffix", "CASE_INDEF_(ACC_GEN)", "INFLECTIONAL_SUFFIX")).toBe("désinence indéfinie (accusatif/génitif)");
    expect(segmentLabel("Prefix", "CV_PREF", "PARTICLE")).toBe("préfixe de l'impératif");
    expect(segmentLabel("Stem", "JUSSIVE_PART", "STEM")).toBe("particule du jussif (لَمْ)");
  });

  it("isDisplayableSegment : filtre (null), None, null, '' et Other_i3rab", () => {
    const seg = (over: Partial<LinguisticEvidence["segments"][number]> = {}) => ({
      segmentNo: 1,
      text: "x",
      morphType: "Stem",
      morphTag: "NOUN_ABSTRACT",
      kind: "STEM" as const,
      ...over,
    });
    expect(isDisplayableSegment(seg())).toBe(true);
    expect(isDisplayableSegment(seg({ text: "(null)" }))).toBe(false);
    expect(isDisplayableSegment(seg({ text: "None" }))).toBe(false);
    expect(isDisplayableSegment(seg({ text: "null" }))).toBe(false);
    expect(isDisplayableSegment(seg({ text: "" }))).toBe(false);
    expect(isDisplayableSegment(seg({ morphType: "Other_i3rab", morphTag: "None", text: "None" }))).toBe(false);
    expect(isDisplayableSegment(seg({ morphTag: "None" }))).toBe(false);
  });

  it("roleFromSyntax : retire les rôles de particules, refuse l'ambigu", () => {
    expect(roleFromSyntax(["PREP", "PREP_OBJ"])).toBe("complément de préposition");
    expect(roleFromSyntax(["SUBJ"])).toBe("sujet");
    expect(roleFromSyntax(["CONJ", "NON_INFLECT"])).toBeNull();
    expect(roleFromSyntax(["SUBJ", "OBJ"])).toBeNull();
  });
});

describe("intégration pedagogicalExplanation", () => {
  it("enrichit l'explication après erreur avec la couche linguistique", () => {
    const ex = exercise({
      metadata: {
        targetWordId: "word-1",
        arabic: "بِسْمِ",
        transliteration: "bismi",
        meaning: "au nom (de)",
        meaningValidated: true,
        linguisticEvidence: evidence(),
      },
    });
    const data = pedagogicalExplanation(ex);
    expect(data).not.toBeNull();
    expect(data?.linguistic?.blocks[0]?.type).toBe("decomposition");
  });

  it("conserve l'explication classique en l'absence de données MASAQ", () => {
    const ex = exercise();
    const data = pedagogicalExplanation(ex);
    expect(data).not.toBeNull();
    expect(data?.meaning).toBe("au nom (de)");
    expect(data?.linguistic).toBeNull();
  });

  it("conserve l'audio disponible et omet l'audio absent", () => {
    const withAudio = exercise({
      metadata: {
        targetWordId: "word-1",
        arabic: "بِسْمِ",
        transliteration: "bismi",
        meaning: "au nom (de)",
        audioUrl: "https://audio/muallim.mp3",
        linguisticEvidence: evidence(),
      },
    });
    expect(pedagogicalExplanation(withAudio)?.audioUrl).toBe("https://audio/muallim.mp3");

    const withoutAudio = exercise();
    expect(pedagogicalExplanation(withoutAudio)?.audioUrl).toBeNull();
  });

  it("conserve la branche LEMMA_RELATION et y ajoute la couche linguistique", () => {
    const ex = exercise({
      type: "LEMMA_RELATION",
      metadata: {
        targetWordId: "word-1",
        arabic: "بِسْمِ",
        transliteration: "bismi",
        meaning: "au nom (de)",
        lemma: { lemmaId: "lm-1", siblings: [{ wordId: "word-2", arabic: "اسم" }] },
        linguisticEvidence: evidence(),
      },
    });
    const data = pedagogicalExplanation(ex);
    expect(data?.kind).toBe("lemma");
    expect(data?.lemmaRelation).toBeTruthy();
    expect(data?.linguistic?.blocks[0]?.type).toBe("decomposition");
  });
});

describe("rendu HikmaExplanation", () => {
  it("affiche la décomposition RTL sans exposer les tags MASAQ", () => {
    const data = pedagogicalExplanation(
      exercise({
        metadata: {
          targetWordId: "word-1",
          arabic: "بِسْمِ",
          transliteration: "bismi",
          meaning: "au nom (de)",
          meaningValidated: true,
          linguisticEvidence: evidence(),
        },
      }),
    );
    const html = renderToStaticMarkup(
      React.createElement(HikmaExplanation, { data: data!, defaultOpen: true }),
    );
    expect(html).toContain("Décomposition");
    expect(html).toContain("préposition");
    expect(html).not.toContain("NOUN_ABSTRACT"); // jamais de tag brut
    expect(html).not.toContain("GENITIVE");
  });

  it("rend « Comprendre ce mot » disponible (replié) après une réponse correcte", () => {
    const ex = exercise();
    const result = { correct: true, correctOption: null, explanation: null };
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, { result, exercise: ex, correctContent: "au nom (de)" }),
    );
    expect(html).toContain("Comprendre ce mot");
    expect(html).not.toContain("Ta réponse");
    expect(html).not.toContain("Réponse attendue");
  });
});
