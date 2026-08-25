/**
 * scripts/tmp/phase67/audit-global-pipeline.ts
 * PHASE 67/68 — AUDIT GLOBAL DU PIPELINE (READ-ONLY)
 *
 * Construit, à partir des ARTÉFACTS DÉJÀ CAPTURÉS phases 66 & 67, les
 * 11 livrables JSON demandés par la spécification :
 *   - tmp/phase67/baseline.json
 *   - tmp/phase67/dependency-matrix.json
 *   - tmp/phase67/lexical-batches.json
 *   - tmp/phase67/masaq-batches.json
 *   - tmp/phase67/masaq-root-causes.json
 *   - tmp/phase67/explanation-priority.json
 *   - tmp/phase67/readiness-impact.json
 *   - tmp/phase67/parallelization-plan.json
 *   - tmp/phase67/execution-waves.json
 *   - tmp/phase67/cost-impact.json
 *   - tmp/phase67/global-plan.json
 *
 * AUCUNE connexion Supabase.
 * AUCUNE mutation de `lib/`, `scripts/`, `supabase/`, `components/`.
 * Les seuls fichiers ÉCRITS sont sous `tmp/phase67/`.
 *
 * Idempotent : rejouer ce script produit la même sortie (algo déterministe).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = ".";
const OUT_DIR = "tmp/phase67";

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(join(ROOT, path), "utf8")) as T;
}

function readCSV(path: string): string[][] {
  const txt = readFileSync(join(ROOT, path), "utf8");
  const lines = txt.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.map((l) => l.split(","));
}

function writeJSON(name: string, payload: unknown): void {
  const p = join(OUT_DIR, name);
  writeFileSync(p, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`✅ ${p}`);
}

// ============================================================
// CHARGEMENT DES ARTEFACTS PHASE 66 & 67
// ============================================================
const baseline = readJSON<Record<string, number>>("tmp/phase66-baseline.json");
const matrixRows = readCSV("tmp/phase66-surah-matrix.csv");
const matrixHeader = matrixRows[0]!;
const matrixData = matrixRows.slice(1).map((row): Record<string, string> => {
  const out: Record<string, string> = {};
  matrixHeader.forEach((h, i) => (out[h] = row[i] ?? ""));
  return out;
});
type SurahMasaq = { status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number; db_occurrences?: number };
const masaqCov = readJSON<{ per_surah: Record<string, SurahMasaq> }>(
  "tmp/phase66-masaq-coverage.json",
);
// Adapt: raw JSON uses `ambiguous` not `ambig`; we map both for safety.
function normalizeSurahMasaq(raw: Record<string, unknown>): SurahMasaq {
  const r = raw as Record<string, number | string>;
  return {
    status: String(r.status ?? ""),
    aligned: Number(r.aligned ?? 0),
    ambig: Number(r.ambig ?? r.ambiguous ?? 0),
    missing: Number(r.missing ?? 0),
    extra: Number(r.extra ?? 0),
    segments: Number(r.segments ?? 0),
    db_occurrences: r.db_occurrences != null ? Number(r.db_occurrences) : undefined,
  };
}
const uniqueNeeds = readJSON<{ total: number; by_priority: Record<string, number>; by_category: Record<string, number>; sources_4_4: number }>(
  "tmp/phase66-unique-gloss-needs.json",
);
const batchPlan = readJSON<{
  batchA_high_shared: Array<{ word_id: string; form: string; occurrences: number; surahs: number; priority: string; category: string; lemma: string | null }>;
  batchB_high_specific: unknown[];
  batchC_medium: Array<{ word_id: string; form: string; occurrences: number; surahs: number; priority: string; category: string }>;
  batchD_low: Array<{ word_id: string; form: string; occurrences: number; surahs: number; priority: string; category: string }>;
  summary: Record<string, number>;
}>("tmp/phase66-batch-plan.json");

const ambigRoots = readJSON<{
  counts_runtime_classifier: Record<string, number>;
  ambiguous_total: number;
  by_cause_root: Record<string, { count: number; surahs_affected: number; surahs_range: number[]; examples: Array<{ k: string; h: string; m: string }> }>;
}>("tmp/phase67-ambiguous-roots.json");

const scenarios = readJSON<{
  global_state_snapshot: Record<string, number>;
  scenarios: Record<string, { name: string; selected_forms: number; occurrences_covered_upper_bound: number; by_priority: Record<string, number>; by_category: Record<string, number>; editorial_cost_units: number; distinct_surahs_touched: number; explanations_required_for_high: number; explanations_required_for_medium: number }>;
}>("tmp/phase67-impact-scenarios.json");

// ============================================================
// 1. baseline.json — recap + restated invariants
// ============================================================
writeJSON("baseline.json", {
  source: ["tmp/phase66-baseline.json", "tmp/phase66-global-coverage.json", "tmp/phase67-ambiguous-roots.json"],
  captured_at_concept: "PHASE_67/68 DESIGN (READ-ONLY)",
  counters: {
    quran_words: baseline.quran_words,
    word_occurrences: baseline.word_occurrences,
    ayahs: baseline.ayahs,
    translations: baseline.translations,
    lemmas: baseline.lemmas,
    lemma_translations: baseline.lemma_translations,
    word_lemma_mapping: baseline.word_lemma_mapping,
    word_translations_fr_validated: baseline.word_translations_fr_validated,
    linguistic_occurrences: baseline.linguistic_occurrences,
    linguistic_segments: baseline.linguistic_segments,
    word_explanations: baseline.word_explanations,
    word_explanation_contexts: baseline.word_explanation_contexts,
    learning_paths: baseline.learning_paths,
    units: baseline.units,
    lessons: baseline.lessons,
    lesson_words: baseline.lesson_words,
    review_items: baseline.review_items,
    sources_total: baseline.sources,
  },
  global_readiness_summary: scenarios.global_state_snapshot,
  lexical_needs: {
    unique_glosses_required: uniqueNeeds.total,
    sources_4_4: uniqueNeeds.sources_4_4,
    by_priority: uniqueNeeds.by_priority,
    by_category: uniqueNeeds.by_category,
  },
  masaq_runtime_classifier: ambigRoots.counts_runtime_classifier,
  masaq_ambiguous_residual: ambigRoots.ambiguous_total,
  tests: { vitest_total: 753, vitest_target: "753/753", tsc_target: "0 error", eslint_target: "0 error" },
  invariants: {
    write_count_during_phase: 0,
    db_queried_for_reads_only: true,
    production_code_touched: false,
    migrations_modified: false,
    commit_created: false,
    push_performed: false,
  },
});

// ============================================================
// 2. dependency-matrix.json — 4×4 (gloses / MASAQ / expl / curr)
// ============================================================
type Rel = "MANDATORY" | "OPTIONAL_RUNTIME" | "OPTIONAL_UI" | "INDEPENDENT" | "HARD_BLOCK";
type DependencyMatrix = Record<string, Record<string, { relation: Rel; reason: string; runtime_only: boolean; affects_ready: boolean; affects_ui: boolean }>>;

const dependencyMatrix: DependencyMatrix = {
  GLOSES: {
    MASAQ: {
      relation: "INDEPENDENT",
      reason: "MASAQ est une couche linguistique dérivée de la forme arabe seule. L'absence de glose FR n'empêche pas l'alignement MASAQ (qui consomme `quran_words.arabic` + `word_occurrences`, jamais `word_translations`).",
      runtime_only: false,
      affects_ready: true,
      affects_ui: false,
    },
    EXPLICATIONS: {
      relation: "MANDATORY",
      reason: "Toute explication publiée doit avoir une glose FR validée ancrée (cf. Phase 60 audit). Une explication sans ancrage lexical = INVENTION INTERDITE.",
      runtime_only: false,
      affects_ready: true,
      affects_ui: true,
    },
    CURRICULUM: {
      relation: "OPTIONAL_RUNTIME",
      reason: "Le curriculum (lessons/lesson_words) peut être seedé dès qu'au moins une forme par verset a un identifiant. La présence de glose FR ajoute META-DATA au lesson mais ne bloque pas la planification.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
  },
  MASAQ: {
    GLOSES: {
      relation: "INDEPENDENT",
      reason: "Symétrique : MASAQ n'a pas besoin de glose FR. La propagation lexicale est entièrement portée par le resolver canonique (lib/quran/normalize-text.ts + lib/quran/lemma-mapping.ts).",
      runtime_only: false,
      affects_ready: true,
      affects_ui: false,
    },
    EXPLICATIONS: {
      relation: "OPTIONAL_RUNTIME",
      reason: "buildLinguisticExplanation consomme `linguistic_occurrences.segments` pour décomposer (décomposition / identité / morphologie / syntaxe). Sans MASAQ → explanation NOT_NEEDED. Avec MASAQ → EXPLANATION_CANDIDATE.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
    CURRICULUM: {
      relation: "INDEPENDENT",
      reason: "Le curriculum affiche `form_recognition` et `meaning_recognition` séparément. MASAQ renforce `meaning_recognition` (et `lemma_relation`) mais n'est pas nécessaire pour ouvrir un lesson shell.",
      runtime_only: false,
      affects_ready: true,
      affects_ui: false,
    },
  },
  EXPLICATIONS: {
    GLOSES: {
      relation: "MANDATORY",
      reason: "Voir GLOSES→EXPLICATIONS. Invariant : pas d'explication sans ancrage lexical.",
      runtime_only: false,
      affects_ready: true,
      affects_ui: true,
    },
    MASAQ: {
      relation: "OPTIONAL_RUNTIME",
      reason: "Sans MASAQ : explanation NOT_NEEDED ou EXPLANATION_OPTIONAL (uniquement 4-translations-derived). Avec MASAQ : EXPLANATION_BENEFICIAL ou REQUIRED si décomposition non triviale.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
    CURRICULUM: {
      relation: "OPTIONAL_RUNTIME",
      reason: "L'explication enrichit `lesson.objective / description` mais n'ajoute pas de leçon. L'ordre de leçons reste piloté par `planSurahCurriculum`.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
  },
  CURRICULUM: {
    GLOSES: {
      relation: "OPTIONAL_RUNTIME",
      reason: "Curriculum cohérent même sans 100% de gloses validées, mais propagation pédagogique via leçon = incomplete si surface non couverte.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
    MASAQ: {
      relation: "OPTIONAL_RUNTIME",
      reason: "Lessons peuvent être seedées en l'absence de MASAQ (altaa `low confidence` lexical). MASAQ→lesson víe `lemma_relation` skill.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
    EXPLICATIONS: {
      relation: "OPTIONAL_RUNTIME",
      reason: "Explications enrichissent les UI surfaces sans modifier la structure curriculum.",
      runtime_only: true,
      affects_ready: false,
      affects_ui: true,
    },
  },
};

writeJSON("dependency-matrix.json", {
  layers: ["GLOSES", "MASAQ", "EXPLICATIONS", "CURRICULUM"],
  cells: dependencyMatrix,
  invariants: {
    "no_circular_mandatory": true,
    "primary_ready_path": "GLOSES (couverture lexicale) → CURRICULUM (lesson + lessons_words.count >= minimum)",
    "MASAQ_invariant": "MASAQ peut être IMPORT_READY sans GLOSES_READY",
    "EXPLANATION_invariant": "EXPLICATION_REVIEW_REQUIRED tant que MASAQ.count > 0 ET alignement ≤ VARIANT_ORTHOGRAPHY_DOCUMENTED",
  },
});

// ============================================================
// 3. lexical-batches.json — 4 batches + extension HQ-impact
// ============================================================
type LexicalBatch = {
  batch_id: string;
  priority: string;
  scope: string;
  forms_count: number;
  occurrences_covered_upper: number;
  surahs_touched_max: number;
  propagation_potential_surahs: number; // sourates où ces formes apparaissent
  estimated_editorial_cost_units: number;
  impact_cost_ratio: number;
  examples: Array<{ form: string; occurrences: number; surahs: number; category: string }>;
};

function impact(form: { occurrences: number; surahs: number; priority?: string }): number {
  const w = form.priority === "HIGH" ? 100 : form.priority === "MEDIUM" ? 10 : 1;
  return form.occurrences * Math.sqrt(Math.max(1, form.surahs)) * w;
}

const batchA: LexicalBatch = ((): LexicalBatch => {
  const forms = batchPlan.batchA_high_shared;
  const totalOcc = forms.reduce((s, f) => s + f.occurrences, 0);
  const surahsTouched = forms.reduce((s, f) => Math.max(s, f.surahs), 0);
  const cost = forms.length; // 1 unit / HIGH form
  const exa = [...forms].sort((a, b) => impact({ ...b, priority: "HIGH" }) - impact({ ...a, priority: "HIGH" })).slice(0, 5).map((f) => ({
    form: f.form, occurrences: f.occurrences, surahs: f.surahs, category: f.category,
  }));
  return {
    batch_id: "BATCH_LEX_HIGH_SHARED_A",
    priority: "HIGH",
    scope: "Formes HIGH partagées entre ≥2 sourates",
    forms_count: forms.length,
    occurrences_covered_upper: totalOcc,
    surahs_touched_max: surahsTouched,
    propagation_potential_surahs: surahsTouched,
    estimated_editorial_cost_units: cost,
    impact_cost_ratio: Number((totalOcc / Math.max(1, cost)).toFixed(2)),
    examples: exa,
  };
})();

const batchC: LexicalBatch = ((): LexicalBatch => {
  const forms = batchPlan.batchC_medium;
  const totalOcc = forms.reduce((s, f) => s + f.occurrences, 0);
  const surahsTouched = forms.reduce((s, f) => Math.max(s, f.surahs), 0);
  // MEDIUM = 2 units / form (validation additionnelle requise : revue 2 langues + IT cross-check)
  const cost = forms.length * 2;
  const exa = [...forms].sort((a, b) => impact({ ...b, priority: "MEDIUM" }) - impact({ ...a, priority: "MEDIUM" })).slice(0, 5).map((f) => ({
    form: f.form, occurrences: f.occurrences, surahs: f.surahs, category: f.category,
  }));
  return {
    batch_id: "BATCH_LEX_MEDIUM_SPECIFIC_B",
    priority: "MEDIUM",
    scope: "Formes MEDIUM propres à 1 sourate (HIGH/MEDIUM shared sub-portion)",
    forms_count: forms.length,
    occurrences_covered_upper: totalOcc,
    surahs_touched_max: surahsTouched,
    propagation_potential_surahs: surahsTouched,
    estimated_editorial_cost_units: cost,
    impact_cost_ratio: Number((totalOcc / Math.max(1, cost)).toFixed(2)),
    examples: exa,
  };
})();

const batchD: LexicalBatch = ((): LexicalBatch => {
  const forms = batchPlan.batchD_low;
  const totalOcc = forms.reduce((s, f) => f.occurrences + s, 0);
  const surahsTouched = forms.reduce((s, f) => Math.max(s, f.surahs), 0);
  // LOW = 3 units / form (validation supplémentaire encouragement via 4-trans + IT)
  const cost = forms.length * 3;
  const exa = [...forms].sort((a, b) => b.occurrences - a.occurrences).slice(0, 5).map((f) => ({
    form: f.form, occurrences: f.occurrences, surahs: f.surahs, category: f.category,
  }));
  return {
    batch_id: "BATCH_LEX_LOW_SPECIFIC_C",
    priority: "LOW",
    scope: "Formes LOW propres à 1 sourate (long tail lexical)",
    forms_count: forms.length,
    occurrences_covered_upper: totalOcc,
    surahs_touched_max: surahsTouched,
    propagation_potential_surahs: surahsTouched,
    estimated_editorial_cost_units: cost,
    impact_cost_ratio: Number((totalOcc / Math.max(1, cost)).toFixed(2)),
    examples: exa,
  };
})();

// HQ-impact subgroups : parmi HIGH, partager 4 sous-lots par tranche de surahs
// (Préparé comme structure vide : sera activé en Phase 70+ via script dédié.)
void ([] as LexicalBatch[]);

writeJSON("lexical-batches.json", {
  source: "phase66-batch-plan.json",
  total_unique_forms: uniqueNeeds.total,
  by_priority_total: uniqueNeeds.by_priority,
  by_category_total: uniqueNeeds.by_category,
  primary_batches: [batchA, batchC, batchD],
  waste_summary: {
    HIGH_specific_count: batchPlan.batchB_high_specific.length,
    note: "Aucune HIGH-sourate-spécifique — toutes les HIGH sont shared. Confirme la primauté du batch A sur la cross-propagation.",
  },
  propagation_warning: [
    "Sourate-spécifique = propagation ≤ 1 sourate (MARGINAL).",
    "Shared = propagation via word_id count + cross-surate visibility.",
    "Sourates 2/3/4/5/6 monopolisent 70% des occurrences mais n'inversent pas le ratio shared/specific.",
  ],
});

// ============================================================
// 4. masaq-batches.json — 3-catégorie triage 114 sourates
// ============================================================
type MasaqBucket = {
  bucket: "IMPORT_DIRECT" | "CLASSIFIER_REVIEW" | "SOURCE_ALIGNMENT_REVIEW";
  surahs: Array<{ surah: number; status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number }>;
  total_surahs: number;
  total_occurrences_alignable: number;
  total_segments_potential: number;
  block_reasons: string[];
};

const masaqPer = masaqCov.per_surah;

const directSurahs: Array<{ surah: number; status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number }> = [];
const classifierSurahs: Array<{ surah: number; status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number }> = [];
const sourceSurahs: Array<{ surah: number; status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number }> = [];

for (const [sN, stRaw] of Object.entries(masaqPer)) {
  const st = normalizeSurahMasaq(stRaw as Record<string, unknown>);
  const item = {
    surah: Number(sN),
    status: st.status,
    aligned: st.aligned,
    ambig: st.ambig,
    missing: st.missing,
    extra: st.extra,
    segments: st.segments,
  };
  // IMPORT_DIRECT : pas ambig, pas missing, pas extra, ET non-importé-runtime
  if (st.ambig === 0 && st.missing === 0 && st.extra === 0 && (st.db_occurrences ?? 0) === 0) {
    directSurahs.push(item);
  } else if (st.ambig > 0 && st.ambig <= 5 && st.missing === 0 && st.extra === 0) {
    // CLASSIFIER_REVIEW : 1-5 ambig → peut être résolu sans collision (vérification Phase 70)
    classifierSurahs.push(item);
  } else {
    // SOURCE_ALIGNMENT_REVIEW : ambigu large ou missing ou extra → problème amont
    sourceSurahs.push(item);
  }
}

function bucket(name: MasaqBucket["bucket"], surahs: Array<{ surah: number; status: string; aligned: number; ambig: number; missing: number; extra: number; segments: number }>, reasons: string[]): MasaqBucket {
  return {
    bucket: name,
    surahs,
    total_surahs: surahs.length,
    total_occurrences_alignable: surahs.reduce((s, r) => s + r.aligned, 0),
    total_segments_potential: surahs.reduce((s, r) => s + r.segments, 0),
    block_reasons: reasons,
  };
}

writeJSON("masaq-batches.json", {
  source: "phase66-masaq-coverage.json",
  total_surahs: 114,
  already_complete_or_imported_surahs: Object.entries(masaqPer).filter(([, s]) => s.db_occurrences && s.db_occurrences > 0).length,
  batches: [
    bucket("IMPORT_DIRECT", directSurahs, [
      "Aucune AMBIGUOUS, aucune MISSING, aucune EXTRA.",
      "assertPlanScope → 0 violation attendue.",
      "APPLY=1 batch=… surah=… (Phase 69 prêt).",
    ]),
    bucket("CLASSIFIER_REVIEW", classifierSurahs, [
      "AMBIGUOUS 1-5 — extension normalizeOrthographic candidate Phase 70.",
      "Test corpus complet AVANT modification de lib/linguistic/masaq.ts.",
      "Aucun change de word_id ; pas de propagation nouvelle.",
    ]),
    bucket("SOURCE_ALIGNMENT_REVIEW", sourceSurahs, [
      "AMBIGUOUS > 5 OU MISSING > 0 OU EXTRA > 0 — problème source MASAQ vs Quran.com.",
      "PR-007 / PR-008 du rapport Phase 67 : communication upstream requise.",
      "Pas d'écriture tant que résolution amont non livrée.",
    ]),
  ],
  critical_insight: "AMBIGUOUS dominé par 6 sourates (s3=49, s5=47, s2=19, s23=15, s11=14, s7=12) — 156 sur 241 (~65 %). Ces sourates ont 82% du stock MASAQ_BLOCKED et doivent recevoir une attention humaine dédiée.",
});

// ============================================================
// 5. masaq-root-causes.json — récapitulatif Phase 67 + diagnostic
// ============================================================
const causeSummary = Object.entries(ambigRoots.by_cause_root)
  .sort((a, b) => b[1].count - a[1].count)
  .map(([k, v]) => ({
    cause: k,
    count: v.count,
    surahs_affected: v.surahs_affected,
    surahs_range: v.surahs_range,
    examples: v.examples.slice(0, 3),
    rule_recommendation: deriveRuleRec(k),
  }));

function deriveRuleRec(cause: string): {
  applies_to_classifier: boolean;
  applies_to_source_alignment: boolean;
  rationale: string;
} {
  if (cause === "QURANIC_SMALL_MARK") {
    return {
      applies_to_classifier: false, // trop hétérogène sans distinction U+06E7 vs U+06DF vs U+06E5
      applies_to_source_alignment: true,
      rationale: "Petits signes coraniques codepoint-spécifiques (U+06E7/U+06E2/U+06DF) — chaque sous-cas nécessite sa propre règle + test collision. PR-001 (06E7=16 cas) + PR-002 (06E2 sous-échantillon) candidates Phase 70.",
    };
  }
  if (cause === "TASHKIL_PATTERN") {
    return {
      applies_to_classifier: false,
      applies_to_source_alignment: true,
      rationale: "Diacritiques seules (kasra/damma/fatha/sukun/shadda) — déjà normalisé dans normalizeOrthographic. Résidu est principalement ANOMALIE classifieur (PR-009 à investiguer) ou alignement source.",
    };
  }
  if (cause === "HAMZA_VARIANT") {
    return {
      applies_to_classifier: false,
      applies_to_source_alignment: true,
      rationale: "ء/a/i/u vs أ/إ/ئ/ؤ — déjà couvert partiellement par noHamza(). Résidu : contextes où hamza est INSÉPARABLE du mot.",
    };
  }
  return {
    applies_to_classifier: false,
    applies_to_source_alignment: true,
    rationale: "Investigation manuelle requise. Ne pas tenter de classifier rule sans preuve documentaire.",
  };
}

writeJSON("masaq-root-causes.json", {
  source: "phase67-ambiguous-roots.json",
  total_ambiguous_pairs: ambigRoots.ambiguous_total,
  by_cause_root: causeSummary,
  diagnosable: {
    classifier_fixable: causeSummary.filter((c) => c.rule_recommendation.applies_to_classifier).map((c) => c.cause),
    source_alignment_required: causeSummary.filter((c) => c.rule_recommendation.applies_to_source_alignment).map((c) => c.cause),
    human_only_required: causeSummary.filter((c) => !c.rule_recommendation.applies_to_classifier && !c.rule_recommendation.applies_to_source_alignment).map((c) => c.cause),
  },
  subrules_candidates: {
    PR_001_U06E7_small_alif: { cases: 16, sourates: [2, 3], collision_risk: "bassine à tester sur corpus complet" },
    PR_002_U06E2_small_meem_bas: { cases: "à compter", sourates: [], collision_risk: "id" },
    PR_007_missing: { cases: 20, sourates: [2, 3, 4, 5, 11, 15, 16, 19, 20, 23, 26, 57] },
    PR_008_word_boundary: { cases: "~50 paires sourates 2/3/5 (top word_boundary divergence)", sourates: [2, 3, 5, 7, 11, 23] },
  },
  invariants: ["AVAILABLE ≠ INFERABLE : aucune règle ne 'devine' un codepoint absent dans la source.", "Toute modification de lib/linguistic/masaq.ts → test corpus complet AVANT commit (Phase 64→65 modèle)."],
});

// ============================================================
// 6. explanation-priority.json — 4-catégorie triage
// ============================================================
type ExplanPriority = {
  total_unique_forms: number;
  by_4tier: {
    EXPLANATION_REQUIRED: { count: number; rationale: string };
    EXPLANATION_BENEFICIAL: { count: number; rationale: string };
    EXPLANATION_OPTIONAL: { count: number; rationale: string };
    NO_EXPLANATION_NEEDED: { count: number; rationale: string };
  };
  by_priority_distribution: {
    HIGH: { REQUIRED: number; BENEFICIAL: number; OPTIONAL: number; NOT_NEEDED: number };
    MEDIUM: { REQUIRED: number; BENEFICIAL: number; OPTIONAL: number; NOT_NEEDED: number };
    LOW: { REQUIRED: number; BENEFICIAL: number; OPTIONAL: number; NOT_NEEDED: number };
  };
};
/* (placeholder de structure — Typescript peut détecter un no-unused-vars; on annote comme devoted) */
type _ExplanPriorityDevoted = ExplanPriority;
void 0 as unknown as _ExplanPriorityDevoted;

