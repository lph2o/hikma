import { describe, expect, it } from "vitest";
import {
  alignKey,
  classifyAlignment,
  classifyLemmaMatch,
  classifySegment,
  idempotencyKey,
  normalizeOrthographic,
} from "../lib/linguistic/masaq";

describe("masaq normalizeOrthographic", () => {
  it("retire tatweel et diacritiques", () => {
    expect(normalizeOrthographic("بِسْمِ")).toBe("بسم");
    expect(normalizeOrthographic("مَـٰلِكِ")).toBe("مالك");
  });

  it("normalise wasla et dagger-alif", () => {
    expect(normalizeOrthographic("ٱلْحَمْدُ")).toBe("الحمد");
    expect(normalizeOrthographic("صِرَٰطَ")).toBe("صراط");
  });

  it("normalise les hamzées et alif madda", () => {
    expect(normalizeOrthographic("أَنْعَمْتَ")).toBe("انعمت");
    expect(normalizeOrthographic("آلِ")).toBe("ال");
    expect(normalizeOrthographic("ٱلضَّآلِّينَ")).toBe("الضالين");
  });

  it("retire TOUTES les occurrences de tatweel (bug fix multi-tatweel)", () => {
    // النَّفَّاثَاتِ avec DEUX tatweels (U+0640) — régression Phase 26.
    expect(normalizeOrthographic("النَّفَّـٰثَـٰتِ")).toBe("النفاثات");
    // deux tatweels purs (sans dagger-alif).
    expect(normalizeOrthographic("بِـيْـتِ")).toBe("بيت");
    expect(normalizeOrthographic("ــ")).toBe("");
  });

  it("normalise alif maqṣūra (ى) vers yā' (ي)", () => {
    expect(normalizeOrthographic("ٱلَّذِى")).toBe("الذي");
    expect(normalizeOrthographic("فِى")).toBe("في");
  });

  it("supprime les marques coraniques en exposant (ۥ / ۢ / ۣ)", () => {
    expect(normalizeOrthographic("لَّهُۥ")).toBe("له"); // petit wāw (U+06E5)
    expect(normalizeOrthographic("أَحَدٌۢ")).toBe("احد"); // petit mīm / iqlab (U+06E2)
    expect(normalizeOrthographic("اَۣل")).toBe("ال"); // petit mīm bas (U+06E3)
  });

  it("combine plusieurs variantes dans une même chaîne", () => {
    expect(normalizeOrthographic("ٱلنَّفَّـٰثَـٰتِۢ")).toBe("النفاثات");
  });

  it("ne fusionne PAS des mots réellement différents (absence de collision)", () => {
    expect(normalizeOrthographic("شَرِّ")).not.toBe(normalizeOrthographic("غَيْرِ"));
    expect(normalizeOrthographic("نَاسِ")).not.toBe(normalizeOrthographic("نَعْبُدُ"));
    expect(normalizeOrthographic("قُلْ")).not.toBe(normalizeOrthographic("قِيلَ"));
  });
});

