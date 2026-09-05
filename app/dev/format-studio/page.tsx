"use client";

// Hikma — Video Format System : DÉMO LOCALE (monte le VRAI VideoEditor).
//
// Parcours : choisir un format éditorial → sélectionner le mot (données
// réelles gelées) → « Générer » → le template produit des scènes + clips
// graphiques STANDARD, montés dans le VideoEditor réel : tout est éditables
// (Canvas, Inspector, Timeline, keyframes, effets) puis rendu MP4 par le
// pipeline existant. Aucun renderer parallèle.

import React, { useMemo, useState } from "react";
import {
  CheckIcon,
  FilmIcon,
  Loader2Icon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";
import { VideoEditor } from "@/components/content-studio/video-editor";
import {
  FORMAT_CATEGORIES,
  VIDEO_FORMATS,
  getVideoFormat,
} from "@/lib/content-studio/formats/format-registry";
import type {
  FormatCategory,
  FormatTemplateOutput,
  VideoFormatId,
} from "@/lib/content-studio/formats/format-types";
import { generateFormatTemplate } from "@/lib/content-studio/formats/format-template-engine";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";
import { SPEED_VOCAB_FIXTURE } from "@/lib/content-studio/video/speed-vocab-fixtures";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  READY: "Prêt",
  BETA: "Bêta",
  COMING_SOON: "Bientôt",
};