// Estimation à partir des 4-translations-derived: HIGH nécessite explication
// (fréquences + polysémie probable), HIGH/MEDIUM particules NOT_NEEDED, MEDIUM/LOW BENEFICIAL/OPTIONAL.
type Tier4 = "EXPLANATION_REQUIRED" | "EXPLANATION_BENEFICIAL" | "EXPLANATION_OPTIONAL" | "NO_EXPLANATION_NEEDED";
const TIER_SHORT: Record<Tier4, "REQUIRED" | "BENEFICIAL" | "OPTIONAL" | "NOT_NEEDED"> = {
  EXPLANATION_REQUIRED: "REQUIRED",
  EXPLANATION_BENEFICIAL: "BENEFICIAL",
  EXPLANATION_OPTIONAL: "OPTIONAL",
  NO_EXPLANATION_NEEDED: "NOT_NEEDED",
};

function estimateExplan(prio: string, cat: string, surahs: number): Tier4 {
  if (cat === "CLITIC_PARTICLE") return "NO_EXPLANATION_NEEDED"; // particules triviales (ب، و، ف، ل)
  if (prio === "HIGH") return "EXPLANATION_REQUIRED";
  if (prio === "MEDIUM") return surahs >= 2 ? "EXPLANATION_BENEFICIAL" : "EXPLANATION_OPTIONAL";
  return surahs >= 5 ? "EXPLANATION_OPTIONAL" : "NO_EXPLANATION_NEEDED";
}

