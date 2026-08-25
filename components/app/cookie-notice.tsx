"use client";

/**
 * Hikma — Notice de confidentialité (Phase 89H-I).
 *
 * Notice INFORMATIVE premium, pas un CMP : Hikma n'utilise aucun traceur
 * nécessitant un consentement. Elle n'affiche donc ni « Accepter » ni
 * « Refuser » — uniquement une information claire + « Compris ».
 *
 * - `useSyncExternalStore` : lecture du localStorage versionné, sûre pour
 *   l'hydratation (getServerSnapshot = déjà informé → aucun flash pour les
 *   utilisateurs ayant déjà vu la notice).
 * - Desktop : carte flottante en bas (coin start), discrète.
 * - Mobile : bottom sheet (safe-area).
 * - RTL : propriétés logiques (start/end, text-start), flèche miroir.
 * - A11y : role=region, aria-labelledby/describedby, focus visible,
 *   zones tactiles ≥ 44px, Escape = fermer, prefers-reduced-motion.
 * - Aucun tracking : le bouton ne fait que mémoriser localement (localStorage
 *   versionné), aucun cookie supplémentaire, aucune requête serveur.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ShieldCheckIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCookieNoticeStorage } from "@/lib/privacy/cookie-notice-storage";

const TITLE_ID = "cookie-notice-title";
const DESC_ID = "cookie-notice-desc";

/** S'abonne aux changements de stockage (ex. autre onglet). */
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/** Lecture client du localStorage (snapshot). */
function isAcknowledged(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return createCookieNoticeStorage(window.localStorage).read().acknowledged;
  } catch {
    return false;
  }
}

export function CookieNotice(): React.ReactElement | null {
  const acknowledged = useSyncExternalStore(subscribe, isAcknowledged, () => true);
  const [dismissed, setDismissed] = useState(false);

  const visible = !acknowledged && !dismissed;

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        try {
          createCookieNoticeStorage(window.localStorage).acknowledge();
        } catch {
          // Stockage indisponible : fermeture locale uniquement.
        }
        setDismissed(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  function dismiss(): void {
    try {
      createCookieNoticeStorage(window.localStorage).acknowledge();
    } catch {
      // Stockage indisponible : fermeture locale uniquement.
    }
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Notice de confidentialité"
      aria-labelledby={TITLE_ID}
      aria-describedby={DESC_ID}
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:inset-x-auto sm:bottom-4 sm:start-4 sm:pb-0 sm:pe-4"
    >
      <div className="animate-feedback-in flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-elevated p-5 shadow-elevated sm:max-w-md sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            {/* Pastille eyebrow : teal (action/information) — le gold reste décoratif, jamais pour un CTA. */}
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-hikma-teal-100 text-hikma-teal-700">
              <ShieldCheckIcon className="size-4.5" aria-hidden="true" />
            </span>
            <h2 id={TITLE_ID} className="text-base font-semibold text-text-primary">
              Votre confidentialité compte
            </h2>
          </div>
          <p id={DESC_ID} className="text-sm leading-relaxed text-text-secondary">
            Hikma utilise uniquement le cookie nécessaire à votre connexion.
            Nous n&apos;utilisons actuellement ni publicité, ni traceurs
            marketing, ni analytics nécessitant votre consentement.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/privacy"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong hover:underline"
          >
            En savoir plus
            <ArrowRightIcon className="size-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Button
            onClick={dismiss}
            size="sm"
            className="w-full rounded-full sm:w-auto"
            aria-label="Compris, fermer la notice"
          >
            Compris
          </Button>
        </div>
      </div>
    </div>
  );
}
