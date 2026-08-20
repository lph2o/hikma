// Classification déterministe des mappings FORME → LEMME (Phase 21B-C).
//
// PILOTE « Option B » : ce module ne fait AUCUNE écriture. Il classe les
// formes coraniques en trois catégories :
//   SAFE            → appartenance au lemme linguistiquement certaine ;
//   REVIEW_REQUIRED → plausible mais nécessite une décision linguistique ;
//   REJECTED        → faux positif démontré.
//
// Règles strictes (21B-C §6) : AUCUN fuzzy matching, AUCUN `contains`,
// AUCUN `startsWith` naïf, AUCUNE distance de chaîne, AUCUN mapping fondé
// uniquement sur normalized_text ou sur une traduction. La méthode est la
// DÉCOMPOSITION STRUCTURELLE EXACTE : proclitique ∈ ensemble fermé documenté
// + cœur lexical exact + enclitique pronominal ∈ ensemble fermé documenté.
// La glose anglaise (quran_words.meaning) sert uniquement de CONTRÔLE (jamais
// de preuve unique d'identité morphologique).
//
// Les cœurs lexicaux sont dérivés des lignes `lemmas` RÉELLES (jamais saisis
// à la main), via `skeleton()` : aucune divergence de codepoint possible.

import { normalizeWordText } from "./normalize-text";

export type MappingCategory = "SAFE" | "REVIEW_REQUIRED" | "REJECTED";

export type MappingCandidate = {
  wordId: string;
  arabic: string;
  normalized: string;
  currentLemmaId: string | null;
  proposedLemmaId: string;
  proposedLemma: string;
  occurrenceCount: number;
  mappingMethod: string;
  confidence: string;
  evidence: string;
  category: MappingCategory;
};

export type WordRow = {
  id: string;
  arabic: string;
  meaning: string | null;
  lemma_id: string | null;
};

export type LemmaRow = {
  id: string;
  arabic: string;
};

/**
 * Squelette technique : normalisation + unification ى→ي + retrait madda
 * (y compris آ précomposé NFC). Utilisé uniquement pour la DÉCOMPOSITION
 * structurelle — jamais comme preuve unique d'identité morphologique.
 */
export function skeleton(s: string): string {
  return normalizeWordText(s)
    .replace(/\u0649/g, "\u064A") // alif maqsura → ya (même suffixe pronominal)
    .replace(/\u0622/g, "\u0627") // آ (alef+madda précomposé) → alef
    .replace(/\u0653/g, "") // madda (allongement) ignorée
    .replace(/\u0670/g, "\u0627"); // dagger alef → alef
}

// ---- Ensembles fermés documentés -------------------------------------------

/** Proclitiques autorisés (conjonction/préposition) pour le pilote. */
const PROCLITICS = ["و", "ب", "ل", "ف"] as const;

/** Enclitiques pronominaux autorisés (ordre : les plus longs d'abord). */
const ENCLITICS = [
  "كما",
  "هما",
  "كم",
  "كن",
  "هم",
  "ها",
  "هن",
  "نا",
  "ك",
  "ه",
  "ي",
] as const;

/** Racines homographes de « رب » → faux positifs démontrés (REJECTED). */
const RABB_FALSE_POSITIVE_PATTERN =
  /(تربص|يتربص|متربص|قرب|ربا|ربع|رجب|ربط|ربح|غرب|ضرب|حرب|هرب|شرب|عرب|تربو|يربو)/;

function isSuffix(c: string): boolean {
  return (ENCLITICS as readonly string[]).includes(c);
}

/**
 * Décompose `skeleton` en [proclitique?, cœur, enclitique?] pour un cœur donné.
 * Retourne null si la décomposition exacte est impossible.
 */
function decompose(
  sk: string,
  core: string,
): { proclitic: string | null; suffix: string | null } | null {
  let rest = sk;
  let proclitic: string | null = null;
  for (const p of PROCLITICS) {
    if (rest.startsWith(p)) {
      proclitic = p;
      rest = rest.slice(p.length);
      break;
    }
  }
  if (!rest.startsWith(core)) return null;
  const suffix = rest.slice(core.length);
  if (suffix === "") return { proclitic, suffix: null };
  if (isSuffix(suffix)) return { proclitic, suffix };
  return null;
}

