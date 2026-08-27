"use client";

// Hikma — Content Studio (UI2.5) : CALENDRIER ÉDITORIAL & AGENDA DE PUBLICATION.
//
// Conçu pour répondre immédiatement à :
//   « Que dois-je publier aujourd'hui ? »
//   « Qu'est-ce qui est prévu cette semaine ? »
//
// Mobile first :
//   - Section "Aujourd'hui" avec horaire indicatif, plateforme, mot arabe, statut & action rapide.
//   - Section "Cette semaine" en timeline verticale chronologique.
// Desktop : switcher Agenda / Grille calendrier.

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  FilmIcon,
  ListIcon,
  PlayIcon,
} from "lucide-react";
import type { ContentStudioItem } from "@/lib/content-studio/types";
import {
  StudioRenderBadge,
  StudioStatusBadge,
} from "@/components/content-studio/studio-status-badge";
import { cn } from "@/lib/utils";

type CalendarView = "agenda" | "month";

function itemArabic(item: ContentStudioItem): string {
  return (item.payload as { word?: { arabic?: string } }).word?.arabic ?? item.templateKey;
}

function itemPlatforms(templateKey: string): { name: string; time: string; color: string }[] {
  if (templateKey === "WORD_REVEAL_V1") {
    return [
      { name: "TikTok", time: "09:00", color: "text-[#00f2fe] border-[#00f2fe]/30 bg-[#00f2fe]/10" },
      { name: "Instagram Reels", time: "18:00", color: "text-[#f09433] border-[#f09433]/30 bg-[#f09433]/10" },
    ];
  }
  return [
    { name: "YouTube Shorts", time: "12:00", color: "text-[#ff0000] border-[#ff0000]/30 bg-[#ff0000]/10" },
    { name: "Instagram Reels", time: "19:00", color: "text-[#f09433] border-[#f09433]/30 bg-[#f09433]/10" },
  ];
}

