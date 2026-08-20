import type { GeneratedOption } from "@/lib/exercises";

/**
 * Permutation d'affichage stable : elle ne modifie jamais les options elles-mêmes.
 * Le seed est fourni par l'exercice déterministe et ne dépend pas du rendu.
 */
export function stableOptionOrder(
  options: readonly GeneratedOption[],
  seed: string,
): GeneratedOption[] {
  const ordered = [...options];
  let state = hashSeed(seed);

  for (let i = ordered.length - 1; i > 0; i -= 1) {
    state = nextState(state);
    const j = state % (i + 1);
    [ordered[i], ordered[j]] = [ordered[j]!, ordered[i]!];
  }

  return ordered;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextState(state: number): number {
  let next = state + 0x6d2b79f5;
  next = Math.imul(next ^ (next >>> 15), next | 1);
  next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
  return (next ^ (next >>> 14)) >>> 0;
}