export type PilotClassification = {
  safe: MappingCandidate[];
  reviewRequired: MappingCandidate[];
  rejected: MappingCandidate[];
};

/**
 * Classifie les formes du pilote (الله / رَبّ / لِلَّه / الرَّحْمَـٰن / الْحَمْد).
 *
 * `lemmas` : lignes `lemmas` réelles (les cœurs sont dérivés de leurs `arabic`).
 * `freq`   : Map word_id → nombre d'occurrences (lecture seule).
 */
export function classifyPilotMappings(
  words: WordRow[],
  lemmas: LemmaRow[],
  freq: Map<string, number>,
): PilotClassification {
  const safe: MappingCandidate[] = [];
  const review: MappingCandidate[] = [];
  const rejected: MappingCandidate[] = [];

  const bySkeleton = new Map(lemmas.map((l) => [skeleton(l.arabic), l]));
  const allah = bySkeleton.get("الله");
  const rabb = bySkeleton.get("رب");
  const lillah = bySkeleton.get("لله");
  const rahman = bySkeleton.get("الرحمان"); // الرَّحْمَـٰن → alef (dagger→alef)
  const hamd = bySkeleton.get("الحمد");

  // Faux positifs démontrés en 21B-B (squelettes exacts).
  const REJECTED_SKELETONS = new Set([
    "اللهب", // ل-ه-ب (Abu Lahab)
    "اللهو", // ل-ه-و (divertissement)
    "للهديا", // ل + الهُدَى (pas لِ + الله)
  ]);

  for (const w of words) {
    const sk = skeleton(w.arabic);
    const count = freq.get(w.id) ?? 0;

    // Une forme déjà rattachée à un lemme natif n'est JAMAIS re-mappée ici.
    if (w.lemma_id != null) continue;

    // ---- الله ----
    if (allah && sk.includes("الله")) {
      if (REJECTED_SKELETONS.has(sk)) {
        rejected.push(candidate(w, sk, allah, count, "REJECTED",
          "faux positif démontré (racine homographe ل-ه-ب ou ل-ه-و)"));
        continue;
      }
      if (sk === "اللهم") {
        review.push(candidate(w, sk, allah, count, "REVIEW_REQUIRED",
          "vocatif ٱللَّهُمَّ : forme dérivée (الله + مّ) — NON assimilée automatiquement à الله"));
        continue;
      }
      // Proclitiques exacts autorisés pour le nom propre الله.
      const allowed = ["والله", "بالله", "فالله", "تالله", "وتالله", "أبالله", "ءالله"];
      if (allowed.includes(sk)) {
        if ((w.meaning ?? "").toLowerCase().includes("allah")) {
          safe.push(candidate(w, sk, allah, count, "SAFE",
            `décomposition exacte : proclitique + nom propre الله ; glose EN « ${w.meaning ?? ""} » (contrôle)`));
        } else {
          review.push(candidate(w, sk, allah, count, "REVIEW_REQUIRED",
            `forme contenant الله mais glose EN « ${w.meaning ?? ""} » sans « Allah » — contrôle en échec`));
        }
        continue;
      }
      review.push(candidate(w, sk, allah, count, "REVIEW_REQUIRED",
        "forme contenant le noyau الله non couverte par la décomposition exacte du pilote"));
      continue;
    }

    // ---- رَبّ ----
    if (rabb && (sk === "رب" || sk.startsWith("رب") ||
      PROCLITICS.some((p) => sk.startsWith(p + "رب")))) {
      // La glose EN sert de CONTRÔLE : « Lord » signale le lexème رَبّ
      // (désambiguïse notamment رَبًّا « a Lord » vs رِبَا « usure », tous deux
      // normalisés « ربا »).
      const meaningHasLord = (w.meaning ?? "").toLowerCase().includes("lord");
      if (meaningHasLord) {
        const d = decompose(sk, "رب");
        if (d !== null) {
          const affix = [d.proclitic ? `proclitique ${d.proclitic}` : null,
            d.suffix ? `enclitique pronominal ـ${d.suffix}` : null]
            .filter(Boolean).join(" + ") || "forme nue";
          safe.push(candidate(w, sk, rabb, count, "SAFE",
            `décomposition exacte : رَبّ (racine ر-ب-ب) ${affix} ; glose EN « ${w.meaning ?? ""} » (contrôle)`));
        } else {
          review.push(candidate(w, sk, rabb, count, "REVIEW_REQUIRED",
            `glose EN « ${w.meaning ?? ""} » (Lord) mais forme non décomposable par le modèle exact (tanwīn/dérivé — ex. رَبًّا « a Lord » normalise en « ربا »)`));
        }
        continue;
      }
      if (RABB_FALSE_POSITIVE_PATTERN.test(sk)) {
        rejected.push(candidate(w, sk, rabb, count, "REJECTED",
          "racine homographe de رب (ر-ب-ص / ق-ر-ب / ر-ب-و / ر-ب-ع / ر-ب-ح…) — faux positif (glose EN sans « Lord »)"));
        continue;
      }
      review.push(candidate(w, sk, rabb, count, "REVIEW_REQUIRED",
        "forme en رب non décomposable et glose EN sans « Lord » — à décider"));
      continue;
    }

    // ---- لِلَّه (composé لِ + الله) ----
    if (lillah && sk.includes("لله") && !sk.includes("الله")) {
      if (REJECTED_SKELETONS.has(sk)) {
        rejected.push(candidate(w, sk, lillah, count, "REJECTED",
          "faux positif (ل + الهُدَى, pas لِ + الله)"));
        continue;
      }
      if (sk === "ولله" || sk === "فلله") {
        if ((w.meaning ?? "").toLowerCase().includes("allah")) {
          safe.push(candidate(w, sk, lillah, count, "SAFE",
            `décomposition exacte : proclitique ${sk[0]} + لِلَّه (لِ + الله) ; glose EN « ${w.meaning ?? ""} » (contrôle)`));
          continue;
        }
      }
      review.push(candidate(w, sk, lillah, count, "REVIEW_REQUIRED",
        "forme en لله non couverte par le pilote (proclitique hors {و,ف})"));
      continue;
    }

    // ---- الرَّحْمَـٰن ----
    if (rahman && sk === "ب" + skeleton(rahman.arabic)) {
      if ((w.meaning ?? "").toLowerCase().includes("gracious")) {
        safe.push(candidate(w, sk, rahman, count, "SAFE",
          `décomposition exacte : proclitique ب + الرَّحْمَـٰن ; glose EN « ${w.meaning ?? ""} » (contrôle)`));
      } else {
        review.push(candidate(w, sk, rahman, count, "REVIEW_REQUIRED",
          `structure ب + الرَّحْمَـٰن mais glose EN « ${w.meaning ?? ""} » sans « Gracious » — contrôle en échec`));
      }
      continue;
    }

    // ---- الْحَمْد ----
    if (hamd && sk === "و" + skeleton(hamd.arabic)) {
      if ((w.meaning ?? "").toLowerCase().includes("praise")) {
        safe.push(candidate(w, sk, hamd, count, "SAFE",
          `décomposition exacte : proclitique و + الْحَمْد ; glose EN « ${w.meaning ?? ""} » (contrôle)`));
      } else {
        review.push(candidate(w, sk, hamd, count, "REVIEW_REQUIRED",
          `structure و + الْحَمْد mais glose EN « ${w.meaning ?? ""} » sans « praise » — contrôle en échec`));
      }
      continue;
    }
  }

  return { safe, reviewRequired: review, rejected };
}

function candidate(
  w: WordRow,
  sk: string,
  lemma: LemmaRow,
  count: number,
  category: MappingCategory,
  evidence: string,
): MappingCandidate {
  return {
    wordId: w.id,
    arabic: w.arabic,
    normalized: sk,
    currentLemmaId: w.lemma_id,
    proposedLemmaId: lemma.id,
    proposedLemma: lemma.arabic,
    occurrenceCount: count,
    mappingMethod: "exact_surface",
    confidence:
      category === "SAFE" ? "safe" : category === "REVIEW_REQUIRED" ? "review_required" : "rejected",
    evidence,
    category,
  };
}