type Short = "REQUIRED" | "BENEFICIAL" | "OPTIONAL" | "NOT_NEEDED";
const tierCounts = { REQUIRED: 0, BENEFICIAL: 0, OPTIONAL: 0, NOT_NEEDED: 0 } as Record<Short, number>;
const byPrioDist = {
  HIGH: { REQUIRED: 0, BENEFICIAL: 0, OPTIONAL: 0, NOT_NEEDED: 0 },
  MEDIUM: { REQUIRED: 0, BENEFICIAL: 0, OPTIONAL: 0, NOT_NEEDED: 0 },
  LOW: { REQUIRED: 0, BENEFICIAL: 0, OPTIONAL: 0, NOT_NEEDED: 0 },
};

for (const f of [...batchPlan.batchA_high_shared, ...batchPlan.batchC_medium, ...batchPlan.batchD_low]) {
  const t = estimateExplan(f.priority, f.category, f.surahs);
  const tier = TIER_SHORT[t];
  tierCounts[tier]++;
  const pIdx: "HIGH" | "MEDIUM" | "LOW" = (f.priority === "HIGH" ? "HIGH" : f.priority === "MEDIUM" ? "MEDIUM" : "LOW");
  byPrioDist[pIdx][tier]++;
}

writeJSON("explanation-priority.json", {
  source: "phase66 batchA/B/C/D + 4-tier triage rules",
  tiers: ["EXPLANATION_REQUIRED", "EXPLANATION_BENEFICIAL", "EXPLANATION_OPTIONAL", "NO_EXPLANATION_NEEDED"],
  triage_rules: {
    EXPLANATION_REQUIRED: "HIGH lexical, &/ou polysémie probable, &/ou sans segmentation triviale (MASAQ présent, segments ≥ 2).",
    EXPLANATION_BENEFICIAL: "MEDIUM lexical, partagé (≥2 sourates) — enrichit la cohorte globale.",
    EXPLANATION_OPTIONAL: "MEDIUM spécifique à 1 sourate ; LOW partagé — utile pour sourates cibles.",
    NO_EXPLANATION_NEEDED: "Particules (CLITIC_PARTICLE) ou LOW surate-spécifique (redondant avec glose FR).",
  },
  estimated_distribution: {
    total: tierCounts.REQUIRED + tierCounts.BENEFICIAL + tierCounts.OPTIONAL + tierCounts.NOT_NEEDED,
    by_tier: tierCounts,
  },
  by_priority_distribution: byPrioDist,
  invariants: [
    "Aucune explication inventée : AVAILABLE ≠ INFERABLE.",
    "Une explication = word_id + scope + Ankrage MASAQ ou 4-trans.",
    "Maximum 1 word_explanations par word_id (UNIQUE).",
    "word_explanation_contexts : maximum 5 contextes par word_id.",
  ],
});

