"use client";

// Clavier arabe virtuel Hikma (Phase 24H-B, refonte UX Phase 36G).
//
// Aide pédagogique à la SAISIE de la forme arabe : l'utilisateur qui récite
// déjà le mot mais peine à le reconstituer retrouve ici des touches stables
// (positions fixes, jamais réordonnées selon le mot demandé) pour le retaper.
//
// Refonte 36G — principes :
//   - compact : lettres en grille resserrée, voyelles/signes TOUJOURS visibles
//     (plus de bascule « Voyelles »), une seule action de fermeture (✕) ;
//   - pédagogique : la rangée de voyelles est visuellement séparée (accent
//     doré Hikma) pour distinguer « lettres » de « signes de vocalisation » ;
//   - sobre : la touche fraîchement utilisée est brièvement soulignée en doré,
//     aucune animation lourde, aucune nouvelle dépendance.
//
// Contrats préservés : aucune logique pédagogique ici — insertion / suppression
// / espace / fermeture sont émis vers le parent via des callbacks purs
// (lib/ui/arabic-input.ts). Aucun validateAnswer, aucun scoring, aucun SRS,
// aucun mastery, aucun skillAttempt. Le bouton « Vérifier » reste HORS clavier.

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Caption } from "@/components/ui/typography";
import {
  ARABIC_KEYBOARD_DIACRITICS,
  ARABIC_KEYBOARD_LETTERS,
} from "@/lib/ui/arabic-input";
import { cn } from "@/lib/utils";

export type ArabicKeyboardProps = {
  /** Insère un caractère à la position du curseur. */
  onInsert: (char: string) => void;
  /** Supprime en arrière (backspace). */
  onBackspace: () => void;
  /** Insère une espace. */
  onSpace: () => void;
  /** Ferme le clavier (bouton ✕ ou Échap). */
  onClose: () => void;
  className?: string;
};

/** Nom accessible d'un signe de vocalisation (jamais réduit au glyphe seul). */
function diacriticLabel(char: string): string {
  switch (char) {
    case "\u064E":
      return "fatha (a)";
    case "\u064F":
      return "damma (ou)";
    case "\u0650":
      return "kasra (i)";
    case "\u0652":
      return "sukun (absence de voyelle)";
    case "\u0651":
      return "shadda (doublement)";
    case "\u064B":
      return "fathatan (an)";
    case "\u064C":
      return "dammatan (oun)";
    case "\u064D":
      return "kasratan (in)";
    case "\u0670":
      return "alif suscrit";
    case "\u0671":
      return "wasla";
    default:
      return char;
  }
}

/** Styles partagés d'une touche (bouton sémantique, focus visible, état pressé). */
const KEY_BASE =
  "flex h-10 select-none items-center justify-center rounded-lg border text-lg leading-none " +
  "transition-[background-color,border-color,transform] duration-100 ease-[var(--ease-hikma)] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background " +
  "active:scale-[0.96] disabled:opacity-50";

/** Cercle pointillé servant de support VISUEL aux signes combinants (◌ + signe). */
const DIACRITIC_CARRIER = "\u25CC";

function Key({
  children,
  label,
  lang,
  onPress,
  className,
}: {
  children: ReactNode;
  label?: string;
  lang?: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      lang={lang}
      aria-label={label}
      onClick={onPress}
      className={cn(KEY_BASE, className)}
    >
      {children}
    </button>
  );
}

/**
 * Clavier arabe virtuel. Responsable uniquement de l'émission des actions
 * (insertion / suppression / espace / fermeture) — l'état du texte appartient
 * au parent (RecallExercise / ArabicRewriteStep).
 */
export function ArabicKeyboard({
  onInsert,
  onBackspace,
  onSpace,
  onClose,
  className,
}: ArabicKeyboardProps): ReactElement {
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  // Fermeture au clavier physique via Échap (accessibilité clavier).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function insert(char: string) {
    setLastInserted(char);
    onInsert(char);
  }

  return (
    <div
      role="group"
      aria-label="Clavier arabe"
      className={cn(
        "flex flex-col gap-2.5 rounded-2xl border border-border bg-surface-subtle p-3",
        className,
      )}
    >
      {/* En-tête : libellé + UNE seule action de fermeture. */}
      <div className="flex items-center justify-between gap-2">
        <Caption className="text-text-secondary">Clavier arabe</Caption>
        <button
          type="button"
          aria-label="Masquer le clavier arabe"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Lettres principales : positions stables, jamais réordonnées. */}
      <div className="flex flex-col gap-1.5">
        {ARABIC_KEYBOARD_LETTERS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-7 gap-1 sm:grid-cols-10"
          >
            {row.map((char) => (
              <Key
                key={char}
                lang="ar"
                label={char}
                onPress={() => insert(char)}
                className={cn(
                  "border-input bg-popover text-foreground hover:bg-accent/50",
                  lastInserted === char &&
                    "border-hikma-gold/60 bg-hikma-gold/15",
                )}
              >
                {char}
              </Key>
            ))}
          </div>
        ))}
      </div>

      {/* Voyelles & signes : section secondaire, séparée et dorée. */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-hikma-gold/30 bg-hikma-gold/6 p-2">
        <Caption className="text-text-secondary">Voyelles &amp; signes</Caption>
        <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
          {ARABIC_KEYBOARD_DIACRITICS.map((char) => (
            <Key
              key={char}
              label={diacriticLabel(char)}
              onPress={() => insert(char)}
              className={cn(
                "border-hikma-gold/30 bg-popover text-foreground hover:bg-hikma-gold/10",
                lastInserted === char &&
                  "border-hikma-gold/70 bg-hikma-gold/20",
              )}
            >
              <span aria-hidden="true">
                {DIACRITIC_CARRIER}
                {char}
              </span>
            </Key>
          ))}
        </div>
      </div>

      {/* Actions : suppression + espace (le CTA « Vérifier » reste hors clavier). */}
      <div className="grid grid-cols-5 gap-1.5">
        <Key
          label="Supprimer (retour arrière)"
          onPress={onBackspace}
          className="border-input bg-popover text-foreground hover:bg-accent/50"
        >
          ⌫
        </Key>
        <Key
          label="Espace"
          onPress={onSpace}
          className="col-span-4 border-input bg-popover text-sm font-medium text-foreground hover:bg-accent/50"
        >
          Espace
        </Key>
      </div>
    </div>
  );
}
