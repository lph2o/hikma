// Mesures acoustiques DESCRIPTIVES (24H-Q3-B) — logique PURE, sans I/O, sans
// réseau, sans navigateur. Elles décrivent la qualité TECHNIQUE d'un
// enregistrement (durée, niveau, silence, saturation) et ne sont JAMAIS un
// verdict pédagogique de prononciation.
//
// Le seul « verdict » produit est binaire et volontairement borné :
//   - NO_SIGNAL      : rien à écouter (silence quasi total ou trop court) ;
//   - REVIEW_REQUIRED: un enregistrement existe, l'apprenant doit se réécouter
//                      et se comparer lui-même au modèle.
// Il n'existe ni CORRECT ni INCORRECT dans Q3-B : une mesure brute ne devient
// jamais une vérité pédagogique (règle contre les faux verdicts).

/** Mesures techniques descriptives d'un enregistrement mono. */
export type AcousticMetrics = {
  durationMs: number;
  sampleRate: number;
  /** Valeur efficace (root mean square) — niveau approximatif. */
  rms: number;
  /** Amplitude maximale absolue (détection de saturation). */
  peak: number;
  /** Vrai si un signal (au-dessus du seuil de silence) est présent. */
  hasSignal: boolean;
  /** Vrai si quasi silence. */
  isSilence: boolean;
  /** Vrai si saturation évidente (amplitude proche de 1.0). */
  isClipping: boolean;
};

/** Verdict Q3-B : jamais CORRECT/INCORRECT. */
export type PronunciationProductionVerdict = "NO_SIGNAL" | "REVIEW_REQUIRED";

/**
 * Seuils HEURISTIQUES descriptifs (pas pédagogiques). Volontairement simples et
 * documentés : ils servent à dire « rien à écouter » ou « à réécouter », jamais
 * « bien/mal prononcé ».
 */
export const ACOUSTIC_THRESHOLDS = {
  /** RMS sous lequel on considère l'enregistrement quasi silencieux. */
  silenceRms: 0.005,
  /** Amplitude au-delà de laquelle on signale une saturation évidente. */
  clippingPeak: 0.98,
  /** Durée minimale sous laquelle un enregistrement est « trop court ». */
  minSignalDurationMs: 300,
} as const;

/**
 * Calcule les mesures descriptives d'un canal PCM mono (Float32Array, valeurs
 * dans [-1, 1]). Fonction PURE, testable, aucune dépendance au navigateur.
 */
export function analyzeSamples(
  samples: Float32Array,
  sampleRate: number,
): AcousticMetrics {
  const durationMs = sampleRate > 0 ? (samples.length / sampleRate) * 1000 : 0;

  if (samples.length === 0) {
    return {
      durationMs: 0,
      sampleRate,
      rms: 0,
      peak: 0,
      hasSignal: false,
      isSilence: true,
      isClipping: false,
    };
  }

  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const v = samples[i]!;
    sumSq += v * v;
    const abs = Math.abs(v);
    if (abs > peak) peak = abs;
  }

  const rms = Math.sqrt(sumSq / samples.length);
  const hasSignal = rms >= ACOUSTIC_THRESHOLDS.silenceRms;

  return {
    durationMs,
    sampleRate,
    rms,
    peak,
    hasSignal,
    isSilence: !hasSignal,
    isClipping: peak >= ACOUSTIC_THRESHOLDS.clippingPeak,
  };
}

/**
 * Classe un enregistrement en NO_SIGNAL (rien à écouter) ou REVIEW_REQUIRED
 * (à réécouter et auto-comparer). Jamais CORRECT/INCORRECT.
 */
export function classifyRecording(
  metrics: AcousticMetrics,
): PronunciationProductionVerdict {
  if (
    !metrics.hasSignal ||
    metrics.durationMs < ACOUSTIC_THRESHOLDS.minSignalDurationMs
  ) {
    return "NO_SIGNAL";
  }
  return "REVIEW_REQUIRED";
}

/**
 * Message DESCRIPTIF (jamais un verdict de prononciation) à afficher à
 * l'apprenant. Sépare silence, trop court, saturation et signal suffisant.
 */
export function describeRecording(metrics: AcousticMetrics): string {
  if (!metrics.hasSignal) {
    return "Aucun son détecté. Réessaie en parlant un peu plus près du microphone.";
  }
  if (metrics.durationMs < ACOUSTIC_THRESHOLDS.minSignalDurationMs) {
    return "Enregistrement très court. Réessaie en prononçant le mot en entier.";
  }
  if (metrics.isClipping) {
    return "Le signal semble saturé. Éloigne un peu le microphone puis réessaie.";
  }
  return "Le signal semble suffisant pour être réécouté.";
}