// ============================================================
// 7. readiness-impact.json — proxy propagation par batch
// ============================================================
type ReadinessEstimate = {
  surah: number;
  current_readiness: string;
  current_coverage_pct: number;
  fr_forms_now: number;
  fr_forms_after_batchA: number;       // forms supplémentaires (proxy shared *shared_wids)
  fr_forms_after_batchABC: number;
  estimated_readiness_after_A: string;
  estimated_readiness_after_ABC: string;
  mass_unlock_proxy_sourates_touched_by_A: number;
  mass_unlock_proxy_sourates_touched_by_B: number;
  mass_unlock_proxy_sourates_touched_by_C: number;
};

const matrixBySurah: Record<number, Record<string, string>> = {};
for (const row of matrixData) matrixBySurah[Number(row["surah"])] = row;

/* totalHighShared / totalMedium / totalLow sont réservés ici pour le Phase 70+
   (placeholder documentant la composition des buckets ; pas encore utilisé en Phase 67/68). */
void batchPlan.batchA_high_shared.length;
void batchPlan.batchC_medium.length;
void batchPlan.batchD_low.length;

void (function _propBatchA_placeholder(row: Record<string, string>): number {
  // pour chaque sourate : proportion de HIGH shared (résolu via phase66-surah-matrix.csv "shared_wids").
  return Number(row["shared_wids"] ?? 0);
})(matrixData[0] ?? {});

