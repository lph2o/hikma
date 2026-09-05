// Hikma — Video Format System : MOTEUR DE TEMPLATES ÉDITORIAUX.
//
// Point d'entrée unique de la Video Factory : `generateFormatTemplate(formatId,
// input)` valide le format (READY + createTemplate présent) puis délègue au
// template du format. La sortie est UNIQUEMENT composée d'objets standards du
// Content Studio (VideoScene[] + GraphicClipBase[]) — le même éditeur, la même
// timeline, le même preview et le même renderer Remotion prennent le relais.
//
// DÉTERMINISME : les templates sont des fonctions pures (aucun UUID, aucun
// Date.now, aucun Math.random) ⇒ `generateFormatTemplate(id, input)` retourne
// une sortie identique à l'identique pour des entrées identiques.

import {
  getVideoFormat,
  isFormatGenerable,
} from "@/lib/content-studio/formats/format-registry";
import type {
  FormatTemplateInput,
  FormatTemplateOutput,
  VideoFormatId,
} from "@/lib/content-studio/formats/format-types";

/** Erreur de génération de format (id inconnu ou format non prêt). */
export class FormatTemplateError extends Error {
  readonly code: "UNKNOWN_FORMAT" | "FORMAT_NOT_READY";
  constructor(code: FormatTemplateError["code"], message: string) {
    super(message);
    this.name = "FormatTemplateError";
    this.code = code;
  }
}

/**
 * Génère le montage d'un format éditorial Hikma (scènes + clips standards).
 * Pur et déterministe — aucun effet de bord.
 */
export function generateFormatTemplate(
  formatId: VideoFormatId,
  input: FormatTemplateInput,
): FormatTemplateOutput {
  const def = getVideoFormat(formatId);
  if (!def) {
    throw new FormatTemplateError("UNKNOWN_FORMAT", `Format inconnu : ${formatId}`);
  }
  if (!isFormatGenerable(formatId) || !def.createTemplate) {
    throw new FormatTemplateError(
      "FORMAT_NOT_READY",
      `Format ${def.name} (${def.id}) non prêt : statut ${def.status}.`,
    );
  }
  return def.createTemplate(input);
}
