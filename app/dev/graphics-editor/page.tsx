// Hikma — PREVIEW DÉMO LOCALE de l'éditeur graphique (sans auth Supabase).
//
// Monte le VRAI VideoEditor avec des scènes + clips graphiques pré-remplis
// pour vérifier l'édition visuelle (sélection, drag, resize, rotation,
// animations, timeline G1) sans passer par le login admin.
// NE FAIT RIEN en production : fichier de dev local, jamais référencé.

import React from "react";
import { VideoEditor } from "@/components/content-studio/video-editor";
import { createTextGraphicClip, buildTextAnimation } from "@/lib/content-studio/graphics/text-graphic";
import { createShapeGraphicClip } from "@/lib/content-studio/graphics/shape-graphic";

const scenes = [
  {
    kind: "word" as const,
    durationInFrames: 90,
    arabic: "يَوْمَ",
    transliteration: "yawma",
  },
  {
    kind: "meaning" as const,
    durationInFrames: 90,
    text: "le Jour",
    subtext: "Période lumineuse",
  },
  {
    kind: "cta" as const,
    durationInFrames: 60,
    text: "Apprends un mot coranique à la fois.",
  },
];

const graphics = [
  createTextGraphicClip({
    id: "demo-text-fr",
    text: "Hikma Studio",
    startFrame: 0,
    durationInFrames: 240,
    zIndex: 3,
    transform: { x: 0.5, y: 0.18, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    style: { fontSize: 44, color: "#ffffff", fontFamily: "Poppins, sans-serif" },
    animation: buildTextAnimation("fade", { inDurationFrames: 15, outDurationFrames: 0 }),
  }),
  createTextGraphicClip({
    id: "demo-text-ar",
    text: "يَوْمَ",
    startFrame: 0,
    durationInFrames: 240,
    zIndex: 4,
    direction: "rtl",
    transform: { x: 0.5, y: 0.78, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    style: {
      fontSize: 84,
      color: "#f5d47a",
      fontFamily: "Amiri, serif",
      textAlign: "center",
      strokeColor: "#0a0f0d",
      strokeWidth: 2,
      glowColor: "#f5d47a",
      glowRadius: 22,
      glowOpacity: 0.85,
      shadowColor: "#000000",
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 5,
    },
    animation: buildTextAnimation("typewriter", { inDurationFrames: 30, outDurationFrames: 0 }),
  }),
  createShapeGraphicClip({
    id: "demo-shape-star",
    shape: "star",
    sides: 5,
    startFrame: 0,
    durationInFrames: 240,
    zIndex: 2,
    thickness: 0.12,
    fill: { type: "solid", color: "#c9a84c" },
    glow: { color: "#f5d47a", opacity: 0.9, radius: 18 },
    shadow: { color: "#000000", opacity: 0.5, offsetX: 3, offsetY: 5, blur: 6 },
    transform: { x: 0.84, y: 0.14, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.9 },
  }),
  createShapeGraphicClip({
    id: "demo-shape-rect",
    shape: "rectangle",
    startFrame: 30,
    durationInFrames: 120,
    zIndex: 1,
    thickness: 0.28,
    fill: { type: "solid", color: "#14b8a6" },
    transform: { x: 0.22, y: 0.62, scaleX: 1, scaleY: 1, rotation: 12, opacity: 0.5 },
  }),
  createShapeGraphicClip({
    id: "demo-shape-circle",
    shape: "circle",
    startFrame: 0,
    durationInFrames: 240,
    zIndex: 3,
    thickness: 0.2,
    fill: { type: "solid", color: "#e8c04c" },
    transform: { x: 0.68, y: 0.3, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.85 },
  }),
];

export default function DemoPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#060908]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-hikma-teal-400">
          Démo locale · éditeur graphique
        </span>
        <span className="font-mono text-[10px] text-white/40">
          Sélection / Drag / Resize / Rotation / Timeline G1
        </span>
      </div>
      <VideoEditor
        contentKey="demo-local-editor"
        templateKey="WORD_REVEAL_V1"
        title="Démo éditeur"
        fps={30}
        width={1080}
        height={1920}
        initialScenes={scenes}
        initialGraphics={graphics}
        status="DRAFT"
        renderStatus="NOT_RENDERED"
        renderPath={null}
        hasEdits={false}
      />
    </div>
  );
}