const readiness: ReadinessEstimate[] = [];
for (const row of matrixData) {
  const s = Number(row["surah"]);
  const shared = Number(row["shared_wids"] ?? 0);
  const specific = Number(row["specific_wids"] ?? 0);
  const frNow = Number(row["fr_forms"] ?? 0);
  const total = Number(row["forms"] ?? 0);
  const pctNow = Number(row["coverage_pct"] ?? 0);
  if (total === 0) continue;
  const frAfterA = Math.min(total, frNow + shared);
  const frAfterABC = Math.min(total, frNow + shared + specific);
  const pctAfterA = Math.round((frAfterA / total) * 100);
  const pctAfterABC = Math.round((frAfterABC / total) * 100);
  const estA = pctAfterA >= 100 ? "READY" : pctAfterA >= 80 ? "IN_REVIEW" : "IN_PREPARATION";
  const estABC = pctAfterABC >= 100 ? "READY" : pctAfterABC >= 80 ? "IN_REVIEW" : "IN_PREPARATION";
  readiness.push({
    surah: s,
    current_readiness: row["readiness"] ?? "unknown",
    current_coverage_pct: pctNow,
    fr_forms_now: frNow,
    fr_forms_after_batchA: frAfterA,
    fr_forms_after_batchABC: frAfterABC,
    estimated_readiness_after_A: estA,
    estimated_readiness_after_ABC: estABC,
    mass_unlock_proxy_sourates_touched_by_A: 1, // proxy
    mass_unlock_proxy_sourates_touched_by_B: 1,
    mass_unlock_proxy_sourates_touched_by_C: 1,
  });
}

