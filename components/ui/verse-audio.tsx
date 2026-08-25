"use client";

// Bouton de récitation d'un verset coranique (Phase 74).
// Wrapper léger autour de l'AudioPlayer existant — aucun nouveau moteur audio.
// Affiche "▶ Écouter le verset" / "⏸ Pause" / "▶ Réécouter" selon l'état.
//
// L'audio est chargé à la demande depuis le CDN Al Quran Cloud.
// Un seul audio actif à la fois (garanti par l'AudioCoordinator existant).

import { AudioPlayer } from "@/components/ui/audio-player";
import { getAyahAudioUrl, isValidGlobalAyahNumber } from "@/lib/quran/ayah-audio";
import { Caption } from "@/components/ui/typography";

export type VerseAudioButtonProps = {
  /** Numéro global d'ayah (1–6236). */
  globalAyahNumber: number | null;
  /** Label alternatif (défaut : "Écouter le verset"). */
  label?: string;
  className?: string;
};

/**
 * Bouton de récitation d'un verset.
 * Si `globalAyahNumber` est null ou invalide, affiche un message sobre
 * "Récitation indisponible" — jamais de faux bouton.
 */
export function VerseAudioButton({
  globalAyahNumber,
  label = "Écouter le verset",
  className,
}: VerseAudioButtonProps) {
  if (!isValidGlobalAyahNumber(globalAyahNumber)) {
    return (
      <div className={className}>
        <Caption className="text-muted-foreground">
          Récitation indisponible pour ce verset.
        </Caption>
      </div>
    );
  }

  const audioUrl = getAyahAudioUrl(globalAyahNumber);

  return (
    <div className={className}>
      <AudioPlayer src={audioUrl} label={label} />
    </div>
  );
}