// Hikma — Content Studio : CATALOGUE ET REGISTRE DES FORMATS VIDÉO.
//
// Taxonomie complète des formats de vidéos courtes pour l'apprentissage
// du vocabulaire coranique (TikTok · Reels · Shorts).
//
// Catégories :
//   1. APPRENDRE (Mémorisation & Découverte active)
//   2. COMPRENDRE (Contexte coranique & Explications)
//   3. RÉSEAUX SOCIAUX (Rétention & Engagement viral)
//
// Statuts :
//   - IMPLEMENTED : Moteur Remotion 100% fonctionnel (WORD_REVEAL_V1, WORD_QUIZ_V1)
//   - COMING_SOON : Analysé et modélisé dans le catalogue, en cours d'intégration

export type VideoFormatCategory = "APPRENDRE" | "COMPRENDRE" | "RÉSEAUX SOCIAUX";

export type VideoFormatStatus = "IMPLEMENTED" | "COMING_SOON";

export type VideoFormatDefinition = {
  key: string;
  name: string;
  subtitle: string;
  description: string;
  category: VideoFormatCategory;
  status: VideoFormatStatus;
  badge?: string;
  platforms: string[];
  estimatedDuration: string;
  sceneKinds: string[];
};

export const VIDEO_FORMATS_CATALOG: readonly VideoFormatDefinition[] = [
  // -------------------------------------------------------------------------
  // 1. APPRENDRE — Mémorisation & Découverte
  // -------------------------------------------------------------------------
  {
    key: "WORD_REVEAL_V1",
    name: "Word Reveal",
    subtitle: "Découverte & Sens",
    description: "Présentation précieuse d'un mot en or, étymologie, nombre d'occurrences et verset coranique d'illustration.",
    category: "APPRENDRE",
    status: "IMPLEMENTED",
    badge: "Populaire",
    platforms: ["TikTok", "Reels", "Shorts"],
    estimatedDuration: "12–15s",
    sceneKinds: ["intro", "word", "meaning", "quran", "explanation", "cta"],
  },
  {
    key: "WORD_QUIZ_V1",
    name: "Word Quiz",
    subtitle: "Test Interactif",
    description: "Format interactif stimulant : question flash, options à choix multiples, timer mental et révélation immédiate.",
    category: "APPRENDRE",
    status: "IMPLEMENTED",
    badge: "Interactif",
    platforms: ["TikTok", "Reels", "Shorts"],
    estimatedDuration: "10–12s",
    sceneKinds: ["intro", "word", "meaning"],
  },
  {
    key: "FREQUENCY_FACT_V1",
    name: "Frequency Fact",
    subtitle: "Statistique & Fréquence",
    description: "Mise en avant du nombre d'occurrences exact dans le Coran et répartition par sourate.",
    category: "APPRENDRE",
    status: "IMPLEMENTED",
    badge: "Fréquence",
    platforms: ["Reels", "Shorts"],
    estimatedDuration: "8–10s",
    sceneKinds: ["intro", "word", "meaning", "quran", "cta"],
  },
  {
    key: "ROOT_FAMILY_V1",
    name: "Famille de Racines",
    subtitle: "Morphologie & Dérivés",
    description: "Exploration d'une racine trilitère coranique et révélation de 3 mots dérivés dans le Coran.",
    category: "APPRENDRE",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Reels"],
    estimatedDuration: "15–20s",
    sceneKinds: ["intro", "word", "meaning", "cta"],
  },
  {
    key: "WORD_DUEL_V1",
    name: "Nuances & Faux Amis",
    subtitle: "Comparaison Subtile",
    description: "Comparaison côte-à-côte de deux mots proches du Coran (ex: Rahman vs Rahim, Ghafur vs Ghaffar).",
    category: "APPRENDRE",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Reels"],
    estimatedDuration: "15–18s",
    sceneKinds: ["intro", "word", "meaning", "explanation"],
  },

  // -------------------------------------------------------------------------
  // 2. COMPRENDRE — Contexte & Versets
  // -------------------------------------------------------------------------
  {
    key: "VERSE_DEEP_DIVE_V1",
    name: "Immersion Verset",
    subtitle: "Mot au Cœur de l'Ayah",
    description: "Focus audio-visuel immersif sur un verset complet avec suivi doré de récitation et traduction.",
    category: "COMPRENDRE",
    status: "IMPLEMENTED",
    badge: "Immersion",
    platforms: ["Reels", "Shorts"],
    estimatedDuration: "15–25s",
    sceneKinds: ["intro", "word", "quran", "explanation", "cta"],
  },
  {
    key: "SURAH_HIGHLIGHT_V1",
    name: "Mots Clés de Sourate",
    subtitle: "Survol Thématique",
    description: "Les mots indispensables pour comprendre une sourate précise du Coran.",
    category: "COMPRENDRE",
    status: "IMPLEMENTED",
    badge: "Thématique",
    platforms: ["TikTok", "Shorts"],
    estimatedDuration: "20–30s",
    sceneKinds: ["intro", "word", "meaning", "quran", "cta"],
  },
  {
    key: "LINGUISTIC_GEM_V1",
    name: "Perle Linguistique",
    subtitle: "Rhétorique & Balagha",
    description: "Explication de la beauté stylistique et du choix précis d'un terme coranique.",
    category: "COMPRENDRE",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Reels"],
    estimatedDuration: "15–20s",
    sceneKinds: ["intro", "word", "explanation", "cta"],
  },

  // -------------------------------------------------------------------------
  // 3. RÉSEAUX SOCIAUX — Engagement & Rétention
  // -------------------------------------------------------------------------
  {
    key: "STREAK_CHALLENGE_V1",
    name: "Défi 1 Jour 1 Mot",
    subtitle: "Régularité Quotidienne",
    description: "Format court dynamique invitant l'audience à maintenir sa série d'apprentissage sur Hikma.",
    category: "RÉSEAUX SOCIAUX",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Shorts"],
    estimatedDuration: "8–10s",
    sceneKinds: ["intro", "word", "cta"],
  },
  {
    key: "AUDIO_RECITE_CHALLENGE_V1",
    name: "Écoute & Trouve",
    subtitle: "Challenge Auditif",
    description: "Extrait de récitation sans texte : l'utilisateur doit deviner le mot récité.",
    category: "RÉSEAUX SOCIAUX",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Reels"],
    estimatedDuration: "12–15s",
    sceneKinds: ["intro", "quran", "word", "cta"],
  },
  {
    key: "VOCAB_SPEED_RUN_V1",
    name: "Speed Vocab 60s",
    subtitle: "Série Rapide",
    description: "Enchaînement ultra-rapide de 3 à 5 mots coraniques essentiels en moins d'une minute.",
    category: "RÉSEAUX SOCIAUX",
    status: "COMING_SOON",
    badge: "Bientôt",
    platforms: ["TikTok", "Reels", "Shorts"],
    estimatedDuration: "30–60s",
    sceneKinds: ["intro", "word", "meaning", "cta"],
  },
] as const;

export const IMPLEMENTED_FORMAT_KEYS = [
  "WORD_REVEAL_V1",
  "WORD_QUIZ_V1",
  "VERSE_DEEP_DIVE_V1",
  "FREQUENCY_FACT_V1",
  "SURAH_HIGHLIGHT_V1",
] as const;

export function getFormatDefinition(key: string): VideoFormatDefinition | undefined {
  return VIDEO_FORMATS_CATALOG.find((f) => f.key === key);
}

export function isImplementedFormat(key: string): boolean {
  return (IMPLEMENTED_FORMAT_KEYS as readonly string[]).includes(key);
}
