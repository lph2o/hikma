// Coordination audio (Phase 24F) : un seul audio actif à la fois.
//
// Registre impératif léger, sans dépendance React, pour être testable en
// environnement Node pur. Lorsqu'un lecteur démarre, les autres lecteurs
// enregistrés sont mis en pause. Ceci garantit qu'une leçon ne fait jamais
// entendre plusieurs audios simultanément (même si deux lecteurs coexistaient).

/** Contrat minimal d'un élément audio pilotable (HTMLAudioElement ou mock de test). */
export type StoppableAudio = {
  paused: boolean;
  pause(): void;
};

const registry = new Set<StoppableAudio>();

/** Enregistre un lecteur ; retourne une fonction de désinscription (à appeler au démontage). */
export function registerAudio(audio: StoppableAudio): () => void {
  registry.add(audio);
  return () => {
    registry.delete(audio);
  };
}

/** Met en pause tous les lecteurs enregistrés sauf `except`. */
export function pauseOtherAudios(except: StoppableAudio): void {
  for (const audio of registry) {
    if (audio !== except && !audio.paused) {
      audio.pause();
    }
  }
}
