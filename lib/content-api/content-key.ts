// Hikma Content Studio — CONTENT KEY (sha256-v1), gelé B3-FINAL §12.
//
//   contentKey = SHA-256( utf8(wordId|templateKey|templateVersion|hookVariantId|language) )
//   sortie : hex lowercase.
//
// Aucun timestamp, aucune donnée cosmétique (couleur, police, timing,
// caption, CTA-texte). Deux générations identiques ⇒ même clé.

import { createHash } from "node:crypto";

export const CONTENT_KEY_ALGORITHM = "sha256-v1" as const;

export function computeContentKey(input: {
  wordId: string;
  templateKey: string;
  templateVersion: string;
  hookVariantId: string;
  language: string;
}): string {
  const parts = [
    input.wordId,
    input.templateKey,
    input.templateVersion,
    input.hookVariantId,
    input.language,
  ].join("|");
  return createHash("sha256").update(parts, "utf8").digest("hex");
}