describe("masaq classifyAlignment (cas réels Al-Fātiḥah)", () => {
  it("EXACT : chaîne identique après diacritiques", () => {
    expect(classifyAlignment("إِيَّاكَ", "إِيَّاكَ")).toBe("EXACT");
  });

  it("EXACT_ORTHOGRAPHIC par normalisation", () => {
    expect(classifyAlignment("صِرَٰطَ", "صِرَاطَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("ٱللَّهِ", "اللَّهِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("مَـٰلِكِ", "مَالِكِ")).toBe("EXACT_ORTHOGRAPHIC");
  });

  it("VARIANT_ORTHOGRAPHY_DOCUMENTED pour alif élidé", () => {
    expect(classifyAlignment("ٱلرَّحْمَـٰنِ", "الرَّحْمَنِ")).toBe(
      "VARIANT_ORTHOGRAPHY_DOCUMENTED"
    );
  });

  it("AMBIGUOUS si les formes diffèrent réellement", () => {
    expect(classifyAlignment("شَرِّ", "غَيْرِ")).toBe("AMBIGUOUS");
  });

  it("Phase 26 : les 6 AMBIGUOUS deviennent des variantes bénignes", () => {
    // ى ↔ ي (alif maqṣūra)
    expect(classifyAlignment("ٱلَّذِى", "الَّذِي")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("فِى", "فِي")).toBe("EXACT_ORTHOGRAPHIC");
    // petit wāw exposant (U+06E5)
    expect(classifyAlignment("لَّهُۥ", "لَهُ")).toBe("EXACT_ORTHOGRAPHIC");
    // petit mīm exposant / iqlab (U+06E2)
    expect(classifyAlignment("أَحَدٌۢ", "أَحَدٌ")).toBe("EXACT_ORTHOGRAPHIC");
    // 2 tatweels + wasla (bug fix)
    expect(classifyAlignment("ٱلنَّفَّـٰثَـٰتِ", "النَّفَّاثَاتِ")).toBe("EXACT_ORTHOGRAPHIC");
  });

  it("Phase 65 (audit 64) : règle A′ — petit yeh ۦ suffixal omis par MASAQ", () => {
    // 87:15:3 — suffixe pronominal هِۦ : MASAQ omet le ۦ (cas bloquant Phase 62).
    expect(classifyAlignment("رَبِّهِۦ", "رَبِّهِ")).toBe("EXACT_ORTHOGRAPHIC");
    // mêmes schémas suffixaux : بِهِۦ / لِقَوْمِهِۦ / فِيهِۦ
    expect(classifyAlignment("بِهِۦ", "بِهِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("لِقَوْمِهِۦ", "لِقَوْمِهِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("فِيهِۦ", "فِيهِ")).toBe("EXACT_ORTHOGRAPHIC");
    // ه + shadda/kasra + ۦ
    expect(classifyAlignment("يُؤَدِّهِۦٓ", "يُؤَدِّهِ")).toBe("EXACT_ORTHOGRAPHIC");
    // 87:15:3 et les formes voisines restent distinctes (pas de collision)
    expect(classifyAlignment("رَبِّهِۦ", "رَبِّهِمْ")).toBe("AMBIGUOUS");
  });

  it("Phase 65 (audit 64) : règle A′ — ۦ marqueur de voyelle -i → ي (préservé)", () => {
    // Cas documentés à préserver : MASAQ écrit le yā' plein.
    expect(classifyAlignment("إِۦلَـٰفِهِمْ", "إِيلَافِهِمْ")).toBe("EXACT_ORTHOGRAPHIC");
    // 106:2:1 — unique cas importé concerné (audit 64).
    expect(classifyAlignment("إِۦلَـٰفِهِمْ", "إِيلَافِهِمْ")).toBe("EXACT_ORTHOGRAPHIC");
    // 27:36:8 — cas historique.
    expect(classifyAlignment("ءَاتَىٰنِۦَ", "آتَانِيَ")).toBe(
      "VARIANT_ORTHOGRAPHY_DOCUMENTED"
    );
    // يُحْىِۦ → يُحْيِي (yā' plein)
    expect(classifyAlignment("يُحْىِۦ", "يُحْيِي")).toBe("EXACT_ORTHOGRAPHIC");
  });

  it("Phase 65 (audit 64) : règle B2 — wāw silencieux + dagger-alif → alif", () => {
    // 87:16:3 — cas bloquant Phase 62 : ٱلْحَيَوٰةَ → ٱلْحَيَاةَ.
    expect(classifyAlignment("ٱلْحَيَوٰةَ", "ٱلْحَيَاةَ")).toBe("EXACT_ORTHOGRAPHIC");
    // autres wāw silencieux : صَلَوٰة / زَكَوٰة / مَنَوٰة / غَدَوٰة / رِبَوٰا
    expect(classifyAlignment("ٱلصَّلَوٰةَ", "ٱلصَّلَاةَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("ٱلزَّكَوٰةِ", "ٱلزَّكَاةِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("وَمَنَوٰةَ", "وَمَنَاةَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("بِٱلْغَدَوٰةِ", "بِالْغَدَاةِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("ٱلرِّبَوٰا۟", "ٱلرِّبَا")).toBe(
      "VARIANT_ORTHOGRAPHY_DOCUMENTED"
    );
  });

  it("Phase 65 : hors périmètre — أُولَٰئِكَ n'est PAS transformé en waw+alif", () => {
    // La séquence و+ل+ٰ (dagger-alif sur lām) n'est PAS و+0670 adjacent : la
    // règle B2 ne doit pas s'y appliquer — le wāw reste une lettre (le ٰ passe
    // par la règle générique dagger-alif → ا, comportement préexistant 43B).
    expect(normalizeOrthographic("أُولَٰئِكَ")).toBe("اولايك");
    expect(classifyAlignment("أُولَٰئِكَ", "أُولَئِكَ")).toBe("EXACT");
    // forme avec wāw réellement redoublé — reste EXACT (pas de fusion avec وٰ)
    expect(classifyAlignment("أُولَٰئِكَ", "أُوْلَئِكَ")).not.toBe("AMBIGUOUS");
  });

  it("Phase 65 : les EXACT/ORTHO/VARIANT existants restent stables", () => {
    // Reprise des cas canoniques Al-Fātiḥah — aucune régression.
    expect(classifyAlignment("صِرَٰطَ", "صِرَاطَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("ٱللَّهِ", "اللَّهِ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("ٱلرَّحْمَـٰنِ", "الرَّحْمَنِ")).toBe(
      "VARIANT_ORTHOGRAPHY_DOCUMENTED"
    );
    expect(classifyAlignment("أَدْرَىٰكَ", "أَدْرَاكَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("لَّهُۥ", "لَهُ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("وَٱلضُّحَىٰ", "وَالضُّحَى")).toBe(
      "VARIANT_ORTHOGRAPHY_DOCUMENTED"
    );
    expect(classifyAlignment("وَعَمِلُوا۟", "وَعَمِلُوا")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("إِيَّاكَ", "إِيَّاكَ")).toBe("EXACT");
  });

  it("Phase 43B : variantes 12 sourates READY documentées (0 AMBIGUOUS)", () => {
    // alif en poignard après alif maqṣūra (ىٰ = madda-alif sur ya)
    expect(classifyAlignment("أَدْرَىٰكَ", "أَدْرَاكَ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("أَلْهَىٰكُمُ", "أَلْهَاكُمُ")).toBe("EXACT_ORTHOGRAPHIC");
    // petit yeh exposant ۦ → ي (MASAQ écrit ي plein)
    expect(classifyAlignment("إِۦلَـٰفِهِمْ", "إِيلَافِهِمْ")).toBe("EXACT_ORTHOGRAPHIC");
    // signes coraniques ۟/ۭ/۠ + espaces
    expect(classifyAlignment("وَعَمِلُوا۟", "وَعَمِلُوا")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("خَيْرٌۭ", "خَيْرٌ")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("أَنَا۠", "أَنَا")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("كَلَّا ۖ", "كَلَّا")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("وَٱسْتَغْفِرْهُ ۚ", "وَاسْتَغْفِرْهُ")).toBe("EXACT_ORTHOGRAPHIC");
    // tanwīn fatḥ sur alif (MASAQ : fatha + tanwīn ; Hikma : tanwīn + petit signe)
    expect(classifyAlignment("يَتِيمًۭا", "يَتِيمَاً")).toBe("EXACT_ORTHOGRAPHIC");
    expect(classifyAlignment("نَارًۭا", "نَارَاً")).toBe("EXACT_ORTHOGRAPHIC");
    // gémination écrite différemment (لِّ = ل+ل)
    expect(classifyAlignment("وَٱلَّيْلِ", "وَاللَّيْلِ")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    // alif maqsura finale /aː/ : Hikma ىٰ (dagger) vs MASAQ ى
    expect(classifyAlignment("وَٱلضُّحَىٰ", "وَالضُّحَى")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    expect(classifyAlignment("ٱلْأُولَىٰ", "الْأُولَى")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    expect(classifyAlignment("فَـَٔاوَىٰ", "فَآوَى")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    // hamza signe (Hikma 0654/ء) vs lettre (MASAQ أ/ئ/آ)
    expect(classifyAlignment("لَتُسْـَٔلُنَّ", "لَتُسْأَلُنَّ")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    expect(classifyAlignment("ءَامَنُوا۟", "آمَنُوا")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    expect(classifyAlignment("ٱلْأَفْـِٔدَةِ", "الْأَفْئِدَةِ")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
    expect(classifyAlignment("وَءَامَنَهُم", "وَآمَنَهُمْ")).toBe("VARIANT_ORTHOGRAPHY_DOCUMENTED");
  });
});

describe("masaq alignKey", () => {
  it("clé = surah:ayah:position (jamais chaîne seule)", () => {
    expect(alignKey(1, 7, 3)).toBe("1:7:3");
    expect(alignKey(1, 7, 3)).not.toBe(alignKey(1, 7, 9));
  });
});

describe("masaq classifySegment", () => {
  it("STEM / ARTICLE / PARTICLE / suffixe", () => {
    expect(classifySegment("Stem", "NOUN_ABSTRACT")).toBe("STEM");
    expect(classifySegment("Prefix", "DET")).toBe("ARTICLE");
    expect(classifySegment("Prefix", "PREP")).toBe("PARTICLE");
    expect(classifySegment("Prefix", "CONJ")).toBe("PARTICLE");
    expect(classifySegment("Prefix", "CV_PREF")).toBe("PARTICLE");
    expect(classifySegment("Suffix", "OBJ_PRON")).toBe("PRONOMINAL_SUFFIX");
    expect(classifySegment("Suffix", "POSS_PRON")).toBe("PRONOMINAL_SUFFIX");
    expect(classifySegment("Suffix", "SUBJ_PRON")).toBe("PRONOMINAL_SUFFIX");
    expect(classifySegment("Suffix", "NSUFF_MASC_PL_GEN")).toBe(
      "INFLECTIONAL_SUFFIX"
    );
    expect(classifySegment("Suffix", "NSUFF_FEM_PL")).toBe("INFLECTIONAL_SUFFIX");
    expect(classifySegment("Suffix", "CASE_DEF_ACC")).toBe(
      "INFLECTIONAL_SUFFIX"
    );
    expect(classifySegment("Suffix", "CASE_INDEF_(ACC_GEN)")).toBe(
      "INFLECTIONAL_SUFFIX"
    );
  });
});

describe("masaq classifyLemmaMatch (cas réels Al-Fātiḥah)", () => {
  it("MATCH exact après normalisation (رَبّ / رب)", () => {
    expect(classifyLemmaMatch("رَبّ", "رب")).toBe("EXACT");
  });

  it("PARTIAL : article de surface côté Hikma (الرَّحِيم / رحيم)", () => {
    expect(classifyLemmaMatch("ٱلرَّحِيم", "رحيم")).toBe("PARTIAL");
    expect(classifyLemmaMatch("ٱلْحَمْد", "حمد")).toBe("PARTIAL");
  });

  it("NORMALIZATION_DIFFERENCE : préposition de surface (بِسْم / اسم)", () => {
    expect(classifyLemmaMatch("بِسْم", "اسم")).toBe("NORMALIZATION_DIFFERENCE");
  });

  it("NORMALIZATION_DIFFERENCE : الله / له (stem MASAQ sans alif)", () => {
    expect(classifyLemmaMatch("الله", "له")).toBe("NORMALIZATION_DIFFERENCE");
    expect(classifyLemmaMatch("لِلَّه", "له")).toBe("NORMALIZATION_DIFFERENCE");
  });

  it("LEXICAL_LEVEL_DIFFERENCE : nom propre avec article (الرَّحْمَـٰن / رحمن)", () => {
    expect(classifyLemmaMatch("الرَّحْمَـٰن", "رحمن")).toBe(
      "LEXICAL_LEVEL_DIFFERENCE"
    );
  });

  it("UNMAPPED quand pas de lemme Hikma", () => {
    expect(classifyLemmaMatch(null, "نعبد")).toBe("UNMAPPED");
    expect(classifyLemmaMatch(undefined, undefined)).toBe("UNMAPPED");
  });
});

describe("masaq idempotencyKey", () => {
  it("clé = source + enregistrement source", () => {
    expect(idempotencyKey("s1", "42")).toBe("s1::42");
    expect(idempotencyKey("s1", "43")).not.toBe(idempotencyKey("s1", "42"));
  });
});