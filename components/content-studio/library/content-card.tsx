"use client";

// Hikma — Content Studio (UI2.5) : CARTE DE CONTENU MÉDIA (9:16) + SUPPRESSION.
//
// Conçue comme une miniature de créateur :
//   - Visual hero 9:16 avec mot arabe argenté précieux
//   - Statut compact en haut à droite
//   - Tags de plateformes cibles (TikTok · Reels · Shorts)
//   - Bouton de suppression avec modal de confirmation destructive
//   - Durée et version discrètes
//
// SÉCURITÉ ARABE : `overflow: visible`, `lineHeight: 1.8`, padding généreux pour harakat.

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  Loader2Icon,
  PlayIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { ContentItemStatus, RenderStatus } from "@/lib/content-studio/types";
import { StudioRenderBadge, StudioStatusBadge } from "@/components/content-studio/studio-status-badge";
import { deleteVideoContentAction } from "@/app/admin/content-studio/actions";
import { Button } from "@/components/ui/button";

export type ContentCardData = {
  contentKey: string;
  href: string;
  arabic: string;
  title: string;
  templateKey?: string;
  status: ContentItemStatus;
  renderStatus: RenderStatus;
  meta: string;
  platforms?: string[];
};

export function ContentCard({ data }: { data: ContentCardData }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const platforms = data.platforms ?? (
    data.templateKey === "WORD_REVEAL_V1"
      ? ["TikTok", "Reels"]
      : ["Reels", "Shorts"]
  );

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    setErrorMsg(null);

    const res = await deleteVideoContentAction(data.contentKey);
    if (res.ok) {
      startTransition(() => {
        setShowConfirm(false);
        router.refresh();
      });
    } else {
      setIsDeleting(false);
      setErrorMsg(res.reason);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0b100e] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-hikma-teal-500/40 hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(59,160,140,0.2)]">
        {/* 9:16 Stage Thumbnail with Link */}
        <Link
          href={data.href}
          className="relative flex aspect-[9/16] w-full flex-col justify-between overflow-visible p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hikma-teal-500/60"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 25%, rgba(201, 168, 76, 0.08), transparent 60%), linear-gradient(175deg, #101714 0%, #060908 100%)",
          }}
        >
          {/* Top bar on stage: Title + Status + Delete button */}
          <div className="flex items-center justify-between gap-2 z-10">
            <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-medium text-white/60 backdrop-blur-md">
              {data.title}
            </span>
            <div className="flex items-center gap-1.5">
              <StudioStatusBadge status={data.status} className="shrink-0 scale-90" />
              {/* Bouton de suppression rapide */}
              <button
                type="button"
                aria-label={`Supprimer la vidéo ${data.arabic}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/40 opacity-0 transition-all duration-150 hover:border-rose-500/50 hover:bg-rose-950/50 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Silver Arabic Word Hero */}
          <div className="my-auto flex w-full flex-col items-center justify-center py-4">
            <span
              dir="rtl"
              className="text-center font-arabic font-medium transition-transform duration-300 group-hover:scale-105"
              style={{
                fontSize: "clamp(2rem, 6vw, 2.75rem)",
                lineHeight: 1.8,
                background:
                  "linear-gradient(135deg, #f0e8d6 0%, #c4baa4 35%, #f5ecd8 70%, #d8ccb0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                overflow: "visible",
                display: "block",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
              }}
            >
              {data.arabic}
            </span>

            {/* Subtle play hint on hover */}
            <span
              aria-hidden="true"
              className="mt-2 flex size-8 items-center justify-center rounded-full border border-hikma-teal-500/40 bg-hikma-teal-600/20 text-hikma-teal-300 opacity-0 shadow-[0_0_12px_rgba(59,160,140,0.4)] backdrop-blur transition-all duration-200 group-hover:opacity-100"
            >
              <PlayIcon className="size-3.5 translate-x-0.5 fill-current" />
            </span>
          </div>

          {/* Bottom bar on stage: Render status & Platforms */}
          <div className="flex flex-col gap-2 rounded-xl border border-white/6 bg-black/50 p-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <StudioRenderBadge renderStatus={data.renderStatus} />
              <span className="font-mono text-[10px] text-white/40">
                {data.meta}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {platforms.map((p) => (
                <span
                  key={p}
                  className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 text-[9px] font-medium text-white/50"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </Link>
      </div>

      {/* Confirmation Modal de suppression */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowConfirm(false)}
          />

          <div className="relative flex w-full max-w-md flex-col rounded-3xl border border-white/12 bg-[#0e1613] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-950/40 text-rose-400">
                <AlertTriangleIcon className="size-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex size-8 items-center justify-center rounded-xl text-white/40 hover:bg-white/8 hover:text-white"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-white">
                Supprimer cette vidéo ?
              </h3>
              <p className="mt-1 text-xs text-white/60 leading-relaxed">
                Cette action supprimera définitivement le draft vidéo de « {data.arabic} » ({data.title}), son montage et ses fichiers de rendu MP4 associés.
              </p>
              <p className="mt-2 text-[11px] font-medium text-white/40">
                Les sources audio du Coran restent intactes et protégées.
              </p>
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/50 p-2.5 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowConfirm(false)}
                className="rounded-xl text-xs text-white/60 hover:bg-white/8 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting || isPending}
                onClick={handleDelete}
                className="gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-500"
              >
                {isDeleting || isPending ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Suppression…</span>
                  </>
                ) : (
                  <>
                    <Trash2Icon className="size-3.5" />
                    <span>Supprimer</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
