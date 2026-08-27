// Hikma — Content Studio (UI2) : PANNEAU ÉDITORIAL D'ACCUEIL (« Que publier ? »).
//
// Vue synthétique déterministe (zéro IA) calculée à partir des éléments réels
// du registre :
//   - Prêts à publier (APPROVED / RENDERED)
//   - En production (DRAFT / REVIEW / RENDERING)
//   - Déjà publiés (PUBLISHED / EXPORTED)
//
// Affichage compact et scannable, parfait sur mobile et desktop.

import React from "react";
import Link from "next/link";
import { CheckCircle2Icon, ClockIcon, SparklesIcon } from "lucide-react";
import type { ContentStudioItem } from "@/lib/content-studio/types";

export function EditorialOverview({ items }: { items: ContentStudioItem[] }) {
  if (items.length === 0) return null;

  const readyToPublish = items.filter(
    (i) => (i.status === "APPROVED" || i.status === "SCHEDULED") && i.renderStatus === "RENDERED",
  );
  const inProduction = items.filter(
    (i) => i.status === "DRAFT" || i.status === "REVIEW" || i.renderStatus === "RENDERING",
  );
  const published = items.filter((i) => i.status === "PUBLISHED" || i.status === "EXPORTED");

  return (
    <section
      aria-label="Aperçu éditorial"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {/* Prêts à publier */}
      <div className="flex flex-col justify-between rounded-2xl border border-hikma-teal-500/20 bg-[#0d1714] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-hikma-teal-400">
            Prêts à publier
          </span>
          <CheckCircle2Icon className="size-4 text-hikma-teal-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold text-hikma-ivory">
            {readyToPublish.length}
          </span>
          <span className="text-xs text-white/40">vidéo{readyToPublish.length > 1 ? "s" : ""}</span>
        </div>
        {readyToPublish.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1 border-t border-white/6 pt-2">
            {readyToPublish.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                className="truncate text-xs text-white/70 hover:text-hikma-teal-400"
              >
                • {(item.payload as { word?: { arabic?: string } }).word?.arabic ?? item.templateKey}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/30 border-t border-white/6 pt-2">
            Aucun contenu finalisé prêt
          </p>
        )}
      </div>

      {/* En production */}
      <div className="flex flex-col justify-between rounded-2xl border border-hikma-gold/20 bg-[#14120a] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-hikma-gold-muted">
            En production
          </span>
          <ClockIcon className="size-4 text-hikma-gold-muted" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold text-hikma-ivory">
            {inProduction.length}
          </span>
          <span className="text-xs text-white/40">brouillon{inProduction.length > 1 ? "s" : ""}</span>
        </div>
        {inProduction.length > 0 ? (
          <div className="mt-2 flex flex-col gap-1 border-t border-white/6 pt-2">
            {inProduction.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                className="truncate text-xs text-white/70 hover:text-hikma-gold"
              >
                • {(item.payload as { word?: { arabic?: string } }).word?.arabic ?? item.templateKey}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/30 border-t border-white/6 pt-2">
            Aucun brouillon en cours
          </p>
        )}
      </div>

      {/* Publiés */}
      <div className="flex flex-col justify-between rounded-2xl border border-white/8 bg-[#0e1210] p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
            Diffusés
          </span>
          <SparklesIcon className="size-4 text-white/40" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold text-hikma-ivory">
            {published.length}
          </span>
          <span className="text-xs text-white/40">publication{published.length > 1 ? "s" : ""}</span>
        </div>
        <p className="mt-2 text-xs text-white/30 border-t border-white/6 pt-2">
          {published.length > 0 ? "Contenus publiés sur les réseaux" : "Historique vierge"}
        </p>
      </div>
    </section>
  );
}
