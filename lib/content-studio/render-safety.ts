// Hikma — Content Studio (UI1) : SÉCURITÉ RENDU / SAUVEGARDE.
//
// Règle P0 : le MP4 rendu doit correspondre au DERNIER état d'édition
// enregistré. Un rendu ne doit JAMAIS partir d'un editor_state serveur
// obsolète pendant que des modifications locales sont encore non sauvegardées
// (unsaved) ou en échec (failed).
//
// Fonctions PURES / injectables — testables sans DOM, utilisées par le
// composant VideoEditor (client) comme seule porte d'entrée du lancement de
// rendu.

export type StudioSaveState = "saved" | "saving" | "unsaved" | "failed";

/**
 * Un rendu exige-t-il une sauvegarde préalable ?
 * - unsaved / failed → oui (les modifications locales ne sont pas encore sur
 *   le serveur : un rendu immédiat produirait une vidéo obsolète) ;
 * - saved → non (l'état serveur == état local) ;
 * - saving → non (une sauvegarde est déjà en vol ; le bouton Rendu est désactivé
 *   pendant ce temps pour éviter toute course).
 */
export function shouldSaveBeforeRender(saveState: StudioSaveState): boolean {
  return saveState === "unsaved" || saveState === "failed";
}

export type SaveThenRenderOutcome = "rendered" | "save_failed";

/**
 * Orchestration save → render (pure, injectable — testable sans composant).
 *
 *   unsaved/failed → save() d'abord ; si save() échoue → "save_failed"
 *                     (le rendu n'est JAMAIS lancé) ;
 *   saved           → render() directement.
 */
export async function saveThenRender(params: {
  saveState: StudioSaveState;
  save: () => Promise<boolean>;
  render: () => void | Promise<void>;
}): Promise<SaveThenRenderOutcome> {
  if (shouldSaveBeforeRender(params.saveState)) {
    const saved = await params.save();
    if (!saved) return "save_failed";
  }
  await params.render();
  return "rendered";
}
