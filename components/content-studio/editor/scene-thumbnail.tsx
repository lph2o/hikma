"use client";

// Hikma — Content Studio (UI2.5) : MINIATURE DÉTERMINISTE DE SCÈNE.
//
// Représentation visuelle légère par SVG/CSS du contenu réel de la scène :
//   - word    → Mot arabe argenté précieux (font-arabic, overflow: visible)
//   - intro   → Gradient sombre + texte de hook
//   - meaning → Fond ardoise-teal + glose
//   - quran   → Fond vert coranique sombre + extrait Utmani
//   - explanation → Fond violet nuit + texte
//   - cta     → Fond doré profond + CTA
//
// SÉCURITÉ ARABE ABSOLUE : `overflow: visible`, `lineHeight: 1.5`, jamais rogné.

import React from "react";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<
  string,
  { bg: string; text: string; label: string; accent: string }
> = {
  intro: {
    bg: "radial-gradient(ellipse at 50% 0%, #173832 0%, #0a1714 100%)",
    text: "#c4e5dc",
    label: "Intro",
    accent: "#3d9e8a",
  },
  word: {
    bg: "radial-gradient(ellipse at 50% 30%, #2a2210 0%, #0d0b06 100%)",
    text: "#e8dfc8",
    label: "Mot Arabe",
    accent: "#c9a84c",
  },
  meaning: {
    bg: "radial-gradient(ellipse at 50% 0%, #15272e 0%, #0a1114 100%)",
    text: "#b8d8e0",
    label: "Sens",
    accent: "#4a94a8",
  },
  quran: {
    bg: "radial-gradient(ellipse at 50% 0%, #14291c 0%, #09120d 100%)",
    text: "#b8e0c0",
    label: "Coran",
    accent: "#3d8c56",
  },
  explanation: {
    bg: "radial-gradient(ellipse at 50% 0%, #1e1a2b 0%, #0c0a12 100%)",
    text: "#d0c8e8",
    label: "Explication",
    accent: "#7a70b8",
  },
  cta: {
    bg: "radial-gradient(ellipse at 50% 0%, #2b1f0a 0%, #120d04 100%)",
    text: "#e8d088",
    label: "CTA",
    accent: "#c9a84c",
  },
};

const FALLBACK_STYLE = KIND_STYLE.intro;

export function SceneThumbnail({
  scene,
  size = "md",
}: {
  scene: VideoScene;
  size?: "sm" | "md" | "lg";
}) {
  const style = KIND_STYLE[scene.kind] ?? FALLBACK_STYLE;

  const wrapperCls = cn(
    "relative flex aspect-[9/16] w-full flex-col justify-between rounded-lg overflow-hidden shrink-0 select-none",
    size === "sm" && "max-w-[42px] p-1",
    size === "md" && "max-w-[68px] p-1.5",
    size === "lg" && "max-w-[96px] p-2",
  );

  const isWord = scene.kind === "word";
  const isQuran = scene.kind === "quran";
  const arabicText = scene.arabic;
  const mainText = scene.text;

  return (
    <div className={wrapperCls} style={{ background: style.bg }}>
      {/* Top kind pill */}
      <div className="flex w-full justify-center">
        <span
          className="rounded border border-white/10 bg-black/40 px-1 font-mono uppercase tracking-wider text-white/50"
          style={{ fontSize: size === "sm" ? 5 : size === "md" ? 7 : 8 }}
        >
          {style.label}
        </span>
      </div>

      {/* Center content preview */}
      <div className="my-auto flex w-full items-center justify-center overflow-visible py-1">
        {arabicText && (isWord || isQuran) ? (
          <span
            dir="rtl"
            style={{
              fontFamily: "var(--font-amiri)",
              fontSize: size === "sm" ? 10 : size === "md" ? 14 : 20,
              lineHeight: 1.5,
              color: isWord ? "#f0e8d4" : style.text,
              display: "block",
              textAlign: "center",
              overflow: "visible",
              maxWidth: "100%",
              textShadow: isWord
                ? "0 1px 4px rgba(201,168,76,0.4)"
                : "0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            {arabicText.length > 9 ? arabicText.slice(0, 7) + "…" : arabicText}
          </span>
        ) : mainText ? (
          <span
            style={{
              fontSize: size === "sm" ? 6 : size === "md" ? 8 : 10,
              lineHeight: 1.3,
              color: style.text,
              display: "block",
              textAlign: "center",
              overflow: "hidden",
              maxWidth: "100%",
              maxHeight: "70%",
            }}
          >
            {mainText.slice(0, size === "sm" ? 14 : 32)}
          </span>
        ) : (
          <span
            style={{
              fontSize: size === "sm" ? 7 : 9,
              color: style.accent,
              fontWeight: 700,
            }}
          >
            {style.label}
          </span>
        )}
      </div>

      {/* Bottom duration gauge indicator */}
      <div className="h-0.5 w-full rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: "70%", background: style.accent }}
        />
      </div>
    </div>
  );
}