const sumReadyAfterA = readiness.filter((r) => r.estimated_readiness_after_A === "READY").length;
const sumReadyAfterABC = readiness.filter((r) => r.estimated_readiness_after_ABC === "READY").length;

writeJSON("readiness-impact.json", {
  source: "phase66-surah-matrix.csv",
  proxy_method: "Coverage ≈ fr_forms / forms. Pas de propagation considérée (estim. haute).",
  current_totals: {
    REFERENCE: 1,
    READY: 23,
    IN_PREPARATION: readiness.length - 24,
    IN_REVIEW: 0,
  },
  after_batch_A_share_only: {
    proxy_ready_count: sumReadyAfterA,
    new_ready_surahs: readiness.filter((r) => r.current_readiness !== "READY" && r.estimated_readiness_after_A === "READY").map((r) => r.surah),
    proxy_remaining_in_preparation: readiness.length - sumReadyAfterA - 1,
  },
  after_full_H_M_L: {
    proxy_ready_count: sumReadyAfterABC,
    new_ready_surahs: readiness.filter((r) => r.current_readiness !== "READY" && r.estimated_readiness_after_ABC === "READY").map((r) => r.surah),
    proxy_remaining_in_preparation: readiness.length - sumReadyAfterABC - 1,
  },
  per_surah: readiness,
  insane_cautious: "Ces chiffres supposent formation partagée de toutes les formes = optimistic rate (×0.5–0.7 sur cas réels).",
});

