"use client";

// Clavier arabe virtuel Hikma (Phase 24H-B, refonte UX Phase 36G, Phase 95).
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
// Phase 95 — mobile :
//   - rangées ÉQUILIBRÉES (36 lettres = 6×6 sur mobile, 9×4 sur desktop) :
//     plus aucune « queue » de 2-3 touches isolées ;
//   - touches ≥ 44 px (h-11) et bouton de fermeture ≥ 44 px (size-11) ;
//   - corps scrollable borné à 70dvh : le clavier ne peut pas masquer toute la
//     question — le parent ramène la zone de saisie dans le viewport à
//     l'ouverture (scrollIntoView) ;
//   - safe-area : le padding bas du conteneur respecte env(safe-area-inset-bottom).
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
  chunkRows,
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
  "flex h-9 sm:h-11 select-none items-center justify-center rounded-lg text-base sm:text-lg leading-none " +
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

/** Lettres aplaties puis re-découpées : 6 par rangée sur mobile, 9 sur desktop. */
const ALL_LETTERS = ARABIC_KEYBOARD_LETTERS.flat();
const LETTER_ROWS_MOBILE = chunkRows(ALL_LETTERS, 6);
const LETTER_ROWS_SM = chunkRows(ALL_LETTERS, 9);
const DIACRITIC_ROWS_MOBILE = chunkRows(ARABIC_KEYBOARD_DIACRITICS, 5);
const DIACRITIC_ROWS_SM = chunkRows(ARABIC_KEYBOARD_DIACRITICS, 10);

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
        "flex max-h-[46dvh] sm:max-h-[65dvh] flex-col gap-2 rounded-2xl border border-border-subtle bg-surface-subtle/95 p-2.5 sm:p-3.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-sm backdrop-blur-xs overscroll-contain",
        className,
      )}
    >
      {/* En-tête compact : libellé + fermeture toujours accessible en haut à droite. */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-1">
        <span className="text-xs font-medium text-text-secondary">Clavier arabe</span>
        <button
          type="button"
          aria-label="Masquer le clavier arabe"
          onClick={onClose}
          className="flex size-8 sm:size-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Corps scrollable : le clavier reste borné, la question demeure visible. */}
      <div className="min-h-0 overflow-y-auto">
        {/* Lettres principales : positions stables, jamais réordonnées. */}
        <div className="flex flex-col gap-1.5">
          {/* Mobile : 6×6 équilibré */}
          <div className="grid grid-cols-6 gap-1.5 sm:hidden">
            {LETTER_ROWS_MOBILE.map((row, rowIndex) =>
              row.map((char) => (
                <Key
                  key={`m-${rowIndex}-${char}`}
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
              )),
            )}
          </div>
          {/* Desktop : 9×4 équilibré */}
          <div className="hidden grid-cols-9 gap-1.5 sm:grid">
            {LETTER_ROWS_SM.map((row, rowIndex) =>
              row.map((char) => (
                <Key
                  key={`d-${rowIndex}-${char}`}
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
              )),
            )}
          </div>
        </div>

        {/* Voyelles & signes : section secondaire compacte, séparée et dorée. */}
        <div className="mt-2 flex flex-col gap-1 rounded-xl border border-hikma-gold/25 bg-hikma-gold/5 p-1.5 sm:p-2">
          <span className="px-0.5 text-[11px] font-medium text-text-secondary">Voyelles &amp; signes</span>
          <div className="grid grid-cols-5 gap-1 sm:hidden">
            {DIACRITIC_ROWS_MOBILE.map((row, rowIndex) =>
              row.map((char) => (
                <Key
                  key={`m-${rowIndex}-${char}`}
                  label={diacriticLabel(char)}
                  onPress={() => insert(char)}
                  className={cn(
                    "h-7.5 border-hikma-gold/30 bg-popover text-sm text-foreground hover:bg-hikma-gold/10",
                    lastInserted === char &&
                      "border-hikma-gold/70 bg-hikma-gold/20",
                  )}
                >
                  <span aria-hidden="true">
                    {DIACRITIC_CARRIER}
                    {char}
                  </span>
                </Key>
              )),
            )}
          </div>
          <div className="hidden grid-cols-10 gap-1 sm:grid">
            {DIACRITIC_ROWS_SM.map((row, rowIndex) =>
              row.map((char) => (
                <Key
                  key={`d-${rowIndex}-${char}`}
                  label={diacriticLabel(char)}
                  onPress={() => insert(char)}
                  className={cn(
                    "h-9 border-hikma-gold/30 bg-popover text-foreground hover:bg-hikma-gold/10",
                    lastInserted === char &&
                      "border-hikma-gold/70 bg-hikma-gold/20",
                  )}
                >
                  <span aria-hidden="true">
                    {DIACRITIC_CARRIER}
                    {char}
                  </span>
                </Key>
              )),
            )}
          </div>
        </div>

        {/* Actions : suppression + espace (le CTA « Vérifier » reste hors clavier). */}
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          <Key
            label="Supprimer (retour arrière)"
            onPress={onBackspace}
            className="h-8.5 sm:h-10 border-input bg-popover text-foreground hover:bg-accent/50"
          >
            ⌫
          </Key>
          <Key
            label="Espace"
            onPress={onSpace}
            className="col-span-4 h-8.5 sm:h-10 border-input bg-popover text-xs sm:text-sm font-medium text-foreground hover:bg-accent/50"
          >
            Espace
          </Key>
        </div>
      </div>
    </div>
  );
}