export default function FormatStudioDemoPage() {
  const [selectedId, setSelectedId] = useState<VideoFormatId | null>(null);
  const [category, setCategory] = useState<"TOUS" | FormatCategory>("TOUS");
  const [generated, setGenerated] = useState<FormatTemplateOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      VIDEO_FORMATS.filter((f) =>
        category === "TOUS" ? true : f.category === category,
      ),
    [category],
  );

  const selected = selectedId ? getVideoFormat(selectedId) : null;

  const handleGenerate = () => {
    if (!selected || !selected.createTemplate) return;
    setGenerating(true);
    setError(null);
    // Synthétique mais DÉTERMINISTE : la génération se fait au clic (aucun
    // rendu MP4 automatique — règle du Content Studio). Fixture réel par
    // format : données gelées issues de la DB Hikma (jamais inventées).
    try {
      const payloadByFormat: Partial<Record<string, unknown>> = {
        WORD_REVEAL: REVEAL_FIXTURE_YAWMA,
        AYAH_IMMERSION: REVEAL_FIXTURE_YAWMA,
        SPEED_VOCAB: SPEED_VOCAB_FIXTURE,
      };
      const payload = payloadByFormat[selected.id] ?? REVEAL_FIXTURE_YAWMA;
      const out = generateFormatTemplate(selected.id, { payload });
      setGenerated(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setGenerated(null);
    setSelectedId(null);
    setError(null);
  };

  // ── Éditeur monté avec le format généré ────────────────────────────────
  if (generated) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#060908]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white/60 hover:border-hikma-gold/50 hover:text-hikma-gold"
            >
              ← Changer de format
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-hikma-teal-400">
              Format · {generated.format}
            </span>
          </div>
          <span className="font-mono text-[10px] text-white/40">
            {generated.scenes.length} scènes · {generated.graphics.length} clips
            graphiques · {Math.round(generated.durationInFrames / 30)}s
          </span>
        </div>
        <VideoEditor
          contentKey={`format-${generated.format}-${generated.metadata.wordId}`}
          templateKey={generated.templateKey}
          title={`Format ${selected?.name ?? generated.format}`}
          fps={generated.fps}
          width={generated.width}
          height={generated.height}
          initialScenes={generated.scenes}
          initialGraphics={[...generated.graphics]}
          status="DRAFT"
          renderStatus="NOT_RENDERED"
          renderPath={null}
          hasEdits={false}
        />
      </div>
    );
  }

  // ── Sélecteur de format ────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#060908] px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-hikma-teal-600/20 text-hikma-teal-400">
            <FilmIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-white">Hikma Video Factory</h1>
            <p className="text-xs text-white/50">
              Formats éditoriaux TikTok · Reels · Shorts — générés en clips
              standards du Content Studio, entièrement modifiables
            </p>
          </div>
        </div>

        {/* Catégories */}
        <div className="mb-4 flex items-center gap-1">
          {FORMAT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all",
                category === cat
                  ? "border border-hikma-teal-500/40 bg-hikma-teal-600/30 text-hikma-teal-300"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille des formats */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((format) => {
            const isSelected = selectedId === format.id;
            const usable = format.status !== "COMING_SOON";
            return (
              <button
                key={format.id}
                type="button"
                disabled={!usable}
                onClick={() => setSelectedId(format.id)}
                className={cn(
                  "relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all",
                  isSelected
                    ? "border-hikma-gold/70 bg-gradient-to-br from-amber-950/40 to-black/60 shadow-[0_0_18px_rgba(245,212,122,0.2)] ring-1 ring-hikma-gold/60"
                    : usable
                      ? "border-white/10 bg-white/4 hover:border-hikma-teal-500/40 hover:bg-white/7"
                      : "border-white/5 bg-black/20 opacity-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-white">
                        {format.name}
                      </span>
                      {isSelected && <CheckIcon className="size-3.5 text-hikma-gold" />}
                    </div>
                    <span className="block truncate text-[10px] text-white/50">
                      {format.subtitle}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                      format.status === "READY"
                        ? "border border-hikma-teal-500/30 bg-hikma-teal-500/20 text-hikma-teal-300"
                        : "border border-white/10 bg-white/5 text-white/40",
                    )}
                  >
                    {STATUS_LABEL[format.status]}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-white/40">
                  {format.description}
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-1.5 font-mono text-[9px] text-white/40">
                  <span>{format.recommendedDuration}</span>
                  <span>{format.platforms.join(" · ")}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panneau de configuration du format sélectionné */}
        {selected && (
          <div className="mt-6 rounded-2xl border border-hikma-gold/30 bg-black/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <SparklesIcon className="size-4 text-hikma-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-hikma-gold">
                {selected.name} — configurer
              </span>
            </div>

            {selected.id === "WORD_REVEAL" ||
            selected.id === "AYAH_IMMERSION" ||
            selected.id === "SPEED_VOCAB" ? (
              <>
                <p className="mb-3 text-[11px] text-white/50">
                  Choisir un mot du Coran — les données proviennent de la base
                  réelle Hikma (aucune donnée inventée).
                </p>
                <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    {selected.id === "SPEED_VOCAB" ? (
                      <>
                        <span dir="rtl" className="font-arabic text-2xl text-hikma-gold">
                          {SPEED_VOCAB_FIXTURE.words.map((w) => w.arabic).join(" ")}
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-white">
                            {SPEED_VOCAB_FIXTURE.words.length} mots réels — sélection déterministe
                          </span>
                          <span className="block font-mono text-[10px] text-white/40">
                            {SPEED_VOCAB_FIXTURE.words
                              .map((w) => `${w.arabic} (${w.occurrenceCount})`)
                              .join(" · ")}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span dir="rtl" className="font-arabic text-2xl text-hikma-gold">
                          {REVEAL_FIXTURE_YAWMA.word.arabic}
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-white">
                            {REVEAL_FIXTURE_YAWMA.meaning.text}
                          </span>
                          <span className="block font-mono text-[10px] text-white/40">
                            {REVEAL_FIXTURE_YAWMA.word.transliteration} ·{" "}
                            {REVEAL_FIXTURE_YAWMA.occurrenceCount} occurrences · Sourate{" "}
                            {REVEAL_FIXTURE_YAWMA.firstOccurrence.surahName} v{" "}
                            {REVEAL_FIXTURE_YAWMA.firstOccurrence.ayahNumber}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 rounded-xl bg-hikma-gold px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-60"
                  >
                    {generating ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Wand2Icon className="size-4" />
                    )}
                    {generating ? "Génération…" : "Générer le format"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-white/40">
                {selected.status === "COMING_SOON"
                  ? "Format modélisé — génération activée dans un prochain lot."
                  : "Le moteur existe ; le flux de génération de ce format arrive dans le prochain lot."}
              </p>
            )}

            {error && (
              <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-[11px] text-rose-300">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