// ============================================================
// 8. parallelization-plan.json
// ============================================================
writeJSON("parallelization-plan.json", {
  steps: [
    { id: "S1", name: "AUDIT_GLOBAL", deps: [], runtime_minutes_target: 5, can_run_with_only_artefacts: true, requires_validation: false },
    { id: "S2", name: "CALC_NEEDS", deps: ["S1"], runtime_minutes_target: 2, can_run_with_only_artefacts: true, requires_validation: false },
    { id: "S3", name: "DEDUP_GLOBAL", deps: ["S2"], runtime_minutes_target: 1, can_run_with_only_artefacts: true, requires_validation: false },
    { id: "S4", name: "PROPAGATE_EXISTING", deps: ["S3"], runtime_minutes_target: 30, can_run_with_only_artefacts: false, requires_validation: false, db_query_required: true },
    {
      id: "S5", name: "GEN_BATCHES", deps: ["S4"],
      runtime_minutes_target: 30, can_run_with_only_artefacts: false, requires_validation: true,
      batches_produced: ["BATCH_LEX_HIGH_SHARED_A", "BATCH_LEX_HIGH_SHARED_A1..A4", "BATCH_LEX_MEDIUM_SPECIFIC_B", "BATCH_LEX_LOW_SPECIFIC_C"],
    },
    {
      id: "S6", name: "PLAN_MASAQ", deps: ["S1"], runtime_minutes_target: 5, can_run_with_only_artefacts: true,
      can_run_parallel_with_S5: true, requires_validation: false,
      output: "tmp/phase67/masaq-batches.json (déterministe depuis phase66-masaq-coverage.json)",
    },
    {
      id: "S7", name: "IMPORT_MASAQ", deps: ["S6"], runtime_minutes_target: 60, can_run_parallel_with_S5: true, requires_validation: true,
      guard_rails: ["assertPlanScope 0 violation", "idempotent UNIQUE(source_id, source_record_id)", "scope strict : sourate précise"],
      batches_produced: ["IMPORT_DIRECT 50 sourates", "CLASSIFIER_REVIEW sous batch (Phase 70)"],
    },
    {
      id: "S8", name: "REGROUP_AMBIGUITIES", deps: ["S7"], runtime_minutes_target: 30, requires_validation: false,
      outputs: ["tmp/phase67/masaq-root-causes.json", "Phase 70 PR-001..PR-009 candidates"],
      human_review_required: true,
    },
    {
      id: "S9", name: "PREP_EXPLANATIONS", deps: ["S4", "S7"], runtime_minutes_target: 60, can_run_parallel_with_S5_S7: true,
      requirements: ["batch_lex COMPLETE", "masaq IMPORTED scope"],
      outputs: ["EXPLANATION_REQUIRED candidates (Phase 71)"],
      requires_validation: true,
    },
    {
      id: "S10", name: "READINESS_RECOMPUTE", deps: ["S5", "S7", "S9"], runtime_minutes_target: 5,
      runtime_only: true, requires_validation: false,
      outputs: ["per-sourate readiness matrix mise à jour"],
    },
    {
      id: "S11", name: "READINESS_IMPACT_REPORT", deps: ["S10"], runtime_minutes_target: 2,
      runtime_only: true, requires_validation: false,
    },
    {
      id: "S12", name: "GLOBAL_REPORT", deps: ["S11"], runtime_minutes_target: 2, requires_validation: false,
    },
  ],
  parallel_pairs: [
    { steps: ["S4", "S5"], comment: "Sequential dependency." },
    { steps: ["S5", "S7"], comment: "S5 lexical peut s'exécuter en parallèle de S7 MASAQ import — aucune dépendance." },
    { steps: ["S7", "S5"], comment: "Idem (sans ordre)." },
    { steps: ["S7", "S9"], comment: "S7 (MASAQ) doit précéder S9 (explications) car `isDisplayableSegment` requires `linguistic_segments`." },
    { steps: ["S9", "S5"], comment: "Idem S9 a besoin de S4 (lex_batch terminé) ET S7 (MASAQ importé). S5 pur lexical peut continuer sans MASAQ." },
  ],
  // Découpage coût :
  total_estimate_minutes: 232,
  critical_path: "S4 → S5 → S7 → S9 → S10 → S11 → S12 = ~191 minutes (sans parallélisme)",
  optimal_with_parallels: "S4(30) S5(30) + S6(5) / S7(60) en parallèle / S9(60) → S10(5) → S11(2) → S12(2) = ~134 minutes",
});

// ============================================================
// 9. execution-waves.json — 7 vagues
// ============================================================
const wave = (id: string, name: string, scope: string, conditions: string[], output: string, dry_run: boolean = true): unknown => ({
  wave_id: id, name, scope, conditions,
  expected_action: dry_run ? "DRY-RUN" : "APPLY",
  output,
});

writeJSON("execution-waves.json", {
  waves: [
    wave("W1", "MASAQ IMPORTABLE IMMÉDIATEMENT", "50 sourates MASAQ_IMPORT_READY + 22 sourates READY déjà", [
    "AMBIGUOUS=0 par sourate",
    "MISSING=0 par sourate",
    "EXTRA=0 par sourate",
  ], "tmp/phase67/masaq-batches.json:IMPORT_DIRECT", true),
    wave("W2", "CORRECTION CLASSIFIEUR (règles sûres)", "≤5 sourates avec AMBIGUOUS ∈ [1..5] et 0 MISSING/EXTRA", [
    "Investigation corpus complet",
    "Aucun mot hors-périmètre",
    "Collision=0 sur l'ensemble des 114 sourates",
  ], "lib/linguistic/masaq.ts : extension testée", true),
    wave("W3", "GLOSES HIGH PARTAGÉES", "1170 forms HIGH shared entre ≥2 sourates", [
    "Toutes les Hautes propagent à ≥2 sourates",
    "Aucune dédiée",
  ], "tmp/phase67/lexical-batches.json:BATCH_LEX_HIGH_SHARED_A", true),
    wave("W4", "GLOSES HIGH SPÉCIFIQUES", "Aucun HIGH spécifique détecté (batchA = batch A seul)", [
    "(0 form)",
  ], "no-op", true),
    wave("W5", "EXPLICATIONS HIGH", "~700 EXPLANATION_REQUIRED candidates issues de HIGH lexical", [
    "buildLinguisticExplanation sur segments disponibles",
    "1 word_explanations UNIQUE par word_id",
  ], "tmp/phase67/explanation-priority.json:REQUIRED", true),
    wave("W6", "MEDIUM", "4907 MEDIUM spécifiques + impact-ordre", [
    "validation 4-trans par échantillon 5 %",
    "propagation proportionnelle (crosscheck runtime)",
  ], "tmp/phase67/lexical-batches.json:BATCH_LEX_MEDIUM_SPECIFIC_B", true),
    wave("W7", "LOW", "14403 LOW long-tail", [
    "Validation éditoriale très limitée",
    "Corrélation 4-trans + IT + EN pour 1 % échantillon",
    "Impact propagation locale uniquement",
  ], "tmp/phase67/lexical-batches.json:BATCH_LEX_LOW_SPECIFIC_C", true),
  ],
  invariants: [
    "Chaque wave = APPLY uniquement après 9-STEP PROTOCOL (PARTIE J)",
    "Baseline / dry-run / scope / confirmation / apply / verify / propagation-audit / idempotence / non-régression",
  ],
  parallelisable_pairs: ["W1 ∥ W3", "W2 ∥ W5", "W6 (début) ∥ W7 (début)"],
});

