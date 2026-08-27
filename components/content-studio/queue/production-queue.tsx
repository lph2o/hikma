"use client";

// Hikma — Content Studio (UI2.5) : FILE DE PRODUCTION ÉDITORIALE.
//
// Répond immédiatement à : « Que dois-je faire maintenant ? »
// 5 colonnes / sections hiérarchisées par urgence d'action :
//   🔴 À terminer (Brouillons & révisions incomplètes)
//   🟡 À rendre (Approuvés en attente de génération MP4)
//   🟢 Prêts à publier (MP4 prêt, téléchargeable / diffusable)
//   🔵 Programmés (Prêts pour diffusion à date)
//   ✓ Publiés (Historique récent)

import React from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  DownloadIcon,
  PlayCircleIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import type { ContentStudioItem } from "@/lib/content-studio/types";
import {
  StudioRenderBadge,
  StudioStatusBadge,
} from "@/components/content-studio/studio-status-badge";

function itemArabic(item: ContentStudioItem): string {
  return (item.payload as { word?: { arabic?: string } }).word?.arabic ?? item.templateKey;
}

function itemPlatforms(templateKey: string): string[] {
  if (templateKey === "WORD_REVEAL_V1") return ["TikTok", "Instagram Reels"];
  return ["YouTube Shorts", "Instagram Reels"];
}

export function ProductionQueue({ items }: { items: ContentStudioItem[] }) {
  // Catégorisation stricte et déterministe
  const readyToPublish = items.filter(
    (i) => (i.status === "APPROVED" || i.status === "SCHEDULED") && i.renderStatus === "RENDERED",
  );
  const toRender = items.filter(
    (i) => (i.status === "APPROVED" || i.status === "REVIEW") && i.renderStatus !== "RENDERED",
  );
  const toFinish = items.filter((i) => i.status === "DRAFT");
  const scheduled = items.filter((i) => i.status === "SCHEDULED");
  const published = items.filter((i) => i.status === "PUBLISHED" || i.status === "EXPORTED");

  return (
    <div className="flex flex-col gap-10">
      {/* 🟢 1. PRÊTS À PUBLIER (Urgence #1) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Prêts à publier ({readyToPublish.length})
            </h2>
          </div>
          <span className="text-[11px] text-white/40">Fichiers MP4 finalisés</span>
        </div>

        {readyToPublish.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-[#0a0f0d] p-6 text-center text-xs text-white/35">
            Aucun contenu complètement rendu prêt pour la diffusion.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {readyToPublish.map((item, idx) => {
              const platforms = itemPlatforms(item.templateKey);
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1a14] to-[#070e0a] p-4.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition-all hover:border-emerald-500/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 font-mono text-xs font-bold text-emerald-300">
                        {idx + 1}
                      </span>
                      <div>
                        <span
                          dir="rtl"
                          className="font-arabic text-2xl font-medium leading-tight text-white"
                        >
                          {itemArabic(item)}
                        </span>
                        <span className="block text-xs text-white/40">
                          {item.templateKey === "WORD_REVEAL_V1" ? "Word Reveal" : "Word Quiz"}
                        </span>
                      </div>
                    </div>

                    <StudioStatusBadge status={item.status} className="shrink-0 scale-90" />
                  </div>

                  {/* Platforms & Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                    <div className="flex items-center gap-1.5">
                      {platforms.map((p) => (
                        <span
                          key={p}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60"
                        >
                          {p}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.renderPath && (
                        <a
                          href={item.renderPath}
                          download
                          className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Télécharger MP4"
                        >
                          <DownloadIcon className="size-3.5" />
                        </a>
                      )}
                      <Link
                        href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500"
                      >
                        <span>Publier</span>
                        <SendIcon className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🟡 2. À RENDRE (Urgence #2) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-3 items-center justify-center rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
              À rendre ({toRender.length})
            </h2>
          </div>
          <span className="text-[11px] text-white/40">Nécessite la génération MP4</span>
        </div>

        {toRender.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-[#0a0f0d] p-6 text-center text-xs text-white/35">
            Aucun contenu en attente de rendu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {toRender.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-[#121008] p-4 transition-all hover:border-amber-500/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-xs font-bold text-amber-300">
                      {idx + 1}
                    </span>
                    <span
                      dir="rtl"
                      className="font-arabic text-xl font-medium text-hikma-ivory"
                    >
                      {itemArabic(item)}
                    </span>
                  </div>
                  <StudioRenderBadge renderStatus={item.renderStatus} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/6 pt-2.5">
                  <span className="text-xs text-white/40">
                    {item.templateKey === "WORD_REVEAL_V1" ? "Word Reveal" : "Word Quiz"}
                  </span>
                  <Link
                    href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600/20 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-600/30"
                  >
                    <PlayCircleIcon className="size-3.5" />
                    <span>Lancer le rendu</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🔴 3. À TERMINER (Urgence #3) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-3 items-center justify-center rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400">
              À terminer / Brouillons ({toFinish.length})
            </h2>
          </div>
          <span className="text-[11px] text-white/40">Montage &amp; textes incomplets</span>
        </div>

        {toFinish.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-[#0a0f0d] p-6 text-center text-xs text-white/35">
            Aucun brouillon en cours.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {toFinish.map((item) => (
              <Link
                key={item.id}
                href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                className="group flex items-center justify-between rounded-xl border border-white/6 bg-[#0c100e] p-3 transition-all hover:border-white/20 hover:bg-[#111714]"
              >
                <div className="flex flex-col">
                  <span
                    dir="rtl"
                    className="font-arabic text-base font-medium text-hikma-ivory group-hover:text-white"
                  >
                    {itemArabic(item)}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {item.templateKey === "WORD_REVEAL_V1" ? "Word Reveal" : "Word Quiz"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50 group-hover:text-white">
                  <span>Éditer</span>
                  <ChevronRightIcon className="size-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 🔵 4. HISTORIQUE & DIFFUSIONS (Programmés + Publiés) */}
      {(scheduled.length > 0 || published.length > 0) && (
        <section className="flex flex-col gap-3 border-t border-white/6 pt-6">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-white/40" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
              Historique des publications ({published.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {published.map((item) => (
              <Link
                key={item.id}
                href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                className="flex items-center justify-between rounded-xl border border-white/6 bg-white/2 p-3 opacity-60 transition-opacity hover:opacity-100"
              >
                <span dir="rtl" className="font-arabic text-sm text-hikma-ivory">
                  {itemArabic(item)}
                </span>
                <StudioStatusBadge status={item.status} className="scale-75" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