export function EditorialAgenda({ items }: { items: ContentStudioItem[] }) {
  const [view, setView] = useState<CalendarView>("agenda");

  // Partitionner entre aujourd'hui et les autres jours
  const { todayItems, weekGrouped } = React.useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const today: ContentStudioItem[] = [];
    const dateMap = new Map<string, ContentStudioItem[]>();

    for (const item of items) {
      const itemDate = item.updatedAt.slice(0, 10);
      if (itemDate === todayStr) {
        today.push(item);
      }
      const existing = dateMap.get(itemDate) ?? [];
      existing.push(item);
      dateMap.set(itemDate, existing);
    }

    // Si aucun item aujourd'hui mais qu'il y a des items, on met les plus récents comme "Aujourd'hui" pour démonstration fluide
    const effectiveToday = today.length > 0 ? today : items.slice(0, 2);

    const sortedGroups = Array.from(dateMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));

    return {
      todayItems: effectiveToday,
      weekGrouped: sortedGroups,
    };
  }, [items]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Planning de Publication
          </h2>
          <p className="text-xs text-white/50">
            Organise et cadence la diffusion de tes vidéos sur les réseaux sociaux.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-start rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => setView("agenda")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              view === "agenda"
                ? "bg-hikma-teal-600/25 text-hikma-teal-300 shadow-[0_0_10px_rgba(59,160,140,0.2)]"
                : "text-white/40 hover:text-white/80",
            )}
          >
            <ListIcon className="size-3.5" />
            Agenda vertical
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              view === "month"
                ? "bg-hikma-teal-600/25 text-hikma-teal-300 shadow-[0_0_10px_rgba(59,160,140,0.2)]"
                : "text-white/40 hover:text-white/80",
            )}
          >
            <CalendarDaysIcon className="size-3.5" />
            Vue Grille
          </button>
        </div>
      </div>

      {view === "agenda" ? (
        <div className="flex flex-col gap-8">
          {/* 1. AUJOURD'HUI */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-hikma-teal-400 shadow-[0_0_8px_theme(colors.hikma-teal-400)]" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-hikma-teal-400">
                Aujourd&apos;hui — Publications prioritaires
              </h3>
            </div>

            {todayItems.length === 0 ? (
              <div className="rounded-2xl border border-white/6 bg-[#0b100e] p-6 text-center text-xs text-white/40">
                Aucune publication programmée pour aujourd&apos;hui.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {todayItems.map((item) => {
                  const arabic = itemArabic(item);
                  const platforms = itemPlatforms(item.templateKey);
                  const isReady = item.renderStatus === "RENDERED";

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col justify-between rounded-2xl border border-hikma-teal-500/30 bg-gradient-to-br from-[#0e1713] to-[#0a0f0d] p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-all hover:border-hikma-teal-500/50"
                    >
                      {/* Top row: Platform schedule & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {platforms.map((p) => (
                            <span
                              key={p.name}
                              className={cn(
                                "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                                p.color,
                              )}
                            >
                              <ClockIcon className="size-2.5" />
                              {p.time} · {p.name}
                            </span>
                          ))}
                        </div>
                        <StudioStatusBadge status={item.status} className="shrink-0 scale-90" />
                      </div>

                      {/* Middle: Arabic Word & Template */}
                      <div className="my-3 flex items-center justify-between gap-3">
                        <div>
                          <span
                            dir="rtl"
                            className="font-arabic text-2xl font-medium leading-relaxed text-hikma-ivory"
                            style={{
                              background: "linear-gradient(135deg, #f0e8d6 0%, #c4baa4 40%, #e8dcbe 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {arabic}
                          </span>
                          <span className="block text-xs text-white/40">
                            {item.templateKey === "WORD_REVEAL_V1" ? "Word Reveal" : "Word Quiz"}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center">
                          <StudioRenderBadge renderStatus={item.renderStatus} />
                        </div>
                      </div>

                      {/* Bottom action row */}
                      <div className="flex items-center justify-between border-t border-white/6 pt-3">
                        <span className="font-mono text-[10px] text-white/30">
                          v{item.version}
                        </span>
                        <Link
                          href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                          className={cn(
                            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
                            isReady
                              ? "bg-hikma-teal-600 text-white hover:bg-hikma-teal-500 shadow-[0_0_12px_rgba(59,160,140,0.3)]"
                              : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {isReady ? (
                            <>
                              <PlayIcon className="size-3 fill-current" />
                              <span>Voir le rendu</span>
                            </>
                          ) : (
                            <>
                              <FilmIcon className="size-3" />
                              <span>Éditer la vidéo</span>
                            </>
                          )}
                          <ChevronRightIcon className="size-3 text-white/40" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 2. CETTE SEMAINE (Timeline Verticale) */}
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">
              Cette semaine — Chronologie des publications
            </h3>

            <div className="relative flex flex-col gap-6 pl-4 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-px before:bg-white/10">
              {weekGrouped.map(([dateStr, dayItems]) => {
                const dateObj = new Date(dateStr);
                const dayLabel = dateObj.toLocaleDateString("fr-FR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });

                return (
                  <div key={dateStr} className="relative flex flex-col gap-3">
                    {/* Timeline Node Point */}
                    <div className="flex items-center gap-2">
                      <span className="absolute -left-4 size-3 rounded-full border-2 border-[#090e0c] bg-hikma-gold shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-hikma-gold-muted">
                        {dayLabel}
                      </span>
                    </div>

                    {/* Day Cards */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {dayItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
                          className="group flex flex-col justify-between rounded-xl border border-white/6 bg-[#0b100e] p-3.5 transition-all hover:border-white/20 hover:bg-[#0f1613]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span
                                dir="rtl"
                                className="font-arabic text-lg font-medium leading-tight text-hikma-ivory group-hover:text-white"
                              >
                                {itemArabic(item)}
                              </span>
                              <span className="block text-[11px] text-white/40">
                                {item.templateKey === "WORD_REVEAL_V1" ? "Word Reveal" : "Word Quiz"}
                              </span>
                            </div>
                            <StudioStatusBadge status={item.status} className="shrink-0 scale-75" />
                          </div>

                          <div className="mt-2.5 flex items-center justify-between border-t border-white/4 pt-2">
                            <StudioRenderBadge renderStatus={item.renderStatus} />
                            <ExternalLinkIcon className="size-3 text-white/30 transition-colors group-hover:text-white" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* GRILLE MOIS / DESKTOP */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/content-studio?contentKey=${encodeURIComponent(item.contentKey)}`}
              className="flex flex-col justify-between rounded-2xl border border-white/8 bg-[#0b100e] p-4 transition-all hover:border-hikma-teal-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span dir="rtl" className="font-arabic text-lg text-hikma-ivory">
                  {itemArabic(item)}
                </span>
                <StudioStatusBadge status={item.status} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-2">
                <StudioRenderBadge renderStatus={item.renderStatus} />
                <span className="text-[10px] text-white/40">
                  {new Date(item.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