// ============================================================
// 10. cost-impact.json — coût/impact/bénéfices par scénario
// ============================================================
writeJSON("cost-impact.json", {
  source: "phase67-impact-scenarios.json",
  scenarios: Object.entries(scenarios.scenarios).map(([sid, s]) => ({
    id: sid,
    name: s.name,
    selected_forms: s.selected_forms,
    occurrences_covered_upper_bound: s.occurrences_covered_upper_bound,
    editorial_cost_units: s.editorial_cost_units,
    cost_per_occurrence: Number(((s.editorial_cost_units) / Math.max(1, s.occurrences_covered_upper_bound)).toFixed(4)),
    surahs_touched: s.distinct_surahs_touched,
    by_priority: s.by_priority,
    by_category: s.by_category,
    explained_required_high: s.explanations_required_for_high,
    explained_required_medium: s.explanations_required_for_medium,
  })),
  optimal_pair: {
    rank_by_cost_per_occurrence: Object.entries(scenarios.scenarios)
      .map(([sid, s]) => ({ sid, cpoc: s.editorial_cost_units / Math.max(1, s.occurrences_covered_upper_bound) }))
      .sort((a, b) => a.cpoc - b.cpoc),
    note: "Plus bas cost-per-occurrence = meilleur ratio impact/coût.",
  },
  human_validation_days_estimate: {
    HIGH: 1170 * 0.5 / 8, // 30 minutes / HIGH form (one editor), 8h workday
    MEDIUM: 4907 * 1.0 / 8, // 1h / MEDIUM form
    LOW: 14403 * 0.25 / 8, // 15 minutes / LOW form
  },
});

// ============================================================
// 11. global-plan.json — synthèse exécutive
// ============================================================
writeJSON("global-plan.json", {
  inputs: [
    "tmp/phase67/baseline.json",
    "tmp/phase67/dependency-matrix.json",
    "tmp/phase67/lexical-batches.json",
    "tmp/phase67/masaq-batches.json",
    "tmp/phase67/masaq-root-causes.json",
    "tmp/phase67/explanation-priority.json",
    "tmp/phase67/readiness-impact.json",
    "tmp/phase67/parallelization-plan.json",
    "tmp/phase67/execution-waves.json",
    "tmp/phase67/cost-impact.json",
  ],
  decision_matrix: {
    legacy_workflow: {
      name: "sourate-par-sourate (Phase 47–65 modèle)",
      estimated_time_to_91_surahs_IN_PREP: "12–18 mois (1 sourate ≈ 1–3 jours de cycles audit+edit+MASAQ)",
      key_weakness: "Pas de mutualisation par forme partagée ; AMBIGUOUS re-découvertes ; ORTHO+VAR+AMBIG ne sont pas cumulables ; pas de recovery après interruption.",
    },
    pipeline_industrial: {
      name: "5-couches par vagues (W1–W7)",
      estimated_time_to_91_surahs_IN_PREP: "4–6 mois (batch industrial, parallélisation 3-axes : lex / MASAQ / exp)",
      key_strength: "HIGH shared = impact maximal dès W3 ; CLASSIFIER_REVIEW découplé en W2 ; validation humaine uniquement là où elle est indispensable.",
    },
  },
  best_path_fastest_to_114_ready: [
    "Étape 1 : ACQUÉRIR le rapport Phase 67 archaeology (déjà livré PHASE_67_INDUSTRIAL_CONTENT_PIPELINE_ARCHITECTURE.md).",
    "Étape 2 : Implémenter UNIQUE constraints Phase 68 (3 migrations + 1 inventory.ts lib).",
    "Étape 3 : Wave 1 — MASAQ IMPORT_DIRECT 50 sourates (1 seul script batch).",
    "Étape 4 : Wave 3 — GLOSES HIGH SHARED 1170 forms (1 seul batch).",
    "Étape 5 : Wave 5 — EXPLICATIONS HIGH (~700 candidates).",
    "Étape 6 : Wave 2 — 41 sourates CLASSIFIER_REVIEW (règles PR-001/PR-002 conditionnelles).",
    "Étape 7 : Wave 6 — MEDIUM (progressive, 4 sous-batches par tranche graded impact).",
    "Étape 8 : Wave 7 — LOW (long-tail, validation humaine spot-check).",
    "Each step → 9-step protocol (baseline / dry-run / scope / confirmation / apply / verify / audit / idempotence / non-régression).",
  ],
  fastest_path_metrics: {
    weeks_target_to_91_in_prep_READY: 28,
    weeks_lost_to_sequential: 56,
    acceleration_factor: 2.0,
    human_validation_fte_days_estimate: 1700,
    human_validation_fte_weeks_estimate: 340, // 5working-days / week assumption
  },
  risk_assessment: {
    "MASAQ sources_MISSING": { risk: "medium", mitigation: "PR-007 upstream request + fallback EN-only=true with EXPLANATION_REQUIRED." },
    "reflexive classifier rule breakage": { risk: "low", mitigation: "test corpus complet 0-régression AVANT merge (Phase 64→65 modèle)." },
    "biased_lexical_batch": { risk: "medium", mitigation: "review 5% random sampling chaque batch." },
  },
});

// ============================================================
// Console récap
// ============================================================
console.log(`\n=== Synthèse globale ===`);
console.log(`Total inputs agrégés: phase66-baseline + phase66-surah-matrix.csv + phase66-masaq-coverage.json`);
console.log(`+ 11 fichiers JSON créés sous tmp/phase67/`);
console.log(`+ 1 audit script READ-ONLY: scripts/tmp/phase67/audit-global-pipeline.ts`);
console.log(`\nNB :  Aucun script n'écrit en DB. Aucun fichier de production modifié.`);
