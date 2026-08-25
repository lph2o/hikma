"use client";

// TimezoneInit — Phase 77 : détection IANA automatique, écriture unique.
//
// Détecte le timezone IANA du navigateur UNE SEULE FOIS (à la première visite
// du dashboard). Si le timezone n'est pas encore persisté dans user_settings,
// appelle le Server Action `persistTimezone` pour l'enregistrer.
//
// Aucune écriture déclenchée si la colonne est déjà remplie.
// Aucun rendu visible pour l'utilisateur.
// Aucune dépendance de géolocalisation IP — uniquement l'API navigateur.

import { useEffect, useRef } from "react";
import { persistTimezone } from "@/lib/learning/actions";

export type TimezoneInitProps = {
  /** timezone déjà persisté (de user_settings). Null = pas encore détecté. */
  currentTimezone: string | null;
};

export function TimezoneInit({ currentTimezone }: TimezoneInitProps) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (currentTimezone) return; // déjà persisté

    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && detected !== currentTimezone) {
        done.current = true;
        persistTimezone(detected).catch(() => {
          // Silencieux : la détection réessaiera au prochain rendu.
          done.current = false;
        });
      }
    } catch {
      // timezone API non supportée → fallback UTC, rien à persister.
    }
  }, [currentTimezone]);

  // Composant invisible — aucun DOM.
  return null;
}