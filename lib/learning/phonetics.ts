// Phonétique minimale (Phase 24H-Q1) — logique PURE, sans I/O.
//
// Q1 ne construit PAS une encyclopédie phonétique ni un segmenteur syllabique.
// On détecte uniquement les marques de vocalisation et les sons réputés
// difficiles pour un francophone, puis on produit des conseils en langage
// simple. La translittération reste une aide secondaire (jamais la vérité
// pédagogique) : priorité = arabe réel → audio → explication simple.
//
// Ces conseils sont DÉRIVÉS de la forme arabe réelle (aucune donnée inventée,
// aucun import, aucune table). Ils alimentent l'exercice PRONUNCIATION_GUIDED.

/** Une marque de vocalisation détectée, avec explication simple. */
export type PhoneticMark = {
  key:
    | "shadda"
    | "sukun"
    | "madda"
    | "dagger_alef"
    | "wasla"
    | "hamza"
    | "tanwin";
  symbol: string;
  label: string;
  explanation: string;
};

/** Un son (lettre) réputé difficile pour un francophone. */
export type PhoneticLetter = {
  letter: string;
  transliteration: string;
  explanation: string;
};

const MARKS: ReadonlyArray<{
  key: PhoneticMark["key"];
  re: RegExp;
  symbol: string;
  label: string;
  explanation: string;
}> = [
  {
    key: "shadda",
    re: /\u0651/,
    symbol: "◌ّ",
    label: "shadda",
    explanation: "Le ◌ّ (shadda) double la consonne : on la tient un instant de plus.",
  },
  {
    key: "sukun",
    re: /\u0652/,
    symbol: "◌ْ",
    label: "soukoun",
    explanation: "Le ◌ْ (soukoun) : la consonne n'a pas de voyelle, on coupe le son.",
  },
  {
    key: "madda",
    // 0622 = آ précomposé ; 0653 = maddah au-dessus (forme « آ » des textes coraniques).
    re: /[\u0622\u0653]/,
    symbol: "آ",
    label: "madda",
    explanation: "آ (madda) = « ā », un « a » allongé.",
  },
  {
    key: "dagger_alef",
    re: /\u0670/,
    symbol: "◌ٰ",
    label: "petit alif",
    explanation: "Le petit alif ◌ٰ = « ā », un « a » allongé (comme un petit alef).",
  },
  {
    key: "wasla",
    re: /\u0671/,
    symbol: "ٱ",
    label: "wasla",
    explanation: "ٱ (wasla) : alif de liaison silencieux, on enchaîne sans coup de glotte.",
  },
  {
    key: "hamza",
    re: /[\u0621\u0623\u0624\u0625\u0626]/,
    symbol: "ء",
    label: "hamza",
    explanation: "La hamza (ء) : petit coup de glotte, comme l'attaque de « oh ! ».",
  },
  {
    key: "tanwin",
    re: /[\u064B\u064C\u064D]/,
    symbol: "◌ً",
    label: "tanwīn",
    explanation: "Le ◌ً/◌ٌ/◌ٍ (tanwīn) ajoute un « n » final léger (-an / -oun / -in).",
  },
];

const LETTERS: ReadonlyArray<PhoneticLetter> = [
  { letter: "ع", transliteration: "ʿ", explanation: "Son profond de la gorge, absent du français — comme un « a » rauque." },
  { letter: "ح", transliteration: "ḥ", explanation: "H aspiré fort du fond de la gorge, comme un souffle." },
  { letter: "غ", transliteration: "gh", explanation: "Comme le « r » grasseyé (parisien), voisé." },
  { letter: "خ", transliteration: "kh", explanation: "Comme la jota espagnole, un « r » raclé du fond de la gorge." },
  { letter: "ص", transliteration: "ṣ", explanation: "S emphatique : prononcé plus profond, langue large." },
  { letter: "ض", transliteration: "ḍ", explanation: "D emphatique, prononcé plus profond." },
  { letter: "ط", transliteration: "ṭ", explanation: "T emphatique, prononcé plus profond." },
  { letter: "ظ", transliteration: "ẓ", explanation: "Th emphatique, prononcé plus profond." },
  { letter: "ق", transliteration: "q", explanation: "K prononcé au fond de la gorge (arrière de la langue)." },
  { letter: "ث", transliteration: "th", explanation: "Comme le « th » anglais de « think »." },
  { letter: "ذ", transliteration: "dh", explanation: "Comme le « th » anglais de « this »." },
];

/** Voyelles longues (affichage simple — « on allonge le son »). */
const LONG_VOWELS: ReadonlyArray<{ key: string; re: RegExp; label: string; explanation: string }> = [
  { key: "long_a", re: /[\u0627\u0622\u0670]/, label: "ā", explanation: "Voyelle longue « ā » : on allonge le « a »." },
  { key: "long_i", re: /\u064A/, label: "ī", explanation: "Voyelle longue « ī » : on allonge le « i »." },
  { key: "long_u", re: /\u0648/, label: "ū", explanation: "Voyelle longue « ū » : on allonge le « ou »." },
];

/**
 * Catalogue complet des marques de vocalisation (détection + définition).
 * Source unique de vérité des symboles/libellés/explications, utilisée par les
 * exercices de discrimination phonétique (24H-Q2-B) pour construire des options
 * de réponse avec leurs définitions — sans dupliquer les chaînes.
 */
export function allPhoneticMarks(): ReadonlyArray<PhoneticMark> {
  return MARKS.map(({ key, symbol, label, explanation }) => ({
    key,
    symbol,
    label,
    explanation,
  }));
}

/** Marques de vocalisation réellement présentes dans la forme arabe. */
export function detectMarks(arabic: string): PhoneticMark[] {
  const out: PhoneticMark[] = [];
  for (const m of MARKS) {
    if (m.re.test(arabic)) {
      out.push({
        key: m.key,
        symbol: m.symbol,
        label: m.label,
        explanation: m.explanation,
      });
    }
  }
  return out;
}

/** Lettres réputées difficiles réellement présentes dans la forme arabe. */
export function detectDifficultLetters(arabic: string): PhoneticLetter[] {
  return LETTERS.filter((l) => arabic.includes(l.letter));
}

/**
 * Conseils simples (max 4) dérivés de la forme arabe : d'abord les marques de
 * vocalisation importantes, puis les sons difficiles. Jamais de terminologie
 * linguistique brute sans explication.
 */
export function phoneticHints(arabic: string): string[] {
  const hints: string[] = [];

  for (const m of MARKS) {
    if (m.re.test(arabic)) hints.push(m.explanation);
  }

  for (const v of LONG_VOWELS) {
    if (v.re.test(arabic) && !hints.includes(v.explanation)) hints.push(v.explanation);
  }

  for (const l of LETTERS) {
    if (arabic.includes(l.letter)) {
      const hint = `${l.letter} (${l.transliteration}) : ${l.explanation}`;
      if (!hints.includes(hint)) hints.push(hint);
    }
  }

  return hints.slice(0, 4);
}
