/**
 * Loader de navigation global Hikma (Phase 92, loader 94B).
 *
 * Affiche `HikmaLoader` (logo + reflet verre + wordmark animé, voir
 * components/ui/hikma-loader.tsx). Apparition différée ~150 ms pour éviter
 * tout flash sur les navigations rapides : le loader reste invisible pendant
 * le délai, puis fond doucement si la navigation est toujours en cours. Il
 * disparaît automatiquement quand Next.js remplace le loading par la page
 * (mécanisme natif loading.tsx — aucune gestion manuelle).
 *
 * Accessibilité : `role="status"` (annonce discrète du contenu sr-only),
 * `aria-busy="true"`, préférence `prefers-reduced-motion` respectée (pas
 * d'animation de fondu). Ne perturbe pas le focus ni le bouton retour.
 */
import { HikmaLoader } from "@/components/ui/hikma-loader";

export function PageLoading() {
  return (
    <main
      role="status"
      aria-busy="true"
      className="flex min-h-[60vh] w-full items-center justify-center px-6"
    >
      <div className="hikma-page-loading-fade">
        <HikmaLoader />
        <span className="sr-only">Chargement de la page…</span>
      </div>
      <style>{`
        .hikma-page-loading-fade {
          opacity: 0;
          animation: hikma-page-loading-in 0.35s ease 0.15s forwards;
        }
        @keyframes hikma-page-loading-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hikma-page-loading-fade { opacity: 1; animation: none; }
        }
      `}</style>
    </main>
  );
}
