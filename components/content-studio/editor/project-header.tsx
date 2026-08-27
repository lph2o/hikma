"use client";

// Hikma — Content Studio (UI2.5) : EN-TÊTE DE PROJET VIDÉO.
//
// Minimal, épuré, centré sur le contenu :
//   - Bouton retour rapide vers la bibliothèque
//   - Mot arabe en HERO textuel
//   - Indicateur de sauvegarde subtil
//   - Actions directes : Enregistrer (Ctrl+S) & Rendre la vidéo

import Link from "next/link";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronLeftIcon,
  CircleAlertIcon,
  Loader2Icon,
  PlayIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StudioRenderBadge,
  StudioStatusBadge,
} from "@/components/content-studio/studio-status-badge";
import type { ContentItemStatus, RenderStatus } from "@/lib/content-studio/types";
import type { StudioSaveState } from "@/lib/content-studio/render-safety";

function SaveIndicator({ saveState }: { saveState: StudioSaveState }) {
  if (saveState === "saved") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
        <CheckIcon aria-hidden="true" className="size-3.5" />
        <span className="hidden sm:inline">Enregistré</span>
      </span>
    );
  }
  if (saveState === "saving") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-white/50">
        <Loader2Icon aria-hidden="true" className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">Sauvegarde…</span>
      </span>
    );
  }
  if (saveState === "failed") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
        <AlertTriangleIcon aria-hidden="true" className="size-3.5" />
        <span className="hidden sm:inline">Échec</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-hikma-gold/80">
      <CircleAlertIcon aria-hidden="true" className="size-3.5" />
      <span className="hidden sm:inline">Non enregistré</span>
    </span>
  );
}

export function ProjectHeader({
  eyebrow,
  title,
  status,
  renderStatus,
  saveState,
  saveDisabled,
  onSave,
  renderLabel,
  renderVariant = "default",
  renderLoading = false,
  renderDisabled,
  renderTitle,
  onRender,
}: {
  eyebrow: string;
  title: string;
  status: ContentItemStatus;
  renderStatus: RenderStatus;
  saveState: StudioSaveState;
  saveDisabled: boolean;
  onSave: () => void;
  renderLabel: string;
  renderVariant?: "default" | "secondary";
  renderLoading?: boolean;
  renderDisabled: boolean;
  renderTitle?: string;
  onRender: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-white/8 px-3 py-2 sm:px-6"
      style={{
        background: "rgba(9, 14, 12, 0.94)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
        {/* Left: Back + Arabic Word Title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/admin/content-studio" />}
            aria-label="Retour à la bibliothèque"
            className="size-9 shrink-0 rounded-xl text-white/60 hover:bg-white/8 hover:text-white"
          >
            <ChevronLeftIcon className="size-4.5" />
          </Button>

          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span
                dir="rtl"
                className="truncate font-arabic text-xl font-medium leading-none text-hikma-ivory sm:text-2xl"
              >
                {title}
              </span>
              <span className="hidden rounded-md border border-white/10 bg-white/4 px-1.5 py-0.5 font-mono text-[9px] text-white/40 sm:inline-block">
                {eyebrow}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Badges: Desktop */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <StudioStatusBadge status={status} />
          <StudioRenderBadge renderStatus={renderStatus} />
        </div>

        {/* Right: Save state & Quick CTAs */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SaveIndicator saveState={saveState} />

          {/* Quick Save button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={saveDisabled}
            className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-3 text-xs font-semibold text-white/80 hover:bg-white/8 hover:text-white sm:flex"
          >
            <SaveIcon className="size-3.5" />
            <span>Enregistrer</span>
          </Button>

          {/* Render CTA Button */}
          <Button
            type="button"
            variant={renderVariant}
            size="sm"
            onClick={onRender}
            loading={renderLoading}
            disabled={renderDisabled}
            title={renderTitle}
            className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold shadow-[0_0_15px_rgba(59,160,140,0.3)]"
          >
            <PlayIcon className="size-3 fill-current" />
            <span>{renderLabel}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
